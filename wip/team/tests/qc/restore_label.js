/* 38.31 data safety round 3: only some currencies have samples. In euros the button restores the samples (pay comes back above 0); in dollars
   it is called "Clear my plan" and every word says it clears. Both keep receipts and offer Undo. Made-up numbers. Run: node tests/qc/restore_label.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{for(const [cur,label,word] of [['€','Restore samples','Samples restored'],['$','Clear my plan','Plan cleared']]){
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(c=>{__t.S.ui.cur=c;__t.S.receipts=[{id:'k1',d:'2026-11-03',a:12,c:'envelope',cn:'Free to spend',n:''}];__t.persist();__t.restructure();},cur);await L.base(p,{pay:3000,bank:2500,min:200});
 await L.settings(p);
 const l0=await p.evaluate(()=>document.getElementById('bkReset').textContent);
 ck(`[${cur}] the button reads "${label}"`,l0===label,l0);
 const armed=await p.evaluate(()=>{const b=document.getElementById('bkReset');b.click();return b.textContent;});
 ck(`[${cur}] the confirm says what happens and that receipts stay`,(cur==='€'?/puts the sample pay/:/clears your pay, bills, goals and balance/).test(armed)&&/Receipts stay/.test(armed),armed);
 await p.evaluate(()=>document.getElementById('bkReset').click());await w(900);
 const r=await p.evaluate(()=>({pay:__t.calcAll(__t.S).byYm['2026-11'].inflow,n:__t.S.receipts.length,msg:document.getElementById('bkMsg').textContent}));
 ck(`[${cur}] the result matches the words (pay ${r.pay})`,cur==='€'?r.pay>0:r.pay===0,JSON.stringify(r));
 ck(`[${cur}] the message says "${word}" and receipts stay`,r.msg.startsWith(word)&&r.n===1,JSON.stringify(r));
 ck(`[${cur}] no page errors`,errs.length===0,errs.join(' | '));await b.close();}
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
