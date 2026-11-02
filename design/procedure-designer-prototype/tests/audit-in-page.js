/* In-page accessibility/readability audit for the Procedure Designer DESIGN PROTOTYPE.
   Usage: serve design/ (any static server), open procedure-designer-prototype/index.html, paste this whole file into the DevTools console
   (or evaluate it through browser automation). It walks workspaces x {light,dark} x {en,he} (the Procedure workspace in both Canvas and Outline views;
   the Simulation Lab with a finished failing run and with a pending operator prompt) and reports: unnamed form controls, unnamed buttons/links,
   duplicate ids, heading-order defects, tree/tab ARIA defects, horizontal overflow at the current viewport, and computed text-contrast failures.
   It is a prototype QA aid, NOT a substitute for axe-core in CI or for screen-reader testing. */
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const rgb = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); const [hi, lo] = x > y ? [x, y] : [y, x]; return (hi + 0.05) / (lo + 0.05); };
  function bgOf(el) { let e = el; const layers = []; while (e) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } e = e.parentElement; } let base = { r: 255, g: 255, b: 255 }; for (let i = layers.length - 1; i >= 0; i--) { const l = layers[i]; base = { r: l.r * l.a + base.r * (1 - l.a), g: l.g * l.a + base.g * (1 - l.a), b: l.b * l.a + base.b * (1 - l.a) }; } return base; }
  const named = (el) => el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))) || (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) || el.closest('label') || el.title;
  const states = [['design', 'canvas'], ['design', 'outline'], ['driver'], ['metrology'], ['safety'], ['sim', 'finished'], ['sim', 'prompt']];
  const out = {}; let checked = 0;
  async function setup(ws, variant) {
    PD.persona = 'engineer'; initState(); PD.centre = variant === 'outline' ? 'outline' : 'canvas'; PD.metTab = 'points'; PD.dock = 'validation';
    if (ws === 'sim') { startRun(); if (variant === 'finished') { simAction('toend'); while (simRun().state === 'waiting_prompt') { answerPrompt(simRun(), 'confirm'); simAction('toend'); } } else { driveUntil((e) => !!e.waiting); } }
    go(ws); route(true); await wait(120);
  }
  for (const theme of ['light', 'dark']) for (const loc of ['en', 'he']) {
    UI.theme = theme; UI.locale = loc; applyTheme(); applyLocale();
    for (const [ws, variant] of states) {
      await setup(ws, variant); const key = theme + '/' + loc + '/' + ws + (variant ? ':' + variant : ''); const issues = []; checked++;
      document.querySelectorAll('#main input:not([type=hidden]),#main select,#main textarea').forEach((e) => { if (!named(e)) issues.push('unnamed-control:' + (e.dataset.ptr || e.id || e.type)); });
      document.querySelectorAll('button,[role=button],a[href]').forEach((e) => { if (!(e.textContent.trim() || e.getAttribute('aria-label') || e.title)) issues.push('unnamed-button:' + (e.className || e.tagName)); });
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i); if (dup.length) issues.push('duplicate-id:' + [...new Set(dup)].join(','));
      const hs = [...document.querySelectorAll('main h1,main h2,main h3')].map((h) => +h.tagName[1]); for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) issues.push('heading-skip:' + hs.slice(i - 1, i + 1)); if (document.querySelectorAll('main h1').length !== 1) issues.push('h1-count:' + document.querySelectorAll('main h1').length);
      document.querySelectorAll('[role=tab]').forEach((t) => { if (!t.hasAttribute('aria-selected')) issues.push('tab-without-aria-selected'); });
      document.querySelectorAll('[role=treeitem]').forEach((t) => { if (!t.hasAttribute('aria-level') || !t.hasAttribute('aria-selected')) issues.push('treeitem-attrs'); });
      document.querySelectorAll('svg[role=img]').forEach((s) => { if (!s.getAttribute('aria-label')) issues.push('svg-img-without-label'); });
      document.querySelectorAll('[aria-labelledby]').forEach((e) => { if (!document.getElementById(e.getAttribute('aria-labelledby'))) issues.push('dangling-labelledby:' + e.getAttribute('aria-labelledby')); });
      if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('horizontal-overflow:' + document.documentElement.scrollWidth + '>' + innerWidth);
      if (!document.querySelector('.proto-banner') || !document.querySelector('.frame-badge.sim')) issues.push('missing-simulation-identification');
      let low = 0; const sample = [];
      document.querySelectorAll('#app *').forEach((e) => {
        if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || e.closest('.sr-only') || e.closest('.wm')) return;
        const fg = rgb(cs.color); if (!fg) return; const bg = bgOf(e); const eff = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) }; const rr = ratio(eff, bg);
        const big = parseFloat(cs.fontSize) >= 18.66 || (parseFloat(cs.fontSize) >= 14 && +cs.fontWeight >= 700); const exempt = e.closest('[disabled],[aria-disabled=true],.opt-chip.dis,.tbl th');
        if (rr < (big ? 3 : 4.5) && !exempt) { low++; if (sample.length < 3) sample.push(e.tagName + '.' + String(e.className).split(' ')[0] + ' ' + rr.toFixed(2)); }
      });
      if (low) issues.push('contrast:' + low + ' ' + sample.join(' | '));
      if (issues.length) out[key] = [...new Set(issues)];
    }
  }
  UI.theme = 'light'; UI.locale = 'en'; applyTheme(); applyLocale(); initState(); route(true);
  const result = { statesChecked: checked, viewport: innerWidth + 'x' + innerHeight, statesWithFindings: Object.keys(out).length, findings: out, missingI18n: [...MISSING] };
  window.__audit = result; console.log(JSON.stringify(result, null, 2)); return result;
})();
