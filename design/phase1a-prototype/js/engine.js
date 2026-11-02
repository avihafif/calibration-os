/* CalOS Phase 1A DESIGN PROTOTYPE — engine (non-operational, synthetic data only).
   Pure helpers + in-memory store. Nothing here is security enforcement: persona
   permissions are a UX demonstration; real enforcement is server-side (Phase 1B). */
'use strict';

/* ---------- DOM helper (text nodes only; no HTML parsing anywhere) ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style') el.style.cssText = v; /* CSSOM, allowed under a strict CSP */
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

/* ---------- SHA-256 (synchronous; prototype digests only) ---------- */
const SHA = (() => {
  const primes = [];
  for (let n = 2; primes.length < 64; n++) if (primes.every((p) => n % p)) primes.push(n);
  const frac = (x) => Math.floor((x - Math.floor(x)) * 4294967296) >>> 0;
  const K = primes.map((p) => frac(Math.cbrt(p)));
  const H0 = primes.slice(0, 8).map((p) => frac(Math.sqrt(p)));
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  return function sha256(str) {
    const bytes = new TextEncoder().encode(str);
    const l = bytes.length, bitLen = l * 8;
    const total = (((l + 9 + 63) >> 6) << 6);
    const buf = new Uint8Array(total);
    buf.set(bytes); buf[l] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 8, Math.floor(bitLen / 4294967296)); dv.setUint32(total - 4, bitLen >>> 0);
    const H = H0.slice(), w = new Uint32Array(64);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, hh].forEach((v, i) => { H[i] = (H[i] + v) >>> 0; });
    }
    return H.map((v) => v.toString(16).padStart(8, '0')).join('');
  };
})();

/* Canonical JSON (sorted keys, no whitespace). Decimals are strings: no floats are ever produced. */
function canon(v) {
  if (v === null || typeof v === 'boolean') return String(v);
  if (typeof v === 'number') { if (!Number.isInteger(v)) throw new Error('float'); return String(v); }
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const digestOf = (content) => 'sha256:' + SHA(canon(content));
const shortDigest = (d) => (d || '').replace('sha256:', '').slice(0, 10) + '…';

/* ---------- utilities ---------- */
const clone = (x) => JSON.parse(JSON.stringify(x));
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
function getPath(obj, ptr) {
  if (ptr === '' || ptr === '/') return obj;
  let cur = obj;
  for (const seg of ptr.split('/').slice(1)) { if (cur == null) return undefined; cur = cur[seg.replace(/~1/g, '/').replace(/~0/g, '~')]; }
  return cur;
}
function setPath(obj, ptr, val) {
  const segs = ptr.split('/').slice(1).map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
  let cur = obj;
  segs.slice(0, -1).forEach((s, i) => { if (cur[s] == null) cur[s] = /^\d+$/.test(segs[i + 1]) ? [] : {}; cur = cur[s]; });
  const last = segs[segs.length - 1];
  if (val === undefined) { if (Array.isArray(cur)) cur.splice(+last, 1); else delete cur[last]; } else cur[last] = val;
}
const esc = (s) => String(s).replace(/~/g, '~0').replace(/\//g, '~1');
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 62);
const isInput = (v) => isObj(v) && typeof v.$input === 'string';
/* every `{$ref:{kind,key}}` found anywhere in a content tree (generic dependency scan) */
const refKeys = (content) => { const out = []; (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (isObj(v)) { if (v.$ref && v.$ref.kind) out.push(v.$ref); else Object.values(v).forEach(walk); } })(content); return out; };
const DEC = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

/* ---------- schema validation (closed subset; mirrors fail-closed intent of the real validator) ---------- */
const hintWidget = (s) => ((s && s['x-calos-editor']) || {}).widget;
function validateAgainst(schema, value, ptr, defs, out, ctx) {
  if (schema.$ref) { const t = defs[schema.$ref.replace('#/$defs/', '')]; if (!t) { out.push({ code: 'PR-002', sev: 'error', ptr, stage: 'refs' }); return; } return validateAgainst(t, value, ptr, defs, out, ctx); }
  if (schema.oneOf) {
    /* choose the branch by structure so the author sees the specific error, not a generic "oneOf" failure */
    const res = (s) => (s.$ref ? defs[s.$ref.replace('#/$defs/', '')] : s);
    const kind = (v) => (Array.isArray(v) ? 'array' : isObj(v) ? 'object' : typeof v);
    const fits = schema.oneOf.map(res).filter((s) => s && s.type === kind(value));
    if (!fits.length) { if (value !== undefined) out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'schema', params: { detail: 'oneOf' } }); return; }
    const score = (s) => (isObj(value) ? Object.keys(value).filter((k) => s.properties && s.properties[k]).length : 0);
    const best = fits.sort((x, y) => score(y) - score(x))[0];
    return validateAgainst(best, value, ptr, defs, out, ctx);
  }
  const hint = schema['x-calos-editor'] || {};
  const typeOk = { object: isObj(value), array: Array.isArray(value), string: typeof value === 'string', boolean: typeof value === 'boolean', integer: Number.isInteger(value) }[schema.type];
  if (value === undefined) return;
  if (!typeOk) { out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'schema', params: { detail: 'type' } }); return; }
  if (schema.const !== undefined && value !== schema.const) out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'schema', params: { detail: 'const' } });
  if (schema.enum && !schema.enum.includes(value)) out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'schema', params: { detail: 'enum' } });
  if (schema.type === 'string') {
    if (schema.minLength && value.length < schema.minLength) out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'schema', params: { detail: 'minLength' } });
    if (schema.maxLength && value.length > schema.maxLength) out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'schema', params: { detail: 'maxLength' } });
    if (schema.pattern && !new RegExp('^(?:' + schema.pattern + ')$').test(value)) out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'schema', params: { detail: 'pattern', hint: hint.pattern_help } });
    if (hint.widget === 'decimal-string' && !DEC.test(value)) out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'schema', params: { detail: 'decimal' } });
  }
  if (schema.type === 'object') {
    for (const r of schema.required || []) if (value[r] === undefined || value[r] === '' || (isObj(value[r]) && hintWidget(schema.properties[r]) === 'localized' && !Object.values(value[r]).some((x) => String(x).trim())))
      out.push({ code: r.endsWith('_inclusive') ? 'PR-015' : 'PR-001', sev: 'error', ptr: ptr + '/' + esc(r), stage: 'schema', params: { detail: 'required' } });
    for (const k of Object.keys(value)) {
      if (!schema.properties || !schema.properties[k]) { if (schema.additionalProperties === false) out.push({ code: 'PR-001', sev: 'error', ptr: ptr + '/' + esc(k), stage: 'schema', params: { detail: 'unknown' } }); continue; }
      if (schema.properties[k]['x-calos-editor']?.widget === 'localized' || schema.properties[k].additionalProperties === undefined || true) validateAgainst(schema.properties[k], value[k], ptr + '/' + esc(k), defs, out, ctx);
    }
    if (hint.widget === 'localized') {
      for (const [loc, txt] of Object.entries(value)) if (typeof txt !== 'string') out.push({ code: 'PR-001', sev: 'error', ptr: ptr + '/' + loc, stage: 'schema', params: { detail: 'type' } });
    }
  }
  if (schema.type === 'array') {
    if (schema.minItems && value.length < schema.minItems) out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'schema', params: { detail: 'minItems' } });
    if (schema.uniqueItems && new Set(value.map((v) => canon(v))).size !== value.length) out.push({ code: 'PR-001', sev: 'error', ptr, stage: 'semantic', params: { detail: 'unique' } });
    if (hint.unique_by) { const seen = new Set(); value.forEach((it, i) => { const k = it && it[hint.unique_by]; if (k && seen.has(k)) out.push({ code: 'PR-001', sev: 'error', ptr: ptr + '/' + i + '/' + hint.unique_by, stage: 'semantic', params: { detail: 'duplicate' } }); seen.add(k); }); }
    value.forEach((it, i) => validateAgainst(schema.items, it, ptr + '/' + i, defs, out, ctx));
  }
  /* semantic / policy checks driven by hints, not by kind */
  if (hint.widget === 'localized' && ctx.policy) {
    for (const loc of ctx.policy.required_locales) if (!value || !String(value[loc] || '').trim()) {
      if (hint.localized_required !== false) out.push({ code: 'I18N-001', sev: 'warning', ptr, stage: 'i18n', params: { locale: loc }, fix: 'add-locale' });
    }
  }
  if (hint.widget === 'reference' && value && value.$ref) {
    const t = ctx.lookup(value.$ref.kind, value.$ref.key);
    if (!t) out.push({ code: 'PR-002', sev: 'error', ptr, stage: 'refs' });
    else if (!t.versions.length) out.push({ code: 'APP-001', sev: 'warning', ptr, stage: 'refs', params: { key: value.$ref.key } });
  }
  if (isInput(value)) out.push({ code: 'PR-013', sev: 'warning', ptr, stage: 'metrology', params: { mi: value.$input } });
}

function validateItem(kindDef, content, ctx) {
  const out = [];
  validateAgainst(kindDef.schema, content, '', kindDef.schema.$defs || {}, out, ctx);
  const seen = new Set();
  return out.filter((f) => { const k = f.code + f.ptr + JSON.stringify(f.params || {}); if (seen.has(k)) return false; seen.add(k); return true; });
}

/* ---------- structural diff (id-aware for lists of records, so moves/renames are not delete+add) ---------- */
function flatten(v, ptr, out) {
  if (Array.isArray(v)) {
    const byId = v.length && v.every((x) => isObj(x) && typeof x.id === 'string');
    v.forEach((x, i) => flatten(x, ptr + '/' + (byId ? '[id=' + x.id + ']' : i), out));
    if (!v.length) out[ptr] = '[]';
  } else if (isObj(v) && !isInput(v)) {
    const ks = Object.keys(v); ks.forEach((k) => flatten(v[k], ptr + '/' + k, out)); if (!ks.length) out[ptr] = '{}';
  } else out[ptr] = isInput(v) ? 'Input required · ' + v.$input : v;
  return out;
}
function diff(a, b) {
  const fa = flatten(a || {}, '', {}), fb = flatten(b || {}, '', {}), rows = [];
  new Set([...Object.keys(fa), ...Object.keys(fb)]).forEach((p) => {
    if (!(p in fa)) rows.push({ ptr: p, type: 'added', after: fb[p] });
    else if (!(p in fb)) rows.push({ ptr: p, type: 'removed', before: fa[p] });
    else if (canon(fa[p]) !== canon(fb[p])) rows.push({ ptr: p, type: 'changed', before: fa[p], after: fb[p] });
  });
  return rows.sort((x, y) => x.ptr.localeCompare(y.ptr));
}
/* change class: raise-only suggestion from structural diff, driven by hint-declared classes */
function classify(rows, kindDef) {
  const rank = { editorial: 0, functional: 1, metrological: 2, breaking: 3 };
  let cls = rows.length ? 'editorial' : 'none', why = [];
  const rules = kindDef.change_classes || [];
  for (const r of rows) {
    let c = 'functional';
    for (const rule of rules) if (new RegExp(rule.match).test(r.ptr)) { c = rule.cls; break; }
    if (r.type === 'removed' && (/\[id=[^\]]+\]\/id$/.test(r.ptr) || /^\/capabilities\//.test(r.ptr))) c = 'breaking';
    if (cls === 'none' || rank[c] > rank[cls]) cls = c;
    if (rank[c] >= rank[cls]) why.push(r.ptr);
  }
  return { cls, why: why.slice(0, 4) };
}
const BUMP = { initial: null, none: null, editorial: 'patch', functional: 'minor', metrological: 'minor', breaking: 'major' };
function nextVersion(cur, bump) {
  if (!cur) return '1.0.0';
  const [a, b, c] = cur.split('.').map(Number);
  return bump === 'major' ? `${a + 1}.0.0` : bump === 'minor' ? `${a}.${b + 1}.0` : `${a}.${b}.${c + 1}`;
}
const semverGte = (x, y) => { const p = x.split('.').map(Number), q = y.split('.').map(Number); for (let i = 0; i < 3; i++) { if (p[i] !== q[i]) return p[i] > q[i]; } return true; };

/* contrast (WCAG 2.x) for the theme tester and self-check */
function lum(hex) { const c = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function contrast(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

/* ---------- in-memory store (resets on reload; never persists; never touches the network) ---------- */
const PERSONAS = {
  engineer: { perms: ['draft', 'submit', 'review.comment'], nav: ['dashboard', 'instruments', 'apps', 'equipment', 'review', 'design'] },
  approver: { perms: ['approve', 'review.comment'], nav: ['dashboard', 'instruments', 'apps', 'equipment', 'review', 'design'] },
  quality: { perms: ['approve.application', 'publish', 'withdraw', 'review.comment', 'policy.view'], nav: ['dashboard', 'instruments', 'apps', 'equipment', 'review', 'design', 'settings'] },
  manager: { perms: ['view'], nav: ['dashboard', 'instruments', 'apps', 'equipment', 'review', 'design'] },
  admin: { perms: ['admin', 'grant.propose'], nav: ['dashboard', 'settings', 'design'] },
  technician: { perms: [], nav: [] },
};
const can = (persona, p) => PERSONAS[persona].perms.includes(p);

const Store = (() => {
  const S = { items: [], audit: [], persona: 'engineer', policy: { required_locales: ['en'] }, offline: false, seq: 1, listeners: [] };
  const now = () => new Date('2026-11-02T09:00:00Z').getTime() + (S.seq++) * 60000;
  const stamp = () => new Date(now()).toISOString().replace('.000Z', 'Z');
  function emit() { S.listeners.forEach((f) => f()); }
  function log(item, actor, action, detail) {
    const prev = S.audit.length ? S.audit[S.audit.length - 1].hash : 'genesis';
    const e = { at: stamp(), actor, action, item: item ? item.kind + '/' + item.key : '—', detail: detail || '' };
    e.hash = 'sha256:' + SHA(prev + canon(e)); S.audit.push(e); return e;
  }
  const find = (kind, key) => S.items.find((i) => i.kind === kind && i.key === key);
  function create(kind, key, content, actor, opts) {
    const it = { kind, key, versions: [], draft: { content: clone(content), revision: 1, state: 'draft', author: actor, contributors: [actor], lease: actor, provenance: (opts && opts.provenance) || 'synthetic_demo', snapshot: null, base: null, comments: [] } };
    S.items.push(it); log(it, actor, 'draft.created'); return it;
  }
  function publishSeed(it, version, notes, actor, cls) {
    const content = clone(it.draft ? it.draft.content : it.versions[it.versions.length - 1].content);
    it.versions.push({ version, digest: digestOf(content), content, by: actor, at: stamp(), cls: cls || 'editorial', notes: notes || '', provenance: it.draft ? it.draft.provenance : 'synthetic_demo', approvals: [{ by: 'approver', reason: 'seed' }] });
    it.draft = null; log(it, actor, 'version.published', version);
  }
  return {
    S, find, create, publishSeed, log, emit,
    on(f) { S.listeners.push(f); },
    audit: () => S.audit,
    items: (kind) => S.items.filter((i) => !kind || i.kind === kind),
    latest: (it) => it.versions[it.versions.length - 1] || null,
    status(it) { return it.draft ? it.draft.state : (it.versions.length ? (it.withdrawn ? 'withdrawn' : 'published') : 'draft'); },
    saveDraft(it, content, actor) { const d = it.draft; d.content = clone(content); d.revision++; if (!d.contributors.includes(actor)) d.contributors.push(actor); log(it, actor, 'draft.edited', 'r' + d.revision); },
    newDraft(it, actor) { const v = it.versions[it.versions.length - 1]; it.draft = { content: clone(v.content), revision: 1, state: 'draft', author: actor, contributors: [actor], lease: actor, provenance: v.provenance, snapshot: null, base: v.version, comments: [] }; log(it, actor, 'draft.created', 'from v' + v.version); },
    submit(it, actor, digest) { const d = it.draft; d.state = 'in_review'; d.snapshot = { digest, frozenAt: stamp(), approvals: [] }; log(it, actor, 'draft.submitted', shortDigest(digest)); },
    reject(it, actor, reason) { const d = it.draft; d.state = 'draft'; d.snapshot = null; d.revision++; log(it, actor, 'review.changes_requested', reason); },
    approve(it, actor, persona, reason) { const d = it.draft; d.snapshot.approvals.push({ by: actor, persona, reason, at: stamp() }); d.state = 'approved'; log(it, actor, 'review.approved', shortDigest(d.snapshot.digest)); },
    publish(it, actor, version, notes, cls) {
      const d = it.draft; const content = clone(d.content);
      it.versions.push({ version, digest: digestOf(content), content, by: actor, at: stamp(), cls, notes, provenance: d.provenance, approvals: d.snapshot.approvals.slice() });
      it.draft = null; log(it, actor, 'version.published', version + ' ' + shortDigest(digestOf(content)));
    },
    discard(it, actor) { it.draft = null; log(it, actor, 'draft.discarded'); if (!it.versions.length) S.items.splice(S.items.indexOf(it), 1); },
    withdraw(it, actor, reason) { it.withdrawn = true; log(it, actor, 'version.withdrawn', reason); },
    stamp,
  };
})();
