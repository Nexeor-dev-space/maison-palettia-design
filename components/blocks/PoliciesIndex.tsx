import { PoliciesIndex } from "@/components/sections/policies/PoliciesIndex";
import { getPolicies } from "@/lib/policies";


/** `policiesIndex` → <PoliciesIndex> (SPEC §E.1). No fields: the rows are the `policies` collection, in order. */
export async function PoliciesIndexAdapter() {
  return <PoliciesIndex policies={await getPolicies()} />;
}
