import { describe, expect, it } from "vitest";

import { mergeModeCopy } from "@/lib/modeCopy";

describe("mergeModeCopy", () => {
  it("keeps the retired Booked online tag gone when the CMS field is blank", () => {
    expect(mergeModeCopy({ labels: { bookedOnline: "" } }).labels.bookedOnline).toBe("");
    expect(mergeModeCopy(null).labels.bookedOnline).toBe("");
  });

  it("still shows the tag if an editor types one", () => {
    expect(mergeModeCopy({ labels: { bookedOnline: "Online" } }).labels.bookedOnline).toBe("Online");
  });
});
