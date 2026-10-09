// cms/lib/contracts.ts — exported types + function signatures for every cross-agent call (SPEC §O).
//
// This file is the interface between the agents that build the CMS in
// parallel: anything one agent calls in another agent's code is declared
// here first, so `tsc` is meaningful from the first day of a phase. Phase 1
// lands the "shared (1A)" section with real bodies (re-exported from the
// modules that own them). Phase 3A-0 replaces the file with the full §O,
// where every not-yet-built function `throw new NotImplemented(name)` until
// its owner lands a body — keep this header and the shared section verbatim
// when doing so.

export class NotImplemented extends Error {
  constructor(name: string) {
    super(`${name} not implemented yet`);
    this.name = "NotImplemented";
  }
}

export type Mode = "test" | "live" | "mock";
export type Role = "admin" | "editor" | "front-desk";
/** Integer AED fils. Never a float, never a string. */
export type Fils = number;
export type Channel = "online" | "desk";
export type DeskMethod = "cash" | "card_terminal" | "complimentary" | "bank_transfer";

// ───────── shared (1A) ─────────
// site-settings.publicUrl → NEXT_PUBLIC_SERVER_URL → ""; the sync form returns the last resolved value (hooks).
export { isPlaceholderPublicUrl, publicUrl, publicUrlSync, routeFor } from "./publicUrl";
// "enc:v1:<b64url(iv‖tag‖ct)>" — AES-256-GCM under hkdf(PAYLOAD_SECRET, "secrets-v1").
export { MASK, open, seal } from "./crypto";
// field + `${name}SetAt`
export { encryptedText } from "@/cms/fields/encryptedText";
// b64url(hmac256(hkdf(PAYLOAD_SECRET, info), payload)); verifySig is timingSafeEqual.
export type { SigningInfo } from "./signing";
export { sign, verifySig } from "./signing";
// true = allowed; clientIp reads the LAST X-Forwarded-For hop; ipHash is daily-salted.
export { ipHash } from "./crypto";
export { clientIp, rateLimit } from "./rateLimit";
// throws 401/403; rejects Sec-Fetch-Site: cross-site
export { requireRole } from "@/cms/endpoints/requireRole";
export { revalidateAllContent, revalidateCollection, safeRevalidate } from "@/cms/hooks/revalidate";
export { findMediaReferences } from "./mediaReferences";
export type { MediaReference } from "./mediaReferences";
