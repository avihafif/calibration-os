import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createSystemI18n,
  messageReviewStatus,
  type SupportedLocale,
} from "@calos/i18n";
import { ProtectedMarkings, WorkspaceErrorBoundary } from "./ProtectedFrame";

const environmentKind =
  import.meta.env.VITE_ENVIRONMENT_KIND === "production_rehearsal"
    ? "production_rehearsal"
    : "test";
const platformIdentifier = "CALOS-UI";
const technicalUnitSymbol = "Ω";

/** @req FR-UI-02, P1A-AC-08, P1A-AC-09: non-operational i18n demonstration. */
export function App({ workspace }: { workspace?: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const [sampleCount, setSampleCount] = useState(2);
  const i18n = useMemo(() => createSystemI18n(locale), [locale]);
  const t = i18n.format;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = i18n.direction;
    document.title = `${environmentKind === "test" ? "TEST" : "PRODUCTION REHEARSAL"} · SIMULATION ONLY · ${t("app.title")}`;
  }, [i18n, locale, t]);

  return (
    <>
      <a className="skip-link" href="#content">
        {t("app.skip")}
      </a>
      <ProtectedMarkings locale={locale} deployment={environmentKind} />
      <main lang={locale} dir={i18n.direction}>
        <header>
          <div className="topline">
            <strong className="wordmark">{t("app.title")}</strong>
            <div className="language-control">
              <label htmlFor="language">{t("app.language")}</label>
              <select
                id="language"
                lang={locale}
                dir={i18n.direction}
                value={locale}
                onChange={(event) => {
                  const next = event.currentTarget.value;
                  if (
                    next === "en" ||
                    next === "he" ||
                    (environmentKind === "test" &&
                      (next === "en-XA" || next === "he-XB"))
                  )
                    setLocale(next);
                }}
              >
                <option value="en">{t("app.english")}</option>
                <option value="he">{t("app.hebrew")}</option>
                {environmentKind === "test" && (
                  <>
                    <option value="en-XA">{t("app.pseudoEnglish")}</option>
                    <option value="he-XB">{t("app.pseudoHebrew")}</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </header>
        <div id="content" className="content" tabIndex={-1}>
          <WorkspaceErrorBoundary locale={locale}>
            {workspace ?? (
              <>
                <p className="description">{t("app.description")}</p>
                <article aria-labelledby="technical-title">
                  <h1 id="technical-title">{t("app.technical")}</h1>
                  <dl>
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
                    <button
                      type="button"
                      aria-label={t("app.decrease")}
                      disabled={sampleCount === 0}
                      onClick={() =>
                        setSampleCount((count) => Math.max(0, count - 1))
                      }
                    >
                      −
                    </button>
                    <output aria-live="polite">
                      {t("app.count", { count: sampleCount })}
                    </output>
                    <button
                      type="button"
                      aria-label={t("app.increase")}
                      onClick={() => setSampleCount((count) => count + 1)}
                    >
                      +
                    </button>
                  </div>
                </article>
                {messageReviewStatus(locale, "app.title") ===
                  "needs_review" && (
                  <p className="review-note">{t("app.review")}</p>
                )}
              </>
            )}
          </WorkspaceErrorBoundary>
        </div>
      </main>
    </>
  );
}
