"use client";

import { useEffect, useRef } from "react";

import { BlobButton } from "@/components/ui/BlobButton";

/**
 * The magic link's landing: a form that POSTs the token, not a GET that
 * spends it (SPEC §H.10).
 *
 * Mail scanners — Outlook SafeLinks, corporate gateways — fetch every link
 * in a message before the person clicks it. Were `GET /my-bookings?t=` to
 * sign in and burn the single-use token, the scanner would use it up and the
 * customer's click would land on "this link has expired". So the GET renders
 * only this, and a script submits it on arrival; a scanner that does not run
 * scripts never submits it. Without JavaScript the button does the same.
 *
 * The POST (`/api/site/my-bookings/consume`) checks the token, sets the
 * session cookie and answers 303 to `/my-bookings` — so the token never
 * stays in the address bar or the history.
 */
export function MagicLinkContinue({ token }: { token: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} method="post" action="/api/site/my-bookings/consume" className="mt-10">
      <input type="hidden" name="t" value={token} />
      <p role="status" className="max-w-[34rem] text-body text-text/80">
        Opening your bookings&hellip;
      </p>
      <BlobButton type="submit" className="mt-8 justify-center px-8 py-5">
        Continue to my bookings
      </BlobButton>
    </form>
  );
}
