import sys,json
def apply(path,pairs):
    s=open(path).read(); miss=[]
    for old,new in pairs:
        c=s.count(old)
        if c==0: miss.append(old[:80]); continue
        s=s.replace(old,new)
    open(path,'w').write(s)
    print(path,'applied',len(pairs)-len(miss),'missing',len(miss))
    for m in miss: print('  MISSING:',m)
