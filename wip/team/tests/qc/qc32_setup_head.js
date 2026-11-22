/* QC round 12 novice 8: the setup header said "Welcome" on both the Welcome and the Currency step. The first part is called Start, so no
   step's label repeats its title and Currency is not headed Welcome. Run: node tests/qc/qc32_setup_head.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const R=require('/tmp/v39/real.js');const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1400);
 const seen=[];
 for(let i=0;i<3;i++){seen.push(await p.evaluate(()=>({part:(document.getElementById('tourPart')||{}).textContent||'',title:(document.getElementById('tourTitle')||{}).textContent||''})));
  await p.evaluate(()=>{const n=document.getElementById('tourNext');n&&n.click();});await w(700);}
 console.log(JSON.stringify(seen));
 ck('no step label repeats its title',seen.every(s=>s.part.trim().toLowerCase()!==s.title.trim().toLowerCase()),JSON.stringify(seen));
 const cur=seen.find(s=>/Currency/.test(s.title));
 ck('the Currency step is not headed Welcome',!!cur&&!/Welcome/.test(cur.part),JSON.stringify(cur));
 ck('the first part is called Start',seen[0].part==='Start',seen[0].part);
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'qc32_setup_head: '+bad+' FAIL':'qc32_setup_head: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc32_setup_head: FAIL');process.exit(1);});
