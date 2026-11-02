/* CalOS Procedure Designer DESIGN PROTOTYPE — shell, router, prototype controls. Non-operational, synthetic data, no network. */
'use strict';
/* DOM safety net: replaceChildren/append stringify null, so conditional children (cond ? node : null) would print "null". Drop empty values instead. */
['replaceChildren', 'append'].forEach((m) => { const orig = Element.prototype[m]; Element.prototype[m] = function (...kids) { return orig.apply(this, kids.filter((k) => k !== null && k !== undefined && k !== false)); }; });
const $ = (id) => document.getElementById(id);
const WS = [['design', 'pd.ws.design', '▤', renderDesigner], ['driver', 'pd.ws.driver', '⌘', renderDriverWorkspace], ['metrology', 'pd.ws.metrology', '⌗', renderMetrologyWorkspace], ['safety', 'pd.ws.safety', '⛨', renderSafetyWorkspace], ['sim', 'pd.ws.sim', '◈', renderSimWorkspace]];
const PERSONA_KEYS = ['engineer', 'hazauth', 'lsma', 'approver', 'safety', 'quality', 'viewer'];
PPERMS.quality = ['publish', 'safety.coapprove'];
function banner(cls, text, ...extra) { return h('div', { class: 'note ' + cls, role: 'status' }, text, ...extra); }
function applyLocale() { document.documentElement.lang = UI.locale; document.documentElement.dir = UI.locale === 'he' ? 'rtl' : 'ltr'; document.title = t('pd.app.title'); }
function applyTheme() { document.documentElement.setAttribute('data-theme', UI.theme); }
function go(ws) { if (location.hash === '#/' + ws) route(false); else location.hash = '#/' + ws; }

function initState() {
  PD.driver = MKDRV(); PD.tables = [MKTABLE()]; PD.profile = MKPROFILE(); PD.profileCandidate = null;
  const pub = MKPROC(); PD.versions = [{ version: '1.0.0', proc: pub, digest: digestOf(pub), cls: 'none' }];
  PD.draft = { proc: MKDRAFT(), state: 'draft', rev: 0, base: '1.0.0', approvals: [], log: [] }; PD.undo = []; PD.redo = []; PD.sel = null; PD.compare = { a: 'v1.0.0', b: 'draft', overlay: false };
  stopTimer(); PD.sim.run = null; PD.sim.faults = []; PD.sim.breakpoints = new Set(); PD.sim.evSel = null; PD.drvBox = null; PD.drvTest = {}; validateNow();
}
function blankProcedure(titleEn, titleHe) {
  return { key: 'new-synthetic-procedure', title: { en: titleEn, ...(titleHe ? { he: titleHe } : {}) }, roles: [{ id: 'uut', kind: 'instrument', title: { en: 'Instrument under test', he: 'מכשיר נבדק' } }, { id: 'ref', kind: 'standard', title: { en: 'Reference source', he: 'מקור ייחוס' } }], tables: [{ id: 'points', key: 'synthetic-points' }], intended_modes: ['simulation'], lifecycle: { setup: [], phases: [{ id: 'as_found', kind: 'as_found', body: [] }], teardown: [], safe_state: [] } };
}
function newProcedureDialog() {
  const en = h('input', { id: 'np-en', class: 'input', lang: 'en', dir: 'ltr', value: 'My synthetic procedure', autofocus: true }), he = h('input', { id: 'np-he', class: 'input', lang: 'he', dir: 'rtl', value: 'הנוהל הסינתטי שלי' });
  const tpl = h('select', { id: 'np-tpl', class: 'input' }, [['blank', 'pd.new.blank'], ['starter', 'pd.new.starter']].map(([v, k]) => h('option', { value: v }, t(k))));
  const dlg = openDialog({ title: t('pd.new.title'), body: [banner('warn', t('pd.new.warn')), h('div', { class: 'field' }, h('label', { class: 'lbl', for: 'np-en' }, t('pd.new.name_en')), en), h('div', { class: 'field' }, h('label', { class: 'lbl', for: 'np-he' }, t('pd.new.name_he')), he), h('div', { class: 'field' }, h('label', { class: 'lbl', for: 'np-tpl' }, t('pd.new.template')), tpl, h('div', { class: 'help' }, t('pd.new.template_help')))],
    actions: [btn(t('a.cancel'), () => dlg.close(), 'ghost'), btn(t('pd.new.create'), () => {
      if (!en.value.trim()) { en.setAttribute('aria-invalid', 'true'); en.focus(); return; }
      dlg.close(); initState(); const p = blankProcedure(en.value.trim(), he.value.trim()); PD.draft.proc = p; PD.versions = [{ version: '0.0.0', proc: blankProcedure(en.value.trim(), he.value.trim()), digest: 'sha256:' + '0'.repeat(64), cls: 'none' }]; PD.draft.base = '0.0.0'; PD.compare = { a: 'v0.0.0', b: 'draft', overlay: false };
      if (tpl.value === 'starter') { ['identify', 'initialize', 'safe_shutdown'].forEach((id) => { const pr = PRESETS.find((x) => x.id === id); pr.build().forEach((init) => { const n = newNode(p, init.type, init); insertNode(p, n, { lane: id === 'safe_shutdown' ? 'teardown' : 'setup' }); }); }); }
      validateNow(); PD.sel = null; toast(t('pd.new.done')); go('design'); renderDesigner(); }, 'primary')] });
}
function shortcutsDialog() {
  const rows = [['Tab / Shift+Tab', 'pd.sc.tab'], ['Enter / Space', 'pd.sc.select'], ['↑ ↓', 'pd.sc.arrows'], ['Alt+↑ Alt+↓', 'pd.sc.reorder'], ['Alt+← Alt+→', 'pd.sc.nest'], ['Insert / +', 'pd.sc.insert'], ['Delete', 'pd.sc.delete'], ['Ctrl+D', 'pd.sc.dup'], ['B', 'pd.sc.bp'], ['Ctrl+Z / Ctrl+Y', 'pd.sc.undo'], ['?', 'pd.sc.help'], ['Esc', 'pd.sc.esc']];
  openDialog({ title: t('pd.sc.title'), body: [h('table', { class: 'tbl' }, h('tbody', null, rows.map(([k, v]) => h('tr', null, h('th', { scope: 'row' }, h('kbd', null, k)), h('td', null, t(v)))))), h('p', { class: 'help' }, t('pd.sc.note'))] });
}
function controlsDialog() {
  const loc = h('select', { id: 'ctl-loc', class: 'input', onchange: (e) => { PD.policy.required_locales = e.target.value === 'both' ? ['en', 'he'] : ['en']; validateNow(); route(true); } }, [['en', 'pd.ctl.loc_en'], ['both', 'pd.ctl.loc_both']].map(([v, k]) => h('option', { value: v, selected: (PD.policy.required_locales.length > 1) === (v === 'both') ? true : null }, t(k))));
  const dlg = openDialog({ title: t('pd.ctl.title'), body: [banner('info', t('pd.ctl.note')), h('div', { class: 'field' }, h('label', { class: 'lbl', for: 'ctl-loc' }, t('pd.ctl.locales')), loc), h('div', { class: 'row-wrap' }, btn(t('pd.ctl.reset'), () => { dlg.close(); initState(); toast(t('pd.ctl.reset_done')); route(true); }, 'danger ghost'), btn(t('pd.ctl.new'), () => { dlg.close(); newProcedureDialog(); }, 'ghost')), h('p', { class: 'help' }, t('pd.ctl.reset_help')), h('p', { class: 'help' }, t('pd.ctl.missing', { n: String(MISSING.size) }))] });
}

function buildChrome() {
  $('proto-banner').replaceChildren(h('strong', null, '◈ ' + t('pd.banner.title')), ' ', t('pd.banner.body'));
  $('topbar').replaceChildren(h('span', { class: 'brand' }, 'CalOS ', h('span', { class: 'brand-sub' }, t('pd.app.name'))), h('span', { class: 'frame-badge test', title: t('badge.test_help') }, '◆ TEST'), h('span', { class: 'frame-badge sim', title: t('pd.banner.body') }, '◈ ' + t('pd.mode_sim')), h('span', { class: 'spacer' }),
    h('label', { class: 'persona', title: t('persona.help') }, h('span', { class: 'sr-only' }, t('persona.label')), h('span', { class: 'chip sim sm', 'aria-hidden': 'true' }, t('persona.chip')), h('select', { class: 'input sm', id: 'persona-sel', onchange: (e) => { PD.persona = e.target.value; toast(t('pd.persona_toast', { p: t('pd.persona.' + PD.persona) })); route(true); } }, PERSONA_KEYS.map((k) => h('option', { value: k, selected: PD.persona === k ? true : null }, t('pd.persona.' + k))))),
    btn(UI.locale === 'en' ? 'עברית' : 'English', () => { UI.locale = UI.locale === 'en' ? 'he' : 'en'; applyLocale(); route(true); }, 'ghost', { lang: UI.locale === 'en' ? 'he' : 'en', 'aria-label': UI.locale === 'en' ? 'עברית' : 'English' }),
    btn(UI.theme === 'light' ? t('a.dark') : t('a.light'), () => { UI.theme = UI.theme === 'light' ? 'dark' : 'light'; applyTheme(); route(true); }, 'ghost', { 'aria-pressed': String(UI.theme === 'dark') }),
    btn('+ ' + t('pd.new.btn'), newProcedureDialog, 'ghost'), iconBtn('?', t('pd.sc.title'), shortcutsDialog), iconBtn('⋯', t('a.controls'), controlsDialog));
  $('wsnav').replaceChildren(...WS.map(([id, key, g]) => h('a', { href: '#/' + id, class: 'wslink', 'data-ws': id }, h('span', { 'aria-hidden': 'true' }, g + ' '), t(key))));
  buildStatus();
}
function buildStatus() { const c = countSev(PD.findings); $('statusbar').replaceChildren(h('span', null, t('pd.status.proto')), h('span', { class: 'spacer' }), h('span', { id: 'sr-status', role: 'status' }, t('n_errors', { n: c.error }) + ' · ' + t('n_warnings', { n: c.warning })), PD.sim.run ? chip('sim sm', '◈', PD.sim.run.id + ' · ' + t('pd.sim.state.' + PD.sim.run.state)) : null, h('span', { class: 'muted' }, t('pd.status.note'))); }

function route(rebuild) {
  if (rebuild) buildChrome();
  const ws = (location.hash.replace(/^#\/?/, '').split('/')[0]) || 'design'; const def = WS.find((w) => w[0] === ws) || WS[0];
  if (PD.ws !== def[0] || rebuild === true || PD.lastRoute !== def[0]) { stopTimer(); }
  PD.ws = def[0]; $('main').replaceChildren(h('div', { id: 'pd-main' })); def[3]();
  document.querySelectorAll('.wslink').forEach((a) => { a.removeAttribute('aria-current'); if (a.dataset.ws === PD.ws) a.setAttribute('aria-current', 'page'); });
  buildStatus(); if (PD.lastRoute !== PD.ws) { const ttl = $('page-title'); if (ttl && !PD.first) ttl.focus({ preventScroll: true }); $('sr-live').textContent = ttl ? ttl.textContent : ''; window.scrollTo(0, 0); } PD.lastRoute = PD.ws; PD.first = false;
}
document.addEventListener('keydown', (e) => {
  const tg = e.target; const typing = tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable);
  if (typing) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && PD.ws === 'design') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && PD.ws === 'design') { e.preventDefault(); redo(); }
  else if (e.key === '?' && !document.querySelector('.backdrop')) { e.preventDefault(); shortcutsDialog(); }
});
window.addEventListener('hashchange', () => route(false));
window.addEventListener('beforeunload', stopTimer);
function boot() { PD.first = true; initState(); applyLocale(); applyTheme(); buildChrome(); route(false); }
boot();
