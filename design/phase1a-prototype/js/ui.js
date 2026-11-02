/* CalOS Phase 1A DESIGN PROTOTYPE — component kit + GENERIC metadata-driven form engine.
   Rule enforced by tests/prototype.test.js: nothing in this file names a configuration kind.
   Fields are produced only from JSON Schema + `x-calos-editor` hints. */
'use strict';

const UI = { locale: 'en', theme: 'light', route: '', toastTimer: null };
const LOCALES = ['en', 'he'];
const ltr = (txt, cls) => h('bdi', { dir: 'ltr', class: 'ltr ' + (cls || '') }, txt);
const hintOf = (s) => (s && s['x-calos-editor']) || {};
function locText(obj) {
  if (!obj || typeof obj !== 'object') return { text: '', fallback: false };
  if (obj[UI.locale]) return { text: obj[UI.locale], fallback: false };
  const alt = obj.en || obj.he || Object.values(obj)[0] || '';
  return { text: alt, fallback: !!alt };
}
function titleOf(item) {
  const c = (item.draft || Store.latest(item) || {}).content || {};
  const props = KINDS[item.kind].schema.properties;
  for (const [k, s] of Object.entries(props)) if (hintOf(s).title) {
    const v = c[k]; if (typeof v === 'string') return { text: v, fallback: false, mono: true };
    const l = locText(v); if (l.text) return l;
  }
  return { text: item.key, fallback: false };
}

/* ---------- small components ---------- */
function chip(cls, glyph, text, title) { return h('span', { class: 'chip ' + cls, title: title || null }, h('span', { 'aria-hidden': 'true', class: 'g' }, glyph), h('span', null, text)); }
const STATUS = { draft: ['mut', '✎'], in_review: ['info', '⧗'], approved: ['ok', '✔'], published: ['ok', '●'], withdrawn: ['err', '⊘'] };
const statusChip = (s) => chip(STATUS[s][0], STATUS[s][1], t('st.' + s));
const PROV = { synthetic_demo: ['sim', '◈'], draft: ['mut', '✎'], verified: ['ok', '✔'], approved: ['ok', '✔'] };
const provChip = (s) => chip(PROV[s][0], PROV[s][1], t('prov.' + s), t('prov.help.' + s));
const inputChip = (mi) => chip('warn', '⚠', t('input_required'), (MI_REGISTER[mi] ? mi + ' — ' + MI_REGISTER[mi] : mi));
function inputBadge(mi) { return h('span', { class: 'chip warn', title: MI_REGISTER[mi] || mi }, h('span', { 'aria-hidden': 'true', class: 'g' }, '⚠'), h('span', null, t('input_required') + ' · '), ltr(mi)); }
const sevChip = (s) => chip({ error: 'err', warning: 'warn', info: 'info' }[s], { error: '✖', warning: '⚠', info: 'ℹ' }[s], t('sev.' + s));
const btn = (label, onclick, cls, attrs) => h('button', { type: 'button', class: 'btn ' + (cls || ''), onclick, ...(attrs || {}) }, label);
const iconBtn = (glyph, label, onclick, attrs) => h('button', { type: 'button', class: 'btn icon', 'aria-label': label, title: label, onclick, ...(attrs || {}) }, h('span', { 'aria-hidden': 'true' }, glyph));
function reasonBtn(label, reasonText, cls) { /* disabled-with-reason pattern: never silently hidden */
  const id = 'r' + Math.random().toString(36).slice(2, 8);
  return h('span', { class: 'reason-wrap' }, h('button', { type: 'button', class: 'btn ' + (cls || ''), 'aria-disabled': 'true', 'aria-describedby': id, onclick: (e) => e.preventDefault() }, label), h('span', { id, class: 'sr-only' }, reasonText), h('span', { class: 'reason-tip', 'aria-hidden': 'true' }, reasonText));
}
function emptyState(titleKey, bodyKey, action) { return h('div', { class: 'state empty', role: 'status' }, h('div', { class: 'state-title' }, t(titleKey)), h('div', { class: 'muted' }, t(bodyKey)), action || null); }
function errorState(code, retry) { return h('div', { class: 'state error', role: 'alert' }, h('div', { class: 'state-title' }, t('state.error_title')), h('div', { class: 'muted' }, t('state.error_body')), h('div', null, ltr(code)), retry ? btn(t('a.retry'), retry) : null); }
const skeleton = (rows) => h('div', { class: 'skeleton', 'aria-busy': 'true', 'aria-label': t('state.loading') }, Array.from({ length: rows || 4 }, () => h('div', { class: 'sk-row' })));

function toast(msg, kind) {
  const box = document.getElementById('toasts');
  const el = h('div', { class: 'toast ' + (kind || ''), role: kind === 'err' ? 'alert' : 'status' }, msg);
  box.append(el); setTimeout(() => el.classList.add('out'), 4200); setTimeout(() => el.remove(), 4800);
}

/* ---------- dialog with focus trap and focus return ---------- */
function openDialog({ title, body, actions, wide, onClose, labelledby }) {
  const prev = document.activeElement;
  const back = h('div', { class: 'backdrop' });
  const tid = 'dlg' + Math.random().toString(36).slice(2, 7);
  const dlg = h('div', { class: 'dialog' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': tid, tabindex: '-1' },
    h('div', { class: 'dlg-head' }, h('h2', { id: tid }, title), iconBtn('✕', t('a.close'), () => close())),
    h('div', { class: 'dlg-body' }, body), h('div', { class: 'dlg-foot' }, actions || null));
  back.append(dlg); document.body.append(back);
  document.getElementById('app').setAttribute('inert', '');
  function close(v) { back.remove(); document.getElementById('app').removeAttribute('inert'); if (prev && prev.focus) prev.focus(); if (onClose) onClose(v); }
  back.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'Tab') { const f = [...dlg.querySelectorAll('button:not([disabled]),input:not([disabled]),select,textarea,[href],[tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  setTimeout(() => (dlg.querySelector('[autofocus],input,select,textarea') || dlg).focus(), 0);
  return { close, dlg };
}

/* Governed confirmation: digest, effect, reason, SIMULATED step-up. Real enforcement is server-side (Phase 1B). */
function governedConfirm({ title, effect, digest, reasonRequired, confirmLabel, danger, onConfirm }) {
  const reason = h('textarea', { id: 'gc-reason', rows: '2', class: 'input', 'aria-required': reasonRequired ? 'true' : null, autofocus: true });
  const err = h('div', { class: 'field-msg err', role: 'alert' });
  const dlg = openDialog({
    title,
    body: [h('p', null, effect),
      digest ? h('p', { class: 'kv' }, h('span', { class: 'muted' }, t('digest')), ltr(shortDigest(digest) + '  ' + digest.slice(7, 23)), btn(t('a.copy'), () => { navigator.clipboard && navigator.clipboard.writeText(digest).catch(() => {}); toast(t('copied')); }, 'ghost sm')) : null,
      h('label', { for: 'gc-reason', class: 'lbl' }, t('reason') + (reasonRequired ? ' (' + t('required') + ')' : '')), reason, err,
      h('p', { class: 'note sim' }, h('strong', null, t('sim.stepup_title') + ' '), t('sim.stepup_body'))],
    actions: [btn(t('a.cancel'), () => dlg.close(), 'ghost'), btn(confirmLabel, () => { if (reasonRequired && !reason.value.trim()) { err.textContent = t('err.reason_required'); reason.setAttribute('aria-invalid', 'true'); reason.focus(); return; } dlg.close(); onConfirm(reason.value.trim()); }, danger ? 'danger' : 'primary')],
  });
}

/* ---------- data grid: sortable, filterable, keyboard (arrow keys / Enter), card list on small screens ---------- */
function dataGrid({ id, columns, rows, onOpen, label }) {
  let sortKey = null, dir = 1, q = '';
  const wrap = h('div', { class: 'grid-wrap' });
  const search = h('input', { class: 'input sm', type: 'search', 'aria-label': t('a.filter'), placeholder: t('a.filter') + '…', oninput: (e) => { q = e.target.value.toLowerCase(); paint(); } });
  const body = h('div');
  function paint() {
    let data = rows.filter((r) => !q || columns.some((c) => String(c.text ? c.text(r) : '').toLowerCase().includes(q)));
    if (sortKey) { const c = columns.find((x) => x.key === sortKey); data = data.slice().sort((a, b) => String(c.text(a)).localeCompare(String(c.text(b)), UI.locale) * dir); }
    body.replaceChildren();
    if (!rows.length) { body.append(emptyState('state.empty_title', 'state.empty_list')); return; }
    if (!data.length) { body.append(emptyState('state.nomatch_title', 'state.nomatch_body', btn(t('a.clear_filter'), () => { search.value = ''; q = ''; paint(); }))); return; }
    const tbl = h('table', { class: 'tbl', 'aria-label': label || id, 'aria-rowcount': data.length + 1 },
      h('thead', null, h('tr', null, columns.map((c) => h('th', { scope: 'col', 'aria-sort': sortKey === c.key ? (dir > 0 ? 'ascending' : 'descending') : 'none', class: c.cls || '' }, c.sortable === false ? t(c.label) : h('button', { class: 'th-btn', type: 'button', onclick: () => { if (sortKey === c.key) dir = -dir; else { sortKey = c.key; dir = 1; } paint(); } }, t(c.label), h('span', { 'aria-hidden': 'true', class: 'sort' }, sortKey === c.key ? (dir > 0 ? '▲' : '▼') : '↕')))))),
      h('tbody', null, data.map((r, i) => h('tr', { tabindex: i === 0 ? '0' : '-1', class: 'row', onclick: () => onOpen && onOpen(r), onkeydown: (e) => {
        if (e.key === 'Enter' && onOpen) { onOpen(r); }
        const sib = e.key === 'ArrowDown' ? e.currentTarget.nextElementSibling : e.key === 'ArrowUp' ? e.currentTarget.previousElementSibling : null;
        if (sib) { e.preventDefault(); e.currentTarget.tabIndex = -1; sib.tabIndex = 0; sib.focus(); }
      } }, columns.map((c) => h('td', { 'data-label': t(c.label), class: c.cls || '' }, c.render ? c.render(r) : c.text(r)))))));
    body.append(tbl);
  }
  wrap.append(h('div', { class: 'grid-tools' }, search, h('span', { class: 'muted', role: 'status' }, t('n_rows', { n: rows.length }))), body); paint();
  return wrap;
}

/* ==================================================================================
   GENERIC FORM ENGINE
   renderForm({ schema, content, ctx })  ctx = { readOnly, only?, onChange(ptr, value, structural), policy, items(kind) , lookup }
   ================================================================================== */
const DIM_LABEL = (d) => t('dim.' + d);
let _fid = 0;
function wrapField({ ptr, hint, required, control, extra, labelOverride }) {
  const id = 'f' + (++_fid);
  const lab = h('label', { class: 'lbl', for: id }, t(labelOverride || hint.label || 'f.value'), required ? h('span', { class: 'req', title: t('required') }, ' *') : h('span', { class: 'opt' }, ' (' + t('optional') + ')'));
  const help = hint.help ? h('div', { class: 'help', id: id + '-h' }, t(hint.help)) : null;
  const msgs = h('div', { class: 'field-msgs', id: id + '-m', 'data-msgs': ptr });
  const el = h('div', { class: 'field', 'data-field': ptr }, lab, help, control(id, id + '-h' + ' ' + id + '-m'), msgs, extra || null);
  return el;
}
const ctlAttrs = (id, desc, ptr, ctx) => ({ id, 'aria-describedby': desc, 'data-ptr': ptr, disabled: ctx.readOnly ? true : null });

function widgetFor(schema) {
  const hn = hintOf(schema);
  if (hn.widget) return hn.widget;
  if (schema.type === 'boolean') return 'bool'; if (schema.enum) return 'enum'; return 'text';
}

function renderNode(schema, value, ptr, ctx, parentValue, required) {
  const hint = hintOf(schema), w = widgetFor(schema);
  const emit = (v, structural) => ctx.onChange(ptr, v, !!structural);
  switch (w) {
    case 'text': case 'decimal-string': return wrapField({ ptr, hint, required, control: (id, d) => h('input', { ...ctlAttrs(id, d, ptr, ctx), class: 'input' + (hint.mono ? ' mono' : ''), type: 'text', dir: hint.mono ? 'ltr' : null, value: value || '', maxlength: schema.maxLength || null, inputmode: w === 'decimal-string' ? 'decimal' : null, oninput: (e) => emit(e.target.value === '' ? undefined : e.target.value) }) });
    case 'localized': return renderLocalized(schema, value, ptr, ctx, hint, required);
    case 'enum': return wrapField({ ptr, hint, required, control: (id, d) => h('select', { ...ctlAttrs(id, d, ptr, ctx), class: 'input', onchange: (e) => emit(e.target.value || undefined, true) }, h('option', { value: '' }, t('choose')), schema.enum.map((o) => h('option', { value: o, selected: value === o ? true : null }, hint.enum_prefix ? t(hint.enum_prefix + o) : o))) });
    case 'enum-multi': return renderEnumMulti(schema, value || [], ptr, ctx, hint, required);
    case 'bool': return wrapField({ ptr, hint, required, control: (id, d) => h('input', { ...ctlAttrs(id, d, ptr, ctx), type: 'checkbox', checked: value ? true : null, onchange: (e) => emit(e.target.checked) }) });
    case 'reference': return renderReference(schema, value, ptr, ctx, hint, required, parentValue);
    case 'reference-list': return renderRefList(schema, value || [], ptr, ctx, hint);
    case 'string-list': return renderStringList(schema, value || [], ptr, ctx, hint);
    case 'record-list': return renderRecordList(schema, value || [], ptr, ctx, hint);
    case 'record': return renderRecord(schema, value || {}, ptr, ctx, hint);
    case 'quantity-or-input': return renderQtyOrInput(schema, value, ptr, ctx, hint, parentValue, required);
    case 'interval-or-input': return renderIntervalOrInput(schema, value, ptr, ctx, hint, parentValue, required);
    case 'derived': return renderDerived(ptr, ctx, hint);
    default: return h('div', { class: 'field-msg err', role: 'alert' }, t('err.unknown_widget', { w })); /* unknown widget => visible placeholder, never silent */
  }
}

function renderProps(schema, value, ptr, ctx, only) {
  const props = Object.entries(schema.properties || {}).filter(([k]) => !only || only.includes(k));
  props.sort((a, b) => (hintOf(a[1]).order || 99) - (hintOf(b[1]).order || 99));
  const groups = new Map();
  props.forEach(([k, s]) => { const g = hintOf(s).group || ''; if (!groups.has(g)) groups.set(g, []); groups.get(g).push([k, s]); });
  const out = [];
  groups.forEach((list, g) => {
    const sec = h('section', { class: 'fsec', 'aria-labelledby': g ? 'sec-' + g : null }, g ? h('h2', { id: 'sec-' + g, class: 'fsec-h', tabindex: '-1' }, t(g)) : null);
    list.forEach(([k, s]) => sec.append(renderNode(s, (value || {})[k], ptr + '/' + esc(k), ctx, value, (schema.required || []).includes(k))));
    out.push(sec);
  });
  return out;
}
function renderForm({ schema, content, ctx, only }) {
  return h('form', { class: 'form', novalidate: true, onsubmit: (e) => e.preventDefault() }, renderProps(schema, content, '', ctx, only));
}

/* ----- widgets ----- */
function renderLocalized(schema, value, ptr, ctx, hint, required) {
  const v = value || {};
  const reqLoc = ctx.policy.required_locales;
  return wrapField({ ptr, hint, required, control: (id, d) => h('div', { class: 'loc-group', role: 'group', 'aria-labelledby': id + '-l' }, LOCALES.map((loc) => {
    const needed = reqLoc.includes(loc) && hint.localized_required !== false;
    const inp = h(hint.multiline ? 'textarea' : 'input', { ...ctlAttrs(loc === 'en' ? id : id + '-' + loc, d, ptr + '/' + loc, ctx), class: 'input', rows: hint.multiline ? '2' : null, type: hint.multiline ? null : 'text', lang: loc, dir: loc === 'he' ? 'rtl' : 'ltr', value: v[loc] || '', oninput: (e) => { const nv = { ...(ctx.valueAt(ptr) || {}) }; if (e.target.value) nv[loc] = e.target.value; else delete nv[loc]; ctx.onChange(ptr, nv, false); } });
    if (hint.multiline) inp.value = v[loc] || '';
    return h('div', { class: 'loc-row' }, h('span', { class: 'loc-tag', 'aria-hidden': 'true' }, loc.toUpperCase()), h('label', { class: 'sr-only', for: inp.id }, t(hint.label) + ' — ' + t('loc.' + loc)), inp, needed ? h('span', { class: 'chip mut sm', title: t('loc.required_by_policy') }, t('required')) : (v[loc] ? null : h('span', { class: 'muted sm' }, t('optional'))));
  })) });
}
function renderEnumMulti(schema, value, ptr, ctx, hint, required) {
  const opts = schema.items.enum, dis = hint.disabled_options || {};
  return wrapField({ ptr, hint, required, control: (id, d) => h('div', { id, class: 'chips-select', role: 'group', 'aria-describedby': d, 'data-ptr': ptr }, opts.map((o) => {
    const on = value.includes(o), isDis = !!dis[o] || ctx.readOnly; const cid = id + '-' + o.replace(/\W/g, '_');
    return h('label', { class: 'opt-chip' + (on ? ' on' : '') + (dis[o] ? ' dis' : ''), for: cid, title: dis[o] ? t(dis[o]) : null },
      h('input', { type: 'checkbox', id: cid, checked: on ? true : null, disabled: isDis ? true : null, 'aria-describedby': dis[o] ? cid + '-r' : null, onchange: (e) => { const cur = (ctx.valueAt(ptr) || []).slice(); const i = cur.indexOf(o); if (e.target.checked && i < 0) cur.push(o); if (!e.target.checked && i >= 0) cur.splice(i, 1); ctx.onChange(ptr, cur, true); } }),
      h('span', null, hint.enum_prefix ? t(hint.enum_prefix + o) : ltr(o)), dis[o] ? h('span', { id: cid + '-r', class: 'sr-only' }, t(dis[o])) : null);
  })), extra: hint.vocabulary ? h('div', { class: 'help' }, t('help.vocab_note')) : (Object.keys(dis).length ? h('div', { class: 'help' }, Object.keys(dis).map((k) => h('div', null, (hint.enum_prefix ? t(hint.enum_prefix + k) : k) + ': ' + t(dis[k])))) : null) });
}
function refOptions(kind, ctx) { return ctx.items(kind).filter((i) => !i.withdrawn); }
function renderReference(schema, value, ptr, ctx, hint, required, parent) {
  let list = refOptions(hint.ref_kind, ctx);
  if (hint.filter_by && parent && parent[hint.filter_by] && parent[hint.filter_by].$ref) { const m = parent[hint.filter_by].$ref.key; list = list.filter((i) => { const c = (i.draft || Store.latest(i) || {}).content; return c && c[hint.filter_by] && c[hint.filter_by].$ref.key === m; }); }
  const cur = value && value.$ref ? value.$ref.key : '';
  return wrapField({ ptr, hint, required, control: (id, d) => h('div', { class: 'ref-row' }, h('select', { ...ctlAttrs(id, d, ptr, ctx), class: 'input', onchange: (e) => ctx.onChange(ptr, e.target.value ? { $ref: { kind: hint.ref_kind, key: e.target.value } } : undefined, true) },
    h('option', { value: '' }, hint.optional ? t('none') : t('choose')), list.map((i) => { const ti = titleOf(i); return h('option', { value: i.key, selected: cur === i.key ? true : null }, ti.text + '  ·  ' + t('st.' + Store.status(i))); })),
    cur ? h('a', { class: 'link', href: '#/item/' + hint.ref_kind + '/' + cur }, t('a.open')) : null,
    !ctx.readOnly && can(persona(), 'draft') ? btn('+ ' + t('a.new'), () => createDialog(hint.ref_kind, (k) => ctx.onChange(ptr, { $ref: { kind: hint.ref_kind, key: k } }, true)), 'ghost sm', { 'aria-label': t('a.new') + ' ' + t('kind.' + hint.ref_kind) }) : null) });
}
function renderRefList(schema, value, ptr, ctx, hint) {
  const rows = value.map((v, i) => { const sub = { type: 'object', 'x-calos-editor': { widget: 'reference', ref_kind: hint.ref_kind, label: hint.label } }; const rp = ptr + '/' + i;
    return h('div', { class: 'list-row', 'data-field': rp }, h('div', { class: 'grow' }, (() => { const n = renderReference(sub, v, rp, ctx, { ...hint, widget: 'reference' }, true, null); n.querySelector('label').classList.add('sr-only'); return n; })()), ctx.readOnly ? null : iconBtn('✕', t('a.remove'), () => { const cur = ctx.valueAt(ptr).slice(); cur.splice(i, 1); ctx.onChange(ptr, cur, true); })); });
  return h('div', { class: 'field', 'data-field': ptr }, h('div', { class: 'lbl' }, t(hint.label)), hint.help ? h('div', { class: 'help' }, t(hint.help)) : null, rows.length ? rows : h('div', { class: 'muted sm' }, t('none_yet')), h('div', { class: 'field-msgs', 'data-msgs': ptr }), ctx.readOnly ? null : btn('+ ' + t('a.add'), () => { const cur = (ctx.valueAt(ptr) || []).slice(); cur.push({ $ref: { kind: hint.ref_kind, key: '' } }); ctx.onChange(ptr, cur, true); }, 'ghost sm'));
}
function renderStringList(schema, value, ptr, ctx, hint) {
  const rows = value.map((v, i) => h('div', { class: 'list-row', 'data-field': ptr + '/' + i }, h('input', { class: 'input grow', type: 'text', 'data-ptr': ptr + '/' + i, 'aria-label': t(hint.label) + ' ' + (i + 1), value: v, disabled: ctx.readOnly ? true : null, oninput: (e) => { const cur = ctx.valueAt(ptr).slice(); cur[i] = e.target.value; ctx.onChange(ptr, cur, false); } }), h('div', { class: 'field-msgs', 'data-msgs': ptr + '/' + i }), ctx.readOnly ? null : iconBtn('✕', t('a.remove'), () => { const cur = ctx.valueAt(ptr).slice(); cur.splice(i, 1); ctx.onChange(ptr, cur, true); })));
  return h('div', { class: 'field', 'data-field': ptr }, h('div', { class: 'lbl' }, t(hint.label), h('span', { class: 'opt' }, ' (' + t('optional') + ')')), hint.help ? h('div', { class: 'help' }, t(hint.help)) : null, rows, h('div', { class: 'field-msgs', 'data-msgs': ptr }), ctx.readOnly ? null : btn('+ ' + t('a.add'), () => { const cur = (ctx.valueAt(ptr) || []).slice(); cur.push(''); ctx.onChange(ptr, cur, true); }, 'ghost sm'));
}
function renderRecord(schema, value, ptr, ctx, hint) {
  return h('fieldset', { class: 'rec', 'data-field': ptr }, h('legend', null, t(hint.label)), hint.help ? h('div', { class: 'help' }, t(hint.help)) : null, ...renderProps(schema, value, ptr, ctx));
}
function renderRecordList(schema, value, ptr, ctx, hint) {
  const items = value.map((rec, i) => {
    const rp = ptr + '/' + i; const lt = rec[hint.item_title]; const ttl = typeof lt === 'string' ? lt : locText(lt).text;
    const det = h('details', { class: 'rec-item', open: true, 'data-field': rp },
      h('summary', null, h('span', { class: 'rec-title' }, ttl ? ltr(ttl) : t('untitled')), h('span', { class: 'spacer' }), ctx.readOnly ? null : h('span', { class: 'rec-actions', onclick: (e) => e.preventDefault() },
        iconBtn('↑', t('a.move_up'), () => move(i, -1), { disabled: i === 0 ? true : null }), iconBtn('↓', t('a.move_down'), () => move(i, 1), { disabled: i === value.length - 1 ? true : null }), iconBtn('✕', t('a.remove'), () => { const cur = ctx.valueAt(ptr).slice(); cur.splice(i, 1); ctx.onChange(ptr, cur, true); toast(t('removed_undo'), ''); }))),
      h('div', { class: 'rec-body' }, ...renderProps(schema.items, rec, rp, ctx)));
    return det;
  });
  function move(i, d) { const cur = ctx.valueAt(ptr).slice(); const j = i + d; if (j < 0 || j >= cur.length) return; [cur[i], cur[j]] = [cur[j], cur[i]]; ctx.onChange(ptr, cur, true); }
  return h('div', { class: 'field', 'data-field': ptr }, h('div', { class: 'lbl' }, t(hint.label)), hint.help ? h('div', { class: 'help' }, t(hint.help)) : null, items.length ? items : h('div', { class: 'muted sm' }, t('none_yet')), h('div', { class: 'field-msgs', 'data-msgs': ptr }), ctx.readOnly ? null : btn('+ ' + t(hint.add_label || 'a.add'), () => { const cur = (ctx.valueAt(ptr) || []).slice(); cur.push({}); ctx.onChange(ptr, cur, true); }, 'ghost sm'));
}
/* measurement fields: decimal STRING + dimension-restricted unit; no float is ever created */
function qtyRow(q, ptr, ctx, dim, onChange, onRemove) {
  const units = dim ? UNITS[dim] : null;
  const val = h('input', { class: 'input mono qty-val', type: 'text', inputmode: 'decimal', dir: 'ltr', 'data-ptr': ptr + '/value', 'aria-label': t('f.value'), value: q.value || '', disabled: ctx.readOnly || !dim ? true : null, oninput: (e) => onChange({ ...q, value: e.target.value }, false) });
  const unit = h('select', { class: 'input qty-unit', 'data-ptr': ptr + '/unit', 'aria-label': t('f.unit'), disabled: ctx.readOnly || !dim ? true : null, onchange: (e) => onChange({ ...q, unit: e.target.value }, true) }, !q.unit ? h('option', { value: '' }, '—') : null, (units || []).map((u) => h('option', { value: u, selected: q.unit === u ? true : null }, u)));
  return h('div', { class: 'qty-row', 'data-field': ptr }, val, unit, ctx.readOnly || !onRemove ? null : iconBtn('✕', t('a.remove'), onRemove), h('div', { class: 'field-msgs', 'data-msgs': ptr + '/value' }));
}
function siblingDim(ptr, hint, ctx) { const parent = ptr.slice(0, ptr.lastIndexOf('/')); return ctx.valueAt(parent + '/' + hint.unit_dimension_from); }
function inputMarkerRow(mi, ctx, ptr, onEnter) {
  return h('div', { class: 'input-req' }, inputBadge(mi.$input), h('span', { class: 'muted sm' }, MI_REGISTER[mi.$input] || ''), ctx.readOnly ? null : btn(t('a.enter_values'), onEnter, 'ghost sm'));
}
function renderQtyOrInput(schema, value, ptr, ctx, hint, parent, required) {
  const dim = siblingDim(ptr, hint, ctx);
  const isIn = isInput(value);
  const body = (id, d) => {
    if (value === undefined) return h('div', { class: 'input-req' }, h('span', { class: 'muted' }, t('not_set')), ctx.readOnly ? null : btn(t('a.mark_input_required'), () => ctx.onChange(ptr, { $input: hint.default_input }, true), 'ghost sm'), ctx.readOnly ? null : btn(t('a.enter_values'), () => ctx.onChange(ptr, [{ value: '', unit: dim ? UNITS[dim][0] : '' }], true), 'ghost sm'));
    if (isIn) return inputMarkerRow(value, ctx, ptr, () => ctx.onChange(ptr, [{ value: '', unit: dim ? UNITS[dim][0] : '' }], true));
    return h('div', { id, 'data-ptr': ptr, tabindex: '-1' }, !dim ? h('div', { class: 'help warn' }, t('help.choose_quantity_first')) : null, value.map((q, i) => qtyRow(q, ptr + '/' + i, ctx, dim, (nq, s) => { const cur = ctx.valueAt(ptr).slice(); cur[i] = nq; ctx.onChange(ptr, cur, s); }, () => { const cur = ctx.valueAt(ptr).slice(); cur.splice(i, 1); ctx.onChange(ptr, cur.length ? cur : { $input: hint.default_input }, true); })),
      ctx.readOnly ? null : h('div', { class: 'row-actions' }, btn('+ ' + t('a.add_value'), () => { const cur = ctx.valueAt(ptr).slice(); cur.push({ value: '', unit: dim ? UNITS[dim][0] : '' }); ctx.onChange(ptr, cur, true); }, 'ghost sm'), btn(t('a.mark_input_required'), () => ctx.onChange(ptr, { $input: hint.default_input }, true), 'ghost sm')));
  };
  return wrapField({ ptr, hint, required, control: body });
}
function incRadio(name, ptr, val, ctx, label) {
  const mk = (v, txt) => h('label', { class: 'radio' }, h('input', { type: 'radio', name, 'data-ptr': ptr, checked: val === v ? true : null, disabled: ctx.readOnly ? true : null, onchange: () => ctx.onChange(ptr, v, true) }), h('span', null, txt));
  return h('div', { class: 'inc', role: 'radiogroup', 'aria-label': label, 'data-field': ptr }, h('span', { class: 'muted sm' }, label), mk(true, t('inclusive')), mk(false, t('exclusive')), h('div', { class: 'field-msgs', 'data-msgs': ptr }));
}
function renderIntervalOrInput(schema, value, ptr, ctx, hint, parent, required) {
  const dim = siblingDim(ptr, hint, ctx);
  const body = () => {
    if (value === undefined) return h('div', { class: 'input-req' }, h('span', { class: 'muted' }, t('not_set')), ctx.readOnly ? null : btn(t('a.mark_input_required'), () => ctx.onChange(ptr, { $input: hint.default_input }, true), 'ghost sm'), ctx.readOnly ? null : btn(t('a.enter_values'), () => ctx.onChange(ptr, { lower: { value: '', unit: dim ? UNITS[dim][0] : '' }, upper: { value: '', unit: dim ? UNITS[dim][0] : '' } }, true), 'ghost sm'));
    if (isInput(value)) return inputMarkerRow(value, ctx, ptr, () => ctx.onChange(ptr, { lower: { value: '', unit: dim ? UNITS[dim][0] : '' }, upper: { value: '', unit: dim ? UNITS[dim][0] : '' } }, true));
    const nm = 'inc' + (++_fid);
    const side = (k, lbl) => h('div', { class: 'iv-side' }, h('div', { class: 'lbl sm' }, t(lbl)), qtyRow(value[k], ptr + '/' + k, ctx, dim, (nq, s) => { ctx.onChange(ptr + '/' + k, nq, s); }), incRadio(nm + k, ptr + '/' + k + '_inclusive', value[k + '_inclusive'], ctx, t('inclusivity')));
    return h('div', { class: 'iv' }, !dim ? h('div', { class: 'help warn' }, t('help.choose_quantity_first')) : null, side('lower', 'lower'), side('upper', 'upper'), h('div', { class: 'help' }, t('help.no_default_inclusivity')), ctx.readOnly ? null : btn(t('a.mark_input_required'), () => ctx.onChange(ptr, { $input: hint.default_input }, true), 'ghost sm'));
  };
  return wrapField({ ptr, hint, required, control: body });
}
/* derived (read-only, computed): registry of derivations, still kind-agnostic */
const DERIVE = {
  /* generic: aggregates `capabilities` found on every referenced item (any kind) + shows fields named by the hint */
  'closure-requirements': (ctx, hint) => {
    const c = ctx.content(); const caps = new Set();
    refKeys(c).filter((r) => r.key).forEach((r) => { const it = ctx.lookup(r.kind, r.key); const ic = it && (it.draft || Store.latest(it) || {}).content; ((ic && ic.capabilities) || []).forEach((x) => caps.add(x)); });
    return h('div', { class: 'kv-list' }, h('div', null, h('span', { class: 'muted' }, t('req.capabilities')), ' ', caps.size ? [...caps].sort().map((x) => h('span', { class: 'chip mut sm' }, ltr(x))) : t('none_yet')),
      h('div', null, h('span', { class: 'muted' }, t('req.transports')), ' ', ltr('simulator')),
      (hint.show_fields || []).map((f) => h('div', null, h('span', { class: 'muted' }, t('f.' + f) + ': '), (Array.isArray(c[f]) ? c[f] : []).map((m) => (hint.enum_prefix ? t(hint.enum_prefix + m) : m)).join(', ') || '—')),
      h('div', { class: 'help' }, t('req.later')));
  },
};
function renderDerived(ptr, ctx, hint) {
  return h('div', { class: 'field', 'data-field': ptr }, h('div', { class: 'lbl' }, t(hint.label), ' ', chip('mut sm', '⚙', t('derived'))), DERIVE[hint.derive](ctx, hint));
}

/* ----- paint validation findings onto the generic form (by JSON pointer; walks up to the nearest rendered field) ----- */
function findingText(f) {
  const key = 'f.' + f.code + (f.params && f.params.detail ? '.' + f.params.detail : '');
  const base = t(I18N_HAS(key) ? key : 'f.' + f.code, f.params || {});
  return f.params && f.params.hint ? base + ' ' + t(f.params.hint) : base;
}
function paintFindings(root, findings) {
  root.querySelectorAll('[data-msgs]').forEach((n) => n.replaceChildren());
  root.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));
  for (const f of findings) {
    let p = f.ptr, box = null;
    while (true) { box = root.querySelector('[data-msgs="' + CSS.escape(p) + '"]'); if (box || p === '') break; p = p.slice(0, p.lastIndexOf('/')); }
    if (!box) continue;
    box.append(h('div', { class: 'field-msg ' + (f.sev === 'error' ? 'err' : 'warn') }, h('span', { 'aria-hidden': 'true' }, f.sev === 'error' ? '✖ ' : '⚠ '), findingText(f), ' ', ltr('[' + f.code + ']', 'code')));
    if (f.sev === 'error') { const inp = root.querySelector('[data-ptr="' + CSS.escape(f.ptr) + '"]'); if (inp) inp.setAttribute('aria-invalid', 'true'); }
  }
}
function locate(root, ptr) {
  let p = ptr;
  while (true) { const el = root.querySelector('[data-ptr="' + CSS.escape(p) + '"]') || root.querySelector('[data-field="' + CSS.escape(p) + '"]'); if (el) { const f = el.matches('input,select,textarea,button') ? el : (el.querySelector('input,select,textarea,button') || el); f.scrollIntoView({ block: 'center' }); f.focus && f.focus(); return true; } if (p === '') return false; p = p.slice(0, p.lastIndexOf('/')); }
}
