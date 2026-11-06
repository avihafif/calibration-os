import { describe, expect, it } from "vitest";
import { parseHash } from "./router";

const ids = new Set(["overview", "technical", "forms", "data", "host"]);

/** @req OF-02, P1A-AC-05: Hostile hashes never resolve to prototype properties. */
describe("exact hash grammar", () => {
  it.each(["", "#", "#/"])("canonicalizes %j", (hash) => {
    expect(parseHash(hash, ids)).toEqual({ kind: "canonicalize" });
  });
  it.each(["overview", "technical", "forms", "data", "host"])(
    "accepts %s",
    (id) => expect(parseHash(`#/${id}`, ids)).toEqual({ kind: "route", id }),
  );
  it.each([
    "#/overview/",
    "#//overview",
    "#/overview?x=1",
    "#/overview#x",
    "#/OVERVIEW",
    "#/overview%20",
    "#/%6fverview",
    "#/__proto__",
    "#/constructor",
    "#/toString",
    "#content",
    "#technical",
    `#/overview${"a".repeat(10_000)}`,
    "#/over\u202eview",
    "#/over\u0000view",
  ])("rejects %j", (hash) => {
    expect(parseHash(hash, ids)).toEqual({ kind: "unknown" });
  });
});
