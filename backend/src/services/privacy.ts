import { nanoid } from "nanoid";
import type { DocumentCategory, SensitiveField, SensitiveFieldType, TrustDocument } from "../types.js";

const patterns: Array<{ type: SensitiveFieldType; label: string; regex: RegExp; confidence: number }> = [
  { type: "aadhaar", label: "Aadhaar Number", regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, confidence: 0.96 },
  { type: "pan", label: "PAN", regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, confidence: 0.94 },
  { type: "passport", label: "Passport Number", regex: /\b[A-Z][0-9]{7}\b/g, confidence: 0.78 },
  { type: "email", label: "Email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, confidence: 0.95 },
  { type: "phone", label: "Phone", regex: /(?:\+91[-\s]?)?\b[6-9]\d{4}[-\s]?\d{5}\b/g, confidence: 0.86 },
  { type: "dob", label: "Date of Birth", regex: /\b(?:DOB|Date of Birth)[:\s-]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/gi, confidence: 0.82 },
  { type: "income", label: "Income", regex: /\b(?:income|salary|annual income|ctc)[:\s-]*(?:INR|Rs\.?|₹)?\s?[\d,.]+(?:\s?(?:lakh|lac|lpa|per annum))?\b/gi, confidence: 0.87 },
  { type: "account", label: "Bank Account", regex: /\b(?:account|acct)[\s#:.-]*(\d{9,18})\b/gi, confidence: 0.8 },
  { type: "medical", label: "Medical Data", regex: /\b(?:hemoglobin|cholesterol|glucose|diagnosis|prescription|blood pressure)[:\t -]*[A-Za-z0-9./\t -]{2,80}\b/gi, confidence: 0.74 },
  { type: "address", label: "Address", regex: /\b(?:address|resident at|residing at)[:\t -]*[A-Za-z0-9,./\t -]{12,120}/gi, confidence: 0.72 }
];

export function detectSensitiveFields(text: string): SensitiveField[] {
  const found = new Map<string, SensitiveField>();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.regex)) {
      const value = (match[1] || match[0]).trim().replace(/\s+/g, " ");
      if (value.length < 3) continue;
      const key = `${pattern.type}:${value.toLowerCase()}`;
      found.set(key, {
        id: nanoid(),
        type: pattern.type,
        label: pattern.label,
        value,
        confidence: pattern.confidence,
        redactedValue: redactValue(value, pattern.type, pattern.label)
      });
    }
  }
  return [...found.values()].slice(0, 24);
}

export function summarizeDocument(text: string, fields: SensitiveField[]) {
  const cleaned = redactTextWithFields(text, fields).replace(/\s+/g, " ").trim();
  const opening = cleaned.slice(0, 220) || "Document indexed and encrypted in the TrustVault.";
  const fieldSummary =
    fields.length > 0
      ? ` Detected ${fields.length} protected field${fields.length === 1 ? "" : "s"}: ${[
          ...new Set(fields.map((field) => field.label))
        ]
          .slice(0, 4)
          .join(", ")}.`
      : " No high-confidence sensitive fields were detected.";
  return `${opening}${fieldSummary}`;
}

export function categorizeDocument(fileName: string, text: string): DocumentCategory {
  const blob = `${fileName} ${text}`.toLowerCase();
  if (/medical|blood|doctor|hospital|prescription|glucose|cholesterol/.test(blob)) return "Medical";
  if (/income|salary|bank|statement|loan|pan|tax|itr/.test(blob)) return "Finance";
  if (/degree|certificate|university|marksheet|education|school/.test(blob)) return "Education";
  if (/contract|agreement|legal|lease|nda|lawyer/.test(blob)) return "Legal";
  if (/aadhaar|passport|pan|identity|address/.test(blob)) return "Identity";
  return "General";
}

export function redactValue(value: string, type?: SensitiveFieldType, label = "Field") {
  if (type === "address" || type === "medical") return `[${label} redacted]`;
  if (type === "income") return "Income verified";
  const visible = value.replace(/\s+/g, "").slice(-4);
  return `•••• ${visible}`;
}

export function createMaskedDisclosure(document: TrustDocument, allowedFields: string[], hiddenFields: string[]) {
  const hidden = new Set(hiddenFields);
  const allowed = new Set(allowedFields);
  const hideAllByDefault = allowed.size === 0 && hidden.size === 0;
  let masked = document.extractedText || document.textPreview;

  for (const field of document.fields) {
    const shouldHide = hideAllByDefault || hidden.has(field.id) || (!allowed.has(field.id) && allowed.size > 0);
    if (shouldHide) {
      masked = masked.split(field.value).join(`[${field.label} redacted]`);
    }
  }
  masked = redactResidualSensitiveText(masked);

  const allowedSummary = document.fields
    .filter((field) => allowed.has(field.id))
    .map((field) => `${field.label}: ${field.value}`)
    .join("\n");

  return [
    "TrustVault AI selective disclosure package",
    "",
    allowedSummary ? `Allowed evidence:\n${allowedSummary}` : "Allowed evidence: document summary only",
    "",
    "Masked document excerpt:",
    masked.slice(0, 1800)
  ].join("\n");
}

export function redactTextWithFields(text: string, fields: SensitiveField[]) {
  const fieldRedacted = [...fields]
    .sort((a, b) => b.value.length - a.value.length)
    .reduce((output, field) => output.split(field.value).join(field.redactedValue), text);
  return redactResidualSensitiveText(fieldRedacted);
}

export function textPreview(text: string, fields: SensitiveField[] = []) {
  return redactTextWithFields(text, fields).replace(/\s+/g, " ").trim().slice(0, 420);
}

function redactResidualSensitiveText(text: string) {
  return [
    { label: "Aadhaar Number", regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g },
    { label: "PAN", regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g },
    { label: "Email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
    { label: "Phone", regex: /(?:\+91[-\s]?)?\b[6-9]\d{4}[-\s]?\d{5}\b/g },
    { label: "Address", regex: /\b(?:address|resident at|residing at)[:\t -]*[A-Za-z0-9,./\t -]{12,120}/gi }
  ].reduce((output, item) => output.replace(item.regex, `[${item.label} redacted]`), text);
}
