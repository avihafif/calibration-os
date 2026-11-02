/* CalOS Procedure Designer DESIGN PROTOTYPE — designer workspace shell + bottom dock (validation, hazard path, recovery, versions, review). Non-operational. */
'use strict';
const DOCK_TABS = ['validation', 'hazard', 'recovery', 'versions', 'review'];
const STATE_FLOW = ['draft', 'in_review', 'approved', 'published'];

function renderDesigner() {
  const m = document.getElementById('pd-main'); if (!m) return; _dm = null;
  const pane = PD.pane || 'centre';
  m.replaceChildren(
    h('div', { class: 'ws-head' }, h('div', { class: 'grow' }, h('h1', { id: 'page-title', tabindex: '-1' }, locText(proc().title).text || proc().key), h('div', { class: 'chips-row' }, chip('mut', '#', 'v' + PD.draft.base + ' → ' + t('pd.rev', { n: PD.draft.rev })), reviewChip(), chip('sim', '◈', t('pd.mode_sim')), ltr(shortDigest(digestOf(proc())), 'mono'))),
      h('div', { class: 'row-wrap' }, iconBtn('↶', t('a.undo') + ' (Ctrl+Z)', undo, { disabled: !PD.undo.length || !editable() ? true : null }), iconBtn('↷', t('a.redo') + ' (Ctrl+Y)', redo, { disabled: !PD.redo.length || !editable() ? true : null }),
        h('div', { class: 'seg', role: 'group', 'aria-label': t('pd.view') }, ['canvas', 'outline'].map((v) => h('button', { type: 'button', class: 'btn sm' + (PD.centre === v ? ' on' : ''), 'aria-pressed': String(PD.centre === v), onclick: () => { PD.centre = v; renderDesigner(); } }, t('pd.view.' + v)))),
        h('label', { class: 'inline' }, h('input', { type: 'checkbox', checked: PD.compare.overlay ? true : null, onchange: (e) => { PD.compare.overlay = e.target.checked; _dm = null; renderDesigner(); } }), ' ', t('pd.compare_overlay')))),
    !editable() ? banner('info', PD.draft.state !== 'draft' ? t('pd.msg.frozen') : t('pd.msg.readonly')) : null,
    h('div', { class: 'pane-switch', role: 'group', 'aria-label': t('pd.panes') }, ['palette', 'centre', 'inspector'].map((p) => h('button', { type: 'button', class: 'btn sm' + (pane === p ? ' on' : ''), 'aria-pressed': String(pane === p), onclick: () => { PD.pane = p; renderDesigner(); } }, t('pd.pane.' + p)))),
    h('div', { class: 'designer', 'data-pane': pane }, h('aside', { id: 'pd-left', class: 'pane left' }, renderPalette()), h('div', { class: 'pane centre' }, h('div', { id: 'pd-centre', class: 'centre-scroll' }), h('p', { class: 'help kbd-help' }, t(PD.centre === 'canvas' ? 'pd.kbd.canvas' : 'pd.kbd.outline'))), h('aside', { id: 'pd-right', class: 'pane right', 'aria-label': t('pd.inspector') })),
    h('section', { id: 'pd-dock', class: 'dock', 'aria-label': t('pd.dock') }));
  renderCentre(); renderInspector(); refreshDock();
}
function reviewChip() { const s = PD.draft.state; return chip({ draft: 'mut', in_review: 'info', approved: 'ok' }[s] || 'mut', { draft: '✎', in_review: '⧗', approved: '✔' }[s] || '✎', t('st.' + s)); }
function refreshDock() {
  const d = document.getElementById('pd-dock'); if (!d) return; const c = countSev(PD.findings); const tab = PD.dock; const sc = d.querySelector('.dock-body') ? d.querySelector('.dock-body').scrollTop : 0;
  d.replaceChildren(h('div', { class: 'tabs', role: 'tablist', 'aria-label': t('pd.dock') }, DOCK_TABS.map((k) => h('button', { type: 'button', role: 'tab', class: 'tab' + (tab === k ? ' on' : ''), 'aria-selected': String(tab === k), onclick: () => { PD.dock = k; refreshDock(); } }, t('pd.dock.' + k), k === 'validation' ? h('span', { class: 'cnt ' + (c.error ? 'err' : c.warning ? 'warn' : 'ok') }, c.error ? '✖ ' + c.error : c.warning ? '⚠ ' + c.warning : '✔') : null))),
    h('div', { class: 'dock-body', role: 'tabpanel' }, { validation: validationPanel, hazard: hazardPanel, recovery: recoveryPanel, versions: versionsPanel, review: reviewPanel }[tab]()));
  d.querySelector('.dock-body').scrollTop = sc;
  const live = document.getElementById('sr-status'); if (live) live.textContent = c.error ? t('n_errors', { n: c.error }) : c.warning ? t('n_warnings', { n: c.warning }) : t('pd.valid');
  paintInspectorFindings();
}

/* ---------- validation ---------- */
function validationPanel() {
  const fs = PD.findings; const c = countSev(fs); const flt = PD.sevFilter || 'all'; const shown = fs.filter((f) => flt === 'all' || f.sev === flt);
  const stages = ['schema', 'refs', 'semantic', 'hazard', 'metrology', 'i18n'];
  return h('div', null, h('div', { class: 'row-wrap' }, chip(c.error ? 'err' : 'ok', c.error ? '✖' : '✔', t('n_errors', { n: c.error })), chip(c.warning ? 'warn' : 'mut', '⚠', t('n_warnings', { n: c.warning })), chip('info', 'ℹ', t('n_info', { n: c.info })), h('span', { class: 'spacer' }),
    h('div', { class: 'seg', role: 'group', 'aria-label': t('a.filter') }, ['all', 'error', 'warning', 'info'].map((k) => h('button', { type: 'button', class: 'btn sm' + (flt === k ? ' on' : ''), 'aria-pressed': String(flt === k), onclick: () => { PD.sevFilter = k; refreshDock(); } }, k === 'all' ? t('pd.all') : t('sev.' + k))))),
    h('div', { class: 'stage-row' }, stages.map((s) => { const n = fs.filter((f) => f.stage === s && f.sev !== 'info').length; return h('span', { class: 'chip ' + (n ? 'warn' : 'mut') + ' sm', title: t('pd.stage.' + s) }, t('pd.stage.' + s) + ' ' + n); })),
    shown.length ? h('ul', { class: 'findings' }, shown.map((f) => h('li', { class: 'finding ' + f.sev }, sevChip(f.sev), h('span', { class: 'ftxt' }, findingText({ ...f, params: f.params })), ' ', ltr('[' + f.code + ']', 'code'), f.node ? h('button', { type: 'button', class: 'link-btn', onclick: () => gotoFinding(f) }, t('pd.goto'), ' ', ltr(f.node, 'mono')) : null, f.fix === 'go_metrology' ? h('button', { type: 'button', class: 'link-btn', onclick: () => go('metrology') }, t('pd.fix.go_metrology')) : f.fix === 'go_safety' ? h('button', { type: 'button', class: 'link-btn', onclick: () => go('safety') }, t('pd.fix.go_safety')) : null))) : emptyState('pd.valid_title', 'pd.valid_body'));
}
function gotoFinding(f) { PD.sel = f.node; if (document.getElementById('pd-main') && PD.ws !== 'design') { go('design'); return; } PD.pane = 'inspector'; const tab = f.field ? (hintOf((STEP_CATALOG[findNode(proc(), f.node).node.type].schema.properties || {})[f.field]).tab || 'main') : 'main'; PD.selTab = tab; renderDesigner(); setTimeout(() => { const box = document.getElementById('pd-right'); if (box && f.field) locate(box, '/' + f.field); }, 20); }

/* ---------- hazard path / recovery ---------- */
function hazardPanel() {
  const hp = hazardPath(proc(), { driver: PD.driver, profile: profileForValidation() }); const ss = proc().lifecycle.safe_state;
  return h('div', null, h('p', { class: 'help' }, t('pd.haz.help')),
    hp.length ? h('table', { class: 'tbl', 'aria-label': t('pd.dock.hazard') }, h('thead', null, h('tr', null, ['pd.saf.step', 'pd.saf.op', 'pd.saf.hz', 'pd.f.resume', 'pd.saf.cov', 'pd.saf.l_eff'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, hp.map((x) => h('tr', null, h('td', null, h('button', { type: 'button', class: 'link-btn', onclick: () => select(x.node.id) }, nodeTitle(x.node))), h('td', null, ltr(x.op, 'mono')), h('td', null, hzChip(x.hazard)), h('td', null, t('pd.resume.' + effectiveResume(x.node, PD.driver))), h('td', null, x.covered ? chip('ok sm', '✔', t('pd.cov.covered')) : chip('err sm', '✖', t('pd.cov.uncovered'))), h('td', { class: 'mono' }, x.el && x.el.effective ? ltr('±' + x.el.effective + ' su (' + t('pd.src.' + x.el.source) + ')', 'mono') : '—'))))) : h('p', { class: 'muted' }, t('pd.saf.hp_none')),
    h('div', { class: 'row-wrap' }, ss.length ? chip('ok', '✔', t('pd.haz.safe_state_ok', { n: ss.length })) : chip(hp.length ? 'err' : 'mut', hp.length ? '✖' : '∅', t('pd.haz.safe_state_missing'))), h('p', null, h('a', { class: 'link', href: '#', onclick: (e) => { e.preventDefault(); go('safety'); } }, t('pd.haz.open_safety'))));
}
function recoveryPanel() {
  const rm = recoveryMatrix(proc(), PD.driver);
  return h('div', null, h('p', { class: 'help' }, t('pd.rec.help')), rm.length ? h('table', { class: 'tbl', 'aria-label': t('pd.dock.recovery') }, h('thead', null, h('tr', null, ['pd.saf.step', 'pd.saf.hz', 'pd.f.resume', 'pd.rec.after'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, rm.map((x) => h('tr', null, h('td', null, h('button', { type: 'button', class: 'link-btn', onclick: () => select(x.node.id) }, nodeTitle(x.node))), h('td', null, x.hazard ? hzChip(x.hazard) : '—'), h('td', null, t('pd.resume.' + x.policy)), h('td', null, t('pd.rec.beh.' + x.behavior)))))) : h('p', { class: 'muted' }, t('pd.rec.none')));
}

/* ---------- versions, compare, review ---------- */
function versionOptions() { return [...PD.versions.map((v) => ['v' + v.version, 'v' + v.version + ' · ' + t('st.published')]), ['draft', t('pd.draft_label')]]; }
function versionsPanel() {
  const a = versionProc(PD.compare.a), b = versionProc(PD.compare.b); const sel = (key) => h('select', { class: 'input sm', 'aria-label': t('pd.cmp.' + key), onchange: (e) => { PD.compare[key] = e.target.value; _dm = null; refreshDock(); renderCentre(); } }, versionOptions().map(([v, l]) => h('option', { value: v, selected: PD.compare[key] === v ? true : null }, l)));
  const rows = a && b ? diffProcedures(a, b) : []; const cl = a && b ? classifyProcDiff(rows, PD.driver) : { cls: 'none', why: [] };
  const bump = { none: null, editorial: 'patch', functional: 'minor', metrological: 'major', safety: 'major' }[cl.cls];
  return h('div', null, h('div', { class: 'row-wrap' }, h('label', { class: 'inline' }, t('pd.cmp.a') + ' ', sel('a')), h('span', { 'aria-hidden': 'true' }, '→'), h('label', { class: 'inline' }, t('pd.cmp.b') + ' ', sel('b')), h('span', { class: 'spacer' }), chip({ none: 'mut', editorial: 'mut', functional: 'info', metrological: 'warn', safety: 'err' }[cl.cls], cl.cls === 'safety' ? '⛨' : '△', t('pd.cls.' + cl.cls)), bump ? chip('mut sm', '', t('pd.cls.suggest', { v: nextVersion((PD.versions[PD.versions.length - 1] || {}).version, bump) })) : null),
    h('p', { class: 'help' }, t('pd.cls.help')), rows.length ? h('table', { class: 'tbl diff', 'aria-label': t('pd.dock.versions') }, h('thead', null, h('tr', null, ['pd.cmp.change', 'pd.saf.step', 'pd.cmp.detail'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, rows.map((r) => h('tr', { class: 'd-' + r.type }, h('td', null, chip({ added: 'ok sm', removed: 'err sm', changed: 'warn sm', moved: 'info sm' }[r.type], { added: '＋', removed: '－', changed: '≠', moved: '⇅' }[r.type], t('pd.cmp.' + r.type))), h('td', null, r.node ? h('button', { type: 'button', class: 'link-btn', onclick: () => { if (findNode(proc(), r.id)) select(r.id); } }, nodeTitle(r.node)) : ltr(r.id, 'mono'), ' ', r.node ? ltr(r.id, 'mono') : null), h('td', null, r.type === 'changed' ? (r.fields || []).map((f) => ltr(f + ': ' + short(r.before && r.before[f]) + ' → ' + short(r.after && r.after[f]), 'mono')).flatMap((x) => [x, h('br')]) : r.type === 'moved' ? ltr(r.from + ' → ' + r.to, 'mono') : '—'))))) : emptyState('pd.cmp.none_title', 'pd.cmp.none_body'));
}
const short = (v) => (v === undefined ? '∅' : (typeof v === 'object' ? JSON.stringify(v) : String(v)).slice(0, 48));

function reviewPanel() {
  const d = PD.draft, c = countSev(PD.findings), cls = classifyProcDiff(diffProcedures(PD.versions[PD.versions.length - 1].proc, d.proc), PD.driver).cls; const idx = STATE_FLOW.indexOf(d.state);
  const needSafety = cls === 'safety'; const hasEv = PD.sim.run && PD.draft.sealedDigest === digestOf(proc()) && isDone(PD.sim.run);
  const steps = h('ol', { class: 'flow', 'aria-label': t('pd.rev.flow') }, STATE_FLOW.map((s, i) => h('li', { class: i < idx ? 'done' : i === idx ? 'cur' : '', 'aria-current': i === idx ? 'step' : null }, h('span', { class: 'flow-n', 'aria-hidden': 'true' }, i < idx ? '✔' : String(i + 1)), t('st.' + s))));
  const act = [];
  if (d.state === 'draft') act.push(!pcan('submit') ? reasonBtn(t('pd.rev.submit'), t('pd.rev.need_submit'), 'primary') : c.error ? reasonBtn(t('pd.rev.submit'), t('pd.rev.fix_errors', { n: c.error }), 'primary') : btn(t('pd.rev.submit'), () => governedConfirm({ title: t('pd.rev.submit'), effect: t('pd.rev.submit_effect', { cls: t('pd.cls.' + cls) }), digest: digestOf(proc()), reasonRequired: true, confirmLabel: t('pd.rev.submit'), onConfirm: (reason) => { d.state = 'in_review'; d.submittedBy = PD.persona; d.log = [...(d.log || []), { at: 'submit', by: PD.persona, reason }]; toast(t('pd.rev.submitted')); renderDesigner(); } }), 'primary'));
  if (d.state === 'in_review') {
    const mine = d.submittedBy === PD.persona;
    act.push(!pcan('approve') ? reasonBtn(t('a.approve'), t('pd.rev.need_approver'), 'primary') : mine ? reasonBtn(t('a.approve'), t('pd.rev.sod'), 'primary') : btn(t('a.approve'), () => governedConfirm({ title: t('a.approve'), effect: t('pd.rev.approve_effect'), digest: digestOf(proc()), reasonRequired: true, confirmLabel: t('a.approve'), onConfirm: (reason) => { d.approvals = [...(d.approvals || []), { role: PD.persona, reason }]; if (!needSafety || d.approvals.some((a) => a.role === 'safety')) d.state = 'approved'; toast(d.state === 'approved' ? t('pd.rev.approved') : t('pd.rev.approval_recorded')); renderDesigner(); } }), 'primary'));
    act.push(!pcan('approve') ? null : btn(t('pd.rev.reject'), () => governedConfirm({ title: t('pd.rev.reject'), effect: t('pd.rev.reject_effect'), reasonRequired: true, confirmLabel: t('pd.rev.reject'), danger: true, onConfirm: () => { d.state = 'draft'; d.approvals = []; toast(t('pd.rev.rejected')); renderDesigner(); } }), 'ghost danger'));
  }
  if (d.state === 'approved') act.push(!pcan('publish') ? reasonBtn(t('pd.rev.publish'), t('pd.rev.need_publisher'), 'primary') : btn(t('pd.rev.publish'), publishDraft, 'primary'));
  const rows = [[t('pd.rev.r_validation'), c.error ? chip('err sm', '✖', t('n_errors', { n: c.error })) : chip('ok sm', '✔', t('pd.valid'))], [t('pd.rev.r_class'), chip({ none: 'mut', editorial: 'mut', functional: 'info', metrological: 'warn', safety: 'err' }[cls] + ' sm', '△', t('pd.cls.' + cls))], [t('pd.rev.r_approvers'), needSafety ? t('pd.rev.req_safety') : t('pd.rev.req_std')], [t('pd.rev.r_evidence'), hasEv ? chip('ok sm', '✔', t('pd.rev.ev_yes', { id: PD.sim.run.id })) : chip('mut sm', '∅', t('pd.rev.ev_no'))], [t('pd.rev.r_release'), chip('err sm', '⛔', t('pd.rev.prod_blocked')), ' ', t('pd.rev.prod_why')]];
  return h('div', null, steps, h('dl', { class: 'dl' }, rows.flatMap(([k, ...v]) => [h('dt', null, k), h('dd', null, ...v)])), h('div', { class: 'row-wrap' }, ...act.filter(Boolean)),
    d.log && d.log.length ? h('ul', { class: 'plain' }, d.log.map((l) => h('li', { class: 'muted sm' }, t('pd.persona.' + l.by) + ': ' + l.reason))) : null, h('p', { class: 'help' }, t('pd.rev.note')));
}
function publishDraft() {
  const d = PD.draft, prev = PD.versions[PD.versions.length - 1]; const cls = classifyProcDiff(diffProcedures(prev.proc, d.proc), PD.driver).cls; const bump = { none: 'patch', editorial: 'patch', functional: 'minor', metrological: 'major', safety: 'major' }[cls]; const ver = nextVersion(prev.version, bump);
  governedConfirm({ title: t('pd.rev.publish'), effect: t('pd.rev.publish_effect', { v: ver }), digest: digestOf(d.proc), reasonRequired: true, confirmLabel: t('pd.rev.publish'), onConfirm: () => {
    PD.versions.push({ version: ver, proc: cloneJ(d.proc), digest: digestOf(d.proc), cls }); PD.draft = { proc: cloneJ(d.proc), state: 'draft', rev: 0, base: ver, approvals: [], log: [] }; PD.undo = []; PD.redo = []; PD.compare = { a: 'v' + ver, b: 'draft', overlay: false }; _dm = null; validateNow(); toast(t('pd.rev.published', { v: ver })); renderDesigner(); } });
}
