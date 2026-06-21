import { config } from "../config.js";
import { hashPolicy } from "../lib/crypto.js";
import type { Terminal3Proof } from "../types.js";

export interface Terminal3Status {
  configured: boolean;
  connected: boolean;
  environment: string;
  did?: string;
  expectedDid?: string;
  address?: string;
  usage?: unknown;
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

let cachedStatus: { value: Terminal3Status; expiresAt: number } | null = null;

export async function getTerminal3Status(force = false): Promise<Terminal3Status> {
  if (!force && cachedStatus && cachedStatus.expiresAt > Date.now()) {
    return cachedStatus.value;
  }

  if (!config.terminal3.apiKey) {
    return {
      configured: false,
      connected: false,
      environment: config.terminal3.environment,
      expectedDid: config.terminal3.did
    };
  }

  try {
    const sdk = await import("@terminal3/t3n-sdk");
    sdk.setEnvironment(config.terminal3.environment);
    const wasmComponent = await sdk.loadWasmComponent();
    const address = sdk.eth_get_address(config.terminal3.apiKey);
    const client = new sdk.T3nClient({
      wasmComponent,
      handlers: {
        EthSign: sdk.metamask_sign(address, undefined, config.terminal3.apiKey)
      }
    });

    await client.handshake();
    const did = normalizeDid(await client.authenticate(sdk.createEthAuthInput(address)));
    const usage = typeof client.getUsage === "function" ? await client.getUsage().catch(() => undefined) : undefined;
    const tenant = await getTenantStatus(sdk, client, did);

    const value: Terminal3Status = {
      configured: true,
      connected: true,
      environment: config.terminal3.environment,
      did,
      expectedDid: config.terminal3.did,
      address: maskAddress(address),
      usage,
      tenant
    };
    cachedStatus = { value, expiresAt: Date.now() + 60_000 };
    return value;
  } catch (error) {
    const value: Terminal3Status = {
      configured: true,
      connected: false,
      environment: config.terminal3.environment,
      expectedDid: config.terminal3.did,
      error: sanitizeError(error)
    };
    cachedStatus = { value, expiresAt: Date.now() + 20_000 };
    return value;
  }
}

export async function createTerminal3Proof(input: {
  documentId: string;
  recipient: string;
  role: string;
  allowedFields: string[];
  hiddenFields: string[];
  permittedHosts?: string[];
}): Promise<Terminal3Proof> {
  const status = await getTerminal3Status();
  const tenantDid = status.did ?? status.expectedDid;
  const tenantArtifacts = await getTenantProofArtifacts(tenantDid, {
    documentId: input.documentId,
    recipient: input.recipient,
    role: input.role,
    allowedFields: input.allowedFields,
    hiddenFields: input.hiddenFields
  });
  const outboundPlaceholders = input.allowedFields.map((field) => `{{profile.vault.${input.documentId}.${field}}}`);
  const policyMaterial = {
    documentId: input.documentId,
    recipient: input.recipient,
    role: input.role,
    allowedFields: input.allowedFields,
    hiddenFields: input.hiddenFields,
    terminal3Did: tenantDid,
    tenantNamespace: tenantArtifacts.tenantNamespace,
    permittedHosts: input.permittedHosts ?? ["api.openai.com", "trustvault.local"]
  };
  return {
    policyHash: hashPolicy(policyMaterial),
    controlPayloadHash: tenantArtifacts.controlPayloadHash,
    tenantDid,
    agentDid: tenantDid,
    environment: status.environment,
    sdkConnected: status.connected,
    permittedHosts: input.permittedHosts ?? ["api.openai.com", "trustvault.local"],
    tenantNamespace: tenantArtifacts.tenantNamespace,
    policyMapName: tenantArtifacts.policyMapName,
    secretMapName: tenantArtifacts.secretMapName,
    contract: {
      tenant: tenantDid ?? "did:t3n:pending",
      name: "trustvault-disclosure",
      functionName: "create_selective_disclosure",
      status: status.connected ? "prepared" : "unavailable"
    },
    outboundPlaceholders,
    createdAt: new Date().toISOString()
  };
}

async function getTenantStatus(sdk: Record<string, any>, client: unknown, did?: string): Promise<Terminal3Status["tenant"]> {
  const tenantDid = did ?? config.terminal3.did;
  if (!tenantDid || typeof sdk.TenantClient !== "function") {
    return undefined;
  }

  try {
    const tenant = new sdk.TenantClient({
      environment: config.terminal3.environment,
      baseUrl: typeof sdk.getNodeUrl === "function" ? sdk.getNodeUrl() : undefined,
      t3n: client,
      tenantDid
    });
    let claimResult: unknown;
    try {
      claimResult = await tenant.tenant.claim();
    } catch (error) {
      claimResult = { status: "claim-skipped", reason: sanitizeError(error) };
    }
    const me = await tenant.tenant.me().catch((error: unknown) => ({ error: sanitizeError(error) }));
    const status = isRecord(me) && typeof me.status === "string" ? me.status : undefined;
    const claimStatus = isRecord(claimResult) && typeof claimResult.status === "string" ? claimResult.status : undefined;
    const meError = isRecord(me) && typeof me.error === "string" ? me.error : undefined;
    const claimed = !meError || claimStatus === "admitted" || claimStatus === "already-admitted";
    return {
      claimed,
      status: status ?? claimStatus,
      namespace: tenantDid,
      policyMapName: tenant.canonicalName("trustvault-policies"),
      secretMapName: tenant.canonicalName("secrets"),
      error: claimed ? undefined : meError
    };
  } catch (error) {
    return {
      claimed: false,
      namespace: tenantDid,
      error: sanitizeError(error)
    };
  }
}

async function getTenantProofArtifacts(
  tenantDid: string | undefined,
  policy: Record<string, unknown>
): Promise<{
  tenantNamespace?: string;
  policyMapName?: string;
  secretMapName?: string;
  controlPayloadHash?: string;
}> {
  if (!tenantDid) return {};
  try {
    const sdk = await import("@terminal3/t3n-sdk");
    const policyMapName =
      typeof sdk.canonicalTenantName === "function"
        ? sdk.canonicalTenantName(tenantDid, "trustvault-policies")
        : `z:${tenantDid}:trustvault-policies`;
    const secretMapName =
      typeof sdk.canonicalTenantName === "function" ? sdk.canonicalTenantName(tenantDid, "secrets") : `z:${tenantDid}:secrets`;
    return {
      tenantNamespace: tenantDid,
      policyMapName,
      secretMapName,
      controlPayloadHash: hashPolicy({
        functionName: "map-entry-set",
        map_name: policyMapName,
        key: `policy:${policy.documentId}:${policy.recipient}`,
        value: policy
      })
    };
  } catch {
    return {
      tenantNamespace: tenantDid,
      policyMapName: `z:${tenantDid}:trustvault-policies`,
      secretMapName: `z:${tenantDid}:secrets`,
      controlPayloadHash: hashPolicy(policy)
    };
  }
}

function normalizeDid(value: unknown) {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.value === "string") return value.value;
  return undefined;
}

function maskAddress(address: string) {
  if (address.length < 12) return "connected";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/0x[a-fA-F0-9]{32,}/g, "0x…").slice(0, 240);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
