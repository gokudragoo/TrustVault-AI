# TrustVault AI Agents

The app keeps the agent responsibilities separate:

- `document-agent`: extracts text, classifies documents, and writes encrypted vault records.
- `privacy-agent`: detects protected fields and builds selective disclosure policies.
- `sharing-agent`: creates expiring share links and revocation records.
- `audit-agent`: records every access and policy mutation.
- `summarizer-agent`: answers vault questions with redacted context.

The runnable implementation lives in `backend/src/routes.ts` and `backend/src/services/*`. This folder documents the multi-agent boundary for judging and future expansion.
