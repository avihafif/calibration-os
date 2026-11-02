import sys, json, random, re, time, subprocess, os
root = sys.argv[1]
sys.path[:0] = [os.path.join(root, 'packages/py/calos_metadata'), os.path.join(root, 'packages/py/calos_domain')]
from calos_metadata import schema as S

W = lambda inner: '^(?:' + inner + r')(?![\s\S])'
# named constructs that H-1 / M-1 reported
named = {
 r'\d+': 'unicode digit shorthand', r'\w+': 'word shorthand', r'\s': 'space shorthand', r'.': 'dot', r'.+': 'dot plus',
 r'[^a]+': 'negated class', r'a\b': 'word boundary', r'[\d]': 'shorthand in class', r'[a-z]+[a-z]+[a-z]+[a-z]+': 'adjacent classes',
 r'[a-z]*[a-z]*': 'adjacent star classes', r'(?:-[a-z]+)*(?:-[a-z]+)*': 'adjacent groups', r'é': 'unicode escape', r'é': 'non-ASCII literal',
 r'[a-z-]+-[a-z]+': 'hyphen in class + separator', r'[a-z]+a[a-z]+': 'alnum literal between classes', r'(?:a|b)': 'alternation', r'(a)': 'capture',
 r'[a-z]+(?:-[a-z]+)*': 'segment pattern (existing style)', r'[0-9]{4}-[0-9]{2}': 'fixed digits', r'[0-z]+': 'range across classes',
}
print('--- named constructs')
for c, d in named.items():
    try:
        S._check_pattern(W(c), '/p'); print('ACCEPTED', repr(c), '-', d)
    except S.SchemaError as e:
        print('rejected', repr(c), '-', d, e.reason_code)

# random grammar-ish fuzz
random.seed(11)
atoms = ['[a-z]', '[A-Z]', '[0-9]', '[a-z0-9]', '[A-Za-z]', '[a-f0-9]', '[a-z-]', '[0-z]', '[^a]', '\\d', '.', 'a', '-', ':', '\\.', '_', '(?:-[a-z]+)', '(?:\\.[0-9]{1,6})', '(?:-[a-z0-9]+)', '(?:[a-z]+)', 'é']
quant = ['', '', '+', '*', '{3}', '{1,4}', '{2,}', '?']
accepted = []
tried = 0
for _ in range(60000):
    n = random.randint(1, 6)
    inner = ''.join(random.choice(atoms) + random.choice(quant) for _ in range(n))
    tried += 1
    try:
        S._check_pattern(W(inner), '/p')
    except S.SchemaError:
        continue
    except Exception as e:
        print('UNEXPECTED EXCEPTION', repr(inner), type(e).__name__, e); continue
    accepted.append(inner)
accepted = sorted(set(accepted))
print('--- fuzz: tried', tried, 'accepted unique', len(accepted))

samples = ['', 'a', 'abc', 'ABC', '0', '123', 'a-b', 'a-b-c', 'a:b', 'a.b', 'a.1', '2026-11-02', 'a_b', '٣', 'é', 'ד', '\r', '\n', 'a\n', ' ', '﻿', '\x1c', '\U0001f9ea', 'a-' * 40 + 'b', 'a' * 50, '0' * 8, 'é', '-', '--', 'A-Za-z']
json.dump({'patterns': [W(p) for p in accepted], 'samples': samples}, open('fuzz_in.json', 'w'))
js = """const t=JSON.parse(require('fs').readFileSync('fuzz_in.json','utf8'));
const out=t.patterns.map(p=>{const r=new RegExp(p);return t.samples.map(s=>r.test(s)?1:0).join('')});console.log(JSON.stringify(out))"""
res = subprocess.run(['node', '-e', js], capture_output=True, text=True)
node = json.loads(res.stdout)
div = []
for p, row in zip(accepted, node):
    py = ''.join('1' if re.search(W(p), s) else '0' for s in samples)
    if py != row:
        div.append((p, [samples[i] for i in range(len(samples)) if py[i] != row[i]]))
print('python vs node divergences on accepted patterns:', len(div))
for d in div[:10]: print('  DIVERGE', d)

# timing: adversarial inputs on every accepted pattern
slow = []
adv = ['a' * 3000 + '!', 'a-' * 1500 + '!', '0' * 3000 + '!', 'a.' * 1500 + '!', 'a:' * 1500 + '!', 'A' * 3000 + '!', '-' * 3000 + '!', ('a-' * 400) + 'é']
t0 = time.time()
for p in accepted:
    r = re.compile(W(p))
    for s in adv:
        t = time.time(); r.search(s); dt = time.time() - t
        if dt > 0.25: slow.append((p, len(s), round(dt, 2)))
print('adversarial timing: patterns over 0.25 s:', len(slow), '| total', round(time.time() - t0, 1), 's')
for s in slow[:10]: print('  SLOW', s)
