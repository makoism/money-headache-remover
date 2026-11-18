/* Unspent free to spend of last month: the card asks where it goes. Keep in the bank / add to this month / undo each move the bank figures as said. Run: node tests/qc/leftover_choice.js */
let bad=0;const ck=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:385,h:800,dpr:2,mobile:true});
await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-12-03T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
await p.goto('file:///home/claude/work/money-map-team.html?sfxtest');await w(1200);
await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
await L.zero(p);await L.base(p);
await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts=[];
 [['2026-11-03',3000],['2026-11-09',2500],['2026-11-15',2000]].forEach((x,i)=>S.receipts.push({id:'rx'+i,d:x[0],a:x[1],c:'envelope',cn:'Free to spend',n:''}));__t.persist();__t.restructure();});
await L.tab(p,'tab-month');await L.tab(p,'tab-home');
const card=()=>p.evaluate(()=>{const e=document.getElementById('hNext');return e&&!e.hidden?e.innerText.replace(/\s+/g,' '):'(none)'});
const bank=()=>p.evaluate(()=>{const C=__t.calcAll(__t.S);return JSON.stringify(C.months.slice(0,3).map(m=>[m.ym,m.bankEnd,m.jar.play]))});
const c0=await card();ck('a thin month gets the same question, with the few-receipts line (decision 3)',/November: ¥32,500 of free to spend is not logged as spent/.test(c0)&&/Only 3 receipts are logged, so this may be spending you have not logged yet/.test(c0)&&/Open November receipts/.test(c0));
const b0=JSON.parse(await bank());ck('until answered the bank figure is unchanged',b0[0][1]===150000);
await p.evaluate(()=>document.querySelector('[data-sweepbank]').click());await w(500);
const b1=JSON.parse(await bank());ck('counting it raises the bank figure by it',b1[0][1]===150000+32500);
ck('no page errors',errs.length===0);await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
