import { promises as fs } from "node:fs";
import path from "node:path";

import nodemailer, { type Transporter } from "nodemailer";
import { APIError, type EmailAdapter, type Payload, type PayloadRequest, type SendEmailOptions } from "payload";
import { Resend } from "resend";

import { formatDubai, redactVariables } from "@/cms/email/render";
import { isStaffTemplate } from "@/cms/email/variables";
import type { Attachment, TemplateKey } from "@/cms/lib/contracts";
import { deriveKey, hmacSha256 } from "@/cms/lib/crypto";
import { MASK } from "@/cms/lib/mask";
import { PRIVATE_DIR } from "@/cms/lib/paths";
import { loadTemplate, type RenderedEmail, renderTemplate } from "@/cms/lib/templates";
import type { EmailSetting, NotificationLog } from "@/payload-types";

/**
 * ==========================================================================
 * The mailer — settings read at send time, every send logged (SPEC §H.8)
 * ==========================================================================
 *
 * WHY NOT @payloadcms/email-nodemailer. That adapter takes its transport
 * options when the config is built, i.e. at deploy time. The owner's rule
 * is that every setting lives in the admin with no redeploy (DECISIONS.md
 * #5), so this module is its own Payload `EmailAdapter`: on EVERY send it
 * reads Settings → Email sending, picks SMTP (nodemailer), Resend, or
 * "log only", and replaces `from`, `replyTo` and `bcc` with the saved
 * values — Payload's own password-reset emails included. The transport is
 * cached by an HMAC of the settings that shape it, so a changed password or
 * host simply misses the cache; nothing needs to be "dropped".
 *
 * THE PIPELINE (`sendTemplated`, SPEC §O):
 *
 *   1. render NOW — subject, HTML, plain text (cms/lib/templates.ts);
 *   2. write a `notification-log` row with the rendering and the variables
 *      after redaction (links, tokens, URLs → "[redacted]", §D.5):
 *      `queued`, or `skipped` when the template is off, there is no valid
 *      address, or email is "log only";
 *   3. queue `send-email { logId }` on the `email` queue (3D's task, five
 *      retries). The task calls `deliverNotification`, which sends the
 *      stored rendering, attaches the invoice/ticket PDFs the template asks
 *      for, and stamps `sent` or `failed` (and rethrows, so the job retries).
 *
 * Until 3D registers `send-email` the row is delivered inline, so the
 * pipeline works end to end in the meantime (logged as such).
 *
 * SECRETS. The SMTP password and Resend key are read with
 * `context.revealSecrets` and never leave this module: errors that reach
 * the log or an admin toast are passed through `scrub()` first, and the
 * settings hash stored by Verify is an HMAC, not a digest of the password.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Settings                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export type EmailProvider = "log-only" | "smtp" | "resend";

export interface MailSettings {
  provider: EmailProvider;
  fromName: string;
  fromAddress: string;
  replyTo: string;
  bcc: string;
  smtp: { host: string; port: number; secure: boolean; user: string; password: string };
  resendApiKey: string;
}

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function normalizeSettings(raw: Partial<EmailSetting> | Record<string, unknown> | null | undefined): MailSettings {
  const doc = (raw ?? {}) as Partial<EmailSetting>;
  const provider = (["smtp", "resend", "log-only"] as const).includes(doc.provider as EmailProvider) ? (doc.provider as EmailProvider) : "log-only";
  const port = Number(doc.smtp?.port);
  return {
    provider,
    fromName: str(doc.fromName) || "Maison Palettia",
    fromAddress: str(doc.fromAddress),
    replyTo: str(doc.replyTo),
    bcc: str(doc.bcc),
    smtp: {
      host: str(doc.smtp?.host),
      port: Number.isInteger(port) && port > 0 ? port : 587,
      secure: doc.smtp?.secure === true,
      user: str(doc.smtp?.user),
      password: typeof doc.smtp?.password === "string" ? doc.smtp.password : "",
    },
    resendApiKey: str(doc.resendApiKey),
  };
}

/** The saved Email sending settings with secrets in clear. Server-only; never return this from an endpoint. */
export async function readMailSettings(payload: Payload, req?: PayloadRequest): Promise<MailSettings> {
  try {
    const doc = await payload.findGlobal({
      slug: "email-settings",
      depth: 0,
      overrideAccess: true,
      context: { revealSecrets: true },
      ...(req ? { req } : {}),
    });
    return normalizeSettings(doc as EmailSetting);
  } catch (error) {
    payload.logger.warn({ err: error }, "mailer: could not read email-settings; treating email as log-only");
    return normalizeSettings(null);
  }
}

/**
 * The settings an admin is looking at in the form, before saving: the
 * unsaved values over the stored ones. A secret that arrives as the mask
 * (or empty, or absent) means "use the stored one"; `null` is the
 * SecretField's Clear and means "none" (SPEC §C.3).
 */
export function mergeUnsavedSettings(stored: MailSettings, unsaved: unknown): MailSettings {
  if (!unsaved || typeof unsaved !== "object") return stored;
  const form = unsaved as Record<string, unknown>;
  const smtpForm = (form.smtp && typeof form.smtp === "object" ? form.smtp : {}) as Record<string, unknown>;
  const secret = (incoming: unknown, saved: string): string => {
    if (incoming === null) return "";
    if (incoming === undefined || incoming === "" || incoming === MASK) return saved;
    return typeof incoming === "string" ? incoming : saved;
  };
  const merged = normalizeSettings({
    provider: (form.provider ?? stored.provider) as EmailProvider,
    fromName: (form.fromName ?? stored.fromName) as string,
    fromAddress: (form.fromAddress ?? stored.fromAddress) as string,
    replyTo: (form.replyTo ?? stored.replyTo) as string,
    bcc: (form.bcc ?? stored.bcc) as string,
    smtp: {
      host: (smtpForm.host ?? stored.smtp.host) as string,
      port: (smtpForm.port ?? stored.smtp.port) as number,
      secure: (smtpForm.secure ?? stored.smtp.secure) as boolean,
      user: (smtpForm.user ?? stored.smtp.user) as string,
      password: secret(smtpForm.password, stored.smtp.password),
    },
    resendApiKey: secret(form.resendApiKey, stored.resendApiKey),
  } as Partial<EmailSetting>);
  return merged;
}

/**
 * An HMAC over everything that decides how and as whom mail is sent. Keyed
 * (HKDF of PAYLOAD_SECRET), so the value stored in `lastVerify.configHash`
 * says nothing about a weak SMTP password to someone who can read it.
 */
export function mailConfigHash(settings: MailSettings): string {
  const material = JSON.stringify([
    settings.provider,
    settings.fromAddress.toLowerCase(),
    settings.smtp.host.toLowerCase(),
    settings.smtp.port,
    settings.smtp.secure,
    settings.smtp.user,
    settings.smtp.password,
    settings.resendApiKey,
  ]);
  return hmacSha256(deriveKey("email-config-v1"), material).toString("base64url").slice(0, 32);
}

/** Error text with any secret of these settings blanked out, trimmed to what the log column holds. */
export function scrub(message: unknown, settings?: MailSettings): string {
  let text = message instanceof Error ? message.message : typeof message === "string" ? message : String(message ?? "");
  for (const secret of [settings?.smtp.password, settings?.resendApiKey]) {
    if (secret && secret.length >= 4) text = text.split(secret).join("[redacted]");
  }
  return text.replace(/re_[A-Za-z0-9_]{8,}/g, "[redacted]").slice(0, 2000);
}

/**
 * Is email set up AND verified for the settings that are saved now? `ok` in
 * `lastVerify` alone goes stale when someone edits the host or key after
 * verifying; the stored config hash catches that.
 */
export async function emailReadiness(req: PayloadRequest): Promise<{ ok: boolean; reason?: string }> {
  const settings = await readMailSettings(req.payload, req);
  if (settings.provider === "log-only") return { ok: false, reason: "Email is set to “Log only”." };
  const doc = (await req.payload.findGlobal({ slug: "email-settings", depth: 0, overrideAccess: true, req })) as EmailSetting;
  const last = (doc.lastVerify ?? null) as { ok?: boolean; configHash?: string } | null;
  if (!last?.ok) return { ok: false, reason: "Email has not been verified (Settings → Email sending → Verify connection)." };
  if (last.configHash && last.configHash !== mailConfigHash(settings)) {
    return { ok: false, reason: "Email settings changed since the last verification — verify again." };
  }
  return { ok: true };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Transports                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const MAX_CACHED = 4;
const smtpCache = new Map<string, Transporter>();

function smtpTransport(settings: MailSettings): Transporter {
  const key = mailConfigHash(settings);
  const cached = smtpCache.get(key);
  if (cached) return cached;
  const transport = nodemailer.createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: settings.smtp.secure,
    auth: settings.smtp.user ? { user: settings.smtp.user, pass: settings.smtp.password } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  smtpCache.set(key, transport);
  while (smtpCache.size > MAX_CACHED) {
    const [oldestKey, oldest] = smtpCache.entries().next().value as [string, Transporter];
    smtpCache.delete(oldestKey);
    oldest.close();
  }
  return transport;
}

/** `Name <address>` with the name stripped of anything that could break the header. */
function formatFrom(settings: MailSettings): string {
  const name = settings.fromName.replace(/["\r\n<>]/g, "").trim();
  return name ? `"${name}" <${settings.fromAddress}>` : settings.fromAddress;
}

type AddressLike = string | { address: string; name?: string } | Array<string | { address: string; name?: string }> | undefined;

function addressList(value: AddressLike): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => (typeof item === "string" ? item : item?.address))
    .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
    .map((item) => item.trim())
    .filter(Boolean);
}

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

/** Unique, valid, lower-cased recipients. */
export function normalizeRecipients(to: string | string[] | null | undefined): string[] {
  const list = addressList(to as AddressLike).map((address) => address.replace(/^.*<([^>]+)>$/, "$1").trim().toLowerCase());
  return Array.from(new Set(list.filter((address) => EMAIL_RE.test(address))));
}

export interface OutgoingMessage {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Attachment[];
  /** Ties a provider-side retry to one attempt of one log row (Resend honours it for 24 h). */
  idempotencyKey?: string;
}

export interface TransportResult {
  provider: "smtp" | "resend" | "log";
  messageId?: string;
  skipped?: boolean;
}

/**
 * Sends one message with the given settings. `from`, `replyTo` and `bcc`
 * always come from the settings, never from the caller. Throws on any
 * provider error (scrubbed of secrets).
 */
export async function transportSend(settings: MailSettings, message: OutgoingMessage): Promise<TransportResult> {
  if (settings.provider === "log-only") return { provider: "log", skipped: true };
  if (!settings.fromAddress) throw new Error("No From address is set in Settings → Email sending.");
  if (!message.to.length) throw new Error("No recipient.");

  if (settings.provider === "smtp") {
    if (!settings.smtp.host) throw new Error("No SMTP host is set in Settings → Email sending.");
    try {
      const info = await smtpTransport(settings).sendMail({
        from: formatFrom(settings),
        to: message.to,
        replyTo: settings.replyTo || undefined,
        bcc: settings.bcc || undefined,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
      });
      return { provider: "smtp", messageId: info.messageId };
    } catch (error) {
      throw new Error(scrub(error, settings));
    }
  }

  if (!settings.resendApiKey) throw new Error("No Resend API key is set in Settings → Email sending.");
  const resend = new Resend(settings.resendApiKey);
  const { data, error } = await resend.emails.send(
    {
      from: formatFrom(settings),
      to: message.to,
      replyTo: settings.replyTo || undefined,
      bcc: settings.bcc || undefined,
      subject: message.subject,
      html: message.html ?? "",
      text: message.text,
      attachments: message.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    },
    message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined,
  );
  if (error || !data) throw new Error(scrub(`Resend: ${error?.message ?? "no response"}${error?.name ? ` (${error.name})` : ""}`, settings));
  return { provider: "resend", messageId: data.id };
}

/**
 * "Verify connection": SMTP `transport.verify()` (connect, TLS, AUTH); for
 * Resend, list the account's domains — which also tells us whether the From
 * address's domain is verified there. A sending-only Resend key cannot list
 * domains (`restricted_api_key`); that still proves the key is real.
 */
export async function verifyMailSettings(settings: MailSettings): Promise<{ ok: boolean; message: string }> {
  if (settings.provider === "log-only") return { ok: false, message: "Choose SMTP or Resend first — “Log only” sends nothing." };
  if (!settings.fromAddress) return { ok: false, message: "Enter the From address first." };

  if (settings.provider === "smtp") {
    const { host, port, user } = settings.smtp;
    if (!host) return { ok: false, message: "Enter the SMTP host first." };
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: settings.smtp.secure,
      auth: user ? { user, pass: settings.smtp.password } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    try {
      await transport.verify();
      return { ok: true, message: `Connected to ${host}:${port}${user ? ` and signed in as ${user}` : ""}.` };
    } catch (error) {
      const code = (error as { code?: string }).code;
      const hint =
        code === "EAUTH"
          ? "The server refused the username or password."
          : code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET" || code === "ECONNREFUSED" || code === "EDNS"
            ? `Could not reach ${host}:${port}. Check the host, the port and the TLS switch (465 = on, 587 = off).`
            : "The server did not accept the connection.";
      return { ok: false, message: `${hint} (${scrub(error, settings)})` };
    } finally {
      transport.close();
    }
  }

  if (!settings.resendApiKey) return { ok: false, message: "Enter the Resend API key first." };
  const { data, error } = await new Resend(settings.resendApiKey).domains.list();
  if (error) {
    if (error.name === "restricted_api_key") {
      return { ok: true, message: "The Resend key is valid (sending-only, so domains cannot be checked from here — make sure the From domain is verified in Resend)." };
    }
    return { ok: false, message: scrub(`Resend refused the key: ${error.message}`, settings) };
  }
  const fromDomain = settings.fromAddress.split("@")[1]?.toLowerCase() ?? "";
  const domains = (data?.data ?? []) as Array<{ name: string; status: string }>;
  const match = domains.find((domain) => domain.name.toLowerCase() === fromDomain);
  if (!match) return { ok: false, message: `The key works, but ${fromDomain || "the From domain"} is not a domain in this Resend account.` };
  if (match.status !== "verified") return { ok: false, message: `The key works, but ${fromDomain} is “${match.status}” in Resend — finish its DNS records first.` };
  return { ok: true, message: `The key works and ${fromDomain} is verified in Resend.` };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Payload's adapter                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

/** Attachments as Payload/nodemailer hand them to `sendEmail`, reduced to the in-memory kind we send. */
function messageAttachments(message: SendEmailOptions): Attachment[] {
  const list = Array.isArray(message.attachments) ? message.attachments : [];
  return list
    .filter((a): a is typeof a & { content: Buffer | string } => Boolean(a && (Buffer.isBuffer(a.content) || typeof a.content === "string")))
    .map((a) => ({
      filename: typeof a.filename === "string" ? a.filename : "attachment",
      content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(String(a.content)),
      contentType: typeof a.contentType === "string" ? a.contentType : "application/octet-stream",
    }));
}

/**
 * The pipeline row this send belongs to, if any: the `send-email` task
 * (3D) delivers a `notification-log` row through `payload.sendEmail`, i.e.
 * through this adapter, and that row must not gain a twin. A queued or
 * failed row with the same recipients and subject is that row. A send with
 * no such row is Payload's own (password reset, verification) and gets a
 * row of its own here.
 */
async function pendingRow(payload: Payload, to: string, subject: string): Promise<NotificationLog | null> {
  try {
    const found = await payload.find({
      collection: "notification-log",
      where: { and: [{ to: { equals: to } }, { subject: { equals: subject.slice(0, 200) } }, { status: { in: ["queued", "failed"] } }] },
      sort: "-createdAt",
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });
    return (found.docs[0] as NotificationLog | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * `email: runtimeEmailAdapter` in payload.config.ts. The defaults below are
 * placeholders Payload's auth emails read; every send replaces `from`,
 * `replyTo` and `bcc` with Settings → Email sending.
 *
 * Two kinds of caller arrive here. The `send-email` task delivering a
 * pipeline row (which keeps its own status bookkeeping; this adapter only
 * adds the attachments `sendTemplated` stored on disk for that row), and
 * Payload itself (forgot-password), which is logged here — without its
 * body, which carries a live reset token.
 */
export const runtimeEmailAdapter: EmailAdapter = ({ payload }) => ({
  name: "maison-runtime-mailer",
  defaultFromAddress: "no-reply@localhost",
  defaultFromName: "Maison Palettia",
  async sendEmail(message: SendEmailOptions) {
    const settings = await readMailSettings(payload);
    const to = normalizeRecipients(addressList(message.to as AddressLike));
    const subject = String(message.subject ?? "").replace(/\s+/g, " ").trim();
    const outgoing: OutgoingMessage = {
      to,
      subject,
      html: typeof message.html === "string" ? message.html : undefined,
      text: typeof message.text === "string" ? message.text : undefined,
      attachments: messageAttachments(message),
    };

    const pipeline = await pendingRow(payload, to.join(", "), subject);
    if (pipeline) {
      const pipelineId = String(pipeline.id);
      outgoing.attachments = [...(outgoing.attachments ?? []), ...(await readStoredAttachments(pipelineId))];
      outgoing.idempotencyKey = `notification-${pipelineId}-${(pipeline.attempts ?? 0) + 1}`;
      const result = await transportSend(settings, outgoing);
      if (!result.skipped) await fs.rm(path.join(ATTACHMENTS_DIR, pipelineId), { recursive: true, force: true }).catch(() => undefined);
      return result;
    }

    let logId: string | undefined;
    try {
      const row = await payload.create({
        collection: "notification-log",
        data: {
          channel: "email",
          to: to.join(", ") || "(none)",
          status: "queued",
          subject,
          attempts: 0,
          variables: { source: "payload", note: "Sent by Payload itself (e.g. password reset); the body is not stored." },
        },
        overrideAccess: true,
        depth: 0,
        context: { system: true },
      });
      logId = String(row.id);
    } catch (error) {
      payload.logger.warn({ err: error }, "mailer: could not log a Payload email");
    }
    const stamp = async (data: Partial<NotificationLog>) => {
      if (!logId) return;
      await payload
        .update({ collection: "notification-log", id: logId, data, overrideAccess: true, depth: 0, context: { system: true } })
        .catch((error: unknown) => payload.logger.warn({ err: error }, "mailer: could not update the log row"));
    };
    try {
      const result = await transportSend(settings, outgoing);
      await stamp(
        result.skipped
          ? { status: "skipped", provider: "log", error: "Email sending is set to “Log only”." }
          : { status: "sent", provider: result.provider, providerMessageId: result.messageId, attempts: 1, sentAt: new Date().toISOString() },
      );
      return result;
    } catch (error) {
      await stamp({ status: "failed", provider: settings.provider === "smtp" ? "smtp" : "resend", attempts: 1, error: scrub(error, settings) });
      throw error;
    }
  },
});

/* ────────────────────────────────────────────────────────────────────────── */
/* The pipeline                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

export type MailRefs = { order?: string; enquiry?: string; ticket?: string; refund?: string; session?: string };
const REF_KEYS = ["order", "enquiry", "ticket", "refund", "session"] as const;

function refFields(refs: Record<string, string | undefined> | undefined): Partial<Record<(typeof REF_KEYS)[number], string>> {
  const out: Partial<Record<(typeof REF_KEYS)[number], string>> = {};
  for (const key of REF_KEYS) {
    const value = refs?.[key];
    if (typeof value === "string" && value) out[key] = value;
  }
  return out;
}

const LOG_ONLY_NOTE = "Email sending is set to “Log only” (Settings → Email sending). Resend from here once a provider is verified.";

/** Writes a log row; a ref that no longer exists is dropped rather than losing the row. */
async function createLogRow(req: PayloadRequest, data: Partial<NotificationLog> & { to: string; status: NotificationLog["status"] }): Promise<NotificationLog> {
  const base = { channel: "email" as const, attempts: 0, ...data };
  try {
    return await req.payload.create({ collection: "notification-log", data: base, overrideAccess: true, depth: 0, req, context: { system: true } });
  } catch (error) {
    if (!REF_KEYS.some((key) => base[key])) throw error;
    const withoutRefs = { ...base };
    for (const key of REF_KEYS) delete withoutRefs[key];
    req.payload.logger.warn({ err: error }, "mailer: log row refused with its references; writing it without them");
    return req.payload.create({ collection: "notification-log", data: withoutRefs, overrideAccess: true, depth: 0, req, context: { system: true } });
  }
}

/**
 * SPEC §O `sendTemplated`. Renders now, logs (redacted), queues delivery.
 * Returns `skipped` when the template is turned off, the address is
 * invalid, or email is log-only — the row exists either way.
 */
export async function sendTemplated(
  req: PayloadRequest,
  input: { key: TemplateKey; to: string | string[]; vars: Record<string, unknown>; refs?: MailRefs; attachments?: Attachment[] },
): Promise<{ logId: string; status: "queued" | "skipped" }> {
  const recipients = normalizeRecipients(input.to);
  const rendered = await renderTemplate(req, input.key, input.vars ?? {});
  const settings = await readMailSettings(req.payload, req);

  let status: "queued" | "skipped" = "queued";
  let error: string | undefined;
  if (!recipients.length) {
    status = "skipped";
    error = "No valid recipient address.";
  } else if (rendered.template.enabled === false) {
    status = "skipped";
    error = "This email is turned off in Emails → Email templates.";
  } else if (settings.provider === "log-only") {
    status = "skipped";
    error = LOG_ONLY_NOTE;
  }

  const row = await createLogRow(req, {
    to: recipients.join(", ") || String(Array.isArray(input.to) ? input.to.join(", ") : (input.to ?? "")).slice(0, 320) || "(none)",
    status,
    templateKey: input.key,
    subject: rendered.subject.slice(0, 200),
    provider: settings.provider === "log-only" ? "log" : undefined,
    error,
    variables: redactVariables(input.vars ?? {}) as NotificationLog["variables"],
    html: rendered.html,
    text: rendered.text,
    ...refFields(input.refs),
  });
  const logId = String(row.id);

  if (input.attachments?.length) await storeAttachments(logId, input.attachments);
  if (status === "queued") await queueDelivery(req, logId);
  return { logId, status };
}

/** Queues `send-email { logId }` when 3D's task exists; until then delivers inline (same request, same transaction). */
export async function queueDelivery(req: PayloadRequest, logId: string): Promise<void> {
  const hasTask = (req.payload.config.jobs?.tasks ?? []).some((task) => task.slug === "send-email");
  if (hasTask) {
    await req.payload.jobs.queue({ task: "send-email" as never, input: { logId } as never, queue: "email", overrideAccess: true, req });
    return;
  }
  req.payload.logger.info({ logId }, "mailer: no send-email task registered yet; delivering inline");
  await deliverNotification(req, logId).catch(() => undefined); // the row records the failure
}

/* Attachments passed explicitly to sendTemplated outlive the request on disk until delivered. */
const ATTACHMENTS_DIR = path.join(PRIVATE_DIR, "mail-attachments");
const SAFE_ID = /^[A-Za-z0-9-]{8,64}$/;

async function storeAttachments(logId: string, attachments: Attachment[]): Promise<void> {
  if (!SAFE_ID.test(logId)) return;
  const dir = path.join(ATTACHMENTS_DIR, logId);
  await fs.mkdir(dir, { recursive: true });
  const manifest = await Promise.all(
    attachments.map(async (attachment, index) => {
      const file = `${index}.bin`;
      await fs.writeFile(path.join(dir, file), attachment.content);
      return { file, filename: attachment.filename, contentType: attachment.contentType };
    }),
  );
  await fs.writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest));
}

async function readStoredAttachments(logId: string): Promise<Attachment[]> {
  if (!SAFE_ID.test(logId)) return [];
  const dir = path.join(ATTACHMENTS_DIR, logId);
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(dir, "manifest.json"), "utf8")) as Array<{ file: string; filename: string; contentType: string }>;
    return Promise.all(
      manifest.map(async (entry) => ({
        filename: entry.filename,
        contentType: entry.contentType,
        content: await fs.readFile(path.join(dir, path.basename(entry.file))),
      })),
    );
  } catch {
    return [];
  }
}

async function copyStoredAttachments(fromLogId: string, toLogId: string): Promise<void> {
  const attachments = await readStoredAttachments(fromLogId);
  if (attachments.length) await storeAttachments(toLogId, attachments);
}

const relId = (value: unknown): string | undefined =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : undefined;

/**
 * The PDFs a template asks for, generated at send time from the log row's
 * references: the invoice (or, on a refund email, the credit note) and one
 * PDF with every valid ticket on the order. A missing order or a pass-only
 * order with no tickets sends without — the email itself still matters.
 */
async function templateAttachments(req: PayloadRequest, row: NotificationLog): Promise<{ attachments: Attachment[]; invoiceId?: string }> {
  const key = row.templateKey as TemplateKey | null | undefined;
  if (!key) return { attachments: [] };
  const template = await loadTemplate(req, key);
  const orderId = relId(row.order);
  const attachments: Attachment[] = [];
  let invoiceId: string | undefined;

  if (template.attachInvoice) {
    const pdf = await import("@/cms/lib/pdf/invoice");
    // A row about a refund carries THAT refund's credit note — never the original Tax Invoice in its
    // place (the order_refunded email says "your credit note is attached").
    const refundId = relId(row.refund);
    if (refundId) {
      const refund = await req.payload.findByID({ collection: "refunds", id: refundId, depth: 0, overrideAccess: true, req }).catch(() => null);
      invoiceId = relId(refund?.creditNote);
    } else if (orderId) {
      const order = await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req }).catch(() => null);
      invoiceId = relId(order?.invoice);
    }
    if (invoiceId) attachments.push(await pdf.invoiceAttachment(req, invoiceId));
  }

  if (template.attachTickets && orderId) {
    const { renderOrderTicketsPdf } = await import("@/cms/lib/pdf/ticket");
    const result = await renderOrderTicketsPdf(req, orderId);
    if (result) attachments.push({ filename: `tickets-${result.reference}.pdf`, content: result.pdf, contentType: "application/pdf" });
  }
  return { attachments, invoiceId };
}

/**
 * Sends one `notification-log` row (the `send-email` task's body). Already
 * `sent` or `skipped` → no-op, so a retried job never sends twice. On
 * failure the row is stamped `failed` with the scrubbed error and the error
 * is rethrown so the job's retry policy applies.
 */
export async function deliverNotification(req: PayloadRequest, logId: string): Promise<{ status: "sent" | "skipped"; providerMessageId?: string }> {
  const row = (await req.payload.findByID({ collection: "notification-log", id: logId, depth: 0, overrideAccess: true, req })) as NotificationLog;
  if (row.status === "sent" || row.status === "skipped") return { status: row.status === "sent" ? "sent" : "skipped", providerMessageId: row.providerMessageId ?? undefined };

  const settings = await readMailSettings(req.payload, req);
  const update = (data: Partial<NotificationLog>) =>
    req.payload.update({ collection: "notification-log", id: logId, data, overrideAccess: true, depth: 0, req, context: { system: true } });

  if (settings.provider === "log-only") {
    await update({ status: "skipped", provider: "log", error: LOG_ONLY_NOTE });
    return { status: "skipped" };
  }

  const attempts = (row.attempts ?? 0) + 1;
  try {
    const { attachments, invoiceId } = await templateAttachments(req, row);
    attachments.push(...(await readStoredAttachments(logId)));
    const result = await transportSend(settings, {
      to: normalizeRecipients(row.to),
      subject: row.subject ?? "",
      html: row.html ?? undefined,
      text: row.text ?? undefined,
      attachments,
      idempotencyKey: `notification-${logId}-${attempts}`,
    });
    await update({ status: "sent", provider: result.provider, providerMessageId: result.messageId ?? null, attempts, sentAt: new Date().toISOString(), error: null });
    await fs.rm(path.join(ATTACHMENTS_DIR, logId), { recursive: true, force: true }).catch(() => undefined);
    if (invoiceId) {
      await req.payload
        .update({ collection: "invoices", id: invoiceId, data: { emailedAt: new Date().toISOString() }, overrideAccess: true, depth: 0, req, context: { system: true } })
        .catch((error: unknown) => req.payload.logger.warn({ err: error, invoiceId }, "mailer: could not stamp invoices.emailedAt"));
    }
    return { status: "sent", providerMessageId: result.messageId };
  } catch (error) {
    const message = scrub(error, settings);
    await update({ status: "failed", provider: settings.provider === "smtp" ? "smtp" : "resend", attempts, error: message }).catch(() => undefined);
    throw new Error(message);
  }
}

/**
 * The **Resend** button on a log row (SPEC §D.5, `POST /api/actions/
 * notifications/{id}/resend`): a NEW row with the stored rendering, queued
 * like any other — so the log keeps both attempts. Rows whose content was
 * purged after 30 days cannot be resent from here (the order's own Resend
 * action renders afresh).
 */
export async function resendNotification(req: PayloadRequest, logId: string): Promise<{ logId: string; status: "queued" | "skipped" }> {
  const row = (await req.payload.findByID({ collection: "notification-log", id: logId, depth: 0, overrideAccess: true, req }).catch(() => null)) as NotificationLog | null;
  if (!row) throw new APIError("That email is not in the log.", 404, undefined, true);
  if (!row.html) throw new APIError("Expired — the content of this email was cleared after 30 days. Use the order's Resend action, which renders it afresh.", 410, undefined, true);
  const settings = await readMailSettings(req.payload, req);
  const status: "queued" | "skipped" = settings.provider === "log-only" ? "skipped" : "queued";
  const previous = row.variables && typeof row.variables === "object" && !Array.isArray(row.variables) ? row.variables : {};
  const copy = await createLogRow(req, {
    to: row.to,
    status,
    templateKey: row.templateKey,
    subject: row.subject,
    provider: status === "skipped" ? "log" : undefined,
    error: status === "skipped" ? LOG_ONLY_NOTE : undefined,
    variables: { ...previous, resentFrom: logId, resentBy: (req.user as { email?: string } | null)?.email ?? "system" },
    html: row.html,
    text: row.text,
    order: relId(row.order),
    session: relId(row.session),
    ticket: relId(row.ticket),
    refund: relId(row.refund),
    enquiry: relId(row.enquiry),
  });
  const newId = String(copy.id);
  await copyStoredAttachments(logId, newId);
  if (status === "queued") await queueDelivery(req, newId);
  return { logId: newId, status };
}

/**
 * Sends a rendered email NOW with the given settings and logs it — for the
 * admin's interactive buttons (Send test, Send me this), where the person
 * pressing waits for the provider's answer rather than a queued job.
 */
export async function sendNow(
  req: PayloadRequest,
  input: { key: TemplateKey; to: string; rendered: RenderedEmail; settings: MailSettings; vars?: Record<string, unknown> },
): Promise<{ ok: boolean; message: string; logId: string }> {
  const to = normalizeRecipients(input.to);
  const row = await createLogRow(req, {
    to: to.join(", ") || input.to || "(none)",
    status: "queued",
    templateKey: input.key,
    subject: input.rendered.subject,
    variables: redactVariables({ ...(input.vars ?? {}), source: "admin-button" }) as NotificationLog["variables"],
    html: input.rendered.html,
    text: input.rendered.text,
  });
  const logId = String(row.id);
  const update = (data: Partial<NotificationLog>) =>
    req.payload.update({ collection: "notification-log", id: logId, data, overrideAccess: true, depth: 0, req, context: { system: true } });
  if (!to.length) {
    await update({ status: "skipped", error: "No valid recipient address." });
    return { ok: false, message: "Enter a valid email address.", logId };
  }
  try {
    const result = await transportSend(input.settings, { to, subject: input.rendered.subject, html: input.rendered.html, text: input.rendered.text });
    if (result.skipped) {
      await update({ status: "skipped", provider: "log", error: LOG_ONLY_NOTE });
      return { ok: false, message: "Email is set to “Log only”, so nothing was sent. The message is in Emails → Sent emails.", logId };
    }
    await update({ status: "sent", provider: result.provider, providerMessageId: result.messageId ?? null, attempts: 1, sentAt: new Date().toISOString() });
    const via = result.provider === "smtp" ? "SMTP" : "Resend";
    return { ok: true, message: `Sent to ${to.join(", ")} via ${via}${result.messageId ? ` (id ${result.messageId})` : ""}.`, logId };
  } catch (error) {
    const message = scrub(error, input.settings);
    await update({ status: "failed", provider: input.settings.provider === "smtp" ? "smtp" : "resend", attempts: 1, error: message });
    return { ok: false, message: `Not sent: ${message}`, logId };
  }
}

/** The values the `test` template prints. */
export function testEmailVars(req: PayloadRequest, settings: MailSettings): Record<string, unknown> {
  return {
    sentBy: (req.user as { email?: string } | null)?.email ?? "an admin",
    provider: settings.provider === "smtp" ? `SMTP (${settings.smtp.host})` : settings.provider === "resend" ? "Resend" : "Log only",
    sentAt: formatDubai(new Date()),
  };
}

export { isStaffTemplate };
