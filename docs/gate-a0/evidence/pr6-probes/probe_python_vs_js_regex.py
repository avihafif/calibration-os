import re,json,subprocess
W=lambda inner:'^(?:'+inner+r')(?![\s\S])'
tests=[(r'\d+','\u0663\u0664'),(r'\d+','12'),(r'\w+','\u00e9'),(r'\w+','\u05d3'),(r'\s','\x1c'),(r'\s','\ufeff'),(r'\s','\u180e'),(r'.','\r'),(r'.','\u2028'),(r'.','\U0001f9ea'),(r'[^a]+','\n'),(r'a\b','a'),(r'\u00e9','\u00e9')]
inputs=[(W(p),s) for p,s in tests]
json.dump(inputs,open('in.json','w'))
js="""const t=JSON.parse(require('fs').readFileSync('in.json','utf8'));console.log(JSON.stringify(t.map(([p,s])=>new RegExp(p).test(s))))"""
node=json.loads(subprocess.run(['node','-e',js],capture_output=True,text=True).stdout)
for (p,s),n in zip(inputs,node):
    py=re.search(p,s) is not None
    print('DIVERGE' if py!=n else 'same   ',repr(p[4:-11]),repr(s),'py=',py,'js=',n)
# ReDoS timing
for name,inner,inp in [('adjacent+',r'[a-z]+[a-z]+[a-z]+[a-z]+','a'*400+'!'),('(?:-.+)*',r'(?:-.+)*','-'*22+'x'),('.* .*',r'.*.*.*.*','a'*300+'\n')]:
    p=re.compile(W(inner)); t=time.time(); p.search(inp); print(name,len(inp),'%.2fs'%(time.time()-t))
