import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { HERO_VIDEO, SITE, WORKSHOPS_HREF } from "@/lib/constants";
import { getMallPartners } from "@/lib/partners";

/**
 * Homepage hero — one film, one statement, one door.
 *
 * WHAT THIS REPLACES. A carousel of four photographs, each with its own
 * eyebrow and its own large statement, turning every six seconds behind a row
 * of rule indicators. It was four openings rather than one, and it spent the
 * most valuable screen on the site proving the Maison does more than one
 * thing — which the Creative Experiences menu now does properly, with a name
 * under every picture. The client asked for one film instead, and it is the
 * better hero: hands, a brush and paint going onto cloth, continuously,
 * instead of a slideshow of stills.
 *
 * THE HEADING IS VISIBLE NOW, and that is a direct consequence. It was
 * `sr-only` because the large type changed with the carousel, and a document
 * whose <h1> changes every six seconds has no stable heading. Nothing changes
 * any more, so the line on screen and the line in the outline are the same
 * line — which is what a heading is supposed to be.
 *
 * THE CONTENT IS LOW AND LEFT-ALIGNED, NOT CENTRED, and that is not a style
 * preference. The header's mark is centred and sits transparent over this on
 * the homepage; a centred hero would stack directly beneath it and read as the
 * same brand printed twice. Anchoring low also leaves the top two thirds of
 * the frame — the hands and the brush — completely uncovered, which is what
 * keeps the film a film rather than a backdrop.
 *
 * IT SPANS THE FRAME RATHER THAN SITTING IN A CORNER. The type used to be one
 * cluster capped at 46rem, which on a wide screen is half the width in one
 * corner with the other half bare — the hero read as empty, and it was. The
 * statement now runs the full container at `--text-display`, with a full-width
 * rule under it and a band below carrying the action at one end and the place
 * at the other. See the note on the <Container> for why three bands rather
 * than one block.
 *
 * Still `sticky top-0 z-0`: app/page.tsx wraps this with the two sections that
 * rise over and cover it, and that behaviour is not part of this change.
 */
export async function Hero() {
  /*
    The one place-truth the site has. Read here rather than hard-coded so the
    hero can never name a venue the rest of the site does not — see
    lib/partners.ts, which is deliberately a single confirmed destination.
  */
  const partners = await getMallPartners();

  return (
    <section
      aria-labelledby="hero-heading"
      className="sticky top-0 z-0 isolate -mt-header flex h-svh flex-col justify-center overflow-hidden bg-text [--color-focus:var(--color-cream)] md:-mt-header-lg"
    >
      {/*
        The poster, under the film and painted first.

        `priority`, because until the video has enough of itself to show a
        frame this *is* the hero — it is the page's LCP candidate and the one
        image worth preloading. It is also the whole hero for a reader who has
        asked for reduced motion, which is why it is a real <Image> with real
        alt text rather than the video's `poster` attribute: that attribute
        carries no alternative text and disappears the moment the film plays.
      */}
      <Image
        src={HERO_VIDEO.poster.src}
        alt={HERO_VIDEO.poster.alt}
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 object-cover"
      />

      {/*
        The film.

        `aria-hidden` and out of the tab order: the poster underneath already
        carries the description, and announcing the same shot twice helps
        nobody. Muted, looped and `playsInline` — the three things a background
        film has to be for a browser to start it at all, and `playsInline` is
        what stops iOS taking it fullscreen.

        `motion-reduce:hidden` rather than a paused video: hidden, the poster
        behind it is simply what is there, with no control to find and no
        frozen frame that looks like a broken player. The same arrangement
        <Gallery> uses for its own tiles.

        `preload="metadata"` — enough to know the dimensions and start, without
        pulling six megabytes into a page a visitor may never scroll.
      */}
      <video
        src={HERO_VIDEO.src}
        aria-hidden
        tabIndex={-1}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
      />

      {/*
        The head wash exists for the navigation, not for the hero. The bar is
        transparent over this film on the homepage, and its links, its centred
        mark and the phone's icon buttons all have to stay legible over
        whatever frame happens to be showing.

        IT HAS TO PLATEAU, NOT RAMP. A wash that starts at its darkest and
        fades immediately is already well down by the bottom of the nav row.
        So it holds flat past the nav and only then falls away — long enough
        that it reads as light behind the bar rather than as a bar.

        Kept at the alpha the carousel needed, which was solved against the
        brightest of four photographs. See the note in <Hero>'s own history:
        the figure answers the worst frame, not the first one.
      */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-text/80 via-text/80 via-45% to-transparent md:h-56 md:via-40%"
      />

      {/*
        THE WASH A CENTRED BLOCK SITS ON.

        What this replaces was solved for type in the bottom-left corner: a
        foot rise and a ramp across, both anchored to edges the block no longer
        touches. Centred type has no edge to lean on, so the treatment has to
        be the frame itself.

        An even wash with a vignette over it. The flat layer is what the words
        actually stand on; the vignette puts the extra ink at the corners,
        where nothing is being read, so the middle of the film — the hand, the
        brush, the cloth — keeps as much of itself as the contrast allows.
        Solved against the brightest sampled frame rather than an average.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-text/65" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          /*
            CENTRE-WEIGHTED, NOT A VIGNETTE — and the first attempt here was a
            vignette, which is why it failed. A vignette is transparent in the
            middle and dark at the corners; the block is in the middle, so it
            put the ink everywhere the type is not. Measured, the heading came
            back at 2.57:1 against the 3:1 large type owes.

            Inverted, it adds ink under the block and fades out well before the
            frame's edges, so the corners of the film — which nobody is reading
            over — keep the most of themselves.

            Centred at 42% rather than 46%, and with a longer plateau, because
            the eyebrow sits above the heading and came back 0.15 short at 1440
            with the focus lower. The block's own centre is around 44% of the
            frame; the ink is held a little above it so the top of the stack is
            covered as well as the middle.
          */
          background:
            "radial-gradient(100% 82% at 50% 42%, " +
            "color-mix(in oklab, var(--color-text) 32%, transparent) 0%, " +
            "color-mix(in oklab, var(--color-text) 28%, transparent) 55%, " +
            "transparent 85%)",
        }}
      />

      <Container className="relative z-10 pb-[7vh] md:pb-[9vh]">
        {/*
          A CENTRED STACK, MID-FRAME — the arrangement the client pointed at.

          Four things down the middle of the screen, each centred on the same
          axis: what this is, what it says, the one way in, and where it
          happens. Nothing is anchored to an edge and nothing runs the full
          width, so the film is framed by the type rather than fenced by it.

          WHY CENTRING IS SAFE HERE WHEN IT WAS NOT BEFORE. This file used to
          argue — correctly — that a centred hero block reads as the brand
          printed twice, because the header's mark is centred and transparent
          over it. That holds for a block near the top. Vertically centred
          there is about 300px of clear film between the two at 1440, and they
          stop arguing. Bottom-left was one answer to that problem; this is the
          other, and it is the one that was asked for.

          The `pb` is optical rather than arithmetic: a block centred by
          measurement reads low, and the foot of this frame is where the film
          has most going on.
        */}
        {/*
          64rem, not 52. "ART, CRAFT AND" sets about 870px at the display
          size's 104px ceiling, so a 52rem measure broke it again — three
          lines at 1280 and 1440 with the orphan back. The measure has to be
          wider than the longest authored line or authoring it achieves
          nothing.
        */}
        <Stagger className="mx-auto max-w-[64rem] text-center">
          <Reveal>
            {/*
              The studio's own tagline, not a line written for this hero —
              see SITE in lib/constants.ts. It says the what and the where in
              seven words, which is exactly what an eyebrow is for.
            */}
            {/*
              No leading hairline here, and only here. That rule is the site's
              device for an eyebrow that starts at a margin; centred, it would
              have to be mirrored on both sides to balance, and two rules
              around seven words is a nameplate.
            */}
            <p className="text-label font-medium uppercase tracking-eyebrow text-cream">
              {SITE.tagline}
            </p>
          </Reveal>

          <Reveal variant="subtleReveal">
            {/*
              Full measure and display size. `text-display` carries its own
              0.95 leading, which is what makes two lines of this read as one
              mass rather than as two sentences — do not override it with the
              body leading the old 46rem version used.
            */}
            {/*
              TWO LINES, AUTHORED — because three is what it set on its own.

              Centred at display size in a 52rem measure it broke as "ART,
              CRAFT / AND / COMMUNITY.", which leaves "AND" alone on a line of
              its own: the classic orphan, and the one thing a centred headline
              cannot carry. The break belongs between the clauses.

              Inline below `sm` so a narrow phone is still allowed to flow —
              the same arrangement <EditorialStatement> and <MallPartners>
              use, and for the same reason: an authored break only helps where
              there is a measure worth breaking.
            */}
            <h1
              id="hero-heading"
              className="mt-6 text-display font-light uppercase leading-[0.95] tracking-[-0.02em] text-cream md:mt-7"
            >
              <span className="inline sm:block">Art, craft and</span>{" "}
              <span className="inline sm:block">community.</span>
            </h1>
          </Reveal>

          {/*
            The way in, centred under the statement — Goodman's arrangement
            and, on this composition, the only one that works: a full-width
            rule with the action at one end and the place at the other is a
            band, and a band fences a centred block instead of finishing it.

            The rule went with it. It was the floor of a three-band layout;
            under a centred stack it would draw a line across the film for no
            reason.
          */}
          <Reveal variant="fadeIn">
            {/*
              A filled button, at the client's ask, where a ruled link used to
              be. Deep Lilac with `on-primary` on it — the same control the
              booking flow ends on and the same one every other primary action
              on the site uses, so the hero speaks the site's language rather
              than a louder dialect of its own.

              Its own ground means its contrast does not depend on the frame
              behind it, which is the other reason a filled control is the
              right answer over a moving picture.
            */}
            <Link
              href={WORKSHOPS_HREF}
              className="group mt-10 inline-flex min-h-11 items-center justify-center gap-2.5 rounded-sm bg-primary px-8 py-4 text-action font-medium uppercase leading-none tracking-eyebrow text-on-primary transition-colors duration-300 ease-soft hover:bg-primary/90 md:mt-12"
            >
              Explore events
              <span
                aria-hidden
                className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
              >
                &#8594;
              </span>
            </Link>
          </Reveal>

          {/*
            And where it happens, last and quietest.

            A visitor's first question about a studio with no fixed address is
            where it actually is, so it earns a line — but under the action
            rather than opposite it, because on a centred stack the far end of
            a row is nowhere. The list comes from lib/partners.ts and grows
            with it rather than being retyped, so the hero can never name a
            venue the rest of the site does not.
          */}
          {partners.length > 0 ? (
            <Reveal variant="fadeIn">
              <p className="mt-8 text-fine text-cream/80 md:mt-10">
                <span className="uppercase tracking-eyebrow text-cream/60">Where we set up</span>
                <span aria-hidden className="mx-3 text-cream/40">&middot;</span>
                {partners.map((partner) => partner.name).join(" · ")}
                <span className="text-cream/60">, {partners[0].locality}</span>
              </p>
            </Reveal>
          ) : null}

        </Stagger>
      </Container>

    </section>
  );
}
