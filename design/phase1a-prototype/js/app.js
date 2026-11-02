/* CalOS Phase 1A DESIGN PROTOTYPE — shell, router, command palette, controls. Non-operational. */
'use strict';

const NAV = [
  ['dashboard', '#/dashboard', 'nav.dashboard', '▦'], ['instruments', '#/instruments/manufacturers', 'nav.instruments', '◫'], ['apps', '#/apps', 'nav.apps', '▤'],
  ['equipment', '#/equipment/roles', 'nav.equipment', '⌗'], ['review', '#/review', 'nav.review', '☑'], ['settings', '#/settings', 'nav.settings', '⚙'], ['design', '#/design', 'nav.design', '◐'],
];
const $ = (id) => document.getElementById(id);
function parseHash() {
  const [path, qs] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?');
  const q = Object.fromEntries(new URLSearchParams(qs || '')); return { seg: path.split('/').map(decodeURIComponent), q };
}
function applyLocale() { document.documentElement.lang = UI.locale; document.documentElement.dir = UI.locale === 'he' ? 'rtl' : 'ltr'; document.title = t('app.title'); const sk = document.getElementById('skip'); if (sk) sk.textContent = t('a.skip'); }
function applyTheme() { document.documentElement.setAttribute('data-theme', UI.theme); document.documentElement.style.removeProperty('--primary'); }

function buildChrome() {
  const me = persona();
  $('proto-banner').replaceChildren(h('strong', null, '◈ ' + t('banner.title')), ' ', t('banner.body'));
  const top = $('topbar'); top.replaceChildren(
    h('button', { class: 'btn icon navtoggle', type: 'button', 'aria-label': t('a.menu'), 'aria-expanded': 'false', 'aria-controls': 'nav', onclick: (e) => { const n = $('nav'); const o = n.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(o)); } }, '☰'),
    h('span', { class: 'brand' }, 'CalOS ', h('span', { class: 'brand-sub' }, t('app.builder'))),
    h('span', { class: 'frame-badge test', title: t('badge.test_help') }, '◆ TEST'), h('span', { class: 'frame-badge sim', title: t('badge.sim_help') }, '◈ ' + t('env.sim_only')),
    h('span', { class: 'spacer' }),
    h('button', { class: 'btn ghost search', type: 'button', onclick: openPalette, 'aria-label': t('a.search') + ' (Ctrl+K)' }, h('span', { 'aria-hidden': 'true' }, '⌕'), h('span', { class: 'hide-sm' }, ' ' + t('a.search')), h('kbd', { class: 'hide-sm' }, 'Ctrl K')),
    h('label', { class: 'persona', title: t('persona.help') }, h('span', { class: 'sr-only' }, t('persona.label')), h('span', { class: 'chip sim sm', 'aria-hidden': 'true' }, t('persona.chip')), h('select', { class: 'input sm', id: 'persona-sel', onchange: (e) => { Store.S.persona = e.target.value; Store.emit(); toast(t('toast.persona', { p: t('persona.' + e.target.value) })); route(true); } }, Object.keys(PERSONAS).map((p) => h('option', { value: p, selected: p === me ? true : null }, t('persona.' + p))))),
    btn(t('a.guide'), openGuide, 'ghost'), btn(UI.locale === 'en' ? 'עברית' : 'English', () => { UI.locale = UI.locale === 'en' ? 'he' : 'en'; applyLocale(); route(true); }, 'ghost', { lang: UI.locale === 'en' ? 'he' : 'en', 'aria-label': UI.locale === 'en' ? 'עברית' : 'English' }),
    btn(UI.theme === 'light' ? t('a.dark') : t('a.light'), () => { UI.theme = UI.theme === 'light' ? 'dark' : 'light'; applyTheme(); route(true); }, 'ghost', { 'aria-pressed': String(UI.theme === 'dark') }),
    iconBtn('⋯', t('a.controls'), openControls));
  const nav = $('nav'); nav.replaceChildren(h('ul', null, NAV.filter(([id]) => PERSONAS[me].nav.includes(id)).map(([id, href, key, g]) => h('li', null, h('a', { href, 'data-nav': id, class: 'navlink' }, h('span', { class: 'nav-g', 'aria-hidden': 'true' }, g), h('span', null, t(key)))))), h('div', { class: 'nav-foot muted sm' }, t('nav.foot')));
  buildStatus();
}
function buildStatus() {
  const fs = allFindings(), e = fs.filter((x) => x.f.sev === 'error').length, w = fs.filter((x) => x.f.sev === 'warning').length;
  $('statusbar').replaceChildren(h('span', null, t('status.proto')), h('span', { class: 'spacer' }), h('span', { role: 'status' }, t('n_errors', { n: e }) + ' · ' + t('n_warnings', { n: w })), Store.S.offline ? chip('warn sm', '⚠', t('st_offline')) : chip('ok sm', '●', t('st_online')), h('span', { class: 'muted' }, ltr('design-prototype 0.1')));
}

function route(rebuild) {
  if (rebuild) buildChrome();
  const { seg, q } = parseHash(); const root = $('main'); const me = persona();
  let view, navId = seg[0];
  if (me === 'technician' && seg[0] !== 'design') { view = viewTechnician(); navId = ''; }
  else if (seg[0] === 'dashboard') view = viewDashboard(seg[1]);
  else if (seg[0] === 'instruments') view = viewInstruments(seg[1]);
  else if (seg[0] === 'equipment') view = viewEquipment(seg[1]);
  else if (seg[0] === 'apps' && seg[1] === 'new') { view = viewWizard(); navId = 'apps'; }
  else if (seg[0] === 'apps') view = viewApps();
  else if (seg[0] === 'item') { view = viewEditor(seg[1], seg[2], seg[3], q); navId = KINDS[seg[1]] ? KINDS[seg[1]].nav.split('/')[0] : ''; }
  else if (seg[0] === 'review') view = viewReview();
  else if (seg[0] === 'design') view = viewDesign();
  else if (seg[0] === 'settings') view = (PERSONAS[me].nav.includes('settings') ? viewSettings() : [pageHead(t('state.forbidden')), banner('warn', t('reason.no_settings'))]);
  else { view = [pageHead(t('state.notfound')), errorState('NOT_FOUND')]; }
  root.replaceChildren(...view.filter(Boolean));
  document.querySelectorAll('.navlink').forEach((a) => { a.removeAttribute('aria-current'); if (a.dataset.nav === navId) a.setAttribute('aria-current', 'page'); });
  $('nav').classList.remove('open'); const tg = document.querySelector('.navtoggle'); tg && tg.setAttribute('aria-expanded', 'false');
  buildStatus();
  const key = location.hash;
  if (UI.lastRoute !== key) { const ttl = $('page-title'); if (ttl && !UI.first) ttl.focus({ preventScroll: true }); $('sr-live').textContent = (ttl && ttl.textContent) || ''; window.scrollTo(0, 0); }
  UI.lastRoute = key; UI.first = false;
}

/* ---------- command palette ---------- */
function openPalette() {
  const me = persona(); const cmds = [];
  NAV.filter(([id]) => PERSONAS[me].nav.includes(id)).forEach(([id, href, key]) => cmds.push({ label: t('pal.go') + ' ' + t(key), run: () => (location.hash = href) }));
  Store.items().forEach((i) => cmds.push({ label: titleOf(i).text + ' — ' + t('kind.' + i.kind) + ' · ' + i.key, run: () => (location.hash = '#/item/' + i.kind + '/' + i.key) }));
  cmds.push({ label: t('pal.lang'), run: () => { UI.locale = UI.locale === 'en' ? 'he' : 'en'; applyLocale(); route(true); } }, { label: t('pal.theme'), run: () => { UI.theme = UI.theme === 'light' ? 'dark' : 'light'; applyTheme(); route(true); } }, { label: t('pal.guide'), run: openGuide });
  Object.keys(PERSONAS).forEach((p) => cmds.push({ label: t('pal.persona') + ' ' + t('persona.' + p), run: () => { Store.S.persona = p; route(true); } }));
  const input = h('input', { class: 'input', type: 'text', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'pal-list', 'aria-label': t('a.search'), placeholder: t('pal.placeholder'), autofocus: true });
  const list = h('ul', { id: 'pal-list', role: 'listbox', class: 'pal-list' }); let sel = 0, shown = [];
  function paint() { const q = input.value.toLowerCase(); shown = cmds.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 9); sel = Math.min(sel, Math.max(0, shown.length - 1)); list.replaceChildren(...shown.map((c, i) => h('li', { role: 'option', id: 'po' + i, class: i === sel ? 'sel' : '', 'aria-selected': String(i === sel), onclick: () => run(i) }, c.label))); input.setAttribute('aria-activedescendant', shown.length ? 'po' + sel : ''); if (!shown.length) list.append(h('li', { class: 'muted pad' }, t('state.nomatch_title'))); }
  function run(i) { const c = shown[i]; if (c) { dlg.close(); setTimeout(c.run, 0); } }
  input.addEventListener('input', () => { sel = 0; paint(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); paint(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); paint(); } else if (e.key === 'Enter') { e.preventDefault(); run(sel); } });
  const dlg = openDialog({ title: t('a.search'), body: [input, list] }); paint();
}
function openGuide() {
  const steps = [['engineer', '#/item/InstrumentModel/demo-dmm-b', 'guide.1'], ['engineer', '#/apps/new', 'guide.2'], ['engineer', '#/item/Manufacturer/example-instruments', 'guide.3'], ['approver', '#/review', 'guide.4'], ['quality', '#/item/InstrumentModel/demo-dmm-a', 'guide.5'], ['quality', '#/item/InstrumentModel/demo-dmm-a/compare', 'guide.6'], ['engineer', '#/design', 'guide.7']];
  const dlg = openDialog({ title: t('a.guide'), wide: true, body: [h('p', { class: 'muted' }, t('guide.intro')), h('ol', { class: 'guide' }, steps.map(([p, href, k]) => h('li', null, h('div', null, h('strong', null, t('persona.' + p)), ' — ', t(k)), btn(t('guide.go'), () => { Store.S.persona = p; dlg.close(); location.hash = href; route(true); }, 'sm'))))] });
}
function openControls() {
  const lease = h('input', { type: 'checkbox', id: 'c-lease', onchange: (e) => { const p = parseHash(); if (p.seg[0] === 'item') { const it = Store.find(p.seg[1], p.seg[2]); if (it && it.draft) { it.draft.leaseSim = e.target.checked; route(); } } } });
  const off = h('input', { type: 'checkbox', id: 'c-off', checked: Store.S.offline ? true : null, onchange: (e) => { Store.S.offline = e.target.checked; route(true); } });
  const dlg = openDialog({ title: t('a.controls'), body: [h('p', { class: 'note sim' }, t('controls.note')), h('label', { class: 'check' }, off, h('span', null, t('controls.offline'))), h('label', { class: 'check' }, lease, h('span', null, t('controls.lease'))), h('p', { class: 'muted sm' }, t('controls.reset'))], actions: [btn(t('a.reset'), () => { location.reload(); }, 'ghost danger'), btn(t('a.close'), () => dlg.close(), 'primary')] });
}
function openShortcuts() {
  const rows = [['Ctrl K', 'sc.palette'], ['?', 'sc.sheet'], ['Ctrl J', 'sc.drawer'], ['Ctrl Z / Ctrl Shift Z', 'sc.undo'], ['↑ ↓ Enter', 'sc.grid'], ['Esc', 'sc.esc'], ['Tab / Shift Tab', 'sc.tab']];
  const dlg = openDialog({ title: t('a.shortcuts'), body: [h('table', { class: 'tbl' }, h('tbody', null, rows.map(([k, d]) => h('tr', null, h('td', null, h('kbd', null, k)), h('td', null, t(d))))))], actions: [btn(t('a.close'), () => dlg.close(), 'primary')] });
}
document.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase(); const typing = ['input', 'textarea', 'select'].includes(tag) && e.target.type !== 'checkbox' && e.target.type !== 'radio';
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!document.querySelector('.backdrop')) openPalette(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { const b = document.querySelector('.drawer-head .th-btn'); if (b) { e.preventDefault(); b.click(); } return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && ed.undoKey && !typing && !document.querySelector('.backdrop')) { if (ed.undoKey(e)) return; } /* inside text fields the browser's native text undo applies */
  if (e.key === '?' && !typing && !document.querySelector('.backdrop')) { e.preventDefault(); openShortcuts(); }
});
window.addEventListener('hashchange', () => route());

/* ---------- boot ---------- */
(function boot() {
  $('skip').addEventListener('click', (e) => { e.preventDefault(); $('main').focus(); });
  seed(); UI.first = true; applyLocale(); applyTheme();
  if (!location.hash) location.hash = '#/dashboard';
  buildChrome(); route();
  Store.on(() => buildStatus());
  /* self-check helpers used by the review script (no effect on behaviour) */
  window.__proto = { sha256: SHA, digestOf, contrast, missingI18n: () => [...MISSING] };
})();
