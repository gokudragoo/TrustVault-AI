export type DocumentCategory = "Medical" | "Finance" | "Education" | "Legal" | "Identity" | "General";

export interface SensitiveField {
  id: string;
  type: string;
  label: string;
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
  textPreview: string;
  summary: string;
  fields: SensitiveField[];
  createdAt: string;
  updatedAt: string;
}

export interface Terminal3Status {
  configured: boolean;
  connected: boolean;
  environment: string;
  did?: string;
  expectedDid?: string;
  address?: string;
  tenant?: {
    claimed: boolean;
    status?: string;
    namespace?: string;
    policyMapName?: string;
    secretMapName?: string;
    error?: string;
  };
  error?: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  terminal3: Terminal3Status;
}

export interface ShareLink {
  id: string;
  documentId: string;
  documentTitle?: string;
  recipient: string;
  role: string;
  allowedFields: string[];
  hiddenFields: string[];
  expiresAt: string;
  status: "active" | "expired" | "revoked";
  url: string;
  maskedText: string;
  terminal3Proof: {
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
  };
  createdAt: string;
  viewedAt?: string;
}

export interface PublicShareLink {
  documentTitle?: string;
  recipient: string;
  role: string;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
  url: string;
  maskedText: string;
  viewedAt?: string;
  terminal3Proof: {
    policyHash: string;
    tenantDid?: string;
    environment: string;
    sdkConnected: boolean;
    permittedHosts: string[];
    createdAt: string;
  };
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
  agent: string;
  action: string;
  status: "success" | "warning" | "error";
  createdAt: string;
  output: Record<string, unknown>;
}

export interface DashboardPayload {
  totals: {
    documents: number;
    activeShares: number;
    protectedFields: number;
    auditEvents: number;
  };
  recentDocuments: TrustDocument[];
  recentAudit: AuditEvent[];
  agentRuns: AgentRun[];
  terminal3: Terminal3Status;
}

export interface AppSettings {
  notifications: boolean;
  defaultExpiryHours: number;
  requireTerminal3ForShares: boolean;
  redactionStrictness: "balanced" | "strict";
}
