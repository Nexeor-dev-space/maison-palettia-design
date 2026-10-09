import type { Endpoint } from "payload";

import { adminOrdersEndpoints } from "./admin-orders";
import { adminSessionsEndpoints } from "./admin-sessions";
import { checkoutEndpoints } from "./checkout";
import { emailEndpoints } from "./email";
import { enquiriesEndpoints } from "./enquiries";
import { exportsEndpoints } from "./exports";
import { findTextEndpoints } from "./find-text";
import { paymentsEndpoints } from "./payments";
import { revalidateEndpoints } from "./revalidate";
import { settingsEmailEndpoints } from "./settings-email";
import { settingsPaymentsEndpoints } from "./settings-payments";
import { ticketsEndpoints } from "./tickets";
import { usersEndpoints } from "./users";

export { json, parseBody, requireRole } from "./requireRole";

/**
 * Every custom root endpoint, concatenated into `payload.config.ts`'s
 * `endpoints` key (SPEC §A.3). One file per feature area; each exports an
 * `…Endpoints: Endpoint[]` array that is empty until its phase lands the
 * handlers. The order here is only the order Payload registers routes in;
 * nothing overlaps because every path is distinct under `/api/actions/**`.
 *
 * Phase 3A-1 owns this barrel from Phase 3 on (SPEC §L).
 */
export const endpoints: Endpoint[] = [
  ...checkoutEndpoints,
  ...paymentsEndpoints,
  ...emailEndpoints,
  ...ticketsEndpoints,
  ...enquiriesEndpoints,
  ...settingsPaymentsEndpoints,
  ...settingsEmailEndpoints,
  ...adminOrdersEndpoints,
  ...adminSessionsEndpoints,
  ...usersEndpoints,
  ...exportsEndpoints,
  ...findTextEndpoints,
  ...revalidateEndpoints,
];
