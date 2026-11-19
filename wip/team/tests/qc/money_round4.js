/* 38.31 money accuracy round 4: (1) typing 1.234,56 in euros is never cut to 1.23 in silence: the box says why it stopped;
   (2) a bank that starts below zero is named as the cause, never "your plan is bigger than your pay" when it is not, and the
   warning says the bank figure counts Free to spend as spent. Made-up numbers. Run: node tests/qc/money_round4.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function open(cur,bank){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(c=>{__t.S.ui.cur=c;},cur);
 await L.base(p,{pay:3000,bank:0,min:0,defs:{'bill:rent':1000,'bill:food':300,envelope:385,education:0,invest:0,give:0},tT:0,tM:0,eT:0,eS:0,eM:0,noTrip:true});
 await p.evaluate(bk=>{const S=__t.S;S.cfg.bankStart=bk;S.ui.done={pay:true,bills:true,goals:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();},bank);return {b,p,errs};}
(async()=>{
 { const {b,p,errs}=await open('€',500);
  await L.settings(p);await p.focus('#st-bankStart');await p.evaluate(()=>{const e=document.getElementById('st-bankStart');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');});
  const seen=[];await p.exposeFunction('__seen',t=>seen.push(t));await p.evaluate(()=>{const el=document.getElementById('cheer');new MutationObserver(()=>{if(el.textContent)__seen(el.textContent);}).observe(el,{childList:true,characterData:true,subtree:true});});
  await p.keyboard.type('1.234',{delay:40});await w(400);
  ck('(1) the fourth digit after "1.23" is refused with a message, not dropped in silence',seen.some(t=>/Only two digits after the point/.test(t)),JSON.stringify(seen));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 { const {b,p,errs}=await open('$',-2000);
  await L.tab(p,'tab-home');await w(800);const t=await p.evaluate(()=>{const e=document.querySelector('.mp-warn');return e?e.innerText:'';});
  ck('(2) the warning names the start below zero as the cause',/It starts the month \$2,000 below zero\./.test(t),t);
  ck('(2) and never says the plan is bigger than the pay when it is not',!/bigger than your pay/.test(t),t);
  ck('(2) it says the bank figure counts Free to spend as spent',/counts your planned Free to spend as already spent/.test(t),t);
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
