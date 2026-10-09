import config from "@payload-config";
import { getPayload } from "payload";

import { readHidden } from "./prompt";

/**
 * ==========================================================================
 * reset-password — the developer fallback for a locked-out owner
 * ==========================================================================
 *
 *   npx payload run cms/scripts/reset-password.ts owner@example.com
 *
 * Staff normally reset through the emailed link (Settings → Email sending
 * must be verified for that to work). When the owner's own password is lost
 * before email exists — the first weeks — Nexeor runs this on the server:
 * it prompts for the new password twice without echo, sets it through the
 * Local API (so Payload hashes it), clears any login lock, and reactivates
 * the account (SPEC §D.1). The email is a positional argument because it is
 * not a secret; the password never is one.
 */

const MIN_LENGTH = 12;

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("usage: npx payload run cms/scripts/reset-password.ts <email>");
    process.exit(2);
  }

  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: "users", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true });
  const user = docs[0] as { id: number | string; name?: string } | undefined;
  if (!user) {
    console.error(`reset-password: no staff account with the email ${email}.`);
    process.exit(1);
  }

  const password = await readHidden(`New password for ${user.name ?? email} (min ${MIN_LENGTH} characters, hidden): `);
  if (password.length < MIN_LENGTH) {
    console.error(`reset-password: use at least ${MIN_LENGTH} characters.`);
    process.exit(2);
  }
  const confirm = await readHidden("Repeat the new password: ");
  if (confirm !== password) {
    console.error("reset-password: the two entries differ; nothing changed.");
    process.exit(2);
  }

  // `loginAttempts` / `lockUntil` are Payload's own auth fields: zeroing them is the unlock.
  await payload.update({
    collection: "users",
    id: user.id,
    data: { password, active: true, loginAttempts: 0, lockUntil: null },
    depth: 0,
    overrideAccess: true,
    context: { system: true, skipRevalidate: true },
  });

  console.log(`reset-password: password updated and account unlocked for ${email}. Sign in at /admin.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("reset-password failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
