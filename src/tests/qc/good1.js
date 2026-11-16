const {boot,w}=require('./lib.js'); const {joyAll}=require('./joyfix2.js');
(async()=>{ const S=await boot(); const {p}=S; await joyAll(S); await w(1200);
 console.log(await p.evaluate(()=>document.querySelector('#hStatus').innerText.slice(0,260)));
 console.log(await p.evaluate(()=>localStorage.getItem('mhr-errlog')));
 await p.evaluate(()=>scrollTo(0,0)); await S.shot('n05_joy_bank10k');
 await S.b.close();})();
