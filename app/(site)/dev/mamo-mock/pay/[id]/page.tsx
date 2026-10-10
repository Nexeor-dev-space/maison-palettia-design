import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { mockLink } from "@/cms/lib/mamo/mock";
import { formatAed } from "@/cms/lib/money";

/**
 * ==========================================================================
 * /dev/mamo-mock/pay/{id} — the MOCK Mamo hosted payment page
 * ==========================================================================
 *
 * Where a mock payment link sends the customer (cms/lib/mamo/mock.ts).
 * It stands in for Mamo's page with the three things a customer can do
 * there — pay, have the card declined, or walk away (plus "pay, but lose
 * the webhook", for the paths that must work without one) — and each button
 * posts to /dev/mamo-mock/act, which plays Mamo's part: it sends the
 * webhook to our real receiver with the mock secret, then redirects to the
 * link's return URL with Mamo's own query parameters.
 *
 * Development only: 404 in production (the factory never hands out a mock
 * link there either). Not indexed; dynamic, because the link state changes.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mock payment", robots: { index: false, follow: false } };

export default async function MockPayPage({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { id } = await params;
  const link = mockLink(id);
  if (!link) notFound();

  const amountFils = Math.round(Number(link.amount) * 100);
  const button = "w-full rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 px-4 py-16">
      <p className="rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900">
        MOCK PAYMENT PAGE — development only. No card is charged and no money moves.
      </p>
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">Mamo Pay (mock)</p>
        <h1 className="mt-2 text-xl font-semibold text-black">{link.title}</h1>
        <p className="mt-4 text-3xl font-semibold text-black">{formatAed(amountFils)}</p>
        {link.first_name || link.email ? (
          <p className="mt-2 text-sm text-black/60">
            {[link.first_name, link.last_name].filter(Boolean).join(" ")} {link.email ? `· ${link.email}` : ""}
          </p>
        ) : null}

        {link.active ? (
          <form method="post" action="/dev/mamo-mock/act" className="mt-6 grid gap-3">
            <input type="hidden" name="linkId" value={link.id} />
            <button name="action" value="pay" className={`${button} bg-black text-white hover:bg-black/80`}>
              Pay {formatAed(amountFils)} (test card succeeds)
            </button>
            <button name="action" value="fail" className={`${button} border border-black/20 bg-white text-black hover:bg-black/5`}>
              Pay with a declined card
            </button>
            <button name="action" value="pay_lost" className={`${button} border border-dashed border-black/30 bg-white text-black/70 hover:bg-black/5`}>
              Pay, but lose the webhook (tests the return page and the poller)
            </button>
            <button name="action" value="abandon" className={`${button} text-black/60 underline hover:text-black`}>
              Abandon and go back
            </button>
          </form>
        ) : (
          <p className="mt-6 rounded-md bg-black/5 px-4 py-3 text-sm text-black/70">
            This payment link is no longer active (already paid, or deactivated when the hold expired).
          </p>
        )}
      </section>
      <p className="text-center text-xs text-black/50">
        Link {link.id} · <Link className="underline" href="/dev/mamo-mock">mock webhook poster</Link>
      </p>
    </main>
  );
}
