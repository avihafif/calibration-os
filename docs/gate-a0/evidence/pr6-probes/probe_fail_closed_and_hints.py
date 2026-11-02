import sys,json
sys.path[:0]=['packages/py/calos_metadata','packages/py/calos_domain','packages/py/calos_security']
from pathlib import Path
from calos_metadata import schema as S
r=S.SchemaRegistry(Path('.')); print('registry ok', list(r._entries))
# fail-closed probes
def reg(s):
    try: S.validate_schema(s); return 'ACCEPTED'
    except S.SchemaError as e: return e.reason_code
obj=lambda **k:{'type':'object','additionalProperties':False,**k}
print('open object      ',reg(obj()) , '(expected ok:', reg(obj(properties={})),')')
print('nested defs      ',reg(obj(properties={'a':{'type':'string','$defs':{}}})))
print('remote ref       ',reg({'$ref':'https://x/y'}))
print('format keyword   ',reg(obj(properties={'a':{'type':'string','format':'email'}})))
print('hint expression  ',reg(obj(properties={'a':{'type':'string','x-calos-editor':{'version':1,'widget':'expression'}}})))
print('hint input marker',reg(obj(properties={'a':{'type':'string','x-calos-editor':{'version':1,'input_marker':'MI-01'}}})))
print('hint no version  ',reg(obj(properties={'a':{'type':'string','x-calos-editor':{'widget':'text'}}})))
print('hint label str   ',reg(obj(properties={'a':{'type':'string','x-calos-editor':{'version':1,'label':'f.name'}}})))
print('hint mono        ',reg(obj(properties={'a':{'type':'string','x-calos-editor':{'version':1,'mono':True}}})))
print('hint enum-multi  ',reg(obj(properties={'a':{'type':'string','x-calos-editor':{'version':1,'widget':'enum-multi'}}})))
print('hint ref_kind inj',reg(obj(properties={'a':{'type':'string','x-calos-editor':{'version':1,'ref_kind':'a b'}}})))
print('hint label script',reg(obj(properties={'a':{'type':'string','x-calos-editor':{'version':1,'label':{'$t':'<script>'}}}})))
print('hint expr widget ok?',reg(obj(properties={'a':{'type':'string','x-calos-editor':{'version':1,'widget':'table'}}})))
print('null type        ',reg(obj(properties={'a':{'type':'null'}})))
print('number type      ',reg(obj(properties={'a':{'type':'number'}})))
print('type list        ',reg(obj(properties={'a':{'type':['string','null']}})))
print('allOf            ',reg(obj(properties={'a':{'allOf':[{'type':'string'}]}})))
print('oneOf+type       ',reg(obj(properties={'a':{'oneOf':[{'type':'string'},{'type':'integer'}],'type':'string'}})))
# content probes
sc=obj(properties={'n':{'type':'integer','minimum':0},'s':{'type':'string','maxLength':3},'l':{'type':'array','items':{'type':'string'},'uniqueItems':True}},required=['n'])
def val(c):
    return [(f.code,f.pointer.value) for f in S.validate_findings(sc,c)]
print(val({'n':1.0}), val({'n':True}), val({'n':1,'s':'abcd'}), val({'n':1,'l':['a','a']}), val({'n':1,'l':['\ud800','\ud800']}), val({'n':1,'s':'\U0001f9ea\U0001f9ea\U0001f9ea'}))
print(val({'n':9007199254740993}), val({'n':-1}), val({'n':None}), val({'n':1,'x':1}))
