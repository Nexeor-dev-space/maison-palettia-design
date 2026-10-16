import { regexes } from "zod";

const NAME_PATTERN = new RegExp("^[\\p{L}\\p{M}]+(?:[ '\\u2019.-]+[\\p{L}\\p{M}]+)*\\.?$", "u");
const PHONE_CHARACTERS = /^\+?[\d\s().-]+$/;
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

export const NAME_FORMAT_MESSAGE = "Please use letters only, without numbers or symbols.";
export const PHONE_FORMAT_MESSAGE = "Please use digits only. Spaces, +, - and brackets are fine.";

export function isValidName(value: string): boolean {
  return NAME_PATTERN.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return regexes.email.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const phone = value.trim();
  if (!PHONE_CHARACTERS.test(phone)) return false;
  const digits = phone.replace(/\D/g, "").length;
  return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
}
