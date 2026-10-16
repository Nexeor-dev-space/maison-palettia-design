/**
 * ==========================================================================
 * Booking Policy Validation & Notice Periods
 * ==========================================================================
 *
 * Implements the Maison Palettia Cancellation & Rescheduling Policy (SPEC §4,
 * lib/policies.ts lines 452–514).
 *
 * POLICY RULES:
 *   - Notice requested: 48 hours.
 *   - Less than 24 hours before a session / no-show: non-refundable and
 *     non-transferable (cannot be rescheduled).
 *   - Where notice is given in good time (>= 24h): rescheduling is free and
 *     subject to availability; cancellations are eligible for a refund.
 *   - Management discretion: reasonable exceptions in genuine circumstances.
 */

export type NoticeWindow = "passed" | "under_24h" | "between_24h_48h" | "over_48h";

export interface CancellationPolicyResult {
  eligible: boolean;
  noticeHours: number;
  window: NoticeWindow;
  refundEligible: boolean;
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
        refundEligible: false,
        message: "This session has already taken place and can no longer be cancelled.",
        policyNote: "Past sessions cannot be cancelled.",
        exceptionNote: EXCEPTION_NOTE,
      };

    case "under_24h":
      return {
        eligible: true,
        noticeHours,
        window,
        refundEligible: false,
        message:
          "Important: This cancellation is being requested less than 24 hours before the session. Under our Cancellation & Rescheduling policy, requests made less than 24 hours in advance are non-refundable. Your seat(s) will be released, but no refund will be issued.",
        policyNote: "Less than 24 hours notice: Non-refundable cancellation.",
        exceptionNote: EXCEPTION_NOTE,
      };

    case "between_24h_48h":
      return {
        eligible: true,
        noticeHours,
        window,
        refundEligible: true,
        message:
          "We kindly ask for at least 48 hours' notice if you need to cancel, but your request is within the eligible window (more than 24 hours before the session). Your seat(s) will be released and a full refund will be processed to your original payment method.",
        policyNote: "24–48 hours notice: Eligible for full refund (48h advance notice requested).",
      };

    case "over_48h":
    default:
      return {
        eligible: true,
        noticeHours,
        window,
        refundEligible: true,
        message:
          "Your booking is eligible for a full refund under our policy (48+ hours notice provided). Your seat(s) will be released and a full refund will be processed to your original payment method.",
        policyNote: "48+ hours notice: Eligible for full refund.",
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
          "Rescheduling requires at least 24 hours' advance notice. Under our Cancellation & Rescheduling policy, bookings cannot be rescheduled or transferred less than 24 hours before the session.",
        policyNote: "Less than 24 hours notice: Non-transferable / cannot be rescheduled.",
        exceptionNote: EXCEPTION_NOTE,
      };

    case "between_24h_48h":
      return {
        eligible: true,
        noticeHours,
        window,
        message:
          "We kindly ask for 48 hours' notice for rescheduling, but your booking is within the eligible window (more than 24 hours before the session). Rescheduling to an alternative date of the same workshop is free, subject to seat availability.",
        policyNote: "24–48 hours notice: Rescheduling is free and subject to availability (48h requested).",
      };

    case "over_48h":
    default:
      return {
        eligible: true,
        noticeHours,
        window,
        message:
          "Rescheduling is free and subject to availability. You can choose any available date and time for this workshop.",
        policyNote: "48+ hours notice: Rescheduling is free and subject to availability.",
      };
  }
}
