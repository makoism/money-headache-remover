/* QC round 13 numbers gate B1: with part of Free to spend held back for the minimum, the Home tile and the band on Plan and Receipts said
   "¥17,000 planned, ¥16,500 safe to spend" while the card said "Planned ¥20,000". 17,000 is what is left of the plan (20,000 less 3,000 spent),
   so it is called left, never planned. Made-up numbers. Run: node tests/qc/qc33_left_word.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:199000,bank:50000,min:49500,defs:{'bill:rent':90000,'bill:food':40000,envelope:20000,education:20000,invest:20000,give:10000},eT:400000,eS:50000,eM:0,noTrip:true});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;delete S.cfg.bankNow;delete S.cfg.bankAt;__t.persist();__t.restructure();});
 await L.rc(p,3000,'envelope','2026-11-07');
 const st=await p.evaluate(()=>{const C=calcAll(__t.S),V=viewOf(__t.S,C,'2026-11','2026-11-20'),r=V.map.month.find(x=>x.id==='play');return {held:r.held,planLeft:r.planLeft,amount:r.amount,status:C.byYm['2026-11'].status,bankEnd:C.byYm['2026-11'].bankEnd};});
 console.log('state',JSON.stringify(st));
 ck('the case holds part of Free to spend back',st.held>0&&st.planLeft>st.amount,JSON.stringify(st));
 const T={};
 for(const [k,t] of [['home','tab-home'],['plan','tab-month'],['rc','tab-receipts']]){await L.tab(p,t);await w(600);T[k]=await p.evaluate(()=>document.body.innerText.replace(/⁠/g,'').replace(/\s+/g,' '));}
 const all=T.home+'\n'+T.plan+'\n'+T.rc, pl='¥'+Math.round(st.planLeft).toLocaleString('en-US');
 ck('no screen calls what is left of Free to spend "planned"',!all.includes(pl+' planned,'),(all.match(new RegExp('.{0,40}'+pl.replace('¥','\\u00a5')+' planned,.{0,30}','g'))||[]).join(' | '));
 ck('Home says '+pl+' left',T.home.includes(pl+' left'),'');
 ck('Plan says '+pl+' left',T.plan.includes(pl+' left'),'');
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'qc33_left_word: '+bad+' FAIL':'qc33_left_word: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc33_left_word: FAIL');process.exit(1);});
