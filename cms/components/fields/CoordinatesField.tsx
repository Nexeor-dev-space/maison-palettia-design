"use client";

import { FieldDescription, FieldError, FieldLabel, useField } from "@payloadcms/ui";
import type { GroupFieldClientProps } from "payload";
import React, { useState } from "react";

/**
 * ==========================================================================
 * CoordinatesField — a venue's pin, typed or pasted (cms/collections/content/Venues.ts)
 * ==========================================================================
 *
 * The pin is stored as two plain numbers, `coordinates.lat` and
 * `coordinates.lng`, never as a Payload `point` field (that would demand
 * PostGIS on the host, SPEC §A.5). Nobody knows a latitude by heart,
 * though: what staff have is a Google Maps link. So beside the two number
 * inputs there is one "paste" box that accepts
 *
 *   · a Maps URL — `…/@25.1186,55.2005,17z`, `…!3d25.1186!4d55.2005`,
 *     `…?q=25.1186,55.2005` or `…query=25.1186%2C55.2005`
 *   · or the pair itself — `25.1186, 55.2005` (what Maps copies on right-click)
 *
 * and fills both — on paste, or with "Use these". Range checks stay on the server (the group's number
 * fields carry min/max), so this component only parses; a clear "Check on
 * Google Maps" link lets the editor see the pin before saving.
 */

type Pair = { lat: number; lng: number };

const NUMBER = String.raw`(-?\d{1,3}(?:\.\d+)?)`;
const PATTERNS = [
  new RegExp(String.raw`!3d${NUMBER}!4d${NUMBER}`), // place pins: the most precise form in a Maps URL
  new RegExp(String.raw`@${NUMBER},${NUMBER}`), // viewport centre
  new RegExp(String.raw`[?&](?:q|query|ll|center)=${NUMBER}(?:,|%2C)\s*${NUMBER}`, "i"),
  new RegExp(String.raw`^\s*${NUMBER}\s*[,;\s]\s*${NUMBER}\s*$`), // "25.1186, 55.2005"
];

export function parseCoordinates(input: string): Pair | null {
  for (const pattern of PATTERNS) {
    const match = input.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

const toNumber = (text: string): number | null => {
  if (text.trim() === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
};

function NumberInput({ path, label, readOnly }: { path: string; label: string; readOnly?: boolean }) {
  const { value, setValue, showError, errorMessage } = useField<number | null>({ path });
  const id = `field-${path.replace(/\./g, "__")}`;
  return (
    <div className="field-type number" style={{ flex: "1 1 12rem" }}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type="number"
        step="any"
        inputMode="decimal"
        value={typeof value === "number" ? value : ""}
        disabled={readOnly}
        onChange={(event) => setValue(toNumber(event.target.value))}
        aria-invalid={showError}
      />
      <FieldError path={path} showError={showError} message={errorMessage} />
    </div>
  );
}

export function CoordinatesField({ field, path, readOnly }: GroupFieldClientProps) {
  const base = path ?? "coordinates";
  const lat = useField<number | null>({ path: `${base}.lat` });
  const lng = useField<number | null>({ path: `${base}.lng` });
  const [paste, setPaste] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const apply = (input: string = paste) => {
    if (!input.trim()) return;
    const pair = parseCoordinates(input);
    if (!pair) {
      setNote("Could not find a latitude and longitude in that. Paste a Google Maps link or “25.1186, 55.2005”.");
      return;
    }
    lat.setValue(pair.lat);
    lng.setValue(pair.lng);
    setPaste("");
    setNote(`Pin set to ${pair.lat}, ${pair.lng}. Check it on the map before saving.`);
  };

  const clear = () => {
    lat.setValue(null);
    lng.setValue(null);
    setNote(null);
  };

  const hasPin = typeof lat.value === "number" && typeof lng.value === "number";
  const description = typeof field.admin?.description === "string" ? field.admin.description : undefined;

  return (
    <div className="field-type mp-coordinates" style={{ marginBottom: "var(--base)" }}>
      <FieldLabel label={field.label} path={base} />
      {description ? <FieldDescription description={description} path={base} /> : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--base)", marginTop: "calc(var(--base) / 2)" }}>
        <NumberInput path={`${base}.lat`} label="Latitude" readOnly={readOnly} />
        <NumberInput path={`${base}.lng`} label="Longitude" readOnly={readOnly} />
      </div>

      {readOnly ? null : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "calc(var(--base) / 2)", alignItems: "center", marginTop: "calc(var(--base) / 2)" }}>
          <div className="field-type text" style={{ flex: "2 1 20rem", margin: 0 }}>
            <input
              type="text"
              aria-label="Paste a Google Maps link or coordinates"
              placeholder="Paste a Google Maps link or “25.1186, 55.2005”"
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
              onPaste={(event) => {
                // A recognisable link fills the pin straight away; anything else lands in the box as usual.
                const text = event.clipboardData.getData("text");
                if (parseCoordinates(text)) {
                  event.preventDefault();
                  apply(text);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  apply();
                }
              }}
            />
          </div>
          <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => apply()} style={{ margin: 0 }}>
            Use these
          </button>
          {hasPin ? (
            <button type="button" className="btn btn--style-subtle btn--size-small" onClick={clear} style={{ margin: 0 }}>
              Clear pin
            </button>
          ) : null}
        </div>
      )}

      <p style={{ margin: "calc(var(--base) / 2) 0 0", fontSize: "0.85em", color: "var(--theme-elevation-600)" }}>
        {note ? <span>{note} </span> : null}
        {hasPin ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat.value},${lng.value}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Check on Google Maps →
          </a>
        ) : (
          !note && <span>No pin: the map searches for the venue’s name instead.</span>
        )}
      </p>
    </div>
  );
}
