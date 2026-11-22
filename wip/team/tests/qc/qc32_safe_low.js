/* QC round 12 money accuracy blocker 1: with 100 in the bank Home said Free to spend was "planned, not safe to spend yet", and the card under
   it said "365 planned, 165 safe to spend"; with 500 in the bank it said "365 left, not safe to spend yet" (0 safe). Safe to spend went up
   as the bank went down. When the bank does not cover the bills and Free to spend, no part is called safe, whatever the minimum holds back.
   Made-up numbers. Run: node tests/qc/qc32_safe_low.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function home(bank){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:3000,bank:1000,min:300,defs:{'bill:rent':1000,'bill:food':400,envelope:365,education:0,invest:1235,give:0},eT:200000,eS:0,eM:0,noTrip:true});
 await p.evaluate(bank=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;delete S.cfg.bankNow;S.cfg.bankAt='2026-11-20';S.cfg.bankStart=bank;__t.persist();__t.restructure();},bank);
 await L.tab(p,'tab-month');await L.tab(p,'tab-home');await w(700);
 const t=await p.evaluate(()=>document.body.innerText.replace(/⁠/g,''));
 const safe=(t.match(/¥([\d,]+) safe to spend/)||[])[1];
 await b.close();return {t,safe:safe?+safe.replace(/,/g,''):0,errs};}
(async()=>{
 const lo=await home(100), hi=await home(500);
 ck('bank 500: Free to spend is not safe yet (0 safe)',/not safe to spend yet/.test(hi.t)&&hi.safe===0,'safe '+hi.safe);
 ck('bank 100: no part of Free to spend is called safe ("165 safe to spend" gone)',lo.safe===0,'safe '+lo.safe);
 ck('bank 100: it says not safe to spend yet',/not safe to spend yet/.test(lo.t));
 ck('safe to spend never goes up when the bank goes down',lo.safe<=hi.safe,lo.safe+' vs '+hi.safe);
 ck('no page errors',lo.errs.concat(hi.errs).length===0,lo.errs.concat(hi.errs).join(' | '));
 console.log(bad?'qc32_safe_low: '+bad+' FAIL':'qc32_safe_low: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc32_safe_low: FAIL');process.exit(1);});
