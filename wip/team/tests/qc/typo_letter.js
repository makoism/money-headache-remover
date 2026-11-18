/* 38.31 QC round 2 (money accuracy and number gate): a letter typed into an amount is never dropped in silence. 12O (letter O) for 120 must not
   save 12 without a word: the box keeps what it had and says so. Setup's pay box, a Settings box and Log spend. Made-up numbers.
   Run: node tests/qc/typo_letter.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1500);
 for(let i=0;i<6;i++){if(await p.evaluate(()=>!!document.getElementById('tourPay')))break;await p.evaluate(()=>{const n=document.getElementById('tourNext');n&&n.click();});await w(700);}
 const cheer=()=>p.evaluate(()=>(document.getElementById('cheer')||{}).textContent||'');
 await p.focus('#tourPay');for(const c of '12'){await p.keyboard.type(c);await w(60);}await p.keyboard.type('O');await w(300);
 const v1=await p.evaluate(()=>document.getElementById('tourPay').value),c1=await cheer();
 ck(`setup pay: "12" then the letter O keeps "12" and says so ("${c1}")`,v1==='12'&&/Numbers only: "O"/.test(c1),v1);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(500);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(500);
 await L.settings(p);await p.focus('#st-minBank');await p.keyboard.press('End');await p.keyboard.type('a');await w(300);
 ck('Settings: a letter is refused with a message',/Numbers only: "a"/.test(await cheer()),await cheer());
 await p.keyboard.press('Escape');await w(300);await L.tab(p,'tab-home');await w(400);
 const n0=await p.evaluate(()=>(__t.S.receipts||[]).length);
 await p.evaluate(()=>{const q=document.getElementById('hQuick');q&&q.classList.remove('v1x');});
 await p.focus('#hAmt');for(const c of '12'){await p.keyboard.type(c);await w(60);}await p.keyboard.type('a');await w(300);
 ck('Log spend: a letter is refused with a message',/Numbers only: "a"/.test(await cheer()),await cheer());
 ck('and nothing was logged',await p.evaluate(()=>(__t.S.receipts||[]).length)===n0);
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
