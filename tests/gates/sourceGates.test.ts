import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * ==========================================================================
 * Source gates (SPEC §K "Build gates") — greps that must stay empty
 * ==========================================================================
 *
 * The same checks run in scripts/ci.sh as shell greps; here they live as a
 * test so `npx vitest run` catches them on a laptop before CI does, and a
 * failure names the file and line.
 *
 *   · `process.env.*` reads match the §C.1 allowlist — the owner's hard
 *     constraint is "everything configurable lives in the admin", so a new
 *     env var is a design change, not a convenience;
 *   · `OLD_PAYLOAD_SECRET` only inside the reseal script; `PORT`/`HOSTNAME`
 *     only in the loopback revalidate call (§G.4 — the hook's fallback and
 *     the deploy's scripts/revalidate.mjs); no dynamic
 *     `process.env[...]` and no destructuring, which would hide a read;
 *   · no `type: "point"` field and no PostGIS in any migration (the alpine
 *     Postgres image cannot install it, and nothing needs it);
 *   · no `NEXT_PUBLIC_WHATSAPP_NUMBER` (moved to Site details, no rebuild);
 *   · no `upload.handlers` on invoice-files (invoice PDFs are never served
 *     by URL — only through the signed route);
 *   · no `updateTag(` anywhere (Server-Action-only in Next 16; it throws
 *     from route handlers and hooks — cms/hooks/revalidate.ts).
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Runtime source: what ships in the server bundle or runs on the host. Tests and docs are not runtime. */
const SOURCE_DIRS = ["app", "cms", "lib", "components", "types", "scripts"];
const SOURCE_FILES = ["payload.config.ts", "next.config.ts", "instrumentation.ts", "proxy.ts", "middleware.ts"];
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".next")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (CODE.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const sourceFiles = (): string[] => [
  ...SOURCE_DIRS.flatMap((dir) => walk(path.join(ROOT, dir))),
  ...SOURCE_FILES.map((file) => path.join(ROOT, file)).filter((file) => fs.existsSync(file)),
];

type Hit = { file: string; line: number; text: string };

function grep(files: string[], pattern: RegExp): Hit[] {
  const hits: Hit[] = [];
  for (const file of files) {
    fs.readFileSync(file, "utf8")
      .split("\n")
      .forEach((text, index) => {
        if (pattern.test(text)) hits.push({ file: path.relative(ROOT, file), line: index + 1, text: text.trim().slice(0, 160) });
      });
  }
  return hits;
}

/** Comment lines (`//`, ` * `) may name things; only code counts. */
const isComment = (text: string) => /^(\/\/|\*|\/\*)/.test(text);

/** SPEC §C.1 allowlist, and where each restricted name may appear. */
const ALLOWED: Record<string, string[] | "anywhere"> = {
  DATABASE_URL: "anywhere",
  PAYLOAD_SECRET: "anywhere",
  NEXT_PUBLIC_SERVER_URL: "anywhere",
  NODE_ENV: "anywhere",
  NEXT_RUNTIME: "anywhere",
  NEXT_PHASE: "anywhere",
  PAYLOAD_MIGRATING: "anywhere",
  // The signed loopback revalidate call (§G.4): the server's fallback, and the deploy's last step.
  PORT: ["cms/hooks/revalidate.ts", "scripts/revalidate.mjs"],
  HOSTNAME: ["cms/hooks/revalidate.ts", "scripts/revalidate.mjs"],
  OLD_PAYLOAD_SECRET: ["cms/scripts/reseal.ts"],
};

describe("process.env allowlist (SPEC §C.1, §K grep gate)", () => {
  it("reads only allowlisted variables, each only where it is allowed", () => {
    const offenders: string[] = [];
    for (const hit of grep(sourceFiles(), /process\.env/)) {
      if (isComment(hit.text)) continue;
      for (const match of hit.text.matchAll(/process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
        const name = match[1];
        const rule = ALLOWED[name];
        if (!rule) offenders.push(`${hit.file}:${hit.line} reads ${name} (not in the §C.1 allowlist)`);
        else if (rule !== "anywhere" && !rule.includes(hit.file)) offenders.push(`${hit.file}:${hit.line} reads ${name} (only allowed in ${rule.join(", ")})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("never reads the environment in a way the grep cannot see (process.env[...] or destructuring)", () => {
    const hidden = grep(sourceFiles(), /process\.env\s*\[|=\s*process\.env\s*[;,)]|\{[^}]*\}\s*=\s*process\.env\b/).filter((hit) => !isComment(hit.text));
    expect(hidden.map((h) => `${h.file}:${h.line} ${h.text}`)).toEqual([]);
  });

  it("CRON_SECRET is not used in v1 (it belongs only behind a Vercel check)", () => {
    expect(grep(sourceFiles(), /CRON_SECRET/).filter((h) => !isComment(h.text))).toEqual([]);
  });
});

describe("schema gates (SPEC §K)", () => {
  it('no `type: "point"` field anywhere in cms/', () => {
    expect(grep(walk(path.join(ROOT, "cms")), /type:\s*["']point["']/)).toEqual([]);
  });

  it("no migration mentions PostGIS", () => {
    const migrations = fs.readdirSync(path.join(ROOT, "migrations")).map((f) => path.join(ROOT, "migrations", f));
    expect(grep(migrations, /postgis/i)).toEqual([]);
  });

  it("invoice-files has no upload.handlers (PDFs are served only by the signed route)", () => {
    const source = fs.readFileSync(path.join(ROOT, "cms/collections/commerce/InvoiceFiles.ts"), "utf8");
    expect(source).not.toMatch(/\bhandlers\s*:/);
  });
});

describe("removed / forbidden APIs (SPEC §K)", () => {
  it("NEXT_PUBLIC_WHATSAPP_NUMBER is gone (Site details → contact.whatsappNumber)", () => {
    const files = [...sourceFiles(), ...[".env.example"].map((f) => path.join(ROOT, f)).filter((f) => fs.existsSync(f))];
    expect(grep(files, /NEXT_PUBLIC_WHATSAPP_NUMBER/)).toEqual([]);
  });

  it("no updateTag( call anywhere (it throws outside Server Actions)", () => {
    expect(grep(sourceFiles(), /\bupdateTag\(/).filter((h) => !isComment(h.text))).toEqual([]);
  });
});
