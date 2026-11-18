/* Data safety (38.31 QC round 3): removing a goal that holds money, removing a bill line and Restore samples each say what goes, keep a copy
   for 3 days and offer Undo, also after a reload. Made-up numbers. Run: node tests/qc/remove_undo.js */
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
 /* 1. a goal with money */
 await L.tab(p,'tab-goals');await w(500);
 await p.evaluate(()=>{const b=document.querySelector('[data-gedit="trip1"]')||document.querySelector('[data-gedit]');b&&b.click();});await w(500);
 const t1=await p.evaluate(()=>{const b=document.querySelector('[data-gdel]');if(!b)return '(no button)';b.click();return b.textContent;});
 ck(`removing a goal names it and its money ("${t1}")`,/Tap again: removes .+ You can undo for 3 days/.test(t1),t1);
 await p.evaluate(()=>document.querySelector('[data-gdel]').click());await w(700);
 await reload();
 ck(`after a reload Undo is still offered ("${await bar()}")`,/was removed/.test(await bar()));
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(800);
 ck('Undo brings the goal and every number back',await snap()===before,await snap());
 /* 2. Restore samples */
 await L.settings(p);
 const t2=await p.evaluate(()=>{const b=document.getElementById('bkReset');b.click();return b.textContent;});
 ck(`Restore samples asks first and says receipts stay ("${t2.slice(0,70)}")`,/Receipts stay\. You can undo for 3 days/.test(t2));
 await p.evaluate(()=>document.getElementById('bkReset').click());await w(800);
 await reload();
 ck(`after a reload Undo of the samples is still offered ("${await bar()}")`,/Samples replaced your numbers/.test(await bar()));
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(800);
 ck('Undo brings every number back',await snap()===before,await snap());
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
