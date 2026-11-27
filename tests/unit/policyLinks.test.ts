import { describe, expect, it } from "vitest";

import { policyTextParts } from "@/lib/policyLinks";

describe("policyTextParts", () => {
  it("links a policy address on this site and keeps the full stop outside", () => {
    expect(policyTextParts("See maisonpalettia.com/policies/cancellation-rescheduling-and-refunds.")).toEqual([
      { text: "See " },
      { text: "maisonpalettia.com/policies/cancellation-rescheduling-and-refunds", href: "/policies/cancellation-rescheduling-and-refunds" },
      { text: "." },
    ]);
  });

  it("links an email address as mailto, not as a site path", () => {
    expect(policyTextParts("Email: info@maisonpalettia.com.")).toEqual([
      { text: "Email: " },
      { text: "info@maisonpalettia.com", href: "mailto:info@maisonpalettia.com" },
      { text: "." },
    ]);
  });

  it("links the bare website to the home page and the policies index to its path", () => {
    expect(policyTextParts("Website: maisonpalettia.com")[1]).toEqual({ text: "maisonpalettia.com", href: "/" });
    expect(policyTextParts("rules: maisonpalettia.com/policies")[1]).toEqual({ text: "maisonpalettia.com/policies", href: "/policies" });
  });

  it("leaves text without links as one part", () => {
    expect(policyTextParts("Call: +971 50 474 7762")).toEqual([{ text: "Call: +971 50 474 7762" }]);
  });
});
