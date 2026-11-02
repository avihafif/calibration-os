/* CalOS Procedure Designer DESIGN PROTOTYPE — core logic (pure, no DOM). Non-operational; synthetic data only.
   Decimal arithmetic uses BigInt (no binary floats for metrological values); expressions are a closed, total, side-effect-free
   language (no loops, no I/O, no clock); randomness exists ONLY in the simulator (counter-based, seeded). */
'use strict';

/* ---------------- Decimal (BigInt) ---------------- */
const P10 = (n) => 10n ** BigInt(n);
class EvalError extends Error { constructor(code, msg, extra) { super(msg || code); this.code = code; this.extra = extra || {}; } }
class Dec {
  constructor(i, s) { this.i = BigInt(i); this.s = s || 0; }
  static parse(str) {
    const m = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(String(str).trim());
    if (!m) throw new EvalError('E_DECIMAL', 'Not a decimal: ' + str);
    const frac = m[3] || ''; let i = BigInt(m[2] + frac), s = frac.length; if (m[1]) i = -i;
    if (m[4]) { const e = Number(m[4]); if (e >= 0) i *= P10(e); else s += -e; }
    return new Dec(i, s).norm();
  }
  norm() { let { i, s } = this; while (s > 0 && i % 10n === 0n) { i /= 10n; s--; } return new Dec(i, s); }
  static align(a, b) { const s = Math.max(a.s, b.s); return [a.i * P10(s - a.s), b.i * P10(s - b.s), s]; }
  add(o) { const [x, y, s] = Dec.align(this, o); return new Dec(x + y, s).norm(); }
  sub(o) { const [x, y, s] = Dec.align(this, o); return new Dec(x - y, s).norm(); }
  mul(o) { return new Dec(this.i * o.i, this.s + o.s).norm(); }
  div(o, prec) {
    prec = prec === undefined ? 12 : prec; if (o.i === 0n) throw new EvalError('E_DIV_ZERO', 'Division by zero');
    const num = this.i * P10(o.s + prec), den = o.i * P10(this.s); let q = num / den; const r = num % den;
    if (r !== 0n) { const tw = (r < 0n ? -r : r) * 2n, d = den < 0n ? -den : den; if (tw >= d) q += ((num < 0n) !== (den < 0n)) ? -1n : 1n; }
    return new Dec(q, prec).norm();
  }
  cmp(o) { const [x, y] = Dec.align(this, o); return x < y ? -1 : x > y ? 1 : 0; }
  neg() { return new Dec(-this.i, this.s); } abs() { return this.i < 0n ? this.neg() : this; } isZero() { return this.i === 0n; }
  toString() { const neg = this.i < 0n; let d = (neg ? -this.i : this.i).toString(); if (this.s > 0) { d = d.padStart(this.s + 1, '0'); d = d.slice(0, -this.s) + '.' + d.slice(-this.s); } return (neg ? '-' : '') + d; }
}
/* Synthetic dimensions: "su" is a SYNTHETIC unit with no physical meaning (not volts, ohms, …). */
const UNITDEF = { su: { dim: 'SU', f: '1' }, msu: { dim: 'SU', f: '0.001' }, usu: { dim: 'SU', f: '0.000001' }, s: { dim: 'T', f: '1' }, ms: { dim: 'T', f: '0.001' }, '': { dim: '', f: '1' } };
const unitDim = (u) => (UNITDEF[u] ? UNITDEF[u].dim : null);
const toBase = (q) => q.v.mul(Dec.parse(UNITDEF[q.u].f));
const fromBase = (d, u) => d.div(Dec.parse(UNITDEF[u].f), 15);
const Q = (str, u) => ({ k: 'q', v: Dec.parse(str), u: u || '' });
const fmtQ = (q) => (q && q.k === 'q' ? q.v.toString() + (q.u ? ' ' + q.u : '') : String(q));

/* ---------------- Expression language (closed, total) ---------------- */
function tokenize(src) {
  const toks = []; let i = 0; const s = String(src);
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    let m;
    if ((m = /^\d+(\.\d+)?/.exec(s.slice(i)))) { toks.push({ t: 'num', v: m[0] }); i += m[0].length; continue; }
    if ((m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i)))) { toks.push({ t: 'id', v: m[0] }); i += m[0].length; continue; }
    if ((m = /^"([^"\\\n]*)"/.exec(s.slice(i)))) { toks.push({ t: 'str', v: m[1] }); i += m[0].length; continue; }
    if ((m = /^(<=|>=|==|!=|[-+*\/(),.<>])/.exec(s.slice(i)))) { toks.push({ t: 'op', v: m[0] }); i += m[0].length; continue; }
    throw new EvalError('E_SYNTAX', 'Unexpected character "' + c + '"', { pos: i });
  }
  return toks;
}
function parseExpr(src) {
  const toks = tokenize(src); let p = 0;
  const peek = () => toks[p], eat = () => toks[p++];
  const isOp = (v) => peek() && peek().t === 'op' && peek().v === v, isId = (v) => peek() && peek().t === 'id' && peek().v === v;
  const need = (v) => { if (!isOp(v)) throw new EvalError('E_SYNTAX', 'Expected "' + v + '"'); p++; };
  function or() { let l = and(); while (isId('or')) { eat(); l = { t: 'bin', op: 'or', l, r: and() }; } return l; }
  function and() { let l = not(); while (isId('and')) { eat(); l = { t: 'bin', op: 'and', l, r: not() }; } return l; }
  function not() { if (isId('not')) { eat(); return { t: 'un', op: 'not', x: not() }; } return cmp(); }
  function cmp() { const l = add(); const o = peek(); if (o && o.t === 'op' && ['<', '<=', '==', '!=', '>=', '>'].includes(o.v)) { eat(); return { t: 'bin', op: o.v, l, r: add() }; } return l; }
  function add() { let l = mul(); while (isOp('+') || isOp('-')) { const o = eat().v; l = { t: 'bin', op: o, l, r: mul() }; } return l; }
  function mul() { let l = un(); while (isOp('*') || isOp('/')) { const o = eat().v; l = { t: 'bin', op: o, l, r: un() }; } return l; }
  function un() { if (isOp('-')) { eat(); return { t: 'un', op: '-', x: un() }; } return prim(); }
  function prim() {
    const tk = eat(); if (!tk) throw new EvalError('E_SYNTAX', 'Unexpected end of expression');
    if (tk.t === 'num') { let u = ''; if (peek() && peek().t === 'id' && UNITDEF[peek().v] !== undefined && peek().v !== '') { u = eat().v; } return { t: 'num', v: tk.v, u }; }
    if (tk.t === 'str') return { t: 'str', v: tk.v };
    if (tk.t === 'op' && tk.v === '(') { const e = or(); need(')'); return e; }
    if (tk.t === 'id') {
      if (tk.v === 'true' || tk.v === 'false') return { t: 'bool', v: tk.v === 'true' };
      if (isOp('(')) { eat(); const args = []; if (!isOp(')')) { do { args.push(or()); } while (isOp(',') && eat()); } need(')'); return { t: 'call', fn: tk.v, args }; }
      const path = [tk.v]; while (isOp('.')) { eat(); const n = eat(); if (!n || n.t !== 'id') throw new EvalError('E_SYNTAX', 'Expected a name after "."'); path.push(n.v); }
      return { t: 'ref', path };
    }
    throw new EvalError('E_SYNTAX', 'Unexpected "' + tk.v + '"');
  }
  const e = or(); if (p < toks.length) throw new EvalError('E_SYNTAX', 'Unexpected "' + toks[p].v + '"'); return e;
}
const MAX_AST = 200;
function astSize(a) { return !a ? 0 : 1 + (a.l ? astSize(a.l) : 0) + (a.r ? astSize(a.r) : 0) + (a.x ? astSize(a.x) : 0) + (a.args ? a.args.reduce((n, x) => n + astSize(x), 0) : 0); }
function refsOf(a, out) { out = out || []; if (!a) return out; if (a.t === 'ref') out.push(a.path); ['l', 'r', 'x'].forEach((k) => a[k] && refsOf(a[k], out)); (a.args || []).forEach((x) => refsOf(x, out)); return out; }

/* evaluate: scope.resolve(path) -> value ({k:'q'|'bool'|'str'|'list'|'rec', …}) or {k:'input', mi} for unresolved inputs */
function evalAst(a, scope) {
  switch (a.t) {
    case 'num': return { k: 'q', v: Dec.parse(a.v), u: a.u || '' };
    case 'str': return { k: 'str', v: a.v };
    case 'bool': return { k: 'bool', v: a.v };
    case 'ref': { const v = scope.resolve(a.path); if (v === undefined) throw new EvalError('E_REF', 'Unknown reference ' + a.path.join('.'), { path: a.path.join('.') }); if (v.k === 'input') throw new EvalError('E_UNRESOLVED_INPUT', 'Unresolved input ' + v.mi + ' reached evaluation', { mi: v.mi, path: a.path.join('.') }); return v; }
    case 'un': { const x = evalAst(a.x, scope); if (a.op === 'not') return { k: 'bool', v: !truthy(x) }; need_q(x); return { k: 'q', v: x.v.neg(), u: x.u }; }
    case 'bin': {
      if (a.op === 'and') return { k: 'bool', v: truthy(evalAst(a.l, scope)) && truthy(evalAst(a.r, scope)) };
      if (a.op === 'or') return { k: 'bool', v: truthy(evalAst(a.l, scope)) || truthy(evalAst(a.r, scope)) };
      const l = evalAst(a.l, scope), r = evalAst(a.r, scope);
      if (['==', '!='].includes(a.op) && l.k !== 'q') { const eq = l.k === r.k && l.v === r.v; return { k: 'bool', v: a.op === '==' ? eq : !eq }; }
      need_q(l); need_q(r);
      if (['<', '<=', '==', '!=', '>=', '>'].includes(a.op)) { sameDim(l, r); const c = toBase(l).cmp(toBase(r)); return { k: 'bool', v: { '<': c < 0, '<=': c <= 0, '==': c === 0, '!=': c !== 0, '>=': c >= 0, '>': c > 0 }[a.op] }; }
      if (a.op === '+' || a.op === '-') { sameDim(l, r); const rv = fromBase(toBase(r), l.u || r.u); const lv = l.v; return { k: 'q', v: a.op === '+' ? lv.add(rv) : lv.sub(rv), u: l.u }; }
      if (a.op === '*') return { k: 'q', v: l.v.mul(r.v), u: l.u && r.u ? l.u + '·' + r.u : l.u || r.u };
      if (a.op === '/') { if (r.u && l.u && unitDim(l.u) === unitDim(r.u)) return { k: 'q', v: toBase(l).div(toBase(r)), u: '' }; return { k: 'q', v: l.v.div(r.v), u: l.u && !r.u ? l.u : '' }; }
      break;
    }
    case 'call': return callFn(a, scope);
  }
  throw new EvalError('E_SYNTAX', 'Unsupported expression');
}
const truthy = (x) => (x.k === 'bool' ? x.v : (() => { throw new EvalError('E_TYPE', 'Expected a true/false value'); })());
const need_q = (x) => { if (x.k !== 'q') throw new EvalError('E_TYPE', 'Expected a quantity'); };
const sameDim = (l, r) => { const a = unitDim(l.u), b = unitDim(r.u); if (a === null || b === null || a !== b) throw new EvalError('E_DIM_MISMATCH', 'Unit mismatch: expected ' + (l.u || '(none)') + ', got ' + (r.u || '(none)'), { expected: l.u, got: r.u }); };
function callFn(a, scope) {
  const args = a.args.map((x) => evalAst(x, scope));
  const q1 = () => { if (args.length !== 1) throw new EvalError('E_ARITY', a.fn + ' takes 1 argument'); need_q(args[0]); return args[0]; };
  switch (a.fn) {
    case 'abs': { const x = q1(); return { k: 'q', v: x.v.abs(), u: x.u }; }
    case 'min': case 'max': { if (args.length < 2) throw new EvalError('E_ARITY', a.fn + ' needs ≥ 2 arguments'); args.forEach(need_q); args.forEach((x) => sameDim(args[0], x)); return args.reduce((m, x) => ((toBase(x).cmp(toBase(m)) < 0) === (a.fn === 'min') ? x : m)); }
    case 'deviation': { if (args.length !== 2) throw new EvalError('E_ARITY', 'deviation(measured, nominal)'); args.forEach(need_q); sameDim(args[0], args[1]); return { k: 'q', v: args[0].v.sub(fromBase(toBase(args[1]), args[0].u)), u: args[0].u }; }
    case 'mean': { if (args.length !== 1 || args[0].k !== 'list') throw new EvalError('E_TYPE', 'mean(list)'); const xs = args[0].items; if (!xs.length) throw new EvalError('E_EMPTY_AGG', 'mean of an empty list'); let sum = new Dec(0, 0); xs.forEach((x) => { sameDim(xs[0], x); sum = sum.add(fromBase(toBase(x), xs[0].u)); }); return { k: 'q', v: sum.div(new Dec(xs.length, 0), 12), u: xs[0].u }; }
    case 'count': { if (args.length !== 1 || args[0].k !== 'list') throw new EvalError('E_TYPE', 'count(list)'); return { k: 'q', v: new Dec(args[0].items.length, 0), u: '' }; }
    default: throw new EvalError('E_FUNCTION', 'Unknown function ' + a.fn, { fn: a.fn });
  }
}
function evaluate(src, scope) { const a = parseExpr(src); if (astSize(a) > MAX_AST) throw new EvalError('E_BUDGET_EXCEEDED', 'Expression too large'); return evalAst(a, scope); }

/* static type/dimension check: env.typeOf(path) -> {k:'q', dim} | {k:'list', dim} | {k:'bool'} | {k:'str'} | null (unknown) */
function typeCheck(a, env) {
  switch (a.t) {
    case 'num': return { k: 'q', dim: unitDim(a.u || '') };
    case 'str': return { k: 'str' }; case 'bool': return { k: 'bool' };
    case 'ref': { const t = env.typeOf(a.path); if (!t) throw new EvalError('E_REF', 'Unknown reference ' + a.path.join('.'), { path: a.path.join('.') }); return t; }
    case 'un': { const x = typeCheck(a.x, env); return a.op === 'not' ? { k: 'bool' } : x; }
    case 'bin': {
      const l = typeCheck(a.l, env), r = typeCheck(a.r, env);
      if (['and', 'or'].includes(a.op)) return { k: 'bool' };
      if (l.k === 'q' && r.k === 'q' && ['<', '<=', '==', '!=', '>=', '>', '+', '-'].includes(a.op) && l.dim !== r.dim) throw new EvalError('E_DIM_MISMATCH', 'Dimension mismatch: expected ' + dimName(l.dim) + ', got ' + dimName(r.dim), { expected: dimName(l.dim), got: dimName(r.dim) });
      if (['<', '<=', '==', '!=', '>=', '>'].includes(a.op)) return { k: 'bool' };
      if (a.op === '*') return { k: 'q', dim: l.dim && r.dim ? l.dim + '·' + r.dim : l.dim || r.dim };
      if (a.op === '/') return { k: 'q', dim: l.dim && r.dim ? (l.dim === r.dim ? '' : l.dim + '/' + r.dim) : l.dim };
      return l;
    }
    case 'call': { const ts = a.args.map((x) => typeCheck(x, env)); if (a.fn === 'mean') return { k: 'q', dim: ts[0] && ts[0].dim }; if (a.fn === 'count') return { k: 'q', dim: '' }; if (['abs', 'min', 'max', 'deviation'].includes(a.fn)) return { k: 'q', dim: ts[0] && ts[0].dim }; throw new EvalError('E_FUNCTION', 'Unknown function ' + a.fn, { fn: a.fn }); }
  }
  return { k: 'q', dim: '' };
}
const dimName = (d) => (d === '' ? 'dimensionless' : d === null || d === undefined ? 'unknown' : d);

/* ---------------- deterministic counter-based PRNG (simulator only) ---------------- */
function rand32(seed, n) { let x = (seed ^ Math.imul(n + 1, 0x9E3779B1)) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x85EBCA6B) >>> 0; x = Math.imul(x ^ (x >>> 13), 0xC2B2AE35) >>> 0; return (x ^ (x >>> 16)) >>> 0; }
/* integer noise in [-amp, +amp] thousandths -> Dec with scale 3 (no float is stored) */
const noiseDec = (seed, n, amp) => new Dec(BigInt((rand32(seed, n) % (2 * amp + 1)) - amp), 3).norm();

/* ---------------- procedure tree operations (shared by pointer drag-and-drop, keyboard and outline) ---------------- */
const SLOTS = { 'flow.foreach': ['body'], 'flow.if': ['then', 'else'], 'flow.repeat_until': ['body'], 'flow.try': ['body', 'handler', 'finally'] };
const slotsOf = (node) => SLOTS[node.type] || [];
const LANES = ['setup', 'as_found', 'teardown', 'safe_state'];
const cloneJ = (x) => JSON.parse(JSON.stringify(x));
function laneList(proc, lane) { if (lane === 'setup' || lane === 'teardown' || lane === 'safe_state') return proc.lifecycle[lane]; const ph = proc.lifecycle.phases.find((p) => p.id === lane); return ph ? ph.body : null; }
function getList(proc, ref) { if (ref.parent) { const n = findNode(proc, ref.parent); return n && n.node[ref.slot] ? n.node[ref.slot] : null; } return laneList(proc, ref.lane); }
/* walk in execution/reading order; fn(node, info) with info {list, index, ref, depth, lane, parent} */
function walk(proc, fn) {
  const visit = (list, ref, depth, lane, parent) => { list.forEach((node, index) => { fn(node, { list, index, ref, depth, lane, parent }); slotsOf(node).forEach((sl) => visit(node[sl] || (node[sl] = []), { parent: node.id, slot: sl, lane }, depth + 1, lane, node)); }); };
  visit(proc.lifecycle.setup, { lane: 'setup' }, 0, 'setup', null);
  proc.lifecycle.phases.forEach((ph) => visit(ph.body, { lane: ph.id }, 0, ph.id, null));
  visit(proc.lifecycle.teardown, { lane: 'teardown' }, 0, 'teardown', null);
  visit(proc.lifecycle.safe_state, { lane: 'safe_state' }, 0, 'safe_state', null);
}
function findNode(proc, id) { let hit = null; walk(proc, (n, info) => { if (!hit && n.id === id) hit = { node: n, ...info }; }); return hit; }
function nodeCount(proc) { let c = 0; walk(proc, () => c++); return c; }
function freshId(proc, type) { const base = type.split('.').pop().replace(/[^a-z0-9]/g, '_'); const used = new Set(); walk(proc, (n) => used.add(n.id)); let i = 1; while (used.has(base + '_' + i)) i++; return base + '_' + i; }
const MAX_NODES = 120, MAX_DEPTH = 6;
function insertNode(proc, node, ref, index) { const list = getList(proc, ref); if (!list) throw new Error('target list missing'); const at = index === undefined || index > list.length ? list.length : index; list.splice(at, 0, node); return node.id; }
function removeNode(proc, id) { const f = findNode(proc, id); if (!f) return null; f.list.splice(f.index, 1); return f.node; }
function isDescendant(node, id) { let hit = false; (function r(n) { slotsOf(n).forEach((s) => (n[s] || []).forEach((c) => { if (c.id === id) hit = true; r(c); })); })(node); return hit; }
function moveNode(proc, id, ref, index) {
  const f = findNode(proc, id); if (!f) return false;
  if (ref.parent && (ref.parent === id || isDescendant(f.node, ref.parent))) return false; /* cannot move a container into itself */
  const same = getList(proc, ref) === f.list; const node = removeNode(proc, id); let at = index === undefined ? getList(proc, ref).length : index; if (same && f.index < at) at--; insertNode(proc, node, ref, at); return true;
}
function depthOfRef(proc, ref) { let d = 0, r = ref; while (r.parent) { d++; const f = findNode(proc, r.parent); r = f.ref; } return d; }
function newNode(proc, type, init) { const id = freshId(proc, type); const n = { id, type, ...(init || {}) }; slotsOf(n).forEach((s) => (n[s] = n[s] || [])); return n; }
/* flatten for diff / outline: ordered list of {id, type, depth, lane, slot, parent} */
function flattenProc(proc) { const out = []; walk(proc, (n, i) => out.push({ id: n.id, type: n.type, depth: i.depth, lane: i.lane, slot: i.ref.slot || null, parent: i.ref.parent || null, node: n })); return out; }
