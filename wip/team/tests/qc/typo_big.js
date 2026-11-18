/* Data safety (38.31 QC round): typing digits onto an amount that is already there must never save the largest amount (1,000,000,000).
   The box refuses, says so, and puts back the amount from before this typing. A Settings money box and a Plan box. Made-up numbers.
   Run: node tests/qc/typo_big.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:3000,bank:2500,min:200});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();});
 const append=async(sel,digits)=>{await p.focus(sel);await w(200);await p.keyboard.press('End');for(const c of digits){await p.keyboard.type(c);await w(40);}await p.keyboard.press('Tab');await w(700);};
 /* Settings: the bank balance box */
 await L.settings(p);
 await append('#st-bankStart','250000000');
 const bank=await p.evaluate(()=>__t.S.cfg.bankStart),box=await p.evaluate(()=>document.getElementById('st-bankStart').value);
 ck(`Settings: the bank balance stays 2,500 (saved ${bank}, box "${box}")`,bank===2500);
 ck('it says the amount was too large and the old amount stays',await p.evaluate(()=>/old amount stays/.test((document.getElementById('cheer')||{}).textContent||'')));
 await p.keyboard.press('Escape');await w(300);
 /* Plan: the salary box */
 await L.tab(p,'tab-month');
 await append('#h-a','250000000');
 const pay=await p.evaluate(()=>{const C=__t.calcAll(__t.S);return C.months.map(m=>m.a);});
 ck(`Plan: no month's pay became 1,000,000,000 and none changed (${[...new Set(pay)].join(', ')})`,pay.every(x=>x===3000));
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
