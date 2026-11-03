import { useEffect, useMemo, useState } from "react";
import {
  createSystemI18n,
  messageReviewStatus,
  type SystemLocale,
} from "@calos/i18n";

const environmentKind =
  import.meta.env.VITE_ENVIRONMENT_KIND === "production_rehearsal"
    ? "production_rehearsal"
    : "test";
const platformIdentifier = "CALOS-UI";

/** @req FR-UI-02, P1A-AC-08, P1A-AC-09: non-operational i18n demonstration. */
export function App() {
  const [locale, setLocale] = useState<SystemLocale>("en");
  const [sampleCount, setSampleCount] = useState(2);
  const i18n = useMemo(() => createSystemI18n(locale), [locale]);
  const t = i18n.format;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = i18n.direction;
    document.title = t("app.title");
  }, [i18n, locale, t]);

  return (
    <>
      <a className="skip-link" href="#content">
        {t("app.skip")}
      </a>
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
                  if (next === "en" || next === "he") setLocale(next);
                }}
              >
                <option value="en">{t("app.english")}</option>
                <option value="he">{t("app.hebrew")}</option>
              </select>
            </div>
          </div>
        </header>
        <div id="content" className="content" tabIndex={-1}>
          <p className="warning" role="note">
            {t("mode.simulation")}
          </p>
          <p className="environment">
            {environmentKind === "test" ? t("mode.test") : t("mode.rehearsal")}
          </p>
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
                <bdi dir="ltr">Ω</bdi>
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
          {messageReviewStatus(locale, "app.title") === "needs_review" && (
            <p className="review-note">{t("app.review")}</p>
          )}
        </div>
      </main>
    </>
  );
}
