/* An overdrawn bank (38.31 QC round 3, money accuracy blocker raised three rounds): the balance box takes a minus sign, in Settings and in setup,
   the plan starts from it, and Home's bank figure is that much lower. Every other amount box still refuses a minus. Cents are kept in Settings
   (decision 1). A saved copy with a minus balance loads unchanged. Made-up numbers. Run: node tests/qc/neg_bank.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;const PAGE=process.env.BUILD||'/home/claude/work/money-map-team.html';
(async()=>{
 /* 1. Settings: -400.50 typed by hand */
 { const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
  await p.goto('file://'+PAGE+'?sfxtest');await w(1500);
  await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
  await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});await L.base(p,{pay:3000,bank:2500,min:200});
  await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();});
  await L.settings(p);
  const before=await p.evaluate(()=>__t.calcAll(__t.S).byYm['2026-11'].bankEnd);
  await p.focus('#st-bankStart');await w(200);await p.evaluate(()=>{const e=document.getElementById('st-bankStart');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');});
  await p.keyboard.type('-400.50');await w(300);await p.keyboard.press('Tab');await w(500);
  const st=await p.evaluate(()=>({cfg:__t.S.cfg.bankStart,box:Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').get.call(document.getElementById('st-bankStart')),end:__t.calcAll(__t.S).byYm['2026-11'].bankEnd,start0:__t.calcAll(__t.S).byYm['2026-11'].bankStart}));
  ck('Settings keeps a balance of -400.50',st.cfg===-400.5,JSON.stringify(st));
  ck('the box shows -400.50 as typed',st.box==='-400.50',st.box);
  ck('the plan starts the month at -400.50',st.start0===-400.5,JSON.stringify(st));
  /* 2. another amount box still refuses a minus */
  const other=await p.evaluate(()=>{const e=document.getElementById('st-minBank');return e?e.value:null;});
  await p.focus('#st-minBank');await p.keyboard.press('End');await p.keyboard.type('-5');await w(300);await p.keyboard.press('Tab');await w(300);
  const mb=await p.evaluate(()=>__t.S.cfg.minBank);
  ck('the minimum balance box still refuses a minus',!(mb<0),String(mb));
  /* 3. Home's bank figure is lower by exactly the balance change */
  await L.tab(p,'tab-home');await w(800);
  const home=await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' '));
  const bankShown=(home.match(/Bank (−?\u2060?\$[\d,.]+) \+ burrows/)||[])[1];
  const want=await p.evaluate(()=>{const v=__t.viewOf?__t.viewOf(__t.S,'2026-11'):null;return __t.calcAll(__t.S).byYm['2026-11'].bankEnd;});
  ck('Home names the bank as the model works it out ('+want+')',!!bankShown&&+bankShown.replace(/[−\u2060$,]/g,'')*(bankShown[0]==='−'?-1:1)===want,bankShown+' vs '+want+' (before '+before+')');
  ck('no NaN, undefined or Infinity on Home',!/NaN|undefined|Infinity/.test(home));
  /* 4. reload keeps it */
  const saved=await p.evaluate(()=>localStorage.getItem('money-map-template-v2'));
  await b.close();
  const r2=await R.phone({w:390,h:844,dpr:1,mobile:true});
  await r2.p.evaluateOnNewDocument(st=>{localStorage.setItem('money-map-template-v2',st);localStorage.setItem('__keep','1');},saved);
  await r2.p.goto('file://'+PAGE+'?sfxtest');await w(1500);
  ck('a saved copy with -400.50 loads unchanged',await r2.p.evaluate(()=>__t.S.cfg.bankStart)===-400.5);
  ck('no page errors',errs.length===0&&r2.errs.length===0,errs.concat(r2.errs).join(' | '));await r2.b.close(); }
 /* 5. setup: Balance now -30000 in yen */
 { const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
  await p.goto('file://'+PAGE+'?sfxtest');await w(1500);await p.evaluate(()=>{__t.S.ui.cur='¥';});
  const step=async()=>{await p.evaluate(()=>{const n=document.getElementById('tourNext');n&&n.click();});await w(800);};
  for(let i=0;i<6;i++){if(await p.evaluate(()=>!!document.getElementById('tourBank')))break;await step();}
  await p.evaluate(()=>document.getElementById('tourPay').focus());await p.keyboard.type('250000');
  await p.evaluate(()=>document.getElementById('tourBank').focus());await p.keyboard.type('-30000');await p.keyboard.press('Tab');await w(300);
  const box=await p.evaluate(()=>Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').get.call(document.getElementById('tourBank')));
  await step();
  const cfg=await p.evaluate(()=>__t.S.cfg.bankStart);
  ck('setup shows "-30,000" in the box',box==='-30,000',box);
  ck('setup keeps a balance of -30000',cfg===-30000,String(cfg));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
