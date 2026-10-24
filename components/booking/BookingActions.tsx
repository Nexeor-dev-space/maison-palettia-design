"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { OrderView } from "@/components/booking/orderView";
import { BlobButton } from "@/components/ui/BlobButton";
import {
  checkCancellationPolicy,
  checkReschedulePolicy,
  getNoticeHours,
} from "@/lib/bookingPolicy";
import { pauseScroller, resumeScroller } from "@/lib/scroll";

interface RescheduleSessionOption {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes?: number;
  venueName?: string | null;
  availableSeats: number;
  priceFils: number;
}

interface RescheduleOptionsResponse {
  eligible: boolean;
  reason?: string;
  message?: string;
  policyNote?: string;
  exceptionNote?: string;
  seatsNeeded?: number;
  currentSession?: {
    id: string;
    title: string;
    startsAt: string;
    durationMinutes?: number;
    venueName?: string;
  };
  sessions?: RescheduleSessionOption[];
}

const ZONE = "Asia/Dubai";

function formatDate(startsAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONE,
  }).format(new Date(startsAt));
}

function formatTime(startsAt: string, durationMinutes?: number) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: ZONE,
  });
  const start = new Date(startsAt);
  if (!durationMinutes) return fmt.format(start);
  return `${fmt.format(start)} – ${fmt.format(new Date(start.getTime() + durationMinutes * 60_000))}`;
}

export function BookingActions({
  view,
  k,
  customerEmail,
  onBookingUpdated,
}: {
  view: OrderView;
  k?: string;
  customerEmail?: string;
  onBookingUpdated: (
    updatedView: OrderView,
    notice: { text: string; tone: "ok" | "warn" | "terracotta" },
  ) => void;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [rescheduleOptions, setRescheduleOptions] = useState<RescheduleOptionsResponse | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cancelTriggerRef = useRef<HTMLButtonElement>(null);
  const rescheduleTriggerRef = useRef<HTMLButtonElement>(null);

  const cancelDialogId = useId();
  const rescheduleDialogId = useId();

  const sessionLine = view.detail?.lines.find((l) => l.kind === "session");
  const isConfirmed = view.status === "confirmed";
  const startsAt = sessionLine?.startsAt;

  const cancelPolicy = checkCancellationPolicy(startsAt);
  const reschedulePolicy = checkReschedulePolicy(startsAt);
  const hoursUntil = getNoticeHours(startsAt);

  // Focus trap, Escape listener, body scroll lock, and Lenis scroller pause for dialogs
  useEffect(() => {
    if (!cancelOpen && !rescheduleOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pauseScroller();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (cancelOpen && !cancelling) {
          setCancelOpen(false);
          cancelTriggerRef.current?.focus();
        }
        if (rescheduleOpen && !rescheduling) {
          setRescheduleOpen(false);
          rescheduleTriggerRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      resumeScroller();
    };
  }, [cancelOpen, rescheduleOpen, cancelling, rescheduling]);

  // Load reschedule options when dialog opens
  useEffect(() => {
    if (!rescheduleOpen) return;
    setSelectedSessionId(null);
    setRescheduleError(null);
    setLoadingOptions(true);

    const emailParam = customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : "";
    const kParam = k ? `?k=${encodeURIComponent(k)}` : emailParam ? `?${emailParam.slice(1)}` : "";
    const fullUrl = `/api/site/orders/${encodeURIComponent(view.reference)}/reschedule-options${kParam}${k ? emailParam : ""}`;

    fetch(fullUrl, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as RescheduleOptionsResponse;
        if (!res.ok && !data.eligible) {
          setRescheduleOptions(data);
        } else if (!res.ok) {
          setRescheduleError(data.message || "Could not retrieve available sessions.");
        } else {
          setRescheduleOptions(data);
        }
      })
      .catch(() => {
        setRescheduleError("Network error while finding alternative dates. Please try again.");
      })
      .finally(() => {
        setLoadingOptions(false);
      });
  }, [rescheduleOpen, view.reference, k, customerEmail]);

  async function handleConfirmCancel() {
    if (cancelling) return;
    setCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/site/orders/${encodeURIComponent(view.reference)}/cancel`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          k,
          email: customerEmail,
          reason: cancelReason.trim() || undefined,
        }),
      });

      const body = (await res.json()) as {
        ok?: boolean;
        message?: string;
        refundStatus?: string;
        orderView?: OrderView;
      };

      if (!res.ok) {
        setCancelError(body.message || "Could not cancel booking. Please try again.");
        setCancelling(false);
        return;
      }

      setCancelOpen(false);
      const isNonRefundable = body.refundStatus === "non_refundable";
      const updatedView: OrderView = body.orderView ?? {
        ...view,
        status: "cancelled",
      };

      onBookingUpdated(updatedView, {
        text: body.message || "Your booking has been cancelled.",
        tone: isNonRefundable ? "warn" : "ok",
      });
    } catch {
      setCancelError("A network error occurred while cancelling. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  async function handleConfirmReschedule() {
    if (!selectedSessionId || rescheduling) return;
    setRescheduling(true);
    setRescheduleError(null);

    try {
      const res = await fetch(`/api/site/orders/${encodeURIComponent(view.reference)}/reschedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          k,
          email: customerEmail,
          targetSessionId: selectedSessionId,
        }),
      });

      const body = (await res.json()) as {
        ok?: boolean;
        message?: string;
        orderView?: OrderView;
      };

      if (!res.ok) {
        setRescheduleError(body.message || "Could not reschedule booking. Please try again.");
        setRescheduling(false);
        return;
      }

      setRescheduleOpen(false);
      const selectedSession = rescheduleOptions?.sessions?.find((s) => s.id === selectedSessionId);
      const successMessage = selectedSession
        ? `Your booking has been rescheduled to ${formatDate(selectedSession.startsAt)} at ${formatTime(selectedSession.startsAt, selectedSession.durationMinutes)}.`
        : body.message || "Your booking has been successfully rescheduled.";

      const updatedView: OrderView = body.orderView ?? {
        ...view,
        isRescheduled: true,
        detail: view.detail
          ? {
              ...view.detail,
              lines: view.detail.lines.map((l) =>
                l.kind === "session" && selectedSession
                  ? {
                      ...l,
                      startsAt: selectedSession.startsAt,
                      durationMinutes: selectedSession.durationMinutes ?? l.durationMinutes,
                      venueName: selectedSession.venueName ?? l.venueName,
                    }
                  : l,
              ),
              tickets: view.detail.tickets.map((t) => ({
                ...t,
                startsAt: selectedSession?.startsAt ?? t.startsAt,
                venueName: selectedSession?.venueName ?? t.venueName,
              })),
            }
          : undefined,
      };

      onBookingUpdated(updatedView, {
        text: successMessage,
        tone: "ok",
      });
    } catch {
      setRescheduleError("A network error occurred while rescheduling. Please try again.");
    } finally {
      setRescheduling(false);
    }
  }

  // If the booking is not confirmed or has no session lines, actions are hidden or disabled
  if (!isConfirmed || !sessionLine) {
    if (view.status === "cancelled") {
      return (
        <div className="mt-6 border-l-2 border-terracotta/40 bg-cream/40 p-5">
          <p className="text-body font-medium text-text">Booking cancelled</p>
          <p className="mt-1 text-fine text-text/75">
            This booking is cancelled and can no longer be modified. If you need assistance, please{" "}
            <Link href="/contact" className="border-b border-terracotta pb-0.5 hover:text-terracotta">
              contact our team
            </Link>
            .
          </p>
        </div>
      );
    }
    return null;
  }

  const selectedSession = rescheduleOptions?.sessions?.find((s) => s.id === selectedSessionId);

  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">Manage booking</p>
          <p className="mt-1 text-fine text-text/70">
            {hoursUntil < 24 && hoursUntil > 0
              ? "Session is in less than 24 hours. Rescheduling is closed; cancellations are non-refundable."
              : hoursUntil <= 0
                ? "This session has taken place."
                : "Need to change plans? You can reschedule to another date or cancel your booking."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Reschedule Button */}
          {reschedulePolicy.eligible ? (
            <button
              ref={rescheduleTriggerRef}
              type="button"
              onClick={() => {
                setRescheduleError(null);
                setRescheduleOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-full border border-primary bg-primary px-5 py-2.5 text-action font-medium uppercase tracking-eyebrow text-white transition-all duration-300 ease-soft hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Reschedule booking
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={reschedulePolicy.message}
              className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-line bg-transparent px-5 py-2.5 text-action font-medium uppercase tracking-eyebrow text-text/40"
            >
              Reschedule booking
            </button>
          )}

          {/* Cancel Button */}
          {cancelPolicy.eligible ? (
            <button
              ref={cancelTriggerRef}
              type="button"
              onClick={() => {
                setCancelError(null);
                setCancelReason("");
                setCancelOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-full border border-terracotta/40 bg-transparent px-5 py-2.5 text-action font-medium uppercase tracking-eyebrow text-terracotta transition-colors duration-300 ease-soft hover:border-terracotta hover:bg-terracotta/10 focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2"
            >
              Cancel booking
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={cancelPolicy.message}
              className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-line bg-transparent px-5 py-2.5 text-action font-medium uppercase tracking-eyebrow text-text/40"
            >
              Cancel booking
            </button>
          )}
        </div>
      </div>

      {/* Policy restriction callout when rescheduling is disabled under 24 hours */}
      {!reschedulePolicy.eligible && hoursUntil > 0 && hoursUntil < 24 ? (
        <p className="mt-3 text-fine text-text/75">
          <span className="font-medium text-terracotta">Notice:</span> {reschedulePolicy.message}{" "}
          <Link href="/contact" className="border-b border-terracotta/50 pb-0.5 hover:border-terracotta">
            Contact us
          </Link>{" "}
          for genuine emergencies under management discretion.
        </p>
      ) : null}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CANCEL CONFIRMATION DIALOG                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CANCEL CONFIRMATION DIALOG                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {cancelOpen && mounted
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${cancelDialogId}-title`}
              aria-describedby={`${cancelDialogId}-desc`}
              data-lenis-prevent
              className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto"
            >
              {/* Backdrop */}
              <div
                onClick={() => !cancelling && setCancelOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              />

              {/* Dialog Container */}
              <div
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                className="relative z-10 my-auto max-h-[85vh] w-full max-w-2xl lg:max-w-3xl overflow-y-auto overscroll-contain rounded-2xl bg-cream p-7 shadow-2xl md:p-9 border border-line"
              >
                <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
                  <h2 id={`${cancelDialogId}-title`} className="text-display-md text-text">
                    Cancel this booking?
                  </h2>
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => setCancelOpen(false)}
                    aria-label="Close dialog"
                    className="rounded-full p-2 text-text/60 transition-colors hover:bg-black/5 hover:text-text"
                  >
                    ✕
                  </button>
                </div>

                <div id={`${cancelDialogId}-desc`} className="mt-5">
                  <div className="rounded-xl bg-sage/50 p-5 border border-line/60">
                    <p className="text-label font-medium uppercase tracking-eyebrow text-text/80">
                      {sessionLine.title}
                    </p>
                    {sessionLine.startsAt ? (
                      <p className="mt-1 text-lead font-medium text-text">
                        {formatDate(sessionLine.startsAt)} · {formatTime(sessionLine.startsAt, sessionLine.durationMinutes)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-body text-text/70">
                      {sessionLine.qty} {sessionLine.qty === 1 ? "seat" : "seats"}
                      {sessionLine.venueName ? ` · ${sessionLine.venueName}` : ""}
                    </p>
                  </div>

                  {/* Policy Outcome Callout */}
                  <div
                    className={`mt-5 rounded-xl p-5 border ${
                      cancelPolicy.refundEligible
                        ? "border-primary/40 bg-primary/5"
                        : "border-terracotta/50 bg-terracotta/10"
                    }`}
                  >
                    <p
                      className={`text-label font-medium uppercase tracking-eyebrow ${
                        cancelPolicy.refundEligible ? "text-primary" : "text-terracotta"
                      }`}
                    >
                      {cancelPolicy.refundEligible
                        ? cancelPolicy.window === "over_48h"
                          ? "Eligible for full refund"
                          : "Eligible for refund (24h+ notice)"
                        : "Non-refundable cancellation (< 24h notice)"}
                    </p>
                    <p className="mt-2 text-body text-text/90 leading-relaxed">{cancelPolicy.message}</p>
                    {cancelPolicy.exceptionNote ? (
                      <p className="mt-3 text-fine text-text/75 italic">{cancelPolicy.exceptionNote}</p>
                    ) : null}
                  </div>

                  {/* Optional reason */}
                  <div className="mt-6">
                    <label
                      htmlFor={`${cancelDialogId}-reason`}
                      className="block text-label font-medium uppercase tracking-eyebrow text-text/75"
                    >
                      Reason for cancellation (optional)
                    </label>
                    <input
                      id={`${cancelDialogId}-reason`}
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g. Change of plans, illness"
                      maxLength={200}
                      className="mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-2.5 text-body text-text placeholder:text-text/40 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {cancelError ? (
                    <p role="alert" className="mt-4 border-l-2 border-terracotta pl-4 text-fine text-terracotta">
                      {cancelError}
                    </p>
                  ) : null}
                </div>

                {/* Dialog Actions */}
                <div className="mt-8 flex flex-wrap items-center justify-end gap-4 border-t border-line pt-5">
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => setCancelOpen(false)}
                    className="px-5 py-2.5 text-action font-medium uppercase tracking-eyebrow text-text/80 transition-colors hover:text-text"
                  >
                    Keep booking
                  </button>

                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={handleConfirmCancel}
                    className="inline-flex items-center justify-center rounded-full bg-terracotta px-6 py-3 text-action font-medium uppercase tracking-eyebrow text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling…" : "Confirm cancellation"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RESCHEDULE MODAL                                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {rescheduleOpen && mounted
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${rescheduleDialogId}-title`}
              aria-describedby={`${rescheduleDialogId}-desc`}
              data-lenis-prevent
              className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto"
            >
              {/* Backdrop */}
              <div
                onClick={() => !rescheduling && setRescheduleOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              />

              {/* Dialog Container */}
              <div
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                className="relative z-10 my-auto max-h-[85vh] w-full max-w-2xl lg:max-w-3xl overflow-y-auto overscroll-contain rounded-2xl bg-cream p-7 shadow-2xl md:p-9 border border-line"
              >
                <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
                  <h2 id={`${rescheduleDialogId}-title`} className="text-display-md text-text">
                    Reschedule your booking
                  </h2>
                  <button
                    type="button"
                    disabled={rescheduling}
                    onClick={() => setRescheduleOpen(false)}
                    aria-label="Close dialog"
                    className="rounded-full p-2 text-text/60 transition-colors hover:bg-black/5 hover:text-text"
                  >
                    ✕
                  </button>
                </div>

                <div id={`${rescheduleDialogId}-desc`} className="mt-5">
                  {/* Current slot reminder */}
                  <div className="rounded-xl bg-sage/40 p-5 border border-line/60">
                    <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
                      Current booking
                    </p>
                    <p className="mt-1 text-lead font-medium text-text">{sessionLine.title}</p>
                    {sessionLine.startsAt ? (
                      <p className="mt-0.5 text-body text-text/85">
                        {formatDate(sessionLine.startsAt)} · {formatTime(sessionLine.startsAt, sessionLine.durationMinutes)}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-fine text-text/70">
                      {sessionLine.qty} {sessionLine.qty === 1 ? "seat" : "seats"}
                      {sessionLine.venueName ? ` · ${sessionLine.venueName}` : ""}
                    </p>
                  </div>

                  {/* Policy note */}
                  {hoursUntil >= 24 && hoursUntil < 48 ? (
                    <p className="mt-4 text-fine text-text/80 bg-sage/30 p-3 rounded-lg border border-line/50">
                      <span className="font-medium text-primary">Notice window:</span> We kindly ask for 48 hours&apos;
                      notice, but as your session is more than 24 hours away, rescheduling is free and eligible.
                    </p>
                  ) : null}

                  {/* Available alternative dates */}
                  <div className="mt-6">
                    <p className="text-label font-medium uppercase tracking-eyebrow text-text">
                      Choose a new date and time
                    </p>

                    {loadingOptions ? (
                      <div className="mt-4 flex items-center justify-center py-8">
                        <p className="text-body text-text/60">Finding available workshop sessions…</p>
                      </div>
                    ) : rescheduleOptions?.sessions && rescheduleOptions.sessions.length > 0 ? (
                      <div
                        data-lenis-prevent
                        onWheel={(e) => e.stopPropagation()}
                        className="mt-3 flex flex-col gap-3 max-h-[340px] overflow-y-auto overscroll-contain pr-1"
                      >
                        {rescheduleOptions.sessions.map((opt) => {
                          const isSelected = selectedSessionId === opt.id;
                          return (
                            <label
                              key={opt.id}
                              className={`relative flex cursor-pointer items-start justify-between rounded-xl border p-4 transition-all duration-200 ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-line bg-white/40 hover:bg-white/80"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  name="targetSession"
                                  value={opt.id}
                                  checked={isSelected}
                                  onChange={() => setSelectedSessionId(opt.id)}
                                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-line"
                                />
                                <div>
                                  <p className="text-body font-medium text-text">{formatDate(opt.startsAt)}</p>
                                  <p className="text-fine text-text/80">
                                    {formatTime(opt.startsAt, opt.durationMinutes)}
                                  </p>
                                  {opt.venueName ? (
                                    <p className="mt-0.5 text-fine text-text/60">{opt.venueName}</p>
                                  ) : null}
                                </div>
                              </div>
                              <span className="rounded-full bg-sage px-3 py-1 text-fine font-medium text-text/80">
                                {opt.availableSeats} {opt.availableSeats === 1 ? "seat" : "seats"} left
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-line bg-cream p-5 text-center">
                        <p className="text-body text-text/80">
                          No other scheduled dates for this workshop currently have enough available seats.
                        </p>
                        <p className="mt-2 text-fine text-text/60">
                          Please check back later or{" "}
                          <Link href="/contact" className="border-b border-terracotta pb-0.5 hover:text-terracotta">
                            contact our studio
                          </Link>{" "}
                          to enquire about future dates.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Show selected new date and time before confirmation (Requirement 2) */}
                  {selectedSession ? (
                    <div className="mt-6 rounded-xl border border-primary/50 bg-primary/5 p-4">
                      <p className="text-label font-medium uppercase tracking-eyebrow text-primary">
                        New session selected
                      </p>
                      <p className="mt-1 text-lead font-medium text-text">{selectedSession.title}</p>
                      <p className="mt-0.5 text-body text-text">
                        {formatDate(selectedSession.startsAt)} at{" "}
                        {formatTime(selectedSession.startsAt, selectedSession.durationMinutes)}
                      </p>
                      {selectedSession.venueName ? (
                        <p className="mt-0.5 text-fine text-text/75">{selectedSession.venueName}</p>
                      ) : null}
                      <p className="mt-2 text-fine text-text/70 italic">
                        Free rescheduling. Your original slot will be released and your new slot reserved without a duplicate booking.
                      </p>
                    </div>
                  ) : null}

                  {rescheduleError ? (
                    <p role="alert" className="mt-4 border-l-2 border-terracotta pl-4 text-fine text-terracotta">
                      {rescheduleError}
                    </p>
                  ) : null}
                </div>

                {/* Dialog Actions */}
                <div className="mt-8 flex flex-wrap items-center justify-end gap-4 border-t border-line pt-5">
                  <button
                    type="button"
                    disabled={rescheduling}
                    onClick={() => setRescheduleOpen(false)}
                    className="px-5 py-2.5 text-action font-medium uppercase tracking-eyebrow text-text/80 transition-colors hover:text-text"
                  >
                    Back
                  </button>

                  <BlobButton
                    type="button"
                    tone="deep"
                    disabled={!selectedSessionId || rescheduling}
                    onClick={handleConfirmReschedule}
                    className="px-7 py-3"
                  >
                    {rescheduling ? "Rescheduling…" : "Confirm reschedule"}
                  </BlobButton>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
