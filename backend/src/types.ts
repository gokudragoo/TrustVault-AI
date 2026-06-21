export type DocumentCategory = "Medical" | "Finance" | "Education" | "Legal" | "Identity" | "General";

export type SensitiveFieldType =
  | "aadhaar"
  | "pan"
  | "passport"
  | "address"
  | "income"
  | "email"
  | "phone"
  | "dob"
  | "medical"
  | "account";

export interface SensitiveField {
  id: string;
  type: SensitiveFieldType;
  label: string;
  value: string;
  confidence: number;
  redactedValue: string;
}

export interface TrustDocument {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  encryptedPath: string;
  textPreview: string;
  extractedText: string;
  summary: string;
  fields: SensitiveField[];
  createdAt: string;
  updatedAt: string;
}

export interface Terminal3Proof {
  policyHash: string;
  controlPayloadHash?: string;
  tenantDid?: string;
  agentDid?: string;
  environment: string;
  sdkConnected: boolean;
  permittedHosts: string[];
  tenantNamespace?: string;
  policyMapName?: string;
  secretMapName?: string;
  contract?: {
    tenant: string;
    name: string;
    functionName: string;
    status: "prepared" | "executed" | "unavailable";
  };
  outboundPlaceholders: string[];
  createdAt: string;
}

export interface ShareLink {
  id: string;
  documentId: string;
  documentTitle: string;
  recipient: string;
  role: string;
  allowedFields: string[];
  hiddenFields: string[];
  expiresAt: string;
  status: "active" | "expired" | "revoked";
  url: string;
  maskedText: string;
  terminal3Proof: Terminal3Proof;
  createdAt: string;
  viewedAt?: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  resource: string;
  status: "allowed" | "blocked" | "pending";
  terminal3Did?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AgentRun {
  id: string;
  agent: "document-agent" | "privacy-agent" | "sharing-agent" | "audit-agent" | "summarizer-agent";
  action: string;
  status: "success" | "warning" | "error";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  terminal3Proof?: Terminal3Proof;
  createdAt: string;
}

export interface AppSettings {
  notifications: boolean;
  defaultExpiryHours: number;
  requireTerminal3ForShares: boolean;
  redactionStrictness: "balanced" | "strict";
}

export interface StoreState {
  documents: TrustDocument[];
  shares: ShareLink[];
  auditEvents: AuditEvent[];
  agentRuns: AgentRun[];
  settings: AppSettings;
}
