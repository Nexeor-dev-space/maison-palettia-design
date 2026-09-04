import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";

interface PagePlaceholderProps {
  title: string;
  /** Which build phase will replace this scaffold with the real design. */
  phase: string;
}

/**
 * TEMPORARY scaffold. Gives every route a valid, accessible document outline
 * while the real sections are designed phase by phase, and exercises the
 * shared motion system so it stays verified. Delete each usage as that page is
 * built — and delete this file once none remain.
 */
export function PagePlaceholder({ title, phase }: PagePlaceholderProps) {
  return (
    <Container as="section" className="py-section">
      <Stagger>
        <Reveal>
          <p className="text-xs uppercase tracking-eyebrow text-muted">Maison Palettia</p>
        </Reveal>
        <Reveal variant="subtleReveal">
          <h1 className="mt-4 text-4xl md:text-6xl">{title}</h1>
        </Reveal>
        <Reveal>
          <p className="mt-6 max-w-reading text-sm leading-relaxed text-muted">
            Placeholder route. The design for this page arrives in {phase}.
          </p>
        </Reveal>
      </Stagger>
    </Container>
  );
}
