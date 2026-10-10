/**
 * ==========================================================================
 * Check-in client helpers — response types, fetch, formatting, feedback
 * ==========================================================================
 *
 * Shared by the scanner desk (/admin/check-in) and the session's attendee
 * list. The types mirror the JSON that cms/endpoints/tickets.ts builds
 * field by field; they are written out here rather than imported from
 * cms/lib/tickets.ts so the browser bundle never reaches for a server
 * module, even by accident.
 *
 * Feedback is deliberately physical: a door is loud and the phone is in a
 * hand, so every verdict plays a tone (WebAudio — no sound files) and
 * vibrates where the device can. "Welcome" is one short high beep; anything
 * that needs a second look is two mid beeps; a ticket that must not pass is
 * one long low tone.
 */

import { useSyncExternalStore } from "react";

export type Verdict = "ok" | "already_checked_in" | "void" | "refunded" | "wrong_day" | "not_found";
export type Device = "camera" | "manual" | "list";

export interface CheckInResponse {
  verdict: Verdict;
  forced: boolean;
  forceable: boolean;
  code: string | null;
  ticketId: string | null;
  orderId: string | null;
  orderReference: string | null;
  sessionId: string | null;
  sessionTitle: string | null;
  sessionStartsAt: string | null;
  window: { opensAt: string; closesAt: string } | null;
  holder: string | null;
  seatNo: number | null;
  qty: number | null;
  remainingOnOrder: number | null;
  checkedInAt: string | null;
  checkedInByName: string | null;
}

export interface AttendeeRow {
  ticketId: string;
  code: string;
  status: "valid" | "checked_in" | "void" | "refunded";
  holder: string;
  orderId: string | null;
  orderReference: string;
  seatNo: number;
  qty: number;
  email: string;
  phone: string;
  notes: string;
  checkedInAt: string | null;
  checkedInByName: string | null;
  forced: boolean;
}

export interface DaySession {
  id: string;
  title: string;
  startsAt: string;
  venue: string;
  status: string;
  sold: number;
  checkedIn: number;
  seatsTotal: number;
}

export type Tone = "ok" | "warn" | "stop";

export const toneOf = (verdict: Verdict): Tone =>
  verdict === "ok" ? "ok" : verdict === "already_checked_in" || verdict === "wrong_day" ? "warn" : "stop";

/** `fetch` against `/api/actions/tickets/...` with the admin cookie; Payload's `{ errors: [{ message }] }` becomes an Error. */
export async function callApi<T>(apiBase: string, path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    method: init.method ?? "GET",
    credentials: "include",
    cache: "no-store",
    headers: init.body === undefined ? undefined : { "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = (await res.json().catch(() => null)) as { errors?: Array<{ message?: string }> } | null;
  if (!res.ok) {
    const message = data?.errors?.[0]?.message || (res.status === 401 ? "Your sign-in has expired — reload the page." : `Request failed (${res.status}).`);
    throw new Error(message);
  }
  return data as T;
}

const TZ = "Asia/Dubai";
export const fmtTime = (iso: string | null | undefined): string =>
  iso ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "";
export const fmtDay = (iso: string | null | undefined): string =>
  iso ? new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }).format(new Date(iso)) : "";
export const fmtDayLong = (date: string): string =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00+04:00`));

let audio: AudioContext | null = null;

function tone(freq: number, ms: number, at = 0) {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const t0 = audio.currentTime + at;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + ms / 1000 + 0.02);
}

/** Call from a click handler once, so mobile browsers allow sound afterwards. */
export function unlockAudio() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!audio && Ctx) audio = new Ctx();
    void audio?.resume();
  } catch {
    audio = null;
  }
}

export function feedback(t: Tone, sound: boolean) {
  try {
    if (sound) {
      unlockAudio();
      if (t === "ok") tone(1046, 140);
      else if (t === "warn") {
        tone(660, 120);
        tone(660, 120, 0.18);
      } else tone(196, 450);
    }
    navigator.vibrate?.(t === "ok" ? 80 : t === "warn" ? [80, 60, 80] : 350);
  } catch {
    /* feedback is a courtesy; never let it break a scan */
  }
}

// ─── per-device preferences (camera on, sound on) ───────────────────────────
// Read through useSyncExternalStore so the server render (no storage) and
// the first client render agree, and every component using a key sees a
// change at once. Storage may be blocked (private mode): the fallback wins.

const PREF_EVENT = "mp-checkin-pref";

function readPref(key: string, fallback: boolean): boolean {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v === "on";
  } catch {
    return fallback;
  }
}

function subscribePref(callback: () => void) {
  window.addEventListener(PREF_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PREF_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function usePref(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribePref,
    () => readPref(key, fallback),
    () => fallback,
  );
  const set = (next: boolean) => {
    try {
      window.localStorage.setItem(key, next ? "on" : "off");
    } catch {
      /* not remembered on this device */
    }
    window.dispatchEvent(new Event(PREF_EVENT));
  };
  return [value, set];
}

const noSubscribe = () => () => {};

/** Whether this page may ask for the camera: a secure context (https or localhost) with getUserMedia. */
export function useCameraCapable(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => window.isSecureContext !== false && Boolean(navigator.mediaDevices?.getUserMedia),
    () => true,
  );
}
