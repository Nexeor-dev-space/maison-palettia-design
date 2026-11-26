import { describe, expect, it } from "vitest";

import { e164, formatWhatsApp, legalEntityParts, telHref, whatsappHref, whatsappOf } from "@/lib/contact";
import { formatEffectiveDate, groupPolicies, type Policy } from "@/lib/policies";

describe("phone links (lib/contact.ts)", () => {
  it("tel: keeps the leading + and the digits only", () => {
    expect(telHref("+971 50 474 7762")).toBe("tel:+971504747762");
    expect(telHref("(04) 000-0000")).toBe("tel:040000000");
    expect(e164("+971 50 474 7762")).toBe("+971504747762");
  });

  it("WhatsApp digits print in UAE grouping and link to wa.me", () => {
    expect(formatWhatsApp("971554966116")).toBe("+971 55 496 6116");
    expect(formatWhatsApp("97140000000")).toBe("+971 4 000 0000");
    expect(formatWhatsApp("447700900123")).toBe("+447700900123");
    expect(whatsappHref("971554966116")).toBe("https://wa.me/971554966116");
    expect(whatsappOf("971554966116")).toEqual({ display: "+971 55 496 6116", href: "https://wa.me/971554966116" });
    expect(whatsappOf(null)).toBeNull();
    expect(whatsappOf("12345")).toBeNull();
  });

  it("the legal line leaves out what is not set", () => {
    expect(legalEntityParts({ legalName: "Maison Palettia Events L.L.C.", licenceNumber: "1626148", registeredIn: "Dubai, UAE" })).toEqual([
      "Maison Palettia Events L.L.C.",
      "Commercial Licence No. 1626148",
      "Dubai, UAE",
    ]);
    expect(legalEntityParts({ legalName: "Maison Palettia Events L.L.C.", licenceNumber: null, registeredIn: "" })).toEqual([
      "Maison Palettia Events L.L.C.",
    ]);
  });
});

describe("policy groups and effective dates (lib/policies.ts)", () => {
  const policy = (slug: string, group?: Policy["group"]): Policy => ({ slug, title: slug, navLabel: slug, summary: "", sections: [], group });

  it("groups in Legal, Support, House-rules order and drops empty groups", () => {
    const groups = groupPolicies([policy("a", "support"), policy("b", "legal"), policy("c"), policy("d", "legal")]);
    expect(groups.map((g) => [g.key, g.policies.map((p) => p.slug)])).toEqual([
      ["legal", ["b", "d"]],
      ["support", ["a"]],
      ["none", ["c"]],
    ]);
    expect(groupPolicies([policy("c")], { footerOnly: true })).toEqual([]);
  });

  it("prints the effective date on the Dubai calendar", () => {
    // Midnight 27 Nov in Dubai, as the admin's date picker stores it.
    expect(formatEffectiveDate("2026-11-26T20:00:00.000Z")).toEqual({ label: "27 November 2026", day: "2026-11-27" });
    expect(formatEffectiveDate("2026-11-27T00:00:00.000Z")).toEqual({ label: "27 November 2026", day: "2026-11-27" });
    expect(formatEffectiveDate(null)).toBeNull();
    expect(formatEffectiveDate("not a date")).toBeNull();
  });
});
