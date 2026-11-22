/* QC round 11 money accuracy 2: Home said "Bills went past the plan. Utilities is $80 over. ... Free to spend is $110.25 over. Education
   is $45 over." Free to spend and Education are not bills. When places other than bills went past the plan too, the line starts
   "Spending went past the plan."; when only bills did, it still says "Bills went past the plan." Made-up numbers.
   Run: node tests/qc/qc31_spend_past.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function open(setup){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:300000,bank:900000,min:0,defs:{'bill:rent':100000,'bill:food':40000,envelope:30000,education:20000,invest:0,give:0},eT:2000000,eS:0,eM:10000,noTrip:true});
 await p.evaluate(setup);await w(300);await L.tab(p,'tab-month');await L.tab(p,'tab-home');await w(600);
 const st=await p.evaluate(()=>{const e=document.getElementById('hStatus');return e&&!e.hidden?e.innerText.replace(/⁠/g,'').replace(/\n+/g,' / '):'';});
 await b.close();return {st,errs};}
(async()=>{
 const rc=(id,a,c,cn)=>({id,d:'2026-11-10',a,c,cn,n:''});
 const a=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts=[{id:'r1',d:'2026-11-10',a:150000,c:'bill:food',cn:'Food',n:''},{id:'r2',d:'2026-11-10',a:25000,c:'education',cn:'Education',n:''}];__t.persist();__t.restructure();});
 ck('Food and Education both named as over',/Food.* is ¥[\d,]+ over/.test(a.st)&&/Education is ¥5,000 over/.test(a.st),a.st);
 ck('the line does not call Education a bill ("Bills went past the plan")',!/Bills went past the plan/.test(a.st),a.st);
 ck('it says "Spending went past the plan"',/Spending went past the plan/.test(a.st),a.st);
 const b=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts=[{id:'r1',d:'2026-11-10',a:150000,c:'bill:food',cn:'Food',n:''}];__t.persist();__t.restructure();});
 ck('only a bill over: still "Bills went past the plan"',/Bills went past the plan/.test(b.st),b.st);
 ck('no page errors',a.errs.concat(b.errs).length===0,a.errs.concat(b.errs).join(' | '));
 console.log(bad?'qc31_spend_past: '+bad+' FAIL':'qc31_spend_past: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc31_spend_past: FAIL');process.exit(1);});
