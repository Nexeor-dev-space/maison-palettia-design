import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { mockLists } from "@/cms/lib/mamo/mock";

/**
 * ==========================================================================
 * /dev/mamo-mock — the mock webhook poster
 * ==========================================================================
 *
 * A development console for the mock gateway: every mock payment link and
 * payment this server has made, with buttons that make "Mamo" send each
 * kind of webhook to our real receiver — again (a duplicate must be
 * answered "duplicate"), voided, refunded, disputed, or with a wrong secret
 * (expect 401 and a minimal unverified row under Bookings → Payment
 * events). Refunds themselves start from the order in the admin; the mock
 * gateway delivers `payment.refunded` on its own when one is posted.
 *
 * 404 in production. Not indexed.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mock Mamo console", robots: { index: false, follow: false } };

const EVENTS = ["payment.succeeded", "payment.failed", "payment.refund_initiated", "payment.refunded", "payment.refund_failed"];

export default async function MockConsole({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { result } = await searchParams;
  const { links, payments } = mockLists();
  const cell = "border-t border-black/10 px-2 py-2 align-top";
  const small = "rounded-full border border-black/20 px-3 py-1 text-xs hover:bg-black/5";

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-sm text-black">
      <h1 className="text-2xl font-semibold">Mock Mamo console</h1>
      <p className="mt-2 max-w-2xl text-black/60">
        Development only. Each button sends a Mamo-shaped webhook to <code>/api/site/webhooks/mamo</code> with the mock
        secret, exactly as the real gateway would; the receiver then verifies by fetching the payment from the mock.
      </p>
      {result ? <p className="mt-4 rounded-md bg-amber-50 px-4 py-2 font-mono text-xs text-amber-900">{result}</p> : null}

      <form method="post" action="/dev/mamo-mock/act" className="mt-6">
        <button name="action" value="unverified" className={small}>
          Send an unverified delivery (wrong secret)
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold">Payments ({payments.length})</h2>
      <table className="mt-2 w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="px-2">Payment</th>
            <th className="px-2">Status</th>
            <th className="px-2">AED</th>
            <th className="px-2">Order</th>
            <th className="px-2">Send</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className={`${cell} font-mono text-xs`}>{payment.id}</td>
              <td className={cell}>
                {String(payment.status)}
                {payment.refund_amount ? ` (refunded ${payment.refund_amount})` : ""}
              </td>
              <td className={cell}>{String(payment.amount)}</td>
              <td className={`${cell} font-mono text-xs`}>{String(payment.external_id ?? "—")}</td>
              <td className={cell}>
                <form method="post" action="/dev/mamo-mock/act" className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <select name="eventType" defaultValue="payment.succeeded" className="rounded border border-black/20 px-1 py-1 text-xs">
                    {EVENTS.map((event) => (
                      <option key={event}>{event}</option>
                    ))}
                  </select>
                  <button name="action" value="resend" className={small}>
                    Deliver
                  </button>
                  <button name="action" value="void" className={small}>
                    Void
                  </button>
                  <button name="action" value="dispute" className={small}>
                    Dispute
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-10 text-lg font-semibold">Payment links ({links.length})</h2>
      <table className="mt-2 w-full border-collapse text-left">
        <tbody>
          {links.map((link) => (
            <tr key={link.id}>
              <td className={`${cell} font-mono text-xs`}>{link.id}</td>
              <td className={cell}>{link.title}</td>
              <td className={cell}>{String(link.amount)}</td>
              <td className={cell}>{link.active ? "active" : "inactive"}</td>
              <td className={cell}>
                {link.active ? (
                  <Link className="underline" href={`/dev/mamo-mock/pay/${link.id}`}>
                    open payment page
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
