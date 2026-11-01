import { useState } from "react";
import type { Manufacturer } from "@calos/domain-types";
import example from "../../../fixtures/manufacturer/valid.json";

type Locale = "en" | "he";
const messages = {
  en: {
    title: "CalOS · Phase 0A",
    banner: "SIMULATION ONLY · NOT A CALIBRATION · NON-OPERATIONAL",
    description:
      "Walking skeleton. Application authoring, execution, and reports are not available.",
    metadata: "Metadata example",
    locale: "Language",
    kind: "Kind",
    name: "Name",
    provenance: "Provenance",
    test: "TEST WALKING SKELETON",
    rehearsal: "PRODUCTION REHEARSAL · NO REAL CALIBRATION",
  },
  he: {
    title: "CalOS · שלב 0A",
    banner: "סימולציה בלבד · לא כיול · לא תפעולי",
    description: "שלד ראשוני. עריכת יישומים, הרצה ודוחות אינם זמינים.",
    metadata: "דוגמת מטא-נתונים",
    locale: "שפה",
    kind: "סוג",
    name: "שם",
    provenance: "מקור",
    test: "שלד סביבת בדיקה",
    rehearsal: "חזרת ייצור · אין לבצע כיול אמיתי",
  },
} satisfies Record<Locale, Record<string, string>>;

const metadata: Manufacturer = example.content;
const isRehearsal =
  import.meta.env.VITE_ENVIRONMENT_KIND === "production_rehearsal";

export function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = messages[locale];
  return (
    <main dir={locale === "he" ? "rtl" : "ltr"}>
      <header>
        <div className="topline">
          <strong>{t.title}</strong>
          <label>
            {t.locale}{" "}
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <option value="en">English</option>
              <option value="he">עברית</option>
            </select>
          </label>
        </div>
      </header>
      <section className="content">
        <p className="warning" role="status">
          {t.banner}
        </p>
        <p className="environment">{isRehearsal ? t.rehearsal : t.test}</p>
        <p>{t.description}</p>
        <article>
          <h1>{t.metadata}</h1>
          <dl>
            <dt>{t.kind}</dt>
            <dd>{example.kind}</dd>
            <dt>{t.name}</dt>
            <dd>{metadata.name[locale]}</dd>
            <dt>{t.provenance}</dt>
            <dd>{example.provenance.status}</dd>
          </dl>
        </article>
      </section>
    </main>
  );
}
