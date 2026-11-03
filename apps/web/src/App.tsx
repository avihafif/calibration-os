import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createSystemI18n,
  messageReviewStatus,
  type SupportedLocale,
} from "@calos/i18n";
import {
  AppFrame,
  Badge,
  Button,
  Card,
  Notification,
  type Theme,
} from "@calos/ui-kit";

const environmentKind =
  import.meta.env.VITE_ENVIRONMENT_KIND === "production_rehearsal"
    ? "production_rehearsal"
    : "test";
const platformIdentifier = "CALOS-UI";
const technicalUnitSymbol = "Ω";

/** @req FR-UI-02, P1A-AC-08, P1A-AC-09: non-operational UI Kit demonstration. */
export function App({ workspace }: { workspace?: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const [theme, setTheme] = useState<Theme>("light");
  const [sampleCount, setSampleCount] = useState(2);
  const i18n = useMemo(() => createSystemI18n(locale), [locale]);
  const t = i18n.format;
  const navigation = [
    { id: "overview", label: t("shell.overview"), href: "#content" },
    { id: "technical", label: t("shell.technical"), href: "#technical" },
  ] as const;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = i18n.direction;
    document.title =
      (environmentKind === "test" ? "TEST" : "PRODUCTION REHEARSAL") +
      " · SIMULATION ONLY · " +
      t("app.title");
  }, [i18n, locale, t]);

  return (
    <AppFrame
      locale={locale}
      onLocaleChange={setLocale}
      theme={theme}
      onThemeChange={setTheme}
      deployment={environmentKind}
      navigation={navigation}
    >
      {workspace ?? (
        <>
          <div className="workspace-heading">
            <div>
              <p className="workspace-eyebrow">{t("shell.workspace")}</p>
              <h1>{t("shell.overview")}</h1>
            </div>
            <Badge tone="simulation">{t("mode.simulation")}</Badge>
          </div>
          <Notification tone="info">{t("app.description")}</Notification>
          <div id="technical" className="technical-panel">
            <Card title={t("app.technical")}>
              <dl className="technical-list">
                <dt>{t("app.identifier")}</dt>
                <dd>
                  <bdi dir="ltr">{platformIdentifier}</bdi>
                </dd>
                <dt>{t("app.kind")}</dt>
                <dd>
                  <bdi dir="ltr">{environmentKind}</bdi>
                </dd>
                <dt>{t("app.unit")}</dt>
                <dd>
                  <bdi dir="ltr">{technicalUnitSymbol}</bdi>
                </dd>
              </dl>
              <div className="count-control">
                <Button
                  ariaLabel={t("app.decrease")}
                  disabled={sampleCount === 0}
                  onClick={() =>
                    setSampleCount((count) => Math.max(0, count - 1))
                  }
                >
                  −
                </Button>
                <output aria-live="polite">
                  {t("app.count", { count: sampleCount })}
                </output>
                <Button
                  ariaLabel={t("app.increase")}
                  onClick={() => setSampleCount((count) => count + 1)}
                >
                  +
                </Button>
              </div>
            </Card>
          </div>
          {messageReviewStatus(locale, "app.title") === "needs_review" && (
            <p className="review-note">{t("app.review")}</p>
          )}
        </>
      )}
    </AppFrame>
  );
}
