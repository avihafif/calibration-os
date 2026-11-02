import re,time
W=lambda inner:'^(?:'+inner+r')(?![\s\S])'
for name,inner,n,ch in [('[a-z]+ x4',r'[a-z]+[a-z]+[a-z]+[a-z]+',150,'a'),('[a-z]+ x4',r'[a-z]+[a-z]+[a-z]+[a-z]+',300,'a'),('(?:-.+)*',r'(?:-.+)*',20,'-'),('(?:-.+)*',r'(?:-.+)*',24,'-')]:
    p=re.compile(W(inner)); t=time.time(); p.search(ch*n+'!'); print(name,n,'chars: %.2fs'%(time.time()-t),flush=True)
