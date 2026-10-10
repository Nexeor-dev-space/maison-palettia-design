#!/usr/bin/env node
/**
 * ==========================================================================
 * revalidate — the signed "purge everything" call a deploy ends with
 * ==========================================================================
 *
 *   node scripts/revalidate.mjs [--port 3200] [--path /]... [--no-layout]
 *
 * Run by scripts/deploy.sh after the restart (SPEC §A.5): it POSTs
 * `{ paths: ["/"], layout: true }` to `/api/site/revalidate` on the
 * loopback interface, so no page prerendered by an earlier build — or
 * cached by the process that just stopped — can outlive the deploy.
 *
 * THE SIGNATURE is the one app/(site)/api/site/revalidate/route.ts checks
 * and cms/hooks/revalidate.ts::postSignedRevalidate mints:
 *
 *   Authorization: Bearer <unix>.<sha256hex(body)>.<hmac>
 *   hmac = base64url(HMAC-SHA256(key, "<unix>.<sha256hex>"))
 *   key  = HKDF-SHA256(PAYLOAD_SECRET, salt "maison-palettia", info "revalidate-v1", 32 bytes)
 *
 * It is re-implemented here in plain Node rather than imported because this
 * has to run on the host with nothing but `node` — no TypeScript loader, no
 * Payload boot. The three constants above MUST stay in step with
 * cms/lib/crypto.ts (HKDF_SALT) and cms/lib/signing.ts (the info label); a
 * drift shows up immediately as "401 Bad signature" at the end of a deploy,
 * never as a silent pass.
 *
 * The request goes to 127.0.0.1 and never through the proxy (which denies
 * this path from outside — deploy/nginx.conf.example). The Host header
 * carries the public origin, as postSignedRevalidate does, so anything in
 * the request pipeline that looks at Host sees the real site.
 *
 * PAYLOAD_SECRET comes from the environment, or from `.env` in the current
 * directory when it is not set (Node's loadEnvFile never overrides a value
 * that is already present). It is never an argument.
 */
import { createHash, createHmac, hkdfSync } from "node:crypto";
import http from "node:http";

const args = process.argv.slice(2);
let port = process.env.PORT || "3200";
let layout = true;
const paths = [];
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--port") port = args[++i];
  else if (arg === "--path") paths.push(args[++i]);
  else if (arg === "--no-layout") layout = false;
  else {
    console.error(`revalidate: unknown argument ${arg}`);
    process.exit(2);
  }
}
if (paths.length === 0) paths.push("/");
if (!/^\d{2,5}$/.test(String(port))) {
  console.error(`revalidate: bad port ${port}`);
  process.exit(2);
}

if (!process.env.PAYLOAD_SECRET) {
  try {
    process.loadEnvFile(".env");
  } catch {
    /* no .env here — the secret must come from the environment */
  }
}
const secret = process.env.PAYLOAD_SECRET;
if (!secret) {
  console.error("revalidate: PAYLOAD_SECRET is not set (environment or ./.env).");
  process.exit(1);
}

const body = JSON.stringify({ tags: [], paths, layout });
const unix = Math.floor(Date.now() / 1000);
const hash = createHash("sha256").update(body).digest("hex");
const key = Buffer.from(hkdfSync("sha256", secret, "maison-palettia", "revalidate-v1", 32));
const sig = createHmac("sha256", key).update(`${unix}.${hash}`).digest("base64url");

let host = `127.0.0.1:${port}`;
try {
  if (process.env.NEXT_PUBLIC_SERVER_URL) host = new URL(process.env.NEXT_PUBLIC_SERVER_URL).host;
} catch {
  /* malformed public URL: fall back to the loopback host */
}

const request = http.request(
  {
    host: "127.0.0.1",
    port: Number(port),
    path: "/api/site/revalidate",
    method: "POST",
    headers: {
      host,
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
      authorization: `Bearer ${unix}.${hash}.${sig}`,
    },
    timeout: 10_000,
  },
  (response) => {
    let text = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => (text += chunk));
    response.on("end", () => {
      if (response.statusCode === 200) {
        console.log(`revalidate: OK ${text.trim()}`);
        process.exit(0);
      }
      console.error(`revalidate: HTTP ${response.statusCode} ${text.trim()}`);
      process.exit(1);
    });
  },
);
request.on("timeout", () => request.destroy(new Error("timed out after 10 s")));
request.on("error", (error) => {
  console.error(`revalidate: ${error.message}`);
  process.exit(1);
});
request.end(body);
