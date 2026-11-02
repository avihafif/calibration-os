/* CalOS Procedure Designer DESIGN PROTOTYPE — validation, hazard path, effective limits, diff (pure, no DOM). */
'use strict';
const HRANK = { H0: 0, H1: 1, H2: 2, H3: 3, H4: 4 };
const RRANK = { idempotent: 0, resumable: 1, non_repeatable: 2 };
const opByName = (driver, n) => driver.ops.find((o) => o.name === n);
const rolesOf = (proc) => proc.roles;
function hazardOf(node, driver) {
  const e = STEP_CATALOG[node.type]; if (!e) return null;
  if (node.type === 'driver.call' || node.type === 'measure.acquire') { const o = opByName(driver, node.op); return o ? o.hazard : null; }
  return e.hazard || null;
}
function derivedResume(node, driver) { const h = hazardOf(node, driver); if (!h) return 'idempotent'; return HRANK[h] >= 3 ? 'non_repeatable' : HRANK[h] === 2 ? 'resumable' : 'idempotent'; }
const effectiveResume = (n, d) => n.resume_policy || derivedResume(n, d);

/* ---------- effective operating envelope = AHL ∩ approved Safety Profile ∩ procedure bound (narrowest wins; never widened) ---------- */
function effectiveLimit(target, profile, procBound) {
  const ahlE = AHL_PACK.entries.find((e) => e.target === target); const pe = profile && profile.status === 'approved' ? profile.envelopes.find((e) => e.target === target) : null;
  const parts = [];
  if (ahlE) parts.push({ src: 'ahl', v: Dec.parse(ahlE.max_abs.value), unit: ahlE.max_abs.unit });
  if (pe) parts.push({ src: 'profile', v: Dec.parse(pe.max_abs.value), unit: pe.max_abs.unit });
  if (procBound) parts.push({ src: 'procedure', v: Dec.parse(procBound), unit: 'su' });
  const eff = parts.length ? parts.reduce((m, x) => (x.v.cmp(m.v) < 0 ? x : m)) : null;
  return { target, ahl: ahlE ? Dec.parse(ahlE.max_abs.value) : null, profile: pe ? Dec.parse(pe.max_abs.value) : null, proc: procBound ? Dec.parse(procBound) : null, effective: eff ? eff.v : null, source: eff ? eff.src : null, unit: 'su', covered: !!ahlE && !!pe };
}
/* LSMA edit of a Safety Profile envelope: refuses anything outside the read-only AHL band. There is NO function that changes the AHL. */
function checkProfileEnvelope(target, valueStr) {
  const ahlE = AHL_PACK.entries.find((e) => e.target === target); if (!ahlE) return { ok: false, code: 'HARDWARE_LIMITS_MISSING' };
  let v; try { v = Dec.parse(valueStr); } catch (e) { return { ok: false, code: 'PR-001' }; }
  if (v.i < 0n) return { ok: false, code: 'PR-001' };
  if (v.cmp(Dec.parse(ahlE.max_abs.value)) > 0) return { ok: false, code: 'PR-023', ahl: ahlE.max_abs.value };
  return { ok: true };
}

/* ---------- procedure validation (PR-xxx subset; every rule has a fixture in the test suite) ---------- */
function validateProcedure(proc, ctx) {
  const { driver, tables, profile } = ctx; const out = [];
  const F = (code, sev, node, field, stage, params, fix) => out.push({ code, sev, node: node ? node.id : null, field: field || null, stage, params: params || {}, fix: fix || null });
  const tbl = (id) => tables.find((t) => t.id === id);
  const roleKind = (id) => { const r = rolesOf(proc).find((x) => x.id === id); return r ? r.kind : null; };
  const nodeCountTotal = nodeCount(proc); if (nodeCountTotal > MAX_NODES) F('PR-001', 'error', null, null, 'schema', { detail: 'limit' });
  let h2 = false, hasSafeOff = false, usedInputs = new Set();
  const REC_ROW = { k: 'rec', fields: { id: { k: 'str' }, nominal: { k: 'q', dim: 'SU' }, tol: { k: 'q', dim: 'SU' }, readings: { k: 'q', dim: '' }, settle: { k: 'q', dim: 'T' } } };
  const REC_RES = { k: 'rec', fields: { within: { k: 'bool' }, deviation: { k: 'q', dim: 'SU' }, measured: { k: 'q', dim: 'SU' }, nominal: { k: 'q', dim: 'SU' }, lower: { k: 'q', dim: 'SU' }, upper: { k: 'q', dim: 'SU' }, label: { k: 'str' } } };
  const mkEnv = (st) => ({ typeOf(path) {
    if (path[0] === 'var') { let t = st.vars.get(path[1]); if (!t) return null; for (const f of path.slice(2)) { t = t.fields && t.fields[f]; if (!t) return null; } return t; }
    if (path[0] === 'item' && st.items.has(path[1])) { let t = REC_ROW; for (const f of path.slice(2)) { t = t.fields && t.fields[f]; if (!t) return null; } return t; }
    if (path[0] === 'param') return null; return null; } });
  const dimOk = (t, want) => !want || want === 'rec' && t.k === 'rec' || want === 'bool' && t.k === 'bool' || (t.k === 'q' && t.dim === want);
  function checkExpr(node, field, st, want) {
    const src = node[field]; if (src === undefined || src === '') return null;
    let ast; try { ast = parseExpr(src); if (astSize(ast) > MAX_AST) throw new EvalError('E_BUDGET_EXCEEDED', 'too large'); } catch (e) { F('PR-006', 'error', node, field, 'semantic', { detail: 'syntax', msg: e.message }); return null; }
    for (const p of refsOf(ast)) if (p[0] === 'var' && !st.vars.has(p[1])) F('PR-004', 'error', node, field, 'semantic', { name: p[1] }, 'go_assign');
    let t; try { t = typeCheck(ast, mkEnv(st)); } catch (e) { if (e.code === 'E_REF') { const p = e.extra.path || ''; if (!/^var\./.test(p) || st.vars.has(p.split('.')[1])) F('PR-006', 'error', node, field, 'semantic', { detail: 'ref', path: p }); return null; } F('PR-006', 'error', node, field, 'semantic', { detail: e.code === 'E_DIM_MISMATCH' ? 'dim' : 'type', expected: e.extra.expected, got: e.extra.got, msg: e.message }); return null; }
    if (want && !dimOk(t, want)) F('PR-006', 'error', node, field, 'semantic', { detail: 'dim', expected: dimName(want), got: dimName(t.dim || t.k) });
    if (ast.t === 'bool' && (node.type === 'flow.if')) F('PR-005', 'warning', node, field, 'semantic', { value: String(ast.v) });
    return t;
  }
  function visit(list, st, lane) {
    for (const node of list) {
      const e = STEP_CATALOG[node.type];
      if (!e) { F('PR-001', 'error', node, 'type', 'schema', { detail: 'unknown_type', type: node.type }); if (/raw|scpi|script|code|exec/i.test(node.type)) F('PR-021', 'error', node, 'type', 'hazard', {}); continue; }
      /* closed schema: unknown properties are errors; raw-command-like fields are PR-021 */
      const known = new Set(Object.keys(e.schema.properties)); Object.keys(node).forEach((k) => { if (!known.has(k)) { F('PR-001', 'error', node, k, 'schema', { detail: 'unknown', field: k }); if (/raw|scpi|command|script|code|exec/i.test(k)) F('PR-021', 'error', node, k, 'hazard', {}); } });
      (e.schema.required || []).forEach((r) => { const v = node[r]; if (v === undefined || v === '' || (isObj(v) && !Object.keys(v).length && e.schema.properties[r]['x-calos-editor'] && e.schema.properties[r]['x-calos-editor'].widget === 'localized')) F('PR-001', 'error', node, r, 'schema', { detail: 'required' }); });
      /* placement */
      const laneKind = lane === 'setup' || lane === 'teardown' || lane === 'safe_state' ? lane : 'phase';
      if (!e.lanes.includes(laneKind)) F('PR-001', 'error', node, null, 'semantic', { detail: 'placement', lane: laneKind });
      const hz = hazardOf(node, driver); if (hz && HRANK[hz] >= 2) h2 = true;
      if (node.type === 'source.off') hasSafeOff = true;
      /* resume + error policy */
      const eff = effectiveResume(node, driver), der = derivedResume(node, driver);
      if (RRANK[eff] < RRANK[der]) F('PR-008', 'error', node, 'resume_policy', 'semantic', { derived: der, got: eff }, 'strengthen_resume');
      const oe = node.on_error;
      if (oe && oe.action === 'retry') { if ((hz && HRANK[hz] >= 2) || eff === 'non_repeatable') F('PR-007', 'error', node, 'on_error', 'semantic', {}, 'remove_retry'); if (!(parseInt(oe.max_attempts, 10) >= 1)) F('PR-003', 'error', node, 'on_error', 'schema', { detail: 'attempts' }); }
      /* localized required texts */
      Object.entries(e.schema.properties).forEach(([k, s]) => { const hn = (s && s['x-calos-editor']) || {}; if (hn.widget === 'localized' && e.schema.required.includes(k) && node[k]) (ctx.requiredLocales || ['en']).forEach((loc) => { if (!String(node[k][loc] || '').trim()) F('I18N-001', 'warning', node, k, 'i18n', { locale: loc }); }); });
      switch (node.type) {
        case 'driver.call': case 'measure.acquire': {
          const op = opByName(driver, node.op);
          if (node.role && !roleKind(node.role)) F('PR-002', 'error', node, 'role', 'refs', { name: node.role });
          if (node.op && !op) { F('PR-009', 'error', node, 'op', 'semantic', { detail: 'unknown_op', name: node.op }); break; }
          if (!op) break;
          if (node.type === 'measure.acquire' && op.kind !== 'query') F('PR-009', 'error', node, 'op', 'semantic', { detail: 'not_query' });
          if (node.type === 'driver.call') {
            const args = node.args || {};
            Object.keys(args).forEach((k) => { if (!op.params.some((p) => p.name === k)) F('PR-009', 'error', node, 'args', 'semantic', { detail: 'unknown_arg', name: k }); });
            op.params.forEach((p) => { if (!p.optional && (args[p.name] === undefined || args[p.name] === '')) { F('PR-009', 'error', node, 'args', 'semantic', { detail: 'missing_arg', name: p.name }); return; }
              if (args[p.name]) { const t = checkExprFor(node, 'args', args[p.name], st); if (t && p.type === 'quantity' && !(t.k === 'q' && t.dim === p.dimension)) F('PR-006', 'error', node, 'args', 'semantic', { detail: 'dim', expected: p.dimension, got: dimName(t.dim || t.k) }); if (t && p.type === 'enum' && t.k !== 'str') F('PR-006', 'error', node, 'args', 'semantic', { detail: 'type' }); }
              if (p.bounds && p.bounds.$input) usedInputs.add(p.bounds.$input); });
            if (lane === 'safe_state' && !op.safe) F('PR-019', 'error', node, 'op', 'hazard', { name: op.name });
          }
          if (node.type === 'measure.acquire') { checkExpr(node, 'count', st, ''); }
          const hzr = hazardOf(node, driver); if (hzr && HRANK[hzr] >= 2) coverage(node, op, null);
          if (node.store_as) { const unit = op.response && op.response.unit; st.vars.set(node.store_as, unit ? { k: 'q', dim: unitDim(unit) } : { k: 'str' }); }
          break;
        }
        case 'standard.require': if (node.role && roleKind(node.role) !== 'standard') F('PR-002', 'error', node, 'role', 'refs', { name: node.role }); break;
        case 'source.apply': {
          if (node.role && roleKind(node.role) !== 'standard') F('PR-002', 'error', node, 'role', 'refs', { name: node.role });
          checkExpr(node, 'value', st, 'SU');
          const op = opByName(driver, 'set_source_level'); coverage(node, op, node.bound_max_abs);
          if (node.bound_max_abs) { try { const b = Dec.parse(node.bound_max_abs); const el = effectiveLimit('set_source_level.level', profile, null); if (el.effective && b.cmp(el.effective) > 0) F('PR-023', 'error', node, 'bound_max_abs', 'hazard', { detail: 'bound_wider', limit: el.effective.toString(), source: el.source }); } catch (x) { F('PR-001', 'error', node, 'bound_max_abs', 'schema', { detail: 'decimal' }); } }
          break; }
        case 'source.off': if (node.role && roleKind(node.role) !== 'standard') F('PR-002', 'error', node, 'role', 'refs', { name: node.role }); break;
        case 'compute.set': { const t = checkExpr(node, 'expr', st); if (node.var) st.vars.set(node.var, t || { k: 'q', dim: '' }); break; }
        case 'evaluate.limits': {
          const tm = checkExpr(node, 'measured', st, 'SU'); checkExpr(node, 'nominal', st, 'SU'); checkExpr(node, 'row', st, 'rec');
          const tb = tbl(node.table); if (node.table && !tb) F('PR-002', 'error', node, 'table', 'refs', { name: node.table });
          if (tb) { tb.rows.forEach((r) => { ['nominal', 'tol', 'settle'].forEach((c) => { if (isInput(r[c])) { usedInputs.add(r[c].$input); F('PR-013', 'warning', node, 'table', 'metrology', { mi: r[c].$input, row: r.id, col: c }, 'go_metrology'); } }); if (typeof r.lo_inc !== 'boolean' || typeof r.hi_inc !== 'boolean') F('PR-015', 'error', node, 'table', 'metrology', { row: r.id }, 'go_metrology'); }); }
          if (node.result_var) st.vars.set(node.result_var, REC_RES); void tm; break; }
        case 'record.result': checkExpr(node, 'value', st); break;
        case 'flow.if': { checkExpr(node, 'cond', st, 'bool'); const a = new Map(st.vars), b = new Map(st.vars); visit(node.then || [], { vars: a, items: st.items }, lane); visit(node.else || [], { vars: b, items: st.items }, lane); for (const [k, v] of a) if (b.has(k)) st.vars.set(k, v); continue; }
        case 'flow.foreach': {
          if (!(Number.isInteger(node.max_iterations) && node.max_iterations >= 1)) F('PR-003', 'error', node, 'max_iterations', 'schema', { detail: 'loop' }, 'add_bound');
          const tb = tbl(node.over); if (node.over && !tb) F('PR-002', 'error', node, 'over', 'refs', { name: node.over });
          if (tb && Number.isInteger(node.max_iterations) && tb.rows.length > node.max_iterations) F('PR-003', 'warning', node, 'max_iterations', 'schema', { detail: 'table_longer', n: tb.rows.length, max: node.max_iterations });
          const items = new Set(st.items); if (node.as) items.add(node.as); visit(node.body || [], { vars: new Map(st.vars), items }, lane); continue; }
        case 'flow.repeat_until': { if (!(Number.isInteger(node.max_iterations) && node.max_iterations >= 1)) F('PR-003', 'error', node, 'max_iterations', 'schema', { detail: 'loop' }, 'add_bound'); if (!node.timeout) F('PR-003', 'error', node, 'timeout', 'schema', { detail: 'timeout' }, 'add_bound'); checkExpr(node, 'until', st, 'bool'); visit(node.body || [], { vars: new Map(st.vars), items: st.items }, lane); continue; }
        case 'flow.delay': checkExpr(node, 'duration', st, 'T'); break;
        case 'flow.wait_until': checkExpr(node, 'cond', st, 'bool'); if (!node.timeout) F('PR-003', 'error', node, 'timeout', 'schema', { detail: 'timeout' }, 'add_bound'); break;
        case 'flow.try': { if (!(node.match || []).length) F('PR-001', 'error', node, 'match', 'schema', { detail: 'required' }); visit(node.body || [], { vars: new Map(st.vars), items: st.items }, lane); visit(node.handler || [], { vars: new Map(st.vars), items: st.items }, lane); visit(node.finally || [], { vars: new Map(st.vars), items: st.items }, lane);
          (function chk(l) { l.forEach((c) => { const h = hazardOf(c, driver); if (h && HRANK[h] >= 2) F('PR-019', 'error', c, 'type', 'hazard', { detail: 'finally_hazard' }); slotsOf(c).forEach((s) => chk(c[s] || [])); }); })(node.finally || []); continue; }
        case 'operator.input': if (node.var) st.vars.set(node.var, { k: 'q', dim: '' }); break;
      }
      slotsOf(node).forEach((s) => visit(node[s] || [], { vars: new Map(st.vars), items: st.items }, lane));
    }
  }
  function checkExprFor(node, field, src, st) { try { return typeCheck(parseExpr(src), mkEnv(st)); } catch (e) { F('PR-006', 'error', node, field, 'semantic', { detail: e.code === 'E_DIM_MISMATCH' ? 'dim' : 'syntax', expected: e.extra && e.extra.expected, got: e.extra && e.extra.got, msg: e.message }); return null; } }
  function coverage(node, op, bound) {
    if (!op) return; const targets = op.params.filter((p) => p.limit_target).map((p) => p.limit_target);
    if (!profile) { F('PR-010', 'error', node, 'op', 'hazard', { detail: 'no_profile' }, 'go_safety'); return; }
    targets.forEach((tg) => { const el = effectiveLimit(tg, profile, bound); if (!el.ahl) F('PR-023', 'error', node, 'op', 'hazard', { detail: 'no_ahl', target: tg }); else if (!el.profile) F('PR-010', 'error', node, 'op', 'hazard', { detail: 'uncovered', target: tg }, 'go_safety'); });
  }
  const st0 = () => ({ vars: new Map(), items: new Set() });
  const sharedVars = new Map(); const base = { vars: sharedVars, items: new Set() };
  visit(proc.lifecycle.setup, base, 'setup');
  proc.lifecycle.phases.forEach((ph) => visit(ph.body, { vars: new Map(sharedVars), items: new Set() }, ph.id));
  visit(proc.lifecycle.teardown, { vars: new Map(sharedVars), items: new Set() }, 'teardown');
  visit(proc.lifecycle.safe_state, { vars: new Map(sharedVars), items: new Set() }, 'safe_state'); void st0;
  if (h2 && !hasSafeOff && !proc.lifecycle.teardown.some((n) => n.type === 'driver.call' && (opByName(driver, n.op) || {}).safe)) F('PR-018', 'warning', null, null, 'hazard', {}, 'add_teardown');
  if (h2 && !proc.lifecycle.safe_state.length) F('PR-018', 'warning', null, null, 'hazard', { detail: 'safe_state' });
  /* informational: simulation-only content cannot be released to Production */
  if (profile && profile.simulated) F('PR-024', 'info', null, null, 'hazard', {});
  if (tables.some((t) => t.rows.some((r) => r.prov === 'synthetic_demo'))) F('PR-014', 'info', null, null, 'metrology', {});
  /* dedupe */
  const seen = new Set(); return out.filter((f) => { const k = [f.code, f.node, f.field, JSON.stringify(f.params)].join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
}
const countSev = (fs) => ({ error: fs.filter((f) => f.sev === 'error').length, warning: fs.filter((f) => f.sev === 'warning').length, info: fs.filter((f) => f.sev === 'info').length });

/* ---------- hazard path: every H2+ operation in execution order with coverage ---------- */
function hazardPath(proc, ctx) {
  const rows = []; walk(proc, (n, i) => { const h = hazardOf(n, ctx.driver); if (h && HRANK[h] >= 2) { const op = n.type === 'source.apply' ? opByName(ctx.driver, 'set_source_level') : opByName(ctx.driver, n.op); const tg = op && op.params.find((p) => p.limit_target); const el = tg ? effectiveLimit(tg.limit_target, ctx.profile, n.bound_max_abs || null) : null; rows.push({ node: n, hazard: h, lane: i.lane, op: op && op.name, el, covered: !!(el && el.covered) }); } });
  return rows;
}
function recoveryMatrix(proc, driver) {
  const rows = []; walk(proc, (n) => { const h = hazardOf(n, driver); if (!h && !['flow.delay'].includes(n.type)) return; const p = effectiveResume(n, driver); rows.push({ node: n, hazard: h, policy: p, behavior: p === 'idempotent' ? 'rerun' : p === 'resumable' ? 'reconcile' : 'decision' }); });
  return rows;
}

/* ---------- procedure diff (id-aware: moves are not delete+add) ---------- */
function diffProcedures(a, b) {
  const idx = (p) => { const m = new Map(); flattenProc(p).forEach((f, order) => m.set(f.id, { ...f, order })); return m; };
  const A = idx(a), B = idx(b), rows = [];
  const body = (n) => { const c = cloneJ(n); slotsOf(n).forEach((s) => delete c[s]); return c; };
  B.forEach((f, id) => {
    if (!A.has(id)) { rows.push({ id, type: 'added', node: f.node, to: where(f) }); return; }
    const g = A.get(id); const ch = []; const bb = body(f.node), ba = body(g.node); new Set([...Object.keys(bb), ...Object.keys(ba)]).forEach((k) => { if (canon(bb[k] === undefined ? null : bb[k]) !== canon(ba[k] === undefined ? null : ba[k])) ch.push(k); });
    const moved = (g.parent || g.lane) !== (f.parent || f.lane) || g.slot !== f.slot || commonRank(A, g, B) !== commonRank(B, f, A);
    if (ch.length) rows.push({ id, type: 'changed', fields: ch, before: ba, after: bb, node: f.node });
    if (moved) rows.push({ id, type: 'moved', from: where(g), to: where(f), node: f.node });
  });
  A.forEach((f, id) => { if (!B.has(id)) rows.push({ id, type: 'removed', node: f.node, from: where(f) }); });
  const meta = []; ['title', 'intended_modes'].forEach((k) => { if (canon(a[k] || null) !== canon(b[k] || null)) meta.push(k); }); if (meta.length) rows.push({ id: '(procedure)', type: 'changed', fields: meta, node: null });
  return rows;
  function where(f) { return f.parent ? f.parent + '.' + f.slot : f.lane; }
  /* rank of f among siblings that exist in BOTH versions: inserting or removing a neighbour is not a move */
  function commonRank(M, f, other) { let i = 0; for (const x of M.values()) { if (x.id === f.id) return i; if ((x.parent || x.lane) === (f.parent || f.lane) && x.slot === f.slot && other.has(x.id)) i++; } return -1; }
}
function classifyProcDiff(rows, driver) {
  if (!rows.length) return { cls: 'none', why: [] };
  let cls = 'editorial'; const rank = { editorial: 0, functional: 1, metrological: 2, safety: 3 }; const why = [];
  const up = (c, w) => { if (rank[c] > rank[cls]) cls = c; if (rank[c] >= rank[cls]) why.push(w); };
  rows.forEach((r) => { const n = r.node; const h = n && hazardOf(n, driver); if (h && HRANK[h] >= 2) { up('safety', r.id); return; } if (n && ['evaluate.limits', 'measure.acquire', 'record.result'].includes(n.type)) { up('metrological', r.id); return; } if (r.type === 'changed' && r.fields.every((f) => ['title', 'notes'].includes(f))) { up('editorial', r.id); return; } up('functional', r.id); });
  return { cls, why: why.slice(0, 4) };
}

/* ---------- placement rules (drop-time constraints; shared by pointer drag-and-drop, keyboard insert and outline moves) ---------- */
function canPlace(proc, typeOrNode, ref, driver, movingId) {
  const type = typeof typeOrNode === 'string' ? typeOrNode : typeOrNode.type; const e = STEP_CATALOG[type]; if (!e) return { ok: false, key: 'pd.place.unknown' };
  const lane = ref.lane || (findNode(proc, ref.parent) || {}).lane; const laneKind = lane === 'setup' || lane === 'teardown' || lane === 'safe_state' ? lane : 'phase';
  if (!e.lanes.includes(laneKind)) return { ok: false, key: 'pd.place.lane', params: { lane: laneKind } };
  if (nodeCount(proc) >= MAX_NODES && !movingId) return { ok: false, key: 'pd.place.limit' };
  if (depthOfRef(proc, ref) >= MAX_DEPTH) return { ok: false, key: 'pd.place.depth' };
  if (ref.parent && movingId && (ref.parent === movingId || isDescendant(findNode(proc, movingId).node, ref.parent))) return { ok: false, key: 'pd.place.self' };
  const node = typeof typeOrNode === 'string' ? { type } : typeOrNode; const hz = hazardOf(node, driver || { ops: [] });
  if (ref.slot === 'finally' && hz && HRANK[hz] >= 2) return { ok: false, key: 'pd.place.finally_hazard' };
  if (lane === 'safe_state' && node.type === 'driver.call' && node.op) { const o = opByName(driver, node.op); if (o && !o.safe) return { ok: false, key: 'pd.place.safe_state', params: { op: node.op } }; }
  if (lane === 'safe_state' && !['source.off', 'driver.call', 'operator.instruct'].includes(type)) return { ok: false, key: 'pd.place.safe_state_type' };
  return { ok: true };
}
/* One view-model feeds BOTH the visual canvas and the accessible outline (so they can never disagree) */
function viewModel(proc) { return flattenProc(proc).map((f) => ({ id: f.id, type: f.type, depth: f.depth, lane: f.lane, slot: f.slot, parent: f.parent })); }
function MKPROFILE_SAFE() { return MKPROFILE(); }

/* ---------- Command Builder: operation lint (codes are PROPOSED for this prototype; see docs/procedure-designer/04) ---------- */
const OP_NAME = /^[a-z][a-z0-9_]*$/;
function validateOp(op, driver) {
  const out = []; const F = (code, sev, field, params) => out.push({ code, sev, node: null, field, stage: 'driver', params: params || {} });
  if (!OP_NAME.test(op.name || '')) F('DRV-001', 'error', 'name', { detail: 'format' });
  else if (driver.ops.filter((o) => o.name === op.name).length > 1) F('DRV-001', 'error', 'name', { detail: 'duplicate' });
  const tpl = op.template || '';
  if (!tpl.trim()) F('DRV-002', 'error', 'template', { detail: 'empty' });
  if (/[\x00-\x1f\x7f]/.test(tpl)) F('DRV-003', 'error', 'template', { detail: 'control' });
  else if (tpl.includes(';')) F('DRV-003', 'error', 'template', { detail: 'multi' });
  const ph = [...tpl.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]); const names = (op.params || []).map((p) => p.name);
  ph.forEach((p) => { if (!names.includes(p)) F('DRV-002', 'error', 'template', { detail: 'unknown_placeholder', name: p }); });
  names.forEach((n) => { if (!ph.includes(n)) F('DRV-002', 'error', 'template', { detail: 'unused_param', name: n }); });
  if (/\{[^}]*$|^[^{]*\}/.test(tpl.replace(/\{[^{}]*\}/g, ''))) F('DRV-002', 'error', 'template', { detail: 'braces' });
  (op.params || []).forEach((p, i) => {
    if (!OP_NAME.test(p.name || '')) F('DRV-001', 'error', 'params/' + i + '/name', { detail: 'format' });
    if (p.type === 'enum') { const tk = Object.entries(p.tokens || {}); if (!tk.length) F('DRV-004', 'error', 'params/' + i, { detail: 'empty' }); tk.forEach(([k, v]) => { if (!OP_NAME.test(k) || /[\s;{}\x00-\x1f]/.test(v) || !v) F('DRV-004', 'error', 'params/' + i, { detail: 'token', name: k }); }); }
    if (p.type === 'quantity' && !p.dimension) F('DRV-005', 'error', 'params/' + i, {});
  });
  const hz = HRANK[op.hazard];
  if (op.hazard === 'H3' || op.hazard === 'H4') F('DRV-008', 'error', 'hazard', { hazard: op.hazard });
  const lim = (op.params || []).some((p) => p.limit_target);
  if (hz >= 2 && (op.params || []).some((p) => p.type === 'quantity') && !lim) F('DRV-006', 'error', 'hazard', {});
  if (lim && hz < 2) F('DRV-007', 'error', 'hazard', {});
  if (hz >= 2 && Number(op.retry) > 0) F('DRV-009', 'error', 'retry', {});
  if (op.kind === 'query' && (!op.response || op.response.parser === 'none')) F('DRV-010', 'error', 'response', {});
  if (op.response && op.response.parser === 'number_with_unit' && !op.response.unit) F('DRV-011', 'error', 'response', {});
  (op.pre || []).forEach((c, i) => { const s = driver.state.find((x) => x.id === c.state); if (!s || (s.values && !s.values.includes(c.equals)) || (s.type === 'bool' && !['true', 'false'].includes(c.equals))) F('DRV-012', 'error', 'pre/' + i, {}); });
  (op.eff || []).forEach((c, i) => { const s = driver.state.find((x) => x.id === c.state); if (!s || (s.values && !s.values.includes(c.set)) || (s.type === 'bool' && !['true', 'false'].includes(c.set))) F('DRV-012', 'error', 'eff/' + i, {}); });
  if (op.verification === 'unverified_against_manual') F('DRV-013', 'info', 'verification', {});
  let tm = null; try { tm = Dec.parse(String(op.timeout)); } catch (e) { tm = null; } if (!tm || tm.cmp(Dec.parse('0')) <= 0) F('DRV-014', 'error', 'timeout', {});
  return out;
}
