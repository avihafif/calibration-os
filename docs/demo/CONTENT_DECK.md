# CONTENT_DECK.md — Demo V1 (S1 "Thin Thread") interface text, English and Hebrew

| | |
|---|---|
| Status | **Proposal, documentation only (WP-DV1-0).** Nothing here is implemented, approved or reviewed. It authorises no code, workflow, dependency, schema, gate or governance change. |
| Parent | [`DEMO_V1_PLAN.md`](DEMO_V1_PLAN.md) (merged in PR #38 as `5c3b385`). Owner decisions DV-DEC-01 to DV-DEC-09 were accepted on 2026-11-07 ([plan section 18.1](DEMO_V1_PLAN.md)); that record does not approve this deck. |
| Companions | [`FIXTURES_SPEC.md`](FIXTURES_SPEC.md) (entity names and scripted data, authoritative for fixture text) · [`TEST_PLAN.md`](TEST_PLAN.md) · [`OWNER_CHECKLIST.md`](OWNER_CHECKLIST.md) (open decisions) |
| Scope | Slice **S1** only: routes `demo-dashboard`, `demo-work`, `demo-job`, `demo-run`, `demo-report`, and the card on `overview`. S2 strings are listed once in section 14 so nothing is invented late, and are **not** part of S1. |
| Hebrew | **Every Hebrew value in this document has status `needs_review`** (H-8, MI-31, Q-15). No agent marks anything reviewed. Column headers say so; the machine-readable catalog built from this deck must carry the same status per key. |
| Written by | The same agent family (Claude) that wrote the plan. A human linguist and the owner must review it (R4). It is not an independent audit. |

## 0. How to read and review this deck

### 0.1 What is in it

Chrome strings (headings, labels, buttons, messages, disclaimers, accessible names) are ICU message keys destined for `packages/ts/i18n/src/messages-demo.ts` (plan DV-L10N-01). **Fixture text** (customer, instrument, work-order and procedure names, scripted step titles) is `{ en, he }` data in the quarantined demo module and is specified, with its Hebrew, in `FIXTURES_SPEC.md`; this deck indexes it in section 11 and does not repeat it.

Key convention: `demo.<area>.<name>`. Technical constants (ids, `su`, `synthetic_demo`, `MI-nn`, step-type names) are **not** translated; they render through `DisplayText technical` (LTR isolate). Placeholders `{like_this}` are ICU arguments; arguments that carry ids or values are isolated LTR by the formatter, never concatenated.

### 0.2 Rules every string follows

| Rule | Meaning |
|---|---|
| R-L1 | No claim words (plan Appendix B; list in sections 12 and 13). Allowed only as the exact protected phrases in section 10. |
| R-L2 | No real manufacturer, model, vendor, customer, standard, accreditation body, certificate wording, person, contact, place or trademark. |
| R-L3 | No limit, tolerance, test-point value, range, interval, standard value, uncertainty, safety value or real unit. The only unit is `su`. A slot that would hold one reads `Input required` plus its `MI-nn`. |
| R-L4 | Nothing says or implies approved, signed, issued, released, published, verified, official, passed, failed, compliant, calibrated or certified, for any object. |
| R-L5 | Words that already carry a Hebrew double meaning are avoided (section 12.2), for example "compatible" is never translated with the word that also means "compliant". |
| R-L6 | The shell's protected markings and the Hebrew review note are reused unchanged (section 1). |
| R-L7 | Length budget: layouts must tolerate +40 percent (pseudo-locales `en-XA`, `he-XB` at 320 px). Strings longer than the "max" hint are flagged for the owner. |
| R-L8 | "Scripted", "simulated", "synthetic" are used precisely: *scripted* = a fixed value or event, *simulated* = a stand-in for an instrument or run, *synthetic* = fictional data. |

### 0.3 Owner and linguist review checkpoints (nothing below is checked)

| ID | Checkpoint | Who | Evidence of completion | Status |
|---|---|---|---|---|
| CD-RC-01 | English wording of every row in sections 2 to 10 read and accepted or amended | Owner | Reviewed copy of this file, or a PR comment listing changes | Open |
| CD-RC-02 | Hebrew wording and glossary (section 12) reviewed; each key either changed or left `needs_review` | Human linguist (H-8), owner | Reviewed glossary; **the status stays `needs_review` until a human sets it** | Open |
| CD-RC-03 | Protected disclaimers (section 10) accepted exactly as written, including the English constants beside Hebrew | Owner (and Quality Manager if the owner wants it) | Owner record | Open |
| CD-RC-04 | Banned-word lists, both languages, and their allow-list (sections 12.3 and 13) accepted | Owner, linguist | Owner record | Open |
| CD-RC-05 | Open questions in section 16 answered (title wording, report negations in English under Hebrew, and so on) | Owner | Owner record | Open |
| CD-RC-06 | Fixture text (section 11 pointer, authoritative list in `FIXTURES_SPEC.md`) checked for trademark and look-alike risk (Q-08, MI-01, DV-RISK-08) | Owner | Owner record | Open |

The code package that consumes this deck (PR-2 messages, PR-3 screens) must not start until CD-RC-01, -03, -04, -05 and -06 are closed by the owner, and CD-RC-02 is either closed or explicitly deferred with Hebrew still visibly `needs_review`.

## 1. Strings reused unchanged from the shell (not part of this deck's key set)

| Existing key | English | Hebrew (existing, needs_review) | Use |
|---|---|---|---|
| `mode.simulation` | SIMULATION ONLY · NOT A CALIBRATION · NON-OPERATIONAL | הדמיה בלבד · לא כיול · לא תפעולי | Protected marking, every route |
| `mode.test` | TEST · SIMULATION ONLY | (existing) | Protected marking |
| `app.review` | Hebrew terminology needs review | המינוח בעברית דורש סקירה | Shown on each demo route in Hebrew |
| `route.notFound` / `route.notFoundBody` / `route.notFoundLink` | Page not found / This page is unavailable in this deployment. / Go to overview | (existing) | Demo hashes in Production Rehearsal |
| `shell.*` | navigation, skip link, locale and theme labels | (existing) | Unchanged |

## 2. Navigation, palette and overview card

| Key | English (max) | Hebrew (needs_review) | Notes |
|---|---|---|---|
| `demo.nav.dashboard` | Dashboard (20) | לוח בקרה | Route `demo-dashboard`; also the command-palette label |
| `demo.nav.work` | Work orders (20) | הזמנות עבודה | `demo-work` |
| `demo.nav.job` | Job set-up (20) | הגדרת משימה | `demo-job` |
| `demo.nav.run` | Run console (20) | קונסולת הרצה | `demo-run` |
| `demo.nav.report` | Results and report (24) | תוצאות ודוח | `demo-report` |
| `demo.nav.groupLabel` | Demo V1 · synthetic (S2) | הדגמה V1 · סינתטי | **S2 only** (navigation grouping, section 14); in S1 the five items are flat |
| `demo.overview.cardTitle` | Demo V1 (synthetic) | הדגמה V1 (סינתטית) | Card on `overview` |
| `demo.overview.cardBody` | An end-to-end demonstration with synthetic data. It shows presentation only: no Builder, no instruments, no calibration. | הדגמה מקצה לקצה עם נתונים סינתטיים. היא מציגה מצגת בלבד: ללא בנאי, ללא מכשירים וללא כיול. | The "class A only" statement (DV-RISK-12) |
| `demo.overview.cardAction` | Open Demo V1 | פתיחת הדגמה V1 | Link button to `demo-dashboard` |

## 3. Common strings (all demo routes)

| Key | English | Hebrew (needs_review) | Notes |
|---|---|---|---|
| `demo.common.provenanceChip` | synthetic_demo | synthetic_demo | **Technical constant, never translated**; rendered through `DisplayText technical` |
| `demo.common.provenanceHelp` | Synthetic demonstration data. Not a real record. | נתוני הדגמה סינתטיים. אינם רשומה אמיתית. | Accessible description of the chip |
| `demo.common.sessionOnly` | All data is synthetic and kept in this browser tab only. Reload resets everything. | כל הנתונים סינתטיים ונשמרים בלשונית הדפדפן הזו בלבד. רענון מאפס הכול. | Under each page title |
| `demo.common.scripted` | Scripted | מתוסרט | Chip text |
| `demo.common.simulated` | Simulated | מדומה | Chip text |
| `demo.common.synthetic` | Synthetic | סינתטי | Chip text |
| `demo.common.inputRequired` | Input required | נדרש קלט | Slot text |
| `demo.common.inputRequiredMarker` | Input required {marker} | נדרש קלט {marker} | `{marker}` is `MI-nn`, isolated LTR |
| `demo.common.notAuthored` | (not authored) | (לא נכתב) | Suffix |
| `demo.common.notEvaluated` | Not evaluated | לא הוערך | Limit-check cell |
| `demo.common.notEvaluatedBecause` | Not evaluated: input required {marker} | לא הוערך: נדרש קלט {marker} | Reason form |
| `demo.common.notProvided` | not provided (synthetic) | לא סופק (סינתטי) | Contact fields |
| `demo.common.unitExplain` | su = synthetic unit, no physical meaning | su = יחידה סינתטית, ללא משמעות פיזיקלית | Tooltip or caption near readings; `su` itself is technical |
| `demo.common.resetAction` | Reset demo… | איפוס ההדגמה… | Opens the dialog below |
| `demo.common.resetTitle` | Reset the demonstration? | לאפס את ההדגמה? | Dialog title |
| `demo.common.resetBody` | Selections, runs and events in this tab return to the starting state. Nothing is stored, so nothing is lost permanently. | הבחירות, ההרצות והאירועים בלשונית זו חוזרים למצב ההתחלתי. דבר אינו נשמר, ולכן דבר אינו אובד לצמיתות. | Consequence text |
| `demo.common.resetConfirm` | Reset | איפוס | Dialog primary |
| `demo.common.cancel` | Cancel | ביטול | Dialog secondary |
| `demo.common.close` | Close | סגירה | |
| `demo.common.loading` | Loading synthetic data… | טוען נתונים סינתטיים… | `StatePanel` loading |
| `demo.common.errorTitle` | The demonstration could not be displayed | לא ניתן להציג את ההדגמה | `StatePanel` error |
| `demo.common.errorBody` | Nothing was changed or stored. Reload the page to start again. | דבר לא שונה ולא נשמר. יש לרענן את הדף כדי להתחיל מחדש. | |
| `demo.common.showAsTable` | Show as table | הצגה כטבלה | Meter toggle |
| `demo.common.showAsBars` | Show as bars | הצגה כפסים | Meter toggle |

## 4. Dashboard (`demo-dashboard`)

| Key | English | Hebrew (needs_review) | Notes |
|---|---|---|---|
| `demo.dashboard.title` | Operations dashboard | לוח בקרה תפעולי | **Owner choice CD-Q1** (section 16): the word "operations" sits next to the "non-operational" marking |
| `demo.dashboard.kpi.open.label` | Open work orders | הזמנות עבודה פתוחות | Value is the count of work orders not yet at "Demo report ready" |
| `demo.dashboard.kpi.open.caption` | {received} received · {ready} ready | {received} התקבלו · {ready} מוכנות | Integers |
| `demo.dashboard.kpi.instruments.label` | Instruments available | מכשירים זמינים | |
| `demo.dashboard.kpi.instruments.value` | {available} / {total} | {available} / {total} | Isolated LTR |
| `demo.dashboard.kpi.instruments.caption` | {count, plural, =0 {None need attention} one {# needs attention} other {# need attention}} | {count, plural, =0 {אין מכשירים שדורשים תשומת לב} one {אחד דורש תשומת לב} two {שניים דורשים תשומת לב} other {# דורשים תשומת לב}} | Counts assets with the status "Needs attention"; "None need attention" is a count statement, never a safety claim (CD-Q2) |
| `demo.dashboard.kpi.jobs.label` | Jobs ready to simulate | משימות מוכנות להדמיה | Value is the count of work orders in status Ready |
| `demo.dashboard.kpi.jobs.caption` | Ready for job set-up | מוכנות להגדרת משימה | |
| `demo.dashboard.kpi.runs.label` | Simulated runs (this session) | הרצות מדומות (בהפעלה זו) | |
| `demo.dashboard.kpi.runs.caption` | {completed} completed · {aborted} aborted | {completed} הסתיימו · {aborted} הופסקו | `completed` here describes a scripted run, not a work order |
| `demo.dashboard.meters.title` | Work orders by status | הזמנות עבודה לפי סטטוס | |
| `demo.dashboard.meters.hint` | Each bar shows its label and number as text. | לכל פס יש תווית ומספר כטקסט. | |
| `demo.dashboard.meters.tableCaption` | Work orders by status (table) | הזמנות עבודה לפי סטטוס (טבלה) | |
| `demo.dashboard.meters.colStatus` / `.colCount` | Status / Work orders | סטטוס / הזמנות עבודה | Table headers |
| `demo.dashboard.next.title` | Start the demonstration path | התחילו את מסלול ההדגמה | |
| `demo.dashboard.next.body` | Pick a synthetic work order, set up a job, run a scripted simulation, then read the demonstration report. | בחרו הזמנת עבודה סינתטית, הגדירו משימה, הריצו הדמיה מתוסרטת וקראו את דוח ההדגמה. | |
| `demo.dashboard.next.action` | Open work orders | פתיחת הזמנות עבודה | Link button to `demo-work` |
| `demo.dashboard.activity.title` | Activity (this session) | פעילות (בהפעלה זו) | |
| `demo.dashboard.activity.empty` | Nothing yet. Events from simulated runs appear here. | עדיין אין. אירועים מהרצות מדומות יופיעו כאן. | `StatePanel` empty |
| `demo.dashboard.activity.journalNote` | Journal: simulated, not persisted. | יומן: מדומה, לא נשמר. | |

## 5. Work orders (`demo-work`)

| Key | English | Hebrew (needs_review) | Notes |
|---|---|---|---|
| `demo.work.title` | Work orders | הזמנות עבודה | |
| `demo.work.intro` | Select a synthetic work order to set up a simulated job. | בחרו הזמנת עבודה סינתטית כדי להגדיר משימה מדומה. | |
| `demo.work.search.label` | Search work orders | חיפוש הזמנות עבודה | |
| `demo.work.search.hint` | Matches ids and names. This filter is a demonstration helper. | מתאים למזהים ולשמות. מסנן זה הוא כלי עזר להדגמה. | DV-RISK-15 |
| `demo.work.status.label` | Status | סטטוס | |
| `demo.work.status.all` | All statuses | כל הסטטוסים | |
| `demo.work.count` | {shown, number} of {total, number} shown | מוצגות {shown, number} מתוך {total, number} | |
| `demo.work.table.caption` | Synthetic work orders | הזמנות עבודה סינתטיות | Table accessible name; scroll-region label |
| `demo.work.col.id` / `.customer` / `.instrument` / `.priority` / `.status` / `.due` / `.action` | ID / Customer / Instrument / Priority / Status / Due (synthetic) / Details | מזהה / לקוח / מכשיר / עדיפות / סטטוס / יעד (סינתטי) / פרטים | |
| `demo.fixture.dueSlot` | Synthetic slot {n} | משבצת סינתטית {n} | Due label; a slot number, never a date |
| `demo.work.priority.low` / `.normal` / `.high` | Low / Normal / High | נמוכה / רגילה / גבוהה | |
| `demo.work.woStatus.received` | Received | התקבלה | |
| `demo.work.woStatus.ready` | Ready | מוכנה | |
| `demo.work.woStatus.inSimulation` | In simulation | בהדמיה | |
| `demo.work.woStatus.reportReady` | Demo report ready | דוח הדגמה מוכן | The last status; never "completed" or "approved" |
| `demo.work.woStatus.onHold` | On hold | בהמתנה | |
| `demo.work.select` | Select | בחירה | Button text |
| `demo.work.selectAria` | Select work order {id} | בחירת הזמנת עבודה {id} | Accessible name |
| `demo.work.selected` | Selected | נבחרה | Text beside the selected row |
| `demo.work.noResults.title` | No work orders match | אין הזמנות עבודה שעונות על החיפוש | Avoids the stem "תואם" (section 12.2, CD-Q3) |
| `demo.work.noResults.body` | Change the search or the status filter. | שנו את החיפוש או את מסנן הסטטוס. | |
| `demo.work.noResults.action` | Clear filters | ניקוי מסננים | |
| `demo.work.customer.title` | Customer | לקוח | Card |
| `demo.work.instrument.title` | Instrument | מכשיר | Card |
| `demo.work.detail.empty` | Select a work order to see its customer and instrument. | בחרו הזמנת עבודה כדי לראות את הלקוח והמכשיר שלה. | |
| `demo.work.detail.id` / `.name` / `.site` / `.contact` | ID / Name / Site / Contact | מזהה / שם / אתר / איש קשר | `DetailList` terms |
| `demo.work.detail.class` / `.serial` / `.status` / `.lastEvent` | Class / Serial / Status / Last scripted event | סוג / מספר סידורי / סטטוס / אירוע מתוסרט אחרון | |
| `demo.work.assetStatus.available` | Available | זמין | Chip, `ok` tone |
| `demo.work.assetStatus.inJob` | In job (simulated) | במשימה (מדומה) | Chip, `simulation` tone |
| `demo.work.assetStatus.attention` | Needs attention | דורש תשומת לב | Chip, `warn` tone |
| `demo.work.assetStatus.outOfService` | Out of service | מחוץ לשירות | Chip, `error` tone |
| `demo.work.setup.action` | Set up job | הגדרת משימה | Button |
| `demo.work.setup.reasonNone` | Select a work order first. | יש לבחור קודם הזמנת עבודה. | Visible reason when disabled |

## 6. Job set-up (`demo-job`)

| Key | English | Hebrew (needs_review) | Notes |
|---|---|---|---|
| `demo.job.title` | Job set-up · {id} | הגדרת משימה · {id} | `{id}` is a work-order id, LTR isolate |
| `demo.job.empty.title` | No work order selected | לא נבחרה הזמנת עבודה | Direct entry without a selection |
| `demo.job.empty.body` | Choose a work order first. | יש לבחור קודם הזמנת עבודה. | |
| `demo.job.empty.action` | Go to work orders | מעבר להזמנות עבודה | |
| `demo.job.step1` | Instrument | מכשיר | Section headings |
| `demo.job.step2` | Procedure | נוהל | |
| `demo.job.step3` | Standards | תקנים | Avoid "reference standards" legal sense; this is a role label (CD-Q4 for the Hebrew term) |
| `demo.job.step4` | Preflight | בדיקות מקדימות | |
| `demo.job.step5` | Mode | מצב | |
| `demo.job.instrumentLine` | {id} · {class} · {status} | {id} · {class} · {status} | Composed from fixture data |
| `demo.job.procedure.legend` | Procedure | נוהל | Radio group legend |
| `demo.job.procedure.option` | {id} v{version} | {id} v{version} | Technical |
| `demo.job.procedure.compatible` | Compatible | מתאים | **Never "תואם"** (section 12.2) |
| `demo.job.procedure.incompatible` | Not compatible | אינו מתאים | |
| `demo.job.reason.classMismatch` | This procedure applies to a different synthetic instrument class. | נוהל זה חל על סוג מכשיר סינתטי אחר. | Scripted reason |
| `demo.job.reason.draft` | This version is a draft in the synthetic catalog and is not available for simulation. | גרסה זו היא טיוטה בקטלוג הסינתטי ואינה זמינה להדמיה. | Scripted reason |
| `demo.job.reason.retired` | This version is retired in the synthetic catalog. | גרסה זו הוצאה משימוש בקטלוג הסינתטי. | Scripted reason |
| `demo.job.noProcedure.title` | No compatible procedure | אין נוהל מתאים | When the instrument class has none |
| `demo.job.noProcedure.body` | No procedure in this demonstration applies to this instrument class. | אף נוהל בהדגמה זו אינו חל על סוג המכשיר הזה. | |
| `demo.job.standards.role` | Reference role | תפקיד ייחוס | Label |
| `demo.job.standards.substitute` | Simulated substitute (synthetic) | תחליף מדומה (סינתטי) | Value |
| `demo.job.standards.validity` | Validity | תוקף | Label; value is `demo.common.inputRequiredMarker` with `MI-07` |
| `demo.job.standards.requirement` | Role requirements | דרישות התפקיד | Label; value is the marker with `MI-06` |
| `demo.job.preflight.errors` | Blocking findings | ממצאים חוסמים | Group heading |
| `demo.job.preflight.warnings` | Warnings | אזהרות | Group heading |
| `demo.job.preflight.info` | Information | מידע | Group heading |
| `demo.job.preflight.none` | No findings. | אין ממצאים. | Empty group |
| `demo.job.finding.attention` | The instrument needs attention (synthetic status). Resolve it before a simulation can start. | המכשיר דורש תשומת לב (סטטוס סינתטי). יש לטפל בכך לפני שניתן להתחיל הדמיה. | Error finding |
| `demo.job.finding.outOfService` | The instrument is out of service (synthetic status). | המכשיר מחוץ לשירות (סטטוס סינתטי). | Error finding |
| `demo.job.finding.noProcedure` | No compatible procedure is available for this instrument class. | אין נוהל מתאים לסוג המכשיר הזה. | Error finding |
| `demo.job.finding.standardsValidity` | Reference validity is not authored (input required {marker}). | תוקף הייחוס לא נכתב (נדרש קלט {marker}). | Warning finding |
| `demo.job.finding.safetyNotApplicable` | Safety checks do not apply: a simulation has no instrument. | בדיקות בטיחות אינן חלות: להדמיה אין מכשיר. | Info finding (DV-G-04); not a safety claim |
| `demo.job.finding.scriptedOnly` | Preflight results are scripted data, not evaluated rules. | תוצאות הבדיקות המקדימות הן נתונים מתוסרטים ולא כללים שהוערכו. | Info finding |
| `demo.job.mode.text` | Simulation: results are scripted and are not a calibration. | הדמיה: התוצאות מתוסרטות ואינן כיול. | Mode line, protected phrase (section 10) |
| `demo.job.mode.confirm` | I understand this run is a simulation and not a calibration. | אני מבין/ה שהרצה זו היא הדמיה ולא כיול. | Checkbox; Hebrew uses a two-gender form pending linguist (CD-Q5) |
| `demo.job.start.action` | Start simulation | התחלת הדמיה | Button |
| `demo.job.start.reasonRunExists` | This work order already has a run in this session. Reset the demonstration to start over. | להזמנת עבודה זו כבר יש הרצה בהפעלה הזו. יש לאפס את ההדגמה כדי להתחיל מחדש. | Reason, precedence 1 |
| `demo.job.start.reasonStatus` | This work order is not in status Ready. | הזמנת העבודה אינה בסטטוס מוכנה. | Reason, precedence 2 |
| `demo.job.start.reasonProcedure` | Choose a compatible procedure first. | יש לבחור קודם נוהל מתאים. | Reason, precedence 3 |
| `demo.job.start.reasonFindings` | Resolve the blocking findings first. | יש לטפל קודם בממצאים החוסמים. | Reason, precedence 4 |
| `demo.job.start.reasonConfirm` | Confirm that this is a simulation first. | יש לאשר קודם שזו הדמיה. | Reason, precedence 5; "לאשר" here is "to confirm" (CD-Q5) |
| `demo.job.preview.title` | Procedure preview (read-only) | תצוגה מקדימה של הנוהל (לקריאה בלבד) | |
| `demo.job.preview.empty` | Choose a procedure to preview its outline. | יש לבחור נוהל כדי לראות את המבנה שלו. | Before a procedure is selected |
| `demo.job.preview.note` | Illustrative outline. Step type names are examples; no schema is applied. | מבנה להמחשה. שמות סוגי השלבים הם דוגמאות; לא מופעלת סכמה. | Avoids "validated" and its Hebrew counterpart (a banned stem) |
| `demo.job.preview.illustrative` | Illustrative | להמחשה | Chip beside step types |
| `demo.job.preview.group.setup` | Setup | הכנה | |
| `demo.job.preview.group.points` | Points | נקודות | |
| `demo.job.preview.group.teardown` | Teardown | סיום | |
| `demo.job.preview.step.instruct` | Read the synthetic setup note | קריאת הערת ההכנה הסינתטית | Type `operator.instruct` |
| `demo.job.preview.step.confirm` | Confirm that the note was read | אישור שההערה נקראה | Type `operator.confirm` |
| `demo.job.preview.step.foreach` | Repeat for 3 synthetic points | חזרה על 3 נקודות סינתטיות | Type `flow.foreach` |
| `demo.job.preview.step.call` | Call a named driver operation (none exists in this demonstration) | קריאה לפעולת מנהל התקן בשם (אין כזו בהדגמה זו) | Type `driver.call` |
| `demo.job.preview.step.acquire` | Acquire 3 scripted readings per point | רכישת 3 קריאות מתוסרטות לכל נקודה | Type `measure.acquire` |
| `demo.job.preview.step.limits` | Limit check: not evaluated, input required {marker} | בדיקת גבולות: לא הוערכה, נדרש קלט {marker} | Type `evaluate.limits`; marker `MI-04` |
| `demo.job.preview.step.pointValue` | Test point value: input required {marker} | ערך נקודת בדיקה: נדרש קלט {marker} | Marker `MI-03` |
| `demo.job.preview.step.finish` | Finish the scripted run | סיום ההרצה המתוסרטת | Type `flow.end` |
| `demo.job.preview.edit` | Edit in Builder | עריכה בבנאי | Disabled button |
| `demo.job.preview.editReason` | The Application Builder is not available in this demonstration. | בנאי היישומים אינו זמין בהדגמה זו. | Reason |
| `demo.job.preview.productionGates` | Requires a Safety Profile and hardware limits; not available in simulation. | דורש פרופיל בטיחות ומגבלות חומרה; אינו זמין בהדמיה. | Greyed production-only item (UI_UX_SPEC §7.3); no values shown |

## 7. Run console (`demo-run`)

| Key | English | Hebrew (needs_review) | Notes |
|---|---|---|---|
| `demo.run.title` | Simulated execution console | קונסולת הרצה מדומה | |
| `demo.run.empty.title` | No run started | לא הותחלה הרצה | Direct entry without a started job |
| `demo.run.empty.body` | Start a simulation from job set-up. | יש להתחיל הדמיה מהגדרת המשימה. | |
| `demo.run.empty.action` | Go to job set-up | מעבר להגדרת משימה | |
| `demo.run.header.procedure` | Procedure | נוהל | Label before `{id} v{version}` |
| `demo.run.state.ready` | Ready | מוכנה להתחלה | Chip |
| `demo.run.state.running` | Running (scripted) | רצה (מתוסרט) | Chip, icon + text |
| `demo.run.state.waiting` | Waiting for the operator step | ממתינה לשלב מפעיל | Chip |
| `demo.run.state.completed` | Completed (scripted) | הסתיימה (מתוסרט) | Chip |
| `demo.run.state.aborted` | Aborted | הופסקה | Chip |
| `demo.run.elapsed` | Simulated elapsed {time} · Step {current} of {total} | זמן מדומה שחלף {time} · שלב {current} מתוך {total} | `{time}` is `t+MM:SS` derived from the number of completed steps; no clock |
| `demo.run.control.step` | Step | צעד קדימה | Button; accessible name "Advance one step" / "קידום צעד אחד" (`demo.run.control.stepAria`) |
| `demo.run.control.runToEnd` | Run to end | הרצה עד הסוף | Button |
| `demo.run.control.runToEndHint` | Stops at the operator step. | נעצרת בשלב המפעיל. | Description |
| `demo.run.control.abort` | Abort… | הפסקה… | Opens the dialog |
| `demo.run.control.reset` | Reset | איפוס | Returns the run to Ready; opens no dialog |
| `demo.run.abort.title` | Abort the simulated run? | להפסיק את ההרצה המדומה? | Dialog |
| `demo.run.abort.body` | The run stops here and its results are marked incomplete. No report is produced for an aborted run. This is a simulation: no instrument is affected. | ההרצה נעצרת כאן והתוצאות מסומנות כחלקיות. לא נוצר דוח להרצה שהופסקה. זו הדמיה: אף מכשיר אינו מושפע. | Consequence text |
| `demo.run.abort.confirm` | Abort run | הפסקת ההרצה | Primary |
| `demo.run.abort.keep` | Keep running | המשך הרצה | Secondary (default focus) |
| `demo.run.steps.title` | Steps | שלבים | |
| `demo.run.steps.aria` | Run steps | שלבי ההרצה | `StepList` accessible name |
| `demo.run.steps.setup` | Setup | הכנה | Group |
| `demo.run.steps.points` | Points | נקודות | Group |
| `demo.run.steps.teardown` | Teardown | סיום | Group |
| `demo.run.step.state.done` / `.current` / `.pending` | Done / Current / Pending | בוצע / נוכחי / ממתין | Text with the icon; `aria-current="step"` on the current one |
| `demo.run.step.note` | Setup note (scripted) | הערת הכנה (מתוסרט) | Step 1 row and the Now-panel title |
| `demo.run.step.noteBody` | This is a synthetic setup note. No real setup is described. | זו הערת הכנה סינתטית. לא מתוארת הכנה אמיתית. | Step 1 body |
| `demo.run.step.confirm` | Operator step: confirm the note | שלב מפעיל: אישור ההערה | Step 2 row |
| `demo.run.step.end` | End of the scripted run | סיום ההרצה המתוסרטת | End-marker row (not a counted step) |
| `demo.run.step.point` | Point {point} ({done} of {total}) | נקודה {point} ({done} מתוך {total}) | Group line |
| `demo.run.now.title` | Now · Point {point} | עכשיו · נקודה {point} | |
| `demo.run.now.notice` | Scripted demonstration reading (not measured, not computed) | קריאת הדגמה מתוסרטת (לא נמדדה, לא חושבה) | Protected phrase |
| `demo.run.now.reading` | Reading {n} of {total} | קריאה {n} מתוך {total} | |
| `demo.run.now.value` | {value} su | {value} su | `{value}` decimal string from the script, isolated LTR |
| `demo.run.now.pointValue` | Test point value | ערך נקודת בדיקה | Label; value is the marker with `MI-03` plus `demo.common.notAuthored` |
| `demo.run.now.limitCheck` | Limit check | בדיקת גבולות | Label; value is `demo.common.notEvaluatedBecause` with `MI-04` |
| `demo.run.now.none` | No reading yet. | עדיין אין קריאה. | Before the first reading step |
| `demo.run.readings.title` | Readings (scripted) | קריאות (מתוסרט) | |
| `demo.run.readings.caption` | Scripted readings in synthetic units | קריאות מתוסרטות ביחידות סינתטיות | Table accessible name |
| `demo.run.readings.colPoint` / `.colNumber` / `.colValue` / `.colLimit` | Point / # / Value (su) / Limit check | נקודה / # / ערך (su) / בדיקת גבולות | |
| `demo.run.readings.empty` | No readings yet. | עדיין אין קריאות. | `StatePanel` empty |
| `demo.run.operator.title` | Operator step (scripted) | שלב מפעיל (מתוסרט) | "scripted operator step", never a person (DV-G-08) |
| `demo.run.operator.text` | Confirm that the synthetic setup note was read. | יש לאשר שהערת ההכנה הסינתטית נקראה. | Prompt text |
| `demo.run.operator.confirm` | Confirm | אישור | Button; Hebrew "אישור" is "confirm", see section 12.2 and CD-Q5 |
| `demo.run.operator.waiting` | The run waits here until you confirm. It never times out. | ההרצה ממתינה כאן עד שתאשרו. היא לעולם אינה פוקעת. | Description |
| `demo.run.log.title` | Event log | יומן אירועים | |
| `demo.run.log.aria` | Run events | אירועי ההרצה | `role="log"` name |
| `demo.run.log.empty` | No events yet. | עדיין אין אירועים. | |
| `demo.run.footer` | Journal: simulated, not persisted · Safety: not applicable (no instrument) · Sync: not applicable | יומן: מדומה, לא נשמר · בטיחות: לא רלוונטית (אין מכשיר) · סנכרון: לא רלוונטי | Honest footer (UI_UX_SPEC §7.4) |
| `demo.run.announce.batch` | {count, plural, one {# new event} other {# new events}}. Latest: {message} | {count, plural, one {אירוע חדש אחד} two {שני אירועים חדשים} other {# אירועים חדשים}}. אחרון: {message} | Polite live region, at most one per user action |
| `demo.run.announce.state` | Run state: {state} | מצב ההרצה: {state} | Polite; on state change only |

### 7.1 Event messages (rendered in the Activity list and the Event log, oldest first)

| Key | English | Hebrew (needs_review) | When |
|---|---|---|---|
| `demo.event.jobCreated` | Job created for {id} (scripted) | נוצרה משימה עבור {id} (מתוסרט) | Start of job set-up confirmation |
| `demo.event.runStarted` | Run {run} started (scripted) | ההרצה {run} התחילה (מתוסרט) | Start simulation |
| `demo.event.note` | Setup note shown (scripted) | הערת ההכנה הוצגה (מתוסרט) | Script step `note` |
| `demo.event.operatorWaiting` | Waiting for the operator step | ממתין לשלב המפעיל | Script step `operator-confirm` reached |
| `demo.event.operatorConfirmed` | Operator step confirmed (scripted) | אישור שלב המפעיל התקבל (מתוסרט) | User confirmed; avoids the stem "אושר" (CD-Q5) |
| `demo.event.reading` | Point {point} · reading {n} recorded (scripted) | נקודה {point} · קריאה {n} נרשמה (מתוסרט) | Script step `reading` |
| `demo.event.runCompleted` | Run {run} completed (scripted) | ההרצה {run} הסתיימה (מתוסרט) | Script step `end` |
| `demo.event.runAborted` | Run {run} aborted | ההרצה {run} הופסקה | Abort confirmed |
| `demo.event.demoReset` | Demonstration reset | ההדגמה אופסה | Reset |

## 8. Results (`demo-report`, segment 1)

| Key | English | Hebrew (needs_review) | Notes |
|---|---|---|---|
| `demo.report.title` | Results and demonstration report | תוצאות ודוח הדגמה | `PageHeader` |
| `demo.report.segmentAria` | Results view | תצוגת תוצאות | Segmented control name |
| `demo.report.segment.results` | Results | תוצאות | |
| `demo.report.segment.report` | Demonstration report | דוח הדגמה | |
| `demo.report.empty.title` | No results yet | עדיין אין תוצאות | Direct entry without a finished run |
| `demo.report.empty.body` | Finish a simulated run to see results here. | יש לסיים הרצה מדומה כדי לראות כאן תוצאות. | |
| `demo.report.empty.action` | Go to run console | מעבר לקונסולת הרצה | |
| `demo.report.summary.title` | Run summary | סיכום הרצה | Card |
| `demo.report.summary.run` | Run {run} · completed (scripted) | הרצה {run} · הסתיימה (מתוסרט) | |
| `demo.report.summary.counts` | Points: {points} · scripted readings: {readings} | נקודות: {points} · קריאות מתוסרטות: {readings} | Integers counted from records |
| `demo.report.summary.limit` | Limit check: not evaluated | בדיקת גבולות: לא הוערכה | |
| `demo.report.summary.conformity` | Conformity: not evaluated. No decision rule is defined (input required {marker}). | התאמה לדרישות: לא הוערכה. לא הוגדר כלל החלטה (נדרש קלט {marker}). | Marker `MI-08`; replaces the wireframe's wording, which contained a banned word |
| `demo.report.results.caption` | Scripted readings by point | קריאות מתוסרטות לפי נקודה | Table accessible name |
| `demo.report.results.colPoint` / `.colReadings` / `.colLimit` | Point / Readings (su) / Limit check | נקודה / קריאות (su) / בדיקת גבולות | |
| `demo.report.results.pointLabel` | Point {point} | נקודה {point} | Row header |
| `demo.report.aborted.title` | Incomplete (aborted) | חלקית (הופסקה) | When the run was aborted |
| `demo.report.aborted.body` | The run was aborted. Results are incomplete and no report is produced. | ההרצה הופסקה. התוצאות חלקיות ולא נוצר דוח. | |
| `demo.report.aborted.segmentReason` | Unavailable for an aborted run. | אינו זמין להרצה שהופסקה. | Reason on the disabled report segment |
| `demo.report.notApprovable.title` | Not approvable | אינו ניתן לאישור | **Protected phrase** (section 10) |
| `demo.report.notApprovable.body` | Simulation results cannot be approved, signed, issued or exported as a record. | תוצאות הדמיה אינן יכולות להיות מאושרות, חתומות, מונפקות או מיוצאות כרשומה. | **Protected phrase** |
| `demo.report.recordActions` | Record actions: unavailable | פעולות רשומה: אינן זמינות | Disabled control; its reason is the previous body. **Replaces the wireframe's label** (DV-SAFE-05) |
| `demo.report.reset` | Reset demo… | איפוס ההדגמה… | Same dialog as `demo.common.resetAction` |

## 9. Demonstration report sheet

Rendered as a paper-like sheet. English constants (marked **EN**) are always present as real text; in Hebrew the localized text is shown beside them (DV-DEC-08, DV-L10N-08). Neither is configurable.

| Key | English | Hebrew (needs_review) | Notes |
|---|---|---|---|
| `demo.sheet.title.en` | DEMONSTRATION REPORT — NOT A CALIBRATION CERTIFICATE | (same, EN constant) | **EN**, in a `ReportSheet` constant, not a catalog value |
| `demo.sheet.title` | Demonstration report — not a calibration certificate | דוח הדגמה — אינו תעודת כיול | Localized, shown beside the EN constant in `he` |
| `demo.sheet.watermark.en` | SIMULATION ONLY — NOT A CALIBRATION | (same, EN constant) | **EN**, repeated diagonal text in the DOM |
| `demo.sheet.watermark` | Simulation only — not a calibration | הדמיה בלבד — לא כיול | Localized, repeated beside the EN constant in `he` |
| `demo.sheet.band.en` | SIMULATED DATA — NOT A CALIBRATION · DEMONSTRATION ONLY | (same, EN constant) | **EN**, bottom band |
| `demo.sheet.band` | Simulated data — not a calibration · demonstration only | נתונים מדומים — לא כיול · להדגמה בלבד | Localized |
| `demo.sheet.field.document` | Document | מסמך | Value `DEMO-RPT-nnnn` |
| `demo.sheet.field.customer` | Customer | לקוח | Value `{name}` plus `demo.sheet.notReal` |
| `demo.sheet.notReal` | (not a real organisation) | (אינו ארגון אמיתי) | |
| `demo.sheet.field.instrument` | Instrument | מכשיר | Value `{id}` plus the synthetic class label |
| `demo.sheet.field.procedure` | Procedure | נוהל | Value `{id} v{version}` plus `demo.sheet.syntheticDescriptor` |
| `demo.sheet.syntheticDescriptor` | (synthetic descriptor) | (תיאור סינתטי) | |
| `demo.sheet.field.data` | Data | נתונים | |
| `demo.sheet.dataValue` | Scripted demonstration values · provenance {provenance} | ערכי הדגמה מתוסרטים · מקור הנתונים {provenance} | `{provenance}` is `synthetic_demo` |
| `demo.sheet.table.colPoint` / `.colReadings` / `.colLimit` | Point / Readings (su) / Limit check | נקודה / קריאות (su) / בדיקת גבולות | |
| `demo.sheet.negation.1` | Conformity: not evaluated. No uncertainty statement. | התאמה לדרישות: לא הוערכה. אין הצהרת אי-ודאות. | **Protected negation** |
| `demo.sheet.negation.2` | No traceability claim. No signature. No accreditation mark. | אין טענת עקיבות. אין חתימה. אין סימן הסמכה. | **Protected negation** |
| `demo.sheet.negation.3` | No certificate number. Not for any record or decision. | אין מספר תעודה. אינו מיועד לרשומה או להחלטה כלשהי. | **Protected negation** |
| `demo.sheet.actions.back` | Back to results | חזרה לתוצאות | Button |
| `demo.sheet.actions.another` | Start another run | התחלת הרצה נוספת | Button; same effect as Reset demo (after its dialog) |
| `demo.sheet.screenNote` | On-screen preview only. Print and export are not part of this demonstration. | תצוגה על המסך בלבד. הדפסה וייצוא אינם חלק מהדגמה זו. | Note under the sheet |

Elements that must **not** appear on the sheet or anywhere in the demo: logos, signature blocks, QR codes or barcodes, certificate-like numbering, an issue date presented as official, "approved by", accreditation or standards-body names, a verification or digest claim.

## 10. Protected phrases (exact, non-configurable)

These strings are the only places where banned claim words may appear, and only as negations. A test compares them byte-for-byte with this table (a change needs an owner decision, CD-RC-03).

| Phrase (English) | Hebrew counterpart (needs_review) | Where |
|---|---|---|
| NOT A CALIBRATION | לא כיול | Markings, watermark, band |
| NOT A CALIBRATION CERTIFICATE | אינו תעודת כיול | Report title |
| No accreditation mark | אין סימן הסמכה | Report negation |
| Not approvable | אינו ניתן לאישור | Results notice |
| Simulation results cannot be approved, signed, issued or exported as a record. | תוצאות הדמיה אינן יכולות להיות מאושרות, חתומות, מונפקות או מיוצאות כרשומה. | Results notice |
| No traceability claim | אין טענת עקיבות | Report negation |
| No uncertainty statement | אין הצהרת אי-ודאות | Report negation |

## 11. Fixture text index (authoritative text is in `FIXTURES_SPEC.md`)

| Fixture text | Where it is specified |
|---|---|
| Customer names and site labels (6) | FIXTURES_SPEC section 5.1 |
| Instrument class labels and serials (8 assets) | FIXTURES_SPEC section 5.2 |
| Work-order priorities, statuses and due labels (10) | FIXTURES_SPEC section 5.3 |
| Procedure titles, versions, compatibility and reasons (3) | FIXTURES_SPEC section 5.4 |
| Scripted scenario step titles and readings (11 steps plus the end marker) | FIXTURES_SPEC section 6 |
| Last scripted event per asset | FIXTURES_SPEC section 5.2 |

## 12. Hebrew terminology (all `needs_review`)

### 12.1 Proposed glossary (for the linguist, H-8; MI-31 has no reviewed glossary yet)

| English | Proposed Hebrew | Alternatives to consider | Note |
|---|---|---|---|
| calibration | כיול | | Existing shell term |
| simulation / simulated | הדמיה / מדומה | סימולציה / מדומה | Existing shell term (הדמיה) |
| synthetic | סינתטי | מלאכותי, בדוי | "בדוי" may imply deception; avoided |
| scripted | מתוסרט | מתוכנת, קבוע מראש | New term; confirm it reads as "fixed in advance" |
| work order | הזמנת עבודה | | |
| job (calibration task) | משימה | עבודה, משימת כיול | The wireframe used "משימה" |
| procedure | נוהל | נוהל כיול, הליך | |
| instrument | מכשיר | מכשיר מדידה | |
| preflight | בדיקות מקדימות | בדיקות טרום-הרצה | |
| finding | ממצא | | |
| reading | קריאה | מדידה | "מדידה" avoided: nothing is measured |
| test point | נקודת בדיקה | נקודת כיול | |
| limit check | בדיקת גבולות | בדיקת מגבלות | Never "pass/fail" words |
| conformity | התאמה לדרישות | עמידה בדרישות | MI-08 owns the real term |
| input required | נדרש קלט | נדרש קלט מהמשתמש | |
| not evaluated | לא הוערך | לא נבדק | |
| operator step | שלב מפעיל | שלב מפעיל אנושי | "scripted operator step", not a person |
| journal | יומן | | Existing prototype term |
| standard / reference role | תקן / תפקיד ייחוס | תקן ייחוס | CD-Q4: "תקן" can read as a regulatory standard; the role label is used instead |
| report | דוח | דו"ח | Choose one spelling |

### 12.2 Hebrew ambiguities this deck avoids

| Hazard | Rule |
|---|---|
| "תואם" means both "compatible" and "compliant/conforming" | Use "מתאים" for compatible and "שעונות על" for search matches (CD-Q3) |
| "אישור" means "confirmation" and "approval" | "Confirm" buttons use "אישור" because it is the common label; the consequence text and the Not-approvable notice use the explicit forms. CD-Q5 asks for the linguist's choice |
| Gendered second person | Instructions use the plural imperative (בחרו, הריצו) or the infinitive; the single checkbox uses "מבין/ה" until the linguist decides |
| "בדוק/נבדק" implies verification | "בדיקת גבולות" is the fixed term for "limit check"; "לא הוערך" is used for "not evaluated" |
| Prefix letters (ה, ב, ל, מ, ו, ש, כ) attach to words | The lexicon test matches banned stems with optional prefixes (section 13) |
| Numerals | Western digits in both locales (DV-L10N-05) |
| ICU plurals | Hebrew uses `one`, `two`, `other`; the linguist confirms (CLDR) |

### 12.3 Lexicon guard, English (supplements plan Appendix B; whole-word, case-insensitive)

| Banned in rendered text | Allowed only as |
|---|---|
| calibrated, certified, certification, accredited | the exact protected phrases of section 10 |
| approved, approve, signed, issued, released, published | the exact protected phrases of section 10 |
| pass, passed, fail, failed, compliant, conforms | none |
| traceable, traceability, uncertainty | "No traceability claim", "No uncertainty statement" |
| verified, official, ISO, IEC, NIST, 17025 | none |
| any real unit symbol (V, A, Ω, Hz, °C, and so on) | none; `su` only |

Words the deck deliberately uses and that are **not** on the ban list: "calibration" (only in the protected phrases and "not a calibration" sentences), "certificate" (protected phrases), "conformity" (always "not evaluated"), "limit check".

## 13. Lexicon guard, Hebrew (proposed; extends plan Appendix B)

Stems the test must reject in rendered Hebrew text, with optional leading prefix letters, outside the allow-list. **All entries are proposals for the linguist (CD-RC-02, CD-RC-04).**

| Concept | Hebrew stems to reject | Allowed only as |
|---|---|---|
| calibrated, certified, accredited | מכויל, כויל, מוסמך, מאושר כיול, הוסמך | the protected phrases of section 10 |
| approved, signed, issued, released, published | אושר, מאושר, נחתם, חתום, הונפק, מונפק, שוחרר, פורסם | the Hebrew counterparts of the protected phrases (section 10) |
| pass, fail, compliant | נכשל, תואם (as "compliant"), עומד בדרישות; and "עבר", "עברה", "עברו" **as whole words only** | none |
| traceable, uncertainty | ניתן למעקב, עקיב, אי-ודאות | the protected negations |
| verified, official | מאומת, אומת, רשמי | none |
| standards bodies | ISO, IEC, NIST, 17025 | none |
| real units | any digit followed by a real unit symbol | none |

Short stems must not be matched with prefixes: "עבר" inside "מעבר" ("go to", used by the shell's own links such as `route.notFoundLink` and by `demo.*.empty.action` strings) is not a claim word. A first scan of this deck found exactly that false positive and one real hit ("מאומת", since reworded), so the test is specified as whole-word matching with prefixes only for the longer stems.

Known false-positive risk: Hebrew "הסתיים" (finished) and "אישור" (confirmation) share letters with banned stems but are different words. The test must match stems on word boundaries (after optional prefix letters), not substrings, and the linguist confirms the list (CD-Q5). No Hebrew string in this deck uses "אושר" or "מאושר" outside the protected phrases.

## 14. S2 strings reserved (not part of S1; listed so they are not invented later)

| Key family | English summary | Notes |
|---|---|---|
| `demo.assets.*` | Instruments and assets registry, scripted identity-check states (Exact, Partial, Mismatch, Unreachable) tagged "scripted" | No `*IDN?`, resource name or transport text |
| `demo.procedure.*` | Full procedure view, lanes, step inspector | Read-only |
| `demo.customers.*` and `demo.newWork.*` | Customers segment; in-memory "New synthetic work order" form with local validation | UI sample, not the schema-driven form |
| `demo.scenario.interrupted.*`, `demo.scenario.fault.*` | Interrupted run; scripted communication timeout with "Retry step" and "Abort", assertive announcement | Says it illustrates presentation, not recovery semantics |
| `demo.chart.*` | In-house bar chart with a table alternative | |
| `demo.print.*` | Print draft with the watermark preserved | Only with owner decision DV-DEC-07 |
| `demo.nav.groupLabel` | see section 2 | After the `AppFrame` owner slot |

## 15. Accessible names and live-region text (summary for the widget PR)

| Element | Accessible name key | Role and behaviour |
|---|---|---|
| Dashboard KPI group | each `demo.dashboard.kpi.*.label` | One `dl` group per tile; value and caption read together |
| Status meter list | `demo.dashboard.meters.title` | `role="list"`; bar `aria-hidden`; label and number are text |
| Meter toggle | `demo.common.showAsTable` / `showAsBars` | Button with `aria-pressed` or a disclosure; focus stays on it |
| Work-order table | `demo.work.table.caption` | Keyboard-focusable scroll region with this label |
| Row action | `demo.work.selectAria` | Button inside the first-column cell; after activation focus moves to the detail card heading |
| Procedure radio group | `demo.job.procedure.legend` | `fieldset` and `legend`; a disabled option keeps its reason in `aria-describedby` |
| Disabled actions | their `*.reason*` keys | The reason is visible text, referenced by `aria-describedby`; the control uses `aria-disabled` so it stays focusable |
| Preview outline | `demo.job.preview.title` | Tree semantics; every node a readable text line; disclosure buttons carry `aria-expanded` |
| Run step list | `demo.run.steps.aria` | Ordered list; current item `aria-current="step"`; state in text |
| Event log | `demo.run.log.aria` | `role="log"`, polite; announcements batched by `demo.run.announce.batch` |
| Abort and reset dialogs | `demo.run.abort.title`, `demo.common.resetTitle` | Dialog with the safe option focused first; focus returns to the invoking control |
| Segmented control | `demo.report.segmentAria` | Tablist, roving tabindex, arrow keys follow reading direction |
| Report sheet | `demo.sheet.title` | A region; the watermark text is real text, hidden from the reading order only if an equivalent visible disclaimer is read first |

## 16. Open questions for the owner and the linguist

| ID | Question | Default if unanswered | Affects |
|---|---|---|---|
| CD-Q1 | Keep the page title "Operations dashboard", or use "Lab overview" (he: סקירת מעבדה) to avoid the word "operations" beside the "non-operational" marking? | Keep (it is the plan's name) | `demo.dashboard.title` |
| CD-Q2 | Confirm "None need attention" (instead of "All clear", which would read as a status claim)? | "None need attention" | `demo.dashboard.kpi.instruments.caption` |
| CD-Q3 | Confirm "אין הזמנות עבודה שעונות על החיפוש" (avoids the stem "תואם")? | As written | `demo.work.noResults.title` |
| CD-Q4 | Hebrew term for the "Standards" heading and the "reference role" label | "תפקיד ייחוס", heading "ייחוס" | `demo.job.step3`, `demo.job.standards.*` |
| CD-Q5 | Hebrew for "Confirm" and the checkbox form ("אישור", "מבין/ה"); and the event wording "אישור שלב המפעיל התקבל" | As written | `demo.run.operator.confirm`, `demo.job.mode.confirm`, `demo.event.operatorConfirmed` |
| CD-Q6 | Show the English constant also under the three report negations in Hebrew? | Yes (conservative reading of DV-DEC-08) | `demo.sheet.negation.*` |
| CD-Q7 | Run-state word for the Hebrew feminine "הרצה" forms (רצה, ממתינה, הסתיימה, הופסקה) vs. the neutral noun forms | As written | `demo.run.state.*`, event keys |

## 17. Sign-off record (intentionally empty)

| Checkpoint | Reviewer | Date | Decision | Comments |
|---|---|---|---|---|
| CD-RC-01 | | | | |
| CD-RC-02 | | | | |
| CD-RC-03 | | | | |
| CD-RC-04 | | | | |
| CD-RC-05 | | | | |
| CD-RC-06 | | | | |

No row above is filled in by an agent. A Hebrew value stays `needs_review` until a named human changes its status in the catalog.
