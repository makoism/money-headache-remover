/* Decision 1 in setup (38.31 money accuracy round 2): pay typed with cents in setup is kept, every figure setup shows has the cents, and the places
   plus what is not placed add up to the pay exactly. Yen stays whole. Made-up numbers. Run: node tests/qc/setup_cents.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const R=require('/tmp/v39/real.js');const w=R.w;
(async()=>{for(const [cur,typed,want] of [['$','2500.50',2500.5],['¥','250000.6',250001]]){
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1500);await p.evaluate(c=>{__t.S.ui.cur=c;},cur);
 const step=async()=>{await p.evaluate(()=>{const n=document.getElementById('tourNext');n&&n.click();});await w(800);};
 for(let i=0;i<6;i++){if(await p.evaluate(()=>!!document.getElementById('tourPay')))break;await step();}
 await p.evaluate(()=>document.getElementById('tourPay').focus());await p.keyboard.type(typed);await p.keyboard.press('Tab');await w(400);
 let ledger='';for(let i=0;i<12;i++){const t=await p.evaluate(()=>{const e=document.getElementById('tour');return e&&!e.hidden?e.innerText.replace(/\s+/g,' '):'(closed)';});if(/Your month:/.test(t)){ledger=t;break;}if(t==='(closed)')break;await step();}
 const m=await p.evaluate(()=>{const m=__t.calcAll(__t.S).byYm['2026-11'];return [m.inflow,m.out,m.left];});
 ck(`[${cur}] setup keeps the pay as ${want} (model ${m[0]})`,m[0]===want);
 ck(`[${cur}] places plus not placed add up to the pay exactly`,Math.round((m[1]+m[2])*100)===Math.round(m[0]*100),JSON.stringify(m));
 const shown=cur==='$'?'Pay in $2,500.50':'Pay in ¥250,001';
 ck(`[${cur}] the setup summary says "${shown}"`,ledger.includes(shown),ledger.slice(0,160));
 ck(`[${cur}] no page errors`,errs.length===0,errs.join(' | '));await b.close();}
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
