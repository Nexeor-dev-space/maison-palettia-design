/**
 * The guide, in reading order. Add a chapter: create its file, import it here, put it in the list.
 */
import { welcome } from "./01-welcome";
import { dayOne } from "./02-day-one";
import { finding } from "./03-finding";
import { editing } from "./04-editing";
import { media } from "./05-media";
import { sessions } from "./06-sessions";
import { moreContent } from "./07-more-content";
import { journal } from "./08-journal";
import { music } from "./09-music";
import { seo } from "./10-seo";
import { orders } from "./11-orders";
import { checkin } from "./12-checkin";
import { enquiries } from "./13-enquiries";
import { emails } from "./14-emails";
import { analytics } from "./15-analytics";
import { payments } from "./16-payments";
import { settings } from "./17-settings";
import { staff } from "./18-staff";
import { routines } from "./19-routines";
import { troubleshooting } from "./20-troubleshooting";
import { glossary } from "./21-glossary";
import type { Chapter } from "./types";

export { front } from "./front";
export type * from "./types";

export const chapters: Chapter[] = [
  welcome,
  dayOne,
  finding,
  editing,
  media,
  sessions,
  moreContent,
  journal,
  music,
  seo,
  orders,
  checkin,
  enquiries,
  emails,
  analytics,
  payments,
  settings,
  staff,
  routines,
  troubleshooting,
  glossary,
];
