// One-off: send the real order confirmation (working-tree layout) to a phone.
// Logos are embedded as cid: images because the dev site URL is localhost.
// Temporary — delete after the dark-mode check.
import config from "@payload-config";
import { createLocalReq, getPayload } from "payload";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { readFileSync, writeFileSync } from "node:fs";
import { readMailSettings } from "@/cms/lib/mailer";
import { renderTemplate } from "@/cms/lib/templates";
import { referencedDoodles } from "@/cms/email/doodles";
import { sampleVariables } from "@/cms/email/variables";

const SCRATCH = "/private/tmp/claude-501/-Users-apple-Desktop-Nexeor-maison-palettia-maison-palettia-design/33bffe4b-f210-42a0-8926-63398ef0adf9/scratchpad";
const to = process.argv.find((arg) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(arg));
const send = process.argv.includes("--send");

const payload = await getPayload({ config });
const req = await createLocalReq({}, payload);
const settings = await readMailSettings(payload, req);
const rendered = await renderTemplate(req, "order_confirmation", sampleVariables("order_confirmation"));

let html = rendered.html;
const logos: { cid: string; file: string }[] = [];
for (const [cls, cid, file] of [["mp-logo-light", "mp-logo-light", "scroll-logo.png"], ["mp-logo-dark", "mp-logo-dark", "logo.png"]] as const) {
  const re = new RegExp(`(<img class="${cls}" src=")([^"]+)(")`);
  if (re.test(html)) {
    html = html.replace(re, `$1cid:${cid}$3`);
    logos.push({ cid, file });
  }
}
writeFileSync(`${SCRATCH}/send-preview.html`, html);
const subject = `[Dark-mode test] ${rendered.subject}`;
console.log(JSON.stringify({ provider: settings.provider, from: settings.fromAddress, subject, logos: logos.map((l) => l.cid), doodles: referencedDoodles(html).length, to: to ?? null, send }));

if (send) {
  if (!to) throw new Error("Pass a recipient address.");
  const inline = [
    ...referencedDoodles(html).map((d) => ({ filename: `${d.cid}.png`, content: Buffer.from(d.base64, "base64"), contentType: "image/png", cid: d.cid })),
    ...logos.map((l) => ({ filename: l.file, content: readFileSync(`${SCRATCH}/${l.file}`), contentType: "image/png", cid: l.cid })),
  ];
  const from = settings.fromName ? `"${settings.fromName}" <${settings.fromAddress}>` : settings.fromAddress;
  if (settings.provider === "smtp") {
    const transport = nodemailer.createTransport({
      host: settings.smtp.host,
      port: settings.smtp.port,
      secure: settings.smtp.secure,
      auth: settings.smtp.user ? { user: settings.smtp.user, pass: settings.smtp.password } : undefined,
    });
    const info = await transport.sendMail({ from, to, subject, html, text: rendered.text, attachments: inline });
    console.log("sent via SMTP", info.messageId);
  } else if (settings.provider === "resend") {
    const { data, error } = await new Resend(settings.resendApiKey).emails.send({
      from, to, subject, html, text: rendered.text,
      attachments: inline.map(({ cid, ...rest }) => ({ ...rest, contentId: cid })),
    });
    if (error) throw new Error(error.message);
    console.log("sent via Resend", data?.id);
  } else {
    console.log("Email sending is set to Log only; nothing sent.");
  }
}
process.exit(0);
