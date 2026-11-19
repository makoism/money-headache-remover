/* 38.31 number gate round 4: (1) All months' "Not placed" is the Month card's figure, also after spending past plan used some of it;
   (2) the Forecast chart follows the longer emergency target, like the table beside it; (3) in a short month the fix amount, Home's safe to
   spend and the warning name one figure. Made-up numbers. Run: node tests/qc/numbers_round4.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function open(setup,defs){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,Object.assign({pay:300000,bank:100000,min:0,defs:{'bill:rent':80000,'bill:food':40000,envelope:19000,education:0,invest:0,give:0},tT:0,tM:0,eT:0,eS:0,eM:0,noTrip:true},defs||{}));
 await p.evaluate(setup);await w(300);return {b,p,errs};}
(async()=>{
 /* 1 */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.plan.lines.find(l=>l.key==='invest').def=300000-80000-40000-19000-20000;S.receipts=[{id:'r1',d:'2026-11-05',a:29000,c:'envelope',cn:'Free to spend',n:''}];__t.persist();__t.restructure();});
  await L.tab(p,'tab-month');await w(500);
  const card=await p.evaluate(()=>document.getElementById('verdict').innerText);
  const row=await p.evaluate(()=>{const r=document.querySelector('#monthTable tr[data-ym="2026-11"]');return r?[...r.cells].map(c=>c.innerText.trim()):[];});
  ck('(1) the Month card says ¥10,000 not placed',/¥10,000 of pay not placed yet/.test(card),card);
  ck('(1) All months shows the same ¥10,000, not the ¥20,000 before spending past plan',row[1]==='¥10,000',JSON.stringify(row));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 /* 2 */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true};S.ui.sampleHidden=true;const g=S.plan.goals.find(x=>x.emergency);g.target=100000;g.start=90000;g.stretch=720000;g.stretchOn=true;g.monthly=40000;__t.persist();__t.restructure();},{eT:100000,eS:90000,eM:40000});
  await L.tab(p,'tab-goals');await w(800);
  const r=await p.evaluate(()=>{const C=__t.calcAll(__t.S),g=__t.S.plan.goals.find(x=>x.emergency),mx=Math.max(...C.months.map(m=>m.bal[g.id]));const labels=[...document.querySelectorAll('#chartbox svg text')].map(t=>+t.textContent.replace(/[^\d]/g,'')).filter(x=>x>0);return {mx,top:Math.max(...labels,0),cap:g.stretchOn};});
  ck('(2) the chart axis reaches the fund\'s balance under the longer target (top '+r.top+', balance '+r.mx+')',r.mx>100000&&r.top>=r.mx*0.99,JSON.stringify(r));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 /* 3 */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true};S.ui.sampleHidden=true;S.cfg.minBank=17000;S.plan.lines.find(l=>l.key==='envelope').def=320000;__t.persist();__t.restructure();});
  await L.tab(p,'tab-month');await w(600);
  const fix=await p.evaluate(()=>{const f=document.querySelector('[data-fx="trim"]');return f?+f.dataset.amt:null;});
  await L.tab(p,'tab-home');await w(800);
  const h=await p.evaluate(()=>{const t=(document.querySelector('.mp-warn')||{}).innerText||'';const m=t.match(/Keep Free to spend to the ¥([\d,]+) shown/);return [m?+m[1].replace(/,/g,''):null,t];});
  ck('(3) the fix amount is Home\'s safe to spend ('+fix+' vs '+h[0]+')',fix!==null&&h[0]!==null&&Math.abs(fix-h[0])<0.005,JSON.stringify([fix,h]));
  ck('(3) the warning names that figure instead of "spend nothing more"',h[1].includes('Keep Free to spend to the')&&!/Spend nothing more|Don't spend any more/.test(h[1]),h[1]);
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
