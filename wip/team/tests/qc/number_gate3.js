/* 38.31 number gate, round 3 should-fixes: (1) the Over plan card names every place past the plan, Other too, so the parts add up to what the
   bank is lowered by; (2) a receipts row says Education, never "Courses and books"; (3) no bills planned is never praised as "under the usual";
   (4) a receipt bigger than the month's pay needs a second tap; (5) a minus in the receipt box is refused with a reason, never logged as +500;
   (6) with every coin placed the header says so, not "$0 not placed yet". Made-up numbers. Run: node tests/qc/number_gate3.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function open(setup){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:300000,bank:500000,min:0,defs:{'bill:rent':90000,'bill:food':40000,envelope:38800,education:0,invest:0,give:0},tT:0,tM:0,eT:0,eS:0,eM:0,noTrip:true});
 await p.evaluate(setup);await w(300);await L.tab(p,'tab-home');await w(700);return {b,p,errs};}
const txt=p=>p.evaluate(()=>document.body.innerText.replace(/\s+/g,' '));
(async()=>{
 /* 1: Free to spend 50,000 (plan 38,800), rent 95,000 (plan 90,000), Other 7,000 */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;
    S.receipts=[{id:'a1',d:'2026-11-05',a:50000,c:'envelope',cn:'Free to spend',n:''},{id:'a2',d:'2026-11-06',a:95000,c:'bill:rent',cn:'Rent',n:''},{id:'a3',d:'2026-11-07',a:7000,c:'other',cn:'Other',n:'Vet'}];__t.persist();__t.restructure();});
  const v=await p.evaluate(()=>{const V=__t.viewOf?__t.viewOf(__t.S,'2026-11'):null;return __t.calcAll(__t.S).byYm['2026-11'];});
  ck('(1) the model splits ¥23,200 past plan into bills 5,000, Free to spend 11,200, Other 7,000',v.overNow===23200&&JSON.stringify(v.overBits)===JSON.stringify({nec:5000,play:11200,other:7000}),JSON.stringify([v.overNow,v.overBits]));
  const t=await txt(p);
  ck('(1) Home names Other as ¥7,000 over',/Other is ¥7,000 over\./.test(t),(t.match(/Over plan.{0,200}/)||[''])[0]);
  ck('(1) and names the bill line that went over (QC round 5) and Free to spend',/Rent( or mortgage)? is ¥5,000 over\./.test(t)&&!/Bills and basics are ¥5,000 over/.test(t)&&/Free to spend is ¥11,200 over\./.test(t),(t.match(/.{0,120}¥5,000 over.{0,40}/)||[''])[0]);
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 /* 2: Education spent past its pile */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.plan.lines.find(l=>l.key==='education').def=38700;
    S.receipts=[{id:'e1',d:'2026-11-05',a:60000,c:'education',cn:'Education',n:''}];__t.persist();__t.restructure();});
  await L.tab(p,'tab-receipts');await w(600);const t=await p.evaluate(()=>document.getElementById('p-receipts').innerText.replace(/\s+/g,' '));
  ck('(2) the Receipts table says Education, never "Courses and books"',/Education ¥38,700 ¥60,000/.test(t)&&!/Courses and books/.test(t),(t.match(/.{0,30}¥60,000.{0,30}/)||[''])[0]);
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 /* 3: no bills in the plan */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true};S.ui.sampleHidden=true;S.plan.lines.filter(l=>l.jar==='nec').forEach(l=>l.def=0);__t.persist();__t.restructure();});
  await L.tab(p,'tab-month');await w(500);const n=await p.evaluate(()=>document.getElementById('jarNote').innerText);
  ck('(3) no bills planned says so, never "under the usual"',/No bills planned yet/.test(n)&&!/under the usual/.test(n),n);
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 /* 4 and 5: the Home log form */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();});
  const log=async amt=>{await p.evaluate(()=>{const e=document.getElementById('hAmt');e.scrollIntoView();e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');});await p.keyboard.type(amt);await w(200);await p.evaluate(()=>document.getElementById('hSave').click());await w(500);return p.evaluate(()=>[(__t.S.receipts||[]).length,document.getElementById('hMsg').innerText]);};
  let r=await log('400000');
  ck('(4) ¥400,000 against ¥300,000 pay is not logged on the first tap',r[0]===0&&/more than all of your pay/.test(r[1]),JSON.stringify(r));
  await p.evaluate(()=>document.getElementById('hSave').click());await w(500);
  r=await p.evaluate(()=>[(__t.S.receipts||[]).length,(__t.S.receipts||[])[0]&&__t.S.receipts[0].a]);
  ck('(4) a second tap logs it as typed',r[0]===1&&r[1]===400000,JSON.stringify(r));
  r=await log('-500');
  const all=await p.evaluate(()=>(__t.S.receipts||[]).map(x=>x.a));
  ck('(5) "-500" is refused with a reason and nothing new is logged',all.length===1&&/without a minus sign/.test(r[1]),JSON.stringify([all,r]));
  r=await log('3000');
  ck('(4) an ordinary receipt logs on one tap',(await p.evaluate(()=>__t.S.receipts.length))===2,JSON.stringify(r));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 /* 6: every coin placed */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true};S.ui.sampleHidden=true;S.plan.lines.find(l=>l.key==='invest').def=300000-90000-40000-38800;__t.persist();__t.restructure();});
  const d=await p.evaluate(()=>[__t.calcAll(__t.S).byYm['2026-11'].pool.left,document.getElementById('dockNum').innerText,document.getElementById('dockTxt').innerText]);
  ck('(6) with nothing left to place, the header says "All of your pay has a place"',Math.abs(d[0])<0.005&&d[1]===''&&/^All of your pay has a place in Nov/.test(d[2]),JSON.stringify(d));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
