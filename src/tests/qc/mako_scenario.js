const B=require('./build.js'); const L=require('./lib.js'); const fs=require('fs');
const dev=process.argv[2]==='desk';
(async()=>{
 const opt=dev?{w:1300,h:900,dpr:1,mobile:false,tag:'FD',tick:['rent','util','food','net','phone','ins','subs','gas','loan']}:{w:390,h:844,dpr:2,mobile:true,tag:'F',tick:['rent','util','food','net','phone','ins','subs','gas','loan']};
 const T=opt.tag;
 const r=await B.build(opt,undefined); const p=r.p;
 for(let i=0;i<4;i++){ const d=await L.dump(p,900); if(/^Setup done/.test(d.t))break; await r.next(); }
 await r.next(); await L.w(1500);
 const tab=async(t)=>{await p.evaluate((t)=>document.querySelector('#tab-'+t).click(),t);await L.w(900);};
 const panel=()=>p.evaluate(()=>document.querySelector('[role=tabpanel]:not([hidden])').innerText);
 const homeDigest=async(n)=>{ await tab('home'); const t=await p.evaluate(()=>document.querySelector('[role=tabpanel]:not([hidden])').innerText); await p.evaluate(()=>window.scrollTo(0,0)); await p.screenshot({path:`/tmp/qc/mako/${T}_${n}_home.png`}); return t; };
 const setIn=async(sel,v)=>{await p.click(sel,{clickCount:3}); await p.type(sel,String(v)); await p.keyboard.press('Tab'); await L.w(400);};
 await tab('basics');
 await setIn('#st-minBank',10000); await setIn('#st-ceiling',40000);
 await tab('month');
 const openRow=async(id)=>{ await p.evaluate((id)=>{const b=document.getElementById(id); if(b.getAttribute('aria-expanded')!=='true') b.click();},id); await L.w(400); };
 const addLine=async(rowId,jar,name,amt)=>{ await openRow(rowId);
   await p.evaluate((rowId)=>{const rowEl=document.getElementById(rowId).closest('.row')||document.getElementById(rowId).parentElement; const b=[...document.querySelectorAll('[data-edit]')].find(e=>/Rename/.test(e.innerText)&&e.offsetParent); if(b) b.click();},rowId); await L.w(500);
   const inputs=await p.$$(`form[data-addline="${jar}"] input`); await inputs[0].type(name); await inputs[1].type(String(amt));
   await p.evaluate((jar)=>document.querySelector(`form[data-addline="${jar}"] button[type=submit]`).click(),jar); await L.w(600);
   await p.evaluate((jar)=>{const d=[...document.querySelectorAll('[data-edit]')].find(e=>/Done/.test(e.innerText)&&e.offsetParent); if(d)d.click();},jar); await L.w(400);
 };
 await addLine('rt-nec','nec','Cat supplies',5000);
 console.log('jar ids', await p.evaluate(()=>[...document.querySelectorAll('.row-t')].map(e=>e.id).join(',')));
 await addLine('rt-ffa','ffa','NISA investing',20000);
 console.log((await panel()).split('Details')[0].slice(0,900));
 await p.screenshot({path:`/tmp/qc/mako/${T}_planNov_a.png`});
 


 const setv=async(id,v,keep)=>{ await p.evaluate((id,v)=>{const e=document.getElementById(id); e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));},id,String(v)); await L.w(250);
   if(keep) await p.evaluate((id)=>{const k=document.getElementById(id.replace('i-','k-')); if(k&&!k.hidden){const b=k.querySelector('[data-keep]'); if(b) b.click();}},id); await L.w(150); };
 // card hangover as Nov one-time
 await openRow('rt-items');
 await p.type('#addLabel','October card statement (extras)'); await p.type('#addAmt','178472'); await p.evaluate(()=>document.querySelector('#addItem button[type=submit]').click()); await L.w(600);
 for(const id of ['i-l-spend','i-l-learn','i-l-invest','i-l-give']) await setv(id,0,true);
 for(const id of ['i-g-rainy','i-g-travel','i-g-moving','i-g-car']) await setv(id,0,false);
 await p.evaluate(()=>window.scrollTo(0,0)); await L.w(300);
 await p.screenshot({path:`/tmp/qc/mako/${T}_planNov_hero.png`});
 const nov=await panel(); console.log('NOV PLAN\n'+nov.split('Choose a month')[1].split('November 2026')[2].slice(0,1500));
 fs.writeFileSync(`/tmp/qc/mako/${T}_nov.txt`,nov);

 // F2 modifications
 await tab('month');
 await setv('i-b',58490,true); await setv('i-side',40000,true);
 await setv('i-l-food',0,true); await setv('i-l-spend',35000,true);
 // emergency target
 await tab('goals');
 await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(e=>/Edit goal/.test(e.innerText)&&e.offsetParent); b.click();}); await L.w(700);
 await setv('ge-rainy-target',600000,false);
 await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(e=>/^(Done|Close|Save)/.test(e.innerText.trim())&&e.offsetParent); if(b)b.click();}); await L.w(500);
 await tab('month'); await p.evaluate(()=>window.scrollTo(0,0)); await p.screenshot({path:`/tmp/qc/mako/${T}2_planNov_hero.png`});
 const nov2=await panel(); console.log('NOV2\n'+nov2.split('Choose a month')[1].split('Details')[0].slice(900,2200).replace(/\n+/g,' | '));
 const h=await homeDigest('nov2'); fs.writeFileSync(`/tmp/qc/mako/${T}2_homefull.txt`,h); await p.screenshot({path:`/tmp/qc/mako/${T}2_home_full.png`,fullPage:true});
 console.log('HOME2\n'+h.slice(0,1500).replace(/\n+/g,' | '));
 await tab('month');
 await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.innerText.trim()==='All months'&&e.offsetParent); b.click();}); await L.w(900);
 const am=await panel(); console.log('ALLMONTHS2\n'+am.slice(0,900).replace(/\n+/g,' | '));
 await tab('month'); await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.innerText.trim()==='Month'&&e.offsetParent); if(b)b.click();}); await L.w(400); await p.select('#monthSel','2027-09'); await L.w(800); const sep=await panel(); console.log('SEP27\n'+sep.split('Choose a month')[1].split('November 2026')[0].slice(0,100)+sep.split('Details')[1].slice(0,700).replace(/\n+/g,' | '));
 await p.evaluate(()=>document.getElementById('rt-lts').click()); await L.w(400); console.log('LTS',(await p.evaluate(()=>[...document.querySelectorAll('input[id^=i-g-]')].map(e=>e.id+'='+e.value).join(' '))));
 await r.b.close();})();
