import type { Finding } from "@calos/domain-types";
import type { DisplayFinding } from "@calos/ui-kit";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;

/** @req DV-06: the UI Kit owns no domain-types import; the app proves the structural DTO contract. */
export type FindingDisplayContractProof = Assert<
  Equal<Finding, DisplayFinding>
>;
