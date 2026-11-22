/* Data safety (38.31 QC round): Guided setup run again from Settings over a real plan keeps a copy first. When setup closes, Undo is offered and
   brings every number back; if the page is closed part-way, Undo is offered after the reload. Made-up numbers. Run: node tests/qc/setup_undo.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true,keep:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:3000,bank:2500,min:200,eT:5000,eS:800,eM:100});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.ui.toured=true;__t.persist();});await w(900);
 const nums=()=>p.evaluate(()=>{const S=__t.S,eg=S.plan.goals.find(g=>g.emergency);return JSON.stringify([eg.start,S.steps.a,S.cfg.bankStart]);});
 const before=await nums();
 const change=()=>p.evaluate(()=>{const S=__t.S;S.plan.goals.find(g=>g.emergency).start=0;S.steps.a=[{from:'2026-11',v:2000}];__t.persist();});
 /* 1. open from Settings, change, close: Undo is offered and works */
 await L.settings(p);await p.evaluate(()=>document.getElementById('setupOpen').click());await w(700);await p.evaluate(()=>document.getElementById('setupOpen').click());await w(900);
 await change();await p.evaluate(()=>document.getElementById('tourSkip').click());await w(900);
 const bar=await p.evaluate(()=>{const e=document.getElementById('undoBar');return e&&!e.hidden?document.getElementById('undoTxt').textContent:'(none)';});
 ck(`closing setup offers Undo ("${bar}")`,/Setup changed your plan/.test(bar));
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(900);
 ck('Undo brings back the saved amount, the pay and the bank',await nums()===before,await nums());
 /* 2. open, change, then the page closes part-way: Undo after the reload */
 await L.settings(p);await p.evaluate(()=>document.getElementById('setupOpen').click());await w(700);await p.evaluate(()=>document.getElementById('setupOpen').click());await w(900);
 await change();await w(1200);
 await p.reload();await p.waitForFunction(()=>window.__t&&__t.S&&__t.S.ui&&__t.S.ui.cleared===true,{timeout:15000}).catch(()=>{});await w(1500);
 const bar2=await p.evaluate(()=>{const e=document.getElementById('undoBar');return e&&!e.hidden?document.getElementById('undoTxt').textContent:'(none)';});
 ck(`after a reload part-way, Undo is offered ("${bar2}")`,/Setup was changing your plan/.test(bar2));
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(900);
 ck('and it brings every number back',await nums()===before,await nums());
 /* round 2: one tap only arms Guided setup; a closed setup's Undo survives a reload; Restore asks first and its Undo survives a reload */
 await L.settings(p);const armed=await p.evaluate(()=>{const b=document.getElementById('setupOpen');b.click();return [b.textContent,!!document.querySelector('#tour:not([hidden])')];});
 ck(`one tap on Guided setup only asks ("${armed[0].slice(0,60)}")`,/^Tap again/.test(armed[0])&&!armed[1]);
 await w(700);await p.evaluate(()=>document.getElementById('setupOpen').click());await w(900);await change();await p.evaluate(()=>document.getElementById('tourSkip').click());await w(900);
 await w(1500);await p.reload();await p.waitForFunction(()=>window.__t&&__t.S&&__t.S.ui&&__t.S.ui.cleared===true,{timeout:15000}).catch(()=>{});await w(1500);
 const bar3=await p.evaluate(()=>{const e=document.getElementById('undoBar');return e&&!e.hidden?document.getElementById('undoTxt').textContent:'(none)';});
 ck(`after setup closed and a reload, Undo is still offered ("${bar3}")`,/Setup changed your plan/.test(bar3));
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(900);ck('and it brings every number back',await nums()===before,await nums());
 /* Restore */
 const other=await p.evaluate(()=>{const c=JSON.parse(JSON.stringify(__t.S));c.cfg.bankStart=500000;c.receipts=[];delete c.ui.keep;return JSON.stringify(c);});
 await L.settings(p);await p.evaluate(t=>{document.getElementById('bk').value=t;},other);
 const r1=await p.evaluate(()=>{const b=document.getElementById('bkLoad');b.click();return [b.textContent,__t.S.cfg.bankStart];});
 ck(`one tap on Load backup only asks ("${r1[0].slice(0,50)}") and changes nothing`,/^Tap again/.test(r1[0])&&r1[1]===2500);
 await w(700);await p.evaluate(()=>document.getElementById('bkLoad').click());await w(900);
 ck('the second tap loads the copy',await p.evaluate(()=>__t.S.cfg.bankStart)===500000);
 await w(1500);await p.reload();await p.waitForFunction(()=>window.__t&&__t.S&&__t.S.ui,{timeout:15000}).catch(()=>{});await w(1800);
 const bar4=await p.evaluate(()=>{const e=document.getElementById('undoBar');return e&&!e.hidden?document.getElementById('undoTxt').textContent:'(none)';});
 ck(`after a reload, Undo of the restore is still offered ("${bar4}")`,/A backup replaced your numbers/.test(bar4));
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(900);ck('and it brings every number back',await nums()===before&&await p.evaluate(()=>__t.S.cfg.bankStart)===2500,await nums());
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
