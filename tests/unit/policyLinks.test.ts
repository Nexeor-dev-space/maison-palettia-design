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

describe("policyTextParts — links to official pages", () => {
  it("turns [label](https://…) into the label, linking out", () => {
    const parts = policyTextParts(
      "contact [Dubai Consumer Rights](https://consumerrights.ae/en/Pages/default.aspx) or email info@maisonpalettia.com.",
    );
    expect(parts).toEqual([
      { text: "contact " },
      { text: "Dubai Consumer Rights", href: "https://consumerrights.ae/en/Pages/default.aspx", external: true },
      { text: " or email " },
      { text: "info@maisonpalettia.com", href: "mailto:info@maisonpalettia.com" },
      { text: "." },
    ]);
  });

  it("keeps a label with brackets and numbers, and the full stop outside the link", () => {
    const parts = policyTextParts(
      "refer to the [UAE Federal Consumer Protection Law (Federal Law No. 15 of 2020)](https://www.moet.gov.ae/en/federal-law-no-15-of-2020-on-consumer-protection).",
    );
    expect(parts[1]).toEqual({
      text: "UAE Federal Consumer Protection Law (Federal Law No. 15 of 2020)",
      href: "https://www.moet.gov.ae/en/federal-law-no-15-of-2020-on-consumer-protection",
      external: true,
    });
    expect(parts[2]).toEqual({ text: "." });
  });

  it("leaves non-https targets as plain text", () => {
    for (const text of ["[x](javascript:alert(1))", "[x](http://example.com)"]) {
      expect(policyTextParts(text).every((part) => !part.href)).toBe(true);
    }
  });
});
