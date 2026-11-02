/* CalOS Phase 1A DESIGN PROTOTYPE — views. Every list/editor below is generic over KINDS metadata. */
'use strict';

const persona = () => Store.S.persona;
const cellVal = (x) => (/[֐-׿]/.test(String(x)) || /\s/.test(String(x)) ? h('bdi', { dir: 'auto' }, String(x)) : ltr(String(x), 'mono'));
const policy = () => Store.S.policy;
const lookup = (kind, key) => Store.find(kind, key);
const itemsOf = (kind) => Store.items(kind);
const effSchema = (kind) => {
  const s = KINDS[kind].schema; if (!UI.metaPreview || !UI.metaPreview[kind]) return s;
  const c = JSON.parse(JSON.stringify(s)); c.properties.internal_note = LOC('f.note', { localized_required: false, multiline: true, group: 'g.general' }); return c;
};
const validationCtx = () => ({ policy: policy(), lookup });
const findingsFor = (item, content) => validateItem({ schema: effSchema(item.kind) }, content, validationCtx());
const authorName = (a) => t('persona.' + a);

function usedBy(item) {
  const out = [];
  for (const o of Store.items()) { if (o === item) continue; const srcs = []; if (o.draft) srcs.push(['draft', o.draft.content]); const l = Store.latest(o); if (l) srcs.push(['v' + l.version, l.content]); for (const [via, c] of srcs) if (refKeys(c).some((r) => r.kind === item.kind && r.key === item.key)) { out.push({ item: o, via }); break; } }
  return out;
}
const uses = (item) => { const c = (item.draft || Store.latest(item) || {}).content || {}; const seen = new Set(); return refKeys(c).filter((r) => r.key && !seen.has(r.kind + r.key) && seen.add(r.kind + r.key)).map((r) => ({ ref: r, item: lookup(r.kind, r.key) })); };

function pageHead(title, ...actions) { return h('div', { class: 'page-head' }, h('h1', { tabindex: '-1', id: 'page-title' }, title), h('div', { class: 'spacer' }), actions); }
function tabsBar(tabs, current, hrefFor) { return h('div', { class: 'tabs', role: 'tablist' }, tabs.map(([id, label]) => h('a', { role: 'tab', class: 'tab' + (id === current ? ' on' : ''), 'aria-selected': id === current ? 'true' : 'false', href: hrefFor(id) }, t(label)))); }
function banner(cls, text, ...extra) { return h('div', { class: 'note ' + cls, role: 'status' }, text, ...extra); }

/* ---------------- generic kind list + create ---------------- */
function createDialog(kind, after) {
  const kd = KINDS[kind]; const [tk, ts] = Object.entries(kd.schema.properties).find(([, s]) => hintOf(s).title);
  const name = h('input', { class: 'input', id: 'nk-name', type: 'text', autofocus: true, 'aria-describedby': 'nk-msg' });
  const keyIn = h('input', { class: 'input mono', id: 'nk-key', type: 'text', dir: 'ltr', 'aria-describedby': 'nk-msg' });
  const msg = h('div', { id: 'nk-msg', class: 'field-msg err', role: 'alert' });
  let manual = false; name.addEventListener('input', () => { if (!manual) keyIn.value = slug(name.value); });
  keyIn.addEventListener('input', () => { manual = true; });
  const dlg = openDialog({ title: t('create.title', { kind: t('kind.' + kind) }), body: [h('p', { class: 'muted' }, t('create.intro')), h('label', { class: 'lbl', for: 'nk-name' }, t(hintOf(ts).label) + ' (' + t('loc.en') + ')'), name, h('label', { class: 'lbl', for: 'nk-key' }, t('f.key')), keyIn, h('div', { class: 'help' }, t('help.key')), msg],
    actions: [btn(t('a.cancel'), () => dlg.close(), 'ghost'), btn(t('a.create_draft'), () => {
      const k = keyIn.value.trim(); msg.textContent = '';
      if (!name.value.trim()) { msg.textContent = t('err.name_required'); name.focus(); return; }
      if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(k)) { msg.textContent = t('err.key_pattern'); keyIn.focus(); return; }
      if (Store.find(kind, k)) { msg.textContent = t('err.key_exists'); keyIn.focus(); return; }
      const content = {}; content[tk] = ts.type === 'string' ? name.value.trim() : { en: name.value.trim() };
      Store.create(kind, k, content, persona()); dlg.close(); toast(t('toast.draft_created')); after ? after(k) : (location.hash = '#/item/' + kind + '/' + k);
    }, 'primary')] });
}
function viewKindList(kind, embedded) {
  const rows = itemsOf(kind);
  const cols = [
    { key: 'title', label: 'col.name', text: (r) => titleOf(r).text, render: (r) => { const ti = titleOf(r); return h('a', { class: 'link strong', href: '#/item/' + kind + '/' + r.key }, ti.mono ? ltr(ti.text) : ti.text, ti.fallback ? h('span', { class: 'chip mut sm', title: t('fallback_note') }, t('fallback')) : null); } },
    { key: 'key', label: 'col.key', text: (r) => r.key, render: (r) => ltr(r.key, 'muted') },
    { key: 'status', label: 'col.status', text: (r) => t('st.' + Store.status(r)), render: (r) => h('span', null, statusChip(Store.status(r)), r.draft && r.versions.length ? h('span', { class: 'chip mut sm' }, t('has_draft')) : null) },
    { key: 'ver', label: 'col.version', text: (r) => (Store.latest(r) || {}).version || '—', render: (r) => ltr((Store.latest(r) || {}).version || '—') },
    { key: 'prov', label: 'col.provenance', text: (r) => t('prov.' + (r.draft ? r.draft.provenance : (Store.latest(r) || { provenance: 'draft' }).provenance)), render: (r) => provChip(r.draft ? r.draft.provenance : (Store.latest(r) || { provenance: 'draft' }).provenance) },
    { key: 'issues', label: 'col.issues', text: (r) => { if (!r.draft) return ''; const f = findingsFor(r, r.draft.content); return f.filter((x) => x.sev === 'error').length + '/' + f.filter((x) => x.sev === 'warning').length; }, render: (r) => { if (!r.draft) return h('span', { class: 'muted' }, '—'); const f = findingsFor(r, r.draft.content); const e = f.filter((x) => x.sev === 'error').length, w = f.filter((x) => x.sev === 'warning').length; return h('span', null, e ? chip('err sm', '✖', String(e), t('sev.error')) : null, w ? chip('warn sm', '⚠', String(w), t('sev.warning')) : null, !e && !w ? chip('ok sm', '✔', '0', t('ok')) : null); } },
  ];
  const can_ = can(persona(), 'draft');
  const newBtn = can_ ? btn('+ ' + t('a.new') + ' ' + t('kind.' + kind), () => createDialog(kind), 'primary') : reasonBtn('+ ' + t('a.new'), t('reason.no_draft_perm'));
  const head = embedded ? h('div', { class: 'page-head slim' }, h('h2', { class: 'grow' }, t('kind.' + kind + '.plural')), newBtn) : pageHead(t('kind.' + kind + '.plural'), newBtn);
  return [head, h('p', { class: 'muted lead' }, t('kind.' + kind + '.desc')), dataGrid({ id: kind, label: t('kind.' + kind + '.plural'), columns: cols, rows, onOpen: (r) => (location.hash = '#/item/' + kind + '/' + r.key) })];
}
function viewInstruments(tab) {
  const tabs = [['manufacturers', 'kind.Manufacturer.plural'], ['families', 'kind.InstrumentFamily.plural'], ['models', 'kind.InstrumentModel.plural']];
  const kind = { manufacturers: 'Manufacturer', families: 'InstrumentFamily', models: 'InstrumentModel' }[tab] || 'Manufacturer';
  return [h('div', { class: 'page-head slim' }, h('h1', { id: 'page-title', tabindex: '-1' }, t('nav.instruments'))), tabsBar(tabs, tab || 'manufacturers', (id) => '#/instruments/' + id), h('div', { role: 'tabpanel' }, ...viewKindList(kind, true))];
}
function viewEquipment(tab) {
  const kind = tab === 'stations' ? 'StationRequirement' : 'StandardRole';
  return [h('div', { class: 'page-head slim' }, h('h1', { id: 'page-title', tabindex: '-1' }, t('nav.equipment'))), tabsBar([['roles', 'kind.StandardRole.plural'], ['stations', 'kind.StationRequirement.plural']], tab || 'roles', (id) => '#/equipment/' + id), h('div', { role: 'tabpanel' }, ...viewKindList(kind, true))];
}
function viewApps() { return viewKindList(Object.keys(KINDS).find((k) => KINDS[k].nav === 'apps')).map((n, i) => i === 0 ? pageHead(t('nav.apps'), can(persona(), 'draft') ? btn('+ ' + t('a.new_app'), () => (location.hash = '#/apps/new'), 'primary') : reasonBtn('+ ' + t('a.new_app'), t('reason.no_draft_perm'))) : n); }

/* ---------------- dashboard ---------------- */
function allFindings() { const out = []; Store.items().filter((i) => i.draft).forEach((i) => findingsFor(i, i.draft.content).forEach((f) => out.push({ item: i, f }))); return out; }
function stageChart(list) {
  const stages = ['schema', 'refs', 'semantic', 'i18n', 'metrology']; const colors = { error: 'var(--error)', warning: 'var(--warn)' };
  const max = Math.max(1, ...stages.map((s) => list.filter((x) => x.f.stage === s).length)); const W = 260, rowH = 22;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${stages.length * rowH}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', t('chart.by_stage') + ': ' + stages.map((s) => t('stage.' + s) + ' ' + list.filter((x) => x.f.stage === s).length).join(', ')); svg.classList.add('chart');
  stages.forEach((s, i) => { ['error', 'warning'].reduce((x0, sev) => { const n = list.filter((x) => x.f.stage === s && x.f.sev === sev).length; const w = (n / max) * (W - 110); if (n) { const r = document.createElementNS(svg.namespaceURI, 'rect'); r.setAttribute('x', 100 + x0); r.setAttribute('y', i * rowH + 4); r.setAttribute('width', w); r.setAttribute('height', 14); r.setAttribute('rx', 2); r.setAttribute('fill', colors[sev]); svg.append(r); } return x0 + w; }, 0);
    const tx = document.createElementNS(svg.namespaceURI, 'text'); tx.setAttribute('x', 96); tx.setAttribute('y', i * rowH + 15); tx.setAttribute('text-anchor', 'end'); tx.setAttribute('class', 'chart-t'); tx.textContent = t('stage.' + s); svg.append(tx); });
  return svg;
}
function viewDashboard(tab) {
  const me = persona(); tab = tab || 'drafts';
  const drafts = Store.items().filter((i) => i.draft && i.draft.state === 'draft');
  const review = Store.items().filter((i) => i.draft && (i.draft.state === 'in_review' || i.draft.state === 'approved'));
  const issues = allFindings();
  const errs = issues.filter((x) => x.f.sev === 'error').length, warns = issues.filter((x) => x.f.sev === 'warning').length;
  const itemCols = [
    { key: 'title', label: 'col.name', text: (r) => titleOf(r).text, render: (r) => h('a', { class: 'link strong', href: '#/item/' + r.kind + '/' + r.key }, titleOf(r).text) },
    { key: 'kind', label: 'col.kind', text: (r) => t('kind.' + r.kind), render: (r) => h('span', null, h('span', { class: 'kind-ic', 'aria-hidden': 'true' }, KINDS[r.kind].icon), t('kind.' + r.kind)) },
    { key: 'status', label: 'col.status', text: (r) => t('st.' + r.draft.state), render: (r) => statusChip(r.draft.state) },
    { key: 'rev', label: 'col.revision', text: (r) => 'r' + r.draft.revision, render: (r) => ltr('r' + r.draft.revision) },
    { key: 'author', label: 'col.author', text: (r) => authorName(r.draft.author) },
    { key: 'next', label: 'col.next', text: (r) => nextAction(r) },
  ];
  const panel = tab === 'drafts' ? dataGrid({ id: 'drafts', label: t('dash.drafts'), columns: itemCols.filter((c) => c.key !== 'next'), rows: drafts, onOpen: (r) => (location.hash = '#/item/' + r.kind + '/' + r.key) })
    : tab === 'review' ? dataGrid({ id: 'review', label: t('dash.review'), columns: itemCols, rows: review, onOpen: (r) => (location.hash = '#/item/' + r.kind + '/' + r.key) })
    : dataGrid({ id: 'issues', label: t('dash.issues'), rows: issues, onOpen: (r) => (location.hash = '#/item/' + r.item.kind + '/' + r.item.key + '?focus=' + encodeURIComponent(r.f.ptr)), columns: [
      { key: 'sev', label: 'col.severity', text: (r) => t('sev.' + r.f.sev), render: (r) => sevChip(r.f.sev) }, { key: 'code', label: 'col.code', text: (r) => r.f.code, render: (r) => ltr(r.f.code) },
      { key: 'msg', label: 'col.message', text: (r) => findingText(r.f), render: (r) => findingText(r.f) }, { key: 'item', label: 'col.name', text: (r) => titleOf(r.item).text, render: (r) => titleOf(r.item).text }, { key: 'stage', label: 'col.stage', text: (r) => t('stage.' + r.f.stage) }] });
  const act = Store.audit().slice(-7).reverse();
  return [
    h('div', { class: 'page-head slim' }, h('h1', { id: 'page-title', tabindex: '-1' }, t('nav.dashboard')), h('div', { class: 'spacer' }), can(me, 'draft') ? btn('+ ' + t('a.new_app'), () => (location.hash = '#/apps/new'), 'primary') : reasonBtn('+ ' + t('a.new_app'), t('reason.no_draft_perm'))),
    me === 'manager' ? banner('info', t('note.readonly_role')) : null,
    h('div', { class: 'stats', role: 'group', 'aria-label': t('dash.summary') }, stat(t('dash.drafts'), drafts.length), stat(t('dash.review'), review.length), stat(t('dash.errors'), errs, errs ? 'err' : ''), stat(t('dash.warnings'), warns, warns ? 'warn' : '')),
    h('div', { class: 'dash-grid' },
      h('section', { class: 'panel', 'aria-labelledby': 'wq' }, h('div', { class: 'panel-head' }, h('h2', { id: 'wq' }, t('dash.workqueue')), tabsBar([['drafts', 'dash.drafts'], ['review', 'dash.review'], ['issues', 'dash.issues']], tab, (id) => '#/dashboard/' + id)), h('div', { role: 'tabpanel' }, panel)),
      h('div', { class: 'side-col' },
        h('section', { class: 'panel', 'aria-labelledby': 'env' }, h('div', { class: 'panel-head' }, h('h2', { id: 'env' }, t('dash.environment'))), h('dl', { class: 'dl' },
          h('dt', null, t('env.deployment')), h('dd', null, chip('info', '◆', 'TEST'), ' ', t('env.sandbox')), h('dt', null, t('env.mode')), h('dd', null, chip('sim', '◈', t('env.sim_only'))),
          h('dt', null, t('env.instruments')), h('dd', null, t('env.none_connected')), h('dt', null, t('env.production')), h('dd', null, chip('mut', '⊘', t('env.prod_unavailable'))), h('dt', null, t('env.policy')), h('dd', null, policy().required_locales.map((l) => chip('mut sm', '', l.toUpperCase())), ' ', t('env.required_locales')))),
        h('section', { class: 'panel', 'aria-labelledby': 'chart' }, h('div', { class: 'panel-head' }, h('h2', { id: 'chart' }, t('chart.by_stage'))), issues.length ? stageChart(issues) : h('div', { class: 'muted' }, t('chart.none')), h('div', { class: 'legend' }, chip('err sm', '■', t('sev.error')), chip('warn sm', '■', t('sev.warning')))),
        h('section', { class: 'panel', 'aria-labelledby': 'act' }, h('div', { class: 'panel-head' }, h('h2', { id: 'act' }, t('dash.activity'))), h('ul', { class: 'activity' }, act.map((e) => h('li', null, h('span', { class: 'muted' }, ltr(e.at.slice(11, 16))), ' ', h('strong', null, authorName(e.actor)), ' ', t('act.' + e.action), ' ', ltr(e.item), e.detail ? h('span', { class: 'muted' }, ' · ', ltr(e.detail)) : null))))))];
}
const stat = (label, n, cls) => h('div', { class: 'stat ' + (cls || '') }, h('span', { class: 'stat-n' }, ltr(String(n))), h('span', { class: 'stat-l' }, label));
function nextAction(item) {
  const d = item.draft, me = persona(); const mine = d.author === me || d.contributors.includes(me);
  if (d.state === 'in_review') return mine ? t('next.await_review') : (can(me, 'approve') ? t('next.you_review') : t('next.by_approver'));
  if (d.state === 'approved') return can(me, 'publish') ? t('next.you_publish') : t('next.by_quality');
  return '';
}

/* ---------------- review queue ---------------- */
function viewReview() {
  const rows = Store.items().filter((i) => i.draft && (i.draft.state === 'in_review' || i.draft.state === 'approved'));
  return [pageHead(t('nav.review')), h('p', { class: 'muted lead' }, t('review.intro')), dataGrid({ id: 'rq', label: t('nav.review'), rows, onOpen: (r) => (location.hash = '#/item/' + r.kind + '/' + r.key), columns: [
    { key: 'title', label: 'col.name', text: (r) => titleOf(r).text, render: (r) => h('a', { class: 'link strong', href: '#/item/' + r.kind + '/' + r.key }, titleOf(r).text) },
    { key: 'kind', label: 'col.kind', text: (r) => t('kind.' + r.kind) }, { key: 'status', label: 'col.status', text: (r) => t('st.' + r.draft.state), render: (r) => statusChip(r.draft.state) },
    { key: 'author', label: 'col.author', text: (r) => authorName(r.draft.author) }, { key: 'dig', label: 'col.digest', text: (r) => shortDigest(r.draft.snapshot.digest), render: (r) => ltr(shortDigest(r.draft.snapshot.digest)) },
    { key: 'next', label: 'col.next', text: (r) => nextAction(r), render: (r) => { const mine = r.draft.author === persona() || r.draft.contributors.includes(persona()); return h('span', null, nextAction(r), mine && r.draft.state === 'in_review' ? h('span', { class: 'chip mut sm', title: t('sod.note') }, t('sod.author')) : null); } }] })];
}

/* ---------------- application wizard (metadata-driven steps) ---------------- */
/* wizard composition is METADATA: fields declare `wizard_step` (1|2) and `initial` in their x-calos-editor hints */
const wizProps = (kind, step) => Object.entries(KINDS[kind].schema.properties).filter(([, s]) => hintOf(s).wizard_step === step).map(([k]) => k);
const wizInitial = (kind) => Object.fromEntries(Object.entries(KINDS[kind].schema.properties).filter(([, s]) => hintOf(s).initial !== undefined).map(([k, s]) => [k, JSON.parse(JSON.stringify(hintOf(s).initial))]));
const WIZ_KIND = Object.keys(KINDS).find((k) => KINDS[k].wizard); /* registry flag: which kind the creation wizard produces */
const WIZ = { step: 1, content: wizInitial(WIZ_KIND), key: '', manual: false };
function viewWizard() {
  if (!can(persona(), 'draft')) return [pageHead(t('wiz.title')), banner('warn', t('reason.no_draft_perm'))];
  const kd = KINDS[WIZ_KIND], steps = ['wiz.s1', 'wiz.s2', 'wiz.s3', 'wiz.s4'];
  const titlePtr = '/' + Object.entries(kd.schema.properties).find(([, s]) => hintOf(s).title)[0];
  const root = h('div', { class: 'wizard' });
  const ctx = { readOnly: false, policy: policy(), items: itemsOf, lookup, valueAt: (p) => getPath(WIZ.content, p), content: () => WIZ.content, onChange: (ptr, val, structural) => { setPath(WIZ.content, ptr, val); if (!WIZ.manual && ptr === titlePtr) { const l = WIZ.content[titlePtr.slice(1)]; WIZ.key = slug(typeof l === 'string' ? l : ((l && (l.en || l.he)) || '')); } const kf = root.querySelector('#wiz-key'); if (kf && !WIZ.manual) kf.value = WIZ.key; if (structural) draw(); else paintWizard(); } };
  function findings() { const top = (f) => f.ptr.split('/')[1]; return validateItem({ schema: effSchema(WIZ_KIND) }, WIZ.content, validationCtx()).filter((f) => WIZ.step === 4 || wizProps(WIZ_KIND, WIZ.step).includes(top(f))); }
  let formEl = null;
  function paintWizard() { if (formEl) paintFindings(formEl, WIZ.step === 4 ? [] : (WIZ.touched ? findings() : [])); }
  function draw() {
    const f = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-ptr');
    root.replaceChildren();
    root.append(h('ol', { class: 'stepper', 'aria-label': t('wiz.progress') }, steps.map((s, i) => h('li', { class: 'step' + (WIZ.step === i + 1 ? ' on' : '') + (WIZ.step > i + 1 ? ' done' : ''), 'aria-current': WIZ.step === i + 1 ? 'step' : null }, h('span', { class: 'step-n' }, WIZ.step > i + 1 ? '✔' : String(i + 1)), h('span', null, t(s))))));
    const body = h('div', { class: 'panel wiz-body' });
    if (WIZ.step === 1 || WIZ.step === 2) {
      formEl = renderForm({ schema: effSchema(WIZ_KIND), content: WIZ.content, ctx, only: wizProps(WIZ_KIND, WIZ.step) });
      body.append(h('p', { class: 'muted' }, t('wiz.intro' + WIZ.step)), formEl);
      if (WIZ.step === 1) body.append(h('div', { class: 'field' }, h('label', { class: 'lbl', for: 'wiz-key' }, t('f.key')), h('input', { id: 'wiz-key', class: 'input mono', dir: 'ltr', value: WIZ.key, oninput: (e) => { WIZ.manual = true; WIZ.key = e.target.value; } }), h('div', { class: 'help' }, t('help.key'))));
    } else if (WIZ.step === 3) {
      formEl = null;
      const later = [['driver', 'S3'], ['procedures', 'S4'], ['metrology', 'S2'], ['screens', 'S6'], ['reports', 'S6']];
      body.append(h('p', { class: 'muted' }, t('wiz.intro3')), h('table', { class: 'tbl', 'aria-label': t('wiz.s3') }, h('thead', null, h('tr', null, ['col.component', 'col.status', 'col.note'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null,
        h('tr', null, h('td', { 'data-label': t('col.component') }, t('comp.models')), h('td', { 'data-label': t('col.status') }, chip('ok', '✔', t('wiz.selected', { n: (WIZ.content.instrument_models || []).length }))), h('td', { 'data-label': t('col.note') }, t('wiz.editable_later'))),
        later.map(([k, s]) => h('tr', null, h('td', { 'data-label': t('col.component') }, t('comp.' + k)), h('td', { 'data-label': t('col.status') }, chip('mut', '⊘', t('wiz.not_in_1a'))), h('td', { 'data-label': t('col.note') }, t('wiz.arrives', { s })))))));
    } else {
      formEl = null; const fs = findings(); const errs = fs.filter((x) => x.sev === 'error');
      body.append(h('dl', { class: 'dl' }, h('dt', null, t('f.title')), h('dd', null, locText(WIZ.content.title).text || '—'), h('dt', null, t('f.key')), h('dd', null, ltr(WIZ.key || '—')), h('dt', null, t('f.intended_modes')), h('dd', null, (WIZ.content.intended_modes || []).map((m) => t('mode.' + m)).join(', ') || '—'), h('dt', null, t('f.instrument_models')), h('dd', null, (WIZ.content.instrument_models || []).map((r) => r.$ref.key || '—').map((k) => ltr(k)).flatMap((x) => [x, ' ']))),
        errs.length ? h('div', { class: 'note err', role: 'alert' }, t('wiz.fix_first', { n: errs.length }), h('ul', null, errs.map((f) => h('li', null, findingText(f), ' ', ltr('[' + f.code + ']'))))) : banner('ok', t('wiz.ready')), fs.filter((x) => x.sev === 'warning').length ? h('ul', { class: 'warn-list' }, fs.filter((x) => x.sev === 'warning').map((f) => h('li', null, '⚠ ', findingText(f)))) : null);
    }
    const nav = h('div', { class: 'wiz-nav' }, WIZ.step > 1 ? btn(t('a.back'), () => { WIZ.step--; draw(); }, 'ghost') : h('span'), h('span', { class: 'spacer' }), btn(t('a.save_exit'), () => { toast(t('toast.wiz_kept')); }, 'ghost'),
      WIZ.step < 4 ? btn(t('a.next'), () => { WIZ.touched = true; const fs = findings().filter((x) => x.sev === 'error'); if (fs.length && WIZ.step < 3) { paintWizard(); toast(t('wiz.fix_first', { n: fs.length }), 'err'); locate(root, fs[0].ptr); return; } WIZ.step++; WIZ.touched = false; draw(); }, 'primary')
      : btn(t('a.create_draft_app'), () => { const fs = findings().filter((x) => x.sev === 'error'); if (fs.length) { toast(t('wiz.fix_first', { n: fs.length }), 'err'); return; } const k = WIZ.key.trim(); if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(k) || Store.find(WIZ_KIND, k)) { toast(t(Store.find(WIZ_KIND, k) ? 'err.key_exists' : 'err.key_pattern'), 'err'); WIZ.step = 1; draw(); return; } Store.create(WIZ_KIND, k, clone(WIZ.content), persona()); WIZ.step = 1; WIZ.content = wizInitial(WIZ_KIND); WIZ.key = ''; WIZ.manual = false; toast(t('toast.draft_created')); location.hash = '#/item/' + WIZ_KIND + '/' + k; }, 'primary'));
    root.append(body, nav);
    if (f) { const el = root.querySelector('[data-ptr="' + CSS.escape(f) + '"]'); if (el) el.focus(); }
  }
  draw();
  return [pageHead(t('wiz.title')), h('p', { class: 'muted lead' }, t('wiz.lead')), root];
}

/* ---------------- item editor workspace ---------------- */
function viewEditor(kind, key, tab, query) {
  const item = Store.find(kind, key);
  if (!item) return [pageHead(t('state.notfound')), errorState('NOT_FOUND')];
  const kd = KINDS[kind], me = persona(), d = item.draft;
  tab = tab || 'edit';
  const status = Store.status(item), ti = titleOf(item);
  const tabs = [['edit', 'tab.edit'], ['versions', 'tab.versions'], ['compare', 'tab.compare'], ['history', 'tab.history'], ['used', 'tab.used'], ['data', 'tab.data']];
  const hasEditPerm = can(me, 'draft'), leaseMine = d && (d.lease === me), leaseOther = d && d.lease !== me && d.lease !== 'engineer' || (d && d.leaseSim);
  const editable = !!d && d.state === 'draft' && hasEditPerm && leaseMine && !d.leaseSim && !Store.S.offline;
  const lastV = Store.latest(item);
  const crumbs = h('nav', { class: 'crumbs', 'aria-label': t('breadcrumb') }, h('a', { href: '#/' + kd.nav }, t('kind.' + kind + '.plural')), h('span', { 'aria-hidden': 'true' }, '›'), h('span', { class: 'cur' }, ti.mono ? ltr(ti.text) : ti.text));
  const head = h('div', { class: 'ed-head' }, h('div', null, crumbs, h('div', { class: 'ed-title' }, h('h1', { id: 'page-title', tabindex: '-1' }, ti.mono ? ltr(ti.text) : ti.text), ti.fallback ? chip('mut sm', '', t('fallback'), t('fallback_note')) : null, statusChip(status),
    d ? chip('mut', '✎', 'r' + d.revision) : null, lastV ? h('span', { class: 'chip mut' }, ltr('v' + lastV.version)) : null, provChip(d ? d.provenance : (lastV ? lastV.provenance : 'draft')))), h('div', { class: 'spacer' }), h('div', { class: 'ed-actions', id: 'ed-actions' }));
  const body = h('div', { class: 'ed-body' });
  const out = [head, tabsBar(tabs, tab, (id) => '#/item/' + kind + '/' + key + (id === 'edit' ? '' : '/' + id)), body];
  if (tab === 'edit') editTab(); else if (tab === 'versions') versionsTab(); else if (tab === 'compare') compareTab(); else if (tab === 'history') historyTab(); else if (tab === 'used') usedTab(); else dataTab();
  return out;

  /* ----- Edit tab ----- */
  function editTab() {
    if (!d) {
      body.append(banner('info', t('ed.published_note', { v: lastV ? lastV.version : '—' })));
      const ctx = roCtx(lastV.content); const f = renderForm({ schema: effSchema(kind), content: lastV.content, ctx }); body.append(f);
      actions([can(me, 'draft') ? btn(t('a.new_draft'), () => { Store.newDraft(item, me); toast(t('toast.new_draft')); route(); }, 'primary') : reasonBtn(t('a.new_draft'), t('reason.no_draft_perm')), can(me, 'withdraw') ? btn(t('a.withdraw'), withdraw, 'ghost danger') : null]); return;
    }
    if (me === 'technician') return;
    const readOnly = !editable;
    if (Store.S.offline && d.state === 'draft') body.append(banner('warn', t('offline.banner')));
    if (d.leaseSim && me === d.author) body.append(h('div', { class: 'note warn', role: 'status' }, t('lease.other'), ' ', can(me, 'draft') ? btn(t('a.takeover'), () => governedConfirm({ title: t('a.takeover'), effect: t('lease.takeover_effect'), reasonRequired: true, confirmLabel: t('a.takeover'), onConfirm: () => { d.leaseSim = false; Store.log(item, me, 'lease.takeover'); toast(t('toast.takeover')); route(); } }), 'sm') : null));
    else if (d.state === 'draft' && !hasEditPerm) body.append(banner('info', t('reason.no_draft_perm')));
    else if (d.state === 'in_review') { body.append(banner('info', t('ed.frozen', { d: shortDigest(d.snapshot.digest) }))); if (can(me, 'approve') && !(d.author === me || d.contributors.includes(me))) { const rr = diff(lastV ? lastV.content : {}, d.content), cc = lastV ? classify(rr, kd) : { cls: 'initial' }; body.append(h('div', { class: 'note info review-sum', role: 'region', 'aria-label': t('review.summary') }, h('strong', null, t('review.summary') + ': '), t('compare.n_changes', { n: rr.length }), ' · ', t('cls.' + cc.cls), ' · ', btn(t('review.see_changes'), () => (location.hash = '#/item/' + kind + '/' + key + '/compare?a=' + (lastV ? 'v' + lastV.version : 'draft') + '&b=draft'), 'sm'))); } }
    else if (d.state === 'approved') body.append(banner('ok', t('ed.approved_note')));
    const wrap = h('div', { class: 'ed-cols' }); const formCol = h('div', { class: 'form-col' }); const side = h('aside', { class: 'side-col', 'aria-label': t('ed.readiness') });
    wrap.append(formCol, side); body.append(wrap);
    let undo = [], redo = [], lastPush = 0, timer = null, pending = 0;
    const snap = () => clone(d.content);
    const ctx = { readOnly, policy: policy(), items: itemsOf, lookup, valueAt: (p) => getPath(d.content, p), content: () => d.content,
      onChange(ptr, val, structural) {
        const nowT = Date.now(); if (structural || nowT - lastPush > 900) { undo.push(snap()); redo = []; lastPush = nowT; }
        setPath(d.content, ptr, val); if (val === undefined || (Array.isArray(val) && !val.length && structural)) { /* keep arrays; remove undefined */ }
        pending++; schedule(); refresh(); if (structural) { rebuild(); }
      } };
    const effS = effSchema(kind);
    function schedule() { clearTimeout(timer); timer = setTimeout(commit, 700); setSaved('saving'); }
    function commit() { if (Store.S.offline) { setSaved('offline'); return; } Store.saveDraft(item, d.content, me); pending = 0; setSaved('saved'); }
    let formEl; function rebuild() {
      const a = document.activeElement, ptr = a && a.getAttribute && a.getAttribute('data-ptr'), pos = a && a.selectionStart;
      const scroll = window.scrollY; formCol.replaceChildren(toolbar(), formEl = renderForm({ schema: effS, content: d.content, ctx })); refresh(true);
      if (ptr) { const el = formEl.querySelector('[data-ptr="' + CSS.escape(ptr) + '"]'); if (el) { el.focus(); try { if (pos != null) el.setSelectionRange(pos, pos); } catch (e) {} } } window.scrollTo(0, scroll);
    }
    function toolbar() {
      return h('div', { class: 'form-tools' }, readOnly ? null : [btn('↶ ' + t('a.undo'), () => { if (!undo.length) return; redo.push(snap()); d.content = undo.pop(); pending++; schedule(); rebuild(); }, 'ghost sm', { disabled: undo.length ? null : true, title: 'Ctrl+Z' }), btn('↷ ' + t('a.redo'), () => { if (!redo.length) return; undo.push(snap()); d.content = redo.pop(); pending++; schedule(); rebuild(); }, 'ghost sm', { disabled: redo.length ? null : true, title: 'Ctrl+Shift+Z' })], h('span', { class: 'spacer' }), h('span', { id: 'saved-ind', class: 'muted sm', role: 'status' }), readOnly ? chip('mut', '🔒', t('read_only')) : null);
    }
    function setSaved(s) { const el = document.getElementById('saved-ind'); if (el) el.textContent = s === 'saving' ? t('saving') : s === 'offline' ? t('offline.buffered', { n: pending }) : t('saved_r', { r: d.revision }); }
    let drawerEl; const touched = new Set(); let attempted = false;
    const show = (f) => f.sev !== 'error' || !f.params || f.params.detail !== 'required' || attempted || [...touched].some((p) => p === f.ptr || p.startsWith(f.ptr + '/') || f.ptr.startsWith(p + '/'));
    function refresh(skipPaint) {
      const fs = findingsFor(item, d.content); ed.findings = fs;
      if (formEl) paintFindings(formEl, fs.filter(show));
      const errs = fs.filter((f) => f.sev === 'error').length, warns = fs.filter((f) => f.sev === 'warning').length;
      const rows = diff(lastV ? lastV.content : {}, d.content), cls = lastV ? classify(rows, kd) : { cls: 'initial', why: [] };
      side.replaceChildren(
        h('section', { class: 'panel tight' }, h('h2', null, t('ed.readiness')), h('div', { class: 'ready-counts' }, chip(errs ? 'err' : 'ok', errs ? '✖' : '✔', t('n_errors', { n: errs })), chip(warns ? 'warn' : 'ok', warns ? '⚠' : '✔', t('n_warnings', { n: warns }))), h('div', { class: 'muted sm' }, errs ? t('ed.blocks_submit') : t('ed.can_submit')), mi(fs)),
        h('section', { class: 'panel tight' }, h('h2', null, t('ed.change_class')), cls.cls === 'none' ? h('div', { class: 'muted' }, t('ed.no_changes')) : [h('div', null, chip({ initial: 'info', editorial: 'mut', functional: 'info', metrological: 'warn', breaking: 'err' }[cls.cls], '', t('cls.' + cls.cls))), h('div', { class: 'muted sm' }, t('ed.min_bump', { v: nextVersion(lastV && lastV.version, BUMP[cls.cls]) })), cls.cls === 'initial' ? null : h('div', { class: 'muted sm' }, t('ed.raise_only'))]),
        h('section', { class: 'panel tight' }, h('h2', null, t('ed.approval_path')), h('ol', { class: 'path' }, h('li', null, t('path.author'), ': ', h('strong', null, authorName(d.author))), h('li', null, t('path.approve'), ': ', h('strong', null, t('persona.approver')), ' ', h('span', { class: 'muted sm' }, '(' + t('sod.not_author') + ')')), h('li', null, t('path.publish'), ': ', h('strong', null, t('persona.quality'))))),
        h('section', { class: 'panel tight' }, h('h2', null, t('ed.sections')), h('ul', { class: 'toc' }, [...new Set(Object.values(effS.properties).map((s) => hintOf(s).group).filter(Boolean))].map((g) => h('li', null, h('a', { href: '#sec-' + g, onclick: (e) => { e.preventDefault(); const el = document.getElementById('sec-' + g); el && el.scrollIntoView({ block: 'start' }); el && el.focus && el.focus(); } }, t(g)))))));
      paintDrawer(fs, errs, warns); updateActions(errs);
    }
    const mi = (fs) => { const ms = fs.filter((f) => f.code === 'PR-013'); return ms.length ? h('div', { class: 'help' }, h('strong', null, t('ed.input_needed') + ': '), [...new Set(ms.map((f) => f.params.mi))].map((x) => h('span', null, inputBadge(x), ' '))) : null; };
    function paintDrawer(fs, errs, warns) {
      if (!drawerEl) { drawerEl = h('section', { class: 'drawer', 'aria-label': t('ed.validation') }); body.append(drawerEl); }
      const open = drawerEl.dataset.open !== '0';
      const groups = {}; fs.forEach((f) => (groups[f.stage] = groups[f.stage] || []).push(f));
      drawerEl.replaceChildren(h('div', { class: 'drawer-head' }, h('button', { class: 'th-btn', type: 'button', 'aria-expanded': String(open), 'aria-controls': 'drawer-body', onclick: () => { drawerEl.dataset.open = open ? '0' : '1'; paintDrawer(fs, errs, warns); } }, h('span', { 'aria-hidden': 'true' }, open ? '▾' : '▸'), ' ', t('ed.validation'), ' — ', t('n_errors', { n: errs }), ', ', t('n_warnings', { n: warns })), h('span', { class: 'spacer' }), ltr('Ctrl+J', 'muted sm')),
        open ? h('div', { id: 'drawer-body', class: 'drawer-body', role: 'region', 'aria-live': 'polite' }, fs.length ? Object.entries(groups).map(([st, list]) => h('div', { class: 'stage' }, h('div', { class: 'stage-h' }, t('stage.' + st), ' ', h('span', { class: 'muted' }, '(' + list.length + ')')), list.map((f) => h('div', { class: 'finding' }, sevChip(f.sev), ltr(f.code, 'code'), h('span', { class: 'grow' }, findingText(f)), h('button', { type: 'button', class: 'link', onclick: () => locate(formEl || body, f.ptr) }, t('a.go_to_field')))))) : h('div', { class: 'muted pad' }, '✔ ' + t('ed.no_findings'))) : null);
    }
    function updateActions(errs) {
      const acts = [];
      if (d.state === 'draft') {
        acts.push(editable ? btn(t('a.validate'), () => { attempted = true; refresh(); const dr = drawerEl; dr.dataset.open = '1'; toast(t('toast.validated', { e: ed.findings.filter((f) => f.sev === 'error').length })); }, 'ghost') : null);
        acts.push(!hasEditPerm ? reasonBtn(t('a.submit'), t('reason.no_submit_perm')) : !editable ? reasonBtn(t('a.submit'), Store.S.offline ? t('reason.offline') : t('reason.read_only')) : errs ? reasonBtn(t('a.submit'), t('reason.fix_errors', { n: errs }), 'primary') : btn(t('a.submit'), submit, 'primary'));
        acts.push(editable ? btn(t('a.discard'), discard, 'ghost danger') : null);
      } else if (d.state === 'in_review') {
        const mine = d.author === me || d.contributors.includes(me);
        acts.push(!can(me, 'approve') ? reasonBtn(t('a.approve'), t('reason.no_approve_perm'), 'primary') : mine ? reasonBtn(t('a.approve'), t('sod.blocked'), 'primary') : btn(t('a.approve'), approve, 'primary'));
        acts.push(can(me, 'approve') && !mine ? btn(t('a.request_changes'), requestChanges, 'ghost') : null);
        acts.push(mine ? btn(t('a.withdraw_submission'), () => governedConfirm({ title: t('a.withdraw_submission'), effect: t('effect.withdraw_sub'), reasonRequired: true, confirmLabel: t('a.withdraw_submission'), onConfirm: (r) => { Store.reject(item, me, r); toast(t('toast.returned')); route(); } }), 'ghost') : null);
      } else if (d.state === 'approved') {
        acts.push(can(me, 'publish') ? btn(t('a.publish'), publishWizard, 'primary') : reasonBtn(t('a.publish'), t('reason.no_publish_perm'), 'primary'));
      }
      actions(acts);
    }
    function submit() { attempted = true; const digest = digestOf(d.content); governedConfirm({ title: t('a.submit'), effect: t('effect.submit'), digest, reasonRequired: false, confirmLabel: t('a.submit'), onConfirm: () => { commit(); Store.submit(item, me, digest); toast(t('toast.submitted')); route(); } }); }
    function discard() { governedConfirm({ title: t('a.discard'), effect: t('effect.discard'), reasonRequired: true, danger: true, confirmLabel: t('a.discard'), onConfirm: () => { Store.discard(item, me); toast(t('toast.discarded')); location.hash = lastV ? '#/item/' + kind + '/' + key : '#/dashboard'; } }); }
    function approve() { governedConfirm({ title: t('a.approve'), effect: t('effect.approve'), digest: d.snapshot.digest, reasonRequired: true, confirmLabel: t('a.approve'), onConfirm: (r) => { Store.approve(item, me, me, r); toast(t('toast.approved')); route(); } }); }
    function requestChanges() { governedConfirm({ title: t('a.request_changes'), effect: t('effect.changes'), reasonRequired: true, confirmLabel: t('a.request_changes'), onConfirm: (r) => { Store.reject(item, me, r); toast(t('toast.returned')); route(); } }); }
    function publishWizard() { synthPublish(item, lastV, () => { toast(t('toast.published')); location.hash = '#/item/' + kind + '/' + key + '/versions'; }); }
    ed.refresh = refresh;
    formCol.append(toolbar(), formEl = renderForm({ schema: effS, content: d.content, ctx }));
    formCol.addEventListener('focusout', (e) => { const p = e.target.dataset && e.target.dataset.ptr; if (p && !touched.has(p)) { touched.add(p); refresh(); } });
    refresh();
    ed.undoKey = (e) => { if (readOnly) return false; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); const btns = formCol.querySelectorAll('.form-tools .btn'); (e.shiftKey ? btns[1] : btns[0]).click(); return true; } return false; };
    if (query && query.focus) setTimeout(() => locate(formEl, query.focus), 50);
  }
  function roCtx(content) { return { readOnly: true, policy: policy(), items: itemsOf, lookup, valueAt: (p) => getPath(content, p), content: () => content, onChange() {} }; }
  function actions(list) { const a = body.parentNode ? document.getElementById('ed-actions') : null; (a || head.querySelector('#ed-actions')).replaceChildren(...list.filter(Boolean)); }
  function withdraw() { const refs = usedBy(item); if (refs.length) { toast(t('err.withdraw_referenced', { n: refs.length }), 'err'); location.hash = '#/item/' + kind + '/' + key + '/used'; return; } governedConfirm({ title: t('a.withdraw'), effect: t('effect.withdraw'), reasonRequired: true, danger: true, confirmLabel: t('a.withdraw'), onConfirm: (r) => { Store.withdraw(item, me, r); toast(t('toast.withdrawn')); route(); } }); }

  /* ----- Versions ----- */
  function versionsTab() {
    if (!item.versions.length) { body.append(emptyState('state.no_versions', 'state.no_versions_body')); return; }
    body.append(dataGrid({ id: 'vers', label: t('tab.versions'), rows: item.versions.slice().reverse(), columns: [
      { key: 'v', label: 'col.version', text: (r) => r.version, render: (r) => ltr(r.version, 'strong') }, { key: 'dig', label: 'col.digest', text: (r) => r.digest, render: (r) => ltr(shortDigest(r.digest)) },
      { key: 'cls', label: 'col.change_class', text: (r) => t('cls.' + r.cls), render: (r) => chip({ editorial: 'mut', functional: 'info', metrological: 'warn', breaking: 'err' }[r.cls] || 'mut', '', t('cls.' + r.cls)) },
      { key: 'by', label: 'col.published_by', text: (r) => authorName(r.by) }, { key: 'at', label: 'col.at', text: (r) => r.at, render: (r) => ltr(r.at.replace('T', ' ').slice(0, 16)) }, { key: 'n', label: 'col.notes', text: (r) => r.notes },
      { key: 'ap', label: 'col.approvals', text: (r) => r.approvals.length, render: (r) => ltr(String(r.approvals.length)) }, { key: 'imm', label: 'col.immutable', text: () => '', sortable: false, render: () => chip('ok sm', '🔒', t('immutable')) }] }));
    body.append(h('p', { class: 'note sim' }, t('ver.synthetic_note')));
    actions([lastV && !d && can(me, 'draft') ? btn(t('a.new_draft'), () => { Store.newDraft(item, me); route(); }, 'primary') : null]);
  }
  /* ----- Compare ----- */
  function compareTab() {
    const opts = item.versions.map((v) => ({ id: 'v' + v.version, label: 'v' + v.version, content: v.content })).concat(d ? [{ id: 'draft', label: t('compare.draft', { r: d.revision }), content: d.content }] : []);
    if (opts.length < 2) { body.append(emptyState('state.compare_title', 'state.compare_body')); return; }
    let a = opts[opts.length - 2].id, b = opts[opts.length - 1].id; if (query && query.a) a = query.a; if (query && query.b) b = query.b;
    const sa = h('select', { class: 'input', id: 'cmpA', 'aria-label': t('compare.from'), onchange: (e) => { a = e.target.value; paint(); } }, opts.map((o) => h('option', { value: o.id, selected: o.id === a ? true : null }, o.label)));
    const sb = h('select', { class: 'input', id: 'cmpB', 'aria-label': t('compare.to'), onchange: (e) => { b = e.target.value; paint(); } }, opts.map((o) => h('option', { value: o.id, selected: o.id === b ? true : null }, o.label)));
    const res = h('div'); body.append(h('div', { class: 'cmp-tools' }, h('label', { for: 'cmpA' }, t('compare.from')), sa, btn('⇄ ' + t('compare.swap'), () => { [a, b] = [b, a]; sa.value = a; sb.value = b; paint(); }, 'ghost sm'), h('label', { for: 'cmpB' }, t('compare.to')), sb), res);
    function paint() {
      const A = opts.find((o) => o.id === a), B = opts.find((o) => o.id === b); const rows = diff(A.content, B.content), c = classify(rows, kd);
      res.replaceChildren(h('div', { class: 'cmp-sum', role: 'status' }, rows.length ? [t('compare.n_changes', { n: rows.length }), ' · ', chip({ editorial: 'mut', functional: 'info', metrological: 'warn', breaking: 'err', none: 'mut' }[c.cls], '', t('cls.' + c.cls)), ' · ', t('ed.min_bump', { v: nextVersion(A.id.startsWith('v') ? A.id.slice(1) : lastV && lastV.version, BUMP[c.cls]) })] : t('compare.identical')),
        rows.length ? h('table', { class: 'tbl diff', 'aria-label': t('tab.compare') }, h('thead', null, h('tr', null, ['col.field', 'col.change', 'col.before', 'col.after'].map((x) => h('th', { scope: 'col' }, t(x))))), h('tbody', null, rows.map((r) => h('tr', { class: 'd-' + r.type }, h('td', { 'data-label': t('col.field') }, ltr(r.ptr.replace(/^\//, '').replace(/\//g, ' › '))), h('td', { 'data-label': t('col.change') }, chip({ added: 'ok', removed: 'err', changed: 'info' }[r.type], { added: '+', removed: '−', changed: '≠' }[r.type], t('diff.' + r.type))), h('td', { 'data-label': t('col.before') }, r.before === undefined ? '—' : cellVal(r.before)), h('td', { 'data-label': t('col.after') }, r.after === undefined ? '—' : cellVal(r.after)))))) : null);
    }
    paint();
  }
  /* ----- History ----- */
  function historyTab() {
    const ev = Store.audit().filter((e) => e.item === kind + '/' + key);
    const res = h('span', { role: 'status', class: 'muted sm' });
    body.append(h('div', { class: 'cmp-tools' }, btn(t('a.verify_chain'), () => { let prev = 'genesis', ok = true; for (const e of Store.audit()) { const { hash, ...rest } = e; if ('sha256:' + SHA(prev + canon(rest)) !== hash) ok = false; prev = hash; } res.textContent = ok ? '✔ ' + t('chain.ok', { n: Store.audit().length }) : '✖ ' + t('chain.bad'); }, 'ghost'), res),
      ev.length ? h('table', { class: 'tbl', 'aria-label': t('tab.history') }, h('thead', null, h('tr', null, ['col.at', 'col.actor', 'col.action', 'col.detail', 'col.hash'].map((x) => h('th', { scope: 'col' }, t(x))))), h('tbody', null, ev.slice().reverse().map((e) => h('tr', null, h('td', { 'data-label': t('col.at') }, ltr(e.at.replace('T', ' ').replace('Z', ''))), h('td', { 'data-label': t('col.actor') }, authorName(e.actor)), h('td', { 'data-label': t('col.action') }, t('act.' + e.action)), h('td', { 'data-label': t('col.detail') }, e.detail ? ltr(e.detail) : '—'), h('td', { 'data-label': t('col.hash') }, ltr(shortDigest(e.hash))))))) : emptyState('state.no_history', 'state.no_history_body'), h('p', { class: 'note sim' }, t('hist.synthetic_note')));
  }
  /* ----- Where used ----- */
  function usedTab() {
    const by = usedBy(item), us = uses(item);
    const lst = (rows, cols) => rows.length ? h('table', { class: 'tbl' }, h('thead', null, h('tr', null, cols.map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, rows)) : h('div', { class: 'muted pad' }, t('none_yet'));
    body.append(h('section', { class: 'panel' }, h('h2', null, t('used.by', { n: by.length })), lst(by.map((r) => h('tr', null, h('td', { 'data-label': t('col.name') }, h('a', { class: 'link', href: '#/item/' + r.item.kind + '/' + r.item.key }, titleOf(r.item).text)), h('td', { 'data-label': t('col.kind') }, t('kind.' + r.item.kind)), h('td', { 'data-label': t('col.via') }, ltr(r.via)))), ['col.name', 'col.kind', 'col.via'])),
      h('section', { class: 'panel' }, h('h2', null, t('used.uses', { n: us.length })), lst(us.map((r) => h('tr', null, h('td', { 'data-label': t('col.name') }, r.item ? h('a', { class: 'link', href: '#/item/' + r.ref.kind + '/' + r.ref.key }, titleOf(r.item).text) : ltr(r.ref.key)), h('td', { 'data-label': t('col.kind') }, t('kind.' + r.ref.kind)), h('td', { 'data-label': t('col.status') }, r.item ? statusChip(Store.status(r.item)) : chip('err', '✖', t('missing'))))), ['col.name', 'col.kind', 'col.status'])),
      by.length ? banner('warn', t('used.blocks_withdraw')) : null);
  }
  /* ----- Data / metadata view ----- */
  function dataTab() {
    const c = (d || lastV).content;
    body.append(h('p', { class: 'note info' }, t('data.intro')),
      h('section', { class: 'panel' }, h('h2', null, t('data.canonical')), h('p', { class: 'kv' }, h('span', { class: 'muted' }, t('digest')), ltr(digestOf(c))), h('pre', { class: 'code', tabindex: '0', dir: 'ltr', 'aria-label': t('data.canonical') }, JSON.stringify(c, null, 2))),
      h('section', { class: 'panel' }, h('h2', null, t('data.metadata')), h('p', { class: 'muted' }, t('data.metadata_help', { kind: t('kind.' + kind) })),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: UI.metaPreview && UI.metaPreview[kind] ? true : null, onchange: (e) => { UI.metaPreview = UI.metaPreview || {}; UI.metaPreview[kind] = e.target.checked; toast(t('data.preview_on')); route(); } }), h('span', null, t('data.add_field'))),
        h('pre', { class: 'code', tabindex: '0', dir: 'ltr', 'aria-label': t('data.metadata') }, JSON.stringify(effSchema(kind).properties, (k, v) => (k === '$defs' ? undefined : v), 2))));
  }
}
const ed = {};

/* ---------------- synthetic publish wizard ---------------- */
function synthPublish(item, lastV, done) {
  const d = item.draft, kd = KINDS[item.kind]; let step = 1;
  const fs = findingsFor(item, d.content), errs = fs.filter((f) => f.sev === 'error');
  const rows = diff(lastV ? lastV.content : {}, d.content), cls = lastV ? classify(rows, kd) : { cls: 'initial', why: [] }; const min = nextVersion(lastV && lastV.version, lastV ? BUMP[cls.cls] : null);
  const deps = refKeys(d.content).filter((r) => r.key).map((r) => ({ r, it: lookup(r.kind, r.key) }));
  const unpublished = deps.filter((x) => !x.it || !x.it.versions.length);
  const candidates = lastV ? [...new Set([min, nextVersion(lastV.version, 'minor'), nextVersion(lastV.version, 'major')])].filter((v) => semverGte(v, min)) : ['1.0.0'];
  const verSel = h('select', { class: 'input mono', id: 'pv-ver', dir: 'ltr' }, candidates.map((v) => h('option', { value: v }, v)));
  const notes = h('textarea', { class: 'input', id: 'pv-notes', rows: '2' }); const nmsg = h('div', { class: 'field-msg err', role: 'alert' });
  const stages = [['schema', 'stage.schema'], ['refs', 'stage.refs'], ['semantic', 'stage.semantic'], ['i18n', 'stage.i18n'], ['metrology', 'stage.metrology']];
  const later = ['Application tests', 'Report render', 'Hazard & safety', 'Compatibility with stations'];
  const bodyEl = h('div'); let dlg;
  const blockers = [...(errs.length ? [t('reason.fix_errors', { n: errs.length })] : []), ...(cls.cls === 'none' && lastV ? [t('ed.no_changes')] : []), ...unpublished.map((x) => t('err.dep_unpublished', { k: x.r.key }))];
  function paint() {
    bodyEl.replaceChildren(h('ol', { class: 'stepper compact' }, ['pub.s1', 'pub.s2', 'pub.s4'].map((s, i) => h('li', { class: 'step' + (step === i + 1 ? ' on' : '') + (step > i + 1 ? ' done' : ''), 'aria-current': step === i + 1 ? 'step' : null }, h('span', { class: 'step-n' }, step > i + 1 ? '✔' : String(i + 1)), h('span', null, t(s))))),
      step === 1 ? h('div', null, h('table', { class: 'tbl' }, h('tbody', null, stages.map(([k, l]) => { const n = fs.filter((f) => f.stage === k); const e = n.filter((f) => f.sev === 'error').length; return h('tr', null, h('td', null, t(l)), h('td', null, e ? chip('err', '✖', t('n_errors', { n: e })) : n.length ? chip('warn', '⚠', t('n_warnings', { n: n.length })) : chip('ok', '✔', t('pass')))); }), later.map((x) => h('tr', { class: 'muted' }, h('td', null, x), h('td', null, chip('mut', '⊘', t('pub.not_in_1a'))))))), blockers.length ? h('div', { class: 'note err', role: 'alert' }, h('strong', null, t('pub.blocked')), h('ul', null, blockers.map((b) => h('li', null, b)))) : null)
      : step === 2 ? h('div', null, h('p', null, t('ed.change_class') + ': ', chip({ initial: 'info', editorial: 'mut', functional: 'info', metrological: 'warn', breaking: 'err', none: 'mut' }[cls.cls], '', t('cls.' + cls.cls))), h('p', { class: 'muted' }, t('pub.version_help', { v: min })), h('label', { class: 'lbl', for: 'pv-ver' }, t('col.version')), verSel, h('label', { class: 'lbl', for: 'pv-notes' }, t('pub.notes') + ' (' + t('required') + ')'), notes, nmsg)
      : h('div', null, h('p', { class: 'muted' }, t('pub.pinned_help')), deps.length ? h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['col.kind', 'col.key', 'col.version', 'col.digest'].map((c) => h('th', { scope: 'col' }, t(c))))), h('tbody', null, deps.map((x) => { const l = x.it && Store.latest(x.it); return h('tr', null, h('td', null, t('kind.' + x.r.kind)), h('td', null, ltr(x.r.key)), h('td', null, l ? ltr(l.version) : chip('err', '✖', t('missing'))), h('td', null, l ? ltr(shortDigest(l.digest)) : '—')); }))) : null, h('p', { class: 'kv' }, h('span', { class: 'muted' }, t('digest')), ltr(digestOf(d.content))), h('p', null, t('pub.confirm_effect', { v: verSel.value })), h('p', { class: 'note sim' }, h('strong', null, t('pub.sandbox_title') + ' '), t('pub.sandbox_body')), h('ul', { class: 'unavail' }, ['pub.no_export', 'pub.no_sign', 'pub.no_prod'].map((k) => h('li', null, chip('mut', '⊘', t(k))))), h('p', { class: 'note sim' }, t('sim.stepup_body'))));
    foot.replaceChildren(step > 1 ? btn(t('a.back'), () => { step--; paint(); }, 'ghost') : btn(t('a.cancel'), () => dlg.close(), 'ghost'), step < 3 ? (blockers.length && step === 1 ? reasonBtn(t('a.next'), blockers[0], 'primary') : btn(t('a.next'), () => { if (step === 2 && !notes.value.trim()) { nmsg.textContent = t('err.notes_required'); notes.focus(); return; } step++; paint(); }, 'primary')) : btn(t('a.publish_synthetic'), () => { const v = verSel.value; Store.publish(item, persona(), v, notes.value.trim(), cls.cls === 'none' ? 'editorial' : cls.cls); dlg.close(); done(); }, 'primary'));
  }
  const foot = h('div', { class: 'foot-inner' });
  dlg = openDialog({ title: t('a.publish') + ' — ' + t('pub.synthetic_tag'), wide: true, body: [bodyEl], actions: [foot] }); paint();
}

/* ---------------- design system gallery ---------------- */
function viewDesign() {
  const cs = getComputedStyle(document.documentElement);
  const toHex = (c) => { const m = c.trim().match(/^#([0-9a-f]{6})$/i); return m ? '#' + m[1] : null; };
  const tokens = ['bg', 'surface', 'surface-2', 'text', 'text-muted', 'border', 'primary', 'focus', 'ok', 'warn', 'error', 'info', 'hazard', 'sim', 'deployment-test', 'deployment-prod'].map((n) => ({ n, v: cs.getPropertyValue('--' + n).trim() }));
  const bg = cs.getPropertyValue('--surface').trim();
  const sec = (id, title, ...c) => h('section', { class: 'panel ds', 'aria-labelledby': 'ds-' + id }, h('h2', { id: 'ds-' + id }, t(title)), ...c);
  const nonThemeable = ['sim', 'deployment-test', 'deployment-prod', 'hazard', 'focus'];
  const accent = h('input', { type: 'color', id: 'acc', value: '#1b4fd1', 'aria-describedby': 'acc-res' }); const accRes = h('span', { id: 'acc-res', role: 'status', class: 'muted' });
  accent.addEventListener('input', () => { const v = accent.value; const ratio = contrast(v, toHex(cs.getPropertyValue('--surface')) || '#ffffff'); const ratioText = contrast('#ffffff', v); if (ratio >= 4.5 && ratioText >= 4.5) { document.documentElement.style.setProperty('--primary', v); accRes.textContent = t('theme.ok', { r: ratio.toFixed(2) }); } else accRes.textContent = t('theme.rejected', { r: Math.min(ratio, ratioText).toFixed(2) }); });
  const qv = h('input', { class: 'input mono qty-val', type: 'text', inputmode: 'decimal', dir: 'ltr', 'aria-label': t('f.value'), value: '', oninput: () => chk() }); const qm = h('div', { class: 'field-msgs', role: 'status' });
  const qu = h('select', { class: 'input qty-unit', 'aria-label': t('f.unit') }, UNITS.V.map((u) => h('option', null, u)));
  function chk() { if (!qv.value) { qm.replaceChildren(h('span', { class: 'help' }, t('ds.decimal_hint'))); return; } qm.replaceChildren(DEC.test(qv.value) ? h('span', { class: 'field-msg ok' }, '✔ ' + t('ds.decimal_ok')) : h('div', { class: 'field-msg err' }, '✖ ' + t('f.PR-001.decimal'))); } chk();
  const findings = allFindings();
  return [pageHead(t('nav.design')), h('p', { class: 'muted lead' }, t('ds.lead')),
    sec('tokens', 'ds.tokens', h('div', { class: 'sw' }, tokens.map((x) => h('div', null, h('i', { style: 'background:var(--' + x.n + ')' }), h('span', null, '--' + x.n), ltr(x.v, 'muted sm'), nonThemeable.includes(x.n) ? chip('mut sm', '🔒', t('ds.non_themeable')) : null))), h('p', { class: 'muted sm' }, t('ds.contrast_note'))),
    sec('type', 'ds.type', h('table', { class: 'tbl' }, h('tbody', null, ['3xl', '2xl', 'xl', 'lg', 'base', 'sm', 'xs'].map((k) => h('tr', null, h('td', { class: 'muted sm' }, ltr(k)), h('td', { class: 'ts-' + k }, t('ds.sample_text')))))), h('p', { class: 'mono' }, ltr('CONF:VOLT:DC {range}  sha256:ab12cd…  v1.1.0'), ' — ', t('ds.mono_note')), h('p', null, t('ds.mixed'), ' ', ltr('{value} {unit}'), ' ', t('ds.mixed_tail'))),
    sec('space', 'ds.space', h('div', { class: 'space-demo' }, [4, 8, 12, 16, 24, 32, 48].map((s) => h('div', { class: 'sp' }, h('i', { style: 'inline-size:' + s + 'px' }), ltr(s + 'px', 'muted sm')))), h('div', { class: 'g12' }, Array.from({ length: 12 }, (_, i) => h('i', null, ltr(String(i + 1)))))),
    sec('btn', 'ds.buttons', h('div', { class: 'row-wrap' }, btn(t('ds.primary'), () => {}, 'primary'), btn(t('ds.secondary'), () => {}), btn(t('ds.ghost'), () => {}, 'ghost'), btn(t('ds.danger'), () => {}, 'danger'), reasonBtn(t('ds.disabled_reason'), t('reason.no_publish_perm')), iconBtn('⚙', t('ds.icon_btn'), () => {})), h('div', { class: 'row-wrap' }, statusChip('draft'), statusChip('in_review'), statusChip('approved'), statusChip('published'), statusChip('withdrawn'), provChip('synthetic_demo'), provChip('draft'), provChip('verified'), inputBadge('MI-02'), sevChip('error'), sevChip('warning'), sevChip('info'), chip('hazard', '⛔', 'H2'), chip('ok', '✔', t('cl.within')), chip('err', '✖', t('cl.outside')), chip('mut', '○', t('cl.not_eval')))),
    sec('fields', 'ds.fields', h('div', { class: 'field' }, h('label', { class: 'lbl' }, t('ds.qty_demo')), h('div', { class: 'qty-row' }, qv, qu), qm, h('div', { class: 'help' }, t('ds.qty_help'))), h('div', { class: 'field' }, h('div', { class: 'lbl' }, t('ds.interval_demo')), h('div', { class: 'iv' }, incRadio('dsiv', '/x', undefined, { readOnly: false, onChange() {} }, t('inclusivity')), h('div', { class: 'help' }, t('help.no_default_inclusivity')))), h('div', { class: 'field' }, h('div', { class: 'lbl' }, t('ds.input_req_demo')), h('div', { class: 'input-req' }, inputBadge('MI-02'), h('span', { class: 'muted sm' }, MI_REGISTER['MI-02'])))),
    sec('dialogs', 'ds.dialogs', h('div', { class: 'row-wrap' }, btn(t('ds.open_governed'), () => governedConfirm({ title: t('ds.open_governed'), effect: t('effect.approve'), digest: digestOf({ sample: 'synthetic' }), reasonRequired: true, confirmLabel: t('a.approve'), onConfirm: () => toast(t('toast.approved')) })), btn(t('ds.toast_ok'), () => toast(t('toast.saved_ok'))), btn(t('ds.toast_err'), () => toast(t('wiz.fix_first', { n: 2 }), 'err')))),
    sec('charts', 'ds.charts', findings.length ? stageChart(findings) : h('div', { class: 'muted' }, t('chart.none')), h('p', { class: 'muted sm' }, t('ds.chart_note'))),
    sec('states', 'ds.states', h('div', { class: 'states' }, h('div', null, h('h3', null, t('state.loading')), skeleton(3)), h('div', null, h('h3', null, t('st_empty')), emptyState('state.empty_title', 'state.empty_list')), h('div', null, h('h3', null, t('st_error')), errorState('PR-001', () => toast(t('a.retry')))), h('div', null, h('h3', null, t('read_only')), banner('info', t('ed.frozen', { d: 'ab12cd34ef…' }))), h('div', null, h('h3', null, t('st_offline')), banner('warn', t('offline.banner'))))),
    sec('theme', 'ds.theme', h('p', { class: 'muted' }, t('ds.theme_help')), h('div', { class: 'row-wrap' }, h('label', { for: 'acc' }, t('ds.accent')), accent, accRes), h('div', { class: 'row-wrap' }, chip('sim', '◈', t('env.sim_only')), chip('info', '◆', 'TEST'), chip('hazard', '⛔', 'H2'), h('span', { class: 'muted sm' }, t('ds.theme_nochange')))),
  ];
}

/* ---------------- settings ---------------- */
function viewSettings() {
  const me = persona(), canEdit = can(me, 'policy.view') && me === 'quality';
  const locs = LOCALES.map((l) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: policy().required_locales.includes(l) ? true : null, disabled: !canEdit || l === 'en' ? true : null, onchange: (e) => { const s = new Set(policy().required_locales); e.target.checked ? s.add(l) : s.delete(l); policy().required_locales = [...s]; Store.log(null, me, 'policy.changed', [...s].join(',')); toast(t('toast.policy')); route(); } }), h('span', null, t('loc.' + l))));
  const rows = [['draft', ['engineer']], ['submit', ['engineer']], ['approve', ['approver']], ['publish', ['quality']], ['withdraw', ['quality']], ['policy.edit', ['quality']], ['grant.propose', ['admin']], ['grant.approve', []]];
  const personas = ['engineer', 'approver', 'quality', 'manager', 'admin', 'technician'];
  return [pageHead(t('nav.settings')), banner('sim', t('settings.sim_note')),
    h('section', { class: 'panel' }, h('h2', null, t('settings.policy')), h('p', { class: 'muted' }, t('settings.policy_help')), h('fieldset', { class: 'rec' }, h('legend', null, t('env.required_locales')), locs), !canEdit ? h('p', { class: 'muted sm' }, t('settings.policy_ro')) : null),
    h('section', { class: 'panel' }, h('h2', null, t('settings.matrix')), h('p', { class: 'muted' }, t('settings.matrix_help')), h('div', { class: 'tbl-scroll' }, h('table', { class: 'tbl matrix', 'aria-label': t('settings.matrix') }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, t('col.permission')), personas.map((p) => h('th', { scope: 'col' }, t('persona.' + p))))), h('tbody', null, rows.map(([perm, who]) => h('tr', null, h('th', { scope: 'row' }, ltr(perm)), personas.map((p) => h('td', { 'data-label': t('persona.' + p), 'aria-label': (who.includes(p) ? t('granted') : t('not_granted')) }, who.includes(p) ? '✔' : '—'))))))), h('p', { class: 'note sim' }, t('settings.matrix_note'))),
    h('section', { class: 'panel' }, h('h2', null, t('settings.deployment')), h('dl', { class: 'dl' }, h('dt', null, t('env.deployment')), h('dd', null, chip('info', '◆', 'TEST'), ' ', t('settings.not_switchable')), h('dt', null, t('settings.telemetry')), h('dd', null, t('settings.telemetry_off')), h('dt', null, t('env.production')), h('dd', null, t('settings.prod_cr'))))];
}
function viewTechnician() { return [pageHead(t('tech.title')), banner('info', t('tech.body')), h('p', null, h('a', { class: 'link', href: '#/design' }, t('nav.design')))]; }
