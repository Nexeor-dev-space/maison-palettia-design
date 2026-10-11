import { getBrandLogo, getContact, getSite, getSocialLinks } from "@/lib/constants.server";
import { absoluteUrl, localBusinessJsonLd, type JsonLdSite } from "@/lib/jsonLd";
import { getMallPartners } from "@/lib/partners";

/**
 * The server halves of lib/jsonLd.ts: gather the inputs from Site details,
 * the venues and the logo, then hand them to the pure builders. Server only
 * — every reader here goes through the Local API.
 */

/** Name, legal name, confirmed origin and an absolute logo URL. */
export async function getJsonLdSite(): Promise<JsonLdSite> {
  const [site, logo] = await Promise.all([getSite(), getBrandLogo()]);
  return {
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: logo.onLight.src ? absoluteUrl(site, logo.onLight.src) : null,
  };
}

/**
 * The LocalBusiness object for the pages that introduce the Maison. The
 * description is the page's own meta description, so the two cannot drift;
 * left out, it is the site's tagline (the homepage), read in the same pass
 * as the rest rather than by a second round trip.
 */
export async function getLocalBusinessJsonLd(description?: string): Promise<Record<string, unknown>> {
  const [site, logo, contact, socials, partners] = await Promise.all([
    getSite(),
    getBrandLogo(),
    getContact(),
    getSocialLinks(),
    getMallPartners(),
  ]);
  const jsonLdSite: JsonLdSite = {
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: logo.onLight.src ? absoluteUrl(site, logo.onLight.src) : null,
  };
  return localBusinessJsonLd({ site: jsonLdSite, contact, socials, partners, description: description ?? site.tagline });
}
