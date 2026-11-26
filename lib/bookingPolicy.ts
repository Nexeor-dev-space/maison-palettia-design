/**
 * ==========================================================================
 * Booking Policy Validation & Notice Periods
 * ==========================================================================
 *
 * Implements the Maison Palettia Cancellation & Rescheduling Policy (SPEC §4,
 * lib/policies.ts lines 452–514).
 *
 * POLICY RULES (Cancellation, Rescheduling & Refund Policy, 27 Nov 2026):
 *   - At least 24 hours' notice: rescheduling is free and subject to
 *     availability.
 *   - Less than 24 hours before a session / no-show: non-refundable and
 *     cannot be rescheduled.
 *   - Management discretion: reasonable exceptions in genuine circumstances.
 *
 * CUSTOMER CANCELLATIONS ARE NEVER REFUNDED TO THE CARD. With 24h+ notice the
 * customer gets a credit note; under 24h it is non-refundable. A credit note
 * needs a validity period the team sets when issuing it, so a 24h+
 * cancellation is not self-serve: `selfServe` is false and the cancel route
 * refuses it, pointing the customer to email, Call or WhatsApp (the "How to
 * cancel or reschedule" section of the published policy). Only the
 * non-refundable (< 24h) cancellation can be done online, since releasing the
 * seats needs no money decision. The windows 24–48h and 48h+ are kept as
 * names only; both get the same outcome and wording.
 */

export type NoticeWindow = "passed" | "under_24h" | "between_24h_48h" | "over_48h";

export interface CancellationPolicyResult {
  eligible: boolean;
  noticeHours: number;
  window: NoticeWindow;
  /** 24h+ notice: the cancellation is settled with a credit note (never a card refund). */
  creditNoteEligible: boolean;
  /** The customer can complete this cancellation online (only the non-refundable, < 24h case). */
  selfServe: boolean;
  message: string;
  policyNote: string;
  exceptionNote?: string;
}

export interface ReschedulePolicyResult {
  eligible: boolean;
  noticeHours: number;
  window: NoticeWindow;
  message: string;
  policyNote: string;
  exceptionNote?: string;
}

export function getNoticeHours(startsAt: string | Date | null | undefined, now: Date = new Date()): number {
  if (!startsAt) return 0;
  const startMs = typeof startsAt === "string" ? new Date(startsAt).getTime() : startsAt.getTime();
  if (Number.isNaN(startMs)) return 0;
  return (startMs - now.getTime()) / (1000 * 60 * 60);
}

export function getNoticeWindow(hours: number): NoticeWindow {
  if (hours <= 0) return "passed";
  if (hours < 24) return "under_24h";
  if (hours < 48) return "between_24h_48h";
  return "over_48h";
}

/** Shown for a 24h+ cancellation, which our team completes by issuing a credit note. */
export const CREDIT_NOTE_MESSAGE =
  "You are cancelling more than 24 hours before the session, so you are entitled to a credit note for the full amount you paid, redeemable against future bookings within the validity period stated on it. We do not give cash or card refunds for cancellations. To cancel and receive your credit note, please contact our team by email, Call or WhatsApp, quoting your booking reference. You can also reschedule online to another available date instead.";

const EXCEPTION_NOTE =
  "Maison Palettia may make reasonable exceptions in genuine circumstances at management discretion. If you have exceptional circumstances, please contact our team.";

/**
 * Validates cancellation eligibility and refund outcome according to the policy.
 */
export function checkCancellationPolicy(
  startsAt: string | Date | null | undefined,
  now: Date = new Date(),
): CancellationPolicyResult {
  const noticeHours = getNoticeHours(startsAt, now);
  const window = getNoticeWindow(noticeHours);

  switch (window) {
    case "passed":
      return {
        eligible: false,
        noticeHours,
        window,
        creditNoteEligible: false,
        selfServe: false,
        message: "This session has already taken place and can no longer be cancelled.",
        policyNote: "Past sessions cannot be cancelled.",
        exceptionNote: EXCEPTION_NOTE,
      };

    case "under_24h":
      return {
        eligible: true,
        noticeHours,
        window,
        creditNoteEligible: false,
        selfServe: true,
        message:
          "Important: This cancellation is being requested less than 24 hours before the session. Under our Cancellation, Rescheduling & Refund Policy, cancellations made less than 24 hours in advance are non-refundable and no credit note is issued. Your seat(s) will be released.",
        policyNote: "Less than 24 hours notice: Non-refundable cancellation, no credit note.",
        exceptionNote: EXCEPTION_NOTE,
      };

    case "between_24h_48h":
    case "over_48h":
    default:
      return {
        eligible: true,
        noticeHours,
        window,
        creditNoteEligible: true,
        selfServe: false,
        message: CREDIT_NOTE_MESSAGE,
        policyNote: "24+ hours' notice: cancellation is settled with a credit note for the amount paid.",
      };
  }
}

/**
 * Validates rescheduling eligibility according to the policy.
 */
export function checkReschedulePolicy(
  startsAt: string | Date | null | undefined,
  now: Date = new Date(),
): ReschedulePolicyResult {
  const noticeHours = getNoticeHours(startsAt, now);
  const window = getNoticeWindow(noticeHours);

  switch (window) {
    case "passed":
      return {
        eligible: false,
        noticeHours,
        window,
        message: "This session has already taken place and can no longer be rescheduled.",
        policyNote: "Past sessions cannot be rescheduled.",
        exceptionNote: EXCEPTION_NOTE,
      };

    case "under_24h":
      return {
        eligible: false,
        noticeHours,
        window,
        message:
          "Rescheduling requires at least 24 hours' notice. Under our Cancellation, Rescheduling & Refund Policy, bookings cannot be rescheduled less than 24 hours before the session.",
        policyNote: "Less than 24 hours notice: Non-transferable / cannot be rescheduled.",
        exceptionNote: EXCEPTION_NOTE,
      };

    case "between_24h_48h":
      return {
        eligible: true,
        noticeHours,
        window,
        message:
          "Rescheduling is free with at least 24 hours' notice, subject to availability. You can choose any available date and time for this workshop.",
        policyNote: "24+ hours' notice: rescheduling is free, subject to availability.",
      };

    case "over_48h":
    default:
      return {
        eligible: true,
        noticeHours,
        window,
        message:
          "Rescheduling is free with at least 24 hours' notice, subject to availability. You can choose any available date and time for this workshop.",
        policyNote: "24+ hours' notice: rescheduling is free, subject to availability.",
      };
  }
}
