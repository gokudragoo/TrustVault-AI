import "../config.js";
import { getTerminal3Status } from "../services/terminal3.js";

const status = await getTerminal3Status(true);
console.log(
  JSON.stringify(
    {
      configured: status.configured,
      connected: status.connected,
      environment: status.environment,
      did: status.did ?? status.expectedDid,
      address: status.address,
      tenant: status.tenant
        ? {
            claimed: status.tenant.claimed,
            status: status.tenant.status,
            policyMapName: status.tenant.policyMapName,
            secretMapName: status.tenant.secretMapName,
            error: status.tenant.error
          }
        : undefined,
      error: status.error
    },
    null,
    2
  )
);
