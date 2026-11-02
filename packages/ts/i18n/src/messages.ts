/** Platform-owned system text only. Authored content is not a system bundle. @req FR-UI-02 */
export const enMessages = Object.freeze({
  "app.title": "CalOS · Frontend foundation",
  "app.description":
    "Simulation-only frontend foundation. Application authoring, execution, and reports are unavailable.",
  "app.skip": "Skip to content",
  "app.language": "Language",
  "app.english": "English",
  "app.hebrew": "Hebrew",
  "app.sample": "Metadata example",
  "app.kind": "Kind",
  "app.name": "Name",
  "app.provenance": "Provenance",
  "app.technical": "Technical text example",
  "app.identifier": "Identifier",
  "app.identifierValue": "Identifier: {identifier}",
  "app.unit": "Unit symbol",
  "app.count":
    "{count, plural, =0 {No sample items} one {One sample item} other {# sample items}}",
  "app.decrease": "Decrease sample count",
  "app.increase": "Increase sample count",
  "app.review": "Hebrew terminology needs review",
  "mode.simulation": "SIMULATION ONLY · NOT A CALIBRATION · NON-OPERATIONAL",
  "mode.test": "TEST · SIMULATION ONLY",
  "mode.rehearsal": "PRODUCTION REHEARSAL · NO REAL CALIBRATION",
} as const);

export type SystemMessageKey = keyof typeof enMessages;

export const heMessages = Object.freeze({
  "app.title": "CalOS · תשתית ממשק משתמש",
  "app.description":
    "תשתית ממשק להדמיה בלבד. עריכת יישומים, הרצה ודוחות אינם זמינים.",
  "app.skip": "דילוג לתוכן",
  "app.language": "שפה",
  "app.english": "אנגלית",
  "app.hebrew": "עברית",
  "app.sample": "דוגמת מטא־נתונים",
  "app.kind": "סוג",
  "app.name": "שם",
  "app.provenance": "מקור",
  "app.technical": "דוגמת טקסט טכני",
  "app.identifier": "מזהה",
  "app.identifierValue": "מזהה: {identifier}",
  "app.unit": "סימן יחידה",
  "app.count":
    "{count, plural, =0 {אין פריטים לדוגמה} one {פריט אחד לדוגמה} two {שני פריטים לדוגמה} other {# פריטים לדוגמה}}",
  "app.decrease": "הפחתת מספר הפריטים לדוגמה",
  "app.increase": "הגדלת מספר הפריטים לדוגמה",
  "app.review": "המינוח בעברית דורש סקירה",
  "mode.simulation": "הדמיה בלבד · לא כיול · לא תפעולי",
  "mode.test": "בדיקה · הדמיה בלבד",
  "mode.rehearsal": "חזרת ייצור · אין לבצע כיול אמיתי",
} as const satisfies Record<SystemMessageKey, string>);
