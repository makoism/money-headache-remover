const { phone, w } = require('/tmp/v39/real.js'); const fs=require('fs');
(async()=>{ const {b,p,errs}=await phone({w:1200,h:760,dpr:1});
 await p.goto('file:///home/claude/work/money-map-team.html?burrowtest&sqtest&scenetest&nocard#2026-11',{waitUntil:'load'});await w(1500);
 await p.evaluate(()=>{const t=document.querySelector('#tour');if(t&&!t.hidden)document.querySelector('#tourSkip').click();});await w(500);
 await p.evaluate(()=>__bur.open('rainy')); await w(2500);
 const res = await p.evaluate(()=>{
   const hist = c => { const g=c.getContext('2d'), d=g.getImageData(0,0,c.width,c.height).data, m={}; let n=0; for(let i=0;i<d.length;i+=4){ if(d[i+3]<250) continue; const k=((d[i]<<16)|(d[i+1]<<8)|d[i+2]).toString(16).padStart(6,'0'); m[k]=(m[k]||0)+1; n++; } return {n, m}; };
   const out={}; for (const [name,sel] of [['sky','.bv-bg0'],['world','.bv-bg'],['burrow','.bv-cv'],['fx','.bv-fx'],['rain','.bv-rain']]) out[name]=hist(document.querySelector(sel));
   { const hs=[...document.querySelectorAll('.hb-b canvas')]; const tot={}; let n=0; for (const c of hs){ const h=hist(c); n+=h.n; for (const k in h.m) tot[k]=(tot[k]||0)+h.m[k]; } out['homeicons']={n,m:tot}; }
   { const c=document.createElement('canvas'); c.width=60; c.height=40; const g=c.getContext('2d'); const tot={}; let n=0; for (const dir of [1,-1]) for (const f of [2,8,14]) { g.clearRect(0,0,60,40); __scene.dragon(g,30,24,f,dir,true); const h=hist(c); n+=h.n; for (const k in h.m) tot[k]=(tot[k]||0)+h.m[k]; } out['dragon']={n,m:tot}; }
   // squirrels
   for (const st of ['A','B','C']) { const c=document.createElement('canvas'); c.width=120;c.height=48; const g=c.getContext('2d'); const tot={}; let n=0; for (const t of [300,1000,2000,2900,3400,4000,5200]) { g.clearRect(0,0,120,48); __sq.frame(g,t,st,{W:120,base:43,dx:26}); const h=hist(c); n+=h.n; for (const k in h.m) tot[k]=(tot[k]||0)+h.m[k]; } out['squirrel'+st]={n,m:tot}; }
   return out; });
 fs.writeFileSync('/tmp/artaudit.json', JSON.stringify(res)); console.log(Object.keys(res).map(k=>k+':'+Object.keys(res[k].m).length).join(' ')); console.log(JSON.stringify(errs)); await b.close(); })();
