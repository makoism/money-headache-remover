/* QC round 14 novice blocker 1: with the typed bank less than the bills still to pay, Home warned "Your bank is less than your bills still
   to pay and Free to spend". After Free to spend was overspent the warning went away, though the bills were still not covered.
   The bank card keeps saying the bank does not cover the bills. Made-up numbers. Run: node tests/qc/qc34_bills_short.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:300000,bank:50000,min:30000,defs:{'bill:rent':90000,'bill:food':40000,envelope:38800,education:0,invest:0,give:0},eT:390000,eS:20000,eM:131200,noTrip:true});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;delete S.cfg.bankNow;S.cfg.bankAt='2026-11-20';__t.persist();__t.restructure();});
 const homeTxt=async()=>{await L.tab(p,'tab-month');await w(400);await L.tab(p,'tab-home');await w(600);return p.evaluate(()=>document.body.innerText.replace(/⁠/g,''));};
 const before=await homeTxt();
 ck('before: Home says the bank is less than the bills still to pay',/less than your bills still to pay/.test(before));
 await L.rc(p,50000,'envelope','2026-11-10');
 const after=await homeTxt();
 ck('after overspending Free to spend: Home says Free to spend is over',/over/i.test(after));
 ck('after: Home still says the bank is less than the bills still to pay',/less than your bills still to pay/.test(after),(after.match(/In your bank.{0,200}/s)||[''])[0].replace(/\s+/g,' '));
 ck('after: it does not call Free to spend planned, not safe to spend yet (none is left)',!/so Free to spend is planned, not safe to spend yet/.test(after));
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'qc34_bills_short: '+bad+' FAIL':'qc34_bills_short: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc34_bills_short: FAIL');process.exit(1);});
