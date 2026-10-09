import type { PolicySeed } from "../types";

/**
 * The eight studio policies, from lib/policies.ts POLICIES, sections and
 * blocks 1:1 (the policy prose is the client's own document — never
 * paraphrased; docs/policy-content-audit.md). Age tables carry `source`
 * ("diy" for DIY_AGE_GUIDANCE, "workshop" for WORKSHOP_AGE_GUIDANCE — SPEC
 * §F.5) AND the rows exactly as printed today, so a renderer that reads
 * the rows prints the same table, in the same order and wording, as the
 * code did.
 */

export const POLICIES: PolicySeed[] = [
  {
    title: "General Customer Policy", // lib/policies.ts:164
    navLabel: "General customer policy", // lib/policies.ts:165
    slug: "general-customer-policy", // lib/policies.ts:163
    summary: "What applies to every visit, whatever you have come to make.", // lib/policies.ts:166
    sections: [
      {
        heading: "A space for everyone", // lib/policies.ts:169
        blocks: [
          {
            blockType: "text", // lib/policies.ts:172
            body: "Maison Palettia is a creative space designed for everyone to explore, create and enjoy.", // lib/policies.ts:173
          },
          {
            blockType: "text", // lib/policies.ts:176
            body: "By purchasing a product, participating in a DIY activity, or booking a scheduled session, customers agree to follow Maison Palettia's policies and the instructions provided by our team.", // lib/policies.ts:177
          },
          {
            blockType: "text", // lib/policies.ts:180
            body: "Customers are expected to treat the retail store, equipment, materials, staff and other guests with care and respect.", // lib/policies.ts:181
          },
        ],
      },
      {
        heading: "Following the instructions", // lib/policies.ts:186
        blocks: [
          {
            blockType: "text", // lib/policies.ts:189
            body: "Activities must be performed according to the instructions provided by Maison Palettia.", // lib/policies.ts:190
          },
          {
            blockType: "text", // lib/policies.ts:193
            body: "Some materials, tools, paints, glues, candles, glass, ceramics and other craft supplies may require additional care or supervision.", // lib/policies.ts:194
          },
          {
            blockType: "text", // lib/policies.ts:197
            body: "Maison Palettia reserves the right to stop an activity if a customer's conduct creates a safety risk or causes significant disruption to others.", // lib/policies.ts:198
          },
          {
            blockType: "text", // lib/policies.ts:201
            body: "Parents and guardians are responsible for supervising children where required.", // lib/policies.ts:202
          },
        ],
      },
      {
        heading: "Your belongings", // lib/policies.ts:207
        blocks: [
          {
            blockType: "text", // lib/policies.ts:210
            body: "Customers are responsible for their personal belongings while visiting Maison Palettia. We recommend that valuable or fragile personal items are not brought into the activity area.", // lib/policies.ts:211
          },
          {
            blockType: "text", // lib/policies.ts:214
            body: "Customers may not bring outside craft materials, chemicals, paints, fragrances or other supplies into the retail store without prior approval.", // lib/policies.ts:215
          },
        ],
      },
      {
        heading: "Food and drinks", // lib/policies.ts:220
        blocks: [
          {
            blockType: "text", // lib/policies.ts:223
            body: "Food and beverages are permitted only in designated areas. Drinks should be kept away from craft materials, equipment and customer projects.", // lib/policies.ts:224
          },
        ],
      },
      {
        heading: "Conduct", // lib/policies.ts:229
        blocks: [
          {
            blockType: "text", // lib/policies.ts:232
            body: "Maison Palettia is a welcoming creative environment. We expect customers to treat our team and fellow creators with courtesy and respect. Harassment, abusive language, threatening behaviour, intentional damage or disruptive conduct will not be tolerated.", // lib/policies.ts:233
          },
          {
            blockType: "text", // lib/policies.ts:236
            body: "Maison Palettia may refuse service or ask a customer to leave where necessary to protect the safety and wellbeing of customers, staff or property.", // lib/policies.ts:237
          },
        ],
      },
      {
        heading: "If something has not gone as expected", // lib/policies.ts:242
        blocks: [
          {
            blockType: "text", // lib/policies.ts:245
            body: "We want every visit to Maison Palettia to be a positive experience. If something hasn't gone as expected, please speak with our team as soon as possible so that we have an opportunity to assist.", // lib/policies.ts:246
          },
          {
            blockType: "text", // lib/policies.ts:249
            body: "Complaints relating to a session, product or completed project should ideally be raised at the time of the visit or within a reasonable period thereafter.", // lib/policies.ts:250
          },
        ],
      },
      {
        heading: "Changes to these policies", // lib/policies.ts:255
        blocks: [
          {
            blockType: "text", // lib/policies.ts:258
            body: "Maison Palettia may update its policies from time to time. The applicable policy will be the policy in effect at the time of the booking or purchase.", // lib/policies.ts:259
          },
        ],
      },
    ],
    order: 1,
  },
  {
    title: "DIY Experience Policy", // lib/policies.ts:279
    navLabel: "DIY experience policy", // lib/policies.ts:280
    slug: "diy-experience-policy", // lib/policies.ts:278
    summary: "For Create Anytime activities, the ones with nothing to book.", // lib/policies.ts:281
    sections: [
      {
        heading: "What a DIY session is", // lib/policies.ts:284
        blocks: [
          {
            blockType: "text", // lib/policies.ts:287
            body: "Create Anytime activities are DIY sessions: you choose a project when you arrive and make it at your own pace, with our team on hand. Children below the age of 10 may take part under adult supervision only.", // lib/policies.ts:288
          },
        ],
      },
      {
        heading: "Age guidance by activity", // lib/policies.ts:293
        blocks: [
          {
            blockType: "text", // lib/policies.ts:296
            body: "Age requirements and supervision requirements vary by activity. Please check the guidance for the activity you have in mind before you come.", // lib/policies.ts:297
          },
          {
            blockType: "ages", // lib/policies.ts:299
            source: "diy", // lib/policies.ts:271
            rows: [
              {
                activity: "Ceramic painting", // lib/policies.ts:133
                guidance: "5 years and over. Ages 5–10 under the close supervision of a parent.", // lib/policies.ts:133
              },
              {
                activity: "Bedazzling", // lib/policies.ts:134
                guidance: "Ages 5–10 for Mini Bedazzling. Age 11 and over for Creative Bedazzling.", // lib/policies.ts:134
              },
              {
                activity: "Tote bag painting", // lib/policies.ts:135
                guidance: "Ages 5–10 for stencils and easy painting. Age 11 and over for creative designs.", // lib/policies.ts:135
              },
              {
                activity: "Glass painting", // lib/policies.ts:136
                guidance: "Age 12 and over.", // lib/policies.ts:136
              },
              {
                activity: "Mandala painting", // lib/policies.ts:137
                guidance: "Age 12 and over.", // lib/policies.ts:136
              },
            ],
          },
        ],
      },
      {
        heading: "How a DIY session runs", // lib/policies.ts:303
        blocks: [
          {
            blockType: "list", // lib/policies.ts:306
            items: [
              {
                text: "DIY sessions are subject to available space, materials and retail store capacity.", // lib/policies.ts:308
              },
              {
                text: "Customers select their project from the options available at the time of their visit.", // lib/policies.ts:309
              },
              {
                text: "The price of a DIY session states what is included.", // lib/policies.ts:310
              },
              {
                text: "Standard materials required for the selected project are included unless specifically stated otherwise.", // lib/policies.ts:311
              },
              {
                text: "Additional materials, upgrades or premium items may be available for an additional charge.", // lib/policies.ts:312
              },
              {
                text: "Customers are responsible for following the instructions provided by the Maison Palettia team.", // lib/policies.ts:313
              },
              {
                text: "Once a project has been started, changing to a different project may be subject to an additional charge.", // lib/policies.ts:314
              },
              {
                text: "Completed projects should be collected within the timeframe communicated by the team, particularly where drying, curing or firing is required.", // lib/policies.ts:315
              },
            ],
          },
        ],
      },
      {
        heading: "Ceramics and glass", // lib/policies.ts:321
        blocks: [
          {
            blockType: "callout", // lib/policies.ts:324
            title: "Important for ceramics and glass", // lib/policies.ts:325
            body: "Maison Palettia takes reasonable care when handling customer projects. However, handmade and painted items may occasionally experience minor imperfections, colour variations, breakage, cracking or other changes during drying, curing or firing. We will do our best to handle every project with care but cannot guarantee that every finished piece will be completely free from such imperfections.", // lib/policies.ts:326
          },
        ],
      },
      {
        heading: "Creative results may vary", // lib/policies.ts:331
        blocks: [
          {
            blockType: "callout", // lib/policies.ts:334
            title: "Every creation is uniquely yours", // lib/policies.ts:335
            body: "Because Maison Palettia is a hands-on creative experience, finished projects may vary from examples shown in-store or online. Differences in colour, placement, technique, materials and individual skill are part of the creative process.", // lib/policies.ts:336
          },
        ],
      },
    ],
    order: 2,
  },
  {
    title: "Scheduled Workshop Policy", // lib/policies.ts:357
    navLabel: "Scheduled workshop policy", // lib/policies.ts:358
    slug: "scheduled-workshop-policy", // lib/policies.ts:356
    summary: "For Create Together sessions, the guided ones you book onto a date.", // lib/policies.ts:359
    sections: [
      {
        heading: "The workshops", // lib/policies.ts:362
        blocks: [
          {
            blockType: "text", // lib/policies.ts:365
            body: "Create Together sessions are guided workshops that run to a set date and time. Additional workshops will be introduced later.", // lib/policies.ts:366
          },
          {
            blockType: "ages", // lib/policies.ts:368
            source: "workshop", // lib/policies.ts:366
            rows: [
              {
                activity: "Candle making", // lib/policies.ts:405
                guidance: "Age 14 and over.", // lib/policies.ts:148
              },
              {
                activity: "Crocheting", // lib/policies.ts:149
                guidance: "Age 14 and over.", // lib/policies.ts:148
              },
            ],
          },
        ],
      },
      {
        heading: "Making a booking", // lib/policies.ts:372
        blocks: [
          {
            blockType: "text", // lib/policies.ts:374
            body: "Bookings may be made in-store, or through the Maison Palettia online booking system.", // lib/policies.ts:374
          },
          {
            blockType: "text", // lib/policies.ts:374
            body: "A booking is considered confirmed once the required payment or deposit has been received and the customer has received a booking confirmation.", // lib/policies.ts:377
          },
          {
            blockType: "text", // lib/policies.ts:379
            body: "Your confirmation will set out:", // lib/policies.ts:379
          },
          {
            blockType: "list", // lib/policies.ts:381
            items: [
              {
                text: "The activity", // lib/policies.ts:383
              },
              {
                text: "The date", // lib/policies.ts:384
              },
              {
                text: "The start time", // lib/policies.ts:385
              },
              {
                text: "The duration", // lib/policies.ts:386
              },
              {
                text: "The number of participants", // lib/policies.ts:387
              },
              {
                text: "The price", // lib/policies.ts:388
              },
              {
                text: "Any special requirements", // lib/policies.ts:389
              },
              {
                text: "Cancellation and rescheduling information", // lib/policies.ts:390
              },
            ],
          },
        ],
      },
      {
        heading: "Arriving", // lib/policies.ts:396
        blocks: [
          {
            blockType: "text", // lib/policies.ts:399
            body: "Customers are requested to arrive 10 minutes before their scheduled session. Late arrival may reduce the customer's activity time where the session must finish at the scheduled time. For safety and operational reasons, significantly late customers may not be able to participate.", // lib/policies.ts:400
          },
        ],
      },
      {
        heading: "Candle making", // lib/policies.ts:405
        blocks: [
          {
            blockType: "text", // lib/policies.ts:408
            body: "Candle-making involves hot wax, fragrance oils, containers and other materials that require care. Participants must follow all safety instructions provided by Maison Palettia staff.", // lib/policies.ts:409
          },
          {
            blockType: "list", // lib/policies.ts:412
            items: [
              {
                text: "Children should participate only where the specific session is designed for their age group.", // lib/policies.ts:414
              },
              {
                text: "Hot wax and heating equipment should be handled only by participants and staff according to the retail store safety instructions.", // lib/policies.ts:415
              },
              {
                text: "Customers should not bring their own fragrance oils, wax, containers or other materials unless specifically approved.", // lib/policies.ts:416
              },
              {
                text: "Finished candles should be allowed to cool and set for the recommended period before collection or use.", // lib/policies.ts:417
              },
              {
                text: "Customers receive appropriate candle-burning and safety instructions with their finished product.", // lib/policies.ts:418
              },
            ],
          },
        ],
      },
      {
        heading: "Crochet", // lib/policies.ts:424
        blocks: [
          {
            blockType: "list", // lib/policies.ts:427
            items: [
              {
                text: "The materials included are stated in the workshop description.", // lib/policies.ts:429
              },
              {
                text: "Customers may keep the project and materials specified in the workshop description.", // lib/policies.ts:430
              },
              {
                text: "If customers miss part of the workshop because of late arrival, Maison Palettia cannot guarantee that the instructor can repeat the missed portion individually.", // lib/policies.ts:431
              },
              {
                text: "Workshop outcomes may vary according to individual skill level.", // lib/policies.ts:432
              },
            ],
          },
          {
            blockType: "callout", // lib/policies.ts:436
            title: "Designed to teach and inspire", // lib/policies.ts:437
            body: "Our workshops are designed to teach and inspire, not to produce identical results. Every creation is unique, and that's part of the Maison Palettia experience.", // lib/policies.ts:438
          },
        ],
      },
    ],
    order: 3,
  },
  {
    title: "Cancellation & Rescheduling", // lib/policies.ts:475
    navLabel: "Cancellation & rescheduling", // lib/policies.ts:476
    slug: "cancellation-and-rescheduling", // lib/policies.ts:474
    summary: "The notice we ask for, and what happens if plans change.", // lib/policies.ts:477
    sections: [
      {
        heading: "If your plans change", // lib/policies.ts:480
        blocks: [
          {
            blockType: "text", // lib/policies.ts:483
            body: "We understand that plans can change. We kindly ask customers to provide at least 48 hours' notice if they need to cancel or reschedule. Cancellations or rescheduling requests made less than 24 hours before the session, as well as no-shows, may be treated as non-refundable. Maison Palettia may make reasonable exceptions in genuine circumstances at management discretion.", // lib/policies.ts:484
          },
        ],
      },
      {
        heading: "Rescheduling", // lib/policies.ts:489
        blocks: [
          {
            blockType: "text", // lib/policies.ts:492
            body: "Where notice is given in good time, rescheduling is free and subject to availability. Customers may instead request a store credit note.", // lib/policies.ts:493
          },
        ],
      },
      {
        heading: "Late cancellations and no-shows", // lib/policies.ts:498
        blocks: [
          {
            blockType: "text", // lib/policies.ts:501
            body: "A booking cancelled less than 24 hours before the session, or missed without notice, becomes non-refundable and non-transferable.", // lib/policies.ts:502
          },
        ],
      },
    ],
    order: 4,
  },
  {
    title: "Refund & Exchange", // lib/policies.ts:523
    navLabel: "Refund & exchange", // lib/policies.ts:524
    slug: "refund-and-exchange", // lib/policies.ts:522
    summary: "Where a session can be refunded, and where it cannot.", // lib/policies.ts:525
    sections: [
      {
        heading: "Creative sessions", // lib/policies.ts:528
        blocks: [
          {
            blockType: "text", // lib/policies.ts:531
            body: "DIY activities are generally non-refundable once materials have been prepared or the project has been started.", // lib/policies.ts:532
          },
          {
            blockType: "text", // lib/policies.ts:535
            body: "For scheduled workshops, the Cancellation & Rescheduling policy applies.", // lib/policies.ts:536
          },
        ],
      },
    ],
    order: 5,
  },
  {
    title: "Safety & Children", // lib/policies.ts:549
    navLabel: "Safety & children", // lib/policies.ts:550
    slug: "safety-and-children", // lib/policies.ts:548
    summary: "How we keep the studio safe, and what supervision each activity needs.", // lib/policies.ts:551
    sections: [
      {
        heading: "Safety comes first", // lib/policies.ts:554
        blocks: [
          {
            blockType: "text", // lib/policies.ts:557
            body: "Safety comes first at Maison Palettia. Customers must follow all instructions provided by Maison Palettia staff. Running, unsafe use of equipment, intentional misuse of materials, or behaviour that could endanger another customer or team member is not permitted.", // lib/policies.ts:558
          },
          {
            blockType: "text", // lib/policies.ts:561
            body: "Maison Palettia reserves the right to stop participation where a customer does not follow reasonable safety instructions.", // lib/policies.ts:562
          },
        ],
      },
      {
        heading: "Children, parents and guardians", // lib/policies.ts:567
        blocks: [
          {
            blockType: "text", // lib/policies.ts:570
            body: "Age requirements and supervision requirements may vary depending on the activity. Customers should check the age recommendation for each session before booking.", // lib/policies.ts:571
          },
          {
            blockType: "text", // lib/policies.ts:574
            body: "For activities requiring adult supervision, the parent or legal guardian is responsible for supervising the child throughout the session and ensuring that the child follows Maison Palettia's safety instructions.", // lib/policies.ts:575
          },
        ],
      },
      {
        heading: "Age guidance", // lib/policies.ts:580
        blocks: [
          {
            blockType: "text", // lib/policies.ts:583
            body: "Create Anytime activities: children below the age of 10 may take part under adult supervision only.", // lib/policies.ts:584
          },
          {
            blockType: "ages", // lib/policies.ts:586
            source: "diy", // lib/policies.ts:271
            rows: [
              {
                activity: "Ceramic painting", // lib/policies.ts:133
                guidance: "5 years and over. Ages 5–10 under the close supervision of a parent.", // lib/policies.ts:133
              },
              {
                activity: "Bedazzling", // lib/policies.ts:134
                guidance: "Ages 5–10 for Mini Bedazzling. Age 11 and over for Creative Bedazzling.", // lib/policies.ts:134
              },
              {
                activity: "Tote bag painting", // lib/policies.ts:135
                guidance: "Ages 5–10 for stencils and easy painting. Age 11 and over for creative designs.", // lib/policies.ts:135
              },
              {
                activity: "Glass painting", // lib/policies.ts:136
                guidance: "Age 12 and over.", // lib/policies.ts:136
              },
              {
                activity: "Mandala painting", // lib/policies.ts:137
                guidance: "Age 12 and over.", // lib/policies.ts:136
              },
            ],
          },
          {
            blockType: "text", // lib/policies.ts:587
            body: "Create Together workshops.", // lib/policies.ts:587
          },
          {
            blockType: "ages", // lib/policies.ts:588
            source: "workshop", // lib/policies.ts:587
            rows: [
              {
                activity: "Candle making", // lib/policies.ts:148
                guidance: "Age 14 and over.", // lib/policies.ts:148
              },
              {
                activity: "Crocheting", // lib/policies.ts:149
                guidance: "Age 14 and over.", // lib/policies.ts:148
              },
            ],
          },
        ],
      },
    ],
    order: 6,
  },
  {
    title: "Your Finished Projects", // lib/policies.ts:609
    navLabel: "Finished projects", // lib/policies.ts:610
    slug: "finished-projects", // lib/policies.ts:608
    summary: "Collecting what you have made, and what happens if something breaks.", // lib/policies.ts:611
    sections: [
      {
        heading: "Collecting your project", // lib/policies.ts:614
        blocks: [
          {
            blockType: "text", // lib/policies.ts:617
            body: "Customers will be notified when their project is ready for collection. Finished projects should be collected within 30 days of notification. Maison Palettia may contact customers regarding projects that remain uncollected. Projects left uncollected beyond the applicable collection period may be subject to disposal or other handling in accordance with Maison Palettia's policy.", // lib/policies.ts:618
          },
          {
            blockType: "text", // lib/policies.ts:621
            body: "Firing and finishing times are estimates and may vary depending on studio workload and the nature of the project.", // lib/policies.ts:622
          },
        ],
      },
      {
        heading: "Damage and breakage", // lib/policies.ts:627
        blocks: [
          {
            blockType: "text", // lib/policies.ts:630
            body: "Maison Palettia takes reasonable care of customer projects and equipment. However, craft materials and handmade items can be fragile. Maison Palettia is not responsible for damage resulting from improper handling by the customer or from the inherent nature of the materials.", // lib/policies.ts:631
          },
          {
            blockType: "text", // lib/policies.ts:634
            body: "Where something has gone wrong with a project in our care, remedies are handled on a case-by-case basis. Please speak with our team.", // lib/policies.ts:635
          },
        ],
      },
    ],
    order: 7,
  },
  {
    title: "Photography & Media", // lib/policies.ts:657
    navLabel: "Photography & media", // lib/policies.ts:658
    slug: "photography-and-media", // lib/policies.ts:656
    summary: "When we photograph what you have made, and when we ask first.", // lib/policies.ts:659
    sections: [
      {
        heading: "Photography in the studio", // lib/policies.ts:662
        blocks: [
          {
            blockType: "text", // lib/policies.ts:665
            body: "Maison Palettia may photograph or display completed projects for promotional, educational or social media purposes. Where identifiable customers, particularly children, are included in promotional photography, Maison Palettia will obtain the appropriate consent.", // lib/policies.ts:666
          },
        ],
      },
    ],
    order: 8,
  },
];
