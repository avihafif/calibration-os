/* CalOS Procedure Designer DESIGN PROTOTYPE — Metrology workspace. Non-operational. EVERY value shown is synthetic_demo, draft, or an unresolved input.
   Nothing here is a specification, tolerance, uncertainty, decision rule or calibration claim. */
'use strict';
const MET_TABS = ['points', 'quantities', 'rules', 'uncertainty', 'equipment', 'results', 'trace'];
const mcan = () => pcan('draft') && PD.draft.state === 'draft';
function metChanged(structural) { PD.draft.rev++; validateNow(); if (structural) renderMetrologyWorkspace(); else { const fs = document.getElementById('met-sum'); if (fs) fs.replaceChildren(...metSummary()); paintMetFindings(); } }
function metSummary() { const bad = PD.findings.filter((f) => ['PR-013', 'PR-015'].includes(f.code)); const miSet = new Set(PD.findings.filter((f) => f.code === 'PR-013').map((f) => f.params.mi)); return [bad.some((f) => f.code === 'PR-015') ? chip('err', '✖', t('pd.met.inc_missing')) : chip('ok', '✔', t('pd.met.inc_ok')), miSet.size ? chip('warn', '⚠', t('pd.met.n_inputs', { n: miSet.size })) : chip('ok', '✔', t('pd.met.no_inputs')), chip('sim', '◈', t('pd.met.all_synthetic'))]; }
function paintMetFindings() { const box = document.getElementById('pd-main'); if (!box) return; const tb = PD.tables[0]; const fs = []; tb.rows.forEach((r, i) => { if (typeof r.lo_inc !== 'boolean') fs.push({ code: 'PR-015', sev: 'error', ptr: '/rows/' + i + '/lo_inc', params: { row: r.id } }); if (typeof r.hi_inc !== 'boolean') fs.push({ code: 'PR-015', sev: 'error', ptr: '/rows/' + i + '/hi_inc', params: { row: r.id } }); ['nominal', 'tol', 'settle'].forEach((c) => { if (isInput(r[c])) fs.push({ code: 'PR-013', sev: 'warning', ptr: '/rows/' + i + '/' + c, params: { mi: r[c].$input, row: r.id, col: c } }); }); }); paintFindings(box, fs); }

function renderMetrologyWorkspace() {
  const root = document.getElementById('pd-main'); if (!root) return; const tb = PD.metTab || 'points';
  root.replaceChildren(
    h('div', { class: 'ws-head' }, h('div', { class: 'grow' }, h('h1', { id: 'page-title', tabindex: '-1' }, t('pd.met.title')), h('p', { class: 'muted' }, t('pd.met.lead'))), h('div', { class: 'chips-row', id: 'met-sum' }, ...metSummary())),
    banner('warn', t('pd.met.banner')),
    h('div', { class: 'tabs', role: 'tablist', 'aria-label': t('pd.met.title') }, MET_TABS.map((k) => h('button', { type: 'button', role: 'tab', class: 'tab' + (tb === k ? ' on' : ''), 'aria-selected': String(tb === k), onclick: () => { PD.metTab = k; renderMetrologyWorkspace(); } }, t('pd.met.tab.' + k)))),
    h('div', { role: 'tabpanel' }, { points: metPointsTab, quantities: metQuantitiesTab, rules: metRulesTab, uncertainty: metUncertaintyTab, equipment: metEquipmentTab, results: metResultsTab, trace: metTraceTab }[tb]()));
  paintMetFindings();
}
const ro_ = () => !mcan();
function qField(row, col, dim, i) {
  const v = row[col]; const ptr = '/rows/' + i + '/' + col;
  if (isInput(v)) return h('div', { class: 'input-req', 'data-field': ptr }, inputBadge(v.$input), ro_() ? null : btn(t('a.enter_values'), () => { row[col] = { value: '', unit: UNITS[dim][0] }; metChanged(true); }, 'ghost sm'), h('div', { class: 'field-msgs', 'data-msgs': ptr }));
  return h('div', { 'data-field': ptr }, qtyRow(v || { value: '', unit: UNITS[dim][0] }, ptr, { readOnly: ro_() }, dim, (nq, s) => { row[col] = nq; metChanged(!!s && false); }), ro_() ? null : btn(t('a.mark_input_required'), () => { row[col] = { $input: col === 'settle' ? 'MI-16' : 'MI-04' }; metChanged(true); }, 'ghost sm'));
}
function incGroup(row, key, i, label) { const ptr = '/rows/' + i + '/' + key; const name = 'inc-' + row.id + key; const mk = (val, txt) => h('label', { class: 'radio' }, h('input', { type: 'radio', name, 'data-ptr': ptr, checked: row[key] === val ? true : null, disabled: ro_() ? true : null, onchange: () => { row[key] = val; metChanged(true); } }), h('span', null, txt)); return h('div', { class: 'inc', role: 'radiogroup', 'aria-label': label, 'data-field': ptr }, h('span', { class: 'muted sm' }, label), mk(true, t('inclusive')), mk(false, t('exclusive')), h('div', { class: 'field-msgs', 'data-msgs': ptr })); }
function intervalText(r) {
  try { if (isInput(r.nominal) || isInput(r.tol) || !r.nominal || !r.tol) return null; const n = Dec.parse(r.nominal.value), tl = Dec.parse(r.tol.value); const u = r.nominal.unit; if (unitDim(u) !== unitDim(r.tol.unit)) return null; const tt = toBase({ v: tl, u: r.tol.unit }); const nn = toBase({ v: n, u }); const lo = fromBase(nn.sub(tt), u), hi = fromBase(nn.add(tt), u); return (typeof r.lo_inc === 'boolean' ? (r.lo_inc ? '[' : '(') : '?') + lo + ' … ' + hi + (typeof r.hi_inc === 'boolean' ? (r.hi_inc ? ']' : ')') : '?') + ' ' + u; } catch (e) { return null; }
}
function metPointsTab() {
  const tb = PD.tables[0]; const box = h('div', null, h('p', { class: 'help' }, t('pd.met.h.points')));
  if (ro_()) box.append(banner('info', t('pd.msg.readonly')));
  tb.rows.forEach((r, i) => {
    const iv = intervalText(r);
    box.append(h('fieldset', { class: 'rec', 'data-field': '/rows/' + i }, h('legend', null, ltr(r.id, 'mono'), ' ', provChip(r.prov)),
      h('div', { class: 'met-grid' },
        h('div', null, h('div', { class: 'lbl sm' }, t('pd.met.f.nominal')), qField(r, 'nominal', 'SU', i)),
        h('div', null, h('div', { class: 'lbl sm' }, t('pd.met.f.tol')), qField(r, 'tol', 'SU', i), h('div', { class: 'help' }, t('pd.met.h.tol'))),
        h('div', null, h('div', { class: 'lbl sm' }, t('pd.met.f.settle')), qField(r, 'settle', 'T', i)),
        h('div', null, h('label', { class: 'lbl sm', for: 'rd-' + i }, t('pd.met.f.readings')), h('input', { id: 'rd-' + i, class: 'input mono qty-val', dir: 'ltr', inputmode: 'numeric', value: String(r.readings), disabled: ro_() ? true : null, oninput: (e) => { r.readings = /^\d+$/.test(e.target.value) ? parseInt(e.target.value, 10) : e.target.value; metChanged(false); } }))),
      h('div', { class: 'met-inc' }, incGroup(r, 'lo_inc', i, t('pd.met.f.lo_inc')), incGroup(r, 'hi_inc', i, t('pd.met.f.hi_inc')), h('div', { class: 'help' }, t('help.no_default_inclusivity'))),
      h('div', { class: 'iv-out' }, h('span', { class: 'muted sm' }, t('pd.met.acceptance') + ' '), iv ? ltr(iv, 'mono') : h('span', { class: 'muted' }, t('pd.met.iv_unresolved')), ' ', chip('mut sm', '', t('pd.met.not_a_decision'))),
      h('label', { class: 'lbl sm', for: 'pv-' + i }, t('pd.met.f.prov')), h('select', { id: 'pv-' + i, class: 'input sm', disabled: ro_() ? true : null, onchange: (e) => { r.prov = e.target.value; metChanged(true); } }, ['synthetic_demo', 'draft', 'verified', 'approved'].map((p) => h('option', { value: p, selected: r.prov === p ? true : null, disabled: (p === 'verified' || p === 'approved') ? true : null }, t('prov.' + p) + ((p === 'verified' || p === 'approved') ? ' · ' + t('pd.met.prov_gov') : '')))),
      ro_() ? null : btn('✕ ' + t('a.remove'), () => { tb.rows.splice(i, 1); metChanged(true); toast(t('removed_undo')); }, 'ghost sm danger')));
  });
  if (!ro_()) box.append(btn('+ ' + t('pd.met.add_point'), () => { let n = tb.rows.length + 1; while (tb.rows.some((x) => x.id === 'tp' + n)) n++; tb.rows.push({ id: 'tp' + n, nominal: { $input: 'MI-03' }, tol: { $input: 'MI-04' }, readings: 3, settle: { $input: 'MI-16' }, prov: 'draft' }); metChanged(true); say(t('pd.msg.point_added')); }, 'sm'));
  return box;
}
function metQuantitiesTab() {
  const rows = [['SU', ['su', 'msu', 'usu'], '1 su = 1000 msu = 1 000 000 usu'], ['T', ['s', 'ms'], '1 s = 1000 ms']];
  return h('div', null, h('p', { class: 'help' }, t('pd.met.h.quantities')), h('table', { class: 'tbl', 'aria-label': t('pd.met.tab.quantities') }, h('thead', null, h('tr', null, ['pd.met.q.dim', 'pd.met.q.units', 'pd.met.q.conv'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, rows.map(([d, us, cv]) => h('tr', null, h('td', null, DIM_LABEL(d), ' ', chip('sim sm', '◈', t('pd.met.synthetic_unit'))), h('td', null, us.map((u) => h('span', { class: 'chip mut sm' }, ltr(u, 'mono')))), h('td', null, ltr(cv, 'mono')))))),
    banner('info', t('pd.met.q.rules')), h('ul', { class: 'plain' }, ['pd.met.q.r1', 'pd.met.q.r2', 'pd.met.q.r3'].map((k) => h('li', null, t(k)))), h('div', { class: 'demo-box' }, h('div', { class: 'lbl sm' }, t('pd.met.q.try')), qDemo()));
}
function qDemo() {
  const out = h('div', { role: 'status', 'aria-live': 'polite', class: 'mono' }); const inp = h('input', { class: 'input mono', dir: 'ltr', 'aria-label': t('pd.met.q.try'), value: '2 su + 500 msu', oninput: () => upd() });
  function upd() { try { out.replaceChildren(chip('ok', '✔', fmtQ(evaluate(inp.value, {})))); } catch (e) { out.replaceChildren(chip('err', '✖', e.code || 'ERR'), ' ', e.message); } } upd(); return h('div', null, inp, out);
}
function metRulesTab() {
  const opt = (id, on, why) => h('li', { class: 'rule-opt' + (on ? ' on' : '') }, h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'rule', checked: on ? true : null, disabled: !on ? true : null, 'aria-describedby': 'rule-' + id }), h('span', null, h('strong', null, t('pd.rule.' + id)))), h('div', { id: 'rule-' + id, class: 'help' }, on ? t('pd.rule.' + id + '_help') : [chip('mut sm', '🔒', t('pd.rule.locked')), ' ', why]));
  return h('div', null, h('p', { class: 'help' }, t('pd.met.h.rules')), h('ul', { class: 'plain rules' }, opt('limit', true), opt('guard', false, t('pd.rule.guard_why')), opt('conformity', false, t('pd.rule.conf_why'))),
    h('div', { class: 'input-req' }, inputBadge('MI-08'), h('span', { class: 'muted sm' }, MI_REGISTER['MI-14'] + ' · ' + MI_REGISTER['MI-08'])), h('p', { class: 'help' }, t('pd.rule.note')));
}
function metUncertaintyTab() {
  return h('div', null, h('p', { class: 'help' }, t('pd.met.h.uncertainty')), banner('warn', t('pd.unc.banner')), h('table', { class: 'tbl', 'aria-label': t('pd.met.tab.uncertainty') }, h('thead', null, h('tr', null, ['pd.unc.component', 'pd.unc.distribution', 'pd.unc.value', 'pd.unc.source'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, ['pd.unc.c_ref', 'pd.unc.c_res', 'pd.unc.c_rep', 'pd.unc.c_env'].map((k) => h('tr', null, h('td', null, t(k)), h('td', null, h('span', { class: 'muted' }, t('not_set'))), h('td', null, inputBadge('MI-17')), h('td', null, h('span', { class: 'muted' }, t('not_set'))))))),
    h('div', { class: 'kv-list' }, h('div', null, h('span', { class: 'muted' }, t('pd.unc.combined') + ' '), chip('mut', '∅', t('pd.unc.not_evaluated'))), h('div', null, h('span', { class: 'muted' }, t('pd.unc.tur') + ' '), inputBadge('MI-27'))), h('p', { class: 'help' }, t('pd.unc.note')));
}
function metEquipmentTab() {
  const roles = PD.draft.proc.roles; return h('div', null, h('p', { class: 'help' }, t('pd.met.h.equipment')), h('table', { class: 'tbl', 'aria-label': t('pd.met.tab.equipment') }, h('thead', null, h('tr', null, ['pd.eq.role', 'pd.eq.kind', 'pd.eq.requirement', 'pd.eq.status'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, roles.map((r) => h('tr', null, h('td', null, locText(r.title).text, ' ', ltr(r.id, 'mono')), h('td', null, t('pd.eq.k.' + r.kind)), h('td', null, r.kind === 'standard' ? inputBadge('MI-06') : h('span', { class: 'muted' }, t('pd.eq.under_test'))), h('td', null, chip('sim sm', '◈', t('pd.eq.simulated_only'))))))), h('p', { class: 'help' }, t('pd.eq.note')), h('p', null, h('a', { class: 'link', href: '#', onclick: (e) => { e.preventDefault(); PD.centre = 'canvas'; go('design'); } }, t('pd.eq.link_steps'))));
}
function metResultsTab() {
  const lastRun = PD.sim.run; const pts = lastRun ? lastRun.dataset.points : [];
  return h('div', null, h('p', { class: 'help' }, t('pd.met.h.results')), h('table', { class: 'tbl', 'aria-label': t('pd.met.tab.results') }, h('thead', null, h('tr', null, ['pd.res.label', 'pd.res.meaning', 'pd.res.not'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', ['within', 'outside', 'unresolved', 'not_evaluated'].map((k) => h('tr', null, h('td', null, chip(k === 'within' ? 'ok' : k === 'outside' ? 'err' : k === 'unresolved' ? 'warn' : 'mut', k === 'within' ? '✔' : k === 'outside' ? '✖' : k === 'unresolved' ? '⚠' : '∅', t('pd.res.' + k))), h('td', null, t('pd.res.' + k + '_m')), h('td', null, t('pd.res.' + k + '_n')))))), h('h3', null, t('pd.res.last')),
    pts.length ? dataGrid({ id: 'res', label: t('pd.res.last'), columns: [{ key: 'id', label: 'pd.res.point', text: (p) => p.id }, { key: 'measured', label: 'pd.res.measured', text: (p) => p.reading, render: (p) => ltr(p.reading, 'mono') }, { key: 'dev', label: 'pd.res.deviation', text: (p) => p.deviation, render: (p) => ltr(p.deviation, 'mono') }, { key: 'lbl', label: 'pd.res.label', text: (p) => p.within ? t('pd.res.within') : t('pd.res.outside'), render: (p) => chip(p.within ? 'ok sm' : 'err sm', p.within ? '✔' : '✖', p.within ? t('pd.res.within') : t('pd.res.outside')) }, { key: 'sim', label: 'pd.res.flag', text: () => 'SIMULATED', render: () => chip('sim sm', '◈', t('pd.sim.flag')) }], rows: pts }) : h('p', { class: 'muted' }, t('pd.res.none')));
}
function metTraceTab() {
  const p = PD.draft.proc; const dig = digestOf(p); const tb = PD.tables[0];
  const cnt = (s) => tb.rows.filter((r) => r.prov === s).length; const unres = new Set(PD.findings.filter((f) => f.code === 'PR-013').map((f) => f.params.mi + '·' + f.params.row + '.' + f.params.col)).size;
  return h('div', null, h('p', { class: 'help' }, t('pd.met.h.trace')),
    h('dl', { class: 'dl' }, [[t('pd.tr.proc'), ltr(shortDigest(dig), 'mono')], [t('pd.tr.table'), ltr(tb.key + ' · ' + shortDigest(digestOf(tb)), 'mono')], [t('pd.tr.driver'), ltr(PD.driver.key + ' · ' + shortDigest(digestOf(PD.driver)), 'mono')], [t('pd.tr.profile'), ltr(PD.profile.key + ' · ' + t('st.' + PD.profile.status), 'mono')], [t('pd.tr.counts'), [chip('sim sm', '◈', t('prov.synthetic_demo') + ' ' + cnt('synthetic_demo')), ' ', chip('mut sm', '✎', t('prov.draft') + ' ' + cnt('draft')), ' ', chip('ok sm', '✔', t('prov.verified') + ' ' + (cnt('verified') + cnt('approved'))), ' ', chip('warn sm', '⚠', t('input_required') + ' ' + unres)]]].flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
    h('h3', null, t('pd.tr.blockers')), h('ul', { class: 'plain' }, [['PR-013', 'pd.tr.b_inputs'], ['PR-014', 'pd.tr.b_synthetic'], ['PR-024', 'pd.tr.b_sim']].map(([c, k]) => h('li', null, PD.findings.some((f) => f.code === c) ? chip('err sm', '⛔', t('pd.tr.blocks')) : chip('ok sm', '✔', t('pd.tr.clear')), ' ', t(k), ' ', ltr('[' + c + ']', 'code')))), h('p', { class: 'help' }, t('pd.tr.note')));
}
