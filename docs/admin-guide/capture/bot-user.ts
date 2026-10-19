import config from "@payload-config";
import { readFileSync } from "node:fs";
import { getPayload } from "payload";

/** Temporary docs-capture admin: `create` (idempotent) or `delete`. Password read from the file given as argv[3]. */
async function main() {
  const mode = process.argv[2];
  const email = "docs-bot@nexeor.local";
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: "users", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true });
  if (mode === "delete") {
    if (docs[0]) await payload.delete({ collection: "users", id: docs[0].id, overrideAccess: true, context: { system: true, skipRevalidate: true } });
    console.log(docs[0] ? "deleted" : "absent");
    process.exit(0);
  }
  const password = readFileSync(process.argv[3], "utf8").trim();
  if (docs[0]) {
    await payload.update({ collection: "users", id: docs[0].id, data: { password, active: true, role: "admin", loginAttempts: 0, lockUntil: null } as never, overrideAccess: true, context: { system: true, skipRevalidate: true } });
    console.log("updated");
  } else {
    await payload.create({ collection: "users", data: { email, password, name: "Docs Bot (temporary)", role: "admin", active: true } as never, overrideAccess: true, context: { system: true, skipRevalidate: true } });
    console.log("created");
  }
  process.exit(0);
}
try {
  await main();
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
