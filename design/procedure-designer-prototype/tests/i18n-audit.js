/* Translation completeness audit for the Procedure Designer DESIGN PROTOTYPE.  node design/procedure-designer-prototype/tests/i18n-audit.js
   Collects every static key used in the UI source plus every dynamic key family (catalogue, enums, errors, events, lint codes) and
   fails if any is missing in either language. Prototype QA only. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const here = path.resolve(__dirname, '..'), p1 = path.resolve(here, '..', 'phase1a-prototype');
const stub = () => ({ setAttribute() {}, append() {}, addEventListener() {}, style: {}, classList: { add() {} }, dataset: {} });
const ctx = { console, TextEncoder, document: { createElement: stub, createTextNode: (x) => x, getElementById: stub }, window: {}, location: { hash: '' }, CSS: { escape: (x) => x } };
vm.createContext(ctx);
const J = (f) => path.join(here, 'js', f + '.js'), P = (f) => path.join(p1, 'js', f + '.js');
const load = ['engine', 'data', 'i18n', 'ui'].map(P).concat(['pd-core', 'pd-data', 'pd-logic', 'pd-sim', 'pd-strings', 'pd-strings-b', 'pd-strings-c'].map(J));
vm.runInContext(load.map((f) => fs.readFileSync(f, 'utf8').replace(/^'use strict';/m, '')).join('\n;\n'), ctx, { filename: 'audit-bundle.js' });
const uiSrc = ['pd-ui-designer', 'pd-ui-dock', 'pd-ui-driver', 'pd-ui-metrology', 'pd-ui-safety', 'pd-ui-sim', 'pd-app', 'pd-data', 'pd-logic', 'pd-sim'].map((f) => fs.readFileSync(J(f), 'utf8')).join('\n');
ctx.__src = uiSrc;
const out = JSON.parse(vm.runInContext(`(() => {
  const need = new Set(); const add = (k) => need.add(k);
  for (const m of __src.matchAll(/'((?:pd|f|g)\\.[A-Za-z0-9_.\\-]*[A-Za-z0-9_])'(\\s*\\+)?/g)) if (!m[2]) add(m[1]);
  Object.keys(STEP_CATALOG).forEach((k) => { add('pd.step.' + k); const e = STEP_CATALOG[k]; add('pd.group.' + e.group);
    Object.values(e.schema.properties).forEach((p) => { const h = hintOf(p); if (h.label) add(h.label); if (h.help) add(h.help); if (h.group) add(h.group); if (h.enum_prefix) (p.enum || (p.items && p.items.enum) || []).forEach((v) => add(h.enum_prefix + v)); }); });
  PRESETS.forEach((p) => add(p.key)); GROUPS.forEach((g) => add('pd.group.' + g));
  ERROR_CODES.concat(['E_PRECONDITION', 'E_TYPE', 'E_FORMAT', 'E_MISSING_ARG', 'E_UNKNOWN_OP', 'E_ARITY', 'E_BUDGET_EXCEEDED', 'E_DECIMAL', 'E_DIV_ZERO', 'E_EMPTY_AGG', 'E_FUNCTION', 'E_SYNTAX']).forEach((c) => add('pd.err.' + c));
  ['setup', 'as_found', 'teardown', 'safe_state'].forEach((l) => add('pd.lane.' + l)); ['body', 'then', 'else', 'handler', 'finally'].forEach((s) => add('pd.slot.' + s));
  ['idempotent', 'resumable', 'non_repeatable'].forEach((r) => { add('pd.resume.' + r); add('pd.resume.beh_' + r); add('pd.plan.' + r); });
  ['none', 'retry', 'escalate', 'skip', 'fail_run'].forEach((a) => { add('pd.pol.' + a); add('pd.pol.help_' + a); });
  ['main', 'errors', 'resume', 'perms', 'notes'].forEach((x) => add('pd.tab.' + x)); ['canvas', 'outline'].forEach((x) => add('pd.view.' + x));
  ['validation', 'hazard', 'recovery', 'versions', 'review'].forEach((x) => add('pd.dock.' + x)); ['palette', 'centre', 'inspector'].forEach((x) => add('pd.pane.' + x));
  ['none', 'editorial', 'functional', 'metrological', 'safety'].forEach((x) => add('pd.cls.' + x)); ['added', 'removed', 'changed', 'moved'].forEach((x) => add('pd.cmp.' + x));
  ['points', 'quantities', 'rules', 'uncertainty', 'equipment', 'results', 'trace'].forEach((x) => add('pd.met.tab.' + x)); ['rerun', 'reconcile', 'decision'].forEach((x) => add('pd.rec.beh.' + x));
  ['idle', 'running', 'waiting_prompt', 'interrupted', 'completed', 'failed', 'aborted'].forEach((x) => add('pd.sim.state.' + x)); ['trace', 'vars', 'wire', 'result', 'report'].forEach((x) => add('pd.sim.tab.' + x));
  ['timeout', 'garbled', 'error_queue', 'disconnect', 'unsafe_level'].forEach((x) => add('pd.fault.' + x)); ['timeout', 'garbled', 'error_queue', 'disconnect'].forEach((x) => add('pd.fault.help.' + x));
  ['nominal', 'marginal', 'failing'].forEach((x) => add('pd.sc.' + x)); ['confirm', 'abort', 'retry', 'skip'].forEach((x) => add('pd.sim.choice.' + x));
  ['limit', 'guard', 'conformity'].forEach((x) => add('pd.rule.' + x)); ['ahl', 'profile', 'procedure'].forEach((x) => add('pd.src.' + x));
  ['within', 'outside', 'unresolved', 'not_evaluated'].forEach((x) => { add('pd.res.' + x); add('pd.res.' + x + '_m'); add('pd.res.' + x + '_n'); });
  ['unverified_against_manual', 'standard', 'verified_by_reviewer'].forEach((x) => add('pd.ver.' + x)); ['draft', 'in_review', 'approved', 'published', 'withdrawn'].forEach((x) => add('st.' + x));
  ['query', 'write'].forEach((x) => add('pd.drv.kind.' + x)); ['quantity', 'enum', 'boolean', 'integer'].forEach((x) => add('pd.drv.ptype.' + x)); ['none', 'string', 'number_with_unit'].forEach((x) => add('pd.drv.parser.' + x)); ['def', 'params', 'state', 'resp', 'sim'].forEach((x) => add('pd.drv.tab.' + x));
  ['schema', 'refs', 'semantic', 'hazard', 'metrology', 'i18n', 'driver'].forEach((x) => add('pd.stage.' + x)); ['instrument', 'standard'].forEach((x) => add('pd.eq.k.' + x)); ['fast', 'slow'].forEach((x) => add('pd.sim.speed.' + x));
  ['engineer', 'hazauth', 'lsma', 'approver', 'safety', 'quality', 'viewer', 'admin'].forEach((x) => add('pd.persona.' + x));
  ['H0', 'H1', 'H2', 'H3', 'H4'].forEach((x) => add('pd.haz.' + x));
  ['run.start', 'run.end', 'run.failing', 'run.interrupted', 'run.resumed', 'lane.start', 'node.start', 'node.end', 'node.skipped', 'node.replayed', 'broker.check', 'broker.refused', 'safety.violation', 'wire', 'fault.injected', 'error', 'retry', 'retry.exhausted', 'handled', 'var', 'eval', 'record', 'branch', 'iteration', 'delay', 'instruct', 'prompt', 'prompt.answered', 'waiting', 'standard.bound', 'teardown.error', 'safe_state.confirmed', 'safe_state.unconfirmed'].forEach((x) => add('pd.ev.' + x));
  ['PR-001', 'PR-002', 'PR-003', 'PR-004', 'PR-005', 'PR-006', 'PR-007', 'PR-008', 'PR-009', 'PR-010', 'PR-013', 'PR-014', 'PR-015', 'PR-018', 'PR-019', 'PR-021', 'PR-023', 'PR-024', 'I18N-001'].forEach((c) => add('f.' + c));
  for (let i = 1; i <= 14; i++) add('f.DRV-' + String(i).padStart(3, '0'));
  add('dim.SU'); add('dim.T');
  const has = (k) => Object.prototype.hasOwnProperty.call(D, k);
  const miss = [...need].filter((k) => !has(k)).sort();
  const pd = Object.entries(D).filter(([k]) => /^(pd|f\\.DRV)/.test(k));
  const empty = pd.filter(([k, v]) => !v[0] || !v[1]).map(([k]) => k);
  const hasHeb = (s) => /[\\u0590-\\u05FF]/.test(s);
  const notHebrew = pd.filter(([k, v]) => v[1] && !hasHeb(v[1]) && /[A-Za-z]{5}/.test(v[1].replace(/\\{[^}]*\\}|su|SU|Broker|digest|snake_case|read_value|set_function|[A-Z_]{3,}/g, ''))).map(([k]) => k);
  const placeholderMismatch = pd.filter(([k, v]) => { const a = (v[0].match(/\\{\\w+\\}/g) || []).sort().join(), b = (v[1].match(/\\{\\w+\\}/g) || []).sort().join(); return a !== b; }).map(([k]) => k);
  return JSON.stringify({ keysChecked: need.size, entries: pd.length, miss, empty, notHebrew, placeholderMismatch });
})()`, ctx));
console.log('keys checked: ' + out.keysChecked + ' · pd entries: ' + out.entries);
let bad = 0; for (const k of ['miss', 'empty', 'notHebrew', 'placeholderMismatch']) { if (out[k].length) { bad++; console.error('FAIL ' + k + ' (' + out[k].length + '):\n   ' + out[k].join('\n   ')); } else console.log('  ok  no ' + k); }
process.exitCode = bad ? 1 : 0;
