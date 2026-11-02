/* CalOS Procedure Designer DESIGN PROTOTYPE — synthetic Instrument Broker + Simulator + procedure interpreter (pure, no DOM).
   There is NO transport, NO hardware path and NO raw-command entry point: the only way to cause wire traffic is a named operation
   through brokerCall(), which checks effective limits and preconditions BEFORE the simulator sees anything. Non-operational. */
'use strict';
class SimError extends Error { constructor(code, msg, extra) { super(msg || code); this.code = code; this.extra = extra || {}; } }
const toSim = (e) => (e instanceof SimError ? e : e instanceof EvalError ? new SimError(e.code, e.message, e.extra) : e);
const NON_CATCHABLE = new Set(['E_SAFETY_VIOLATION', 'E_OPERATOR_ABORT']);
const MAX_READINGS = 50;

function createRun(cfg) {
  const run = { id: 'SIM-' + (cfg.runNo || 1), proc: cloneJ(cfg.proc), driver: cloneJ(cfg.driver), tables: cloneJ(cfg.tables), profile: cloneJ(cfg.profile), scenario: cfg.scenario || 'nominal', faults: cloneJ(cfg.faults || []).map((f) => ({ ...f, used: false })), seed: cfg.seed === undefined ? SIM_PROFILE.seed : cfg.seed,
    autoAnswer: cfg.autoAnswer || null, requiredLocales: cfg.requiredLocales || ['en'], state: 'idle', events: [], seq: 0, clock: 0, lane: null, depth: 0, vars: new Map(), dataset: { points: [] }, wire: [], completed: new Set(), snap: {}, inflight: null, failure: null, outcome: null, prompt: null, journalHash: 'genesis',
    sim: { state: { function: 'idle', level_set: 'false', output: 'off' }, applied: Dec.parse('0'), connected: true, cmd: 0, rnd: 0, err: [] }, attempts: {}, replay: false };
  run.gen = execRun(run); return run;
}
function ev(run, kind, node, extra) { const e = { ...(extra || {}), seq: ++run.seq, t: run.clock, kind, node: node ? node.id : null, lane: run.lane, depth: run.depth }; run.journalHash = SIMHASH(run.journalHash + kind + (e.node || '') + e.seq + JSON.stringify(extra || {}, (k, v) => (typeof v === 'bigint' ? v.toString() : v))); e.h = run.journalHash.slice(0, 8); run.events.push(e); return e; }
const SIMHASH = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0') + h.toString(16).split('').reverse().join('').padStart(8, '0'); };

/* ---- values ---- */
const tableOf = (run, id) => run.tables.find((t) => t.id === id);
const asQ = (c) => (c && c.$input ? { k: 'input', mi: c.$input } : c && c.value !== undefined ? { k: 'q', v: Dec.parse(c.value), u: c.unit || '' } : undefined);
function rowValue(row) { return { k: 'rec', raw: row, fields: { id: { k: 'str', v: row.id }, nominal: asQ(row.nominal), tol: asQ(row.tol), readings: { k: 'q', v: new Dec(row.readings, 0), u: '' }, settle: asQ(row.settle) } }; }
function scopeOf(run, fr) {
  return { resolve(path) {
    if (path[0] === 'var') { let v = run.vars.get(path[1]); if (v === undefined) return undefined; for (const f of path.slice(2)) { if (!v || v.k !== 'rec') return undefined; v = v.fields[f]; } return v; }
    if (path[0] === 'item' && fr.item && fr.item.alias === path[1]) { let v = fr.item.value; for (const f of path.slice(2)) { v = v && v.fields && v.fields[f]; } return v; }
    return undefined; } };
}
const evalIn = (run, fr, src) => evaluate(src, scopeOf(run, fr));
function toInt(q, what) { if (q.k !== 'q') throw new SimError('E_TYPE', 'Expected a number for ' + what); const n = Number(q.v.toString()); if (!Number.isInteger(n) || n < 1) throw new SimError('E_TYPE', what + ' must be a positive whole number'); return n; }
const timeMs = (q) => { if (q.k !== 'q' || unitDim(q.u) !== 'T') throw new SimError('E_DIM_MISMATCH', 'Expected a time quantity', { expected: 's', got: q.u || '(none)' }); return Number(toBase(q).mul(Dec.parse('1000')).toString()); };

/* ---- wire formatting (typed; no free text; control characters impossible) ---- */
function formatWire(op, args) {
  let w = op.template;
  op.params.forEach((p) => { const v = args[p.name]; let s;
    if (p.type === 'quantity') { if (!v || v.k !== 'q') throw new SimError('E_TYPE', 'Argument ' + p.name + ' must be a quantity'); if (unitDim(v.u) !== p.dimension) throw new SimError('E_DIM_MISMATCH', 'Argument ' + p.name + ': expected ' + p.dimension + ', got ' + (v.u || 'none'), { expected: p.dimension, got: v.u }); s = toBase(v).toString(); }
    else if (p.type === 'enum') { if (!v || v.k !== 'str' || !(v.v in p.tokens)) throw new SimError('E_TYPE', 'Argument ' + p.name + ' is not an allowed choice'); s = p.tokens[v.v]; }
    else if (p.type === 'boolean') { s = v && v.v ? 'ON' : 'OFF'; } else if (p.type === 'integer') { s = String(Number(v.v.toString())); } else s = String(v && v.v);
    if (/[;\r\n\x00-\x1f]/.test(s)) throw new SimError('E_FORMAT', 'Control character in argument');
    w = w.replace('{' + p.name + '}', s); });
  return w;
}

/* ---- Instrument Broker: hazard permission -> effective limit (AHL ∩ profile ∩ procedure bound) -> state preconditions -> write ---- */
function* brokerCall(run, node, op, args, bound) {
  const wire = formatWire(op, args);
  yield ev(run, 'broker.check', node, { op: op.name, hazard: op.hazard, permission: 'granted (simulated run)' });
  for (const p of op.params) if (p.limit_target) {
    const el = effectiveLimit(p.limit_target, run.profile, bound);
    if (!el.covered || !el.effective) { run.wire.push({ seq: run.wire.length + 1, t: run.clock, op: op.name, wire, blocked: true, simulated: true, sent: false, why: 'SAFETY_PROFILE_REQUIRED' }); yield ev(run, 'safety.violation', node, { op: op.name, reason: 'SAFETY_PROFILE_REQUIRED', blocked: true }); throw new SimError('E_SAFETY_VIOLATION', 'No approved Safety Profile covers ' + p.limit_target, { reason: 'SAFETY_PROFILE_REQUIRED', target: p.limit_target }); }
    const mag = toBase(args[p.name]).abs();
    if (mag.cmp(el.effective) > 0) { run.wire.push({ seq: run.wire.length + 1, t: run.clock, op: op.name, wire, blocked: true, simulated: true, sent: false, why: 'HARDWARE_LIMIT_EXCEEDED' }); yield ev(run, 'safety.violation', node, { op: op.name, value: mag.toString(), limit: el.effective.toString(), source: el.source, target: p.limit_target, blocked: true, noBytes: true }); throw new SimError('E_SAFETY_VIOLATION', 'Value ' + mag + ' su exceeds the effective limit ' + el.effective + ' su (' + el.source + ')', { value: mag.toString(), limit: el.effective.toString(), source: el.source, target: p.limit_target }); }
  }
  for (const c of op.pre) if (run.sim.state[c.state] !== c.equals) { yield ev(run, 'broker.refused', node, { op: op.name, state: c.state, need: c.equals, have: run.sim.state[c.state] }); throw new SimError('E_PRECONDITION', op.name + ' requires ' + c.state + ' = ' + c.equals + ' (is ' + run.sim.state[c.state] + ')', { state: c.state, need: c.equals, have: run.sim.state[c.state] }); }
  return yield* simExec(run, node, op, wire);
}
function findFault(run, op) { return run.faults.find((f) => !f.used && ['timeout', 'garbled', 'error_queue', 'disconnect'].includes(f.kind) && (f.op === '*' || !f.op || f.op === op.name) && run.sim.cmd >= (f.after || 0) && (f.kind !== 'garbled' || op.kind === 'query')); }
function* simExec(run, node, op, wire) {
  const S = run.sim; S.cmd++; run.clock += 5;
  const rec = { seq: run.wire.length + 1, t: run.clock, op: op.name, wire, node: node ? node.id : null, simulated: true };
  if (!S.connected) { rec.status = 'disconnected'; run.wire.push(rec); yield ev(run, 'wire', node, { ...rec }); throw new SimError('E_DISCONNECT', 'The simulated instrument is disconnected', { op: op.name }); }
  const f = findFault(run, op);
  if (f && f.kind === 'timeout') { if (!f.persistent) f.used = true; run.clock += Math.round(parseFloat(op.timeout) * 1000); rec.status = 'timeout'; run.wire.push(rec); yield ev(run, 'wire', node, { ...rec, fault: f.id }); throw new SimError('E_TIMEOUT', 'No response within ' + op.timeout + ' s', { op: op.name, fault: f.id }); }
  if (f && f.kind === 'disconnect') { f.used = true; S.connected = false; rec.status = 'disconnected'; run.wire.push(rec); yield ev(run, 'wire', node, { ...rec, fault: f.id }); throw new SimError('E_DISCONNECT', 'The simulated instrument disconnected', { op: op.name, fault: f.id }); }
  let raw = '';
  if (op.name === 'identify') raw = [SIM_PROFILE.identity.manufacturer, SIM_PROFILE.identity.model, SIM_PROFILE.identity.serial, SIM_PROFILE.identity.firmware].join(',');
  else if (op.name === 'read_value') { const sc = SIM_PROFILE.scenarios[run.scenario]; const base = S.state.output === 'on' ? S.applied : Dec.parse('0'); const v = base.add(Dec.parse(sc.offset)).add(noiseDec(run.seed, S.rnd++, sc.noise)); raw = v.toString() + ' su'; }
  else if (op.name === 'read_error') raw = S.err.length ? S.err.shift() : '+0,"No error"';
  if (f && f.kind === 'garbled') { f.used = !f.persistent || f.used; raw = '###'; rec.fault = f.id; }
  /* apply effects of writes */
  if (op.kind === 'write') { op.eff.forEach((e) => { S.state[e.state] = e.set; }); if (op.name === 'set_source_level') S.applied = toBase(run._lastArgs && run._lastArgs.level ? run._lastArgs.level : { v: Dec.parse('0'), u: 'su' }); }
  if (f && f.kind === 'error_queue') { f.used = !f.persistent || f.used; S.err.push('-100,"Synthetic command error"'); rec.fault = f.id; }
  rec.raw = raw; rec.status = 'ok'; run.wire.push(rec);
  yield ev(run, 'wire', node, { ...rec });
  if (op.kind === 'write' && S.err.length) { const msg = S.err.shift(); rec.status = 'error'; throw new SimError('E_INSTRUMENT_ERROR', 'Instrument reported ' + msg, { op: op.name, queue: msg, fault: rec.fault }); }
  /* response parsing */
  if (op.kind === 'query') {
    if (op.response.parser === 'number_with_unit') { const m = /^(-?\d+(\.\d+)?)\s*([A-Za-z]+)$/.exec(raw); if (!m || m[3] !== op.response.unit) throw new SimError('E_PARSE', 'Could not parse "' + raw + '" as a number with unit ' + op.response.unit, { raw, op: op.name }); return { k: 'q', v: Dec.parse(m[1]), u: m[3], raw }; }
    return { k: 'str', v: raw.trim(), raw };
  }
  return null;
}

/* ---- interpreter ---- */
function* execRun(run) {
  run.state = 'running'; yield ev(run, 'run.start', null, { scenario: run.scenario, seed: run.seed, simulated: true, nonOperational: true });
  let failure = null;
  const lanes = [['setup', run.proc.lifecycle.setup], ...run.proc.lifecycle.phases.map((p) => [p.id, p.body])];
  try {
    for (const [lane, list] of lanes) { run.lane = lane; yield ev(run, 'lane.start', null, { lane }); yield* execList(run, list, { keyPrefix: lane + ':', item: null, depth: 0 }); }
  } catch (e0) { const e = toSim(e0); if (!(e instanceof SimError)) throw e0; failure = e; run.failure = { code: e.code, message: e.message, extra: e.extra, node: e.nodeId || run.currentNode || null, attempt: run.attempts[e.nodeId || run.currentNode] || 1, event: run.events.length }; yield ev(run, 'run.failing', null, { code: e.code, message: e.message }); }
  /* teardown always; safe-state when the run did not complete (fail closed) */
  run.lane = 'teardown'; run.depth = 0; yield ev(run, 'lane.start', null, { lane: 'teardown' });
  try { yield* execList(run, run.proc.lifecycle.teardown, { keyPrefix: 'teardown:', item: null, depth: 0 }); } catch (e0) { const e = toSim(e0); if (!(e instanceof SimError)) throw e0; yield ev(run, 'teardown.error', null, { code: e.code, message: e.message }); }
  if (failure) { run.lane = 'safe_state'; yield ev(run, 'lane.start', null, { lane: 'safe_state' }); try { yield* execList(run, run.proc.lifecycle.safe_state, { keyPrefix: 'safe:', item: null, depth: 0 }); yield ev(run, 'safe_state.confirmed', null, { output: run.sim.state.output }); } catch (e0) { const e = toSim(e0); if (!(e instanceof SimError)) throw e0; yield ev(run, 'safe_state.unconfirmed', null, { code: e.code, message: e.message }); } }
  run.outcome = failure ? (failure.code === 'E_OPERATOR_ABORT' ? 'aborted' : 'failed') : 'completed'; run.state = run.outcome;
  yield ev(run, 'run.end', null, { outcome: run.outcome, points: run.dataset.points.length });
}
function* execList(run, list, fr) { for (const n of list) yield* execNode(run, n, fr); }
function* execNode(run, node, fr) {
  const key = fr.keyPrefix + node.id;
  if (run.completed.has(key)) { yield ev(run, 'node.replayed', node, { key }); return; }
  const e = STEP_CATALOG[node.type]; const hz = hazardOf(node, run.driver); let attempt = 0;
  for (;;) {
    attempt++; run.attempts[node.id] = attempt; run.currentNode = node.id; run.inflight = key; run.depth = fr.depth;
    yield ev(run, 'node.start', node, { key, attempt, hazard: hz, simulated: true });
    try {
      yield* nodeBody(run, node, fr, key);
      run.depth = fr.depth; yield ev(run, 'node.end', node, { key, status: 'ok' }); run.completed.add(key);
      run.snap[key] = { vars: new Map(run.vars), sim: { state: { ...run.sim.state }, applied: run.sim.applied, connected: run.sim.connected, cmd: run.sim.cmd, rnd: run.sim.rnd, err: run.sim.err.slice() }, ds: run.dataset.points.length, clock: run.clock, faults: run.faults.map((f) => f.used) }; run.lastSnap = key; run.inflight = null;
      return;
    } catch (err0) {
      const err = toSim(err0); if (!(err instanceof SimError)) throw err0; run.depth = fr.depth;
      if (err.reported) throw err; /* containers only propagate: policies apply at the node where the error originated */
      err.reported = true; err.nodeId = node.id;
      yield ev(run, 'error', node, { code: err.code, message: err.message, attempt, extra: err.extra });
      if (NON_CATCHABLE.has(err.code)) throw err;
      const pol = node.on_error || {};
      const eff = effectiveResume(node, run.driver);
      if (pol.action === 'retry') {
        const ok = !(hz && HRANK[hz] >= 2) && eff !== 'non_repeatable' && attempt < (parseInt(pol.max_attempts, 10) || 1);
        if (ok) { run.clock += Math.round(parseFloat(pol.backoff || '0') * 1000); yield ev(run, 'retry', node, { next: attempt + 1, of: parseInt(pol.max_attempts, 10), reason: err.code }); continue; }
        yield ev(run, 'retry.exhausted', node, { attempts: attempt, allowed: !(hz && HRANK[hz] >= 2) && eff !== 'non_repeatable' });
      }
      if (pol.action === 'escalate') { const choice = yield* ask(run, node, { type: 'escalate', code: err.code, choices: ['retry', 'skip', 'abort'] }); if (choice === 'retry' && !(hz && HRANK[hz] >= 2)) { yield ev(run, 'retry', node, { next: attempt + 1, reason: 'operator' }); continue; } if (choice === 'skip') { yield ev(run, 'node.skipped', node, { reason: 'operator' }); run.completed.add(key); run.inflight = null; return; } throw new SimError('E_OPERATOR_ABORT', 'Operator aborted the run', { after: err.code }); }
      if (pol.action === 'skip') { yield ev(run, 'node.skipped', node, { reason: 'policy' }); run.completed.add(key); run.inflight = null; return; }
      throw err;
    }
  }
}
function* ask(run, node, p) {
  const prompt = { id: 'p' + (run.seq + 1), node: node.id, ...p }; run.prompt = prompt; run.state = 'waiting_prompt';
  if (run.autoAnswer) { const a = (run.autoAnswer[p.type] || run.autoAnswer.default); const ans = a || (p.choices ? p.choices[0] : 'confirm'); yield ev(run, 'prompt', node, { ...p, answered: ans, auto: true }); run.prompt = null; run.state = 'running'; return ans; }
  const first = yield ev(run, 'prompt', node, { ...p, waiting: true }); void first; const ans = yield { wait: true }; /* resumed with the operator's answer */
  run.prompt = null; run.state = 'running'; yield ev(run, 'prompt.answered', node, { answer: ans && ans.choice }); return (ans && ans.choice) || 'confirm';
}
function* nodeBody(run, node, fr, key) {
  const opOf = (n) => opByName(run.driver, n);
  const child = (suffix, item) => ({ keyPrefix: key + suffix, item: item || fr.item, depth: fr.depth + 1 });
  switch (node.type) {
    case 'standard.require': yield ev(run, 'standard.bound', node, { role: node.role, substitute: 'simulated reference (no real equipment)' }); return;
    case 'driver.call': {
      const op = opOf(node.op); if (!op) throw new SimError('E_REF', 'Unknown operation ' + node.op);
      const args = {}; for (const p of op.params) { const src = (node.args || {})[p.name]; if (src === undefined || src === '') throw new SimError('E_REF', 'Missing argument ' + p.name); args[p.name] = evalIn(run, fr, src); }
      run._lastArgs = args; const res = yield* brokerCall(run, node, op, args, null);
      if (node.store_as && res) { run.vars.set(node.store_as, res); yield ev(run, 'var', node, { name: node.store_as, value: res.k === 'q' ? fmtQ(res) : res.v }); }
      return; }
    case 'source.apply': {
      let val = evalIn(run, fr, node.value); const setOp = opOf('set_source_level'), onOp = opOf('source_output_on');
      const unsafe = run.faults.find((f) => !f.used && f.kind === 'unsafe_level');
      if (unsafe) { unsafe.used = true; const el = effectiveLimit('set_source_level.level', run.profile, node.bound_max_abs || null); val = { k: 'q', v: (el.effective || Dec.parse('1')).add(Dec.parse('1')), u: 'su' }; yield ev(run, 'fault.injected', node, { fault: unsafe.id, kind: 'unsafe_level', note: 'synthetic attempt to exceed the envelope' }); }
      run._lastArgs = { level: val }; yield* brokerCall(run, node, setOp, { level: val }, node.bound_max_abs || null); yield* brokerCall(run, node, onOp, {}, null); return; }
    case 'source.off': yield* brokerCall(run, node, opOf('source_output_off'), {}, null); return;
    case 'measure.acquire': {
      const op = opOf(node.op); const n = toInt(evalIn(run, fr, node.count), 'count'); if (n > MAX_READINGS) throw new SimError('E_LOOP_BOUND', 'Reading count above the platform bound', { n, max: MAX_READINGS });
      const rs = []; for (let i = 0; i < n; i++) { const r = yield* brokerCall(run, node, op, {}, null); rs.push(r); }
      const mean = evaluate('mean(var.samples)', { resolve: (p) => (p[1] === 'samples' ? { k: 'list', items: rs } : undefined) });
      run.vars.set(node.store_as, mean); run.vars.set(node.store_as + '_samples', { k: 'list', items: rs });
      yield ev(run, 'var', node, { name: node.store_as, value: fmtQ(mean), samples: rs.map(fmtQ) }); return; }
    case 'compute.set': { const v = evalIn(run, fr, node.expr); run.vars.set(node.var, v); yield ev(run, 'var', node, { name: node.var, value: v.k === 'q' ? fmtQ(v) : String(v.v), expr: node.expr }); return; }
    case 'evaluate.limits': {
      const m = evalIn(run, fr, node.measured), nom = evalIn(run, fr, node.nominal); const row = scopeOf(run, fr).resolve(['item', fr.item && fr.item.alias]) || null; const r = row && row.fields;
      if (!r) throw new SimError('E_REF', 'No test-point row in scope');
      const tol = r.tol; if (!tol || tol.k === 'input') throw new SimError('E_UNRESOLVED_INPUT', 'Unresolved input ' + (tol && tol.mi) + ' reached evaluation', { mi: tol && tol.mi, path: 'item.' + fr.item.alias + '.tol', row: row.raw.id });
      const loInc = row.raw.lo_inc, hiInc = row.raw.hi_inc; if (typeof loInc !== 'boolean' || typeof hiInc !== 'boolean') throw new SimError('E_UNRESOLVED_INPUT', 'Boundary inclusivity is not declared (no default)', { mi: 'MI-14', path: 'item.' + fr.item.alias + '.inclusivity', row: row.raw.id });
      sameDim(m, nom); const lower = { k: 'q', v: nom.v.sub(fromBase(toBase(tol), nom.u)), u: nom.u }, upper = { k: 'q', v: nom.v.add(fromBase(toBase(tol), nom.u)), u: nom.u };
      const mb = toBase(m), lo = toBase(lower), hi = toBase(upper); const within = (loInc ? mb.cmp(lo) >= 0 : mb.cmp(lo) > 0) && (hiInc ? mb.cmp(hi) <= 0 : mb.cmp(hi) < 0);
      const dev = { k: 'q', v: m.v.sub(fromBase(toBase(nom), m.u)), u: m.u };
      const res = { k: 'rec', fields: { within: { k: 'bool', v: within }, deviation: dev, measured: m, nominal: nom, lower, upper, label: { k: 'str', v: within ? 'within_limits' : 'outside_limits' } } };
      run.vars.set(node.result_var, res);
      yield ev(run, 'eval', node, { trace: ['deviation = measured − nominal = ' + fmtQ(m) + ' − ' + fmtQ(nom) + ' = ' + fmtQ(dev), 'limit band = nominal ± tolerance = [' + fmtQ(lower) + ' … ' + fmtQ(upper) + '] (lower ' + (loInc ? 'inclusive' : 'exclusive') + ', upper ' + (hiInc ? 'inclusive' : 'exclusive') + ')', 'limit check → ' + (within ? 'within limits' : 'outside limits')], within, row: row.raw.id });
      return; }
    case 'record.result': { const v = evalIn(run, fr, node.value); if (v.k !== 'rec') throw new SimError('E_TYPE', 'record.result needs a result record'); const f = v.fields; run.dataset.points.push({ id: fr.item ? fr.item.value.raw.id : '—', nominal: fmtQ(f.nominal), reading: fmtQ(f.measured), deviation: fmtQ(f.deviation), lower: fmtQ(f.lower), upper: fmtQ(f.upper), within: f.within.v, label: f.label.v, simulated: true }); yield ev(run, 'record', node, { path: node.dataset_path, id: fr.item ? fr.item.value.raw.id : '—', label: f.label.v }); return; }
    case 'flow.if': { const c = evalIn(run, fr, node.cond); const lst = truthy(c) ? node.then : node.else; yield ev(run, 'branch', node, { taken: truthy(c) ? 'then' : 'else', cond: node.cond }); yield* execList(run, lst || [], child(truthy(c) ? '/then/' : '/else/')); return; }
    case 'flow.foreach': {
      const tb = tableOf(run, node.over); if (!tb) throw new SimError('E_REF', 'Unknown table ' + node.over); if (tb.rows.length > node.max_iterations) throw new SimError('E_LOOP_BOUND', 'Table has ' + tb.rows.length + ' rows; the loop allows ' + node.max_iterations, { rows: tb.rows.length, max: node.max_iterations });
      for (let i = 0; i < tb.rows.length; i++) { const row = tb.rows[i]; yield ev(run, 'iteration', node, { i: i + 1, of: tb.rows.length, row: row.id }); yield* execList(run, node.body || [], { keyPrefix: key + '#' + i + '/', item: { alias: node.as, value: rowValue(row) }, depth: fr.depth + 1 }); }
      return; }
    case 'flow.repeat_until': { for (let i = 0; i < node.max_iterations; i++) { yield ev(run, 'iteration', node, { i: i + 1, of: node.max_iterations }); yield* execList(run, node.body || [], { keyPrefix: key + '#' + i + '/', item: fr.item, depth: fr.depth + 1 }); if (truthy(evalIn(run, fr, node.until))) return; } throw new SimError('E_LOOP_BOUND', 'Loop did not finish within ' + node.max_iterations + ' iterations', { max: node.max_iterations }); }
    case 'flow.delay': { const ms = timeMs(evalIn(run, fr, node.duration)); run.clock += ms; yield ev(run, 'delay', node, { ms, compressed: true }); return; }
    case 'flow.wait_until': { const lim = node.timeout && node.timeout.value ? Number(toBase(asQ(node.timeout)).mul(Dec.parse('1000')).toString()) : 0; let waited = 0; while (!truthy(evalIn(run, fr, node.cond))) { if (waited >= lim) { if (node.on_timeout === 'continue') return; throw new SimError('E_TIMEOUT', 'Condition not met within the timeout', { cond: node.cond }); } run.clock += 100; waited += 100; } yield ev(run, 'delay', node, { ms: waited, compressed: true }); return; }
    case 'flow.try': {
      try { yield* execList(run, node.body || [], child('/body/')); }
      catch (err0) { const err = toSim(err0); if (err instanceof SimError && !NON_CATCHABLE.has(err.code) && (node.match || []).includes(err.code)) { yield ev(run, 'handled', node, { code: err.code }); yield* execList(run, node.handler || [], child('/handler/')); } else { yield* execList(run, node.finally || [], child('/finally/')); throw err0; } }
      yield* execList(run, node.finally || [], child('/finally/')); return; }
    case 'operator.instruct': yield ev(run, 'instruct', node, { text: node.text }); return;
    case 'operator.confirm': { const a = yield* ask(run, node, { type: 'confirm', text: node.prompt, choices: ['confirm', 'abort'] }); if (a === 'abort') throw new SimError('E_OPERATOR_ABORT', 'Operator aborted at a confirmation'); return; }
    case 'operator.input': { const a = yield* ask(run, node, { type: 'input', text: node.prompt, choices: ['confirm', 'abort'] }); if (a === 'abort') throw new SimError('E_OPERATOR_ABORT', 'Operator aborted'); run.vars.set(node.var, { k: 'q', v: Dec.parse('1'), u: '' }); return; }
  }
  throw new SimError('E_REF', 'Unsupported step type ' + node.type);
}

/* ---- run control ---- */
function advance(run, input) {
  if (run.state === 'waiting_prompt') return null; /* the operator must answer first */
  if (!run.gen || ['completed', 'failed', 'aborted', 'interrupted'].includes(run.state)) return null;
  let r = run.gen.next(input); while (!r.done && r.value && r.value.wait) { return { ...ev(run, 'waiting', null, { prompt: run.prompt && run.prompt.id }), waiting: true }; }
  return r.done ? null : r.value;
}
function answerPrompt(run, choice) {
  if (run.state !== 'waiting_prompt') return null;
  /* the generator may still sit on the 'prompt' event (stepping stopped there) or already on the wait point; resume until the answer is consumed */
  let r = run.gen.next({ choice }); let guard = 0; while (!r.done && run.state === 'waiting_prompt' && guard++ < 4) r = run.gen.next({ choice });
  return r.done ? null : r.value;
}
function interrupt(run) { if (!run.gen || ['completed', 'failed', 'aborted'].includes(run.state)) return false; run.gen = null; run.state = 'interrupted'; run.interruptedAt = run.inflight; ev(run, 'run.interrupted', null, { inflight: run.inflight, lastCheckpoint: run.lastSnap || null }); return true; }
function resumePlan(run) {
  const steps = [{ id: 'identity', key: 'pd.plan.identity' }]; const inflight = run.interruptedAt; let decision = null;
  if (inflight) { const nodeId = inflight.split(/[:/#]/).filter(Boolean).pop(); const f = findNode(run.proc, nodeId); if (f) { const pol = effectiveResume(f.node, run.driver); const hz = hazardOf(f.node, run.driver); if (hz && HRANK[hz] >= 2) steps.push({ id: 'safe', key: 'pd.plan.safe_source' }); steps.push({ id: 'state', key: 'pd.plan.reassert' }); steps.push({ id: pol, key: 'pd.plan.' + pol, node: nodeId }); if (pol === 'non_repeatable') decision = { node: nodeId }; } }
  return { steps, decision, inflight };
}
function resume(run, decisionChoice) {
  if (run.state !== 'interrupted') return false;
  const plan = resumePlan(run); if (plan.decision && decisionChoice !== 'rerun') return false;
  const sn = run.snap[run.lastSnap]; if (sn) { run.vars = new Map(sn.vars); run.sim = { state: { ...sn.sim.state }, applied: sn.sim.applied, connected: sn.sim.connected, cmd: sn.sim.cmd, rnd: sn.sim.rnd, err: sn.sim.err.slice() }; run.dataset.points.length = sn.ds; run.faults.forEach((f, i) => { f.used = sn.faults[i]; }); run.clock = sn.clock; }
  else { run.vars = new Map(); run.sim.state = { function: 'idle', level_set: 'false', output: 'off' }; run.dataset.points.length = 0; }
  /* prototype simplification: instrument state is restored from the last checkpoint snapshot; a real engine re-asserts it through the Broker */
  run.state = 'running'; ev(run, 'run.resumed', null, { plan: plan.steps.map((s) => s.id), replaying: run.completed.size }); run.replay = true;
  run.gen = execRun(run); return true;
}
function runToEnd(cfg, limit) { const run = createRun(cfg); let n = 0; for (;;) { if (run.state === 'waiting_prompt') { answerPrompt(run, (cfg.answers && cfg.answers[run.prompt.type]) || 'confirm'); } else { const e = advance(run); if (!e && run.state !== 'waiting_prompt') break; } if (++n > (limit || 20000)) throw new Error('runaway'); } return run; }

/* ---- explanation, report ---- */
function explainFailure(run) {
  const f = run.failure; if (!f) return null;
  const node = f.node ? findNode(run.proc, f.node) : null; const fixes = [];
  if (f.code === 'E_UNRESOLVED_INPUT') fixes.push({ kind: 'metrology', label: 'pd.fix.enter_input', mi: f.extra.mi });
  if (f.code === 'E_SAFETY_VIOLATION') fixes.push({ kind: 'safety', label: 'pd.fix.review_envelope' }, { kind: 'node', label: 'pd.fix.review_value', node: f.node });
  if (['E_TIMEOUT', 'E_PARSE', 'E_INSTRUMENT_ERROR', 'E_DISCONNECT'].includes(f.code)) fixes.push({ kind: 'node', label: 'pd.fix.add_policy', node: f.node });
  if (f.code === 'E_PRECONDITION') fixes.push({ kind: 'node', label: 'pd.fix.order_steps', node: f.node });
  if (f.code === 'E_LOOP_BOUND') fixes.push({ kind: 'node', label: 'pd.fix.raise_bound', node: f.node });
  if (f.code === 'E_DIM_MISMATCH' || f.code === 'E_REF') fixes.push({ kind: 'node', label: 'pd.fix.check_binding', node: f.node });
  const pol = node && node.node.on_error;
  return { code: f.code, message: f.message, node: f.node, nodeTitle: node ? node.node.title : null, lane: node ? node.lane : null, attempts: f.attempt, policy: pol ? pol.action : 'none', fixes, extra: f.extra, safe: run.events.filter((e) => ['safe_state.confirmed', 'safe_state.unconfirmed', 'teardown.error'].includes(e.kind)).map((e) => e.kind), outcome: run.outcome };
}
function buildReport(run, procDigest) {
  const pts = run.dataset.points;
  return { simulated: true, issued: false, approvable: false, watermark: ['SIMULATED DATA', 'NOT A CALIBRATION', 'NOT A CERTIFICATE'], run: run.id, outcome: run.outcome, scenario: run.scenario, procedureDigest: procDigest, points: pts, partial: run.outcome !== 'completed', statements: { uncertainty: 'not_evaluated', conformity: 'not_evaluated', reason: 'no approved uncertainty budget or decision rule' }, safe: { outputFinal: run.sim.state.output } };
}

/* ---- Command Builder test sandbox: ONE named operation at a time through the same Broker path; never a raw string ---- */
const EMPTY_PROC = () => ({ key: 'sandbox', roles: [], tables: [], lifecycle: { setup: [], phases: [], teardown: [], safe_state: [] } });
function createSandbox(driver, profile, scenario) { const r = createRun({ proc: EMPTY_PROC(), driver, tables: [], profile, scenario: scenario || 'nominal' }); r.gen = null; r.state = 'running'; return r; }
function testOperation(box, opName, argSrc, scenario) {
  const op = opByName(box.driver, opName); const res = { op: opName, ok: false, steps: [] };
  if (!op) { res.error = { code: 'E_UNKNOWN_OP', message: opName }; return res; }
  box.scenario = scenario || box.scenario;
  let args = {};
  try { op.params.forEach((p) => { const src = argSrc[p.name]; if (src === undefined || src === '') { if (!p.optional) throw new SimError('E_MISSING_ARG', 'Missing argument ' + p.name, { name: p.name }); return; } args[p.name] = evaluate(src, {}); }); }
  catch (e0) { const e = toSim(e0); res.error = { code: e.code, message: e.message }; return res; }
  box._lastArgs = args; const before = box.events.length; const g = brokerCall(box, null, op, args, null);
  try { let r = g.next(); while (!r.done) r = g.next(); res.ok = true; res.parsed = r.value; }
  catch (e0) { const e = toSim(e0); res.error = { code: e.code, message: e.message, extra: e.extra }; }
  res.events = box.events.slice(before); const w = box.wire[box.wire.length - 1]; res.wire = w || null; res.state = { ...box.sim.state };
  return res;
}
