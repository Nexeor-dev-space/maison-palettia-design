import { describe, expect, it } from "vitest";

import { buildCredit, licenceName, licenceOf } from "@/lib/music";

describe("music credits (lib/music.ts)", () => {
  it("builds a Creative Commons TASL line: title, author, source, licence", () => {
    expect(buildCredit({ title: "Morning Light", artist: "Ana Vale", sourceName: "Free Music Archive", licence: "cc-by-4.0" })).toBe(
      "“Morning Light” by Ana Vale (Free Music Archive), licensed under CC BY 4.0.",
    );
  });

  it("notes an edited track, as CC BY asks", () => {
    expect(buildCredit({ title: "Loop", artist: "K", licence: "cc-by-sa-4.0", modified: true })).toBe(
      "“Loop” by K, licensed under CC BY-SA 4.0. Edited for this site.",
    );
  });

  it("prints the editor's exact wording verbatim when given", () => {
    expect(buildCredit({ title: "x", artist: "y", licence: "cc-by-4.0", creditOverride: "  Music by Kevin MacLeod (incompetech.com)  " })).toBe(
      "Music by Kevin MacLeod (incompetech.com)",
    );
  });

  it("uses the typed name for an 'other' licence and omits an empty one", () => {
    expect(licenceName({ licence: "other", licenceName: "Uppbeat Free" })).toBe("Uppbeat Free");
    expect(buildCredit({ title: "T", artist: "A", licence: "other" })).toBe("“T” by A.");
  });

  it("knows which licences require attribution", () => {
    expect(licenceOf("cc-by-4.0")?.attribution).toBe(true);
    expect(licenceOf("cc0")?.attribution).toBe(false);
    expect(licenceOf("nope")).toBeUndefined();
  });
});
