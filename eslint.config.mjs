import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Written by `payload migrate:create`, committed, and never hand-edited.
    // Payload's template leaves the `payload` and `req` arguments of `up`/
    // `down` unused in every migration, so linting them is only noise
    // (docs/cms/research/00-spike.md, G16).
    "migrations/**",
  ]),
]);

export default eslintConfig;
