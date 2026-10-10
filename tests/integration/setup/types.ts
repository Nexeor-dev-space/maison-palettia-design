/** What the integration global setup hands every test file (see globalSetup.ts). */
export type IntegrationDb = {
  /** postgres://…/maison_test_it_<unix>_<hex> — a throwaway database, never the project's. */
  url: string;
  dbName: string;
  /** A PAYLOAD_SECRET for this run only. */
  secret: string;
  /** Run-unique invoice / credit-note prefixes, so PDFs written to private/invoices can be told apart and removed. */
  invoicePrefix: string;
  creditNotePrefix: string;
};

declare module "vitest" {
  export interface ProvidedContext {
    integrationDb: IntegrationDb | null;
  }
}
