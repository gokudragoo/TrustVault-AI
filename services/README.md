# Service Boundaries

- `auth-service`: Terminal3 ADK session checks and DID-backed agent identity.
- `rag-service`: document retrieval and AI answers.
- `permission-service`: allowed/hidden field policy building.
- `storage-service`: AES-256-GCM encrypted document persistence.

The current local implementation is in `backend/src/services` with API routes in `backend/src/routes.ts`.
