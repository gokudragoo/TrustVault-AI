# TrustVault AI

TrustVault AI is a privacy-first AI document vault for sensitive personal and professional records such as Aadhaar/PAN documents, income certificates, passports, medical reports, degree certificates, contracts, and bank statements.

The app lets an owner upload private documents, ask AI questions over redacted vault context, create recipient-specific selective disclosures, and audit every protected action. It is built for the Terminal3 Agent Auth SDK challenge: protected actions carry a Terminal3-backed DID, tenant metadata, policy hash, control payload hash, allowed-host intent, and disclosure contract intent.

## What It Does

- Stores uploaded files as AES-256-GCM encrypted blobs.
- Extracts text from PDFs, text files, and images.
- Detects sensitive fields such as Aadhaar, PAN, passport, address, income, email, phone, DOB, medical data, and bank account data.
- Answers questions with OpenAI Responses API using redacted vault context, with a local privacy fallback if the model is unavailable.
- Builds selective disclosure packages where the owner chooses allowed and hidden fields.
- Creates expiring public share links that show only the masked package.
- Supports revocation and records public views, blocked expired views, and blocked revoked views.
- Provides audit logs and agent-run history for document, privacy, sharing, audit, and summarizer agents.

## How It Works

1. The owner opens `/login` and unlocks the vault with `VAULT_ACCESS_KEY`.
2. The backend returns a signed owner session token. OpenAI, MongoDB, Terminal3, and Cloudinary secrets stay server-side.
3. The backend checks Terminal3 ADK/T3N, authenticates the sandbox key, resolves the active `did:t3n`, and reads/claims the tenant.
4. The owner uploads documents from `/upload`.
5. The backend encrypts the file, extracts text, classifies the document, and detects protected fields.
6. `/assistant` answers questions using redacted context only.
7. `/permissions` creates a recipient policy, Terminal3 proof envelope, and expiring `/shared/:token` URL.
8. External viewers can open only the public disclosure URL. They cannot access owner vault APIs.
9. `/audit` records uploads, AI answers, disclosures, views, revocations, expired-link blocks, and auth events.

## Security Model

- Owner APIs require a bearer token issued by `/api/auth/login`.
- Public routes are limited to `/api/health`, `/api/auth/login`, and `/api/public/shares/:token`.
- CORS is restricted to exact configured origins through `FRONTEND_ORIGIN`, `APP_BASE_URL`, and `ALLOWED_ORIGINS`.
- Backend and frontend emit production security headers including CSP, frame denial, no-sniff, referrer policy, and permissions policy.
- State-changing routes are rate limited.
- Settings updates are schema validated.
- Public share responses use a minimal DTO and do not expose owner field IDs, document IDs, allowed/hidden arrays, raw extracted text, or field values.
- MongoDB persistence uses separate collections for documents, shares, audit events, agent runs, settings, and encrypted files instead of a single growing state document.

## Terminal3 SDK Integration

The backend integrates `@terminal3/t3n-sdk` in `backend/src/services/terminal3.ts`.

Implemented ADK/T3N path:

1. `setEnvironment("testnet")` selects the sandbox network.
2. `loadWasmComponent()` loads SDK crypto support.
3. `eth_get_address()` and `metamask_sign()` derive/sign the sandbox key challenge without exposing the key.
4. `T3nClient.handshake()` opens the encrypted TEE session.
5. `authenticate(createEthAuthInput(address))` resolves the active `did:t3n`.
6. `TenantClient` uses the authenticated session and SDK-selected node URL to claim/read the tenant.
7. The app derives canonical tenant map names such as `z:<tenant>:trustvault-policies` and `z:<tenant>:secrets`.
8. Every disclosure stores a proof envelope with `policyHash`, `controlPayloadHash`, tenant DID, agent DID, environment, SDK connection state, permitted hosts, placeholder references, and a prepared `trustvault-disclosure.create_selective_disclosure` contract intent.

Verify the live SDK path:

```bash
npm run t3:check
```

Safe output includes configured/connected status, environment, DID, masked wallet address, active tenant status, and canonical map names. It never prints the Terminal3 API key.

## App Structure

```text
frontend/          Next.js app with separated routes and reusable UI
backend/           Express API, encryption, auth, AI, Terminal3, OCR, shares
agents/            Multi-agent responsibility notes
services/          Service boundary notes
terminal3-sdk/     Terminal3 integration notes
render.yaml        Render backend blueprint
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

Frontend: `http://localhost:3000`

Backend health: `http://localhost:4000/api/health`

Login uses the value of `VAULT_ACCESS_KEY` from your local `.env`.

## Judge Demo Access

Production app:

- `https://trustvault-ai-tau.vercel.app`
- Dashboard after login: `https://trustvault-ai-tau.vercel.app/dashboard`

Demo vault access key for hackathon judging:

```text
0lqP5JWJ5K4yqSUKjOLUpWBtzCn985yXX03D4sBG2M8
```

Judge testing flow:

1. Open `https://trustvault-ai-tau.vercel.app`.
2. Paste the demo vault access key into the `Vault access key` field.
3. Click `Unlock vault`.
4. Confirm Terminal3 shows as connected and the active DID is loaded.
5. Continue to the dashboard.
6. Upload a test document from `/upload`.
7. Create a selective disclosure from `/permissions`.
8. Open the generated share link in an incognito/private browser window.
9. Confirm public viewers only see allowed fields, while hidden sensitive fields remain redacted.
10. Revoke the share and confirm the public link no longer works.

This key is included only for demo judging. Rotate `VAULT_ACCESS_KEY` before using the app for real production data.

## Environment Variables

Use `.env` locally and provider environment settings in production. Do not commit real secrets.

Required:

- `ENCRYPTION_MASTER_KEY`
- `VAULT_ACCESS_KEY`
- `AUTH_TOKEN_TTL_HOURS`
- `FRONTEND_ORIGIN`
- `APP_BASE_URL`
- `ALLOWED_ORIGINS`
- `T3N_ENVIRONMENT`
- `T3N_API_KEY`
- `T3N_DID`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_API_BASE_URL`

Recommended for production:

- `MONGODB_URI`

Optional media variables reserved for future file/media hosting:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Verification Commands

```bash
npm run lint --workspace frontend
npm run typecheck
npm run build
npm run seed
npm run t3:check
npm audit --omit=dev
```

Expected current status:

- Terminal3 testnet session connects.
- Terminal3 tenant reports active and returns canonical policy/secrets map names.
- Backend and frontend typecheck pass.
- Frontend lint passes.
- Production build passes.
- Owner APIs reject unauthenticated requests.
- Public share links work without exposing owner-only metadata.

## Deployment

### Backend on Render

`render.yaml` defines the backend web service.

Set these Render environment variables:

- `FRONTEND_ORIGIN=https://trustvault-ai-tau.vercel.app`
- `APP_BASE_URL=https://trustvault-ai-tau.vercel.app`
- `ALLOWED_ORIGINS=https://trustvault-ai-tau.vercel.app`
- `ENCRYPTION_MASTER_KEY`
- `VAULT_ACCESS_KEY`
- `AUTH_TOKEN_TTL_HOURS=12`
- `T3N_ENVIRONMENT=testnet`
- `T3N_API_KEY`
- `T3N_DID`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `MONGODB_URI`

Render free web services have ephemeral storage. Use MongoDB in production rather than relying on the local JSON fallback.

### Frontend on Vercel

Set this Vercel environment variable:

- `NEXT_PUBLIC_API_BASE_URL=https://trustvault-ai-api.onrender.com`

Deploy from `frontend/`:

```bash
cd frontend
vercel --prod
```

## Known Dependency Note

`npm audit --omit=dev` may report a moderate advisory through Next's nested PostCSS dependency. The npm-suggested fix is a major downgrade to an old Next version, so do not apply it blindly. Upgrade Next when an upstream patched release is available.

## Terminal3 Docs Used

- https://docs.terminal3.io/developers/adk/overview/what-is-adk
- https://docs.terminal3.io/developers/adk/tips/create-kv-maps
- https://docs.terminal3.io/developers/adk/tips/seed-api-key
- https://docs.terminal3.io/developers/adk/tips/placeholders-outbound-calls
- https://docs.terminal3.io/t3n/overview/what-is-t3n
- https://docs.terminal3.io/intro/platform
- https://www.terminal3.io/products/agent-developer-kit

## Key Rotation

Rotate any key pasted into chat before using this outside a hackathon/demo environment. Keep `OPENAI_API_KEY`, `T3N_API_KEY`, `MONGODB_URI`, `ENCRYPTION_MASTER_KEY`, and `VAULT_ACCESS_KEY` out of Git.
