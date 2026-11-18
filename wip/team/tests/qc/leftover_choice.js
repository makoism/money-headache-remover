/* Unspent free to spend of last month: the card asks where it goes. Keep in the bank / add to this month / undo each move the bank figures as said. Run: node tests/qc/leftover_choice.js */
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
const c0=await card();ck('card asks about November',/November: ¥30,000 of free to spend is not logged as spent/.test(c0)&&/Count ¥30,000 in the bank/.test(c0)&&/put it toward/i.test(c0));ck('no card error',!(await p.evaluate(()=>window.__errs&&window.__errs.length)));const b0=JSON.parse(await bank());ck('before any answer the bank figure is unchanged',b0[0][1]===150000);
await p.evaluate(()=>document.querySelector('[data-sweepbank]').click());await w(500);
ck('counting it says so',/¥30,000 counted in the bank/.test(await card()));const bC=JSON.parse(await bank());ck('the bank figure rises by it only after the answer',bC[0][1]===b0[0][1]+30000&&bC[1][1]===b0[1][1]+30000);const b1=JSON.parse(await bank());
await p.evaluate(()=>document.querySelector('[data-sweepundo]').click());await w(500);
ck('undo brings the question back',/is not logged as spent/.test(await card()));ck('undo restores the bank',JSON.stringify(JSON.parse(await bank()))===JSON.stringify(b0));
/* a later plan edit survives Undo */
await p.evaluate(()=>document.querySelector('[data-sweepbank]').click());await w(400);
await p.evaluate(()=>{const S=__t.S;S.once['2026-12']=Object.assign({},S.once['2026-12'],{envelope:25000});__t.persist();__t.restructure();});await w(300);
await p.evaluate(()=>document.querySelector('[data-sweepundo]').click());await w(500);
ck('undo keeps a later edit to December',await p.evaluate(()=>(__t.S.once['2026-12']||{}).envelope)===25000);
ck('and November is back to unchanged (undone)',JSON.parse(await bank())[0][1]===b0[0][1]);
/* goal: moves up to the room, the rest stays in the bank, undo puts back only that */
await p.evaluate(()=>{const s=document.querySelector('[data-sweep]');s.click();});await w(600);
const c4=await card();ck('goal move says it was put toward the goal',/put toward/.test(c4));
const b4=JSON.parse(await bank());ck('a goal move keeps the bank figure whole: the moved money is goal money, nothing vanishes',b4[0][1]===b0[0][1]);
await p.evaluate(()=>document.querySelector('[data-sweepundo]').click());await w(500);
ck('undo of the goal move keeps the December edit',await p.evaluate(()=>(__t.S.once['2026-12']||{}).envelope)===25000);
ck('and brings the bank back to unchanged',JSON.parse(await bank())[0][1]===b0[0][1]);
ck('no page errors',errs.length===0);await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
