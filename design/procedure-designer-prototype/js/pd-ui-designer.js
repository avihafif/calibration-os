/* CalOS Procedure Designer DESIGN PROTOTYPE — designer workspace UI (palette, canvas, outline, inspector, dock). Non-operational.
   The inspector is produced by the Phase 1A GENERIC form renderer from each step's catalog schema + hints; the widgets added here
   (expression, select-from, op-args, duration, error-policy, resume-policy, bound) are registered extensions, not per-step screens. */
'use strict';
const PD = {
  persona: 'engineer', driver: MKDRV(), tables: [MKTABLE()], profile: MKPROFILE(), profileCandidate: null, policy: { required_locales: ['en'] },
  versions: [], draft: null, sel: null, selTab: 'main', centre: 'canvas', dock: 'validation', findings: [], undo: [], redo: [], lastPush: 0, announce: '',
  compare: { a: 'v1.0.0', b: 'draft', overlay: false }, sim: { run: null, scenario: 'nominal', faults: [], auto: false, speed: 'fast', breakpoints: new Set(), runNo: 0, evSel: null, tab: 'trace', timer: null, filter: '', passedDigest: null, mode: 'run' },
  open: { palette: true }, drvSel: 'read_value', drvTest: {}, metTab: 'points', lastRoute: '',
};
const persona = () => PD.persona;
function createDialog() { toast(t('pd.msg.no_inline_create'), 'err'); }
const PPERMS = { engineer: ['draft', 'submit', 'driver.author'], hazauth: ['draft', 'driver.author', 'driver.author.hazardous'], lsma: ['safety.manage'], approver: ['approve'], safety: ['safety.approve', 'safety.withdraw', 'approve'], quality: ['publish'], viewer: [] };
const pcan = (perm) => (PPERMS[PD.persona] || []).includes(perm);
const POL = () => PD.policy.required_locales;

/* ---------- model helpers ---------- */
const stepName = (type) => t('pd.step.' + type);
function nodeTitle(n) { const l = locText(n.title); return l.text || stepName(n.type); }
function ctxV() { return { driver: PD.driver, tables: PD.tables, profile: PD.profile && PD.profile.status === 'approved' ? PD.profile : (PD.profile.status === 'withdrawn' ? null : PD.profile), requiredLocales: POL() }; }
function validateNow() { PD.findings = validateProcedure(PD.draft.proc, { ...ctxV(), profile: profileForValidation() }); return PD.findings; }
function profileForValidation() { return PD.profile.status === 'withdrawn' ? null : PD.profile; }
const proc = () => PD.draft.proc;
const editable = () => PD.draft.state === 'draft' && pcan('draft');
function nodeFindings(id) { return PD.findings.filter((f) => f.node === id); }
function nodeSev(id) { const fs = nodeFindings(id); return fs.some((f) => f.sev === 'error') ? 'error' : fs.some((f) => f.sev === 'warning') ? 'warning' : null; }
function pushUndo(force) { const now = Date.now(); if (force || now - PD.lastPush > 900) { PD.undo.push(JSON.stringify(PD.draft.proc)); if (PD.undo.length > 60) PD.undo.shift(); PD.redo = []; PD.lastPush = now; } }
function undo() { if (!PD.undo.length || !editable()) return; PD.redo.push(JSON.stringify(PD.draft.proc)); PD.draft.proc = JSON.parse(PD.undo.pop()); afterEdit(true); }
function redo() { if (!PD.redo.length || !editable()) return; PD.undo.push(JSON.stringify(PD.draft.proc)); PD.draft.proc = JSON.parse(PD.redo.pop()); afterEdit(true); }
function say(msg) { PD.announce = msg; const el = document.getElementById('sr-live'); if (el) el.textContent = msg; }
function afterEdit(structural) { PD.draft.rev++; validateNow(); if (PD.sel && !findNode(proc(), PD.sel)) PD.sel = null; if (structural) renderDesigner(); else { refreshCanvas(); refreshDock(); } }
const hzChip = (h) => (h ? chip(HRANK[h] >= 2 ? 'hazard' : 'mut', HRANK[h] >= 2 ? '⛔' : '', h + (HRANK[h] >= 2 ? ' 🔒' : '')) : null);
function nodeSummary(n) {
  const L = (s) => ltr(s, 'mono');
  switch (n.type) {
    case 'driver.call': return [L(n.op || '—'), n.args && Object.keys(n.args).length ? ' (' + Object.entries(n.args).map(([k, v]) => k + '=' + v).join(', ') + ')' : ''];
    case 'measure.acquire': return [L(n.op || '—'), ' ×', L(n.count || '?'), ' → ', L(n.store_as || '?')];
    case 'source.apply': return ['→ ', L(n.value || '?'), n.bound_max_abs ? [' · ≤ ', L(n.bound_max_abs + ' su')] : ''];
    case 'compute.set': return [L(n.var || '?'), ' = ', L(n.expr || '?')];
    case 'evaluate.limits': return [L(n.measured || '?'), ' ⇆ ', L(n.nominal || '?')];
    case 'flow.foreach': return [t('pd.sum.for_each'), ' ', L(n.over || '?'), ' (≤ ', L(String(n.max_iterations || '?')), ')'];
    case 'flow.if': return [L(n.cond || '?')];
    case 'flow.delay': return [L(n.duration || '?')];
    case 'flow.repeat_until': return [L(n.until || '?'), ' (≤ ', L(String(n.max_iterations || '?')), ')'];
    case 'record.result': return [L(n.dataset_path || '?')];
    case 'standard.require': case 'source.off': return [t('pd.sum.role'), ' ', L(n.role || '?')];
    default: return '';
  }
}

/* ---------- palette ---------- */
function paletteEntries() {
  const items = []; Object.entries(STEP_CATALOG).forEach(([type, e]) => items.push({ id: type, type, group: e.group, glyph: e.glyph, label: stepName(type), hazard: e.hazard, proposal: e.proposal }));
  PRESETS.forEach((p) => items.push({ id: 'preset:' + p.id, preset: p, group: 'library', glyph: p.glyph, label: t(p.key) }));
  return items;
}
function buildFromEntry(entry) { if (entry.preset) return entry.preset.build().map((init) => newNode(proc(), init.type, init)); return [newNode(proc(), entry.type, defaultsFor(entry.type))]; }
function defaultsFor(type) {
  const d = {};
  if (type === 'flow.foreach') Object.assign(d, { over: PD.tables[0] && PD.tables[0].id, as: 'tp', max_iterations: 20 });
  if (type === 'driver.call') Object.assign(d, { role: 'uut' });
  if (type === 'measure.acquire') Object.assign(d, { role: 'uut', op: 'read_value', count: '1', aggregate: 'mean', store_as: 'reading' });
  if (type === 'source.apply') Object.assign(d, { role: 'ref' }); if (type === 'source.off') Object.assign(d, { role: 'ref' }); if (type === 'standard.require') Object.assign(d, { role: 'ref' });
  if (type === 'flow.repeat_until') Object.assign(d, { max_iterations: 5 });
  if (type === 'flow.try') Object.assign(d, { match: ['E_TIMEOUT'] });
  if (type === 'record.result') Object.assign(d, { dataset_path: 'as_found.points' });
  if (type === 'evaluate.limits') Object.assign(d, { table: PD.tables[0] && PD.tables[0].id });
  return d;
}
/* the single insertion path used by pointer drop, keyboard insert, "+" buttons and presets */
function insertEntry(entry, ref, index) {
  if (!editable()) { toast(t('pd.msg.readonly'), 'err'); return; }
  const nodes = buildFromEntry(entry); const first = nodes[0]; const chk = canPlace(proc(), first, ref, PD.driver);
  if (!chk.ok) { toast(t(chk.key, chk.params), 'err'); say(t(chk.key, chk.params)); return false; }
  pushUndo(true); let at = index; nodes.forEach((n) => { insertNode(proc(), n, ref, at); if (at !== undefined) at++; });
  PD.sel = first.id; say(t('pd.msg.added', { name: nodeTitle(first) })); afterEdit(true); focusNode(first.id); return true;
}
function moveEntry(id, ref, index) {
  if (!editable()) { toast(t('pd.msg.readonly'), 'err'); return false; }
  const f = findNode(proc(), id); const chk = canPlace(proc(), f.node, ref, PD.driver, id); if (!chk.ok) { toast(t(chk.key, chk.params), 'err'); say(t(chk.key, chk.params)); return false; }
  pushUndo(true); if (!moveNode(proc(), id, ref, index)) return false; say(t('pd.msg.moved', { name: nodeTitle(f.node) })); afterEdit(true); focusNode(id); return true;
}
function removeEntry(id) { if (!editable()) return; const f = findNode(proc(), id); if (!f) return; pushUndo(true); removeNode(proc(), id); say(t('pd.msg.removed', { name: nodeTitle(f.node) })); toast(t('pd.msg.removed_undo', { name: nodeTitle(f.node) })); afterEdit(true); }
function duplicateEntry(id) { if (!editable()) return; const f = findNode(proc(), id); const copy = cloneJ(f.node); const ren = (n) => { n.id = freshId(proc(), n.type); slotsOf(n).forEach((s) => (n[s] || []).forEach(ren)); }; ren(copy); pushUndo(true); insertNode(proc(), copy, f.ref, f.index + 1); PD.sel = copy.id; afterEdit(true); focusNode(copy.id); }
function nudge(id, dir) { /* keyboard move: ↑/↓ within list, ← out of container, → into next container */
  const f = findNode(proc(), id); if (!f) return;
  if (dir === 'up' && f.index > 0) return moveEntry(id, f.ref, f.index - 1);
  if (dir === 'down' && f.index < f.list.length - 1) return moveEntry(id, f.ref, f.index + 2);
  if (dir === 'out' && f.ref.parent) { const p = findNode(proc(), f.ref.parent); return moveEntry(id, p.ref, p.index + 1); }
  if (dir === 'in') { const nx = f.list[f.index + 1]; if (nx && slotsOf(nx).length) return moveEntry(id, { parent: nx.id, slot: slotsOf(nx)[0] }, 0); }
  say(t('pd.msg.cannot_move'));
}
function focusNode(id) { setTimeout(() => { const el = document.querySelector('#pd-centre [data-nid="' + id + '"]'); if (el) el.focus(); }, 0); }

function openAddMenu(ref, index, anchor) {
  const input = h('input', { class: 'input', type: 'search', 'aria-label': t('pd.add.search'), placeholder: t('pd.add.search') + '…', autofocus: true }); const list = h('ul', { class: 'pal-list', role: 'listbox' }); let shown = [], sel = 0;
  const paint = () => { const q = input.value.toLowerCase(); shown = paletteEntries().filter((e) => (e.label + ' ' + (e.type || '')).toLowerCase().includes(q)).slice(0, 14); sel = Math.min(sel, Math.max(0, shown.length - 1)); list.replaceChildren(...shown.map((e, i) => h('li', { role: 'option', 'aria-selected': String(i === sel), class: i === sel ? 'sel' : '', onclick: () => pick(i) }, h('span', { class: 'g', 'aria-hidden': 'true' }, e.glyph + ' '), e.label, e.hazard && HRANK[e.hazard] >= 2 ? ' ⛔' : '', e.proposal ? h('span', { class: 'chip mut sm' }, t('pd.proposed')) : ''))); };
  const pick = (i) => { const e = shown[i]; if (!e) return; dlg.close(); insertEntry(e, ref, index); };
  input.addEventListener('input', () => { sel = 0; paint(); }); input.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); paint(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); paint(); } else if (e.key === 'Enter') { e.preventDefault(); pick(sel); } });
  const dlg = openDialog({ title: t('pd.add.title'), body: [h('p', { class: 'muted sm' }, t('pd.add.help')), input, list] }); paint(); void anchor;
}
function renderPalette() {
  const q = PD.palQ || ''; const entries = paletteEntries().filter((e) => !q || (e.label + e.type).toLowerCase().includes(q.toLowerCase()));
  const box = h('div', { class: 'palette', role: 'region', 'aria-label': t('pd.palette') });
  box.append(h('input', { class: 'input sm', type: 'search', 'aria-label': t('pd.add.search'), placeholder: t('pd.add.search') + '…', value: q, oninput: (e) => { PD.palQ = e.target.value; const pos = e.target.selectionStart; renderPaletteInto(); const i2 = document.querySelector('.palette input'); i2.focus(); i2.setSelectionRange(pos, pos); } }));
  [...GROUPS, 'library'].forEach((g) => { const items = entries.filter((e) => e.group === g); if (!items.length) return; box.append(h('details', { class: 'pal-group', open: true }, h('summary', null, t('pd.group.' + g)), items.map((e) => h('div', { class: 'pal-item', draggable: editable() ? 'true' : 'false', 'data-eid': e.id, role: 'button', tabindex: '0', 'aria-label': e.label + ' — ' + t('pd.add.hint'), ondragstart: (ev2) => { ev2.dataTransfer.setData('text/x-pd-entry', e.id); ev2.dataTransfer.effectAllowed = 'copy'; PD.dragging = { entry: e }; document.body.classList.add('dragging'); }, ondragend: () => { PD.dragging = null; document.body.classList.remove('dragging'); clearDz(); }, onclick: () => quickAdd(e), onkeydown: (ev2) => { if (ev2.key === 'Enter' || ev2.key === ' ') { ev2.preventDefault(); quickAdd(e); } } },
    h('span', { class: 'pal-g', 'aria-hidden': 'true' }, e.glyph), h('span', { class: 'grow' }, e.label), e.hazard && HRANK[e.hazard] >= 2 ? h('span', { class: 'ribbon-sm', title: 'H2' }, '⛔') : null, e.proposal ? h('span', { class: 'chip mut sm', title: t('pd.proposed_help') }, t('pd.proposed')) : null)))); });
  if (!box.querySelector('.pal-group')) box.append(emptyState('state.nomatch_title', 'state.nomatch_body'));
  box.append(h('p', { class: 'help' }, t('pd.palette_note')));
  return box;
}
function quickAdd(entry) { /* keyboard / click path: after the selected node, else end of the main phase */
  if (PD.sel) { const f = findNode(proc(), PD.sel); if (f) { const sl = slotsOf(f.node); if (sl.length && f.node.type !== 'flow.if' && !(f.node[sl[0]] || []).length) return insertEntry(entry, { parent: f.node.id, slot: sl[0] }, 0); return insertEntry(entry, f.ref, f.index + 1); } }
  const lane = proc().lifecycle.phases[0].id; insertEntry(entry, { lane }, undefined);
}
function renderPaletteInto() { const box = document.getElementById('pd-left'); if (box) box.replaceChildren(renderPalette()); }

/* ---------- canvas ---------- */
function clearDz() { document.querySelectorAll('.dz.ok,.dz.no').forEach((d) => d.classList.remove('ok', 'no')); }
function dropZone(ref, index) {
  const dz = h('div', { class: 'dz', 'data-ref': JSON.stringify(ref), 'data-i': String(index) },
    editable() ? h('button', { class: 'dz-add', type: 'button', tabindex: '-1', 'aria-label': t('pd.add.here'), title: t('pd.add.here'), onclick: () => openAddMenu(ref, index) }, '+') : null);
  dz.addEventListener('dragover', (e) => { if (!PD.dragging || !editable()) return; const node = PD.dragging.entry ? buildFromEntryPreview(PD.dragging.entry) : findNode(proc(), PD.dragging.id).node; const chk = canPlace(proc(), node, ref, PD.driver, PD.dragging.id); dz.classList.toggle('ok', chk.ok); dz.classList.toggle('no', !chk.ok); if (chk.ok) { e.preventDefault(); e.dataTransfer.dropEffect = PD.dragging.id ? 'move' : 'copy'; } else dz.title = t(chk.key, chk.params); });
  dz.addEventListener('dragleave', () => dz.classList.remove('ok', 'no'));
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('ok', 'no'); const d = PD.dragging; PD.dragging = null; document.body.classList.remove('dragging'); if (!d) return; if (d.id) moveEntry(d.id, ref, index); else insertEntry(d.entry, ref, index); });
  return dz;
}
function buildFromEntryPreview(entry) { if (entry.preset) { const i = entry.preset.build()[0]; return { type: i.type, op: i.op }; } return { type: entry.type }; }
function nodeCard(n, info) {
  const e = STEP_CATALOG[n.type] || { glyph: '?', slots: [] }; const hz = hazardOf(n, PD.driver); const sev = nodeSev(n.id); const st = simStatus(n.id);
  const summary = nodeSummary(n); const sl = slotsOf(n);
  const card = h('div', { class: 'node' + (PD.sel === n.id ? ' sel' : '') + (hz && HRANK[hz] >= 2 ? ' haz' : '') + (sev ? ' f-' + sev : '') + (st ? ' s-' + st : '') + diffClass(n.id), role: 'button', tabindex: PD.sel === n.id || (!PD.sel && info.first) ? '0' : '-1', 'data-nid': n.id, draggable: editable() ? 'true' : 'false', 'aria-pressed': String(PD.sel === n.id), 'aria-label': nodeTitle(n) + ', ' + stepName(n.type) + (hz ? ', ' + hz : '') + (sev ? ', ' + t('sev.' + sev) : ''),
    onclick: (ev2) => { ev2.stopPropagation(); select(n.id); }, onkeydown: (ev2) => nodeKey(ev2, n), ondragstart: (ev2) => { ev2.stopPropagation(); ev2.dataTransfer.setData('text/x-pd-node', n.id); ev2.dataTransfer.effectAllowed = 'move'; PD.dragging = { id: n.id }; document.body.classList.add('dragging'); }, ondragend: () => { PD.dragging = null; document.body.classList.remove('dragging'); clearDz(); } },
    h('div', { class: 'node-head' }, h('span', { class: 'node-g', 'aria-hidden': 'true' }, e.glyph), h('span', { class: 'node-title' }, nodeTitle(n)), h('span', { class: 'spacer' }), hz ? hzChip(hz) : null, sev ? chip(sev === 'error' ? 'err sm' : 'warn sm', sev === 'error' ? '✖' : '⚠', String(nodeFindings(n.id).length)) : null, st ? simGlyph(st) : null, PD.sim.breakpoints.has(n.id) ? h('span', { class: 'bp', title: t('pd.bp'), 'aria-label': t('pd.bp') }, '●') : null),
    h('div', { class: 'node-meta' }, h('span', { class: 'chip mut sm' }, ltr(n.type, 'mono')), h('span', { class: 'chip mut sm', title: t('pd.f.resume') }, t('pd.resume.' + effectiveResume(n, PD.driver))), n.on_error && n.on_error.action && n.on_error.action !== 'none' ? h('span', { class: 'chip info sm' }, '↺ ' + t('pd.pol.' + n.on_error.action)) : null),
    summary && summary.length ? h('div', { class: 'node-sum' }, summary) : null);
  if (!sl.length) return card;
  const box = h('div', { class: 'node-wrap' }, card);
  sl.forEach((s) => { const ref = { parent: n.id, slot: s }; box.append(h('div', { class: 'slot', 'data-slot': s }, h('div', { class: 'slot-label' }, t('pd.slot.' + s)), listEl(n[s] || [], ref))); });
  return box;
}
function listEl(list, ref) {
  const box = h('div', { class: 'nlist', role: 'group' }); box.append(dropZone(ref, 0));
  list.forEach((n, i) => { box.append(h('div', { class: 'nrow' }, nodeCard(n, { first: i === 0 && !ref.parent && ref.lane === 'setup' }), dropZone(ref, i + 1))); });
  if (!list.length) box.classList.add('empty'), box.append(h('div', { class: 'empty-slot muted' }, t('pd.empty_slot')));
  return box;
}
const LANE_KEY = { setup: 'pd.lane.setup', as_found: 'pd.lane.as_found', teardown: 'pd.lane.teardown', safe_state: 'pd.lane.safe_state' };
function renderCanvas() {
  const root = h('div', { class: 'canvas', role: 'region', 'aria-label': t('pd.canvas'), onclick: () => select(null) });
  [['setup', proc().lifecycle.setup], ...proc().lifecycle.phases.map((p) => [p.id, p.body]), ['teardown', proc().lifecycle.teardown], ['safe_state', proc().lifecycle.safe_state]].forEach(([lane, list]) => {
    root.append(h('section', { class: 'lane lane-' + lane, 'aria-label': t(LANE_KEY[lane] || 'pd.lane.setup') }, h('div', { class: 'lane-h' }, h('span', null, t(LANE_KEY[lane])), lane === 'safe_state' ? chip('hazard sm', '⛨', t('pd.lane.fail_closed')) : null, h('span', { class: 'muted sm' }, t('pd.n_steps', { n: list.length }))), listEl(list, { lane })));
  });
  return root;
}
function refreshCanvas() { const c = document.getElementById('pd-centre'); if (!c) return; renderCentre(); }
function select(id) { PD.sel = id; renderCentre(); renderInspector(); if (id) say(t('pd.msg.selected', { name: nodeTitle(findNode(proc(), id).node) })); }
function nodeKey(e, n) {
  const k = e.key;
  if (k === 'Enter' || k === ' ') { e.preventDefault(); select(n.id); return; }
  if (e.altKey && k.startsWith('Arrow')) { e.preventDefault(); nudge(n.id, { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: UI.locale === 'he' ? 'in' : 'out', ArrowRight: UI.locale === 'he' ? 'out' : 'in' }[k]); return; }
  if (k === 'Delete') { e.preventDefault(); removeEntry(n.id); return; }
  if (k === 'Insert' || (k === '+' && !e.ctrlKey)) { e.preventDefault(); const f = findNode(proc(), n.id); openAddMenu(f.ref, f.index + 1); return; }
  if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'd') { e.preventDefault(); duplicateEntry(n.id); return; }
  if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); const all = [...document.querySelectorAll('#pd-centre [data-nid]')]; const i = all.indexOf(e.currentTarget); const nx = all[i + (k === 'ArrowDown' ? 1 : -1)]; if (nx) { all.forEach((x) => (x.tabIndex = -1)); nx.tabIndex = 0; nx.focus(); } }
  if (k === 'b' || k === 'B') { toggleBp(n.id); }
}
function toggleBp(id) { PD.sim.breakpoints.has(id) ? PD.sim.breakpoints.delete(id) : PD.sim.breakpoints.add(id); say(t(PD.sim.breakpoints.has(id) ? 'pd.msg.bp_on' : 'pd.msg.bp_off')); renderCentre(); }

/* ---------- outline (the accessible equivalent of the canvas; same view-model) ---------- */
function renderOutline() {
  const vm = viewModel(proc()); const root = h('div', { class: 'outline', role: 'tree', 'aria-label': t('pd.outline') });
  const laneOrder = ['setup', ...proc().lifecycle.phases.map((p) => p.id), 'teardown', 'safe_state'];
  laneOrder.forEach((lane) => {
    root.append(h('div', { class: 'ol-lane', role: 'presentation' }, t(LANE_KEY[lane]), ' ', h('span', { class: 'muted sm' }, '(' + vm.filter((v) => v.lane === lane).length + ')')));
    vm.filter((v) => v.lane === lane).forEach((v, i) => {
      const n = findNode(proc(), v.id).node; const hz = hazardOf(n, PD.driver); const sev = nodeSev(n.id); const st = simStatus(n.id);
      root.append(h('div', { class: 'ol-item' + (PD.sel === n.id ? ' sel' : '') + diffClass(n.id), role: 'treeitem', 'aria-level': String(v.depth + 1), 'aria-selected': String(PD.sel === n.id), tabindex: PD.sel === n.id || (!PD.sel && lane === 'setup' && i === 0) ? '0' : '-1', 'data-oid': n.id, 'data-nid-o': n.id, style: 'padding-inline-start:' + (8 + v.depth * 18) + 'px',
        onclick: () => { PD.sel = n.id; renderCentre(); renderInspector(); }, onkeydown: (e) => outlineKey(e, n) },
        v.slot ? h('span', { class: 'ol-slot' }, t('pd.slot.' + v.slot) + ' ›') : null, h('span', { class: 'node-g', 'aria-hidden': 'true' }, (STEP_CATALOG[n.type] || {}).glyph), h('span', { class: 'ol-title' }, nodeTitle(n)), h('span', { class: 'spacer' }), ltr(n.id, 'muted sm'), hz ? hzChip(hz) : null, sev ? chip(sev === 'error' ? 'err sm' : 'warn sm', sev === 'error' ? '✖' : '⚠', sev === 'error' ? t('sev.error') : t('sev.warning')) : null, st ? simGlyph(st) : null, PD.sim.breakpoints.has(n.id) ? h('span', { class: 'bp', 'aria-label': t('pd.bp') }, '●') : null));
    });
    if (editable()) root.append(h('div', { class: 'ol-add' }, btn('+ ' + t('pd.add.here'), () => openAddMenu({ lane }, undefined), 'ghost sm')));
  });
  return root;
}
function outlineKey(e, n) {
  const k = e.key; const items = [...document.querySelectorAll('#pd-centre [data-oid]')];
  if (k === 'ArrowDown' || k === 'ArrowUp') { if (e.altKey) { e.preventDefault(); nudge(n.id, k === 'ArrowDown' ? 'down' : 'up'); setTimeout(() => { const el = document.querySelector('#pd-centre [data-oid="' + n.id + '"]'); el && el.focus(); }, 0); return; } e.preventDefault(); const i = items.indexOf(e.currentTarget); const nx = items[i + (k === 'ArrowDown' ? 1 : -1)]; if (nx) { items.forEach((x) => (x.tabIndex = -1)); nx.tabIndex = 0; nx.focus(); } return; }
  if (e.altKey && (k === 'ArrowLeft' || k === 'ArrowRight')) { e.preventDefault(); nudge(n.id, { ArrowLeft: UI.locale === 'he' ? 'in' : 'out', ArrowRight: UI.locale === 'he' ? 'out' : 'in' }[k]); setTimeout(() => { const el = document.querySelector('#pd-centre [data-oid="' + n.id + '"]'); el && el.focus(); }, 0); return; }
  if (k === 'Enter' || k === ' ') { e.preventDefault(); PD.sel = n.id; renderCentre(); renderInspector(); setTimeout(() => { const el = document.querySelector('#pd-centre [data-oid="' + n.id + '"]'); el && el.focus(); }, 0); return; }
  if (k === 'Delete') { e.preventDefault(); removeEntry(n.id); return; }
  if (k === 'Insert') { e.preventDefault(); const f = findNode(proc(), n.id); openAddMenu(f.ref, f.index + 1); return; }
  if (k === 'b' || k === 'B') toggleBp(n.id);
}
function renderCentre() {
  const c = document.getElementById('pd-centre'); if (!c) return; const hadFocus = document.activeElement && (document.activeElement.dataset.nid || document.activeElement.dataset.oid); const scroll = c.scrollTop;
  c.replaceChildren(PD.centre === 'canvas' ? renderCanvas() : renderOutline()); c.scrollTop = scroll;
  if (hadFocus) { const el = c.querySelector('[data-nid="' + hadFocus + '"],[data-oid="' + hadFocus + '"]'); if (el) el.focus({ preventScroll: true }); }
}
const simStatus = (id) => { const run = PD.sim.run; if (!run) return null; const evs = run.events; let st = null; for (let i = evs.length - 1; i >= 0; i--) { const e = evs[i]; if (e.node !== id) continue; if (e.kind === 'safety.violation') return 'blocked'; if (e.kind === 'error') { st = 'error'; break; } if (e.kind === 'node.end') { st = 'ok'; break; } if (e.kind === 'node.start') { st = run.state === 'running' || run.state === 'waiting_prompt' ? 'run' : 'error'; break; } if (e.kind === 'node.skipped') { st = 'skip'; break; } } return st; };
const simGlyph = (s) => h('span', { class: 'sim-st s-' + s, title: t('pd.sim.st.' + s), 'aria-label': t('pd.sim.st.' + s) }, { ok: '✔', error: '✖', run: '▶', blocked: '⛔', skip: '↷' }[s]);
const diffMap = () => { if (!PD.compare.overlay) return {}; const a = versionProc(PD.compare.a), b = versionProc(PD.compare.b); if (!a || !b) return {}; const m = {}; diffProcedures(a, b).forEach((r) => { m[r.id] = m[r.id] === 'moved' || m[r.id] === 'changed' ? m[r.id] : r.type; }); return m; };
let _dm = null; const diffClass = (id) => { if (!PD.compare.overlay) return ''; _dm = _dm || diffMap(); return _dm[id] ? ' d-' + _dm[id] : ''; };
function versionProc(id) { if (id === 'draft') return PD.draft.proc; const v = PD.versions.find((x) => 'v' + x.version === id); return v ? v.proc : null; }

/* ---------- inspector (generic renderer + registered widgets) ---------- */
const INS_TABS = ['main', 'errors', 'resume', 'perms', 'notes'];
function nodeSchemaFor(node) { return STEP_CATALOG[node.type].schema; }
function renderInspector() {
  const box = document.getElementById('pd-right'); if (!box) return; box.replaceChildren();
  const node = PD.sel && findNode(proc(), PD.sel) ? findNode(proc(), PD.sel).node : null;
  if (!node) { box.append(h('div', { class: 'ins-empty' }, h('h2', null, t('pd.inspector')), emptyState('pd.ins.none_title', 'pd.ins.none_body'), h('div', { class: 'help' }, proc().lifecycle.phases.length ? t('pd.ins.hint') : ''))); return; }
  const e = STEP_CATALOG[node.type]; const hz = hazardOf(node, PD.driver);
  box.append(h('div', { class: 'ins-head' }, h('span', { class: 'node-g big', 'aria-hidden': 'true' }, e.glyph), h('div', { class: 'grow' }, h('h2', null, stepName(node.type)), h('div', { class: 'muted sm' }, ltr(node.id, 'mono'), ' · ', ltr(node.type, 'mono'))), hz ? hzChip(hz) : null, e.proposal ? chip('mut sm', '', t('pd.proposed'), t('pd.proposed_help')) : null));
  if (!editable()) box.append(banner('info', PD.draft.state !== 'draft' ? t('pd.msg.frozen') : t('pd.msg.readonly')));
  const tabs = INS_TABS.filter((tb) => tb !== 'errors' || true);
  box.append(h('div', { class: 'tabs small', role: 'tablist' }, tabs.map((tb) => h('button', { type: 'button', role: 'tab', class: 'tab' + (PD.selTab === tb ? ' on' : ''), 'aria-selected': String(PD.selTab === tb), onclick: () => { PD.selTab = tb; renderInspector(); } }, t('pd.tab.' + tb)))));
  const body = h('div', { class: 'ins-body', role: 'tabpanel' }); box.append(body);
  if (PD.selTab === 'perms') { body.append(permsPanel(node)); return; }
  const only = Object.entries(e.schema.properties).filter(([k, s]) => !['id', 'type'].includes(k) && !slotsOf(node).includes(k) && (hintOf(s).tab || 'main') === PD.selTab).map(([k]) => k);
  if (!only.length) { body.append(h('div', { class: 'muted pad' }, t('pd.ins.nothing_tab'))); return; }
  const ctx = { readOnly: !editable(), policy: PD.policy, items: () => [], lookup: () => null, node, valueAt: (p) => getPath(node, p), content: () => node,
    onChange(ptr, val, structural) { if (!editable()) return; pushUndo(structural); setPath(node, ptr, val); const keep = document.activeElement && document.activeElement.getAttribute('data-ptr'); afterEdit(false); if (structural) { renderInspector(); if (keep) { const el = document.querySelector('#pd-right [data-ptr="' + CSS.escape(keep) + '"]'); if (el) el.focus(); } } else paintInspectorFindings(); } };
  const form = renderForm({ schema: { ...e.schema, properties: e.schema.properties }, content: node, ctx, only }); body.append(form); paintInspectorFindings();
}
function paintInspectorFindings() { const box = document.getElementById('pd-right'); if (!box || !PD.sel) return; const fs = nodeFindings(PD.sel).map((f) => ({ code: f.code, sev: f.sev, ptr: '/' + (f.field || ''), params: f.params, stage: f.stage })); paintFindings(box, fs); }
function permsPanel(node) {
  const hz = hazardOf(node, PD.driver); const der = derivedResume(node, PD.driver); const op = node.type === 'source.apply' ? opByName(PD.driver, 'set_source_level') : opByName(PD.driver, node.op);
  const rows = [[t('pd.perm.hazard'), hz ? hzChip(hz) : '—'], [t('pd.perm.resume_min'), t('pd.resume.' + der)], [t('pd.perm.auth'), hz && HRANK[hz] >= 2 ? t('pd.perm.needs_haz') : t('pd.perm.standard')], [t('pd.perm.run'), hz && HRANK[hz] >= 2 ? t('pd.perm.run_haz') : t('pd.perm.run_std')]];
  if (op && hz && HRANK[hz] >= 2) { const tg = op.params.find((p) => p.limit_target); if (tg) { const el = effectiveLimit(tg.limit_target, PD.profile.status === 'withdrawn' ? null : PD.profile, node.bound_max_abs || null); rows.push([t('pd.perm.coverage'), el.covered ? chip('ok', '✔', t('pd.cov.covered')) : chip('err', '✖', t('pd.cov.uncovered'))], [t('pd.perm.effective'), el.effective ? h('span', null, ltr('±' + el.effective + ' su'), ' (' + t('pd.src.' + el.source) + ')') : '—']); } }
  return h('div', null, h('dl', { class: 'dl' }, rows.flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)])), h('p', { class: 'help' }, t('pd.perm.derived_note')));
}

/* widget extensions: wrap the Phase 1A renderer; unknown widgets still fall through to its visible placeholder */
const _renderNodeBase = renderNode;
renderNode = function (schema, value, ptr, ctx, parent, required) {
  const hn = hintOf(schema), w = hn.widget; const emit = (v, s) => ctx.onChange(ptr, v, !!s);
  const node = ctx.node;
  switch (w) {
    case 'integer': return wrapField({ ptr, hint: hn, required, control: (id, d) => h('input', { ...ctlAttrs(id, d, ptr, ctx), class: 'input mono qty-val', type: 'text', inputmode: 'numeric', dir: 'ltr', value: value === undefined ? '' : String(value), oninput: (e) => { const v = e.target.value.trim(); emit(v === '' ? undefined : /^\d+$/.test(v) ? parseInt(v, 10) : v); } }) });
    case 'expression': return wrapField({ ptr, hint: hn, required, control: (id, d) => h('input', { ...ctlAttrs(id, d, ptr, ctx), class: 'input mono', type: 'text', dir: 'ltr', spellcheck: 'false', autocomplete: 'off', value: value || '', placeholder: hn.expect === 'T' ? 'item.tp.settle' : '', oninput: (e) => { emit(e.target.value === '' ? undefined : e.target.value); } }), extra: h('div', { class: 'expr-info', 'data-expr': ptr }, exprInfo(node, ptr.slice(1))) });
    case 'select-from': return renderSelectFrom(schema, value, ptr, ctx, hn, required);
    case 'op-args': return renderOpArgs(value || {}, ptr, ctx, hn, node);
    case 'duration': return renderDuration(value, ptr, ctx, hn, required);
    case 'error-policy': return renderErrorPolicy(value || {}, ptr, ctx, hn, node);
    case 'resume-policy': return renderResumePolicy(value, ptr, ctx, hn, node);
    case 'bound': return renderBound(value, ptr, ctx, hn, node);
    default: return _renderNodeBase(schema, value, ptr, ctx, parent, required);
  }
};
function exprInfo(node, field) {
  if (!node || !node[field]) return '';
  const bad = PD.findings.find((f) => f.node === node.id && f.field === field && f.sev === 'error');
  return bad ? chip('err sm', '✖', findingText(bad).title || bad.code) : chip('ok sm', '✔', t('pd.expr.ok'));
}
function renderSelectFrom(schema, value, ptr, ctx, hn, required) {
  const opts = ({ roles: () => proc().roles.map((r) => [r.id, locText(r.title).text + ' (' + r.id + ')']), standard_roles: () => proc().roles.filter((r) => r.kind === 'standard').map((r) => [r.id, locText(r.title).text + ' (' + r.id + ')']), ops: () => PD.driver.ops.map((o) => [o.name, o.name + '  ' + o.hazard]), query_ops: () => PD.driver.ops.filter((o) => o.kind === 'query').map((o) => [o.name, o.name + '  ' + o.hazard]), tables: () => PD.tables.map((x) => [x.id, locText(x.title).text + ' (' + x.id + ')']) }[hn.options] || (() => []))();
  const known = opts.some(([v]) => v === value);
  return wrapField({ ptr, hint: hn, required, control: (id, d) => h('select', { ...ctlAttrs(id, d, ptr, ctx), class: 'input', 'aria-invalid': value && !known ? 'true' : null, onchange: (e) => { const v = e.target.value || undefined; if (hn.options === 'ops' || hn.options === 'query_ops') ctx.node.args = {}; ctx.onChange(ptr, v, true); } }, h('option', { value: '' }, t('choose')), value && !known ? h('option', { value, selected: true }, value + ' ⚠') : null, opts.map(([v, l]) => h('option', { value: v, selected: v === value ? true : null }, l))) });
}
function renderOpArgs(value, ptr, ctx, hn, node) {
  const op = node && opByName(PD.driver, node.op);
  const rows = !op ? [h('div', { class: 'muted pad' }, t('pd.args.choose_op'))] : !op.params.length ? [h('div', { class: 'muted pad' }, t('pd.args.none'))] : op.params.map((p) => {
    const pp = ptr + '/' + p.name; const id = 'arg-' + p.name;
    const input = h('input', { id, class: 'input mono', type: 'text', dir: 'ltr', 'data-ptr': pp, spellcheck: 'false', disabled: ctx.readOnly ? true : null, 'aria-describedby': id + '-h', value: value[p.name] || '', oninput: (e) => ctx.onChange(pp, e.target.value === '' ? undefined : e.target.value, false) });
    const tokens = p.type === 'enum' ? h('div', { class: 'tok-row' }, Object.keys(p.tokens).map((k) => btn(k, () => ctx.onChange(pp, '"' + k + '"', true), 'ghost sm', { disabled: ctx.readOnly ? true : null, 'aria-label': t('pd.args.use') + ' ' + k }))) : null;
    return h('div', { class: 'field', 'data-field': pp }, h('label', { class: 'lbl', for: id }, ltr(p.name, 'mono'), ' ', chip('mut sm', '', p.type === 'quantity' ? t('pd.type') + ' quantity<' + p.dimension + '>' : p.type)), input,
      h('div', { class: 'help', id: id + '-h' }, p.bounds && p.bounds.$input ? [t('pd.args.bounds') + ' ', inputBadge(p.bounds.$input.replace(/^(MI-\d+).*/, '$1'))] : '', p.limit_target ? [' ', chip('hazard sm', '⛨', t('pd.args.limit'))] : ''), tokens, h('div', { class: 'field-msgs', 'data-msgs': pp }));
  });
  return h('div', { class: 'field', 'data-field': ptr }, h('div', { class: 'lbl' }, t(hn.label)), hn.help ? h('div', { class: 'help' }, t(hn.help)) : null, ...rows, h('div', { class: 'field-msgs', 'data-msgs': ptr }));
}
function renderDuration(value, ptr, ctx, hn, required) {
  const isIn = isInput(value); const q = value && value.value !== undefined ? value : { value: '', unit: 's' };
  return wrapField({ ptr, hint: hn, required, control: () => isIn ? h('div', { class: 'input-req' }, inputBadge(value.$input), ctx.readOnly ? null : btn(t('a.enter_values'), () => ctx.onChange(ptr, { value: '', unit: 's' }, true), 'ghost sm')) : h('div', null, qtyRow(q, ptr, ctx, 'T', (nq, s) => ctx.onChange(ptr, nq, s)), ctx.readOnly ? null : btn(t('a.mark_input_required'), () => ctx.onChange(ptr, { $input: 'MI-16' }, true), 'ghost sm')) });
}
function renderErrorPolicy(value, ptr, ctx, hn, node) {
  const hz = hazardOf(node, PD.driver); const eff = effectiveResume(node, PD.driver); const noRetry = (hz && HRANK[hz] >= 2) || eff === 'non_repeatable';
  const act = value.action || 'none';
  const sel = h('select', { class: 'input', id: 'pol-act', 'data-ptr': ptr + '/action', disabled: ctx.readOnly ? true : null, onchange: (e) => { const a = e.target.value; ctx.onChange(ptr, a === 'none' ? undefined : { ...value, action: a, max_attempts: a === 'retry' ? (value.max_attempts || 2) : undefined, backoff: a === 'retry' ? (value.backoff || '0.2') : undefined }, true); } },
    ['none', 'retry', 'escalate', 'skip', 'fail_run'].map((a) => h('option', { value: a, selected: a === act ? true : null, disabled: a === 'retry' && noRetry ? true : null }, t('pd.pol.' + a) + (a === 'retry' && noRetry ? ' — ' + t('pd.pol.no_retry') : ''))));
  return h('div', { class: 'field', 'data-field': ptr }, h('label', { class: 'lbl', for: 'pol-act' }, t(hn.label)), sel, noRetry ? h('div', { class: 'help warn' }, t('pd.pol.no_retry_why')) : null,
    act === 'retry' ? h('div', { class: 'row-wrap' }, h('label', { for: 'pol-n' }, t('pd.pol.attempts')), h('input', { id: 'pol-n', class: 'input mono qty-val', type: 'text', inputmode: 'numeric', dir: 'ltr', 'data-ptr': ptr + '/max_attempts', value: String(value.max_attempts || ''), disabled: ctx.readOnly ? true : null, oninput: (e) => ctx.onChange(ptr + '/max_attempts', /^\d+$/.test(e.target.value) ? parseInt(e.target.value, 10) : e.target.value, false) }), h('label', { for: 'pol-b' }, t('pd.pol.backoff')), h('input', { id: 'pol-b', class: 'input mono qty-val', type: 'text', dir: 'ltr', value: value.backoff || '', disabled: ctx.readOnly ? true : null, oninput: (e) => ctx.onChange(ptr + '/backoff', e.target.value, false) })) : null,
    h('div', { class: 'help' }, t('pd.pol.help_' + act)), h('div', { class: 'field-msgs', 'data-msgs': ptr }));
}
function renderResumePolicy(value, ptr, ctx, hn, node) {
  const der = derivedResume(node, PD.driver), eff = value || der;
  const sel = h('select', { class: 'input', id: 'res-sel', 'data-ptr': ptr, disabled: ctx.readOnly ? true : null, onchange: (e) => ctx.onChange(ptr, e.target.value, true) }, ['idempotent', 'resumable', 'non_repeatable'].map((r) => h('option', { value: r, selected: r === eff ? true : null, disabled: RRANK[r] < RRANK[der] ? true : null }, t('pd.resume.' + r) + (RRANK[r] < RRANK[der] ? ' — ' + t('pd.resume.weaker') : ''))));
  return h('div', { class: 'field', 'data-field': ptr }, h('label', { class: 'lbl', for: 'res-sel' }, t(hn.label)), sel, h('div', { class: 'help' }, t('pd.resume.derived', { p: t('pd.resume.' + der) })), h('div', { class: 'note info' }, h('strong', null, t('pd.resume.after') + ' '), t('pd.resume.beh_' + eff)), h('div', { class: 'field-msgs', 'data-msgs': ptr }));
}
function renderBound(value, ptr, ctx, hn, node) {
  const el = effectiveLimit('set_source_level.level', PD.profile.status === 'withdrawn' ? null : PD.profile, null);
  return wrapField({ ptr, hint: hn, required: false, control: (id, d) => h('div', { class: 'qty-row' }, h('input', { ...ctlAttrs(id, d, ptr, ctx), class: 'input mono qty-val', type: 'text', inputmode: 'decimal', dir: 'ltr', value: value || '', placeholder: el.effective ? '≤ ' + el.effective : '', oninput: (e) => ctx.onChange(ptr, e.target.value === '' ? undefined : e.target.value, false) }), h('span', { class: 'muted' }, 'su'), el.effective ? chip('hazard sm', '⛨', t('pd.bound.max', { v: el.effective.toString(), src: t('pd.src.' + el.source) })) : chip('err sm', '✖', t('pd.cov.uncovered'))) });
}
