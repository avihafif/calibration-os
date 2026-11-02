/* CalOS Procedure Designer DESIGN PROTOTYPE — Instrument Command Builder (driver authoring UX). Non-operational.
   Procedures can only call the NAMED operations authored here. There is deliberately no field, button or API that sends a free-form string. */
'use strict';
const HAZ_DESC = { H0: 'pd.haz.H0', H1: 'pd.haz.H1', H2: 'pd.haz.H2', H3: 'pd.haz.H3', H4: 'pd.haz.H4' };
const DRV_PARSERS = ['none', 'string', 'number_with_unit'];
const DRV_TYPES = ['quantity', 'enum', 'boolean', 'integer'];
const dcan = () => pcan('driver.author');
const opEditable = (op) => dcan() && op.origin === 'local' && (HRANK[op.hazard] < 2 || pcan('driver.author.hazardous'));
function selOp() { return PD.driver.ops.find((o) => o.name === PD.drvSel) || PD.driver.ops[0]; }
function drvChanged(structural) { PD.draft.rev++; validateNow(); PD.drvBox = null; if (structural) renderDriverWorkspace(); else { paintDrvFindings(); } }
function paintDrvFindings() { const box = document.getElementById('drv-edit'); if (!box) return; const op = selOp(); const fs = validateOp(op, PD.driver).map((f) => ({ code: f.code, sev: f.sev, ptr: '/' + f.field, params: f.params })); paintFindings(box, fs); const sum = document.getElementById('drv-sum'); if (sum) sum.replaceChildren(...drvSummary(op)); }
function drvSummary(op) { const fs = validateOp(op, PD.driver); const c = countSev(fs); return [chip(c.error ? 'err' : 'ok', c.error ? '✖' : '✔', c.error ? t('n_errors', { n: c.error }) : t('pd.drv.valid')), c.info ? chip('info sm', 'ℹ', t('n_info', { n: c.info })) : null]; }

function renderDriverWorkspace() {
  const root = document.getElementById('pd-main'); if (!root) return; const op = selOp(); root.replaceChildren(
    h('div', { class: 'ws-head' }, h('div', { class: 'grow' }, h('h1', { id: 'page-title', tabindex: '-1' }, t('pd.drv.title')), h('p', { class: 'muted' }, t('pd.drv.lead'))),
      h('div', { class: 'chips-row' }, PD.driver.libraries.map((l) => chip('mut', '🔒', l.key + ' ' + l.version + ' · ' + t('pd.drv.platform'), t('pd.drv.platform_help'))), chip('sim', '◈', t('pd.drv.synthetic'), t('pd.drv.synthetic_help')))),
    h('div', { class: 'note info', role: 'note' }, h('strong', null, t('pd.drv.noraw_title') + ' '), t('pd.drv.noraw_body'), ' ', reasonBtn(t('pd.drv.send_raw'), t('pd.drv.send_raw_why'), 'sm')),
    h('div', { class: 'drv-grid' }, h('section', { class: 'drv-list', 'aria-label': t('pd.drv.ops') }, opList()), h('section', { class: 'drv-edit', id: 'drv-edit', 'aria-label': t('pd.drv.editor') }, op ? opEditor(op) : emptyState('pd.drv.none_title', 'pd.drv.none_body')), h('section', { class: 'drv-test', 'aria-label': t('pd.drv.test') }, op ? opTester(op) : null)));
  if (op) paintDrvFindings();
}
function opList() {
  const box = h('div', null, h('div', { class: 'row-wrap' }, h('h2', { class: 'grow' }, t('pd.drv.ops')),
    dcan() ? btn('+ ' + t('pd.drv.add_op'), addOp, 'sm') : reasonBtn('+ ' + t('pd.drv.add_op'), t('pd.drv.need_author'), 'sm')));
  const ul = h('ul', { class: 'oplist', role: 'listbox', 'aria-label': t('pd.drv.ops') });
  PD.driver.ops.forEach((o) => { const bad = validateOp(o, PD.driver).some((f) => f.sev === 'error');
    ul.append(h('li', { role: 'option', 'aria-selected': String(o.name === PD.drvSel), tabindex: o.name === PD.drvSel ? '0' : '-1', class: o.name === PD.drvSel ? 'sel' : '', 'data-op': o.name, onclick: () => { PD.drvSel = o.name; PD.drvTest = {}; renderDriverWorkspace(); },
      onkeydown: (e) => { const items = [...ul.children]; const i = items.indexOf(e.currentTarget); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const nx = items[i + (e.key === 'ArrowDown' ? 1 : -1)]; if (nx) { PD.drvSel = nx.dataset.op; renderDriverWorkspace(); const el = document.querySelector('.oplist [data-op="' + PD.drvSel + '"]'); el && el.focus(); } } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } } },
      ltr(o.name, 'mono'), h('span', { class: 'spacer' }), o.origin !== 'local' ? chip('mut sm', '🔒', t('pd.drv.platform')) : null, hzChip(o.hazard), o.verification === 'unverified_against_manual' ? chip('warn sm', '⚠', t('pd.ver.short.unverified_against_manual')) : null, bad ? chip('err sm', '✖', t('sev.error')) : null)); });
  box.append(ul, h('p', { class: 'help' }, t('pd.drv.list_help')));
  return box;
}
function addOp() {
  let n = 1; while (PD.driver.ops.some((o) => o.name === 'new_operation_' + n)) n++;
  const op = { name: 'new_operation_' + n, kind: 'write', template: 'SYNT:NEW', params: [], hazard: 'H1', verification: 'unverified_against_manual', origin: 'local', response: { parser: 'none' }, timeout: '2', retry: 0, source_ref: '', pre: [], eff: [], safe: false };
  PD.driver.ops.push(op); PD.drvSel = op.name; say(t('pd.msg.op_added')); drvChanged(true);
}
function copyOp(op) { let n = op.name + '_local', i = 1; while (PD.driver.ops.some((o) => o.name === n)) n = op.name + '_local' + ++i; const c = cloneJ(op); c.name = n; c.origin = 'local'; c.copied_from = op.origin + ':' + op.name; c.verification = 'unverified_against_manual'; PD.driver.ops.push(c); PD.drvSel = n; toast(t('pd.msg.op_copied')); drvChanged(true); }

/* ---- operation editor ---- */
const row = (...kids) => h('div', { class: 'row-wrap' }, ...kids);
function fld(label, id, control, help, ptr) { return h('div', { class: 'field', 'data-field': ptr || '' }, h('label', { class: 'lbl', for: id }, label), control, help ? h('div', { class: 'help' }, help) : null, h('div', { class: 'field-msgs', 'data-msgs': ptr || '' })); }
function opEditor(op) {
  const ro = !opEditable(op); const set = (k, v, s) => { op[k] = v; drvChanged(!!s); }; const box = h('div', null);
  box.append(h('div', { class: 'row-wrap' }, h('h2', { class: 'grow' }, ltr(op.name, 'mono')), h('span', { id: 'drv-sum' }, ...drvSummary(op)), op.origin !== 'local' && dcan() ? btn(t('pd.drv.copy_local'), () => copyOp(op), 'sm') : null));
  if (ro) box.append(banner(op.origin !== 'local' ? 'info' : 'warn', op.origin !== 'local' ? t('pd.drv.ro_platform') : !dcan() ? t('pd.drv.ro_persona') : t('pd.drv.ro_hazard')));
  if (op.copied_from) box.append(h('p', { class: 'help' }, t('pd.drv.lineage'), ' ', ltr(op.copied_from, 'mono')));
  const tabs = ['def', 'params', 'state', 'resp', 'sim'];
  box.append(h('div', { class: 'tabs small', role: 'tablist' }, tabs.map((tb) => h('button', { type: 'button', role: 'tab', class: 'tab' + (PD.drvTab === tb || (!PD.drvTab && tb === 'def') ? ' on' : ''), 'aria-selected': String((PD.drvTab || 'def') === tb), onclick: () => { PD.drvTab = tb; renderDriverWorkspace(); } }, t('pd.drv.tab.' + tb)))));
  const tb = PD.drvTab || 'def';
  if (tb === 'def') box.append(defTab(op, ro, set)); if (tb === 'params') box.append(paramsTab(op, ro)); if (tb === 'state') box.append(stateTab(op, ro)); if (tb === 'resp') box.append(respTab(op, ro, set)); if (tb === 'sim') box.append(simTab(op));
  return box;
}
function defTab(op, ro, set) {
  const d = (x) => ro ? { disabled: true } : x;
  const hzOpts = ['H0', 'H1', 'H2', 'H3', 'H4'].map((hz) => { const blocked = hz === 'H3' || hz === 'H4' || (hz === 'H2' && !pcan('driver.author.hazardous')); return h('option', { value: hz, selected: hz === op.hazard ? true : null, disabled: blocked && hz !== op.hazard ? true : null }, hz + ' — ' + t(HAZ_DESC[hz]) + (hz === 'H3' || hz === 'H4' ? ' · ' + t('pd.drv.hz_reserved') : blocked ? ' · ' + t('pd.drv.hz_needs_role') : '')); });
  return h('div', null,
    fld(t('pd.drv.f.name'), 'o-name', h('input', { id: 'o-name', class: 'input mono', dir: 'ltr', 'data-ptr': '/name', value: op.name, ...d({ oninput: (e) => { op.name = e.target.value; PD.drvSel = op.name; drvChanged(false); } }) }), t('pd.drv.h.name'), '/name'),
    fld(t('pd.drv.f.kind'), 'o-kind', h('select', { id: 'o-kind', class: 'input', ...d({ onchange: (e) => set('kind', e.target.value, true) }) }, ['query', 'write'].map((k) => h('option', { value: k, selected: op.kind === k ? true : null }, t('pd.drv.kind.' + k)))), t('pd.drv.h.kind')),
    h('div', { class: 'field', 'data-field': '/template' }, h('label', { class: 'lbl', for: 'o-tpl' }, t('pd.drv.f.template')), h('div', { class: 'tpl-row' }, h('input', { id: 'o-tpl', class: 'input mono', dir: 'ltr', spellcheck: 'false', autocomplete: 'off', 'data-ptr': '/template', value: op.template, ...d({ oninput: (e) => { op.template = e.target.value; drvChanged(false); const pv = document.getElementById('tpl-prev'); if (pv) pv.replaceChildren(...tplPreview(op)); } }) })),
      h('div', { class: 'tpl-tokens', 'aria-label': t('pd.drv.tokens') }, h('span', { class: 'muted sm' }, t('pd.drv.insert_param') + ' '), op.params.map((p) => btn('{' + p.name + '}', () => { op.template = (op.template + ' {' + p.name + '}').trim(); drvChanged(true); }, 'ghost sm', { disabled: ro ? true : null, 'aria-label': t('pd.drv.insert') + ' ' + p.name }))),
      h('div', { class: 'help' }, t('pd.drv.h.template')), h('div', { id: 'tpl-prev', class: 'tpl-prev' }, ...tplPreview(op)), h('div', { class: 'field-msgs', 'data-msgs': '/template' })),
    fld(t('pd.drv.f.hazard'), 'o-haz', h('select', { id: 'o-haz', class: 'input', 'data-ptr': '/hazard', ...d({ onchange: (e) => { op.hazard = e.target.value; if (HRANK[op.hazard] >= 2) op.retry = 0; drvChanged(true); } }) }, hzOpts), t('pd.drv.h.hazard'), '/hazard'),
    h('p', { class: 'help' }, t('pd.drv.hz_role_note')),
    row(fld(t('pd.drv.f.timeout'), 'o-to', h('input', { id: 'o-to', class: 'input mono qty-val', dir: 'ltr', inputmode: 'decimal', 'data-ptr': '/timeout', value: op.timeout, ...d({ oninput: (e) => set('timeout', e.target.value, false) }) }), t('pd.drv.h.timeout'), '/timeout'),
      fld(t('pd.drv.f.retry'), 'o-rt', h('input', { id: 'o-rt', class: 'input mono qty-val', dir: 'ltr', inputmode: 'numeric', 'data-ptr': '/retry', value: String(op.retry), ...(ro || HRANK[op.hazard] >= 2 ? { disabled: true } : { oninput: (e) => set('retry', /^\d+$/.test(e.target.value) ? parseInt(e.target.value, 10) : e.target.value, false) }) }), HRANK[op.hazard] >= 2 ? t('pd.drv.h.retry_haz') : t('pd.drv.h.retry'), '/retry')),
    fld(t('pd.drv.f.verification'), 'o-ver', h('select', { id: 'o-ver', class: 'input', 'data-ptr': '/verification', ...d({ onchange: (e) => set('verification', e.target.value, true) }) }, ['unverified_against_manual', 'standard', 'verified_by_reviewer'].map((v) => h('option', { value: v, selected: op.verification === v ? true : null, disabled: v === 'verified_by_reviewer' && !pcan('approve') ? true : null }, t('pd.ver.' + v) + (v === 'verified_by_reviewer' && !pcan('approve') ? ' · ' + t('pd.drv.ver_needs_reviewer') : '')))), t('pd.drv.h.verification'), '/verification'),
    fld(t('pd.drv.f.source'), 'o-src', h('input', { id: 'o-src', class: 'input', value: op.source_ref || '', placeholder: t('pd.drv.source_ph'), ...d({ oninput: (e) => { op.source_ref = e.target.value; } }) }), t('pd.drv.h.source')));
}
function sampleFor(p) { if (p.type === 'quantity') return { k: 'q', v: Dec.parse('1'), u: UNITS[p.dimension] ? UNITS[p.dimension][0] : '' }; if (p.type === 'enum') return { k: 'str', v: Object.keys(p.tokens || {})[0] || 'x' }; if (p.type === 'boolean') return { k: 'bool', v: true }; return { k: 'num', v: Dec.parse('1') }; }
function previewWire(op) { try { const args = {}; op.params.forEach((p) => (args[p.name] = sampleFor(p))); return formatWire(op, args); } catch (e) { return null; } }
function tplPreview(op) {
  const parts = []; String(op.template).split(/(\{[^{}]*\})/).forEach((s) => { if (/^\{[^{}]*\}$/.test(s)) { const nm = s.slice(1, -1); const ok = op.params.some((p) => p.name === nm); parts.push(h('span', { class: 'tok ' + (ok ? 'ok' : 'bad') }, s)); } else if (s) parts.push(h('span', { class: 'lit' }, s)); });
  const w = previewWire(op); return [h('span', { class: 'muted sm' }, t('pd.drv.tokens') + ': '), ...parts, h('div', { class: 'muted sm' }, t('pd.drv.sample_wire') + ' ', w ? ltr(w, 'mono') : t('pd.drv.sample_none'))];
}
function paramsTab(op, ro) {
  const box = h('div', null, h('p', { class: 'help' }, t('pd.drv.h.params')));
  op.params.forEach((p, i) => {
    const pp = '/params/' + i; const d = (x) => (ro ? { disabled: true } : x);
    const item = h('fieldset', { class: 'rec', 'data-field': pp }, h('legend', null, ltr(p.name, 'mono')),
      row(fld(t('pd.drv.f.pname'), 'p-n' + i, h('input', { id: 'p-n' + i, class: 'input mono', dir: 'ltr', value: p.name, ...d({ oninput: (e) => { const old = p.name; p.name = e.target.value; op.template = op.template.split('{' + old + '}').join('{' + p.name + '}'); drvChanged(false); } }) })),
        fld(t('pd.drv.f.ptype'), 'p-t' + i, h('select', { id: 'p-t' + i, class: 'input', ...d({ onchange: (e) => { p.type = e.target.value; if (p.type === 'quantity') { p.dimension = p.dimension || 'SU'; delete p.tokens; } if (p.type === 'enum') { p.tokens = p.tokens || { value_a: 'A' }; delete p.dimension; } if (p.type !== 'quantity') { delete p.limit_target; delete p.bounds; } drvChanged(true); } }) }, DRV_TYPES.map((x) => h('option', { value: x, selected: p.type === x ? true : null }, t('pd.drv.ptype.' + x)))))),
      p.type === 'quantity' ? row(fld(t('pd.drv.f.dim'), 'p-d' + i, h('select', { id: 'p-d' + i, class: 'input', ...d({ onchange: (e) => { p.dimension = e.target.value; drvChanged(true); } }) }, Object.keys(UNITS).filter((k) => ['SU', 'T'].includes(k)).map((k) => h('option', { value: k, selected: p.dimension === k ? true : null }, DIM_LABEL(k) + ' (' + UNITS[k].join(', ') + ')'))), t('pd.drv.h.dim')),
        fld(t('pd.drv.f.bounds'), 'p-b' + i, p.bounds && p.bounds.$input ? h('div', { class: 'input-req' }, inputBadge(p.bounds.$input), h('span', { class: 'muted sm' }, MI_REGISTER[p.bounds.$input] || '')) : h('span', { class: 'muted' }, t('pd.drv.no_bounds')), t('pd.drv.h.bounds'))) : null,
      p.type === 'quantity' && p.limit_target ? h('div', { class: 'note hazard' }, h('strong', null, '⛨ ' + t('pd.drv.limit_target') + ' '), ltr(p.limit_target, 'mono'), ' — ', t('pd.drv.limit_target_help')) : null,
      p.type === 'enum' ? tokenEditor(p, ro, i) : null,
      ro ? null : btn('✕ ' + t('a.remove'), () => { op.params.splice(i, 1); drvChanged(true); }, 'ghost sm danger'));
    box.append(item);
  });
  if (!op.params.length) box.append(h('p', { class: 'muted' }, t('pd.drv.no_params')));
  if (!ro) box.append(btn('+ ' + t('pd.drv.add_param'), () => { let n = 1; while (op.params.some((p) => p.name === 'arg_' + n)) n++; op.params.push({ name: 'arg_' + n, type: 'quantity', dimension: 'SU' }); drvChanged(true); }, 'sm'));
  box.append(h('div', { class: 'field-msgs', 'data-msgs': '/params' }));
  return box;
}
function tokenEditor(p, ro, pi) {
  const box = h('div', { class: 'tok-ed' }, h('div', { class: 'lbl sm' }, t('pd.drv.f.tokens')), h('div', { class: 'help' }, t('pd.drv.h.tokens')));
  Object.entries(p.tokens || {}).forEach(([k, v]) => box.append(h('div', { class: 'list-row' }, h('input', { class: 'input mono sm', dir: 'ltr', 'aria-label': t('pd.drv.f.choice') + ' ' + k, value: k, disabled: ro ? true : null, onchange: (e) => { const nt = {}; Object.entries(p.tokens).forEach(([a, b]) => (nt[a === k ? e.target.value : a] = b)); p.tokens = nt; drvChanged(true); } }), h('span', { 'aria-hidden': 'true' }, '→'), h('input', { class: 'input mono sm', dir: 'ltr', 'aria-label': t('pd.drv.f.wire_token') + ' ' + k, value: v, disabled: ro ? true : null, oninput: (e) => { p.tokens[k] = e.target.value; drvChanged(false); } }), ro ? null : iconBtn('✕', t('a.remove'), () => { delete p.tokens[k]; drvChanged(true); }))));
  if (!ro) box.append(btn('+ ' + t('pd.drv.add_choice'), () => { let n = 1; while (('choice_' + n) in p.tokens) n++; p.tokens['choice_' + n] = 'X'; drvChanged(true); }, 'ghost sm'));
  return box;
}
function stateTab(op, ro) {
  const box = h('div', null, h('p', { class: 'help' }, t('pd.drv.h.state')));
  const sec = (key, arr, lbl, field) => {
    box.append(h('h3', null, t(lbl)));
    arr.forEach((c, i) => { const st = PD.driver.state.find((s) => s.id === c.state); const vals = st ? (st.values || ['true', 'false']) : [];
      box.append(h('div', { class: 'list-row', 'data-field': '/' + key + '/' + i }, h('select', { class: 'input sm', 'aria-label': t('pd.drv.f.state'), disabled: ro ? true : null, onchange: (e) => { c.state = e.target.value; const ns = PD.driver.state.find((s) => s.id === c.state); c[field] = (ns.values || ['true', 'false'])[0]; drvChanged(true); } }, PD.driver.state.map((s) => h('option', { value: s.id, selected: s.id === c.state ? true : null }, s.id))), h('span', { 'aria-hidden': 'true' }, field === 'equals' ? '=' : '←'),
        h('select', { class: 'input sm', 'aria-label': t('pd.drv.f.value'), disabled: ro ? true : null, onchange: (e) => { c[field] = e.target.value; drvChanged(false); } }, vals.map((v) => h('option', { value: v, selected: v === c[field] ? true : null }, v))), ro ? null : iconBtn('✕', t('a.remove'), () => { arr.splice(i, 1); drvChanged(true); }), h('div', { class: 'field-msgs', 'data-msgs': '/' + key + '/' + i }))); });
    if (!arr.length) box.append(h('p', { class: 'muted sm' }, t('pd.drv.none_listed')));
    if (!ro) box.append(btn('+ ' + t('a.add'), () => { const s0 = PD.driver.state[0]; arr.push({ state: s0.id, [field]: (s0.values || ['true', 'false'])[0] }); drvChanged(true); }, 'ghost sm'));
  };
  sec('pre', op.pre, 'pd.drv.pre', 'equals'); sec('eff', op.eff, 'pd.drv.eff', 'set');
  box.append(h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: op.safe ? true : null, disabled: ro ? true : null, onchange: (e) => { op.safe = e.target.checked; drvChanged(true); } }), ' ', t('pd.drv.safe_op')), h('div', { class: 'help' }, t('pd.drv.h.safe_op')));
  return box;
}
function respTab(op, ro, set) {
  const parser = (op.response && op.response.parser) || 'none'; const box = h('div', null);
  if (op.kind !== 'query') { box.append(h('p', { class: 'muted' }, t('pd.drv.resp_write'))); return box; }
  box.append(fld(t('pd.drv.f.parser'), 'r-p', h('select', { id: 'r-p', class: 'input', 'data-ptr': '/response', disabled: ro ? true : null, onchange: (e) => { op.response = { parser: e.target.value, ...(e.target.value === 'number_with_unit' ? { unit: UNITS.SU[0] } : {}) }; drvChanged(true); } }, DRV_PARSERS.map((x) => h('option', { value: x, selected: x === parser ? true : null }, t('pd.drv.parser.' + x)))), t('pd.drv.h.parser'), '/response'));
  if (parser === 'number_with_unit') box.append(fld(t('pd.drv.f.unit'), 'r-u', h('select', { id: 'r-u', class: 'input', disabled: ro ? true : null, onchange: (e) => { op.response.unit = e.target.value; drvChanged(true); } }, UNITS.SU.map((u) => h('option', { value: u, selected: u === op.response.unit ? true : null }, u)))));
  const inp = h('input', { id: 'r-s', class: 'input mono', dir: 'ltr', value: PD.drvTest.sample || '', placeholder: '0.004 su', oninput: (e) => { PD.drvTest.sample = e.target.value; const out = document.getElementById('r-out'); out.replaceChildren(...parseSample(op)); } });
  box.append(fld(t('pd.drv.f.sample'), 'r-s', inp, t('pd.drv.h.sample')), h('div', { id: 'r-out', role: 'status', 'aria-live': 'polite' }, ...parseSample(op)));
  return box;
}
function parseSample(op) {
  const raw = PD.drvTest.sample; if (raw === undefined || raw === '') return [h('span', { class: 'muted sm' }, t('pd.drv.sample_empty'))]; const pr = (op.response || {}).parser;
  if (pr === 'string') return [chip('ok', '✔', t('pd.drv.parsed')), ' ', ltr(raw.trim(), 'mono')];
  if (pr === 'number_with_unit') { const m = /^(-?\d+(\.\d+)?)\s*([A-Za-z]+)$/.exec(raw); return m && m[3] === op.response.unit ? [chip('ok', '✔', t('pd.drv.parsed')), ' ', ltr(m[1] + ' ' + m[3], 'mono'), h('span', { class: 'muted sm' }, ' ' + t('pd.drv.decimal_note'))] : [chip('err', '✖', 'E_PARSE'), ' ', t('pd.drv.parse_fail', { unit: op.response.unit })]; }
  return [h('span', { class: 'muted sm' }, t('pd.drv.no_parser'))];
}
function simTab(op) {
  const box = h('div', null, h('p', { class: 'help' }, t('pd.drv.h.sim')));
  const rows = Object.entries(SIM_PROFILE.scenarios).map(([k, v]) => [k, v]);
  if (op.kind === 'query' && op.name === 'read_value') box.append(h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['pd.drv.sc', 'pd.drv.sc_offset', 'pd.drv.sc_noise'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, rows.map(([k, v]) => h('tr', null, h('td', null, t('pd.sc.' + k)), h('td', { class: 'mono' }, ltr(v.offset + ' su')), h('td', { class: 'mono' }, ltr('±' + v.noise + ' usu')))))));
  else box.append(h('p', { class: 'muted' }, op.kind === 'query' ? t('pd.drv.sim_identity') : t('pd.drv.sim_write')));
  box.append(h('h3', null, t('pd.drv.sim_faults')), h('ul', { class: 'plain' }, ['timeout', 'garbled', 'error_queue', 'disconnect'].map((k) => h('li', null, chip('sim sm', '◈', t('pd.fault.' + k)), ' ', t('pd.fault.help.' + k)))), h('p', { class: 'help' }, t('pd.drv.sim_note')));
  return box;
}

/* ---- driver test panel: named operation + typed arguments only, through the Broker path ---- */
function opTester(op) {
  if (!PD.drvBox) PD.drvBox = createSandbox(PD.driver, PD.profile.status === 'withdrawn' ? null : PD.profile);
  const box = h('div', null, h('h2', null, t('pd.drv.test')), banner('sim', t('pd.drv.test_banner')));
  const args = PD.drvTest.args || (PD.drvTest.args = {});
  op.params.forEach((p) => { const id = 't-' + p.name; box.append(fld(p.name + ' (' + (p.type === 'quantity' ? 'quantity<' + p.dimension + '>' : p.type) + ')', id, h('input', { id, class: 'input mono', dir: 'ltr', value: args[p.name] || '', placeholder: p.type === 'enum' ? '"' + Object.keys(p.tokens || {})[0] + '"' : p.type === 'quantity' ? '1 ' + (UNITS[p.dimension] || [''])[0] : '', oninput: (e) => (args[p.name] = e.target.value) }), p.type === 'enum' ? t('pd.drv.t.enum_hint') : t('pd.drv.t.expr_hint'))); });
  box.append(row(btn(t('pd.drv.t.run'), () => { PD.drvTest.res = testOperation(PD.drvBox, op.name, args); renderDriverWorkspace(); }, 'primary'), btn(t('pd.drv.t.reset'), () => { PD.drvBox = null; PD.drvTest.res = null; renderDriverWorkspace(); }, 'ghost')));
  box.append(h('div', { class: 'kv-list' }, h('div', null, h('span', { class: 'muted' }, t('pd.drv.t.state') + ' '), Object.entries(PD.drvBox.sim.state).map(([k, v]) => h('span', { class: 'chip mut sm' }, ltr(k + '=' + v, 'mono'))))));
  const r = PD.drvTest.res;
  if (r && r.op === op.name) {
    const w = (r.events || []).find((e) => e.kind === 'wire' || e.kind === 'safety.violation'); const wire = (r.events || []).map((e) => e).length ? PD.drvBox.wire[PD.drvBox.wire.length - 1] : null;
    box.append(h('div', { class: 'test-res', role: 'status', 'aria-live': 'polite' }, r.ok ? chip('ok', '✔', t('pd.drv.t.ok')) : chip('err', '✖', r.error.code), ' ', r.error ? h('span', null, r.error.message) : null,
      w && wire ? h('div', null, h('span', { class: 'muted sm' }, (wire.blocked ? t('pd.drv.t.not_sent') : t('pd.drv.t.sent_sim')) + ' '), ltr(wire.wire, 'mono'), wire.raw ? [h('br'), h('span', { class: 'muted sm' }, t('pd.drv.t.reply') + ' '), ltr(wire.raw, 'mono')] : null) : null,
      r.ok && r.parsed ? h('div', null, h('span', { class: 'muted sm' }, t('pd.drv.t.parsed') + ' '), ltr(r.parsed.k === 'q' ? r.parsed.v.toString() + ' ' + r.parsed.u : String(r.parsed.v), 'mono')) : null));
  }
  box.append(h('p', { class: 'help' }, t('pd.drv.t.note')));
  return box;
}
