import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The programme moved from /workshops to /events.
   *
   * Redirects rather than a clean break: /workshops has been the destination
   * of every booking action on the site, it is in the footer, and it is what
   * anyone who has already shared a link is holding. A 404 would be the site
   * breaking its own promises to make a rename tidy.
   *
   * Permanent, because the move is. That does mean browsers and search engines
   * will cache it — which is the right outcome here and worth knowing before
   * anyone reverses the rename.
   */
  async redirects() {
    return [
      { source: "/workshops", destination: "/events", permanent: true },
      { source: "/workshops/:slug", destination: "/events/:slug", permanent: true },
      { source: "/workshops/:slug/book", destination: "/events/:slug/book", permanent: true },
    ];
  },
};

export default nextConfig;
