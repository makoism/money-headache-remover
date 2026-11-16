# The Burrow icon, seen from the ground with a wide lens: dirt and roots in front, a dark trunk with a hollow holding a little gold,
# flowers beside it, a lush canopy above and a pale warm sky. Drawn once here as a 32 x 32 pixel picture, then written as the SVGs, PNGs and favicon.ico.
import math, random
from PIL import Image, ImageDraw
N=32
def hx(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
P=dict(sky0='#cfeaea',sky1='#a9d3ee',sky2='#fbe6c6',skyM='#d4ecee',fPink='#f08fb0',fPinkD='#c85a86',fWhite='#fffbe8',fYel='#ffd84a',fBlue='#7da6f0',fPurp='#b48ae6',fOr='#ff9a5a',ivy='#2f8a45',ivyL='#6cc060',
 leafD='#0d3a22',leafM='#1c6638',leafL='#379150',leafH='#78c46a',leafY='#b6e07a',
 barkL='#7a5232',barkM='#573824',barkD='#3a2418',barkX='#22140e',rim='#9a6c40',
 inD='#0e0704',inW='#2e1808',inG='#8a4e10',
 gC='#f6cb58',gc='#c98f28',gW='#fff4bc',
 dirt='#3c2a1a',dirtL='#58402a',dirtD='#2a1c11',moss='#2f6a3a',peb='#7d7268',grass='#2f7d3c',grassL='#62b556')
img=[[None]*N for _ in range(N)]
def put(x,y,c):
    if 0<=x<N and 0<=y<N: img[y][x]=hx(P[c]) if isinstance(c,str) and c in P else c
def raw(x,y,rgb):
    if 0<=x<N and 0<=y<N: img[y][x]=rgb
def get(x,y): return img[y][x]
def mix(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
rnd=random.Random(11)
# light sky, a little deeper towards the top, paler low down
for y in range(N):
    t=y/ (N-1)
    for x in range(N):
        a=hx(P['sky1']); m=hx(P['skyM']); b=hx(P['sky2'])
        raw(x,y,mix(a,m,t/.55) if t<.55 else mix(m,b,(t-.55)/.45))
cx=15.5
def hw(y):
    t=(27-y)/19.0
    w=8.0-4.4*t
    if y>22: w+=(y-22)**1.5*0.42
    return w
def leaf_blob(bx,by,r,deep):
    for y in range(N):
        for x in range(N):
            dx=x+.5-bx; dy=y+.5-by; d=dx*dx+dy*dy
            if d<=r*r:
                lit=-(dx+dy)/(r*1.4)     # upper left is lit
                if deep: c='leafD' if lit<.1 else 'leafM'
                else:
                    c='leafD' if lit<-.35 else 'leafM' if lit<.15 else 'leafL' if lit<.55 else 'leafH'
                    if lit>.75 and rnd.random()<.5: c='leafY'
                put(x,y,c)
# back canopy: dark, deep, with sky showing through the gaps
for _ in range(70):
    bx=rnd.uniform(-1,33); by=rnd.uniform(-1,10)+ (abs(bx-15.5)/16)*3
    leaf_blob(bx,by,rnd.uniform(2,3.2),True)
# hanging side foliage, back
for bx,by in [(1,12),(3,14),(0,16),(30,12),(28,14),(31,16),(6,11),(26,11)]: leaf_blob(bx,by,2.2,True)
# trunk with shaded cylinder, shadow from the canopy above, darkening toward the roots
for y in range(4,28):
    w=hw(y)
    for x in range(N):
        u=(x+.5-cx)/w
        if abs(u)<=1:
            if u<-.78: c='rim'
            elif u<-.35: c='barkL'
            elif u<.3: c='barkM'
            elif u<.7: c='barkD'
            else: c='barkX'
            h=(x*7+(y//3)*13)%11
            if c=='barkM' and h==0: c='barkD'
            if c=='barkL' and h==3: c='barkM'
            if c=='barkD' and h==5: c='barkX'
            col=hx(P[c])
            if y<10: col=mix(col,(14,10,8),.45*(10-y)/6)        # canopy shade
            if y>23: col=mix(col,(14,10,8),.12*(y-23))           # ground shade
            raw(x,y,col)
def dot(x,y,c,a=1):
    if 0<=x<N and 0<=y<N and get(x,y): raw(x,y,mix(get(x,y),hx(P[c]),a))
# bark ridges: long dark grooves with a lit edge, and a few knots
for gx,y0,y1 in [(12,8,23),(14,9,16),(17,8,15),(19,10,22),(10,18,26),(21,20,27)]:
    for y in range(y0,y1):
        w=hw(y); u=(gx+.5-cx)/w
        if abs(u)<.95 and (y*3+gx)%7!=0:
            dot(gx,y,'barkX',.55); dot(gx-1,y,'rim',.18)
for kx,ky in [(12,13),(18,20),(13,21)]:
    for ddx,ddy,c,a in [(0,0,'barkX',.9),(1,0,'barkX',.9),(0,1,'barkX',.8),(1,1,'barkD',.7),(-1,-1,'rim',.35),(0,-1,'rim',.3)]: dot(kx+ddx,ky+ddy,c,a)
# moss creeping up the lit side, near the roots
for mx,my in [(9,26),(10,25),(9,24),(11,24),(10,23),(12,22),(9,22),(11,26),(10,21),(12,25)]: dot(mx,my,'moss',.8)
for mx,my in [(10,24),(11,25),(9,25)]: dot(mx,my,'leafL',.8)
# a little ivy winding up the shaded side, with leaves
iv=[(20,27),(20,25),(19,24),(19,22),(20,21),(20,19),(19,18),(19,16),(20,15),(20,13)]
for x,y in iv: dot(x,y,'ivy',.95)
for x,y,side in [(21,26,1),(18,23,-1),(21,21,1),(18,18,-1),(21,16,1),(18,14,-1)]:
    dot(x,y,'ivy',.95); dot(x+side,y,'ivyL',.9); dot(x,y-1,'ivyL',.7)
def line(x0,y0,x1,y1,c,th=1):
    n=int(max(abs(x1-x0),abs(y1-y0)))*2+1
    for i in range(n+1):
        x=x0+(x1-x0)*i/n; y=y0+(y1-y0)*i/n
        for dx in range(th): put(int(round(x))+dx,int(round(y)),c)
line(13,8,7,3,'barkD',2); line(18,8,25,3,'barkX',2); line(15,6,15,1,'barkD',2)
# hollow
hx0,hy0,hy1=15.5,17,26
def half_at(y):
    t=(y-hy0)/(hy1-hy0-1); return 1.2 if y==hy0 else 1.8+2.2*min(1,t*1.5)
for y in range(hy0,hy1):
    h=half_at(y)
    for x in range(N):
        d=abs(x+.5-hx0)
        if d<=h+1: put(x,y,'barkX')
        if d<=h: put(x,y,'inD')
for y in range(hy0+2,hy1):
    h=half_at(y)
    for x in range(N):
        d=abs(x+.5-hx0)
        if d<=h and y>=hy1-5: put(x,y,'inW')
        if d<=h-1.5 and y>=hy1-3: put(x,y,'inG')
# warm light spilling onto the bark around the hollow
for y in range(hy1-5,hy1+2):
    for x in range(N):
        d=abs(x+.5-hx0); h=half_at(min(y,hy1-1))
        if h+1<d<=h+2.6 and get(x,y) and y<hy1+1:
            raw(x,y,mix(get(x,y),hx(P['gC']),.22))
gold=[(13,25,'gc'),(14,25,'gC'),(15,25,'gC'),(16,25,'gC'),(17,25,'gc'),(18,25,'gc'),(14,24,'gc'),(15,24,'gC'),(16,24,'gW'),(17,24,'gc'),(15,23,'gc'),(16,23,'gC')]
for x,y,c in gold: put(x,y,c)
# middle and front canopy over the trunk: lit, lush, overlapping
for _ in range(60):
    bx=rnd.uniform(-1,33); by=rnd.uniform(-1,8)+(abs(bx-15.5)/16)*3.5
    leaf_blob(bx,by,rnd.uniform(1.8,3.0),False)
for bx,by,r in [(1,10,2.4),(3,12,2.3),(0,14,2.0),(30,10,2.4),(28,12,2.3),(31,14,2.0),(5,9,2),(26,9,2),(2,16,1.6),(29,16,1.6)]: leaf_blob(bx,by,r,False)
# ground: dark soil with a wavy top edge, moss, shadow around the trunk
for x in range(N):
    top=28+round(1.2*math.sin(x*.5+1))
    for y in range(top,N):
        r=rnd.random(); c='dirt'
        if r<.12: c='dirtL'
        elif r<.26: c='dirtD'
        if y==top: c='dirtL'
        col=hx(P[c])
        sh=max(0,1-abs(x+.5-cx)/10)               # darker near the trunk
        col=mix(col,(10,6,4),.5*sh)
        raw(x,y,col)
for x,y in [(4,29),(5,29),(24,30),(25,30),(27,29),(2,31)]: put(x,y,'moss')
# cute flowers beside the trunk
def flower(x,base,h,petal,centre='fYel',lean=0):
    for i in range(h): put(x+(lean if i>h//2 else 0),base-i,'grass')
    tx=x+lean; ty=base-h
    for dx,dy in [(-1,0),(1,0),(0,-1),(0,1)]: put(tx+dx,ty+dy,petal)
    put(tx,ty,centre)
def bell(x,base,h,col):
    for i in range(h): put(x,base-i,'grass')
    for i,(dx,dy) in enumerate([(0,0),(-1,1),(1,1)]): put(x+dx,base-h+dy,col)
    put(x,base-h-1,col)
flower(5,27,7,'fPink','fYel',0); flower(3,27,3,'fYel','fOr',0); bell(8,27,6,'fPurp')
flower(26,27,6,'fWhite','fYel',0); flower(29,27,4,'fPink','fYel',-1); bell(23,27,5,'fBlue')
for gx in (2,10,22,30):
    for i in range(3): put(gx,28-i,'grass'); put(gx+1,28-(i>>1),'grassL')
# roots, with a thin rim light
line(10,26,2,30,'barkD',3); line(21,26,30,30,'barkD',3); line(12,27,7,31,'barkD',3); line(19,27,24,31,'barkD',3)
line(10,26,2,29,'barkL',1); line(21,26,30,29,'barkL',1); line(12,27,7,30,'barkL',1); line(19,27,24,30,'barkL',1)
line(14,28,13,31,'barkD',2); line(17,28,18,31,'barkD',2)
for x,y in [(6,31),(26,31),(1,29),(30,30),(10,31)]: put(x,y,'peb')
for x,y in [(2,27),(3,26),(29,27),(28,26),(0,28),(31,28),(4,28),(27,28)]: put(x,y,'grass')
for x,y in [(3,27),(29,26),(2,26),(28,27)]: put(x,y,'grassL')
# soft vignette for depth
for y in range(N):
    for x in range(N):
        d=math.hypot(x+.5-16,y+.5-16)/22
        v=max(0,d-.55)*.45
        if get(x,y): raw(x,y,mix(get(x,y),(8,14,10),min(.4,v)))

im=Image.new('RGBA',(N,N))
for y in range(N):
    for x in range(N): im.putpixel((x,y),get(x,y)+(255,))
def rects(cell, ox, oy):
    out=[]
    for j in range(N):
        i=0
        while i<N:
            c=get(i,j); k=i
            while k+1<N and get(k+1,j)==c: k+=1
            out.append(f'<rect x="{ox+i*cell:g}" y="{oy+j*cell:g}" width="{(k-i+1)*cell:g}" height="{cell:g}" fill="#{c[0]:02x}{c[1]:02x}{c[2]:02x}"/>')
            i=k+1
    return ''.join(out)
head='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" shape-rendering="crispEdges">'
def rounded(inner, rx):
    return head+f'<defs><clipPath id="r"><rect width="512" height="512" rx="{rx}"/></clipPath></defs><g clip-path="url(#r)">'+inner+'</g></svg>'
open('icon.svg','w').write(rounded(rects(16,0,0),104))
open('favicon.svg','w').write(rounded(rects(16,0,0),104))
sky='#%02x%02x%02x'%get(2,25)
open('icon-maskable.svg','w').write(head+f'<rect width="512" height="512" fill="{sky}"/>'+rects(12,64,64)+'</svg>')
def rmask(size,frac=.2):
    m=Image.new('L',(size*4,size*4),0); ImageDraw.Draw(m).rounded_rectangle((0,0,size*4-1,size*4-1),radius=int(size*4*frac),fill=255)
    return m.resize((size,size),Image.LANCZOS)
big=im.resize((512,512),Image.NEAREST)
def out(name,size,round_=True):
    r=big.resize((size,size),Image.NEAREST if size%32==0 else Image.LANCZOS)
    if round_: r.putalpha(rmask(size))
    r.save(name)
    return r
out('favicon-32.png',32); r48=out('favicon-48.png',48); out('icon-192.png',192); out('icon-512.png',512); out('apple-touch-icon.png',180,False)
mk=Image.new('RGBA',(512,512),hx(sky)+(255,)); mk.paste(big.resize((384,384),Image.NEAREST),(64,64)); mk.save('icon-maskable-512.png')
r16=big.resize((16,16),Image.LANCZOS); r16.putalpha(rmask(16))
r48.save('favicon.ico',sizes=[(16,16),(32,32),(48,48)])
print('icons written')
