import type { SessionSeed } from "../types";

import { SCHEDULE } from "./schedule";

/**
 * The dated sessions: the client's Nov 2026 timetable (./schedule.ts), one
 * sitting per cell, each pointing at its workshop type.
 *
 * THE TWO DESIGN-PHASE PLACEHOLDERS ARE GONE. This used to open with the
 * pair copied from lib/workshops.ts (a Candle Making on 11 Oct, a Crocheting
 * on 24 Oct, invented dates and prices from before the client's update).
 * They carried no workshop type, so once the listing drew the programme as
 * themes they surfaced as a stray dated card under each experience — the
 * one photograph in a run of tickets. The client asked for them to go, and
 * the seed no longer writes anything the timetable does not say.
 */
export const SESSIONS: SessionSeed[] = [...SCHEDULE];
