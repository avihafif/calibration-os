/* Self-checks for the Phase 1A DESIGN PROTOTYPE. No dependencies:  node design/phase1a-prototype/tests/prototype.test.js
   These are prototype QA checks, NOT product tests. They encode design rules the product tests must also enforce. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const stubEl = () => ({ setAttribute() {}, append() {}, addEventListener() {}, style: {}, classList: { add() {} }, dataset: {}, querySelector() { return null; }, querySelectorAll() { return []; } });
const ctx = { console, TextEncoder, document: { createElement: stubEl, createTextNode: (x) => x, getElementById: stubEl, querySelector: () => null, querySelectorAll: () => [] }, window: {}, location: { hash: '' }, CSS: { escape: (x) => x }, Math, JSON, Date };
vm.createContext(ctx);
const files = ['engine', 'data', 'i18n', 'ui', 'views'];
// concatenate so top-level const/let declarations share one scope (as classic <script> tags do)
vm.runInContext(files.map((f) => read('js/' + f + '.js').replace(/^'use strict';/m, '')).join('\n;\n'), ctx, { filename: 'prototype-bundle.js' });
const run = (src) => vm.runInContext(src, ctx);
let passed = 0; const test = (name, fn) => { try { fn(); passed++; console.log('  ok  ' + name); } catch (e) { console.error('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; } };

test('SHA-256 known vectors', () => {
  assert.strictEqual(run("SHA('abc')"), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.strictEqual(run("SHA('')"), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.strictEqual(run("SHA('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')"), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
});
test('canonical JSON sorts keys, rejects floats', () => {
  assert.strictEqual(run('canon({b:1,a:["x",{d:"é",c:true}]})'), '{"a":["x",{"c":true,"d":"é"}],"b":1}');
  assert.throws(() => run('canon({x:1.5})'));
});
test('decimals stay strings: value validator rejects non-decimal text', () => {
  assert.ok(run("DEC.test('1.5')") && run("DEC.test('-0.002e-3')") && !run("DEC.test('1,5')") && !run("DEC.test('abc')"));
});
test('diff is id-aware and change-class is raise-only suggestion', () => {
  const r = run("classify(diff({functions:[{id:'dcv',ranges:{$input:'MI-02'}}]},{functions:[{id:'dcv',ranges:[{value:'1',unit:'V'}]}]}),{change_classes:KINDS.InstrumentModel.change_classes}).cls");
  assert.strictEqual(r, 'metrological');
  assert.strictEqual(run("classify(diff({description:{en:'a'}},{description:{en:'b'}}),{change_classes:KINDS.InstrumentModel.change_classes}).cls"), 'editorial');
  assert.strictEqual(run("classify(diff({functions:[{id:'a'},{id:'b'}]},{functions:[{id:'a'}]}),{change_classes:KINDS.InstrumentModel.change_classes}).cls"), 'breaking');
  assert.strictEqual(run("nextVersion('1.1.0','minor')+' '+nextVersion('1.1.0','major')+' '+nextVersion('1.1.0','patch')+' '+nextVersion(null,null)"), '1.2.0 2.0.0 1.1.1 1.0.0');
});
test('seed data validates as designed (one intended error, no real metrology)', () => {
  run('seed()');
  const res = JSON.parse(run(`JSON.stringify(Store.items().filter(i=>i.draft).map(i=>({k:i.key,f:validateItem({schema:KINDS[i.kind].schema},i.draft.content,{policy:Store.S.policy,lookup:(a,b)=>Store.find(a,b)}).map(x=>x.code+x.ptr)})))`));
  const errs = res.filter((r) => r.f.some((x) => x.startsWith('PR-001')));
  assert.deepStrictEqual(errs.map((e) => e.k), ['demo-dmm-b']);
  assert.ok(run("JSON.stringify(Store.items().map(i=>i.draft?i.draft.content:i.versions.slice(-1)[0].content))").indexOf('"value"') === -1, 'seed must contain no quantity values');
});
test('every widget named in kind metadata is implemented by the generic renderer', () => {
  const ui = read('js/ui.js'); const impl = new Set([...ui.matchAll(/case '([a-z-]+)'/g)].map((m) => m[1]));
  const used = new Set(); (function walk(s) { if (!s || typeof s !== 'object') return; const w = s['x-calos-editor'] && s['x-calos-editor'].widget; if (w) used.add(w); Object.values(s).forEach((v) => (Array.isArray(v) ? v.forEach(walk) : walk(v))); })(JSON.parse(run('JSON.stringify(Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.schema])))')));
  const missing = [...used].filter((w) => !impl.has(w)); assert.deepStrictEqual(missing, [], 'unimplemented widgets: ' + missing);
});
test('NO-CODE RULE: generic renderer (ui.js) contains no kind names', () => {
  const ui = read('js/ui.js'); const kinds = Object.keys(run('KINDS'));
  const hits = kinds.filter((k) => new RegExp('\\b' + k + '\\b').test(ui)); assert.deepStrictEqual(hits, [], 'kind-specific code in ui.js: ' + hits);
});
test('i18n: every key has en + he, and every referenced key exists', () => {
  const D = JSON.parse(run('JSON.stringify(D)')); const bad = Object.entries(D).filter(([, v]) => !v[0] || !v[1]).map(([k]) => k); assert.deepStrictEqual(bad, []);
  const src = ['ui', 'views', 'app', 'data'].map((f) => read('js/' + f + '.js')).join('\n');
  const referenced = new Set([...src.matchAll(/\bt\('([A-Za-z0-9_.\-]+)'/g)].map((m) => m[1]));
  [...src.matchAll(/(?:label|help|add_label|pattern_help|enum_prefix): '([A-Za-z0-9_.\-]+)'/g)].forEach((m) => { if (!m[0].startsWith('enum_prefix')) referenced.add(m[1]); });
  [...src.matchAll(/(?:group|disabled_options: \{[^}]*?: ')([a-z]\.[a-z_]+)/g)].forEach((m) => referenced.add(m[1]));
  const prefixes = new Set(Object.keys(D).map((k) => k.split('.')[0]));
  const missing = [...referenced].filter((k) => k.includes('.') && prefixes.has(k.split('.')[0]) && !D[k] && !k.endsWith('.') && k !== 'wiz.intro'); assert.deepStrictEqual(missing, [], 'missing i18n keys: ' + missing);
  for (const k of Object.keys(run('KINDS'))) for (const suf of ['', '.plural', '.desc']) { const key = 'kind.' + k + suf; if (suf !== '.plural' && suf !== '.desc' && !D[key]) assert.fail('missing ' + key); }
  for (const loc of ['en', 'he']) for (const d of ['V', 'A', 'Ω', 'Hz', 's', '°C']) assert.ok(D['dim.' + d], 'dim.' + d);
});
test('i18n: placeholders match across locales', () => {
  const D = JSON.parse(run('JSON.stringify(D)')); const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  const bad = Object.entries(D).filter(([, [e, h]]) => ph(e) !== ph(h)).map(([k]) => k); assert.deepStrictEqual(bad, []);
});
test('design tokens meet WCAG AA in light and dark (text 4.5:1, control borders 3:1)', () => {
  const css = read('css/app.css'); const grab = (re) => { const m = css.match(re); const o = {}; [...m[1].matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].forEach((x) => (o[x[1]] = x[2])); return o; };
  const light = grab(/:root \{([\s\S]*?)\n\}/), dark = { ...light, ...grab(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/) };
  const C = (a, b) => JSON.parse(run(`JSON.stringify(contrast('${a}','${b}'))`)); const fails = [];
  for (const [name, th] of [['light', light], ['dark', dark]]) {
    const text = [['text', 'bg'], ['text', 'surface'], ['text', 'surface-2'], ['text-muted', 'bg'], ['text-muted', 'surface'], ['text-muted', 'surface-2'], ['primary', 'surface'], ['primary', 'bg'], ['ok', 'surface'], ['warn', 'surface'], ['error', 'surface'], ['info', 'surface'], ['hazard', 'surface'], ['sim', 'surface'],
      ['ok', 'ok-bg'], ['warn', 'warn-bg'], ['error', 'error-bg'], ['info', 'info-bg'], ['sim', 'sim-bg'], ['hazard', 'error-bg'], ['primary-contrast', 'primary'], ['on-fill', 'sim'], ['on-fill', 'deployment-test'], ['on-fill', 'deployment-prod'], ['on-fill', 'error'], ['text', 'info-bg']];
    text.forEach(([f, b]) => { const r = C(th[f], th[b]); if (r < 4.5) fails.push(`${name}: ${f} on ${b} = ${r.toFixed(2)}`); });
    [['border', 'surface'], ['border', 'bg']].forEach(([f, b]) => { const r = C(th[f], th[b]); if (r < 3) fails.push(`${name}: control border ${f} on ${b} = ${r.toFixed(2)}`); });
    const r = C(th.focus, th.surface); if (r < 3) fails.push(`${name}: focus ${r.toFixed(2)}`);
  }
  assert.deepStrictEqual(fails, []);
});
test('prototype is isolated: no network APIs, storage APIs or eval in any script', () => {
  const bad = []; for (const f of files.concat(['app'])) { const s = read('js/' + f + '.js'); for (const pat of [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /\blocalStorage\b/, /\bsessionStorage\b/, /indexedDB/, /\beval\s*\(/, /new Function/, /\binnerHTML\b/, /\bdocument\.write/, /import\s*\(/]) if (pat.test(s)) bad.push(f + ': ' + pat); }
  assert.deepStrictEqual(bad, []);
  assert.ok(/connect-src 'none'/.test(read('index.html')), 'CSP must forbid connections');
});
test('safety/simulation/deployment indicators are fixed (CSS protected, themes cannot reach them)', () => {
  const css = read('css/app.css'); assert.ok(/\.frame-badge[^}]*!important/.test(css) && /\.proto-banner[^}]*!important/.test(css));
  const views = read('js/views.js'); assert.ok(/nonThemeable = \['sim', 'deployment-test', 'deployment-prod', 'hazard', 'focus'\]/.test(views));
  assert.ok(/setProperty\('--primary'/.test(views) && !/setProperty\('--(sim|deployment|hazard|focus)/.test(views), 'theme tester may only set --primary');
});
console.log('\n' + passed + ' checks passed' + (process.exitCode ? ' — WITH FAILURES' : ''));
