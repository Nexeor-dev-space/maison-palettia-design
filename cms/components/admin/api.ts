/**
 * ==========================================================================
 * callAction — one fetch for every admin button (4B)
 * ==========================================================================
 *
 * The order, session and staff dialogs all talk to `/api/actions/**` the
 * same way: JSON in, JSON out, the admin cookie along, and Payload's
 * `{ errors: [{ message }] }` turned into an Error whose message is fit to
 * show ("At most AED 240.00 can still be refunded on this order."). A
 * 401 means the session expired, which is said plainly instead of
 * "Request failed (401)".
 *
 * Client-safe: no Payload imports, nothing from cms/lib.
 */

export class ActionError extends Error {
  constructor(
    message: string,
    public status: number,
    public reason?: string,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

type ErrorBody = { errors?: Array<{ message?: string; data?: { reason?: string } }>; message?: string };

export async function callAction<T>(apiBase: string, path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBase}${path}`, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      credentials: "include",
      cache: "no-store",
      headers: init.body === undefined ? undefined : { "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ActionError("Could not reach the server — check the connection and try again.", 0);
  }
  const data = (await res.json().catch(() => null)) as (ErrorBody & T) | null;
  if (!res.ok) {
    const first = data?.errors?.[0];
    const message = first?.message || data?.message || (res.status === 401 ? "Your sign-in has expired — reload the page and sign in again." : `The server answered ${res.status}.`);
    throw new ActionError(message, res.status, first?.data?.reason);
  }
  return data as T;
}

/** Fils → "AED 240.00" without pulling cms/lib/money into the client bundle. */
export const aed = (fils: number): string => `AED ${(fils / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "AED 12.50" typed by a person → fils, or null when it is not a number. */
export function parseAed(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

const TZ = "Asia/Dubai";

export const fmtWhen = (iso: string | null | undefined): string =>
  iso ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "";

export const fmtDate = (iso: string | null | undefined): string =>
  iso ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : "";

/** An ISO instant → the `datetime-local` value in Dubai time (what the picker shows). */
export function toDubaiLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
}

/** The `datetime-local` value (Dubai time) → an ISO instant. GST has no daylight saving, so +04:00 always holds. */
export const fromDubaiLocal = (local: string): string | null => (local ? new Date(`${local}:00+04:00`).toISOString() : null);

/** A per-opening key the refund endpoint uses to make a double click harmless. */
export function freshKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
