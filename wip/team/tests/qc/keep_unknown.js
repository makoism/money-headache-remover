/* Data safety (38.31 QC round): saved data only gains fields. A field a newer version saved, which this one does not know, survives a load and a save,
   at the top level and on a receipt, and never changes a number. Made-up numbers. Run: node tests/qc/keep_unknown.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true,keep:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});await L.base(p,{pay:3000,bank:2500,min:200});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.ui.toured=true;S.plan.lines.find(l=>l.key==='bill:rent').def=1234.56;S.plan.goals[0].start=300.44;S.plan.goals[0].monthly=150.5;S.receipts=[{id:'q1',d:'2026-11-03',a:12,c:'envelope',cn:'Free to spend',n:''}];__t.persist();});await w(1500);
 const bank0=await p.evaluate(()=>__t.calcAll(__t.S).byYm['2026-12'].bankEnd);
 /* a newer version wrote two fields this one does not know */
 await p.evaluate(()=>{const k='money-map-template-v2',d=JSON.parse(localStorage.getItem(k));d.futureField={ledger:[1,2,3],note:'from a newer version'};d.receipts[0].tag='coffee';d.receipts[0].src2=7;const g=d.plan.goals[0];g.colour='teal';d.rev=(+d.rev||0)+1;localStorage.setItem(k,JSON.stringify(d));});
 await p.reload();await p.waitForFunction(()=>window.__t&&__t.S&&__t.S.ui&&__t.S.ui.cleared===true,{timeout:15000}).catch(()=>{});await w(800);
 /* this version logs a receipt, so it saves */
 await p.evaluate(()=>{__t.S.receipts.push({id:'q2',d:'2026-11-05',a:5,c:'envelope',cn:'Free to spend',n:''});__t.persist();});await w(1500);
 const d=await p.evaluate(()=>JSON.parse(localStorage.getItem('money-map-template-v2')));
 ck('the unknown top-level field is still saved, unchanged',JSON.stringify(d.futureField)===JSON.stringify({ledger:[1,2,3],note:'from a newer version'}),JSON.stringify(d.futureField));
 ck('the unknown fields on the receipt are still saved',d.receipts.find(r=>r.id==='q1').tag==='coffee'&&d.receipts.find(r=>r.id==='q1').src2===7,JSON.stringify(d.receipts[0]));
 { const g=d.plan.goals[0]; ck('a goal keeps the unknown field "colour" through a load and a save (round 3)',g.colour==='teal',JSON.stringify(g));
   ck('a goal keeps its cents: saved 300.44, monthly 150.50 (decision 1)',g.start===300.44&&g.monthly===150.5,JSON.stringify(g));
   ck('a bill keeps its cents: rent 1,234.56',d.plan.lines.find(l=>l.key==='bill:rent').def===1234.56); }
 const bank1=await p.evaluate(()=>__t.calcAll(__t.S).byYm['2026-12'].bankEnd);
 ck(`no number changed because of them (bank in Dec ${bank0} before, ${bank1} after the new 5 receipt)`,Math.round((bank0-bank1)*100)===500||Math.round((bank0-bank1)*100)===0);
 /* round 2 (the reviewer's method): another tab writes new fields while this page is open, without a newer rev; this page then saves (its
    unload save included). The fields must survive, a settings field too */
 await p.evaluate(()=>{const k='money-map-template-v2',d=JSON.parse(localStorage.getItem(k));d.future={x:1};d.cfg.newOpt=5;d.receipts[0].tag2='work';localStorage.setItem(k,JSON.stringify(d));});
 await p.evaluate(()=>{__t.persist();});await w(1500);
 await p.reload();await p.waitForFunction(()=>window.__t&&__t.S&&__t.S.ui&&__t.S.ui.cleared===true,{timeout:15000}).catch(()=>{});await w(1500);
 const d2=await p.evaluate(()=>JSON.parse(localStorage.getItem('money-map-template-v2')));
 ck('fields written by another tab while this page was open survive its save and a reload',JSON.stringify(d2.future)==='{"x":1}'&&d2.cfg.newOpt===5&&d2.receipts.find(r=>r.id==='q1').tag2==='work',JSON.stringify([d2.future,d2.cfg.newOpt,d2.receipts[0]]));
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
