import type { SystemMessageKey } from "@calos/i18n";
import type { DeploymentKind } from "@calos/ui-kit";

export interface RouteDefinition {
  readonly id: string;
  readonly titleKey: SystemMessageKey;
  readonly href: `#/${string}`;
}

/** @req FR-UI-02, OF-02: Environment-scoped navigation metadata, not domain screens. */
export function buildRoutes(kind: DeploymentKind): readonly RouteDefinition[] {
  const common: RouteDefinition[] = [
    { id: "overview", titleKey: "shell.overview", href: "#/overview" },
    { id: "technical", titleKey: "shell.technical", href: "#/technical" },
  ];
  if (kind === "test") {
    common.push(
      { id: "forms", titleKey: "route.forms", href: "#/forms" },
      { id: "data", titleKey: "route.data", href: "#/data" },
      { id: "host", titleKey: "route.host", href: "#/host" },
    );
  }
  return common;
}
