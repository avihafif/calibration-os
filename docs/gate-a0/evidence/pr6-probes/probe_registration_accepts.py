import sys,json,re,time,subprocess
sys.path[:0]=['packages/py/calos_metadata','packages/py/calos_domain']
from calos_metadata import schema as S
W=lambda inner:'^(?:'+inner+r')(?![\s\S])'
cands=[r'\d+', r'\w+', r'\s', r'.', r'.+', r'[^a]+', r'a\b', r'[a-z]+', r'(?=a)a', r'(?<=a)b', r'\p{L}', r'[\d]', r'\u00e9', r'(?i)a', r'a{1,3}', r'(?:-.+)*', r'[a-z]+[a-z]+[a-z]+[a-z]+', r'(?:a|b)', r'(a)']
ok=[]
for c in cands:
    p=W(c)
    try: S._check_pattern(p,'/p'); ok.append(c); print('ACCEPTED',repr(c))
    except S.SchemaError as e: print('rejected',repr(c),e.reason_code)
json.dump(ok,open('accepted.json','w'))
