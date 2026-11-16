import json, re, math
pal=open('/home/claude/work/team/pal.js').read()
ramps={}
for m in re.finditer(r"(\w+):\s*\[([^\]]+)\]", pal):
    ramps[m.group(1)]=re.findall(r"#([0-9a-f]{6})", m.group(2))
P=[(r,i,c) for r,cs in ramps.items() for i,c in enumerate(cs)]
def lin(c): c/=255; return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def oklab(h):
    r,g,b=[lin(int(h[i:i+2],16)) for i in (0,2,4)]
    l=.4122214708*r+.5363325363*g+.0514459929*b; m=.2119034982*r+.6806995451*g+.1073969566*b; s=.0883024619*r+.2817188376*g+.6299787005*b
    l,m,s=[x**(1/3) for x in (l,m,s)]
    return (.2104542553*l+.793617785*m-.0040720468*s, 1.9779984951*l-2.428592205*m+.4505937099*s, .0259040371*l+.7827717662*m-.808675766*s)
PL=[(r,i,c,oklab(c)) for r,i,c in P]
def near(h):
    o=oklab(h); best=min(PL,key=lambda p:sum((a-b)**2 for a,b in zip(o,p[3]))); return best, math.sqrt(sum((a-b)**2 for a,b in zip(o,best[3])))
A=json.load(open('/tmp/artaudit.json'))
print('asset            colours  pixels   within-palette(dE<.04)  mean dE')
rep={}
for name,v in A.items():
    tot=0; ok=0; s=0; off={}
    for h,n in v['m'].items():
        b,d=near(h); tot+=n; s+=d*n
        if d<.04: ok+=n
        else: off[h]=(n,round(d,3),b[0]+str(b[1]))
    rep[name]=off
    print(f"{name:14s} {len(v['m']):6d} {tot:8d}   {100*ok/max(1,tot):5.1f}%   {s/max(1,tot):.3f}")
for name in ['squirrelA','burrow','fx']:
    top=sorted(rep[name].items(), key=lambda kv:-kv[1][0])[:8]
    print(name,'worst off-palette:',[(f'#{h}',n,d,b) for h,(n,d,b) in top])
# rules
import sys,subprocess
bad=0
for name,v in A.items():
    tot=sum(v['m'].values()); ok=sum(n for h,n in v['m'].items() if near(h)[1]<.04)
    if name in ('dragon','homeicons') and ok/max(1,tot)<.95: print('FAIL',name,'only %.0f%% on palette (min 95%%)'%(100*ok/max(1,tot))); bad+=1
    if name=='dragon' and len(v['m'])>24: print('FAIL dragon uses',len(v['m']),'colours (max 24)'); bad+=1
    if name.startswith('squirrel') and len(v['m'])>24: print('FAIL',name,'uses',len(v['m']),'colours (max 24)'); bad+=1
    if name in('sky','world','burrow','squirrelA','squirrelB','squirrelC') and ok/max(1,tot)<.60: print('FAIL',name,'only %.0f%% on palette (min 60%%)'%(100*ok/tot)); bad+=1
art=['squirrel.js','burrow_rainy.js','burrows.js','scene.js']
for f in art:
    t=open('/home/claude/work/team/'+f).read()
    for pat in ['createRadialGradient','createLinearGradient','shadowBlur','filter = ','ctx.filter','.blur(']:
        if pat in t and not (f=='burrows.js' and pat=='createLinearGradient'):
            print('FAIL',f,'uses',pat,'(smooth effects are not pixel art)'); bad+=1
css=open('/home/claude/work/team/style.css').read()
import re
m=re.search(r'\.bv-sign\s*\{([^}]*)\}',css)
if m:
    body=m.group(1)
    def val(p):
        mm=re.search(p+r'\s*:\s*([^;]+);',body); return mm.group(1).strip() if mm else None
    bg,bd=val('background'),val('border')
    if (bg not in (None,'transparent','none')) or (bd not in (None,'0','none')) or 'box-shadow' in body or 'background-image' in body:
        print('FAIL style.css .bv-sign is visible: the world rule (ART_GUIDE 0a) says nothing is laid over the art'); bad+=1
else:
    print('FAIL .bv-sign hit area missing'); bad+=1
bt=open('/home/claude/work/team/burrows.js').read()+open('/home/claude/work/team/burrow_rainy.js').read()
if 'paintSign' in bt:
    print('FAIL paintSign overlay found: paint the sign into the world (BUR.drawSign)'); bad+=1
if 'drawSign(' not in open('/home/claude/work/team/burrow_rainy.js').read():
    print('FAIL rainy world has no in-world sign'); bad+=1
print('ART CHECK', 'FAIL' if bad else 'PASS'); sys.exit(1 if bad else 0)
