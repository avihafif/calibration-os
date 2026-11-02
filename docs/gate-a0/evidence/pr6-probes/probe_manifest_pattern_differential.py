import re,json,random,subprocess,subprocess
# Patterns exactly as they were on main before PR #6 (Phase 0B), matched with re.fullmatch
OLD={"package_id":"[a-z0-9]+(?:-[a-z0-9]+)*","kind":"[A-Za-z][A-Za-z0-9]*","key":"[a-z0-9]+(?:-[a-z0-9]+)*","item_version":"[0-9]+\.[0-9]+\.[0-9]+","content_digest":"sha256:[0-9a-f]{64}","issued_at":"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?Z","expires_at":"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?Z","runtime_min":"[0-9]+\.[0-9]+\.[0-9]+","runtime_max":"[0-9]+\.[0-9]+\.[0-9]+"}
old={k:{"pattern":v} for k,v in OLD.items()}
new=json.load(open('schemas/package-manifest/v1.schema.json',encoding='utf8'))['properties']
names=[k for k,v in new.items() if 'pattern' in v]
random.seed(7)
alpha=list('abcxyzAZ09-.:T Z')+['\n','\r','\u0663','\uff41','\u0430','\u05d0','\U0001f9ea','\u2028','\x00','\ufeff']
seeds={'package_id':'abc-1','kind':'Kind1','key':'k-1','item_version':'1.2.3','content_digest':'sha256:'+'a'*64,'issued_at':'2026-11-02T00:00:00Z','expires_at':'2026-11-02T00:00:00.123456Z','runtime_min':'1.2.3','runtime_max':'1.2.3'}
n=0; diff=0
for name in names:
    o=re.compile(old[name]['pattern']); w=re.compile(new[name]['pattern'])
    pool=[seeds[name]]
    for _ in range(4000):
        s=list(random.choice(pool))
        for _ in range(random.randint(0,3)):
            op=random.random(); i=random.randint(0,len(s))
            if op<.4: s.insert(i,random.choice(alpha))
            elif op<.7 and s: del s[min(i,len(s)-1)]
            elif s: s[min(i,len(s)-1)]=random.choice(alpha)
        t=''.join(s); pool.append(t); n+=1
        if (o.fullmatch(t) is not None)!=(w.search(t) is not None): diff+=1; print('DIFF',name,repr(t))
print('compared',n,'differences',diff)
