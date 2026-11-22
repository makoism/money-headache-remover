/* QC round 14 novice confusing 5: Receipts, Edit a receipt of 12, tap the Amount box and type 15: the box kept "12", so it saved 1,215.
   Tapping the Amount box while changing a receipt selects the old amount, so typing replaces it. Made-up numbers.
   Run: node tests/qc/qc34_edit_amount.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:3000,bank:1500,min:300,defs:{'bill:rent':1200,envelope:300},noTrip:true});
 const d=await p.evaluate(()=>{const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');});
 await L.rc(p,12,'envelope',d);
 await L.tab(p,'tab-receipts');await w(600);
 const ok=await p.evaluate(()=>{const e=document.querySelector('[data-rcedit]');if(!e)return false;e.click();return true;});await w(500);
 ck('the receipt has an Edit button',ok);
 ck('the form shows the old amount 12',await p.$eval('#rcAmt',e=>e.value)==='12');
 await p.tap('#rcAmt');await w(300);await p.keyboard.type('15');await w(200);
 const v=await p.$eval('#rcAmt',e=>e.value);
 ck('after a tap, typing 15 gives 15, not 1215',v==='15',v);
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'qc34_edit_amount: '+bad+' FAIL':'qc34_edit_amount: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc34_edit_amount: FAIL');process.exit(1);});
