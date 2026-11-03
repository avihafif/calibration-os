import type { ReactNode } from "react";
import { Component } from "react";
import { createSystemI18n, type SupportedLocale } from "@calos/i18n";

export type DeploymentKind = "test" | "production_rehearsal";

/** @req FR-UI-02: immutable deployment and simulation markings. */
export function ProtectedMarkings({
  locale,
  deployment,
}: {
  locale: SupportedLocale;
  deployment: DeploymentKind;
}) {
  const t = createSystemI18n(locale).format;
  return (
    <aside
      className="protected-markings"
      data-frame-badges
      aria-label={t("mode.simulation")}
    >
      <strong
        className="protected-marking deployment"
        data-deployment={deployment}
        role="status"
      >
        <span aria-hidden="true">◆</span>{" "}
        {deployment === "test" ? t("mode.test") : t("mode.rehearsal")}
      </strong>
      <strong className="protected-marking simulation" role="note">
        <span aria-hidden="true">◆</span> {t("mode.simulation")}
      </strong>
    </aside>
  );
}

/** Error handling is confined to content. Markings are rendered outside this boundary. */
export class WorkspaceErrorBoundary extends Component<
  { locale: SupportedLocale; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      const t = createSystemI18n(this.props.locale).format;
      return (
        <section className="workspace-error" role="alert">
          <h1>{t("app.errorTitle")}</h1>
          <p>{t("app.errorBody")}</p>
        </section>
      );
    }
    return this.props.children;
  }
}
