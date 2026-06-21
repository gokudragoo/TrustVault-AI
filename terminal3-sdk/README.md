# Terminal3 ADK Integration

TrustVault AI uses `@terminal3/t3n-sdk` in the backend service so secrets never need to enter the browser.

Implemented integration points:

1. `setEnvironment("testnet")` selects the T3N sandbox environment.
2. `loadWasmComponent()` initializes the SDK crypto component.
3. `eth_get_address()` and `metamask_sign()` derive and sign the authenticated session challenge from the sandbox key.
4. `T3nClient.handshake()` opens the encrypted TEE session.
5. `authenticate(createEthAuthInput(address))` reads the active `did:t3n` identity from the authenticated session.
6. `TenantClient` uses the authenticated session plus the SDK-selected node URL to claim/read the tenant record.
7. The app derives canonical private tenant map names for `trustvault-policies` and `secrets`.
8. TrustVault disclosure policies store a Terminal3 proof envelope with DID, environment, permitted hosts, placeholder references, policy hash, control-payload hash, canonical map names, and prepared contract intent.

Run:

```bash
npm run t3:check
```

The app keeps working in local demo mode if the sandbox node or key is unavailable. If `requireTerminal3ForShares` is enabled in settings, disclosure creation is blocked until the SDK session connects.
