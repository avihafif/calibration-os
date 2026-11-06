import { useEffect, useSyncExternalStore } from "react";

export type ParsedRoute =
  | { readonly kind: "canonicalize" }
  | { readonly kind: "route"; readonly id: string }
  | { readonly kind: "unknown" };

/** @req OF-02, P1A-AC-05: Parse a small, exact, undecoded route grammar. */
export function parseHash(hash: string, ids: ReadonlySet<string>): ParsedRoute {
  if (hash === "" || hash === "#" || hash === "#/")
    return { kind: "canonicalize" };
  if (hash.length > 64) return { kind: "unknown" };
  const match = /^#\/([a-z][a-z0-9-]{0,31})$/u.exec(hash);
  return match && ids.has(match[1])
    ? { kind: "route", id: match[1] }
    : { kind: "unknown" };
}

function subscribeHash(listener: () => void): () => void {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

function currentHash(): string {
  return window.location.hash || "#/overview";
}

/** @req OF-02: No router storage, data loaders or runtime network. */
export function useHashRoute(ids: ReadonlySet<string>): ParsedRoute {
  const hash = useSyncExternalStore(
    subscribeHash,
    currentHash,
    () => "#/overview",
  );
  useEffect(() => {
    if (
      window.location.hash === "" ||
      window.location.hash === "#" ||
      window.location.hash === "#/"
    ) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#/overview`,
      );
    }
  }, []);
  const parsed = parseHash(hash, ids);
  return parsed.kind === "canonicalize"
    ? { kind: "route", id: "overview" }
    : parsed;
}
