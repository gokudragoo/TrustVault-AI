import fs from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { Binary, MongoClient, type Collection, type Db, type WithId } from "mongodb";
import { config } from "../config.js";
import { encryptBuffer } from "./crypto.js";
import type { AgentRun, AppSettings, AuditEvent, ShareLink, StoreState, TrustDocument } from "../types.js";

const defaultSettings: AppSettings = {
  notifications: true,
  defaultExpiryHours: 24,
  requireTerminal3ForShares: true,
  redactionStrictness: "strict"
};

const initialState: StoreState = {
  documents: [],
  shares: [],
  auditEvents: [],
  agentRuns: [],
  settings: defaultSettings
};

type SettingsDocument = { _id: "settings"; settings: AppSettings; updatedAt?: Date };
type LegacyStateDocument = { _id: string; state: StoreState; updatedAt?: Date };

export class JsonStore {
  private statePath: string;
  private filesDir: string;
  private ready = false;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;

  constructor(private dataDir = config.dataDir) {
    this.statePath = path.resolve(dataDir, "trustvault.json");
    this.filesDir = path.resolve(dataDir, "files");
  }

  async init() {
    if (this.ready) return;
    if (config.mongodbUri) {
      try {
        this.mongoClient = new MongoClient(config.mongodbUri, { serverSelectionTimeoutMS: 8000 });
        await this.mongoClient.connect();
        this.mongoDb = this.mongoClient.db("trustvault_ai");
        await this.migrateLegacyMongoState();
        await this.settingsCollection().updateOne(
          { _id: "settings" },
          { $setOnInsert: { settings: defaultSettings, updatedAt: new Date() } },
          { upsert: true }
        );
        this.ready = true;
        return;
      } catch (error) {
        this.mongoClient = null;
        this.mongoDb = null;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`MongoDB unavailable, using encrypted local store: ${message.slice(0, 180)}`);
      }
    }
    await fs.mkdir(this.filesDir, { recursive: true });
    try {
      await fs.access(this.statePath);
    } catch {
      await this.writeState(initialState);
    }
    this.ready = true;
  }

  async getState(): Promise<StoreState> {
    await this.init();
    if (this.mongoDb) {
      const [documents, shares, auditEvents, agentRuns, settings] = await Promise.all([
        this.documentsCollection().find().sort({ createdAt: -1 }).toArray(),
        this.sharesCollection().find().sort({ createdAt: -1 }).toArray(),
        this.auditCollection().find().sort({ createdAt: -1 }).limit(500).toArray(),
        this.agentRunsCollection().find().sort({ createdAt: -1 }).limit(500).toArray(),
        this.settingsCollection().findOne({ _id: "settings" })
      ]);
      return {
        documents: documents.map(stripMongo),
        shares: shares.map(stripMongo),
        auditEvents: auditEvents.map(stripMongo),
        agentRuns: agentRuns.map(stripMongo),
        settings: { ...defaultSettings, ...(settings?.settings ?? {}) }
      };
    }
    const raw = await fs.readFile(this.statePath, "utf8");
    const parsed = JSON.parse(raw) as StoreState;
    return {
      ...initialState,
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) }
    };
  }

  async writeState(state: StoreState) {
    if (this.mongoDb) {
      await Promise.all([
        replaceCollection(this.documentsCollection(), state.documents),
        replaceCollection(this.sharesCollection(), state.shares),
        replaceCollection(this.auditCollection(), state.auditEvents),
        replaceCollection(this.agentRunsCollection(), state.agentRuns),
        this.settingsCollection().updateOne(
          { _id: "settings" },
          { $set: { settings: { ...defaultSettings, ...(state.settings ?? {}) }, updatedAt: new Date() } },
          { upsert: true }
        )
      ]);
      return;
    }
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.writeFile(this.statePath, JSON.stringify(state, null, 2));
  }

  async saveEncryptedFile(documentId: string, input: Buffer) {
    const encrypted = encryptBuffer(input);
    if (this.mongoDb) {
      await this.filesCollection().updateOne(
        { _id: documentId },
        { $set: { encrypted: new Binary(encrypted), updatedAt: new Date() } },
        { upsert: true }
      );
      return `mongo:${documentId}`;
    }
    const relativePath = path.join("files", `${documentId}.vault`);
    const target = path.resolve(this.dataDir, relativePath);
    await fs.writeFile(target, encrypted);
    return relativePath.replaceAll("\\", "/");
  }

  async addDocument(document: Omit<TrustDocument, "id" | "createdAt" | "updatedAt" | "encryptedPath">, input: Buffer) {
    const now = new Date().toISOString();
    const id = nanoid();
    const encryptedPath = await this.saveEncryptedFile(id, input);
    const stored: TrustDocument = {
      ...document,
      id,
      encryptedPath,
      createdAt: now,
      updatedAt: now
    };

    if (this.mongoDb) {
      await this.documentsCollection().insertOne(stored);
      return stored;
    }

    const state = await this.getState();
    state.documents.unshift(stored);
    await this.writeState(state);
    return stored;
  }

  async upsertDocument(document: TrustDocument) {
    if (this.mongoDb) {
      await this.documentsCollection().updateOne({ id: document.id }, { $set: document }, { upsert: true });
      return document;
    }
    const state = await this.getState();
    state.documents = state.documents.map((item) => (item.id === document.id ? document : item));
    await this.writeState(state);
    return document;
  }

  async addShare(share: Omit<ShareLink, "id" | "createdAt">) {
    const stored: ShareLink = {
      ...share,
      id: nanoid(),
      createdAt: new Date().toISOString()
    };

    if (this.mongoDb) {
      await this.sharesCollection().insertOne(stored);
      return stored;
    }

    const state = await this.getState();
    state.shares.unshift(stored);
    await this.writeState(state);
    return stored;
  }

  async updateShare(id: string, patch: Partial<ShareLink>) {
    if (this.mongoDb) {
      await this.sharesCollection().updateOne({ id }, { $set: patch });
      const share = await this.sharesCollection().findOne({ id });
      return share ? stripMongo(share) : null;
    }

    const state = await this.getState();
    const share = state.shares.find((item) => item.id === id);
    if (!share) return null;
    Object.assign(share, patch);
    await this.writeState(state);
    return share;
  }

  async addAudit(event: Omit<AuditEvent, "id" | "createdAt">) {
    const stored: AuditEvent = {
      ...event,
      id: nanoid(),
      createdAt: new Date().toISOString()
    };

    if (this.mongoDb) {
      await this.auditCollection().insertOne(stored);
      return stored;
    }

    const state = await this.getState();
    state.auditEvents.unshift(stored);
    await this.writeState(state);
    return stored;
  }

  async addAgentRun(run: Omit<AgentRun, "id" | "createdAt">) {
    const stored: AgentRun = {
      ...run,
      id: nanoid(),
      createdAt: new Date().toISOString()
    };

    if (this.mongoDb) {
      await this.agentRunsCollection().insertOne(stored);
      return stored;
    }

    const state = await this.getState();
    state.agentRuns.unshift(stored);
    await this.writeState(state);
    return stored;
  }

  async updateSettings(settings: Partial<AppSettings>) {
    if (this.mongoDb) {
      const current = await this.settingsCollection().findOne({ _id: "settings" });
      const next = { ...defaultSettings, ...(current?.settings ?? {}), ...settings };
      await this.settingsCollection().updateOne({ _id: "settings" }, { $set: { settings: next, updatedAt: new Date() } }, { upsert: true });
      return next;
    }

    const state = await this.getState();
    state.settings = { ...state.settings, ...settings };
    await this.writeState(state);
    return state.settings;
  }

  storageMode() {
    return this.mongoDb ? "mongodb" : "local-json";
  }

  private async migrateLegacyMongoState() {
    if (!this.mongoDb) return;
    const legacy = await this.legacyStateCollection().findOne({ _id: "trustvault" });
    if (!legacy?.state) return;
    const [documents, shares, auditEvents, agentRuns] = await Promise.all([
      this.documentsCollection().countDocuments(),
      this.sharesCollection().countDocuments(),
      this.auditCollection().countDocuments(),
      this.agentRunsCollection().countDocuments()
    ]);

    await Promise.all([
      documents === 0 && legacy.state.documents.length ? this.documentsCollection().insertMany(legacy.state.documents) : undefined,
      shares === 0 && legacy.state.shares.length ? this.sharesCollection().insertMany(legacy.state.shares) : undefined,
      auditEvents === 0 && legacy.state.auditEvents.length ? this.auditCollection().insertMany(legacy.state.auditEvents) : undefined,
      agentRuns === 0 && legacy.state.agentRuns.length ? this.agentRunsCollection().insertMany(legacy.state.agentRuns) : undefined,
      this.settingsCollection().updateOne(
        { _id: "settings" },
        { $set: { settings: { ...defaultSettings, ...(legacy.state.settings ?? {}) }, updatedAt: new Date() } },
        { upsert: true }
      )
    ]);
  }

  private legacyStateCollection(): Collection<LegacyStateDocument> {
    if (!this.mongoDb) throw new Error("MongoDB is not initialized");
    return this.mongoDb.collection("state");
  }

  private documentsCollection(): Collection<TrustDocument> {
    if (!this.mongoDb) throw new Error("MongoDB is not initialized");
    return this.mongoDb.collection("documents");
  }

  private sharesCollection(): Collection<ShareLink> {
    if (!this.mongoDb) throw new Error("MongoDB is not initialized");
    return this.mongoDb.collection("shares");
  }

  private auditCollection(): Collection<AuditEvent> {
    if (!this.mongoDb) throw new Error("MongoDB is not initialized");
    return this.mongoDb.collection("audit_events");
  }

  private agentRunsCollection(): Collection<AgentRun> {
    if (!this.mongoDb) throw new Error("MongoDB is not initialized");
    return this.mongoDb.collection("agent_runs");
  }

  private settingsCollection(): Collection<SettingsDocument> {
    if (!this.mongoDb) throw new Error("MongoDB is not initialized");
    return this.mongoDb.collection("settings");
  }

  private filesCollection(): Collection<{ _id: string; encrypted: Binary; updatedAt?: Date }> {
    if (!this.mongoDb) throw new Error("MongoDB is not initialized");
    return this.mongoDb.collection("encrypted_files");
  }
}

async function replaceCollection<T extends { id: string }>(collection: Collection<T>, values: T[]) {
  await collection.deleteMany({});
  if (values.length) await collection.insertMany(values as never[]);
}

function stripMongo<T>(value: WithId<T>): T {
  const { _id: _id, ...rest } = value as WithId<T> & { _id: unknown };
  return rest as T;
}

export const store = new JsonStore();
