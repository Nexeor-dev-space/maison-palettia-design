"use client";

import { useRef, useState } from "react";

import styles from "@/components/ui/BlobButton.module.css";
import { usePlayOnView } from "@/components/ui/usePlayOnView";

/*
  The pills' four blobs and settling flood, for the painted tone — with one
  addition the pills do not have, at the client's ask: on a phone or tablet,
  where there is no hover, the flood plays on its own each time the button
  comes into view and has faded in, and drains when it leaves. Desktop is
  untouched: hover drives it there, exactly as on the pills. See
  `usePlayOnView` for what "in view" means.
*/
export function AutoFlood() {
  const fill = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  usePlayOnView(
    fill,
    () => setOn(true),
    () => setOn(false),
  );

  return (
    <span ref={fill} aria-hidden className={styles.fill} data-on={on ? "" : undefined}>
      <span className={styles.blobs}>
        <span className={styles.blob} />
        <span className={styles.blob} />
        <span className={styles.blob} />
        <span className={styles.blob} />
      </span>
      <span className={styles.flood} />
    </span>
  );
}
