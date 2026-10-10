/**
 * The string the admin sees in place of every stored secret (SPEC §C.2).
 *
 * It lives in its own file, without a single import, because it is needed on
 * both sides of the wire: the server (`cms/lib/crypto.ts`, the encryptedText
 * hooks) substitutes it on every read, and the client (`SecretField`) has to
 * recognise it to know the field is "set but untouched". `crypto.ts` pulls in
 * `node:crypto`, which a client component cannot import, so the one constant
 * they share sits here and is re-exported from both.
 *
 * Exactly eight bullets. Never derive the "set on <date>" text from the
 * value — that comes from the sibling `…SetAt` field.
 */
export const MASK = "••••••••" as const;
