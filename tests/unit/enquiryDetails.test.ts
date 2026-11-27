import { describe, expect, it } from "vitest";

import { ENQUIRY_DETAIL_LABELS, enquiryDetailErrors, HEADCOUNT_MAX, isValidHeadcount, REQUIREMENTS_MAX_LENGTH } from "@/lib/enquiry";
import { BIRTHDAY_PROGRAMME_SLUG, PRIVATE_EVENT_AUDIENCES, toEnquiryProgramme } from "@/lib/privateEvents";

/**
 * The private-event form's counted and free-text answers (lib/enquiry.ts):
 * one set of rules the form applies before sending and the endpoint applies
 * again (cms/endpoints/enquiries.ts, covered in tests/unit/inbox).
 */
describe("isValidHeadcount", () => {
  it("accepts whole numbers from 0 to the bound, ignoring spaces and thousands commas", () => {
    expect(isValidHeadcount("0", 999)).toBe(true);
    expect(isValidHeadcount("12", 999)).toBe(true);
    expect(isValidHeadcount("999", 999)).toBe(true);
    expect(isValidHeadcount("1,200", 99_999)).toBe(true);
    expect(isValidHeadcount(" 1 200 ", 99_999)).toBe(true);
  });

  it("refuses words, signs, decimals, blanks and anything over the bound", () => {
    for (const value of ["twelve", "-1", "+3", "2.5", "", "  ", "1000", "0001000"]) {
      expect(isValidHeadcount(value, 999), value).toBe(false);
    }
  });
});

describe("enquiryDetailErrors", () => {
  it("leaves blank answers alone — every one of these questions is optional", () => {
    expect(enquiryDetailErrors({ guests: "", children: "", adults: " ", requirements: "" })).toEqual({});
    expect(enquiryDetailErrors({})).toEqual({});
  });

  it("names each field that fails, in the customer's words", () => {
    const errors = enquiryDetailErrors({
      guests: "lots",
      children: String(HEADCOUNT_MAX.children + 1),
      adults: "3.5",
      requirements: "x".repeat(REQUIREMENTS_MAX_LENGTH + 1),
    });
    expect(Object.keys(errors).sort()).toEqual(["adults", "children", "guests", "requirements"]);
    expect(errors.children).toMatch(/children/);
    expect(errors.adults).toMatch(/adults/);
    expect(errors.requirements).toMatch(/500 characters/);
  });

  it("passes good answers, including requirements at exactly the limit", () => {
    expect(
      enquiryDetailErrors({ guests: "25", children: "10", adults: "6", requirements: "x".repeat(REQUIREMENTS_MAX_LENGTH) }),
    ).toEqual({});
  });

  it("keeps the labels the Inbox shows", () => {
    expect(ENQUIRY_DETAIL_LABELS).toEqual({
      guests: "Estimated guests",
      children: "Children",
      adults: "Adults",
      requirements: "Allergies or special requirements",
    });
  });
});

describe("toEnquiryProgramme", () => {
  it("keeps only what the form needs, and the birthday slug is a real programme", () => {
    const birthday = PRIVATE_EVENT_AUDIENCES.find((audience) => audience.slug === BIRTHDAY_PROGRAMME_SLUG);
    expect(birthday).toBeTruthy();
    expect(toEnquiryProgramme({ ...birthday!, bookingPolicy: { slug: "birthday-parties", title: "Birthday Party Booking Policy" } })).toEqual({
      slug: "birthday-parties",
      name: "Birthday Parties",
      bookingPolicy: { slug: "birthday-parties", title: "Birthday Party Booking Policy" },
    });
    expect(toEnquiryProgramme({ ...birthday!, bookingPolicyNote: "Quoted under a separate written agreement" })).toMatchObject({
      bookingPolicyNote: "Quoted under a separate written agreement",
    });
  });
});
