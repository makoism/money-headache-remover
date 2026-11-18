/* 38.31 QC round 4: (1) All months gives a month the same verdict as its own Plan view: pay with no place reads "Not placed yet", never
   "On plan"; (2) on a phone there is one small round Help button (Ask is in its menu), so less of the page sits under it.
   Made-up numbers. Run: node tests/qc/round4.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 { const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
  await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
  await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
  await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
  await L.base(p,{pay:3000,bank:1200,min:0,defs:{'bill:rent':1100,'bill:food':400,envelope:300,education:0,invest:0,give:0},tT:0,tM:0,eT:0,eS:0,eM:0,noTrip:true});
  await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();});
  await L.tab(p,'tab-month');await w(500);
  const chip=await p.evaluate(()=>document.getElementById('chip')?document.getElementById('chip').innerText:'');
  await p.evaluate(()=>{const e=document.querySelector('[data-sub="all"],#sub-all,[data-view="all"]');e&&e.click();});await w(600);
  const row=await p.evaluate(()=>{const r=document.querySelector('#monthTable tr[data-ym="2026-11"]');return r?r.innerText.replace(/\s+/g,' '):'';});
  ck('(1) Nov in All months says "Not placed yet", like the month itself ("'+chip.trim()+'")',/Not placed yet/.test(row)&&!/On plan/.test(row)&&/Not placed yet/.test(chip),row);
  const ask=await p.evaluate(()=>{const a=document.getElementById('askBtn'),h=document.getElementById('helpBtn').getBoundingClientRect();return [getComputedStyle(a).display,Math.round(h.width),Math.round(h.height),!!document.getElementById('helpAsk')];});
  ck('(2) on a 390 phone the Ask pill is folded into Help, a 44px round button',ask[0]==='none'&&ask[1]<=48&&ask[2]>=44&&ask[3],JSON.stringify(ask));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 { const {b,p,errs}=await R.phone({w:1300,h:900,dpr:1});
  await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
  await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);
  ck('(2) on a desktop both Ask and Help stay',await p.evaluate(()=>getComputedStyle(document.getElementById('askBtn')).display!=='none'));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
