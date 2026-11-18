/* An answer survives a reload and never wipes saved data. Run: node tests/qc/leftover_reload.js */
let bad=0;const ck=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:385,h:800,dpr:2,mobile:true,keep:true});
await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-12-03T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
await p.goto('file:///home/claude/work/money-map-team.html?sfxtest');await w(1200);
await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
await L.zero(p);await L.base(p);

await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.ui.toured=true;S.receipts=[];
 [['2026-11-03',3000],['2026-11-09',2500],['2026-11-15',2000],['2026-11-21',2500]].forEach((x,i)=>S.receipts.push({id:'rx'+i,d:x[0],a:x[1],c:'envelope',cn:'Free to spend',n:''}));__t.persist();__t.restructure();});
await L.tab(p,'tab-month');await L.tab(p,'tab-home');
const card=()=>p.evaluate(()=>{const e=document.getElementById('hNext');return e&&!e.hidden?e.innerText.replace(/\s+/g,' '):'(none)'});
const reload=async()=>{await w(1500);await p.reload();await w(1500);await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(300);};
const keep=()=>p.evaluate(()=>({rc:(__t.S.receipts||[]).length,sample:!!(document.body.innerText.match(/Sample numbers/)),sweep:JSON.stringify(__t.S.ui.sweep||{}),err:(window.__errs||[]).length}));
/* goal answer, then reload: nothing is lost, the answer stays, Undo is still offered */
await p.evaluate(()=>document.querySelector('[data-sweep]').click());await w(500);
await reload();let k=await keep();
ck('after a goal answer and a reload the receipts are all still there',k.rc===4);
ck('and the answer is kept',/"2026-11"/.test(k.sweep)&&/"id"/.test(k.sweep));
ck('and the app did not fall back to sample numbers',!k.sample);
ck('and Undo is still offered after the reload',/put toward/.test(await card()));
await p.evaluate(()=>document.querySelector('[data-sweepundo]').click());await w(400);
await p.evaluate(()=>document.querySelector('[data-sweepbank]').click());await w(500);
await reload();k=await keep();
ck('after Count in the bank and a reload everything is still there',k.rc===4&&/"to":"bank"/.test(k.sweep)&&!k.sample);
await p.evaluate(()=>document.querySelector('[data-sweepundo]')&&document.querySelector('[data-sweepundo]').click());await w(400);
await p.evaluate(()=>{const b=document.querySelector('[data-sweephide]');b&&b.click();});await w(500);
await reload();k=await keep();ck('after Decide later and a reload everything is still there',k.rc===4&&!k.sample);
ck('no page errors',errs.length===0);await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
