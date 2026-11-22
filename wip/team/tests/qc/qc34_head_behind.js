/* QC round 14 data safety confusing 1: with the cloud copy behind, the header at the top (always on screen) still said "Saved in this
   browser", and the "The cloud copy is behind" card was two screens down. The header says the cloud copy is behind while it is, and goes
   back once it has caught up. Run: node tests/qc/qc34_head_behind.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:412,h:915,dpr:1,mobile:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 const head=()=>p.$eval('#saveTxt',e=>e.textContent);
 ck('cloud off: the header says Saved in this browser',/Saved in this browser/.test(await head()),await head());
 await p.evaluateOnNewDocument(()=>{if(!sessionStorage.getItem('qcSet')){sessionStorage.setItem('qcSet','1');localStorage.setItem('mhr-vault',JSON.stringify({code:'MHR-TEST-TEST-TEST-TEST-TEST',rev:1,failAt:Date.now()-3600e3}));}});
 await p.reload();await w(2500);
 const h1=await head();
 ck('cloud copy behind (after a reload): the header says so',/[Cc]loud copy behind/.test(h1),h1);
 ck('the header still says the numbers are saved here',/[Ss]aved/.test(h1),h1);
 ck('no page errors',errs.filter(e=>!/fetch|network|Failed to load/i.test(e)).length===0,errs.join(' | '));
 await b.close();console.log(bad?'qc34_head_behind: '+bad+' FAIL':'qc34_head_behind: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc34_head_behind: FAIL');process.exit(1);});
