/* 38.31 layout round 4: (1) every visible control on setup, Home, Receipts, Plan, Goals and Settings is at least 44px tall and wide, at 390
   and 320 (hidden native inputs behind a drawn control excepted); (2) at 320, opening a goal's editor does not widen the goal cards;
   (3) after borrowing, "Pay ends" marks the pay, not pay plus borrowed. Made-up numbers. Run: node tests/qc/layout_round4.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;const PAGE=process.env.BUILD||'/home/claude/work/money-map-team.html';
const small=p=>p.evaluate(()=>{const out=[];document.querySelectorAll('button,a[href],select,input:not([type=hidden]),summary,[role=button],[role=tab]').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0||(r.width<=2&&r.height<=2))return;if(r.height<43.5||r.width<43.5)out.push((e.id||e.className||e.tagName)+' "'+(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,20)+'" '+Math.round(r.width)+'x'+Math.round(r.height));});return out;});
(async()=>{
 for(const W of [390,320]){const {b,p,errs}=await R.phone({w:W,h:780,dpr:1,mobile:true});
  await p.goto('file://'+PAGE+'?sfxtest');await w(1300);
  let all=(await small(p)).map(x=>'tour: '+x);
  await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(500);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
  for(const t of ['tab-home','tab-receipts','tab-month','tab-goals']){await L.tab(p,t);await w(600);all=all.concat((await small(p)).map(x=>t+': '+x));}
  await L.settings(p);all=all.concat((await small(p)).map(x=>'settings: '+x));
  ck(`(1) ${W} wide: no control under 44px`,all.length===0,all.join(' | '));
  if(W===320){await p.evaluate(()=>{const e=document.querySelector('[data-tab="goals"]');e&&e.click();});await L.tab(p,'tab-goals');await w(600);
   const rr=()=>p.evaluate(()=>Math.round(document.querySelector('.gcard').getBoundingClientRect().right));const r0=await rr();
   await p.evaluate(()=>document.querySelectorAll('[data-gedit]')[1].click());await w(600);const r1=await rr();
   ck(`(2) 320 wide: the goal cards keep their width when an editor opens (${r0} then ${r1})`,r0===r1);}
  ck(`${W} wide: no page errors`,errs.length===0,errs.join(' | '));await b.close();}
 { const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
  await p.goto('file://'+PAGE+'?sfxtest');await w(1300);
  await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
  await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
  await L.base(p,{pay:1500,bank:200,min:0,defs:{'bill:rent':1500,'bill:food':300,envelope:0,education:0,invest:0,give:0},tT:0,tM:0,eT:5000,eS:3000,eM:0,noTrip:true});
  await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true};S.ui.sampleHidden=true;S.once={'2026-11':{draw:250}};__t.persist();__t.restructure();});
  await L.tab(p,'tab-month');await w(600);
  const r=await p.evaluate(()=>{const e=document.getElementById('endline'),bar=document.getElementById('bar').getBoundingClientRect(),x=e.getBoundingClientRect();return {hidden:e.hidden,at:(x.left-bar.left)/bar.width};});
  ck('(3) "Pay ends" sits at the pay, 1,500 of 1,800 planned ('+r.at.toFixed(3)+')',!r.hidden&&Math.abs(r.at-1500/1800)<0.02,JSON.stringify(r));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
