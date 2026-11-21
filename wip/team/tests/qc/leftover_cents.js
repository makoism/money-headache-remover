/* Cents currency: a goal top-up and its Undo are exact. Run: node tests/qc/leftover_cents.js */
let bad=0;const ck=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:385,h:800,dpr:2,mobile:true});
await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-12-03T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
await p.goto('file:///home/claude/work/money-map-team.html?sfxtest');await w(1200);
await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});await L.base(p,{pay:3000,bank:3000,min:200,defs:{'bill:rent':1000,'bill:food':500,envelope:300,education:50,invest:100,give:30},tT:2000,tM:100,eT:5000,eS:500,eM:100});
await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts=[];
 [['2026-11-03',40.25],['2026-11-09',47.25]].forEach((x,i)=>S.receipts.push({id:'rx'+i,d:x[0],a:x[1],c:'envelope',cn:'Free to spend',n:''}));__t.persist();__t.restructure();});
await L.tab(p,'tab-month');await L.tab(p,'tab-home');
const card=()=>p.evaluate(()=>{const e=document.getElementById('hNext');return e&&!e.hidden?e.innerText.replace(/\s+/g,' '):'(none)'});
const snap=()=>p.evaluate(()=>{const C=__t.calcAll(__t.S);return JSON.stringify(C.months.map(m=>[m.ym,m.bankEnd,Object.values(m.bal).map(x=>x)]))});
const s0=await snap();const planBefore=await p.evaluate(()=>JSON.stringify([__t.S.once,__t.S.steps,__t.S.plan.lines.map(l=>l.def)]));
const c0=await card();ck('card shows the exact cents: $212.50',/\$212\.50 of Free to spend isn't logged/.test(c0)&&/Keep \$212\.50 in the bank/.test(c0));
await p.evaluate(()=>document.querySelector('[data-sweep]').click());await w(600);
ck('goal move keeps the saved plan untouched (no rounding)',await p.evaluate(()=>JSON.stringify([__t.S.once,__t.S.steps,__t.S.plan.lines.map(l=>l.def)]))===planBefore);
const bk=await p.evaluate(()=>{const C=__t.calcAll(__t.S);const m=C.byYm['2026-11'];return [m.bankEnd,m.g.trip1.actual+m.g.trip1.up,m.topup&&m.topup.used]});
ck('the bank is unchanged and the goal rose by exactly $212.50',bk[2]===212.5&&Math.abs(bk[1]-(100+212.5))<0.001);
await p.evaluate(()=>document.querySelector('[data-sweepundo]').click());await w(500);
ck('Undo puts every figure back to the cent',await snap()===s0);
for(let i=0;i<3;i++){await p.evaluate(()=>document.querySelector('[data-sweep]').click());await w(400);await p.evaluate(()=>document.querySelector('[data-sweepundo]').click());await w(400);}
ck('and again after several top-up and undo rounds',await snap()===s0);
ck('no page errors',errs.length===0);await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
