import { describe, expect, it } from "vitest";
import { buildRoutes } from "./routes";

/** @req OF-02, ADR-0024: Demo pages are absent from Rehearsal's route table. */
describe("environment routes", () => {
  it("exposes five Test routes and two Rehearsal routes", () => {
    expect(buildRoutes("test").map((route) => route.id)).toEqual([
      "overview",
      "technical",
      "forms",
      "data",
      "host",
    ]);
    expect(
      buildRoutes("production_rehearsal").map((route) => route.id),
    ).toEqual(["overview", "technical"]);
  });
});
