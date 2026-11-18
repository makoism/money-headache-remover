/* Data safety (38.31 QC round): logging or deleting a receipt can be undone with one tap, and Undo touches only that receipt.
   Made-up numbers. Run: node tests/qc/receipt_undo.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:3000,bank:2500,min:200});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.ui.toured=true;S.receipts=[{id:'u1',d:'2026-11-03',a:12,c:'envelope',cn:'Free to spend',n:''}];__t.persist();__t.restructure();});
 await L.tab(p,'tab-month');await L.tab(p,'tab-home');await w(600);
 const amts=()=>p.evaluate(()=>(__t.S.receipts||[]).map(r=>r.a).sort((a,b)=>a-b).join(','));
 const bar=()=>p.evaluate(()=>{const e=document.getElementById('undoBar');return e&&!e.hidden?document.getElementById('undoTxt').textContent:'(none)';});
 /* 1. log on Home, then Undo */
 await p.evaluate(()=>{const e=document.getElementById('hAmt');e.value='45.5';document.getElementById('hForm').requestSubmit();});await w(700);
 ck('after logging on Home, Undo is offered and names it',/Logged \$45\.50/.test(await bar()),await bar());
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(600);
 ck('Undo takes out only that receipt',await amts()==='12',await amts());
 /* 2. log, then log another, then Undo: only the newest goes */
 await p.evaluate(()=>{const e=document.getElementById('hAmt');e.value='7';document.getElementById('hForm').requestSubmit();});await w(600);
 await p.evaluate(()=>{const e=document.getElementById('hAmt');e.value='8';document.getElementById('hForm').requestSubmit();});await w(600);
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(600);
 ck('with two logged, Undo takes out only the last one',await amts()==='7,12',await amts());
 /* 3. delete on Receipts, the confirm names it, then Undo puts it back */
 await L.tab(p,'tab-receipts');await w(500);
 const del=await p.evaluate(()=>{const b=document.querySelector('[data-rcdel="u1"]');if(!b)return '(no button)';b.click();return b.textContent;});
 ck(`the delete confirm names the receipt ("${del}")`,/Tap again: delete \$12, Free to spend, 3 Nov 2026/.test(del));
 await p.evaluate(()=>document.querySelector('[data-rcdel="u1"]').click());await w(600);
 ck('the receipt is gone',await amts()==='7',await amts());
 ck('Undo is offered',/Deleted \$12/.test(await bar()),await bar());
 await p.evaluate(()=>document.getElementById('undoGo').click());await w(600);
 ck('Undo puts back exactly that receipt',await amts()==='7,12'&&await p.evaluate(()=>__t.S.receipts.some(r=>r.id==='u1'&&r.d==='2026-11-03')),await amts());
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
