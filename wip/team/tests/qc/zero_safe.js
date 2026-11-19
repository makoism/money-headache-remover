/* Data safety (38.31 QC round 4): Set all to zero and Reset month keep a copy for 3 days, offered after a reload; a double tap never confirms
   Set all to zero, and its warning names the balance. Made-up numbers. Run: node tests/qc/zero_safe.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true,keep:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});await L.base(p,{pay:3000,bank:2500,min:200,eT:5000,eS:800,eM:100});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.ui.toured=true;__t.persist();__t.restructure();});await L.tab(p,'tab-month');await L.tab(p,'tab-home');await w(800);
 const snap=()=>p.evaluate(()=>JSON.stringify([__t.S.plan.goals.map(g=>[g.id,g.start]),__t.S.plan.lines.map(l=>l.id),__t.S.steps,__t.S.cfg.bankStart]));
 const before=await snap();
 const bar=()=>p.evaluate(()=>{const e=document.getElementById('undoBar');return e&&!e.hidden?document.getElementById('undoTxt').textContent:'(none)';});
 const reload=async()=>{await w(1500);await p.reload();await p.waitForFunction(()=>window.__t&&__t.S&&__t.S.ui&&__t.S.ui.cleared===true,{timeout:15000}).catch(()=>{});await w(1500);};
 await L.settings(p);
 /* 1. a double tap 120 ms apart does nothing */
 const t0=await p.evaluate(async()=>{const b=document.getElementById('blankBtn');b.click();const t=b.textContent;await new Promise(r=>setTimeout(r,120));b.click();return t;});await w(500);
 ck(`the warning names the balance and the 3-day undo ("${t0}")`,/your balance\. Receipts stay\. You can undo for 3 days/.test(t0),t0);
 ck('a double tap does not zero the plan',await snap()===before,await snap());
 /* 2. two deliberate taps zero it; the copy survives a reload */
 await w(4500);await p.evaluate(()=>document.getElementById('blankBtn').click());await w(900);await p.evaluate(()=>document.getElementById('blankBtn').click());await w(900);
 ck('two deliberate taps zero the plan',await p.evaluate(()=>__t.S.cfg.bankStart===0||__t.S.cfg.bankStart===undefined));
 await reload();
 ck(`after a reload Undo is still offered ("${await bar()}")`,/set to zero/.test(await bar()));
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(800);
 ck('Undo brings every number back',await snap()===before,await snap());
 /* 3. Reset month */
 await p.evaluate(()=>{const S=__t.S;S.once['2026-11']={a:3500};__t.persist();__t.restructure();});await w(400);
 const mid=await snap();
 await L.tab(p,'tab-month');await w(500);
 const t3=await p.evaluate(()=>{const b=document.getElementById('resetMonth');if(!b)return '(no button)';b.click();return b.textContent;});
 ck(`Reset month says Undo lasts 3 days ("${t3}")`,/You can undo for 3 days/.test(t3),t3);
 await p.evaluate(()=>document.getElementById('resetMonth').click());await w(800);
 await reload();
 ck(`after a reload Undo of the reset is offered ("${await bar()}")`,/was reset/.test(await bar()));
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(800);
 ck('Undo brings the month back',await snap()===mid,await snap());
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
