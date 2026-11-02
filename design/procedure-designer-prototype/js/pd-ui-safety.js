/* CalOS Procedure Designer DESIGN PROTOTYPE — Safety workspace. Non-operational. SIMULATOR-SCOPE pack and profile; no real limit of any instrument.
   Hard rule shown to users and enforced by tests: Absolute Hardware Limits are read-only here. There is no control, flag or path that edits or widens them. */
'use strict';
const SAFETY_TARGET = 'set_source_level.level';
const ahlEntry = () => AHL_PACK.entries.find((e) => e.target === SAFETY_TARGET);
function profEntry(p) { return (p && p.envelopes.find((e) => e.target === SAFETY_TARGET)) || null; }
function applyBounds() { const out = []; walk(PD.draft.proc, (n) => { if (n.type === 'source.apply') out.push(n); }); return out; }
function tpValues() { return PD.tables[0].rows.filter((r) => r.nominal && !isInput(r.nominal)).map((r) => ({ id: r.id, v: Dec.parse(r.nominal.value), u: r.nominal.unit })); }

function renderSafetyWorkspace() {
  const root = document.getElementById('pd-main'); if (!root) return; const prof = PD.profile; const withdrawn = prof.status === 'withdrawn';
  root.replaceChildren(
    h('div', { class: 'ws-head' }, h('div', { class: 'grow' }, h('h1', { id: 'page-title', tabindex: '-1' }, t('pd.saf.title')), h('p', { class: 'muted' }, t('pd.saf.lead'))), h('div', { class: 'chips-row' }, chip('hazard', '⛨', t('pd.saf.ro_chip')), chip('sim', '◈', t('pd.saf.sim_scope')))),
    h('div', { class: 'note hazard', role: 'note' }, h('strong', null, t('pd.saf.rule_title') + ' '), t('pd.saf.rule_body')),
    h('div', { class: 'saf-grid' }, ahlCard(), profileCard(), envelopeCard(), hazardCard(), blockedCard(), permsCard()));
}
function card(titleKey, ...kids) { return h('section', { class: 'card', 'aria-labelledby': 'c-' + titleKey }, h('h2', { id: 'c-' + titleKey }, t(titleKey)), ...kids); }

function ahlCard() {
  const e = ahlEntry();
  return card('pd.saf.ahl', h('dl', { class: 'dl' }, [[t('pd.saf.pack'), ltr(AHL_PACK.id + ' · v' + AHL_PACK.pack_version, 'mono')], [t('pd.saf.signed'), AHL_PACK.signed_by], [t('pd.saf.scope'), AHL_PACK.scope], [t('pd.saf.target'), ltr(e.target, 'mono')], [t('pd.saf.limit'), ltr('±' + e.max_abs.value + ' ' + e.max_abs.unit, 'mono')]].flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
    h('p', { class: 'help' }, t('pd.saf.ahl_help')), h('div', { class: 'row-wrap' }, chip('hazard', '🔒', t('pd.saf.ro_chip')), reasonBtn(t('pd.saf.edit_ahl'), t('pd.saf.edit_ahl_why'), 'sm')));
}
function profileCard() {
  const p = PD.profile, c = PD.profileCandidate, e = profEntry(p), ce = profEntry(c);
  const box = card('pd.saf.profile', h('div', { class: 'row-wrap' }, statusChip(p.status === 'approved' ? 'approved' : 'withdrawn'), chip('sim sm', '◈', t('pd.saf.sim_profile')), ltr(p.key + ' @ ' + p.pinned, 'mono')),
    h('dl', { class: 'dl' }, [[t('pd.saf.author'), t('pd.persona.' + p.author)], [t('pd.saf.approvals'), p.approvals.map((a) => t('pd.persona.' + a.role)).join(', ') || '—'], [t('pd.saf.envelope'), e ? ltr('±' + e.max_abs.value + ' su', 'mono') : '—'], [t('pd.saf.safe_state'), ltr(p.safe_state, 'mono')]].flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
    h('h3', null, t('pd.saf.interlocks')), h('ul', { class: 'plain' }, p.interlocks.map((i) => h('li', null, locText(i.text).text))),
    h('p', { class: 'help' }, t('pd.saf.select_help')),
    h('div', { class: 'field' }, h('label', { class: 'lbl', for: 'prof-sel' }, t('pd.saf.use_profile')), h('select', { id: 'prof-sel', class: 'input', disabled: !pcan('draft') || PD.draft.state !== 'draft' ? true : null }, h('option', { value: p.key, selected: true }, p.key + ' @ ' + p.pinned + ' · ' + t('st.' + p.status)), h('option', { value: '', disabled: true }, t('pd.saf.no_profile_opt'))), h('div', { class: 'help' }, t('pd.saf.use_help'))));
  if (p.status === 'withdrawn') box.append(banner('err', t('pd.saf.withdrawn_note')));
  /* governed lifecycle */
  box.append(h('h3', null, t('pd.saf.change')));
  if (!c) {
    const inp = h('input', { id: 'prop-v', class: 'input mono qty-val', dir: 'ltr', inputmode: 'decimal', 'aria-describedby': 'prop-h', disabled: !pcan('safety.manage') ? true : null, placeholder: e ? e.max_abs.value : '' }); const msg = h('div', { id: 'prop-m', class: 'field-msgs', role: 'status', 'aria-live': 'polite' });
    box.append(h('div', { class: 'field' }, h('label', { class: 'lbl', for: 'prop-v' }, t('pd.saf.propose_max')), h('div', { class: 'qty-row' }, inp, h('span', { class: 'muted' }, 'su'), pcan('safety.manage') ? btn(t('pd.saf.propose'), () => propose(inp.value, msg), 'primary') : reasonBtn(t('pd.saf.propose'), t('pd.saf.need_lsma'))), h('div', { class: 'help', id: 'prop-h' }, t('pd.saf.propose_help', { ahl: ahlEntry().max_abs.value })), msg));
  } else {
    const widening = ce && e && Dec.parse(ce.max_abs.value).cmp(Dec.parse(e.max_abs.value)) > 0;
    box.append(h('div', { class: 'note info' }, h('strong', null, t('pd.saf.candidate') + ' '), ltr('±' + ce.max_abs.value + ' su', 'mono'), ' ', statusChip('in_review'), widening ? [' ', chip('warn', '⚠', t('pd.saf.widening'))] : [' ', chip('ok sm', '✔', t('pd.saf.narrowing'))],
      h('div', { class: 'help' }, widening ? t('pd.saf.needs_two') : t('pd.saf.needs_one')), h('div', null, t('pd.saf.cand_approvals') + ' ', (c.approvals.length ? c.approvals.map((a) => chip('ok sm', '✔', t('pd.persona.' + a.role))) : [h('span', { class: 'muted' }, t('none_yet'))]))));
    const needSafety = !c.approvals.some((a) => a.role === 'safety'); const needQm = widening && !c.approvals.some((a) => a.role === 'quality');
    const row = [];
    if (needSafety) row.push(pcan('safety.approve') ? btn(t('pd.saf.approve_so'), () => approveCand('safety'), 'primary') : reasonBtn(t('pd.saf.approve_so'), t('pd.saf.need_so')));
    else if (needQm) row.push(pcan('safety.coapprove') ? btn(t('pd.saf.approve_qm'), () => approveCand('quality'), 'primary') : reasonBtn(t('pd.saf.approve_qm'), t('pd.saf.need_qm')));
    row.push(pcan('safety.manage') || pcan('safety.approve') ? btn(t('pd.saf.discard'), () => { PD.profileCandidate = null; renderSafetyWorkspace(); }, 'ghost') : null);
    box.append(h('div', { class: 'row-wrap' }, ...row));
  }
  box.append(h('div', { class: 'row-wrap' }, p.status === 'approved' ? (pcan('safety.withdraw') ? btn(t('pd.saf.withdraw'), withdrawProfile, 'danger') : reasonBtn(t('pd.saf.withdraw'), t('pd.saf.need_so'), 'danger')) : null));
  return box;
}
function propose(val, msg) {
  msg.replaceChildren(); val = String(val).trim(); const r = checkProfileEnvelope(SAFETY_TARGET, val);
  if (!r.ok && r.code !== 'PR-023') { msg.append(h('div', { class: 'field-msg err' }, '✖ ' + t('pd.saf.bad_value'), ' ', ltr('[' + r.code + ']', 'code'))); return; }
  if (!r.ok) { msg.append(h('div', { class: 'field-msg err' }, h('span', { 'aria-hidden': 'true' }, '✖ '), t('pd.saf.refused', { ahl: ahlEntry().max_abs.value }), ' ', ltr('[PR-023]', 'code'))); say(t('pd.saf.refused', { ahl: ahlEntry().max_abs.value })); return; }
  if (!/^\d+(\.\d+)?$/.test(val)) { msg.append(h('div', { class: 'field-msg err' }, '✖ ' + t('pd.saf.bad_value'))); return; }
  PD.profileCandidate = { ...cloneJ(PD.profile), status: 'in_review', author: 'lsma', approvals: [], pinned: nextSemver(PD.profile.pinned), envelopes: [{ target: SAFETY_TARGET, max_abs: { value: String(val).trim(), unit: 'su' } }] }; say(t('pd.saf.proposed')); renderSafetyWorkspace();
}
const nextSemver = (v) => { const [a, b, c] = v.split('.').map(Number); return a + '.' + (b + 1) + '.0'; };
function approveCand(role) {
  governedConfirm({ title: t('pd.saf.approve_title'), effect: t('pd.saf.approve_effect'), digest: digestOf(PD.profileCandidate), reasonRequired: true, confirmLabel: t('a.approve'), onConfirm: (reason) => {
    const c = PD.profileCandidate; c.approvals.push({ role, by: role, reason });
    const e = profEntry(PD.profile), ce = profEntry(c); const widening = Dec.parse(ce.max_abs.value).cmp(Dec.parse(e.max_abs.value)) > 0; const done = c.approvals.some((a) => a.role === 'safety') && (!widening || c.approvals.some((a) => a.role === 'quality'));
    if (done) { c.status = 'approved'; PD.profile = c; PD.profileCandidate = null; toast(t('pd.saf.activated')); validateNow(); } else toast(t('pd.saf.approval_recorded'));
    renderSafetyWorkspace(); refreshDock && refreshDock(); } });
}
function withdrawProfile() {
  governedConfirm({ title: t('pd.saf.withdraw_title'), effect: t('pd.saf.withdraw_effect'), digest: digestOf(PD.profile), reasonRequired: true, confirmLabel: t('pd.saf.withdraw'), danger: true, onConfirm: () => { PD.profile.status = 'withdrawn'; validateNow(); toast(t('pd.saf.withdrawn_toast')); renderSafetyWorkspace(); refreshDock && refreshDock(); } });
}

/* effective-envelope visual: SVG + a full text equivalent in a table (never colour or shape alone) */
function envelopeCard() {
  const a = Dec.parse(ahlEntry().max_abs.value); const pe = profEntry(PD.profile.status === 'withdrawn' ? null : PD.profile); const p = pe ? Dec.parse(pe.max_abs.value) : null;
  const bounds = applyBounds().filter((n) => n.bound_max_abs).map((n) => ({ id: n.id, v: Dec.parse(n.bound_max_abs) })); const pb = bounds.length ? bounds.reduce((m, x) => (x.v.cmp(m.v) < 0 ? x : m)) : null;
  const eff = effectiveLimit(SAFETY_TARGET, PD.profile.status === 'withdrawn' ? null : PD.profile, pb ? pb.v.toString() : null);
  const tps = tpValues(); const N = (d) => parseFloat(d.toString()); const W = 560, H = 150, X0 = 30, X1 = W - 30, R = Math.max(12, N(a) + 2);
  const x = (v) => X0 + ((v + R) / (2 * R)) * (X1 - X0); const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, ...kids) => { const n = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => v !== null && v !== undefined && n.setAttribute(k, String(v))); kids.forEach((k) => k && n.append(k)); return n; };
  const label = (cx, y, txt, cls) => el('text', { x: cx, y, class: 'env-t ' + (cls || ''), 'text-anchor': 'middle' }, document.createTextNode(txt));
  const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'env-svg', role: 'img', 'aria-label': t('pd.saf.env_alt', { ahl: a.toString(), prof: p ? p.toString() : t('pd.saf.none'), eff: eff.effective ? eff.effective.toString() : t('pd.saf.none') }) });
  svg.append(el('rect', { x: X0, y: 20, width: X1 - X0, height: 100, class: 'env-forbid' }));
  svg.append(el('rect', { x: x(-N(a)), y: 20, width: x(N(a)) - x(-N(a)), height: 100, class: 'env-ahl' }));
  if (p) svg.append(el('rect', { x: x(-N(p)), y: 36, width: x(N(p)) - x(-N(p)), height: 68, class: 'env-prof' }));
  if (pb) svg.append(el('rect', { x: x(-N(pb.v)), y: 50, width: x(N(pb.v)) - x(-N(pb.v)), height: 40, class: 'env-proc' }));
  svg.append(el('line', { x1: x(0), x2: x(0), y1: 16, y2: 124, class: 'env-zero' }));
  [['AHL', N(a), 18], p ? ['P', N(p), 34] : null, pb ? ['B', N(pb.v), 48] : null].filter(Boolean).forEach(([l, v, y]) => { svg.append(label(x(v), y - 4, l + ' ' + v, 'env-edge'), label(x(-v), y - 4, l + ' −' + v, 'env-edge')); });
  tps.forEach((tp, i) => { const v = N(tp.v); const ok = eff.effective && Math.abs(v) <= N(eff.effective); svg.append(el('path', { d: 'M' + x(v) + ' 110 l-6 12 h12 z', class: ok ? 'env-tp ok' : 'env-tp bad' }), label(x(v), 138, tp.id + (ok ? '' : ' ✖'), ok ? '' : 'env-bad')); });
  const rows = [[t('pd.saf.l_ahl'), '±' + a, t('pd.src.ahl'), 'hazard'], [t('pd.saf.l_prof'), p ? '±' + p : t('pd.saf.none_uncovered'), t('pd.src.profile'), 'info'], [t('pd.saf.l_proc'), pb ? '±' + pb.v + ' (' + pb.id + ')' : t('pd.saf.none'), t('pd.src.procedure'), 'mut'], [t('pd.saf.l_eff'), eff.effective ? '±' + eff.effective : t('pd.saf.blocked'), eff.effective ? t('pd.src.' + eff.source) : t('pd.saf.fail_closed'), eff.effective ? 'ok' : 'err']];
  return card('pd.saf.envelope_title', h('p', { class: 'help' }, t('pd.saf.env_help')), h('div', { class: 'env-wrap' }, svg),
    h('table', { class: 'tbl', 'aria-label': t('pd.saf.envelope_title') }, h('thead', null, h('tr', null, ['pd.saf.layer', 'pd.saf.value', 'pd.saf.source'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, rows.map(([l, v, s, k]) => h('tr', null, h('td', null, chip(k + ' sm', k === 'hazard' ? '⛨' : k === 'ok' ? '✔' : k === 'err' ? '✖' : '▭', l)), h('td', { class: 'mono' }, ltr(v + (v.startsWith('±') ? ' su' : ''), 'mono')), h('td', null, s))))),
    h('h3', null, t('pd.saf.tps')), h('ul', { class: 'plain' }, tps.map((tp) => { const ok = eff.effective && tp.v.abs ? tp.v.abs().cmp(eff.effective) <= 0 : false; return h('li', null, ok ? chip('ok sm', '✔', t('pd.saf.inside')) : chip('err sm', '✖', t('pd.saf.outside')), ' ', ltr(tp.id + ' = ' + tp.v + ' ' + tp.u, 'mono')); })),
    h('p', { class: 'help' }, t('pd.saf.env_note')));
}
function hazardCard() {
  const hp = hazardPath(PD.draft.proc, { driver: PD.driver, profile: PD.profile.status === 'withdrawn' ? null : PD.profile });
  return card('pd.saf.hazard_path', h('p', { class: 'help' }, t('pd.saf.hp_help')), hp.length ? h('table', { class: 'tbl', 'aria-label': t('pd.saf.hazard_path') }, h('thead', null, h('tr', null, ['pd.saf.step', 'pd.saf.op', 'pd.saf.hz', 'pd.saf.cov'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, hp.map((x) => h('tr', null, h('td', null, h('a', { class: 'link', href: '#', onclick: (e) => { e.preventDefault(); PD.sel = x.node.id; go('design'); } }, nodeTitle(x.node))), h('td', null, ltr(x.op, 'mono')), h('td', null, hzChip(x.hazard)), h('td', null, x.covered ? chip('ok sm', '✔', t('pd.cov.covered')) : chip('err sm', '✖', t('pd.cov.uncovered'))))))) : h('p', { class: 'muted' }, t('pd.saf.hp_none')));
}
function blockedCard() {
  const run = PD.sim.run; const blocks = run ? run.events.filter((e) => e.kind === 'safety.violation' || e.kind === 'broker.refused') : [];
  return card('pd.saf.blocked', h('p', { class: 'help' }, t('pd.saf.blocked_help')), h('ol', { class: 'order' }, ['pd.saf.o1', 'pd.saf.o2', 'pd.saf.o3', 'pd.saf.o4'].map((k) => h('li', null, t(k)))),
    blocks.length ? h('ul', { class: 'plain' }, blocks.map((b) => h('li', null, chip('err sm', '⛔', t('pd.saf.blocked_chip')), ' ', ltr(b.op || '', 'mono'), ' ', b.value ? t('pd.saf.blocked_detail', { v: b.value, l: b.limit, s: t('pd.src.' + b.source) }) : b.reason || b.state || ''))) : h('p', { class: 'muted' }, t('pd.saf.blocked_none')));
}
function permsCard() {
  const rows = [['pd.persona.lsma', '✔', '—', '—'], ['pd.persona.safety', '—', '✔', '—'], ['pd.persona.quality', '—', '—', '✔ ' + t('pd.saf.if_widening')], ['pd.persona.hazauth', '—', '—', '—'], ['pd.persona.engineer', '—', '—', '—'], ['pd.persona.admin', '✖', '✖', '✖']];
  return card('pd.saf.perms', h('p', { class: 'help' }, t('pd.saf.perms_help')), h('div', { class: 'tbl-scroll' }, h('table', { class: 'tbl matrix', 'aria-label': t('pd.saf.perms') }, h('thead', null, h('tr', null, ['pd.saf.role', 'pd.saf.p_author', 'pd.saf.p_approve', 'pd.saf.p_coapprove'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, rows.map((r) => h('tr', null, h('th', { scope: 'row' }, t(r[0])), r.slice(1).map((c) => h('td', null, c))))))), h('p', { class: 'help' }, t('pd.saf.perms_note')));
}
