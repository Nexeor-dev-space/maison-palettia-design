import net from "node:net";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The mailer's own rules (SPEC §H.8, §C.3): unsaved form values over stored
 * settings with "mask = keep the stored secret", secrets scrubbed from
 * errors, the keyed config hash, recipients normalised, and — against a
 * minimal SMTP server on localhost — that `from`, `replyTo` and `bcc` come
 * from the settings, never from the caller.
 */

process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-used-anywhere-else-0123456789";

let mailer: typeof import("./mailer");

/** Just enough SMTP to accept one message per connection and record the envelope and data. */
function fakeSmtp() {
  const messages: Array<{ from: string; to: string[]; data: string }> = [];
  const server = net.createServer((socket) => {
    let buffer = "";
    let inData = false;
    let current = { from: "", to: [] as string[], data: "" };
    const reply = (line: string) => socket.write(`${line}\r\n`);
    reply("220 fake.local ESMTP");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      for (;;) {
        if (inData) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end === -1) return;
          current.data = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          inData = false;
          messages.push(current);
          current = { from: "", to: [], data: "" };
          reply("250 2.0.0 Ok: queued as FAKE123");
          continue;
        }
        const eol = buffer.indexOf("\r\n");
        if (eol === -1) return;
        const line = buffer.slice(0, eol);
        buffer = buffer.slice(eol + 2);
        const verb = line.slice(0, 4).toUpperCase();
        if (verb === "EHLO" || verb === "HELO") {
          reply("250 fake.local");
        } else if (verb === "MAIL") {
          current.from = line.replace(/^MAIL FROM:\s*<?([^>\s]*)>?.*$/i, "$1");
          reply("250 Ok");
        } else if (verb === "RCPT") {
          current.to.push(line.replace(/^RCPT TO:\s*<?([^>\s]*)>?.*$/i, "$1"));
          reply("250 Ok");
        } else if (verb === "DATA") {
          inData = true;
          reply("354 End data with <CR><LF>.<CR><LF>");
        } else if (verb === "QUIT") {
          reply("221 Bye");
          socket.end();
        } else {
          reply(verb === "RSET" || verb === "NOOP" ? "250 Ok" : "502 Not implemented");
        }
      }
    });
  });
  return { server, messages };
}

const smtp = fakeSmtp();
let port = 0;

beforeAll(async () => {
  mailer = await import("./mailer");
  await new Promise<void>((resolve) => smtp.server.listen(0, "127.0.0.1", () => resolve()));
  port = (smtp.server.address() as net.AddressInfo).port;
});

afterAll(() => new Promise<void>((resolve) => smtp.server.close(() => resolve())));

const stored = () =>
  ({
    provider: "smtp",
    fromName: "Maison Palettia",
    fromAddress: "hello@maison.test",
    replyTo: "studio@maison.test",
    bcc: "archive@maison.test",
    smtp: { host: "127.0.0.1", port, secure: false, user: "", password: "s3cret-password" },
    resendApiKey: "",
  }) as const;

describe("settings from the unsaved form", () => {
  it("keeps the stored secret for the mask, empty or absent; clears it for null; takes a new one", () => {
    const base = { ...stored(), smtp: { ...stored().smtp } };
    expect(mailer.mergeUnsavedSettings(base, { smtp: { password: "••••••••" } }).smtp.password).toBe("s3cret-password");
    expect(mailer.mergeUnsavedSettings(base, { smtp: { password: "" } }).smtp.password).toBe("s3cret-password");
    expect(mailer.mergeUnsavedSettings(base, { smtp: {} }).smtp.password).toBe("s3cret-password");
    expect(mailer.mergeUnsavedSettings(base, { smtp: { password: null } }).smtp.password).toBe("");
    expect(mailer.mergeUnsavedSettings(base, { smtp: { password: "new-one" }, fromAddress: "x@y.test" })).toMatchObject({ fromAddress: "x@y.test", smtp: { password: "new-one" } });
  });

  it("hashes the config with a key: different passwords differ, the hash never contains the password", () => {
    const a = mailer.mailConfigHash({ ...stored(), smtp: { ...stored().smtp } });
    const b = mailer.mailConfigHash({ ...stored(), smtp: { ...stored().smtp, password: "other" } });
    expect(a).not.toBe(b);
    expect(a).not.toContain("s3cret");
  });

  it("scrubs secrets out of error text", () => {
    const settings = { ...stored(), smtp: { ...stored().smtp }, resendApiKey: "re_ABCDEFGH12345678" };
    expect(mailer.scrub(new Error("auth s3cret-password failed for re_ABCDEFGH12345678"), settings)).toBe("auth [redacted] failed for [redacted]");
  });

  it("normalises recipients", () => {
    expect(mailer.normalizeRecipients(["A@Example.com", "a@example.com", "not-an-email", "Layla <l@x.test>"])).toEqual(["a@example.com", "l@x.test"]);
    expect(mailer.normalizeRecipients("one@x.test, two@x.test")).toEqual(["one@x.test", "two@x.test"]);
  });
});

describe("transport", () => {
  it("sends nothing in log-only mode", async () => {
    const result = await mailer.transportSend({ ...stored(), provider: "log-only", smtp: { ...stored().smtp } }, { to: ["a@x.test"], subject: "s", html: "<p>h</p>" });
    expect(result).toEqual({ provider: "log", skipped: true });
  });

  it("sends over SMTP with From/Reply-To/BCC from the settings and the attachment included", async () => {
    const result = await mailer.transportSend(
      { ...stored(), smtp: { ...stored().smtp } },
      {
        to: ["layla@example.com"],
        subject: "You're booked — MP-7KQ2XD",
        html: "<p>Hello</p>",
        text: "Hello",
        attachments: [{ filename: "MP-INV-2026-000001.pdf", content: Buffer.from("%PDF-1.3 fake"), contentType: "application/pdf" }],
      },
    );
    expect(result.provider).toBe("smtp");
    const message = smtp.messages.at(-1)!;
    expect(message.from).toBe("hello@maison.test");
    expect(message.to.sort()).toEqual(["archive@maison.test", "layla@example.com"]);
    expect(message.data).toMatch(/^From: "?Maison Palettia"? <hello@maison\.test>/m);
    expect(message.data).toMatch(/^Reply-To: studio@maison\.test/m);
    expect(message.data).not.toMatch(/^Bcc:/m);
    expect(message.data).toMatch(/filename="?MP-INV-2026-000001\.pdf"?/);
  });

  it("verifies an SMTP server it can reach and explains one it cannot", async () => {
    expect(await mailer.verifyMailSettings({ ...stored(), smtp: { ...stored().smtp } })).toMatchObject({ ok: true });
    const down = await mailer.verifyMailSettings({ ...stored(), smtp: { ...stored().smtp, port: 1 } });
    expect(down.ok).toBe(false);
    expect(down.message).toMatch(/Could not reach 127\.0\.0\.1:1/);
    expect(down.message).not.toContain("s3cret");
  });
});
