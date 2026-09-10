import { HeaderBar } from "@/components/layout/HeaderBar";
import { getDisciplines } from "@/lib/disciplines";

/**
 * Global site header.
 *
 * A server component so the creative strands behind the Workshops menu are
 * read where every other consumer reads them — through `getDisciplines`,
 * which is the seam a CMS will replace. The bar itself is a client component
 * because it owns scroll and menu state; the data is handed down rather than
 * fetched there, so the menu can never fall out of step with the homepage
 * section that shows the same four strands.
 *
 * Awaited in place rather than wrapped in <Suspense>: the header is the first
 * thing in the document and streaming it in late would leave a visitor
 * without navigation for the first paint.
 */
export async function Header() {
  const disciplines = await getDisciplines();

  return <HeaderBar disciplines={disciplines} />;
}
