/* QC round 11 north-star B2: Home said "You are okay ... $320 is free to spend" with "Coming up: Dec ends below zero, Jan ends below zero"
   under it. When a month in the next three ends below zero, Home's status is not "You are okay": it names that month and says money
   spent now leaves less for it. A plan with nothing ahead still says "You are okay". Made-up numbers. Run: node tests/qc/qc31_okay_ahead.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function open(setup){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:300000,bank:400000,min:0,defs:{'bill:rent':100000,'bill:food':40000,envelope:30000,education:0,invest:0,give:0},eT:2000000,eS:0,eM:10000,noTrip:true});
 await p.evaluate(setup);await w(300);await L.tab(p,'tab-month');await L.tab(p,'tab-home');await w(600);
 const st=await p.evaluate(()=>{const e=document.getElementById('hStatus');return e&&!e.hidden?e.innerText.replace(/⁠/g,'').replace(/\n+/g,' / '):'';});
 await b.close();return {st,errs};}
(async()=>{
 const a=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.items['2026-12']=[{id:'c1',label:'Car repair',amount:900000}];__t.persist();__t.restructure();});
 ck('Dec ends below zero shows under Coming up',/Coming up: Dec ends below zero/.test(a.st),a.st);
 ck('the status is not "You are okay" next to it',!/You are okay/.test(a.st),a.st);
 ck('the status names Dec ending below zero',/^\s*Dec ends below zero/.test(a.st),a.st);
 ck('it says money spent now leaves less for Dec',/leaves less for Dec/.test(a.st),a.st);
 const f=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();});
 ck('a plan with nothing ahead still says "You are okay"',/You are okay/.test(f.st)&&/next 3 months look fine/.test(f.st),f.st);
 ck('no page errors',a.errs.concat(f.errs).length===0,a.errs.concat(f.errs).join(' | '));
 console.log(bad?'qc31_okay_ahead: '+bad+' FAIL':'qc31_okay_ahead: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc31_okay_ahead: FAIL');process.exit(1);});
