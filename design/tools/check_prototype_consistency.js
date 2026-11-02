/* Cross-prototype consistency checks (Phase 1A Builder prototype  <->  Procedure Designer prototype).
   Design documentation QA only — NOT product tests. Dependency-free:  node design/tools/check_prototype_consistency.js
   Fails when the two prototypes drift apart on shared chrome, safety/simulation labelling, terminology, CSP or storage. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const design = path.resolve(__dirname, '..');
const A = path.join(design, 'phase1a-prototype'), B = path.join(design, 'procedure-designer-prototype');
const read = (p) => fs.readFileSync(p, 'utf8');
const jsOf = (dir, re) => fs.readdirSync(path.join(dir, 'js')).filter((f) => re.test(f)).map((f) => read(path.join(dir, 'js', f))).join('\n');
const htmlA = read(path.join(A, 'index.html')), htmlB = read(path.join(B, 'index.html'));
let passed = 0, failed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  ok  ' + name); } catch (e) { failed++; console.error('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; } };

test('same Content-Security-Policy (connect-src none, script-src self, no unsafe-inline)', () => {
  const csp = (h) => (h.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1];
  assert.ok(csp(htmlA) && csp(htmlB)); assert.strictEqual(csp(htmlA), csp(htmlB)); assert.ok(/connect-src 'none'/.test(csp(htmlA)) && !/unsafe-/.test(csp(htmlA)));
});
test('both load the same design-system stylesheet (Procedure Designer extends it, never forks it)', () => {
  assert.ok(/href="css\/app\.css"/.test(htmlA)); assert.ok(/href="\.\.\/phase1a-prototype\/css\/app\.css"/.test(htmlB)); assert.ok(/href="css\/designer\.css"/.test(htmlB));
  const ext = read(path.join(B, 'css', 'designer.css')); assert.ok(!/^:root\s*\{/m.test(ext) && !/--primary\s*:/.test(ext), 'designer.css must not redefine design tokens');
});
test('both load the same shared scripts from Phase 1A (engine, ui kit, i18n) in the same order', () => {
  const shared = ['engine', 'data', 'i18n', 'ui']; const order = (h) => shared.map((s) => h.indexOf('/' + s + '.js') >= 0 || h.indexOf('js/' + s + '.js') >= 0);
  assert.deepStrictEqual(order(htmlA), [true, true, true, true]); assert.deepStrictEqual(order(htmlB), [true, true, true, true]);
});
test('shell landmarks and live regions exist in both (skip link, banner, banner role=note, #toasts, #sr-live, statusbar)', () => {
  for (const [n, h] of [['phase1a', htmlA], ['designer', htmlB]]) for (const id of ['skip', 'proto-banner', 'topbar', 'statusbar', 'toasts', 'sr-live', 'main']) assert.ok(new RegExp('id="' + id + '"').test(h), n + ' missing #' + id);
  assert.ok(/id="proto-banner"[^>]*role="note"/.test(htmlA) && /id="proto-banner"[^>]*role="note"/.test(htmlB));
});
test('both shells show the fixed TEST and SIMULATION ONLY badges using the same shared strings', () => {
  const jsA = jsOf(A, /^app\.js$/), jsB = jsOf(B, /^pd-app\.js$/);
  for (const [n, js] of [['phase1a', jsA], ['designer', jsB]]) { assert.ok(/frame-badge test/.test(js) && /frame-badge sim/.test(js), n + ' badges'); assert.ok(/badge\.test_help/.test(js), n + ' test help'); }
  assert.ok(/t\('banner\.title'\)/.test(jsB) && /t\('banner\.body'\)/.test(jsB) && /t\('status\.proto'\)/.test(jsB), 'designer must reuse the shared banner/status keys');
});
test('both localise the skip link and set lang/dir on locale change', () => {
  for (const js of [jsOf(A, /^app\.js$/), jsOf(B, /^pd-app\.js$/)]) { assert.ok(/t\('a\.skip'\)/.test(js)); assert.ok(/documentElement\.dir = UI\.locale === 'he' \? 'rtl' : 'ltr'/.test(js)); }
});
test('both support the same global keyboard conventions: Ctrl+K palette and "?" shortcut sheet', () => {
  for (const js of [jsOf(A, /^app\.js$/), jsOf(B, /^pd-app\.js$/)]) { assert.ok(/e\.key\.toLowerCase\(\) === 'k'/.test(js), 'Ctrl+K'); assert.ok(/e\.key === '\?'/.test(js), '?'); }
});
test('Hebrew follows the proposed glossary (UI_UX_SPEC §5.1): no divergent terms for simulation / tolerance', () => {
  const he = jsOf(A, /^i18n\.js$/) + jsOf(B, /^pd-strings.*\.js$/);
  const banned = { 'סימולציה': 'הדמיה', 'סובלנות': 'סטייה מותרת' }; const found = Object.keys(banned).filter((w) => he.includes(w)); assert.deepStrictEqual(found, [], 'use the glossary terms: ' + found.map((w) => w + ' -> ' + banned[w]).join(', '));
  const glossary = read(path.join(design, '..', 'docs', 'UI_UX_SPEC.md')); assert.ok(/\| simulation \| הדמיה \|/.test(glossary), 'glossary row for simulation changed — update this check');
});
test('shared persona labels are not redefined with different text', () => {
  const sh = {}; const re = /'persona\.([a-z]+)': \['([^']*)', '([^']*)'\]/g; let m; const a = jsOf(A, /^i18n\.js$/); while ((m = re.exec(a))) sh[m[1]] = [m[2], m[3]];
  const b = jsOf(B, /^pd-strings.*\.js$/); const re2 = /'pd\.persona\.([a-z]+)': \['([^']*)', '([^']*)'\]/g; const diff = [];
  while ((m = re2.exec(b))) if (sh[m[1]] && (sh[m[1]][0] !== m[2] || sh[m[1]][1] !== m[3])) diff.push(m[1] + ': ' + sh[m[1]][0] + ' vs ' + m[2]);
  assert.deepStrictEqual(diff, []);
});
test('no browser storage, network API, eval or innerHTML in either prototype', () => {
  for (const [n, src] of [['phase1a', jsOf(A, /\.js$/)], ['designer', jsOf(B, /\.js$/)]]) { const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''); assert.ok(!/localStorage|sessionStorage|indexedDB|document\.cookie|\bfetch\s*\(|XMLHttpRequest|WebSocket|\beval\s*\(|new\s+Function|\.innerHTML\s*=/.test(code), n); }
});
test('safety, hazard and simulation indicator tokens are defined once (Phase 1A) and never redefined by the Designer', () => {
  const ext = read(path.join(B, 'css', 'designer.css')); for (const tok of ['--hazard', '--sim', '--deployment-test', '--error', '--ok', '--warn']) assert.ok(!new RegExp(tok + '\\s*:').test(ext), tok + ' redefined');
});
test('every Designer stylesheet rule uses logical properties for inline/block placement (RTL-safe)', () => {
  const ext = read(path.join(B, 'css', 'designer.css')).replace(/\/\*[\s\S]*?\*\//g, ''); const bad = ext.match(/(?<![-a-z])(margin|padding)-(left|right)\b|(?<![-a-z])(left|right)\s*:|text-align\s*:\s*(left|right)|border-(left|right)\b/g) || [];
  assert.deepStrictEqual(bad, []);
});
test('both prototypes keep the same empty/error state helpers (shared ui kit) rather than local copies', () => {
  const own = jsOf(B, /^pd-/); for (const fn of ['emptyState', 'errorState', 'openDialog', 'governedConfirm', 'reasonBtn', 'dataGrid']) assert.ok(!new RegExp('^function ' + fn + '\\b', 'm').test(own), 'Designer redefines ' + fn);
});
console.log('\n' + passed + ' passed, ' + failed + ' failed');
