/* Data safety (38.31 QC round): when the browser refuses the main save (storage full or blocked), a receipt logged then must survive a reload.
   The second copy (IndexedDB) takes it; on the next load the page uses the second copy because it is newer. Made-up numbers.
   Run: node tests/qc/save_fail.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true,keep:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:3000,bank:2500,min:200,defs:{'bill:rent':1000,'bill:food':500,envelope:300,education:50,invest:100,give:30},tT:2000,tM:100,eT:5000,eS:800,eM:100});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.ui.toured=true;S.receipts=[{id:'k1',d:'2026-11-05',a:20,c:'envelope',cn:'Free to spend',n:''}];__t.persist();});
 await w(2500);
 const saved=()=>p.evaluate(()=>{try{return (JSON.parse(localStorage.getItem('money-map-template-v2')).receipts||[]).length;}catch(e){return -1;}});
 ck('before: the main save holds the first receipt',await saved()===1);
 /* the browser now refuses every write to the main save */
 await p.evaluate(()=>{const o=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='money-map-template-v2'){const e=new Error('QuotaExceededError');e.name='QuotaExceededError';throw e;}return o.call(this,k,v);};});
 await p.evaluate(()=>{__t.S.receipts.push({id:'k2',d:'2026-11-09',a:999,c:'envelope',cn:'Free to spend',n:''});__t.persist();});
 await w(3000);
 ck('the main save still has only the first receipt (the write was refused)',await saved()===1);
 const hdr=await p.evaluate(()=>document.body.innerText.match(/Saved in this browser|Not saved[^\n]*/)?.[0]||'(none)');
 await p.reload();
 await p.waitForFunction(()=>window.__t&&__t.S&&(__t.S.receipts||[]).length===2,{timeout:15000,polling:200}).catch(()=>{});await w(500);
 const rc=await p.evaluate(()=>(__t.S.receipts||[]).map(r=>r.a));
 ck(`after a reload the receipt logged while the save failed is there (${JSON.stringify(rc)}; header said "${hdr}")`,rc.length===2&&rc.includes(999));
 await w(1500);
 ck('and it is written back to the main save once the browser allows it',await saved()===2);
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
