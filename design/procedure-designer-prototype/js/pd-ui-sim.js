/* CalOS Procedure Designer DESIGN PROTOTYPE — Simulation Lab. Non-operational: synthetic instrument, synthetic data, no hardware access.
   Everything produced here is flagged simulated; the report preview is not approvable and its watermark cannot be turned off. */
'use strict';
const TERMINAL = ['completed', 'failed', 'aborted'];
const isDone = (r) => r && TERMINAL.includes(r.state);
const FAULT_KINDS = ['timeout', 'garbled', 'error_queue', 'disconnect', 'unsafe_level'];
const simRun = () => PD.sim.run;
function stopTimer() { if (PD.sim.timer) { clearInterval(PD.sim.timer); PD.sim.timer = null; } PD.sim.auto = false; }
function simConfig() { return { proc: PD.draft.proc, driver: PD.driver, tables: PD.tables, profile: profileForValidation(), scenario: PD.sim.scenario, faults: PD.sim.faults, runNo: PD.sim.runNo + 1, requiredLocales: POL(), seed: SIM_PROFILE.seed }; }
function canRun() { const e = PD.findings.filter((f) => f.sev === 'error'); return { ok: e.length === 0, n: e.length }; }
function startRun() {
  stopTimer(); const c = canRun(); if (!c.ok) { toast(t('pd.sim.blocked_by_errors', { n: c.n }), 'err'); return null; }
  PD.sim.runNo++; PD.sim.run = createRun(simConfig()); PD.sim.evSel = null; PD.draft.sealedDigest = digestOf(PD.draft.proc); say(t('pd.sim.started')); return PD.sim.run;
}
const stepOnce = () => { const r = simRun(); if (!r || isDone(r) || r.state === 'interrupted' || r.state === 'waiting_prompt') return null; return advance(r); };
function driveUntil(stop, limit) { const r = simRun(); let n = 0, e; while ((e = stepOnce())) { if (stop(e) || ++n > (limit || 20000)) break; if (e.waiting) break; } return e; }
function simAction(kind) {
  let r = simRun(); if (!r || (isDone(r) && kind !== 'noop')) { if (['run', 'into', 'over', 'continue', 'event', 'toend'].includes(kind)) r = startRun(); if (!r) return renderSimWorkspace(); }
  if (r.state === 'interrupted') return;
  if (kind === 'event') stepOnce();
  else if (kind === 'into') driveUntil((e) => e.kind === 'node.start');
  else if (kind === 'over') { const starts = r.events.filter((e) => e.kind === 'node.start'); const d = starts.length ? starts[starts.length - 1].depth : -1; driveUntil((e) => e.kind === 'node.start' && e.depth <= d && e !== starts[starts.length - 1]); }
  else if (kind === 'continue') { let first = true; driveUntil((e) => { if (e.kind === 'node.start' && PD.sim.breakpoints.has(e.node) && !first) return true; first = false; return false; }); }
  else if (kind === 'toend') driveUntil(() => false);
  else if (kind === 'run') { PD.sim.auto = true; PD.sim.timer = setInterval(tick, 50); }
  renderSimWorkspace();
}
function tick() { const r = simRun(); if (!r || isDone(r) || r.state === 'waiting_prompt' || r.state === 'interrupted') { stopTimer(); renderSimWorkspace(); return; } let hit = false; for (let i = 0; i < (PD.sim.speed === 'slow' ? 1 : 14); i++) { const e = stepOnce(); if (!e) break; if (e.kind === 'node.start' && PD.sim.breakpoints.has(e.node)) { hit = true; break; } if (e.waiting) break; } if (hit) { stopTimer(); say(t('pd.sim.at_breakpoint')); } renderSimWorkspace(); }
function doInterrupt() { stopTimer(); const r = simRun(); if (r && interrupt(r)) { say(t('pd.sim.interrupted')); } renderSimWorkspace(); }
function doResume(choice) { const r = simRun(); if (r && resume(r, choice)) { say(t('pd.sim.resumed')); } else toast(t('pd.sim.resume_refused'), 'err'); renderSimWorkspace(); }
function addFault(kind, op, persistent) { const f = { id: 'F' + (PD.sim.faults.length + 1) + '-' + kind, kind, op: op || '*', persistent: !!persistent, after: 0 }; PD.sim.faults.push(f); const r = simRun(); if (r && !isDone(r)) r.faults.push({ ...f, used: false }); say(t('pd.sim.fault_added')); renderSimWorkspace(); }

/* ---------- value / event formatting ---------- */
function fmtVal(v) { if (!v) return '—'; if (v.k === 'q') return fmtQ(v); if (v.k === 'rec') return '{' + Object.entries(v.fields).map(([k, x]) => k + ': ' + fmtVal(x)).join(', ') + '}'; if (v.k === 'list') return '[' + v.items.map(fmtVal).join(', ') + ']'; if (v.k === 'bool') return String(v.v); if (v.k === 'input') return t('input_required') + ' ' + v.mi; return String(v.v); }
const BASE_KEYS = new Set(['seq', 't', 'kind', 'node', 'lane', 'depth', 'h', 'simulated']);
function evDetail(e) { return Object.entries(e).filter(([k]) => !BASE_KEYS.has(k)).map(([k, v]) => k + '=' + (typeof v === 'object' ? JSON.stringify(v) : v)).join('  '); }
const EV_TONE = { error: 'err', 'safety.violation': 'err', 'run.failing': 'err', 'broker.refused': 'err', 'retry.exhausted': 'err', 'teardown.error': 'err', 'safe_state.unconfirmed': 'err', retry: 'warn', 'run.interrupted': 'warn', 'run.resumed': 'info', 'fault.injected': 'sim', 'safe_state.confirmed': 'ok', 'run.end': 'info', wire: 'mut', 'node.start': 'mut', 'node.end': 'mut' };

/* ---------- workspace ---------- */
function renderSimWorkspace() {
  const root = document.getElementById('pd-main'); if (!root) return; const keep = root.querySelector('.trace-scroll'); const sc = keep ? keep.scrollTop : 0; const r = simRun();
  root.replaceChildren(
    h('div', { class: 'ws-head' }, h('div', { class: 'grow' }, h('h1', { id: 'page-title', tabindex: '-1' }, t('pd.sim.title')), h('p', { class: 'muted' }, t('pd.sim.lead'))), h('div', { class: 'chips-row' }, chip('sim', '◈', t('pd.sim.nonop'), t('pd.sim.nonop_help')), chip('mut', '∅', t('pd.sim.no_hw')))),
    h('div', { class: 'note sim', role: 'note' }, h('strong', null, t('pd.sim.banner_title') + ' '), t('pd.sim.banner_body')),
    statusStrip(r), controlBar(r), r && r.state === 'waiting_prompt' ? promptPanel(r) : null, r && r.state === 'interrupted' ? resumePanel(r) : null, r && r.failure && isDone(r) ? failureCard(r) : null,
    h('div', { class: 'sim-grid' }, h('div', { class: 'sim-side' }, setupCard(), execOutline(r)), h('div', { class: 'sim-main' }, simTabs(r))));
  const ns = root.querySelector('.trace-scroll'); if (ns) ns.scrollTop = PD.sim.auto && ns.scrollHeight ? ns.scrollHeight : sc;
}
function statusStrip(r) {
  const st = r ? r.state : 'idle'; const out = r ? r.sim.state.output : 'off'; const tone = { idle: 'mut', running: 'info', waiting_prompt: 'warn', interrupted: 'warn', completed: 'ok', failed: 'err', aborted: 'err' }[st];
  const stale = r && PD.draft.sealedDigest && PD.draft.sealedDigest !== digestOf(PD.draft.proc);
  return h('div', { class: 'status-strip', role: 'status', 'aria-live': 'polite' }, chip(tone, { idle: '○', running: '▶', waiting_prompt: '⏸', interrupted: '⚡', completed: '✔', failed: '✖', aborted: '⊘' }[st], t('pd.sim.state.' + st)), r ? chip('mut', '#', r.id) : null,
    r ? h('span', null, h('span', { class: 'muted sm' }, t('pd.sim.clock') + ' '), ltr((r.clock / 1000).toFixed(3) + ' s', 'mono'), ' · ', h('span', { class: 'muted sm' }, t('pd.sim.events') + ' '), ltr(String(r.events.length), 'mono')) : null,
    r ? h('span', null, h('span', { class: 'muted sm' }, t('pd.sim.output') + ' '), chip(out === 'on' ? 'hazard' : 'ok', out === 'on' ? '⛨' : '✔', out === 'on' ? t('pd.sim.out_on') : t('pd.sim.out_off'))) : null,
    r ? h('span', { class: 'muted sm' }, t('pd.sim.chain') + ' ', ltr(r.journalHash.slice(0, 8), 'mono')) : null, stale ? chip('warn', '⚠', t('pd.sim.stale'), t('pd.sim.stale_help')) : null);
}
function controlBar(r) {
  const done = isDone(r), idle = !r, running = r && r.state === 'running' && PD.sim.auto, wait = r && r.state === 'waiting_prompt', intr = r && r.state === 'interrupted', c = canRun();
  const B = (label, key, cls, dis, why) => (dis ? reasonBtn(label, why, cls) : btn(label, () => simAction(key), cls));
  const noStart = !c.ok && (idle || done);
  return h('div', { class: 'controls', role: 'toolbar', 'aria-label': t('pd.sim.controls') },
    noStart ? reasonBtn('▶ ' + t('pd.sim.run'), t('pd.sim.blocked_by_errors', { n: c.n }), 'primary') : (running ? btn('⏸ ' + t('pd.sim.pause'), () => { stopTimer(); renderSimWorkspace(); }, 'primary') : btn('▶ ' + t(idle || done ? 'pd.sim.run' : 'pd.sim.resume_run'), () => simAction('run'), 'primary', { disabled: wait || intr ? true : null })),
    btn('⤓ ' + t('pd.sim.into'), () => simAction('into'), '', { disabled: wait || intr || running || (!c.ok && (idle || done)) ? true : null, title: t('pd.sim.into_help') }), btn('⤼ ' + t('pd.sim.over'), () => simAction('over'), '', { disabled: wait || intr || running || (!c.ok && (idle || done)) ? true : null, title: t('pd.sim.over_help') }),
    btn('· ' + t('pd.sim.event'), () => simAction('event'), '', { disabled: wait || intr || running || idle || done ? true : null, title: t('pd.sim.event_help') }), btn('⏭ ' + t('pd.sim.continue'), () => simAction('continue'), '', { disabled: wait || intr || running || idle || done ? true : null, title: t('pd.sim.continue_help') }),
    btn('⏩ ' + t('pd.sim.to_end'), () => simAction('toend'), '', { disabled: wait || intr || (!c.ok && (idle || done)) ? true : null }),
    h('span', { class: 'spacer' }), h('label', { class: 'inline' }, t('pd.sim.speed') + ' ', h('select', { class: 'input sm', onchange: (e) => (PD.sim.speed = e.target.value) }, ['fast', 'slow'].map((s) => h('option', { value: s, selected: PD.sim.speed === s ? true : null }, t('pd.sim.speed.' + s))))),
    btn('⚡ ' + t('pd.sim.interrupt'), doInterrupt, 'danger ghost', { disabled: !r || done || intr ? true : null, title: t('pd.sim.interrupt_help') }), btn('↺ ' + t('pd.sim.reset'), () => { stopTimer(); PD.sim.run = null; PD.sim.evSel = null; renderSimWorkspace(); say(t('pd.sim.reset_done')); }, 'ghost', { disabled: idle ? true : null }));
}
function promptPanel(r) {
  const p = r.prompt; return h('section', { class: 'prompt-panel', role: 'alertdialog', 'aria-labelledby': 'pp-t' }, h('h2', { id: 'pp-t' }, chip('warn', '⏸', t('pd.sim.prompt_title'))), h('p', null, p.type === 'escalate' ? t('pd.sim.escalate_body', { code: p.code }) : locText(p.text).text || t('pd.sim.prompt_generic')), h('p', { class: 'help' }, t('pd.sim.prompt_help')),
    h('div', { class: 'row-wrap' }, p.choices.map((c, i) => btn(t('pd.sim.choice.' + c), () => { answerPrompt(r, c); if (PD.sim.auto) { /* keep animating */ } renderSimWorkspace(); }, i === 0 ? 'primary' : (c === 'abort' ? 'danger' : ''), { autofocus: i === 0 ? true : null }))));
}
function resumePanel(r) {
  const plan = resumePlan(r); const nm = plan.inflight ? plan.inflight.split(/[:/#]/).filter(Boolean).pop() : null; const f = nm ? findNode(r.proc, nm) : null; let choice = null;
  const dec = plan.decision ? h('fieldset', { class: 'rec' }, h('legend', null, t('pd.sim.decision')), h('p', null, t('pd.sim.decision_help', { node: f ? nodeTitle(f.node) : nm })), h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'dec', value: 'rerun', onchange: () => { choice = 'rerun'; document.getElementById('res-btn').removeAttribute('aria-disabled'); } }), h('span', null, t('pd.sim.decision_rerun'))), h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'dec', value: 'abort', onchange: () => { choice = 'abort'; } }), h('span', null, t('pd.sim.decision_abort')))) : null;
  return h('section', { class: 'resume-panel', 'aria-labelledby': 'rp-t' }, h('h2', { id: 'rp-t' }, chip('warn', '⚡', t('pd.sim.resume_title'))), h('p', null, t('pd.sim.resume_body', { node: f ? nodeTitle(f.node) : '—' })), h('ol', { class: 'order' }, plan.steps.map((s) => h('li', null, t(s.key)))), dec,
    h('div', { class: 'row-wrap' }, btn(t('pd.sim.resume_go'), () => { if (plan.decision && choice === 'abort') { r.state = 'aborted'; r.outcome = 'aborted'; r.failure = { code: 'E_OPERATOR_ABORT', message: 'Operator chose not to repeat a non-repeatable step', node: nm, attempt: 1 }; renderSimWorkspace(); return; } doResume(choice); }, 'primary', { id: 'res-btn' })), h('p', { class: 'help' }, t('pd.sim.resume_note')));
}
function failureCard(r) {
  const x = explainFailure(r); const n = x.node ? findNode(r.proc, x.node) : null; const safeOk = x.safe.includes('safe_state.confirmed');
  return h('section', { class: 'fail-card', role: 'region', 'aria-labelledby': 'fc-t' }, h('h2', { id: 'fc-t' }, chip('err', '✖', t('pd.sim.why_failed'))),
    h('dl', { class: 'dl' }, [[t('pd.sim.f.code'), ltr(x.code, 'mono')], [t('pd.sim.f.what'), t('pd.err.' + x.code, x.extra || {})], [t('pd.sim.f.where'), n ? h('a', { class: 'link', href: '#', onclick: (e) => { e.preventDefault(); PD.sel = x.node; go('design'); } }, nodeTitle(n.node), ' ', ltr('(' + x.node + ')', 'mono')) : '—'], [t('pd.sim.f.policy'), t('pd.pol.' + x.policy) + (x.attempts > 1 ? ' · ' + t('pd.sim.f.attempts', { n: x.attempts }) : '')], [t('pd.sim.f.safe'), safeOk ? chip('ok', '✔', t('pd.sim.safe_ok')) : chip('err', '✖', t('pd.sim.safe_unconfirmed'))]].flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
    x.fixes.length ? h('div', null, h('h3', null, t('pd.sim.fixes')), h('ul', { class: 'plain' }, x.fixes.map((f) => h('li', null, f.kind === 'metrology' ? h('a', { class: 'link', href: '#', onclick: (e) => { e.preventDefault(); PD.metTab = 'points'; go('metrology'); } }, t(f.label, { mi: f.mi || '' })) : f.kind === 'safety' ? h('a', { class: 'link', href: '#', onclick: (e) => { e.preventDefault(); go('safety'); } }, t(f.label)) : h('a', { class: 'link', href: '#', onclick: (e) => { e.preventDefault(); PD.sel = f.node; PD.selTab = f.label === 'pd.fix.add_policy' ? 'errors' : 'main'; go('design'); } }, t(f.label)), f.mi ? [' ', inputBadge(f.mi)] : null)))) : null);
}
function setupCard() {
  const ops = ['*', ...PD.driver.ops.map((o) => o.name)];
  const fkind = h('select', { id: 'fk', class: 'input sm' }, FAULT_KINDS.map((k) => h('option', { value: k }, t('pd.fault.' + k)))); const fop = h('select', { id: 'fo', class: 'input sm' }, ops.map((o) => h('option', { value: o }, o === '*' ? t('pd.fault.any_op') : o))); const pers = h('input', { id: 'fp', type: 'checkbox' });
  return h('section', { class: 'card', 'aria-labelledby': 'su-t' }, h('h2', { id: 'su-t' }, t('pd.sim.setup')),
    h('div', { class: 'field' }, h('label', { class: 'lbl', for: 'sc-sel' }, t('pd.sim.scenario')), h('select', { id: 'sc-sel', class: 'input', onchange: (e) => { PD.sim.scenario = e.target.value; }, disabled: simRun() && !isDone(simRun()) ? true : null }, Object.keys(SIM_PROFILE.scenarios).map((k) => h('option', { value: k, selected: PD.sim.scenario === k ? true : null }, t('pd.sc.' + k)))), h('div', { class: 'help' }, t('pd.sim.scenario_help', { seed: SIM_PROFILE.seed }))),
    h('h3', null, t('pd.sim.faults')), h('p', { class: 'help' }, t('pd.sim.faults_help')),
    h('ul', { class: 'plain' }, PD.sim.faults.length ? PD.sim.faults.map((f, i) => h('li', { class: 'list-row' }, chip('sim sm', '◈', t('pd.fault.' + f.kind)), ' ', ltr(f.op === '*' ? t('pd.fault.any_op') : f.op, 'mono'), f.persistent ? chip('mut sm', '∞', t('pd.fault.persistent')) : null, h('span', { class: 'spacer' }), iconBtn('✕', t('a.remove'), () => { PD.sim.faults.splice(i, 1); renderSimWorkspace(); }))) : [h('li', { class: 'muted sm' }, t('none_yet'))]),
    h('div', { class: 'fault-form' }, h('label', { class: 'sr-only', for: 'fk' }, t('pd.sim.fault_kind')), fkind, h('label', { class: 'sr-only', for: 'fo' }, t('pd.sim.fault_op')), fop, h('label', { class: 'inline' }, pers, ' ', t('pd.fault.persistent')), btn('+ ' + t('pd.sim.inject'), () => addFault(fkind.value, fop.value, pers.checked), 'sm')),
    h('p', { class: 'help' }, t('pd.sim.inject_help')));
}
function execOutline(r) {
  const vm = viewModel(PD.draft.proc); const cur = r && r.currentNode;
  return h('section', { class: 'card', 'aria-labelledby': 'eo-t' }, h('h2', { id: 'eo-t' }, t('pd.sim.exec_outline')), h('ul', { class: 'exec-ol' }, vm.map((v) => { const n = findNode(PD.draft.proc, v.id).node; const st = simStatus(n.id); return h('li', { class: (cur === n.id && r && !isDone(r) ? 'cur ' : '') + (st ? 's-' + st : ''), style: 'padding-inline-start:' + (6 + v.depth * 14) + 'px' }, h('button', { type: 'button', class: 'link-btn', onclick: () => { PD.sel = n.id; go('design'); } }, st ? simGlyph(st) : h('span', { class: 'sim-st none', 'aria-hidden': 'true' }, '·'), ' ', nodeTitle(n)), PD.sim.breakpoints.has(n.id) ? h('span', { class: 'bp', 'aria-label': t('pd.bp') }, '●') : null); })), h('p', { class: 'help' }, t('pd.sim.bp_help')));
}
function simTabs(r) {
  const tabs = ['trace', 'vars', 'wire', 'result', 'report']; const cur = PD.sim.tab;
  return h('div', null, h('div', { class: 'tabs', role: 'tablist', 'aria-label': t('pd.sim.title') }, tabs.map((k) => h('button', { type: 'button', role: 'tab', class: 'tab' + (cur === k ? ' on' : ''), 'aria-selected': String(cur === k), onclick: () => { PD.sim.tab = k; renderSimWorkspace(); } }, t('pd.sim.tab.' + k)))),
    h('div', { role: 'tabpanel' }, !r ? emptyState('pd.sim.empty_title', 'pd.sim.empty_body') : { trace: traceTab, vars: varsTab, wire: wireTab, result: resultTab, report: reportTab }[cur](r)));
}
function traceTab(r) {
  const q = PD.sim.filter.toLowerCase(); const hide = PD.sim.hideNoise !== false; const evs = r.events.filter((e) => (!hide || !['node.start', 'node.end', 'wire', 'broker.check', 'lane.start'].includes(e.kind) || e.kind === 'node.start') && (!q || (e.kind + ' ' + (e.node || '') + ' ' + evDetail(e)).toLowerCase().includes(q)));
  const sel = PD.sim.evSel !== null ? r.events.find((e) => e.seq === PD.sim.evSel) : null;
  return h('div', null, h('div', { class: 'row-wrap' }, h('input', { class: 'input sm', type: 'search', 'aria-label': t('a.filter'), placeholder: t('a.filter') + '…', value: PD.sim.filter, oninput: (e) => { PD.sim.filter = e.target.value; const p = e.target.selectionStart; renderSimWorkspace(); const i2 = document.querySelector('.sim-main input[type=search]'); i2.focus(); i2.setSelectionRange(p, p); } }), h('label', { class: 'inline' }, h('input', { type: 'checkbox', checked: hide ? true : null, onchange: (e) => { PD.sim.hideNoise = e.target.checked; renderSimWorkspace(); } }), ' ', t('pd.sim.hide_noise')), h('span', { class: 'muted sm', role: 'status' }, t('n_rows', { n: evs.length }))),
    h('div', { class: 'trace-scroll', tabindex: '0', role: 'region', 'aria-label': t('pd.sim.tab.trace') }, h('table', { class: 'tbl trace', 'aria-label': t('pd.sim.tab.trace') }, h('thead', null, h('tr', null, ['pd.sim.c.seq', 'pd.sim.c.time', 'pd.sim.c.event', 'pd.sim.c.step', 'pd.sim.c.detail'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, evs.map((e) => h('tr', { class: 'row' + (sel && sel.seq === e.seq ? ' sel' : ''), tabindex: '0', 'aria-selected': String(!!(sel && sel.seq === e.seq)), onclick: () => { PD.sim.evSel = e.seq; renderSimWorkspace(); }, onkeydown: (ev2) => { if (ev2.key === 'Enter') { PD.sim.evSel = e.seq; renderSimWorkspace(); } } }, h('td', { class: 'mono' }, ltr(String(e.seq))), h('td', { class: 'mono' }, ltr((e.t / 1000).toFixed(3))), h('td', null, chip((EV_TONE[e.kind] || 'mut') + ' sm', '', t('pd.ev.' + e.kind))), h('td', null, e.node ? ltr(e.node, 'mono') : '—'), h('td', { class: 'detail' }, ltr(evDetail(e), 'mono'))))))),
    sel ? h('div', { class: 'ev-detail', role: 'region', 'aria-label': t('pd.sim.ev_detail') }, h('h3', null, t('pd.ev.' + sel.kind), ' ', ltr('#' + sel.seq, 'mono')), h('dl', { class: 'dl' }, Object.entries(sel).flatMap(([k, v]) => [h('dt', null, ltr(k, 'mono')), h('dd', null, ltr(typeof v === 'object' ? JSON.stringify(v) : String(v), 'mono'))])), h('p', { class: 'help' }, t('pd.sim.hash_note'))) : null);
}
function varsTab(r) {
  const rows = [...r.vars.entries()].filter(([k]) => !k.endsWith('_samples'));
  const w = h('input', { id: 'watch', class: 'input mono', dir: 'ltr', placeholder: 'var.reading', value: PD.sim.watch || '', oninput: (e) => { PD.sim.watch = e.target.value; document.getElementById('watch-out').replaceChildren(...watchOut(r)); } });
  return h('div', null, rows.length ? h('table', { class: 'tbl', 'aria-label': t('pd.sim.tab.vars') }, h('thead', null, h('tr', null, ['pd.sim.v.name', 'pd.sim.v.type', 'pd.sim.v.value'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, rows.map(([k, v]) => h('tr', null, h('td', null, ltr(k, 'mono')), h('td', null, ltr(v.k === 'q' ? 'quantity<' + dimName(unitDim(v.u)) + '>' : v.k, 'mono')), h('td', null, ltr(fmtVal(v), 'mono')))))) : h('p', { class: 'muted' }, t('pd.sim.v.none')),
    h('div', { class: 'field' }, h('label', { class: 'lbl', for: 'watch' }, t('pd.sim.watch')), w, h('div', { class: 'help' }, t('pd.sim.watch_help')), h('div', { id: 'watch-out', role: 'status', 'aria-live': 'polite' }, ...watchOut(r))),
    h('h3', null, t('pd.sim.instr_state')), h('div', { class: 'row-wrap' }, Object.entries(r.sim.state).map(([k, v]) => chip('mut', '', k + ' = ' + v))), h('p', { class: 'help' }, t('pd.sim.instr_note')));
}
function watchOut(r) { const s = (PD.sim.watch || '').trim(); if (!s) return []; try { return [chip('ok', '✔', fmtVal(evalIn(r, { item: null }, s)))]; } catch (e) { return [chip('err sm', '✖', e.code || 'ERR'), ' ', e.message]; } }
function wireTab(r) {
  return h('div', null, banner('sim', t('pd.sim.wire_note')), r.wire.length ? h('div', { class: 'trace-scroll', tabindex: '0', role: 'region', 'aria-label': t('pd.sim.tab.wire') }, h('table', { class: 'tbl', 'aria-label': t('pd.sim.tab.wire') }, h('thead', null, h('tr', null, ['pd.sim.c.seq', 'pd.sim.c.time', 'pd.sim.w.op', 'pd.sim.w.text', 'pd.sim.w.reply', 'pd.sim.w.status'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, r.wire.map((w) => h('tr', { class: w.blocked ? 'blocked' : '' }, h('td', { class: 'mono' }, ltr(String(w.seq))), h('td', { class: 'mono' }, ltr((w.t / 1000).toFixed(3))), h('td', null, ltr(w.op, 'mono')), h('td', null, ltr(w.wire, 'mono')), h('td', null, w.raw ? ltr(w.raw, 'mono') : '—'), h('td', null, w.blocked ? chip('err sm', '⛔', t('pd.sim.w.not_sent')) : chip(w.status === 'ok' ? 'ok sm' : 'err sm', w.status === 'ok' ? '✔' : '✖', w.status || '—'), ' ', chip('sim sm', '◈', t('pd.sim.flag')))))))) : h('p', { class: 'muted' }, t('pd.sim.w.none')));
}
function resultTab(r) {
  const x = r.failure ? explainFailure(r) : null; const pts = r.dataset.points;
  return h('div', null, h('div', { class: 'row-wrap' }, chip(r.outcome === 'completed' ? 'ok' : r.outcome ? 'err' : 'mut', r.outcome === 'completed' ? '✔' : r.outcome ? '✖' : '○', r.outcome ? t('pd.sim.state.' + r.outcome) : t('pd.sim.state.' + r.state)), chip('sim', '◈', t('pd.sim.flag')), chip('mut', '', t('pd.sim.limit_not_conformity'))),
    pts.length ? dataGrid({ id: 'simres', label: t('pd.sim.tab.result'), columns: [{ key: 'id', label: 'pd.res.point', text: (p) => p.id }, { key: 'nominal', label: 'pd.met.f.nominal', text: (p) => p.nominal, render: (p) => ltr(p.nominal, 'mono') }, { key: 'reading', label: 'pd.res.measured', text: (p) => p.reading, render: (p) => ltr(p.reading, 'mono') }, { key: 'dev', label: 'pd.res.deviation', text: (p) => p.deviation, render: (p) => ltr(p.deviation, 'mono') }, { key: 'range', label: 'pd.res.range', text: (p) => p.lower + ' … ' + p.upper, render: (p) => ltr(p.lower + ' … ' + p.upper, 'mono') }, { key: 'lbl', label: 'pd.res.label', text: (p) => (p.within ? t('pd.res.within') : t('pd.res.outside')), render: (p) => chip(p.within ? 'ok sm' : 'err sm', p.within ? '✔' : '✖', p.within ? t('pd.res.within') : t('pd.res.outside')) }], rows: pts }) : h('p', { class: 'muted' }, t('pd.res.none')),
    x ? h('p', null, t('pd.sim.partial_note')) : null, h('p', { class: 'help' }, t('pd.sim.result_note')));
}
function reportTab(r) {
  const rep = buildReport(r, digestOf(PD.draft.proc)); const wm = rep.watermark.join('  ·  ');
  const marks = Array.from({ length: 6 }, (_, i) => h('div', { class: 'wm', 'aria-hidden': 'true', style: 'inset-block-start:' + (6 + i * 17) + '%' }, wm));
  return h('div', null, banner('err', t('pd.rep.banner')),
    h('article', { class: 'report', 'aria-label': t('pd.rep.title') }, ...marks, h('div', { class: 'report-body' }, h('header', null, h('h2', null, t('pd.rep.title')), h('div', { class: 'wm-line', role: 'note' }, rep.watermark.map((x) => h('span', { class: 'chip sim' }, x)))),
      h('dl', { class: 'dl' }, [[t('pd.rep.run'), ltr(rep.run, 'mono')], [t('pd.rep.scenario'), t('pd.sc.' + rep.scenario)], [t('pd.rep.outcome'), t('pd.sim.state.' + (rep.outcome || r.state)) + (rep.partial ? ' · ' + t('pd.rep.partial') : '')], [t('pd.rep.proc'), ltr(shortDigest(rep.procedureDigest), 'mono')], [t('pd.rep.uncertainty'), chip('mut', '∅', t('pd.rep.not_evaluated'))], [t('pd.rep.conformity'), chip('mut', '∅', t('pd.rep.not_evaluated'))]].flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
      rep.points.length ? h('table', { class: 'tbl', 'aria-label': t('pd.rep.title') }, h('thead', null, h('tr', null, ['pd.res.point', 'pd.res.measured', 'pd.res.deviation', 'pd.res.label'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, rep.points.map((p) => h('tr', null, h('td', null, ltr(p.id, 'mono')), h('td', null, ltr(p.reading, 'mono')), h('td', null, ltr(p.deviation, 'mono')), h('td', null, p.within ? t('pd.res.within') : t('pd.res.outside')))))) : h('p', { class: 'muted' }, t('pd.res.none')),
      h('p', { class: 'help' }, t('pd.rep.reason')))),
    h('div', { class: 'row-wrap' }, reasonBtn(t('pd.rep.approve'), t('pd.rep.approve_why'), 'primary'), reasonBtn(t('pd.rep.issue'), t('pd.rep.approve_why')), reasonBtn(t('pd.rep.remove_wm'), t('pd.rep.wm_why'))), h('p', { class: 'help' }, t('pd.rep.flags', { s: String(rep.simulated), i: String(rep.issued), a: String(rep.approvable) })));
}
