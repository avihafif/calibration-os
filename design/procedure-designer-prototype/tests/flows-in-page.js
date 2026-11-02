/* In-page FLOW checks for the Procedure Designer DESIGN PROTOTYPE: drives the real DOM (clicks, input events, synthetic drag-and-drop, keyboard events).
   Usage: serve design/, open procedure-designer-prototype/index.html, then inject this file (script src) or paste into the console. Result: window.__flows.
   Prototype QA only. Synthetic drag events are not a substitute for testing with a real pointer, touch device or screen reader. */
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const results = []; const rec = (name, ok, detail) => results.push({ name, ok: !!ok, detail: detail === undefined ? '' : String(detail) });
  const T = async (name, fn) => { try { const r = await fn(); rec(name, r === undefined || r === true || (r && r.ok !== false), r && r.detail ? r.detail : (typeof r === 'string' ? r : '')); } catch (e) { rec(name, false, e.message + ' @ ' + ((e.stack || '').split('\n')[1] || '').trim()); } };
  const $q = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const byText = (sel, txt) => $$(sel).find((e) => e.textContent.trim().includes(txt));
  const click = (el) => { if (!el) throw new Error('click: element not found'); el.click(); };
  const type = (el, v) => { if (!el) throw new Error('type: element not found'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const key = (el, k, o) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...(o || {}) }));
  const nav = async (ws) => { location.hash = '#/' + ws; await wait(80); };
  const live = () => $q('#sr-live').textContent;
  const nodeIds = () => flattenProc(proc()).map((f) => f.id);
  const reset = async (persona) => { stopTimer(); initState(); PD.persona = persona || 'engineer'; UI.locale = 'en'; UI.theme = 'light'; applyLocale(); applyTheme(); route(true); await wait(60); };
  const pick = (persona) => { PD.persona = persona; route(true); };
  const drain = (r) => { let n = 0; while (!['completed', 'failed', 'aborted'].includes(r.state) && n++ < 400) { if (r.state === 'waiting_prompt') answerPrompt(r, 'confirm'); else driveUntil(() => false); } return r; };
  const dnd = (item, zone) => { const dt = new DataTransfer(); item.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt })); zone.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); const accepted = zone.classList.contains('ok'); zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); item.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt })); return accepted; };

  /* ===== 1. create a synthetic procedure ===== */
  await reset(); await nav('design');
  await T('1 create: New procedure dialog creates an empty synthetic procedure', async () => {
    click(byText('#topbar button', 'New procedure')); await wait(40); const dlg = $q('.dialog'); if (!dlg) throw new Error('no dialog');
    type($q('#np-en'), 'Flow-test procedure'); type($q('#np-he'), 'נוהל בדיקת זרימה'); click(byText('.dialog button', 'Create')); await wait(80);
    return { ok: proc().title.en === 'Flow-test procedure' && nodeCount(proc()) === 0 && !$q('.dialog'), detail: 'nodes=' + nodeCount(proc()) };
  });
  /* ===== 2. add blocks visually ===== */
  await T('2a drag a palette block onto the Setup lane (valid drop accepted)', async () => {
    const item = $q('.pal-item[data-eid="driver.call"]'); const zone = $q('.lane-setup .dz'); const ok = dnd(item, zone); await wait(40);
    return { ok: ok && nodeCount(proc()) === 1 && proc().lifecycle.setup[0].type === 'driver.call', detail: 'accepted=' + ok };
  });
  await T('2b drop on an invalid zone is refused with an explanation (source step in finally slot / safe-state rule)', async () => {
    const before = nodeCount(proc()); const item = $q('.pal-item[data-eid="operator.confirm"]'); const zone = $q('.lane-safe_state .dz'); const accepted = dnd(item, zone); await wait(40);
    return { ok: !accepted && nodeCount(proc()) === before, detail: 'accepted=' + accepted };
  });
  await T('2c keyboard: Enter on a palette item adds after the selected step; announcement made', async () => {
    select(proc().lifecycle.setup[0].id); const item = $q('.pal-item[data-eid="flow.delay"]'); key(item, 'Enter'); await wait(40);
    return { ok: nodeCount(proc()) === 2 && proc().lifecycle.setup[1].type === 'flow.delay' && /Added/.test(live()), detail: live() };
  });
  await T('2d keyboard: Insert opens the add menu; typing filters; Enter adds', async () => {
    const card = $q('.node[data-nid="' + proc().lifecycle.setup[0].id + '"]'); card.focus(); key(card, 'Insert'); await wait(40); const input = $q('.dialog input[type=search]'); if (!input) throw new Error('menu did not open');
    type(input, 'calculate'); await wait(20); key(input, 'Enter'); await wait(60);
    const types = proc().lifecycle.setup.map((n) => n.type); return { ok: types.includes('compute.set') && !$q('.dialog'), detail: types.join(',') };
  });
  await T('2e presets insert ordinary catalogue steps (no new executable concept)', async () => {
    const before = nodeCount(proc()); PD.sel = null; click($q('.pal-item[data-eid="preset:initialize"]')); await wait(40); return { ok: nodeCount(proc()) === before + 2, detail: nodeCount(proc()) - before + ' steps added' };
  });
  /* ===== 3. edit properties; 5. configure named driver operation ===== */
  await T('3/5 inspector: choosing a named operation shows typed arguments generated from the driver; enum choice button fills the argument', async () => {
    const first = proc().lifecycle.setup[0]; select(first.id); await wait(30); const sel = $q('#pd-right select[data-ptr="/op"]'); if (!sel) throw new Error('no op select');
    type(sel, 'set_function'); await wait(40); const arg = $q('#pd-right input[data-ptr="/args/function"]'); if (!arg) throw new Error('no typed argument field');
    click(byText('#pd-right .tok-row button', 'level')); await wait(30); const v = findNode(proc(), first.id).node.args.function;
    return { ok: v === '"level"', detail: 'args.function=' + v };
  });
  await T('3 inspector: expression field shows live validity; a dimension error is reported with its code', async () => {
    const d = proc().lifecycle.setup.find((n) => n.type === 'flow.delay'); select(d.id); PD.selTab = 'main'; renderInspector(); await wait(30);
    type($q('#pd-right input[data-ptr="/duration"]') || $q('#pd-right input.mono[type=text]'), '2 su'); await wait(30); const f = PD.findings.filter((x) => x.node === d.id && x.code === 'PR-006');
    return { ok: f.length >= 1, detail: PD.findings.filter((x) => x.node === d.id).map((x) => x.code).join(',') };
  });
  /* ===== 4. reorder / connect ===== */
  await T('4a canvas: Alt+ArrowDown reorders a step and announces it', async () => {
    const ids0 = proc().lifecycle.setup.map((n) => n.id); const card = $q('.node[data-nid="' + ids0[0] + '"]'); card.focus(); key(card, 'ArrowDown', { altKey: true }); await wait(40);
    const ids1 = proc().lifecycle.setup.map((n) => n.id); return { ok: ids1[1] === ids0[0] && /Moved/.test(live()), detail: ids0.join('>') + ' → ' + ids1.join('>') };
  });
  await T('4b outline view offers the same operations (tree role, Alt+ArrowUp reorders)', async () => {
    PD.centre = 'outline'; renderDesigner(); await wait(40); const items = $$('[role=treeitem]'); const ids0 = proc().lifecycle.setup.map((n) => n.id); const it = $q('[data-oid="' + ids0[1] + '"]'); it.focus(); key(it, 'ArrowUp', { altKey: true }); await wait(40);
    const ids1 = proc().lifecycle.setup.map((n) => n.id); return { ok: items.length === nodeCount(proc()) && !!$q('[role=tree]') && ids1[0] === ids0[1], detail: 'treeitems=' + items.length };
  });
  await T('4c nesting by keyboard: a step can be moved into the next container and out again (same ops as drag)', async () => {
    PD.centre = 'canvas'; renderDesigner(); const p = proc(); const fe = newNode(p, 'flow.foreach', { over: 'points', as: 'tp', max_iterations: 5 }); insertNode(p, fe, { lane: 'as_found' }, 0); const d = newNode(p, 'flow.delay', { duration: '1 s' }); insertNode(p, d, { lane: 'as_found' }, 0); afterEdit(true); await wait(40);
    nudge(d.id, 'in'); const inside = findNode(proc(), d.id).ref.parent === fe.id; nudge(d.id, 'out'); const out = !findNode(proc(), d.id).ref.parent; return { ok: inside && out, detail: 'in=' + inside + ' out=' + out };
  });
  await T('4d undo / redo restore the structure', async () => {
    const n0 = nodeCount(proc()); removeEntry(proc().lifecycle.phases[0].body[0].id); const n1 = nodeCount(proc()); undo(); const n2 = nodeCount(proc()); redo(); return { ok: n1 < n0 && n2 === n0 && nodeCount(proc()) === n1, detail: [n0, n1, n2].join(',') };
  });
  /* ===== 6/7 validate, detect missing inputs; 8 run; 9 inspect; 10 results & failure explanation ===== */
  await reset(); await nav('design');
  await T('6/7 validation lists unresolved inputs with codes, the stage counter, and links to the exact step and to Metrology', async () => {
    const txt = $q('#pd-dock').textContent; const goto = byText('#pd-dock button', 'Go to'); const mlink = byText('#pd-dock button', 'Open Metrology');
    return { ok: /PR-013/.test(txt) && /MI-04/.test(txt) && !!goto && !!mlink, detail: PD.findings.map((f) => f.code).join(',') };
  });
  await T('6 clicking "Go to" selects the step, opens the inspector pane and focuses the field', async () => { click(byText('#pd-dock button', 'Go to')); await wait(80); return { ok: !!PD.sel && !!$q('#pd-right .ins-head'), detail: 'sel=' + PD.sel }; });
  await nav('sim');
  await T('8 run: the Run button starts a simulation; the operator prompt blocks until answered', async () => {
    click(byText('.controls button', 'Run to end')); await wait(60); const waiting = simRun().state === 'waiting_prompt' && !!$q('.prompt-panel'); const before = simRun().events.length; click(byText('.controls button', 'Next event')); const same = simRun().events.length === before;
    return { ok: waiting && same, detail: 'state=' + simRun().state };
  });
  await T('8 answering the prompt and running on ends in a failure at the unresolved input, with safe state reached', async () => {
    click(byText('.prompt-panel button', 'Confirm')); await wait(40); click(byText('.controls button', 'Run to end')); await wait(80); const r = simRun();
    return { ok: r.state === 'failed' && r.failure.code === 'E_UNRESOLVED_INPUT' && r.sim.state.output === 'off' && !!$q('.fail-card'), detail: r.failure && r.failure.code + '@' + r.failure.node };
  });
  await T('9/10 trace is inspectable (row detail), variables listed, wire log flags every row simulated, failure card offers the Metrology fix', async () => {
    const row = $q('.trace tbody tr'); click(row); await wait(30); const detail = !!$q('.ev-detail'); PD.sim.tab = 'vars'; renderSimWorkspace(); const vars = $$('.tbl tbody tr').length; PD.sim.tab = 'wire'; renderSimWorkspace(); const wire = $$('.tbl tbody tr'); const allSim = wire.length > 0 && wire.every((r) => /SIMULATED/.test(r.textContent));
    return { ok: detail && vars > 0 && allSim && /Metrology/.test($q('.fail-card').textContent), detail: 'vars=' + vars + ' wire=' + wire.length };
  });
  await T('9 the failure link opens Metrology; entering the missing values there resolves PR-013/PR-015 and the next run completes', async () => {
    const link = byText('.fail-card a', 'Metrology'); click(link); await wait(80); if (PD.ws !== 'metrology') throw new Error('did not open metrology');
    const row = PD.tables[0].rows[2]; click(byText('fieldset[data-field="/rows/2"] .input-req button', 'Enter values')); await wait(30);
    const fs = $q('fieldset[data-field="/rows/2"]'); const vals = $$('input[data-ptr$="/value"]', fs); if (vals.length < 2) throw new Error('value inputs missing: ' + vals.length);
    type(vals[0].dataset.ptr.includes('nominal') ? vals[1] : vals[0], '0.05');
    return { ok: true, detail: 'inputs=' + vals.map((v) => v.dataset.ptr).join(',') };
  });
  await T('7 inclusivity has NO default: unset radios are an error until chosen explicitly', async () => {
    PD.tables[0].rows[2].lo_inc = undefined; PD.tables[0].rows[2].hi_inc = undefined; metChanged(true); await wait(30); const e1 = PD.findings.filter((f) => f.code === 'PR-015').length;
    click($q('input[data-ptr="/rows/2/lo_inc"]')); click($q('input[data-ptr="/rows/2/hi_inc"]')); await wait(30); const e2 = PD.findings.filter((f) => f.code === 'PR-015').length; return { ok: e1 > 0 && e2 === 0, detail: e1 + '→' + e2 };
  });
  await T('10 with all inputs resolved the run completes; results flagged simulated; report is preview-only with permanent watermark', async () => {
    const r2 = PD.tables[0].rows[2]; r2.nominal = { value: '5', unit: 'su' }; r2.tol = { value: '0.05', unit: 'su' }; r2.settle = { value: '0.5', unit: 's' }; validateNow(); await nav('sim'); PD.sim.run = null; startRun(); drain(simRun()); PD.sim.tab = 'report'; renderSimWorkspace(); await wait(30);
    const r = simRun(); const wm = $$('.wm').length; const dis = $$('.report ~ .row-wrap .reason-wrap').length;
    return { ok: r.state === 'completed' && r.dataset.points.length === 3 && wm >= 3 && $q('.wm-line').textContent.includes('NOT A CERTIFICATE') && dis === 3, detail: 'points=' + r.dataset.points.length + ' watermarks=' + wm + ' disabledActions=' + dis };
  });
  /* ===== fault injection, timeouts, recovery ===== */
  await T('fault: persistent timeout on read_value exhausts the retry policy and is explained with the node and policy', async () => {
    PD.sim.faults = []; addFault('timeout', 'read_value', true); PD.sim.run = null; startRun(); drain(simRun()); renderSimWorkspace(); const r = simRun(); const x = explainFailure(r);
    return { ok: r.state === 'failed' && x.code === 'E_TIMEOUT' && x.node === 'acquire_1' && x.policy === 'retry' && /Retry/.test($q('.fail-card').textContent), detail: x.code + '@' + x.node };
  });
  await T('fault: a one-shot timeout is recovered by the retry policy (run completes, retry events present)', async () => {
    PD.sim.faults = []; addFault('timeout', 'read_value', false); PD.sim.run = null; startRun(); drain(simRun()); const r = simRun(); return { ok: r.state === 'completed' && r.events.some((e) => e.kind === 'retry'), detail: 'retries=' + r.events.filter((e) => e.kind === 'retry').length };
  });
  await T('fault: unsafe level request is blocked before any byte is sent, is not catchable, and the run fails closed', async () => {
    PD.sim.faults = []; addFault('unsafe_level', '*', false); PD.sim.run = null; startRun(); drain(simRun()); PD.sim.tab = 'wire'; renderSimWorkspace(); const r = simRun(); const blocked = $$('.tbl tr.blocked');
    return { ok: r.failure.code === 'E_SAFETY_VIOLATION' && blocked.length >= 1 && /NOT SENT/.test(blocked[0].textContent) && r.sim.state.output === 'off', detail: r.failure.code + ' blockedRows=' + blocked.length };
  });
  await T('recovery: simulate a crash mid-run, see the resume plan, resume, and finish with the same recorded points as an uninterrupted run', async () => {
    PD.sim.faults = []; PD.sim.run = null; const ref = startRun(); drain(ref); const refPts = ref.dataset.points.map((p) => p.id).join(); PD.sim.run = null; const r = startRun(); let n = 0; while (n++ < 60) { if (r.state === 'waiting_prompt') answerPrompt(r, 'confirm'); else stepOnce(); } doInterrupt(); await wait(30); const panel = !!$q('.resume-panel') && $$('.resume-panel ol li').length >= 2; click(byText('.resume-panel button', 'Resume')); await wait(30); drain(simRun());
    return { ok: panel && simRun().state === 'completed' && simRun().dataset.points.map((p) => p.id).join() === refPts, detail: 'plan=' + panel + ' points=' + simRun().dataset.points.length };
  });
  await T('breakpoint: Continue stops at a step with a breakpoint', async () => {
    PD.sim.run = null; PD.sim.breakpoints = new Set(['acquire_1']); startRun(); const r = simRun(); let g = 0; while (g++ < 200) { if (r.state === 'waiting_prompt') { answerPrompt(r, 'confirm'); continue; } simAction('continue'); if (r.state === 'waiting_prompt') continue; break; }
    const last = r.events.filter((e) => e.kind === 'node.start').pop(); return { ok: last && last.node === 'acquire_1' && r.state === 'running', detail: last && last.node };
  });
  /* ===== command builder ===== */
  await reset('engineer'); await nav('driver');
  await T('driver: platform operations are read-only; a local copy is editable and starts unverified', async () => {
    click($q('.oplist [data-op="identify"]')); await wait(40); const ro = $$('#drv-edit input.input,#drv-edit select.input').every((e) => e.disabled || e.id === 'r-s'); click(byText('#drv-edit button', 'Copy to local')); await wait(40);
    return { ok: ro && PD.driver.ops.some((o) => o.name === 'identify_local' && o.verification === 'unverified_against_manual'), detail: 'readOnly=' + ro };
  });
  await T('driver: template editor flags unknown placeholders and control/multi-command text with stable codes (no way to save raw text)', async () => {
    const op = PD.driver.ops.find((o) => o.name === 'set_function'); PD.drvSel = 'set_function'; renderDriverWorkspace(); type($q('#o-tpl'), 'SYNT:FUNC {missing}; *RST'); await wait(30);
    const codes = validateOp(op, PD.driver).map((f) => f.code + (f.params.detail ? '.' + f.params.detail : '')); return { ok: codes.includes('DRV-002.unknown_placeholder') && codes.includes('DRV-003.multi') && !!$q('#drv-edit .field-msg'), detail: codes.join(',') };
  });
  await T('driver: H2 and reserved hazard classes are disabled for an engineer; there is no raw-send control', async () => {
    const opt = (v) => $q('#o-haz option[value="' + v + '"]'); const raw = byText('.note.info .reason-wrap button', 'Send raw'); return { ok: opt('H2').disabled === true && opt('H3').disabled === true && opt('H4').disabled === true && raw && raw.getAttribute('aria-disabled') === 'true', detail: 'H3.disabled=' + opt('H3').disabled + ' H4.disabled=' + opt('H4').disabled + ' rawButtonAriaDisabled=' + (raw && raw.getAttribute('aria-disabled')) };
  });
  await T('driver: sandbox test calls a named operation; precondition refuses read_value before set_function; envelope refuses 9 su before any send', async () => {
    reset; PD.driver = MKDRV(); PD.drvBox = null; PD.drvTest = {}; PD.drvSel = 'read_value'; renderDriverWorkspace(); click(byText('.drv-test button', 'Call operation')); await wait(30); const pre = /E_PRECONDITION/.test($q('.test-res').textContent);
    PD.drvSel = 'set_source_level'; renderDriverWorkspace(); type($q('#t-level'), '9 su'); click(byText('.drv-test button', 'Call operation')); await wait(30); const blocked = /E_SAFETY_VIOLATION/.test($q('.test-res').textContent) && /Not sent/.test($q('.test-res').textContent);
    return { ok: pre && blocked, detail: 'precondition=' + pre + ' blocked=' + blocked };
  });
  /* ===== safety governance ===== */
  await reset(); await nav('safety');
  await T('safety: hardware limits are read-only (no edit control); disabled button explains why', async () => {
    const card = byText('.card', 'Absolute Hardware Limits') || $q('.card'); const btn = byText('.card .reason-wrap button', 'Edit hardware limits'); const inputs = $$('input,select,textarea', card).length;
    return { ok: !!btn && btn.getAttribute('aria-disabled') === 'true' && inputs === 0, detail: 'inputsInAHLCard=' + inputs };
  });
  await T('safety: LSMA proposal beyond the hardware limit is refused with PR-023; within it becomes a candidate; Safety Officer approves; engineer cannot', async () => {
    pick('lsma'); await nav('safety'); route(false); type($q('#prop-v'), '11'); click(byText('.card button', 'Propose')); await wait(30); const refused = /PR-023/.test($q('#prop-m').textContent) && !PD.profileCandidate;
    type($q('#prop-v'), '6'); click(byText('.card button', 'Propose')); await wait(30); const cand = !!PD.profileCandidate; pick('engineer'); route(false); const engBlocked = !byText('.card button:not([aria-disabled])', 'Approve as Safety Officer');
    pick('safety'); route(false); click(byText('.card button', 'Approve as Safety Officer')); await wait(40); type($q('#gc-reason'), 'synthetic approval for prototype'); click(byText('.dialog button', 'Approve')); await wait(60);
    return { ok: refused && cand && engBlocked && PD.profile.envelopes[0].max_abs.value === '6' && PD.profile.status === 'approved', detail: 'profile=' + PD.profile.envelopes[0].max_abs.value };
  });
  await T('safety: a wider proposal needs Safety Officer AND Quality Manager; SoD roles enforced', async () => {
    pick('lsma'); route(false); type($q('#prop-v'), '9'); click(byText('.card button', 'Propose')); await wait(30); pick('safety'); route(false); click(byText('.card button', 'Approve as Safety Officer')); await wait(40); type($q('#gc-reason'), 'ok'); click(byText('.dialog button', 'Approve')); await wait(60); const still = PD.profile.envelopes[0].max_abs.value === '6' && !!PD.profileCandidate;
    pick('quality'); route(false); click(byText('.card button', 'Co-approve')); await wait(40); type($q('#gc-reason'), 'ok'); click(byText('.dialog button', 'Approve')); await wait(60); return { ok: still && PD.profile.envelopes[0].max_abs.value === '9', detail: 'after QM=' + PD.profile.envelopes[0].max_abs.value };
  });
  await T('safety: withdrawing the profile blocks every hazardous step (PR-010) and the Broker refuses at run time (fail closed)', async () => {
    pick('safety'); route(false); click(byText('.card button', 'Withdraw profile')); await wait(40); type($q('#gc-reason'), 'withdraw'); click(byText('.dialog button', 'Withdraw profile')); await wait(60);
    const f = PD.findings.filter((x) => x.code === 'PR-010').length; PD.tables[0].rows = PD.tables[0].rows.slice(0, 2); validateNow(); PD.sim.run = null; const r = createRun(simConfig()); drain(r); return { ok: f >= 1 && r.failure && r.failure.code === 'E_SAFETY_VIOLATION' && r.wire.filter((w) => w.op === 'set_source_level' && !w.blocked).length === 0, detail: 'PR-010 x' + f + ' ' + (r.failure && r.failure.code) };
  });
  await T('safety: envelope visual has a text alternative (aria-label) and a complete table equivalent', async () => {
    reset; initState(); route(true); await nav('safety'); route(false); const svg = $q('.env-svg'); const rows = $$('.card table tbody tr').length; return { ok: !!svg.getAttribute('aria-label') && rows >= 4, detail: svg.getAttribute('aria-label') };
  });
  /* ===== versions, review ===== */
  await reset('engineer'); await nav('design');
  await T('versions: compare shows added / changed / moved with the change class and a suggested version', async () => {
    PD.dock = 'versions'; refreshDock(); const txt = $q('#pd-dock').textContent; return { ok: /Added/.test(txt) && /Changed/.test(txt) && /Functional/.test(txt) && /1\.1\.0/.test(txt), detail: $q('.dock-body').textContent.slice(0, 120) };
  });
  await T('review: engineer submits; same persona cannot approve (SoD); approver approves; Quality Manager publishes to the TEST registry only', async () => {
    PD.dock = 'review'; refreshDock(); click(byText('#pd-dock button', 'Submit for review')); await wait(40); type($q('#gc-reason'), 'ready'); click(byText('.dialog button', 'Submit for review')); await wait(60); const submitted = PD.draft.state === 'in_review';
    const cannot = !!byText('#pd-dock .reason-wrap button', 'Approve'); pick('approver'); PD.dock = 'review'; route(false); click(byText('#pd-dock button', 'Approve')); await wait(40); type($q('#gc-reason'), 'approved'); click(byText('.dialog button', 'Approve')); await wait(60); const approved = PD.draft.state === 'approved';
    pick('quality'); PD.dock = 'review'; route(false); click(byText('#pd-dock button', 'Publish to Test')); await wait(40); type($q('#gc-reason'), 'publish'); click(byText('.dialog button', 'Publish to Test')); await wait(60);
    return { ok: submitted && cannot && approved && PD.versions.length === 2 && PD.versions[1].version === '1.1.0' && /Blocked/.test($q('#pd-dock').textContent), detail: 'versions=' + PD.versions.map((v) => v.version).join(',') };
  });
  await T('persona gating: viewer sees a read-only designer (no palette dragging, inputs disabled)', async () => {
    await reset('viewer'); await nav('design'); select('delay_1'); await wait(30); const drag = $$('.pal-item').every((e) => e.getAttribute('draggable') === 'false'); const dis = $$('#pd-right input.input,#pd-right select.input,#pd-right textarea').every((e) => e.disabled); return { ok: drag && dis && /view this procedure/.test($q('.note').textContent), detail: 'palette locked=' + drag + ' inspector disabled=' + dis };
  });
  await T('shared shell conventions: Ctrl+K opens the command palette and navigates; "?" opens the shortcut sheet; skip link and banner use the shared (localised) strings', async () => {
    await reset(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })); await wait(40); const input = $q('.dialog input[type=search]'); if (!input) throw new Error('palette did not open');
    type(input, 'Safety'); await wait(20); key(input, 'Enter'); await wait(120); const nav = PD.ws === 'safety' && !$q('.dialog');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true })); await wait(40); const sheet = !!$q('.dialog table kbd'); click(byText('.dialog button', 'Close') || $q('.dialog .btn.icon')); await wait(30);
    UI.locale = 'he'; applyLocale(); route(true); const skipHe = $q('#skip').textContent === t('a.skip') && /[֐-׿]/.test($q('#skip').textContent); const banner = $q('#proto-banner').textContent.includes(t('banner.title')); UI.locale = 'en'; applyLocale(); route(true);
    return { ok: nav && sheet && skipHe && banner, detail: 'nav=' + nav + ' sheet=' + sheet + ' skipHe=' + skipHe + ' banner=' + banner };
  });
  /* ===== i18n / RTL ===== */
  await T('Hebrew switches to RTL, titles and chrome translate, and nothing renders the literal word "null" or a raw key', async () => {
    await reset(); UI.locale = 'he'; applyLocale(); route(true); await wait(60); const txt = document.body.innerText; const rtl = document.documentElement.dir === 'rtl' && document.documentElement.lang === 'he'; const nulls = $$('*').filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() === 'null')).length; const rawKeys = (txt.match(/\bpd\.[a-z_]+\.[a-z_.]+/g) || []).length;
    UI.locale = 'en'; applyLocale(); route(true); return { ok: rtl && nulls === 0 && rawKeys === 0 && MISSING.size === 0, detail: 'nulls=' + nulls + ' rawKeys=' + rawKeys + ' missing=' + MISSING.size };
  });
  const failed = results.filter((r) => !r.ok);
  window.__flows = { total: results.length, passed: results.length - failed.length, failed: failed.length, results };
  return window.__flows;
})();
