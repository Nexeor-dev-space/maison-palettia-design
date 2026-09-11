import { HeaderBar } from "@/components/layout/HeaderBar";
import { getDisciplines } from "@/lib/disciplines";
import { getAllWorkshops } from "@/lib/workshops";

/**
 * Global site header.
 *
 * A server component so the creative strands behind the Workshops menu, and
 * now the whole catalogue behind search, are read where every other consumer
 * reads them — through `getDisciplines` and `getAllWorkshops`, the two seams
 * a CMS will eventually replace. The bar itself is a client component because
 * it owns scroll, menu and search state; the data is handed down rather than
 * fetched there, so neither the menu nor a search result can ever fall out of
 * step with the pages that show the same disciplines and the same catalogue.
 *
 * Awaited in place rather than wrapped in <Suspense>: the header is the first
 * thing in the document and streaming it in late would leave a visitor
 * without navigation — or a working search box — for the first paint.
 */
export async function Header() {
  const [disciplines, workshops] = await Promise.all([getDisciplines(), getAllWorkshops()]);

  return <HeaderBar disciplines={disciplines} workshops={workshops} />;
}
