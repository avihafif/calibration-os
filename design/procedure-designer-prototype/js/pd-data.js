/* CalOS Procedure Designer DESIGN PROTOTYPE — step catalog (metadata) and SYNTHETIC seed content.
   The block inspector is generated from the `schema` + `x-calos-editor` hints of each catalog entry by the same generic
   renderer used in Phase 1A. NOTHING here is metrology: "su" is a SYNTHETIC unit with no physical meaning; every number below is
   a synthetic_demo placeholder invented for the prototype and carries no specification, tolerance, limit or uncertainty meaning. */
'use strict';
UNITS.SU = ['su', 'msu', 'usu']; UNITS.T = ['s', 'ms'];
Object.assign(MI_REGISTER, { 'MI-03': 'Test points and per-point settings', 'MI-04': 'Specifications / acceptance limits', 'MI-08': 'Decision rules and guard bands', 'MI-14': 'Boundary inclusivity convention', 'MI-16': 'Warm-up / stabilisation durations', 'MI-17': 'Independent reference calculations for uncertainty', 'MI-26': 'Absolute Hardware Limits', 'MI-27': 'TUR policy' });

const H = (o) => o;
const ID = (label, extra) => ({ type: 'string', pattern: '[a-z][a-z0-9_]{0,47}', 'x-calos-editor': H({ widget: 'text', label, mono: true, pattern_help: 'help.identifier', ...extra }) });
const EXPR = (label, extra) => ({ type: 'string', 'x-calos-editor': H({ widget: 'expression', label, mono: true, ...extra }) });
const SEL = (label, options, extra) => ({ type: 'string', 'x-calos-editor': H({ widget: 'select-from', label, options, ...extra }) });
const INT = (label, extra) => ({ type: 'integer', minimum: 1, 'x-calos-editor': H({ widget: 'integer', label, ...extra }) });
const DUR = (label, extra) => ({ 'x-calos-editor': H({ widget: 'duration', label, ...extra }) });
const NTITLE = LOC('pd.f.title', { localized_required: false, group: 'g.general', order: 0 });
const ERRPOL = { type: 'object', 'x-calos-editor': H({ widget: 'error-policy', label: 'pd.f.on_error', tab: 'errors' }) };
const RESUME = { type: 'string', enum: ['idempotent', 'resumable', 'non_repeatable'], 'x-calos-editor': H({ widget: 'resume-policy', label: 'pd.f.resume', tab: 'resume' }) };
const NOTES = LOC('pd.f.notes', { localized_required: false, multiline: true, tab: 'notes' });
const COMMON = { title: NTITLE, resume_policy: RESUME, on_error: ERRPOL, notes: NOTES };

/* Catalog v1 (prototype subset). `proposal:true` = not in PROCEDURE_SCHEMA C.3 (flagged in the decision register). */
const STEP_CATALOG = {
  'driver.call': { group: 'instrument', glyph: '⇄', slots: [], lanes: ['setup', 'phase', 'teardown', 'safe_state'],
    schema: { required: ['role', 'op'], properties: { role: SEL('pd.f.role', 'roles', { group: 'g.general', order: 1 }), op: SEL('pd.f.op', 'ops', { group: 'g.general', order: 2, help: 'pd.help.op' }), args: { type: 'object', 'x-calos-editor': H({ widget: 'op-args', label: 'pd.f.args', group: 'g.general', order: 3, help: 'pd.help.args' }) }, store_as: ID('pd.f.store_as', { group: 'g.general', order: 4, help: 'pd.help.store_as' }), ...COMMON } } },
  'standard.require': { group: 'instrument', glyph: '⚖', proposal: true, slots: [], lanes: ['setup'],
    schema: { required: ['role'], properties: { role: SEL('pd.f.role', 'standard_roles', { group: 'g.general', order: 1, help: 'pd.help.standard' }), ...COMMON } } },
  'source.apply': { group: 'instrument', glyph: '⏚', slots: [], lanes: ['phase'], hazard: 'H2',
    schema: { required: ['role', 'value'], properties: { role: SEL('pd.f.role', 'standard_roles', { group: 'g.general', order: 1 }), value: EXPR('pd.f.value', { group: 'g.general', order: 2, expect: 'SU', help: 'pd.help.value' }), bound_max_abs: { type: 'string', 'x-calos-editor': H({ widget: 'bound', label: 'pd.f.bound', group: 'g.safety', help: 'pd.help.bound', dimension: 'SU' }) }, ...COMMON } } },
  'source.off': { group: 'instrument', glyph: '⏻', slots: [], lanes: ['phase', 'teardown', 'safe_state'], hazard: 'H1',
    schema: { required: ['role'], properties: { role: SEL('pd.f.role', 'standard_roles', { group: 'g.general', order: 1 }), ...COMMON } } },
  'measure.acquire': { group: 'measure', glyph: '◉', slots: [], lanes: ['phase'], hazard: 'H0',
    schema: { required: ['role', 'op', 'count', 'store_as'], properties: { role: SEL('pd.f.role', 'roles', { group: 'g.general', order: 1 }), op: SEL('pd.f.op', 'query_ops', { group: 'g.general', order: 2 }), count: EXPR('pd.f.count', { group: 'g.general', order: 3, expect: '' }), aggregate: { type: 'string', enum: ['mean'], 'x-calos-editor': H({ widget: 'enum', label: 'pd.f.aggregate', group: 'g.general', order: 4, enum_prefix: 'pd.agg.' }) }, store_as: ID('pd.f.store_as', { group: 'g.general', order: 5, help: 'pd.help.acq_var' }), ...COMMON } } },
  'compute.set': { group: 'compute', glyph: 'ƒ', slots: [], lanes: ['setup', 'phase', 'teardown'],
    schema: { required: ['var', 'expr'], properties: { var: ID('pd.f.var', { group: 'g.general', order: 1 }), expr: EXPR('pd.f.expr', { group: 'g.general', order: 2, help: 'pd.help.expr' }), ...COMMON } } },
  'evaluate.limits': { group: 'metrology', glyph: '⇹', slots: [], lanes: ['phase'],
    schema: { required: ['measured', 'nominal', 'table', 'row', 'result_var'], properties: { measured: EXPR('pd.f.measured', { group: 'g.general', order: 1, expect: 'SU' }), nominal: EXPR('pd.f.nominal', { group: 'g.general', order: 2, expect: 'SU' }), table: SEL('pd.f.table', 'tables', { group: 'g.general', order: 3 }), row: EXPR('pd.f.row', { group: 'g.general', order: 4, expect: 'rec' }), result_var: ID('pd.f.result_var', { group: 'g.general', order: 5 }), ...COMMON } } },
  'record.result': { group: 'metrology', glyph: '▤', slots: [], lanes: ['phase'],
    schema: { required: ['dataset_path', 'value'], properties: { dataset_path: { type: 'string', enum: ['as_found.points'], 'x-calos-editor': H({ widget: 'enum', label: 'pd.f.dataset_path', group: 'g.general', order: 1, enum_prefix: 'pd.ds.', help: 'pd.help.dataset' }) }, value: EXPR('pd.f.value', { group: 'g.general', order: 2 }), ...COMMON } } },
  'flow.if': { group: 'flow', glyph: '◇', slots: ['then', 'else'], lanes: ['setup', 'phase', 'teardown'],
    schema: { required: ['cond'], properties: { cond: EXPR('pd.f.cond', { group: 'g.general', order: 1, expect: 'bool' }), ...COMMON } } },
  'flow.foreach': { group: 'flow', glyph: '↻', slots: ['body'], lanes: ['phase'],
    schema: { required: ['over', 'as', 'max_iterations'], properties: { over: SEL('pd.f.over', 'tables', { group: 'g.general', order: 1 }), as: ID('pd.f.as', { group: 'g.general', order: 2 }), max_iterations: INT('pd.f.max_iter', { group: 'g.bounds', order: 3, help: 'pd.help.bound_iter' }), ...COMMON } } },
  'flow.repeat_until': { group: 'flow', glyph: '⟳', slots: ['body'], lanes: ['phase'],
    schema: { required: ['until', 'max_iterations', 'timeout'], properties: { until: EXPR('pd.f.until', { group: 'g.general', order: 1, expect: 'bool' }), max_iterations: INT('pd.f.max_iter', { group: 'g.bounds', order: 2, help: 'pd.help.bound_iter' }), timeout: DUR('pd.f.timeout', { group: 'g.bounds', order: 3 }), ...COMMON } } },
  'flow.delay': { group: 'flow', glyph: '⏱', slots: [], lanes: ['setup', 'phase', 'teardown'],
    schema: { required: ['duration'], properties: { duration: EXPR('pd.f.duration', { group: 'g.general', order: 1, expect: 'T', help: 'pd.help.duration' }), ...COMMON } } },
  'flow.wait_until': { group: 'flow', glyph: '⌛', slots: [], lanes: ['setup', 'phase', 'teardown'],
    schema: { required: ['cond', 'timeout'], properties: { cond: EXPR('pd.f.cond', { group: 'g.general', order: 1, expect: 'bool' }), timeout: DUR('pd.f.timeout', { group: 'g.bounds', order: 2 }), on_timeout: { type: 'string', enum: ['fail', 'continue', 'escalate'], 'x-calos-editor': H({ widget: 'enum', label: 'pd.f.on_timeout', group: 'g.bounds', order: 3, enum_prefix: 'pd.ot.' }) }, ...COMMON } } },
  'flow.try': { group: 'flow', glyph: '⛨', slots: ['body', 'handler', 'finally'], lanes: ['setup', 'phase', 'teardown'],
    schema: { required: ['match'], properties: { match: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['E_TIMEOUT', 'E_PARSE', 'E_INSTRUMENT_ERROR', 'E_UNRESOLVED_INPUT', 'E_DISCONNECT'] }, 'x-calos-editor': H({ widget: 'enum-multi', label: 'pd.f.match', group: 'g.general', order: 1, help: 'pd.help.match' }) }, ...COMMON } } },
  'operator.instruct': { group: 'operator', glyph: 'ⓘ', slots: [], lanes: ['setup', 'phase', 'teardown', 'safe_state'],
    schema: { required: ['text'], properties: { text: LOC('pd.f.text', { multiline: true, group: 'g.general', order: 1 }), ...COMMON } } },
  'operator.confirm': { group: 'operator', glyph: '☑', slots: [], lanes: ['setup', 'phase', 'teardown'],
    schema: { required: ['prompt'], properties: { prompt: LOC('pd.f.prompt', { multiline: true, group: 'g.general', order: 1 }), ...COMMON } } },
  'operator.input': { group: 'operator', glyph: '⌨', slots: [], lanes: ['setup', 'phase'],
    schema: { required: ['prompt', 'var'], properties: { prompt: LOC('pd.f.prompt', { multiline: true, group: 'g.general', order: 1 }), var: ID('pd.f.var', { group: 'g.general', order: 2 }), ...COMMON } } },
};
Object.values(STEP_CATALOG).forEach((e) => { e.schema.type = 'object'; e.schema.additionalProperties = false; e.schema.properties.id = { type: 'string' }; e.schema.properties.type = { type: 'string' }; slotsInit(e); });
function slotsInit(e) { (e.slots || []).forEach((s) => { e.schema.properties[s] = { type: 'array' }; }); }
const GROUPS = ['flow', 'instrument', 'measure', 'compute', 'metrology', 'operator'];
/* Palette snippets (presets) expand to catalog types — they add no runtime building block */
const PRESETS = [
  { id: 'identify', glyph: '🆔', key: 'pd.preset.identify', build: () => [{ type: 'driver.call', role: 'uut', op: 'identify', store_as: 'identity', title: { en: 'Identify instrument', he: 'זיהוי מכשיר' } }] },
  { id: 'initialize', glyph: '⟲', key: 'pd.preset.initialize', build: () => [{ type: 'driver.call', role: 'uut', op: 'reset', title: { en: 'Reset instrument', he: 'איפוס מכשיר' } }, { type: 'driver.call', role: 'uut', op: 'clear_status', title: { en: 'Clear status', he: 'ניקוי מצב' } }] },
  { id: 'configure', glyph: '⚙', key: 'pd.preset.configure', build: () => [{ type: 'driver.call', role: 'uut', op: 'set_function', args: { function: '"level"' }, title: { en: 'Configure instrument', he: 'הגדרת מכשיר' } }] },
  { id: 'safe_shutdown', glyph: '⏻', key: 'pd.preset.shutdown', build: () => [{ type: 'source.off', role: 'ref', title: { en: 'Source off', he: 'כיבוי מקור' } }] },
];
const ERROR_CODES = ['E_TIMEOUT', 'E_PARSE', 'E_INSTRUMENT_ERROR', 'E_DISCONNECT', 'E_UNRESOLVED_INPUT', 'E_DIM_MISMATCH', 'E_REF', 'E_SAFETY_VIOLATION', 'E_OPERATOR_ABORT', 'E_LOOP_BOUND'];

/* ---------------- synthetic driver definition (editable in the Command Builder; named operations only) ---------------- */
const MKDRV = () => ({
  key: 'synthetic-driver', title: { en: 'Synthetic driver (design prototype)', he: 'דרייבר סינתטי (אב־טיפוס עיצוב)' }, protocol: 'scpi_text',
  libraries: [{ key: 'ieee488-2-common', version: '1.0.0', origin: 'platform' }],
  state: [{ id: 'function', type: 'enum', values: ['idle', 'level'], initial: 'idle' }, { id: 'level_set', type: 'bool', initial: 'false' }, { id: 'output', type: 'enum', values: ['off', 'on'], initial: 'off' }],
  ops: [
    { name: 'identify', kind: 'query', template: '*IDN?', params: [], hazard: 'H0', verification: 'standard', origin: 'ieee488-2-common', response: { parser: 'string' }, timeout: '2', retry: 0, source_ref: '', pre: [], eff: [], safe: false },
    { name: 'reset', kind: 'write', template: '*RST', params: [], hazard: 'H1', verification: 'standard', origin: 'ieee488-2-common', response: { parser: 'none' }, timeout: '2', retry: 0, source_ref: '', pre: [], eff: [{ state: 'function', set: 'idle' }, { state: 'output', set: 'off' }, { state: 'level_set', set: 'false' }], safe: false },
    { name: 'clear_status', kind: 'write', template: '*CLS', params: [], hazard: 'H0', verification: 'standard', origin: 'ieee488-2-common', response: { parser: 'none' }, timeout: '2', retry: 0, source_ref: '', pre: [], eff: [], safe: false },
    { name: 'read_error', kind: 'query', template: 'SYSTem:ERRor?', params: [], hazard: 'H0', verification: 'standard', origin: 'ieee488-2-common', response: { parser: 'string' }, timeout: '2', retry: 0, source_ref: '', pre: [], eff: [], safe: false },
    { name: 'set_function', kind: 'write', template: 'SYNT:FUNC {function}', params: [{ name: 'function', type: 'enum', tokens: { level: 'LEV' } }], hazard: 'H1', verification: 'unverified_against_manual', origin: 'local', response: { parser: 'none' }, timeout: '2', retry: 2, source_ref: '', pre: [], eff: [{ state: 'function', set: 'level' }], safe: false },
    { name: 'read_value', kind: 'query', template: 'SYNT:READ?', params: [], hazard: 'H0', verification: 'unverified_against_manual', origin: 'local', response: { parser: 'number_with_unit', unit: 'su' }, timeout: '5', retry: 2, source_ref: '', pre: [{ state: 'function', equals: 'level' }], eff: [], safe: false },
    { name: 'set_source_level', kind: 'write', template: 'SYNT:SOUR:LEV {level}', params: [{ name: 'level', type: 'quantity', dimension: 'SU', bounds: { $input: 'MI-26' }, limit_target: 'set_source_level.level' }], hazard: 'H2', verification: 'unverified_against_manual', origin: 'local', response: { parser: 'none' }, timeout: '2', retry: 0, source_ref: '', pre: [], eff: [{ state: 'level_set', set: 'true' }], safe: false },
    { name: 'source_output_on', kind: 'write', template: 'SYNT:SOUR:OUTP ON', params: [], hazard: 'H2', verification: 'unverified_against_manual', origin: 'local', response: { parser: 'none' }, timeout: '2', retry: 0, source_ref: '', pre: [{ state: 'level_set', equals: 'true' }], eff: [{ state: 'output', set: 'on' }], safe: false },
    { name: 'source_output_off', kind: 'write', template: 'SYNT:SOUR:OUTP OFF', params: [], hazard: 'H1', verification: 'unverified_against_manual', origin: 'local', response: { parser: 'none' }, timeout: '2', retry: 0, source_ref: '', pre: [], eff: [{ state: 'output', set: 'off' }], safe: true },
    { name: 'local_mode', kind: 'write', template: 'SYST:LOC', params: [], hazard: 'H1', verification: 'unverified_against_manual', origin: 'local', response: { parser: 'none' }, timeout: '2', retry: 0, source_ref: '', pre: [], eff: [], safe: false },
  ],
  role_ops: { standard: { apply: ['set_source_level', 'source_output_on'], off: 'source_output_off' } },
});
const SIM_PROFILE = { identity: { manufacturer: 'SIMULATED', model: 'SYNTH-1', serial: 'SIM-0001', firmware: 'sim-1.0' }, provenance: 'synthetic_demo', seed: 42,
  scenarios: { nominal: { offset: '0.002', noise: 3 }, marginal: { offset: '0.040', noise: 8 }, failing: { offset: '0.200', noise: 10 } } };

/* ---------------- synthetic metrology table (spec table "synthetic-points"): ALL VALUES synthetic_demo or Input required ---------------- */
const MKTABLE = () => ({ id: 'points', key: 'synthetic-points', title: { en: 'Synthetic test points', he: 'נקודות בדיקה סינתטיות' }, dimension: 'SU',
  rows: [
    { id: 'tp1', nominal: { value: '1', unit: 'su' }, tol: { value: '0.05', unit: 'su' }, lo_inc: true, hi_inc: true, readings: 3, settle: { value: '0.5', unit: 's' }, prov: 'synthetic_demo' },
    { id: 'tp2', nominal: { value: '2', unit: 'su' }, tol: { value: '0.05', unit: 'su' }, lo_inc: true, hi_inc: true, readings: 3, settle: { value: '0.5', unit: 's' }, prov: 'synthetic_demo' },
    { id: 'tp3', nominal: { value: '5', unit: 'su' }, tol: { $input: 'MI-04' }, lo_inc: true, hi_inc: true, readings: 3, settle: { $input: 'MI-16' }, prov: 'draft' },
  ] });

/* ---------------- safety: simulator-scope Absolute Hardware Limits (READ-ONLY, deep-frozen) and a governed Safety Profile ---------------- */
const deepFreeze = (o) => { Object.values(o).forEach((v) => { if (v && typeof v === 'object') deepFreeze(v); }); return Object.freeze(o); };
const AHL_PACK = deepFreeze({ id: 'sim-scope-pack', pack_version: 1, simulated: true, signed_by: 'non-production test key (simulated)', scope: 'TEST deployment only', note: 'SYNTHETIC simulator-scope pack. Not a hardware limit of any real instrument.',
  entries: [{ target: 'set_source_level.level', dimension: 'SU', max_abs: { value: '10', unit: 'su' } }] });
const MKPROFILE = () => ({ key: 'synthetic-sim-profile', simulated: true, status: 'approved', author: 'lsma', approvals: [{ role: 'safety', by: 'safety', reason: 'synthetic seed' }], pinned: '1.0.0',
  envelopes: [{ target: 'set_source_level.level', max_abs: { value: '8', unit: 'su' } }], interlocks: [{ id: 'cables', text: { en: 'Confirm connections are made with source output OFF.', he: 'אשרו שהחיבורים בוצעו כשפלט המקור כבוי.' } }], safe_state: 'source_output_off' });

/* ---------------- synthetic procedure (published v1.0.0 and a draft with changes) ---------------- */
const MKPROC = () => ({
  key: 'synthetic-demo-procedure', title: { en: 'Synthetic demonstration procedure', he: 'נוהל הדגמה סינתטי' },
  roles: [{ id: 'uut', kind: 'instrument', title: { en: 'Instrument under test', he: 'מכשיר נבדק' } }, { id: 'ref', kind: 'standard', title: { en: 'Reference source', he: 'מקור ייחוס' } }],
  tables: [{ id: 'points', key: 'synthetic-points' }],
  intended_modes: ['simulation'],
  lifecycle: {
    setup: [
      { id: 'require_1', type: 'standard.require', role: 'ref', title: { en: 'Require reference source', he: 'דרישת מקור ייחוס' } },
      { id: 'identify_1', type: 'driver.call', role: 'uut', op: 'identify', store_as: 'identity', title: { en: 'Identify instrument', he: 'זיהוי מכשיר' } },
      { id: 'reset_1', type: 'driver.call', role: 'uut', op: 'reset', title: { en: 'Reset instrument', he: 'איפוס מכשיר' } },
      { id: 'clear_1', type: 'driver.call', role: 'uut', op: 'clear_status', title: { en: 'Clear status', he: 'ניקוי מצב' } },
      { id: 'confirm_1', type: 'operator.confirm', prompt: { en: 'Confirm synthetic connections are made.', he: 'אשרו שהחיבורים הסינתטיים בוצעו.' }, title: { en: 'Confirm connections', he: 'אישור חיבורים' } },
    ],
    phases: [{ id: 'as_found', kind: 'as_found', body: [
      { id: 'foreach_1', type: 'flow.foreach', over: 'points', as: 'tp', max_iterations: 20, title: { en: 'For each test point', he: 'לכל נקודת בדיקה' }, body: [
        { id: 'apply_1', type: 'source.apply', role: 'ref', value: 'item.tp.nominal', title: { en: 'Apply source', he: 'הפעלת מקור' }, resume_policy: 'resumable' },
        { id: 'config_1', type: 'driver.call', role: 'uut', op: 'set_function', args: { function: '"level"' }, title: { en: 'Configure instrument', he: 'הגדרת מכשיר' } },
        { id: 'delay_1', type: 'flow.delay', duration: 'item.tp.settle', title: { en: 'Stabilise', he: 'התייצבות' } },
        { id: 'acquire_1', type: 'measure.acquire', role: 'uut', op: 'read_value', count: 'item.tp.readings', aggregate: 'mean', store_as: 'reading', title: { en: 'Acquire readings', he: 'רכישת קריאות' }, on_error: { action: 'retry', max_attempts: 2, backoff: '0.2' } },
        { id: 'limits_1', type: 'evaluate.limits', measured: 'var.reading', nominal: 'item.tp.nominal', table: 'points', row: 'item.tp', result_var: 'point_result', title: { en: 'Check limits', he: 'בדיקת גבולות' } },
        { id: 'record_1', type: 'record.result', dataset_path: 'as_found.points', value: 'var.point_result', title: { en: 'Record result', he: 'רישום תוצאה' } },
      ] },
    ] }],
    teardown: [
      { id: 'off_1', type: 'source.off', role: 'ref', title: { en: 'Source off', he: 'כיבוי מקור' } },
      { id: 'local_1', type: 'driver.call', role: 'uut', op: 'local_mode', title: { en: 'Return instrument to local', he: 'החזרת המכשיר למצב מקומי' } },
    ],
    safe_state: [{ id: 'safe_off_1', type: 'source.off', role: 'ref', title: { en: 'Source off (safe state)', he: 'כיבוי מקור (מצב בטוח)' } }],
  },
});
function MKDRAFT() {
  const p = MKPROC(); const fe = p.lifecycle.phases[0].body[0];
  fe.max_iterations = 25;
  const lim = fe.body.findIndex((n) => n.id === 'limits_1');
  fe.body.splice(lim + 1, 0, { id: 'if_1', type: 'flow.if', cond: 'not var.point_result.within', title: { en: 'If outside limits', he: 'אם מחוץ לגבולות' }, then: [{ id: 'oot_1', type: 'compute.set', var: 'oot_flag', expr: 'true', title: { en: 'Flag out-of-limits', he: 'סימון חריגה' } }], else: [] });
  return p;
}
