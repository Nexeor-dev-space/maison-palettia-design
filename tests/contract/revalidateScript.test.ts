import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { verifySig } from "@/cms/lib/signing";

/**
 * Contract: scripts/revalidate.mjs (the deploy's last step) re-implements
 * the `revalidate-v1` signature in plain Node, so it can run on a host with
 * no TypeScript loader. Its header warns that the HKDF salt and info label
 * "MUST stay in step" with cms/lib/crypto.ts and cms/lib/signing.ts. This
 * test makes that a CI failure instead of a 401 at the end of a deploy:
 * the real script is run against a stub server, and what it sends is
 * verified with the real `verifySig` and the route's body-hash rule.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-used-anywhere-else-0123456789";

type Seen = { headers: http.IncomingHttpHeaders; body: string; url?: string; method?: string };
let server: http.Server;
let port = 0;
const seen: Seen[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      seen.push({ headers: req.headers, body, url: req.url, method: req.method });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ revalidated: true }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function runScript(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [path.join(ROOT, "scripts/revalidate.mjs"), "--port", String(port), ...args],
      { cwd: ROOT, env: { PATH: process.env.PATH ?? "", PAYLOAD_SECRET: process.env.PAYLOAD_SECRET, NEXT_PUBLIC_SERVER_URL: "https://example.test" } as unknown as NodeJS.ProcessEnv, timeout: 20_000, encoding: "utf8" },
      (error, stdout: string, stderr: string) => resolve({ code: error ? Number((error as { code?: number }).code ?? 1) : 0, stdout, stderr }),
    );
  });
}

describe("scripts/revalidate.mjs speaks the server's revalidate-v1 dialect", () => {
  it("posts a body whose hash and HMAC verify with cms/lib/signing", async () => {
    const before = seen.length;
    const result = await runScript(["--path", "/", "--path", "/events"]);
    expect(result.code, result.stderr).toBe(0);
    const request = seen[before];
    expect(request).toBeDefined();
    expect(request.method).toBe("POST");
    expect(request.url).toBe("/api/site/revalidate");
    expect(request.headers.host).toBe("example.test");
    expect(JSON.parse(request.body)).toEqual({ tags: [], paths: ["/", "/events"], layout: true });

    const match = /^Bearer (\d+)\.([0-9a-f]{64})\.([A-Za-z0-9_-]+)$/.exec(String(request.headers.authorization));
    expect(match).not.toBeNull();
    const [, unix, hash, sig] = match!;
    expect(hash).toBe(createHash("sha256").update(request.body).digest("hex"));
    expect(Math.abs(Number(unix) - Date.now() / 1000)).toBeLessThan(60);
    expect(verifySig("revalidate-v1", `${unix}.${hash}`, sig)).toBe(true);
  });

  it("never takes the secret from an argument and fails without one", async () => {
    const result = await new Promise<{ code: number; stderr: string }>((resolve) => {
      execFile(
        process.execPath,
        [path.join(ROOT, "scripts/revalidate.mjs"), "--port", String(port), "--secret", "x"],
        { cwd: path.join(ROOT, "tests"), env: { PATH: process.env.PATH ?? "" } as unknown as NodeJS.ProcessEnv, timeout: 20_000, encoding: "utf8" },
        (error, _stdout: string, stderr: string) => resolve({ code: error ? Number((error as { code?: number }).code ?? 1) : 0, stderr }),
      );
    });
    expect(result.code).not.toBe(0);
  });
});
