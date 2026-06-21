import express from "express";
import multer from "multer";
import { z } from "zod";
import { isProductionReadyConfig } from "./config.js";
import { issueVaultToken, requireAuth, verifyAccessKey } from "./lib/auth.js";
import { createRateLimiter } from "./lib/rate-limit.js";
import { store } from "./lib/store.js";
import { answerWithVaultContext } from "./services/ai.js";
import { extractDocumentText } from "./services/extraction.js";
import {
  categorizeDocument,
  createMaskedDisclosure,
  detectSensitiveFields,
  summarizeDocument,
  textPreview
} from "./services/privacy.js";
import { createTerminal3Proof, getTerminal3Status } from "./services/terminal3.js";
import type { SensitiveField, ShareLink, TrustDocument } from "./types.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

const shareSchema = z.object({
  documentId: z.string().min(1),
  recipient: z.string().min(2),
  role: z.string().min(2),
  allowedFields: z.array(z.string()).default([]),
  hiddenFields: z.array(z.string()).default([]),
  expiryHours: z.number().min(1).max(24 * 30).default(24)
});

const settingsSchema = z.object({
  notifications: z.boolean().optional(),
  defaultExpiryHours: z.number().int().min(1).max(24 * 30).optional(),
  requireTerminal3ForShares: z.boolean().optional(),
  redactionStrictness: z.enum(["balanced", "strict"]).optional()
});

const authLimiter = createRateLimiter({ windowMs: 60_000, max: 8, label: "auth" });
const writeLimiter = createRateLimiter({ windowMs: 60_000, max: 30, label: "write" });
const uploadLimiter = createRateLimiter({ windowMs: 60_000, max: 8, label: "upload" });

export function createRouter() {
  const router = express.Router();

  router.get("/health", async (_req, res) => {
    res.json({
      ok: true,
      name: "TrustVault AI API",
      config: isProductionReadyConfig(),
      storageMode: store.storageMode()
    });
  });

  router.post("/auth/login", authLimiter, async (req, res) => {
    const schema = z.object({ accessKey: z.string().min(8) });
    const { accessKey } = schema.parse(req.body);
    if (!verifyAccessKey(accessKey)) {
      return res.status(401).json({ error: "Invalid vault access key." });
    }
    const session = issueVaultToken();
    const terminal3 = await getTerminal3Status(true);
    await store.addAudit({
      actor: "user",
      action: "Vault owner authenticated",
      resource: "auth",
      status: "allowed",
      terminal3Did: terminal3.did ?? terminal3.expectedDid,
      metadata: { terminal3Connected: terminal3.connected, environment: terminal3.environment }
    });
    res.json({ ...session, terminal3 });
  });

  router.get("/public/shares/:token", async (req, res) => {
    const state = await store.getState();
    const share = state.shares.find((item) => item.url.split("/").pop() === req.params.token);
    if (!share) return res.status(404).json({ error: "Share link not found" });
    const document = state.documents.find((item) => item.id === share.documentId);
    const documentTitle = share.documentTitle ?? document?.title ?? "Selective disclosure";

    if (share.status === "revoked") {
      await store.addAudit({
        actor: "external-viewer",
        action: "Blocked revoked share access",
        resource: share.recipient,
        status: "blocked",
        terminal3Did: share.terminal3Proof.agentDid,
        metadata: { shareId: share.id }
      });
      return res.status(410).json({ error: "This disclosure link has been revoked." });
    }

    if (new Date(share.expiresAt).getTime() < Date.now()) {
      const expired = await store.updateShare(share.id, { status: "expired" });
      await store.addAudit({
        actor: "external-viewer",
        action: "Blocked expired share access",
        resource: share.recipient,
        status: "blocked",
        terminal3Did: share.terminal3Proof.agentDid,
        metadata: { shareId: share.id }
      });
      return res.status(410).json({ error: "This disclosure link has expired.", share: publicShare(expired ?? share, document) });
    }

    const viewedAt = new Date().toISOString();
    const viewed = await store.updateShare(share.id, { viewedAt });
    await store.addAudit({
      actor: "external-viewer",
      action: "Viewed selective disclosure",
      resource: documentTitle,
      status: "allowed",
      terminal3Did: share.terminal3Proof.agentDid,
      metadata: { shareId: share.id, recipient: share.recipient, token: req.params.token }
    });

    res.json(publicShare(viewed ? { ...viewed, documentTitle } : { ...share, documentTitle, viewedAt }, document));
  });

  router.use(requireAuth());

  router.post("/auth/terminal3/session", async (_req, res) => {
    res.json(await getTerminal3Status(true));
  });

  router.get("/dashboard", async (_req, res) => {
    const state = await store.getState();
    const now = Date.now();
    const activeShares = state.shares.filter(
      (share) => share.status === "active" && new Date(share.expiresAt).getTime() > now
    );
    res.json({
      totals: {
        documents: state.documents.length,
        activeShares: activeShares.length,
        protectedFields: state.documents.reduce((sum, document) => sum + document.fields.length, 0),
        auditEvents: state.auditEvents.length
      },
      recentDocuments: state.documents.slice(0, 5).map(safeDocument),
      recentAudit: state.auditEvents.slice(0, 8),
      agentRuns: state.agentRuns.slice(0, 8),
      terminal3: await getTerminal3Status()
    });
  });

  router.get("/documents", async (_req, res) => {
    const state = await store.getState();
    res.json(state.documents.map(safeDocument));
  });

  router.get("/documents/:id", async (req, res) => {
    const state = await store.getState();
    const document = state.documents.find((item) => item.id === req.params.id);
    if (!document) return res.status(404).json({ error: "Document not found" });
    res.json(safeDocument(document));
  });

  router.post("/documents", uploadLimiter, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Missing file" });

    const extractedText = await extractDocumentText(req.file.buffer, req.file.mimetype, req.file.originalname);
    const fields = detectSensitiveFields(extractedText);
    const category = categorizeDocument(req.file.originalname, extractedText);
    const document = await store.addDocument(
      {
        title: String(req.body.title || req.file.originalname.replace(/\.[^.]+$/, "")),
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        category,
        extractedText,
        textPreview: textPreview(extractedText, fields),
        summary: summarizeDocument(extractedText, fields),
        fields
      },
      req.file.buffer
    );

    const proof = await createTerminal3Proof({
      documentId: document.id,
      recipient: "TrustVault AI",
      role: "document-agent",
      allowedFields: [],
      hiddenFields: fields.map((field) => field.id)
    });

    await store.addAgentRun({
      agent: "document-agent",
      action: "OCR and privacy indexing",
      status: "success",
      input: { documentId: document.id, mimeType: document.mimeType },
      output: { category, fields: fields.length },
      terminal3Proof: proof
    });

    await store.addAudit({
      actor: "document-agent",
      action: "Encrypted document indexed",
      resource: document.title,
      status: "allowed",
      terminal3Did: proof.agentDid,
      metadata: { documentId: document.id, category, fields: fields.length }
    });

    res.status(201).json(safeDocument(document));
  });

  router.post("/chat", writeLimiter, async (req, res) => {
    const schema = z.object({ question: z.string().min(2) });
    const { question } = schema.parse(req.body);
    const state = await store.getState();
    const result = await answerWithVaultContext(question, state.documents);

    await store.addAgentRun({
      agent: "summarizer-agent",
      action: "Vault question answered",
      status: "success",
      input: { question },
      output: { sources: result.sources.length, usedOpenAI: result.usedOpenAI }
    });

    await store.addAudit({
      actor: "summarizer-agent",
      action: "Answered vault question",
      resource: "AI Vault Assistant",
      status: "allowed",
      metadata: { question, sources: result.sources.map((source) => source.id), model: result.model }
    });

    res.json(result);
  });

  router.post("/permissions/disclose", writeLimiter, async (req, res) => {
    const input = shareSchema.parse(req.body);
    const state = await store.getState();
    const document = state.documents.find((item) => item.id === input.documentId);
    if (!document) return res.status(404).json({ error: "Document not found" });
    const effectiveAllowedFields = input.allowedFields.filter((id) => document.fields.some((field) => field.id === id));
    const requestedHiddenFields = input.hiddenFields.filter((id) => document.fields.some((field) => field.id === id));
    const effectiveHiddenFields =
      effectiveAllowedFields.length === 0 && requestedHiddenFields.length === 0
        ? document.fields.map((field) => field.id)
        : [...new Set([...requestedHiddenFields, ...document.fields.filter((field) => !effectiveAllowedFields.includes(field.id)).map((field) => field.id)])];

    const proof = await createTerminal3Proof({
      ...input,
      allowedFields: effectiveAllowedFields,
      hiddenFields: effectiveHiddenFields
    });
    if (state.settings.requireTerminal3ForShares && !proof.sdkConnected) {
      await store.addAudit({
        actor: "privacy-agent",
        action: "Blocked disclosure without Terminal3 session",
        resource: document.title,
        status: "blocked",
        terminal3Did: proof.agentDid,
        metadata: { recipient: input.recipient, role: input.role }
      });
      return res.status(409).json({ error: "Terminal3 ADK session is required before creating a share." });
    }

    const expiresAt = new Date(Date.now() + input.expiryHours * 60 * 60 * 1000).toISOString();
    const token = proof.policyHash.slice(0, 18);
    const share = await store.addShare({
      documentId: document.id,
      documentTitle: document.title,
      recipient: input.recipient,
      role: input.role,
      allowedFields: effectiveAllowedFields,
      hiddenFields: effectiveHiddenFields,
      expiresAt,
      status: "active",
      url: `/shared/${token}`,
      maskedText: createMaskedDisclosure(document, effectiveAllowedFields, effectiveHiddenFields),
      terminal3Proof: proof
    });

    await store.addAgentRun({
      agent: "privacy-agent",
      action: "Selective disclosure policy generated",
      status: proof.sdkConnected ? "success" : "warning",
      input: { ...input, allowedFields: effectiveAllowedFields, hiddenFields: effectiveHiddenFields },
      output: { shareId: share.id, policyHash: proof.policyHash },
      terminal3Proof: proof
    });

    await store.addAudit({
      actor: "privacy-agent",
      action: "Created selective disclosure",
      resource: document.title,
      status: proof.sdkConnected ? "allowed" : "pending",
      terminal3Did: proof.agentDid,
      metadata: { shareId: share.id, recipient: share.recipient, expiresAt }
    });

    res.status(201).json(safeShare(share, document));
  });

  router.get("/shares", async (_req, res) => {
    const state = await store.getState();
    const now = Date.now();
    const documentsById = new Map(state.documents.map((document) => [document.id, document]));
    const shares = state.shares.map((share) => {
      if (share.status === "active" && new Date(share.expiresAt).getTime() < now) {
        return safeShare({ ...share, status: "expired" as const }, documentsById.get(share.documentId));
      }
      return safeShare(share, documentsById.get(share.documentId));
    });
    res.json(shares);
  });

  router.post("/shares/:id/revoke", writeLimiter, async (req, res) => {
    const shareId = String(req.params.id);
    const share = await store.updateShare(shareId, { status: "revoked" });
    if (!share) return res.status(404).json({ error: "Share not found" });
    const state = await store.getState();
    const document = state.documents.find((item) => item.id === share.documentId);
    await store.addAudit({
      actor: "user",
      action: "Revoked share link",
      resource: share.recipient,
      status: "allowed",
      terminal3Did: share.terminal3Proof.agentDid,
      metadata: { shareId: share.id }
    });
    res.json(safeShare(share, document));
  });

  router.get("/audit", async (_req, res) => {
    const state = await store.getState();
    res.json(state.auditEvents);
  });

  router.get("/agents", async (_req, res) => {
    const state = await store.getState();
    res.json(state.agentRuns);
  });

  router.get("/settings", async (_req, res) => {
    const state = await store.getState();
    res.json(state.settings);
  });

  router.patch("/settings", async (req, res) => {
    const input = settingsSchema.parse(req.body);
    const settings = await store.updateSettings(input);
    await store.addAudit({
      actor: "user",
      action: "Updated settings",
      resource: "settings",
      status: "allowed",
      metadata: { ...settings }
    });
    res.json(settings);
  });

  return router;
}

function safeDocument(document: TrustDocument) {
  const sourceText = document.extractedText || document.textPreview || document.summary;

  return {
    id: document.id,
    title: document.title,
    fileName: document.fileName,
    mimeType: document.mimeType,
    size: document.size,
    category: document.category,
    encryptedPath: document.encryptedPath,
    textPreview: textPreview(sourceText, document.fields),
    summary: summarizeDocument(sourceText, document.fields),
    fields: document.fields.map(safeField),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

function safeField(field: SensitiveField) {
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    confidence: field.confidence,
    redactedValue: field.redactedValue
  };
}

function safeShare(share: ShareLink, document?: TrustDocument) {
  if (!document) return share;
  const allowedFields = share.allowedFields.filter((id) => document.fields.some((field) => field.id === id));
  const requestedHiddenFields = share.hiddenFields.filter((id) => document.fields.some((field) => field.id === id));
  const hiddenFields =
    allowedFields.length === 0 && requestedHiddenFields.length === 0
      ? document.fields.map((field) => field.id)
      : [...new Set([...requestedHiddenFields, ...document.fields.filter((field) => !allowedFields.includes(field.id)).map((field) => field.id)])];

  return {
    ...share,
    allowedFields,
    hiddenFields,
    maskedText: createMaskedDisclosure(document, allowedFields, hiddenFields)
  };
}

function publicShare(share: ShareLink, document?: TrustDocument) {
  const safe = safeShare(share, document);
  return {
    documentTitle: safe.documentTitle,
    recipient: safe.recipient,
    role: safe.role,
    expiresAt: safe.expiresAt,
    status: safe.status,
    url: safe.url,
    maskedText: safe.maskedText,
    viewedAt: safe.viewedAt,
    terminal3Proof: {
      policyHash: safe.terminal3Proof.policyHash,
      tenantDid: safe.terminal3Proof.tenantDid,
      environment: safe.terminal3Proof.environment,
      sdkConnected: safe.terminal3Proof.sdkConnected,
      permittedHosts: safe.terminal3Proof.permittedHosts,
      createdAt: safe.terminal3Proof.createdAt
    }
  };
}
