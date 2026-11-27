import { describe, expect, it } from "vitest";

import { cancellationRefundSummary, orderCancelledVars } from "@/cms/email/callerVars";

describe("order_cancelled refund sentence", () => {
  it("says no refund is due when nothing comes back", () => {
    expect(cancellationRefundSummary({ channel: "online" }, 0)).toBe(
      "No refund is due for this cancellation under our Cancellation, Rescheduling & Refund Policy.",
    );
    expect(cancellationRefundSummary({ channel: "online" }, 0)).not.toContain("AED");
  });

  it("names the amount and where it goes when there is a refund", () => {
    expect(cancellationRefundSummary({ channel: "online" }, 24000)).toMatch(/^Your refund of AED 240\.00 is returned to the card you paid with;/);
  });

  it("keeps refund.amount and refund.where beside the summary", () => {
    const order = { channel: "online" } as Parameters<typeof orderCancelledVars>[0];
    const vars = orderCancelledVars(order, { reason: "Requested by you", refundFils: 0 }) as { refund: Record<string, string> };
    expect(vars.refund.summary).toContain("No refund is due");
    expect(vars.refund.amount).toBe("AED 0.00");
    expect(vars.refund.where).toBe("to the card you paid with");
  });
});
