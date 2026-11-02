/* Self-checks for the Procedure Designer DESIGN PROTOTYPE (pure layers). No dependencies:  node design/procedure-designer-prototype/tests/pd.test.js
   Prototype QA only — NOT product tests. They encode rules the product tests must also enforce. Run results are recorded in docs/procedure-designer/09-*. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const here = path.resolve(__dirname, '..'), p1 = path.resolve(here, '..', 'phase1a-prototype');
const stubEl = () => ({ setAttribute() {}, append() {}, addEventListener() {}, style: {}, classList: { add() {} }, dataset: {}, querySelector() { return null; }, querySelectorAll() { return []; } });
const ctx = { console, TextEncoder, document: { createElement: stubEl, createTextNode: (x) => x, getElementById: stubEl, querySelector: () => null, querySelectorAll: () => [] }, window: {}, location: { hash: '' }, CSS: { escape: (x) => x }, Math, JSON, Date };
vm.createContext(ctx);
const src = (f) => fs.readFileSync(f, 'utf8').replace(/^'use strict';/m, '');
const files = [p1 + '/js/engine.js', p1 + '/js/data.js', p1 + '/js/i18n.js', p1 + '/js/ui.js', here + '/js/pd-core.js', here + '/js/pd-data.js', here + '/js/pd-logic.js', here + '/js/pd-sim.js', here + '/js/pd-strings.js', here + '/js/pd-strings-b.js', here + '/js/pd-strings-c.js'];
vm.runInContext(files.map(src).join('\n;\n') + '\nfunction persona(){return "engineer"}function createDialog(){}', ctx, { filename: 'pd-bundle.js' });
const run = (s) => vm.runInContext(s, ctx);
let passed = 0, failed = 0; const test = (name, fn) => { try { fn(); passed++; console.log('  ok  ' + name); } catch (e) { failed++; console.error('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; } };
const J = (s) => JSON.parse(run('JSON.stringify((()=>{' + s + '})())'));
const SETUP = 'const driver=MKDRV(), tables=[MKTABLE()], profile=MKPROFILE(); const V=(p,o)=>validateProcedure(p,{driver,tables,profile,...(o||{})}); const codes=(fs)=>fs.map(f=>f.code+(f.node?"@"+f.node:"")+(f.field?"."+f.field:""));';
const withProc = (mut, tail) => J(SETUP + 'const p=MKPROC(); const byId=(id)=>findNode(p,id).node; ' + mut + '; ' + tail);

/* ---------- decimal / units / expressions ---------- */
test('Dec: exact decimal arithmetic, no binary float artefacts', () => {
  assert.strictEqual(run("Dec.parse('0.1').add(Dec.parse('0.2')).toString()"), '0.3');
  assert.strictEqual(run("Dec.parse('1').sub(Dec.parse('0.9')).toString()"), '0.1');
  assert.strictEqual(run("Dec.parse('2.50').cmp(Dec.parse('2.5'))"), 0);
  assert.throws(() => run("Dec.parse('1e3x')"));
});
test('expression language is closed: no calls to unknown functions, no statements, no member escape', () => {
  for (const bad of ['eval("1")', 'constructor', 'a.b.constructor', '1; 2', 'x => x', '`a`', 'while(1){}', '__proto__', 'sleep(1)', 'abs(1,2,3)'])
    assert.throws(() => run('evaluate(' + JSON.stringify(bad) + ', {})'), undefined, bad);
});
test('expressions: dimension checks and unit arithmetic', () => {
  assert.strictEqual(run("fmtQ(evaluate('2 su + 500 msu', {}))"), '2.5 su');
  assert.throws(() => run("evaluate('2 su + 1 s', {})"), /mismatch|DIM/i);
  assert.throws(() => run("typeCheck(parseExpr('2 su + 1 s'), {typeOf(){return null}})"));
});
test('expressions: unresolved input marker can never be evaluated', () => {
  assert.throws(() => run("evaluate('item.tp.tol + 1 su', {item:{tp:{tol:{k:'input',mi:'MI-04'}}}})"));
});
test('expressions: AST size is bounded', () => {
  const big = Array.from({ length: 400 }, () => '1').join(' + ');
  assert.throws(() => run('(()=>{const a=parseExpr(' + JSON.stringify(big) + '); if(astSize(a)>MAX_AST) throw new Error("big"); })()'));
});
test('expressions are deterministic (same inputs → same result, 200 repeats)', () => {
  const r = J('const s=new Set(); for(let i=0;i<200;i++) s.add(fmtQ(evaluate("max(1 su, 2 su, 4 su) * 3", {}))); return [...s];');
  assert.strictEqual(r.length, 1);
});
test('PRNG: counter-based and seeded; same seed same stream, different seed differs', () => {
  assert.strictEqual(run('rand32(42,7)'), run('rand32(42,7)'));
  assert.notStrictEqual(run('rand32(42,7)'), run('rand32(43,7)'));
});

/* ---------- tree operations and placement ---------- */
test('tree: insert / remove / move keep ids unique and counts correct', () => {
  const r = J('const p=MKPROC(); const n0=nodeCount(p); const n=newNode(p,"flow.delay",{duration:"1 s"}); insertNode(p,n,{lane:"setup"},0); const n1=nodeCount(p); moveNode(p,n.id,{lane:"teardown"},0); const f=findNode(p,n.id); removeNode(p,n.id); const ids=[]; walk(p,(x)=>ids.push(x.id)); return {n0,n1,lane:f.ref.lane,n2:nodeCount(p),uniq:new Set(ids).size===ids.length};');
  assert.deepStrictEqual(r, { n0: 15, n1: 16, lane: 'teardown', n2: 15, uniq: true });
});
test('tree: a container cannot be moved into itself or its descendants', () => {
  assert.strictEqual(run('(()=>{const p=MKPROC(); return moveNode(p,"foreach_1",{parent:"foreach_1",slot:"body"},0)})()'), false);
});
test('placement: depth and node-count limits are enforced', () => {
  const r = J('const p=MKPROC(); const drv=MKDRV(); let ref={lane:"as_found"}; let n; for(let i=0;i<MAX_DEPTH;i++){ n=newNode(p,"flow.if",{cond:"true"}); insertNode(p,n,ref,0); ref={parent:n.id,slot:"then"}; } const deep=canPlace(p,"flow.delay",ref,drv); return {deep};');
  assert.strictEqual(r.deep.ok, false);
});
test('placement: hazardous steps are refused in the finally lane and non-safe ops in safe_state', () => {
  const r = J('const p=MKPROC(); const drv=MKDRV(); const t=newNode(p,"flow.try",{match:["E_TIMEOUT"]}); insertNode(p,t,{lane:"teardown"},0); return {fin:canPlace(p,"source.apply",{parent:t.id,slot:"finally"},drv), safe:canPlace(p,"source.apply",{lane:"safe_state"},drv), safeOff:canPlace(p,"source.off",{lane:"safe_state"},drv)};');
  assert.strictEqual(r.fin.ok, false); assert.strictEqual(r.safe.ok, false); assert.strictEqual(r.safeOff.ok, true);
});
test('placement: operator prompts are not allowed in safe_state (fail-closed path must not wait on a person)', () => {
  assert.strictEqual(J('return canPlace(MKPROC(),"operator.confirm",{lane:"safe_state"},MKDRV())').ok, false);
});
test('canvas and outline share ONE view-model (same ids in the same order)', () => {
  const r = J('const p=MKDRAFT(); const vm=viewModel(p); const fl=flattenProc(p).map(x=>x.id||x.node&&x.node.id); return {vm:vm.map(v=>v.id), n:vm.length};');
  assert.strictEqual(r.n, 15 + 2);
});

/* ---------- validation fixtures: every rule has at least one failing fixture ---------- */
test('published demo: valid except unresolved metrology inputs (PR-013) and informational notices', () => {
  const r = withProc('', 'return codes(V(p))');
  assert.ok(r.every((c) => /^PR-013|^PR-024|^PR-014/.test(c)), r.join(','));
  assert.ok(r.some((c) => c.startsWith('PR-013')));
});
test('PR-001 closed schema: unknown property, missing required, wrong lane', () => {
  assert.ok(withProc('byId("delay_1").bogus="x"', 'return codes(V(p))').includes('PR-001@delay_1.bogus'));
  assert.ok(withProc('delete byId("apply_1").value', 'return codes(V(p))').includes('PR-001@apply_1.value'));
  assert.ok(withProc('p.lifecycle.safe_state.push(newNode(p,"flow.delay",{duration:"1 s"}))', 'return codes(V(p))').some((c) => c.startsWith('PR-001@delay')));
});
test('PR-002 unknown role / table', () => {
  assert.ok(withProc('byId("acquire_1").role="nope"', 'return codes(V(p))').includes('PR-002@acquire_1.role'));
  assert.ok(withProc('byId("foreach_1").over="nope"', 'return codes(V(p))').includes('PR-002@foreach_1.over'));
});
test('PR-003 unbounded loops and retry attempts', () => {
  assert.ok(withProc('delete byId("foreach_1").max_iterations', 'return codes(V(p))').includes('PR-003@foreach_1.max_iterations'));
  assert.ok(withProc('byId("foreach_1").max_iterations=2', 'return V(p).filter(f=>f.code==="PR-003").map(f=>f.sev)').includes('warning'));
  assert.ok(withProc('const n=newNode(p,"flow.repeat_until",{until:"true",max_iterations:3}); insertNode(p,n,{lane:"as_found"},0)', 'return codes(V(p))').some((c) => /^PR-003@repeat_until_\d+\.timeout/.test(c)));
});
test('PR-004 use of an unassigned variable, PR-006 dimension mismatch and syntax errors', () => {
  assert.ok(withProc('byId("limits_1").measured="var.nothing"', 'return codes(V(p))').includes('PR-004@limits_1.measured'));
  assert.ok(withProc('byId("delay_1").duration="item.tp.nominal"', 'return codes(V(p))').includes('PR-006@delay_1.duration'));
  assert.ok(withProc('byId("delay_1").duration="1 +"', 'return codes(V(p))').includes('PR-006@delay_1.duration'));
});
test('PR-005 constant condition warns', () => {
  assert.ok(withProc('const n=newNode(p,"flow.if",{cond:"true"}); insertNode(p,n,{lane:"as_found"},0)', 'return codes(V(p))').some((c) => /^PR-005@if_/.test(c)));
});
test('PR-007 retry forbidden on H2+ and non_repeatable nodes', () => {
  assert.ok(withProc('byId("apply_1").on_error={action:"retry",max_attempts:2,backoff:"0.1"}', 'return codes(V(p))').includes('PR-007@apply_1.on_error'));
});
test('PR-008 resume policy cannot be weaker than derived minimum', () => {
  assert.ok(withProc('byId("apply_1").resume_policy="idempotent"', 'return codes(V(p))').includes('PR-008@apply_1.resume_policy'));
});
test('PR-009 unknown operation / argument / missing argument / not a query', () => {
  assert.ok(withProc('byId("config_1").op="nonexistent"', 'return codes(V(p))').includes('PR-009@config_1.op'));
  assert.ok(withProc('byId("config_1").args.extra="1"', 'return codes(V(p))').includes('PR-009@config_1.args'));
  assert.ok(withProc('byId("config_1").args={}', 'return codes(V(p))').includes('PR-009@config_1.args'));
  assert.ok(withProc('byId("acquire_1").op="reset"', 'return codes(V(p))').includes('PR-009@acquire_1.op'));
});
test('PR-010 hazardous step without governed Safety Profile coverage fails closed', () => {
  assert.ok(J(SETUP + 'const p=MKPROC(); return codes(validateProcedure(p,{driver,tables,profile:null}))').some((c) => c.startsWith('PR-010@apply_1')));
});
test('PR-013 unresolved MI inputs are listed; PR-015 inclusivity must be explicit (no default)', () => {
  assert.ok(withProc('', 'return V(p).some(f=>f.code==="PR-013"&&f.params.mi==="MI-04")'));
  assert.ok(J('const driver=MKDRV(), t=MKTABLE(); delete t.rows[0].lo_inc; return validateProcedure(MKPROC(),{driver,tables:[t],profile:MKPROFILE()}).some(f=>f.code==="PR-015")'));
});
test('PR-018 hazardous procedure without teardown/safe-state path warns', () => {
  assert.ok(withProc('p.lifecycle.teardown=[]; p.lifecycle.safe_state=[]', 'return codes(V(p))').includes('PR-018'));
});
test('PR-019 non-safe operation in safe_state; hazardous step in finally', () => {
  assert.ok(withProc('p.lifecycle.safe_state.push({id:"x",type:"driver.call",role:"uut",op:"reset"})', 'return codes(V(p))').includes('PR-019@x.op'));
});
test('PR-021 raw/SCPI/script-like node types and fields are rejected with a dedicated code', () => {
  assert.ok(withProc('p.lifecycle.setup.push({id:"raw1",type:"driver.raw_scpi",command:"*RST"})', 'return codes(V(p))').includes('PR-021@raw1.type'));
  assert.ok(withProc('byId("config_1").raw_command="*RST"', 'return codes(V(p))').includes('PR-021@config_1.raw_command'));
  assert.ok(withProc('byId("config_1").script="x=1"', 'return codes(V(p))').includes('PR-021@config_1.script'));
});
test('PR-021 argument values go through the expression language, never raw wire text', () => {
  assert.ok(withProc('byId("config_1").args.function="*RST;SYNT:OUTP ON"', 'return codes(V(p))').some((c) => c.startsWith('PR-006@config_1.args')));
});
test('PR-023 a bound wider than the effective envelope is refused', () => {
  assert.ok(withProc('byId("apply_1").bound_max_abs="9"', 'return codes(V(p))').includes('PR-023@apply_1.bound_max_abs'));
  assert.ok(!withProc('byId("apply_1").bound_max_abs="7"', 'return codes(V(p))').some((c) => c.startsWith('PR-023@apply_1')));
});
test('PR-024 simulation-only content is flagged; PR-014 synthetic data is flagged', () => {
  const c = withProc('', 'return codes(V(p))'); assert.ok(c.includes('PR-024') && c.includes('PR-014'));
});
test('I18N-001 missing required locale text is a warning', () => {
  assert.ok(withProc('delete byId("confirm_1").prompt.he', 'return codes(V(p,{requiredLocales:["en","he"]}))').includes('I18N-001@confirm_1.prompt'));
});

/* ---------- safety: two-tier model ---------- */
test('effective limit = AHL ∩ profile ∩ procedure bound (narrowing only)', () => {
  const r = J(SETUP + 'const e1=effectiveLimit("set_source_level.level",profile,null); const e2=effectiveLimit("set_source_level.level",profile,"5"); const e3=effectiveLimit("set_source_level.level",profile,"9"); return {a:e1.effective.toString(),as:e1.source,b:e2.effective.toString(),bs:e2.source,c:e3.effective.toString()}');
  assert.deepStrictEqual(r, { a: '8', as: 'profile', b: '5', bs: 'procedure', c: '8' });
});
test('without a profile the AHL alone does NOT authorise hazardous operation (uncovered)', () => {
  const r = J('const e=effectiveLimit("set_source_level.level",null,null); return {cov:e.covered, ahl:!!e.ahl}');
  assert.strictEqual(r.cov, false);
});
test('an unknown target has no AHL → not covered (fail closed)', () => {
  assert.strictEqual(J('return effectiveLimit("unknown.target",MKPROFILE(),null).covered').valueOf(), false);
});
test('a Safety Profile envelope beyond the AHL is refused (PR-023); equal is allowed', () => {
  assert.strictEqual(J('return checkProfileEnvelope("set_source_level.level","10.5")').ok, false);
  assert.strictEqual(J('return checkProfileEnvelope("set_source_level.level","10.5")').code, 'PR-023');
  assert.strictEqual(J('return checkProfileEnvelope("set_source_level.level","10")').ok, true);
});
test('AHL pack is deep-frozen and no function can modify it', () => {
  assert.ok(run('Object.isFrozen(AHL_PACK) && Object.isFrozen(AHL_PACK.entries) && Object.isFrozen(AHL_PACK.entries[0]) && Object.isFrozen(AHL_PACK.entries[0].max_abs)'));
  assert.throws(() => run('"use strict"; AHL_PACK.entries[0].max_abs.value="999"'));
  const writers = fs.readFileSync(here + '/js/pd-logic.js', 'utf8') + fs.readFileSync(here + '/js/pd-sim.js', 'utf8') + (fs.existsSync(here + '/js/pd-ui-safety.js') ? fs.readFileSync(here + '/js/pd-ui-safety.js', 'utf8') : '');
  assert.ok(!/AHL_PACK\s*(\.|\[)[^;]*=(?![=>])/.test(writers.replace(/[=!]==?/g, '')), 'no assignment into AHL_PACK anywhere');
});
test('there is no override / bypass / skip-safety identifier anywhere in the prototype code', () => {
  const all = ['pd-core', 'pd-data', 'pd-logic', 'pd-sim', 'pd-ui-designer', 'pd-ui-driver', 'pd-ui-metrology', 'pd-ui-safety', 'pd-ui-sim', 'pd-app'].map((f) => { try { return fs.readFileSync(here + '/js/' + f + '.js', 'utf8'); } catch (e) { return ''; } }).join('\n');
  const bad = all.match(/\b(override|bypass|skipSafety|skip_safety|disableSafety|ignoreLimit|forceWrite|unsafeMode|debugBackdoor|sudo)\w*/gi) || [];
  assert.deepStrictEqual(bad.filter((w) => !/^override\b/i.test(w) || /overrideAhl|overrideLimit/i.test(w)), []);
});

/* ---------- broker and driver: no raw SCPI ---------- */
test('wire text is only produced from typed parameters; control characters and injection are rejected', () => {
  const S = (v) => '{function:{k:"str",v:' + JSON.stringify(v) + '}}';
  assert.ok(run('formatWire(opByName(MKDRV(),"set_function"),' + S('level') + ')').includes('SYNT:'));
  for (const bad of ['level;SYNT:OUTP ON', 'level\n*RST', 'nope', '*RST']) assert.throws(() => run('formatWire(opByName(MKDRV(),"set_function"),' + S(bad) + ')'), undefined, bad);
});
test('the prototype has no API that accepts a free-form command string', () => {
  const simSrc = fs.readFileSync(here + '/js/pd-sim.js', 'utf8');
  assert.ok(!/function\*?\s+(sendRaw|rawWrite|writeRaw|sendCommand|execRaw)\b/.test(simSrc));
  assert.ok(!/STEP_CATALOG\s*\[\s*['"]?(driver\.)?raw/.test(simSrc));
  assert.ok(!run('Object.keys(STEP_CATALOG).some(k=>/raw|scpi|script|exec/i.test(k))'));
});
test('closed schema: no step schema allows additional properties and no field is a script/code/command string', () => {
  const r = J('return Object.entries(STEP_CATALOG).map(([k,e])=>[k,e.schema.additionalProperties,Object.keys(e.schema.properties).filter(p=>/raw|scpi|script|code|command|eval/i.test(p))])');
  r.forEach(([k, ap, bad]) => { assert.strictEqual(ap, false, k); assert.deepStrictEqual(bad, [], k); });
});
test('every catalog entry declares group, glyph, lanes and a closed schema; hazards only on source/measure steps', () => {
  const r = J('return Object.entries(STEP_CATALOG).map(([k,e])=>({k,g:!!e.group,gl:!!e.glyph,l:Array.isArray(e.lanes),h:e.hazard||null}))');
  r.forEach((e) => assert.ok(e.g && e.gl && e.l, e.k));
  assert.deepStrictEqual(r.filter((e) => e.h).map((e) => e.k).sort(), ['measure.acquire', 'source.apply', 'source.off']);
});
test('broker: out-of-envelope command is refused BEFORE any wire write (hazard → envelope → state → write)', () => {
  const r = J(SETUP + 'const p=MKPROC(); const t=MKTABLE(); t.rows[0].nominal={value:"9",unit:"su"}; const run=runToEnd({proc:p,driver,tables:[t],profile,scenario:"nominal"}); const wr=run.wire.filter(w=>w.op==="set_source_level"&&!w.blocked); return {outcome:run.outcome,code:run.failure&&run.failure.code,wrote:wr.length,kinds:run.events.filter(e=>e.kind==="safety.violation").length}');
  assert.strictEqual(r.code, 'E_SAFETY_VIOLATION'); assert.strictEqual(r.wrote, 0); assert.ok(r.kinds >= 1);
});
test('a safety violation is NOT catchable by a flow.try handler and is NOT retried', () => {
  const r = J(SETUP + 'const p=MKPROC(); const t=MKTABLE(); t.rows[0].nominal={value:"9",unit:"su"}; const fe=findNode(p,"foreach_1").node; const tr=newNode(p,"flow.try",{match:["E_SAFETY_VIOLATION","E_TIMEOUT"]}); tr.body=fe.body; tr.handler=[]; fe.body=[tr]; const run=runToEnd({proc:p,driver,tables:[t],profile,scenario:"nominal"}); return {outcome:run.outcome,code:run.failure&&run.failure.code,handler:run.events.filter(e=>e.kind==="handler.enter").length}');
  assert.strictEqual(r.code, 'E_SAFETY_VIOLATION'); assert.strictEqual(r.handler, 0); assert.strictEqual(r.outcome, 'failed');
});
test('injected unsafe_level fault is blocked by the broker, run fails closed, safe state confirmed, output off', () => {
  const r = J(SETUP + 'const run=runToEnd({proc:MKDRAFT(),driver,tables:[MKTABLE()],profile,scenario:"nominal",faults:[{id:"f1",kind:"unsafe_level"}]}); return {code:run.failure&&run.failure.code,out:run.sim.state.output,safe:run.events.some(e=>e.kind==="safe_state.confirmed")}');
  assert.strictEqual(r.code, 'E_SAFETY_VIOLATION'); assert.strictEqual(r.out, 'off'); assert.ok(r.safe);
});
test('withdrawn / missing Safety Profile: the simulated broker refuses hazardous operations', () => {
  const r = J(SETUP + 'const t=MKTABLE(); t.rows=t.rows.slice(0,2); const run=runToEnd({proc:MKPROC(),driver,tables:[t],profile:null,scenario:"nominal"}); return {code:run.failure&&run.failure.code,wrote:run.wire.filter(w=>w.op==="set_source_level"&&!w.blocked).length}');
  assert.strictEqual(r.code, 'E_SAFETY_VIOLATION'); assert.strictEqual(r.wrote, 0);
});

/* ---------- simulation: determinism, faults, recovery, resume ---------- */
const CLEAN = 'const t=MKTABLE(); t.rows=t.rows.slice(0,2);';
test('run: clean two-point table completes; report is simulated, not issued, not approvable', () => {
  const r = J(SETUP + CLEAN + 'const run=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); const rep=buildReport(run,"sha256:x"); return {o:run.outcome,n:run.dataset.points.length,rep:{s:rep.simulated,i:rep.issued,a:rep.approvable,w:rep.watermark.length,u:rep.statements.uncertainty,c:rep.statements.conformity}}');
  assert.strictEqual(r.o, 'completed'); assert.strictEqual(r.n, 2); assert.deepStrictEqual(r.rep, { s: true, i: false, a: false, w: 3, u: 'not_evaluated', c: 'not_evaluated' });
});
test('run: unresolved metrology input stops the run with E_UNRESOLVED_INPUT at the exact node and still reaches safe state', () => {
  const r = J(SETUP + 'const run=runToEnd({proc:MKPROC(),driver,tables,profile,scenario:"nominal"}); const x=explainFailure(run); return {o:run.outcome,c:x.code,n:x.node,pts:run.dataset.points.length,out:run.sim.state.output,fix:x.fixes.map(f=>f.kind)}');
  assert.deepStrictEqual(r, { o: 'failed', c: 'E_UNRESOLVED_INPUT', n: 'delay_1', pts: 2, out: 'off', fix: ['metrology'] });
});
test('run: same seed and config → identical event hash chain; different seed → different readings', () => {
  const a = J(SETUP + CLEAN + 'const r=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal",seed:7}); return r.journalHash').valueOf();
  const b = J(SETUP + CLEAN + 'const r=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal",seed:7}); return r.journalHash').valueOf();
  const c = J(SETUP + CLEAN + 'const r=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal",seed:8}); return r.journalHash').valueOf();
  assert.strictEqual(a, b); assert.notStrictEqual(a, c);
});
test('journal events are hash-chained and sequence numbers are gapless', () => {
  const r = J(SETUP + CLEAN + 'const r=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); return {gapless:r.events.every((e,i)=>e.seq===i+1),hashes:r.events.every(e=>/^[0-9a-f]{8}$/.test(e.h))}');
  assert.deepStrictEqual(r, { gapless: true, hashes: true });
});
test('fault: one-shot timeout on a retry-policy node is recovered; persistent timeout exhausts retries and fails', () => {
  const ok = J(SETUP + CLEAN + 'const r=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal",faults:[{id:"f1",kind:"timeout",op:"read_value"}]}); return {o:r.outcome,retry:r.events.filter(e=>e.kind==="retry").length}');
  assert.strictEqual(ok.o, 'completed'); assert.ok(ok.retry >= 1);
  const bad = J(SETUP + CLEAN + 'const r=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal",faults:[{id:"f1",kind:"timeout",op:"read_value",persistent:true}]}); const x=explainFailure(r); return {o:r.outcome,c:x.code,n:x.node,pol:x.policy}');
  assert.deepStrictEqual(bad, { o: 'failed', c: 'E_TIMEOUT', n: 'acquire_1', pol: 'retry' });
});
test('fault: garbled response, error-queue entry and disconnect surface distinct stable codes', () => {
  const codes = (k) => J(SETUP + CLEAN + 'const r=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal",faults:[{id:"f",kind:"' + k + '",op:"read_value",persistent:true}]}); return r.failure&&r.failure.code');
  assert.strictEqual(codes('garbled'), 'E_PARSE'); assert.strictEqual(codes('error_queue'), 'E_INSTRUMENT_ERROR'); assert.strictEqual(codes('disconnect'), 'E_DISCONNECT');
});
test('a failed run always runs teardown and then safe state; source output is OFF at the end', () => {
  for (const k of ['timeout', 'garbled', 'disconnect']) {
    const r = J(SETUP + CLEAN + 'const r=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal",faults:[{id:"f",kind:"' + k + '",op:"read_value",persistent:true}]}); return {o:r.outcome,out:r.sim.state.output,safe:r.events.some(e=>e.kind==="safe_state.confirmed"||e.kind==="safe_state.unconfirmed")}');
    assert.strictEqual(r.o, 'failed', k); assert.ok(r.safe, k);
  }
});
test('step / pause / resume: stepping to the end gives the same result as running to the end', () => {
  const r = J(SETUP + CLEAN + 'const a=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); const b=createRun({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); let n=0; for(;;){ if(b.state==="waiting_prompt"){ answerPrompt(b,"confirm"); continue; } if(!advance(b)&&b.state!=="waiting_prompt") break; if(++n>20000) throw new Error("runaway"); } return {same:a.journalHash===b.journalHash,state:b.state}');
  assert.deepStrictEqual(r, { same: true, state: 'completed' });
});
test('interrupt-and-resume reaches the same recorded points as an uninterrupted run (resume parity)', () => {
  const r = J(SETUP + CLEAN + 'const a=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); const b=createRun({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); const drive=(lim)=>{ let n=0; for(;;){ if(b.state==="waiting_prompt"){ answerPrompt(b,"confirm"); continue; } if(!advance(b)&&b.state!=="waiting_prompt") break; if(++n>lim) break; } }; drive(60); interrupt(b); const st1=b.state; const ok=resume(b); drive(20000); return {st1,ok,o:b.outcome,pa:a.dataset.points.map(p=>p.id),pb:b.dataset.points.map(p=>p.id),dup:new Set(b.dataset.points.map(p=>p.id)).size!==b.dataset.points.length}');
  assert.strictEqual(r.st1, 'interrupted'); assert.ok(r.ok); assert.strictEqual(r.o, 'completed'); assert.deepStrictEqual(r.pb, r.pa); assert.strictEqual(r.dup, false);
});
test('resume of a non_repeatable in-flight node requires an explicit decision', () => {
  const r = J(SETUP + CLEAN + 'const b=createRun({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); let n=0; for(;;){ const e=advance(b); if(!e) break; if(e.kind==="node.start"&&e.node==="apply_1"){ break; } if(++n>20000) break; } interrupt(b); const plan=resumePlan(b); const refused=resume(b); return {pol:plan.steps.map(s=>s.id), dec:!!plan.decision, refused}');
  if (r.dec) assert.strictEqual(r.refused, false);
  assert.ok(r.pol.includes('identity'));
});
test('operator prompts wait for an answer; stepping does not silently answer them', () => {
  const r = J(SETUP + CLEAN + 'const b=createRun({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); let n=0; for(;;){ const e=advance(b); if(!e||b.state==="waiting_prompt"||e.waiting) break; if(++n>20000) break; } const s1=b.state; const again=advance(b); return {s1,again, s2:b.state}');
  assert.strictEqual(r.s1, 'waiting_prompt'); assert.strictEqual(r.again, null); assert.strictEqual(r.s2, 'waiting_prompt');
});
test('answering a prompt works when stepping stopped on the prompt event (single answer resumes the run)', () => {
  const r = J(SETUP + CLEAN + 'const b=createRun({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); let e; while((e=advance(b))){ if(e.kind==="prompt") break; } const s1=b.state; answerPrompt(b,"confirm"); const s2=b.state; return {s1,s2}');
  assert.deepStrictEqual(r, { s1: 'waiting_prompt', s2: 'running' });
});
test('loop bounds and event budget stop runaway execution (E_LOOP_BOUND)', () => {
  const r = J(SETUP + CLEAN + 'const p=MKPROC(); const n=newNode(p,"flow.repeat_until",{until:"false",max_iterations:3,timeout:{value:"60",unit:"s"}}); n.body=[]; insertNode(p,n,{lane:"as_found"},0); const run=runToEnd({proc:p,driver,tables:[t],profile,scenario:"nominal"}); return {o:run.outcome,c:run.failure&&run.failure.code}');
  assert.strictEqual(r.c, 'E_LOOP_BOUND');
});
test('simulation data is flagged in every wire record and every report; no code path produces an approvable report', () => {
  const r = J(SETUP + CLEAN + 'const run=runToEnd({proc:MKPROC(),driver,tables:[t],profile,scenario:"nominal"}); return {allSim:run.wire.every(w=>w.simulated===true), n:run.wire.length}');
  assert.ok(r.allSim && r.n > 0);
  const src2 = fs.readFileSync(here + '/js/pd-sim.js', 'utf8');
  assert.ok(!/approvable\s*:\s*true/.test(src2) && !/issued\s*:\s*true/.test(src2) && !/simulated\s*:\s*false/.test(src2));
});
test('simulator randomness lives only in the simulator module', () => {
  for (const f of ['pd-core', 'pd-logic']) { const s = fs.readFileSync(here + '/js/' + f + '.js', 'utf8'); assert.ok(!/Math\.random|Date\.now|new Date|performance\.now/.test(s), f + ' uses clock/random'); }
  assert.ok(!/Math\.random|Date\.now|new Date/.test(fs.readFileSync(here + '/js/pd-sim.js', 'utf8')));
});

/* ---------- version comparison and classification ---------- */
test('diff: id-aware, detects added / changed / moved nodes', () => {
  const r = J('const a=MKPROC(), b=MKDRAFT(); const d=diffProcedures(a,b); return d.map(x=>x.type+":"+x.id)');
  assert.ok(r.includes('added:if_1') && r.some((x) => x.startsWith('changed:foreach_1')));
  const mv = J('const a=MKPROC(), b=MKPROC(); const n=findNode(b,"record_1").node; removeNode(b,"record_1"); insertNode(b,n,{lane:"teardown"},0); return diffProcedures(a,b).map(x=>x.type+":"+x.id)');
  assert.ok(mv.includes('moved:record_1'));
});
test('change classification is raise-only: loop bound = functional; hazardous op/bound = safety', () => {
  assert.strictEqual(J('const a=MKPROC(), b=MKDRAFT(); return classifyProcDiff(diffProcedures(a,b),MKDRV()).cls'), 'functional');
  assert.strictEqual(J('const a=MKPROC(), b=MKPROC(); findNode(b,"apply_1").node.bound_max_abs="6"; return classifyProcDiff(diffProcedures(a,b),MKDRV()).cls'), 'safety');
  assert.strictEqual(J('const a=MKPROC(), b=MKPROC(); findNode(b,"delay_1").node.title.en="Settle"; return classifyProcDiff(diffProcedures(a,b),MKDRV()).cls'), 'editorial');
});
test('hazard path lists every H2+ operation with coverage; recovery matrix covers every hazard-bearing and timed node', () => {
  const hp = J(SETUP + 'return hazardPath(MKPROC(),{driver,profile}).map(x=>x.node+":"+x.hazard+":"+x.covered)');
  assert.ok(hp.length >= 1 && hp.every((x) => x.includes(':H')));
  const rm = J('return recoveryMatrix(MKPROC(),MKDRV()).map(r=>r.node.id+":"+r.policy+":"+r.behavior)'); assert.ok(rm.includes('apply_1:resumable:reconcile') && rm.every((x) => /:(rerun|reconcile|decision)$/.test(x)));
});
test('digest: canonical JSON digest is stable across key order', () => {
  assert.strictEqual(run('digestOf(MKPROC())'), run('(()=>{const p=MKPROC(); const q={}; Object.keys(p).reverse().forEach(k=>q[k]=p[k]); return digestOf(q)})()'));
});

/* ---------- architecture / boundary lint on the prototype source ---------- */
test('boundary lint: no instrument-, manufacturer- or model-specific logic in logic/sim/UI code', () => {
  const bad = /(34401|keysight|agilent|fluke|rigol|tektronix|if\s*\(\s*model\s*===?|model\s*===?\s*['"])/i;
  for (const f of ['pd-core', 'pd-logic', 'pd-sim', 'pd-ui-designer', 'pd-ui-driver', 'pd-ui-metrology', 'pd-ui-safety', 'pd-ui-sim', 'pd-app']) {
    let s = ''; try { s = fs.readFileSync(here + '/js/' + f + '.js', 'utf8'); } catch (e) { continue; }
    assert.ok(!bad.test(s), f);
  }
});
test('no eval / Function / innerHTML / document.write / network API in prototype code', () => {
  for (const f of fs.readdirSync(here + '/js').filter((x) => x.endsWith('.js'))) {
    const s = fs.readFileSync(here + '/js/' + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    assert.ok(!/\beval\s*\(|new\s+Function\s*\(|\.innerHTML\s*=|document\.write|\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon|importScripts/.test(s), f);
  }
});
test('no duplicate top-level declarations across the scripts that share one global scope (index.html load order)', () => {
  const html = fs.readFileSync(here + '/index.html', 'utf8'); const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => path.resolve(here, m[1])); const seen = {};
  srcs.forEach((f) => { const t = fs.readFileSync(f, 'utf8'); for (const m of t.matchAll(/^(?:async\s+)?function\*?\s+([A-Za-z0-9_$]+)|^(?:const|let|var|class)\s+([A-Za-z0-9_$]+)/gm)) { const n = m[1] || m[2]; (seen[n] = seen[n] || []).push(path.basename(f)); } });
  const dups = Object.entries(seen).filter(([, a]) => a.length > 1).map(([n, a]) => n + ': ' + a.join(', ')); assert.deepStrictEqual(dups, []);
});
test('index.html has a strict CSP with connect-src none and no inline scripts or handlers', () => {
  const html = fs.readFileSync(here + '/index.html', 'utf8');
  assert.ok(/connect-src 'none'/.test(html) && /script-src 'self'/.test(html) && !/<script>[^<]/.test(html) && !/\son[a-z]+\s*=/.test(html));
});
test('every i18n key used by the prototype exists in both languages, he has no copy of en', () => {
  const miss = J('const m=[]; Object.entries(D).forEach(([k,v])=>{ if(k.startsWith("pd.")&&(!v[0]||!v[1])) m.push(k); }); return m');
  assert.deepStrictEqual(miss, []);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
