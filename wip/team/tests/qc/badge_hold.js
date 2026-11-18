/* 38.31 north-star round 3: a badge never pops up while the month is short or below zero (it waits in the list), and a tap puts any message
   away at once so it never sits over words. Made-up numbers. Run: node tests/qc/badge_hold.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function open(short){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:3000,bank:short?0:5000,min:0,defs:{'bill:rent':short?3500:1000,'bill:food':300,envelope:200,education:0,invest:0,give:0},tT:0,tM:0,eT:0,eS:0,eM:0,noTrip:true});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true};S.ui.sampleHidden=true;S.ui.bd={};__t.persist();__t.restructure();});await L.tab(p,'tab-home');await w(600);
 /* forget every badge, so the next check finds them fresh */
 const seen=[];await p.exposeFunction('__seen',t=>seen.push(t));
 await p.evaluate(()=>{const el=document.getElementById('cheer');new MutationObserver(()=>{if(el.textContent)__seen(el.textContent);}).observe(el,{childList:true,characterData:true,subtree:true});const S=__t.S;S.ui.bd={x:true};__t.persist();__t.restructure();});
 await w(2500);return {b,p,errs,seen};}
(async()=>{
 { const {b,p,errs,seen}=await open(true);
  const st=await p.evaluate(()=>{const m=__t.calcAll(__t.S).byYm['2026-11'];return m.bankEnd;});
  ck('(short month, bank '+st+') no badge message pops up',st<0&&!seen.some(t=>/badge/i.test(t)),JSON.stringify(seen));
  ck('the badges are still earned and kept',await p.evaluate(()=>Object.keys(__t.S.ui.bd||{}).length>1));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 { const {b,p,errs,seen}=await open(false);
  ck('(month on plan) the badge message shows',seen.some(t=>/badge/i.test(t)),JSON.stringify(seen));
  await p.evaluate(()=>{const e=document.getElementById('cheer');e.textContent='Test message';e.classList.add('on');});await w(300);
  await w(700);const btn=await p.evaluate(()=>{const e=document.getElementById('cheer'),r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,u=document.elementFromPoint(x,y);return [x,y,u===e];});
  ck('the message never takes a tap meant for what is under it',btn[2]===false);
  await p.mouse.click(btn[0],btn[1]);await w(200);
  ck('a tap anywhere puts the message away at once',await p.evaluate(()=>!document.getElementById('cheer').classList.contains('on')));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
