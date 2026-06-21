import crypto from "node:crypto";
import type { RequestHandler } from "express";
import { config } from "../config.js";

const TOKEN_VERSION = 1;

interface TokenPayload {
  version: number;
  sub: "vault-owner";
  iat: number;
  exp: number;
  nonce: string;
}

export function verifyAccessKey(input: string) {
  if (!config.vaultAccessKey) return false;
  const expected = digest(config.vaultAccessKey);
  const actual = digest(input);
  return crypto.timingSafeEqual(expected, actual);
}

export function issueVaultToken() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + Math.max(1, config.authTokenTtlHours) * 60 * 60;
  const payload: TokenPayload = {
    version: TOKEN_VERSION,
    sub: "vault-owner",
    iat: issuedAt,
    exp: expiresAt,
    nonce: crypto.randomBytes(16).toString("hex")
  };
  const encoded = base64Url(JSON.stringify(payload));
  return {
    token: `${encoded}.${sign(encoded)}`,
    expiresAt: new Date(expiresAt * 1000).toISOString()
  };
}

export function requireAuth(): RequestHandler {
  return (req, res, next) => {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
    if (!token || !verifyVaultToken(token)) {
      return res.status(401).json({ error: "Vault authentication required." });
    }
    return next();
  };
}

function verifyVaultToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  const expected = sign(encoded);
  if (!safeEqual(signature, expected)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
    return payload.version === TOKEN_VERSION && payload.sub === "vault-owner" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function sign(value: string) {
  return crypto.createHmac("sha256", tokenSecret()).update(value).digest("base64url");
}

function tokenSecret() {
  return crypto.createHash("sha256").update(`${config.encryptionMasterKey}:${config.vaultAccessKey ?? "missing-vault-key"}`).digest();
}

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest();
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
