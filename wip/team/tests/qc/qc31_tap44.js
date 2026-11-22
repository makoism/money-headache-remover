/* QC round 11 layout 1: the Add a burrow date chips ("6 months", "1 year", "2 years", "No date") were 38px tall at 320 and 390, and
   Plan > All months rows were 42px tall at 320. Every one is at least 44px tall now. Run: node tests/qc/qc31_tap44.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const w=L.R.w;
(async()=>{
 for(const W of [320,390]){
  const {b,p,errs}=await L.start({w:W,h:W===320?640:844,dpr:1,mobile:true});
  await L.tab(p,'tab-month');await w(400);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.innerText.trim()==='All months'&&e.getClientRects().length);b&&b.click();});await w(600);
  const rows=await p.evaluate(()=>[...document.querySelectorAll('#monthTable tr[data-ym]')].filter(r=>r.getClientRects().length).map(r=>Math.round(r.getBoundingClientRect().height)));
  ck(W+': All months rows are at least 44px tall',rows.length>0&&rows.every(h=>h>=44),JSON.stringify(rows.slice(0,5)));
  await p.evaluate(()=>{const t=document.getElementById('tab-goals')||document.getElementById('tab-month');t&&t.click();});await w(500);
  await p.evaluate(()=>document.getElementById('addGoalBtn').click());await w(500);
  await p.evaluate(()=>[...document.querySelectorAll('[data-kind]')].find(b=>/A trip/.test(b.textContent)).click());await w(300);
  for(let i=0;i<3&&!(await p.$('.gw-quick'));i++){await p.evaluate(()=>{const n=[...document.querySelectorAll('button')].find(e=>/^Next/.test(e.innerText.trim())&&e.getClientRects().length);n&&n.click();});await w(500);
   if(await p.$('#gwCost')){await p.evaluate(()=>{const e=document.getElementById('gwCost');e.focus();});await p.keyboard.type('1200');}}
  const chips=await p.evaluate(()=>[...document.querySelectorAll('.gw-quick .chipbtn')].map(c=>c.innerText.trim()+':'+Math.round(c.getBoundingClientRect().height)));
  ck(W+': the four date chips are at least 44px tall',chips.length===4&&chips.every(c=>+c.split(':')[1]>=44),JSON.stringify(chips));
  ck(W+': no page errors',errs.length===0,errs.join(' | '));await b.close();}
 console.log(bad?'qc31_tap44: '+bad+' FAIL':'qc31_tap44: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc31_tap44: FAIL');process.exit(1);});
