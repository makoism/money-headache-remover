/* QC round 13 regression 2 (home_dom 120 1322, plan 85): when the bank does not cover the month, no part of Free to spend is safe (QC round 12
   numbers gate B1), but the Free to spend sheet on Home still said "a week to stay inside the safe part" and "X of it is safe to spend", from the
   minimum-balance hold. It follows the map row: not safe to spend yet, and no safe part. Made-up numbers.
   (Set-up copied from qc33_left_word.js: QC round 13 numbers gate B1: with part of Free to spend held back for the minimum, the Home tile and the band on Plan and Receipts said
   "¥17,000 planned, ¥16,500 safe to spend" while the card said "Planned ¥20,000". 17,000 is what is left of the plan (20,000 less 3,000 spent),
   so it is called left, never planned. Made-up numbers. Run: node tests/qc/qc33_sheet_notsafe.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:199000,bank:50000,min:49500,defs:{'bill:rent':90000,'bill:food':40000,envelope:20000,education:20000,invest:20000,give:10000},eT:400000,eS:50000,eM:0,noTrip:true});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;delete S.cfg.bankNow;S.cfg.bankAt='2026-11-20';__t.persist();__t.restructure();});
 await L.rc(p,3000,'envelope','2026-11-07');
 const st=await p.evaluate(()=>{const C=calcAll(__t.S),V=viewOf(__t.S,C,'2026-11','2026-11-20'),r=V.map.month.find(x=>x.id==='play');return {held:r.held,nc:r.notCovered,foHeld:freeOf(__t.S,V.month,V.play).held,planLeft:r.planLeft,amount:r.amount,bankEnd:C.byYm['2026-11'].bankEnd};});
 console.log('state',JSON.stringify(st));
 ck('the case: the bank does not cover the month, and the minimum would hold part back',st.held===0&&st.nc===true&&st.foHeld>0,JSON.stringify(st));
 await L.tab(p,'tab-home');await w(700);
 const sp=await p.evaluate(()=>{const e=document.getElementById('hSpend');return e?e.innerText.replace(/\u2060/g,'').replace(/\s+/g,' '):'';});
 ck('Home says Free to spend is not safe to spend yet',/not safe to spend yet/.test(await p.evaluate(()=>document.body.innerText)),'');
 ck('the Free to spend sheet never speaks of a safe part',!/the safe part/.test(sp),sp.slice(0,300));
 ck('the Free to spend sheet never says some of it is safe to spend',!/of it is safe to spend/.test(sp),sp.slice(0,300));
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'qc33_sheet_notsafe: '+bad+' FAIL':'qc33_sheet_notsafe: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc33_sheet_notsafe: FAIL');process.exit(1);});
