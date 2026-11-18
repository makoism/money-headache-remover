/* Decision 1 (Mako, 2026-11-18): a plan box keeps typed cents, except in yen, which rounds to whole yen. The box shows what was kept,
   the bank moves by exactly that amount, and a reload keeps it. Made-up numbers only. Run: node tests/qc/cents_plan.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 for(const [cur,typed,want,shown] of [['$','3000.75',3000.75,'$3,000.75'],['€','1999.5',1999.5,'€1,999.50'],['¥','250000.6',250001,'¥250,001']]){
  const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true,keep:true});
  await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-12-03T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
  await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1200);
  await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
  await L.zero(p);await p.evaluate(c=>{__t.S.ui.cur=c;},cur);
  const big=cur==='¥'?100:1;
  await L.base(p,{pay:3000*big,bank:3000*big,min:200*big,defs:{'bill:rent':1000*big,'bill:food':500*big,envelope:300*big,education:50*big,invest:100*big,give:30*big},tT:2000*big,tM:100*big,eT:5000*big,eS:500*big,eM:100*big});
  await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();});
  await L.tab(p,'tab-month');await p.evaluate(()=>{const e=document.getElementById('monthSel');e.value='2026-12';e.dispatchEvent(new Event('change',{bubbles:true}));});await w(500);
  const b0=await p.evaluate(()=>__t.calcAll(__t.S).byYm['2026-12'].bankEnd);
  await p.focus('#h-a');await w(200);await p.evaluate(v=>{const e=document.getElementById('h-a');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},typed);await w(300);await p.keyboard.press('Tab');await w(600);
  const got=await p.evaluate(()=>{return __t.calcAll(__t.S).byYm['2026-12'].a;});
  ck(`[${cur}] typing ${typed} keeps ${want}`,got===want,'stored '+got);
  const box=await p.evaluate(()=>document.getElementById('h-a').value);
  ck(`[${cur}] the box shows ${shown}`,box===shown,'box '+box);
  const b1=await p.evaluate(()=>__t.calcAll(__t.S).byYm['2026-12'].bankEnd);
  ck(`[${cur}] the bank moves by exactly ${want-3000*big}`,Math.round((b1-b0)*100)===Math.round((want-3000*big)*100),`${b0} -> ${b1}`);
  /* wait for the page's own save, then for the reload to settle (as leftover_reload.js does), never a fixed sleep */
  await p.waitForFunction(()=>{try{return JSON.parse(localStorage.getItem('money-map-template-v2')).rev===__t.S.rev;}catch(e){return false;}},{timeout:20000}).catch(()=>{});
  await p.reload();   /* wait until the saved copy is loaded (only it has cleared: true; a fresh page does not), never a fixed sleep */
  await p.waitForFunction(()=>window.__t&&__t.S&&__t.S.ui&&__t.S.ui.cleared===true,{timeout:20000,polling:100}).catch(()=>{});await w(300);
  const after=await p.evaluate(()=>{return __t.calcAll(__t.S).byYm['2026-12'].a;});
  ck(`[${cur}] a reload keeps ${want}`,after===want,'after reload '+after);
  ck(`[${cur}] no page errors`,errs.length===0,errs.join(' | '));
  await b.close();
 }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
