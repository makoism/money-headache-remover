/* 38.31 layout round 3: "Go to bills" at the end of setup puts the Bills and basics heading just under the fixed summary bar, never behind it, at 390, 320 and 1300 wide. Run: node tests/qc/bills_scroll.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{for(const [W,H] of [[390,844],[320,640],[1300,900]]){const {b,p,errs}=await R.phone({w:W,h:H,dpr:1,mobile:W<500});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 
 for(let i=0;i<20;i++){const open=await p.evaluate(()=>{const t=document.getElementById('tour');return t&&!t.hidden;});if(!open)break;await p.evaluate(()=>{const n=document.getElementById('tourNext');n&&n.click();});await w(700);}await w(1800);
 const r=await p.evaluate(()=>{const row=document.querySelector('.row[data-id="nec"]'),d=document.querySelector('.dock');return [Math.round(row.getBoundingClientRect().top),Math.round(d.getBoundingClientRect().bottom)];});
 ck(W+' wide: the Bills heading (top '+r[0]+') is below the bar (bottom '+r[1]+')',r[0]>=r[1]&&r[0]<r[1]+60);ck(W+' wide: no page errors',errs.length===0,errs.join(' | '));await b.close();}console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
