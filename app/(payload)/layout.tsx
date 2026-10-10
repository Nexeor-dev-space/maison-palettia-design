/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config";
import "@payloadcms/next/css";
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import React from "react";

import { importMap } from "./admin/importMap.js";
import "./custom.scss";

/*
  The admin's ROOT layout — the second of two in this app (app/(site)/layout.tsx
  is the site's). Separate root layouts mean separate CSS graphs: Tailwind,
  Lenis, the fonts and the intro script never reach /admin, and Payload's SCSS
  never reaches the site (docs/cms/research/00-spike.md, G4–G6). Keep it as
  Payload generates it; brand overrides go in ./custom.scss.
*/

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
