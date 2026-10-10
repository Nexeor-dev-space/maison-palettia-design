"use client";

import dynamic from "next/dynamic";
import React, { useRef, useState } from "react";

import { unlockAudio, useCameraCapable, usePref } from "./client";

/**
 * ==========================================================================
 * Scanner — the camera and the "type the code" box (SPEC §H.7)
 * ==========================================================================
 *
 * `@yudiel/react-qr-scanner` reads QR codes from the phone's camera
 * (`formats={["qr_code"]}` only — the tickets carry nothing else, and a
 * narrower search is faster on a cheap Android). It is loaded on the client
 * only: the library touches `navigator.mediaDevices` and a WASM decoder,
 * neither of which exists during the server render of the admin page.
 *
 * The camera needs a secure context — HTTPS in production, or localhost —
 * and the browser's permission; both failures are explained in plain words
 * instead of a black box. The camera starts only when someone presses
 * "Start camera" (a phone left on the desk should not film the room), and
 * the choice is remembered on that device.
 *
 * Duplicate reads: a QR held in front of the lens is decoded many times a
 * second. The library already suppresses repeats of the same value; on top
 * of that the parent pauses scanning while a verdict is being fetched, and
 * the same payload is ignored for a few seconds after it was answered.
 *
 * The manual box accepts the printed code with or without `MPT-`, in any
 * case, with spaces — the server normalises it (Crockford: O→0, I/L→1).
 */

const QrScanner = dynamic(() => import("@yudiel/react-qr-scanner").then((m) => m.Scanner), {
  ssr: false,
  loading: () => <div className="mp-ci-camera__placeholder">Starting the camera…</div>,
});

export function Scanner({
  busy,
  onScan,
  onManual,
}: {
  busy: boolean;
  onScan: (raw: string) => void;
  onManual: (code: string) => void;
}) {
  // Memory of the choice may be blocked (private mode): then the camera simply starts off.
  const [cameraPref, setCameraPref] = usePref("mp-checkin-camera", false);
  const secure = useCameraCapable();
  const [failed, setFailed] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraOn = cameraPref && secure;
  const error = cameraOn ? failed : null;

  const toggleCamera = () => {
    unlockAudio();
    setFailed(null);
    setCameraPref(!cameraPref);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    unlockAudio();
    const value = code.trim();
    if (!value || busy) return;
    onManual(value);
    setCode("");
    inputRef.current?.focus();
  };

  return (
    <div className="mp-ci-scanner">
      <div className="mp-ci-camera">
        {cameraOn ? (
          <QrScanner
            formats={["qr_code"]}
            paused={busy}
            sound={false}
            components={{ finder: true, torch: true, zoom: false, onOff: false }}
            styles={{ container: { width: "100%", aspectRatio: "1 / 1" }, video: { objectFit: "cover" } }}
            onScan={(codes) => {
              const raw = codes.find((c) => c.rawValue)?.rawValue;
              if (raw) onScan(raw);
            }}
            onError={(e) => {
              const name = (e?.cause as { name?: string } | undefined)?.name;
              setFailed(
                name === "NotAllowedError"
                  ? "Camera permission was refused. Allow the camera for this site in the browser settings, or type the code below."
                  : name === "NotFoundError"
                    ? "No camera was found on this device. Type the code below."
                    : `The camera could not start (${e?.message || "unknown error"}). Type the code below.`,
              );
            }}
          />
        ) : (
          <div className="mp-ci-camera__placeholder">
            {secure ? (
              <span>Camera is off.</span>
            ) : (
              <span>
                The camera needs a secure (https://) address. Open the admin over HTTPS to scan — until then, type the code below.
              </span>
            )}
          </div>
        )}
      </div>
      {error ? (
        <p className="mp-ci-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mp-ci-row">
        <button type="button" className="mp-ci-btn" onClick={toggleCamera} disabled={!secure}>
          {cameraPref ? "Stop camera" : "Start camera"}
        </button>
      </div>
      <form className="mp-ci-manual" onSubmit={submit}>
        <label htmlFor="mp-ci-code">Ticket code</label>
        <div className="mp-ci-row">
          <input
            id="mp-ci-code"
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MPT-XXXXXXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            maxLength={40}
          />
          <button type="submit" className="mp-ci-btn mp-ci-btn--primary" disabled={busy || !code.trim()}>
            Check in
          </button>
        </div>
      </form>
    </div>
  );
}
