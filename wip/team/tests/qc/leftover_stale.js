/* A goal top-up stops counting once the plan changes; zero receipts still ask. Run: node tests/qc/leftover_stale.js */
let bad=0;const ck=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:385,h:800,dpr:2,mobile:true});
await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-12-03T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
await p.goto('file:///home/claude/work/money-map-team.html?sfxtest');await w(1200);
await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
await L.zero(p);await L.base(p);
await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts=[];
 [['2026-11-03',3000],['2026-11-09',2500],['2026-11-15',2000],['2026-11-21',2500]].forEach((x,i)=>S.receipts.push({id:'rx'+i,d:x[0],a:x[1],c:'envelope',cn:'Free to spend',n:''}));__t.persist();__t.restructure();});
await L.tab(p,'tab-month');await L.tab(p,'tab-home');
const card=()=>p.evaluate(()=>{const e=document.getElementById('hNext');return e&&!e.hidden?e.innerText.replace(/\s+/g,' '):'(none)'});
const bank=()=>p.evaluate(()=>{const C=__t.calcAll(__t.S);return JSON.stringify(C.months.slice(0,3).map(m=>[m.ym,m.bankEnd,m.jar.play]))});
const tot=()=>p.evaluate(()=>{const C=__t.calcAll(__t.S);const m=C.byYm['2026-12'];return Math.round(m.bankEnd+Object.values(m.bal).reduce((a,b)=>a+b,0))});
const b0=JSON.parse(await bank()),t0=await tot();
ck('question is open',/isn't logged as spent/.test(await card()));
const mq=()=>p.evaluate(()=>{const m=__t.calcAll(__t.S).byYm['2026-11'];return JSON.stringify([m.jar.play,m.left,m.pool.left,m.pool.out])});const m0=await mq();
const planBefore=await p.evaluate(()=>JSON.stringify([__t.S.once,__t.S.steps,__t.S.plan.lines.map(l=>l.def),__t.S.plan.goals.map(g=>g.monthly)]));
await p.evaluate(()=>document.querySelector('[data-sweep]').click());await w(600);
ck('goal move is shown',/put toward/.test(await card()));
ck('a top-up never rewrites the saved plan',await p.evaluate(()=>JSON.stringify([__t.S.once,__t.S.steps,__t.S.plan.lines.map(l=>l.def),__t.S.plan.goals.map(g=>g.monthly)]))===planBefore);
ck('planned, Left and Money out for the month are unchanged by the answer',await mq()===m0);
const tUp=await tot();ck('the goal got money and the total rose by exactly the moved amount',tUp-t0===30000);
/* a later plan edit changes only that edit; the top-up stays an answer and Undo is still there */
await p.evaluate(()=>{const S=__t.S;S.once['2026-11']=Object.assign({},S.once['2026-11'],{envelope:45000});__t.persist();__t.restructure();});await w(400);
ck('after a plan edit the top-up is still shown with Undo',/put toward/.test(await card())&&await p.evaluate(()=>!!document.querySelector('[data-sweepundo]')));
await p.evaluate(()=>document.querySelector('[data-sweepundo]').click());await w(500);
ck('Undo removes only the top-up: the edit stays and the question is back',await p.evaluate(()=>(__t.S.once['2026-11']||{}).envelope)===45000&&/isn't logged as spent/.test(await card()));
ck('and every figure is the plain unanswered one (no money lost)',await tot()===await p.evaluate(()=>{const S=__t.S;const C=__t.calcAll(S);const m=C.byYm['2026-12'];return Math.round(m.bankEnd+Object.values(m.bal).reduce((a,b)=>a+b,0))}));
await p.evaluate(()=>{const S=__t.S;delete S.once['2026-11'].envelope;__t.persist();__t.restructure();});await w(300);
/* no receipts ever: no question yet (S1, gate 38.30: the person has not started logging). One receipt in another month: November is asked
   even with none of its own, with the few-receipts line (decision 3, Mako 2026-11-18) */
await p.evaluate(()=>{const S=__t.S;S.ui.sweep={};S.once={};S.receipts=[];__t.persist();__t.restructure();});await w(400);
const c3=await card();ck('with no receipts at all there is no month-end question yet (S1)',!/isn't logged as spent/.test(c3));
await p.evaluate(()=>{const S=__t.S;S.receipts=[{id:'rdec',d:'2026-12-02',a:500,c:'envelope',cn:'Free to spend',n:''}];__t.persist();__t.restructure();});await w(400);
const c4=await card();ck('after the first receipt, a November with none of its own is asked, saying so (decision 3)',/Nov: .* isn't logged as spent/.test(c4)&&/No receipts are logged, so this may be spending you haven't logged yet/.test(c4));
ck('no page errors',errs.length===0);await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
