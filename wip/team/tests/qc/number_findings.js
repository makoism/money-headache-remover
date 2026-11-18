/* PLAN step 4: the number findings from the last gate round, each written to fail on the build that had it.
   1. The month-end answer card never says "0 counted" (or "had no room left") once receipts used up the leftover;
      while some is left it says the model's live amount (m.counted, m.topup.used).
   2. A month whose spending went past the plan never calls pay "not placed" when that spending already used it:
      every "not placed" amount on the Plan tab and the dock is the model's (jarsOf().unplacedNet, planCells().unplaced).
   3. The month-end offer and the model name one unspent amount (sweepOffer().left === m.pendLeft, to the cent).
   Made-up numbers only. Run: node tests/qc/number_findings.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
const fixDate=d=>p=>p.evaluateOnNewDocument(d=>{const real=Date,fixed=new real(d).getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;},d);
async function open(){const o=await R.phone({w:385,h:800,dpr:1,mobile:true});await fixDate('2026-12-03T10:00:00')(o.p);
 await o.p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1200);
 await o.p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await o.p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(o.p);await o.p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(o.p,{pay:3000,bank:3000,min:200,defs:{'bill:rent':1000,'bill:food':500,envelope:300,education:50,invest:100,give:30},tT:2000,tM:100,eT:5000,eS:500,eM:100});
 return o;}
const card=p=>p.evaluate(()=>{const e=document.getElementById('hNext');return e&&!e.hidden?e.innerText.replace(/\s+/g,' '):'(none)'});
const addRc=(p,list)=>p.evaluate(list=>{const S=__t.S;list.forEach((x,i)=>S.receipts.push({id:'r'+Math.random().toString(36).slice(2),d:x[0],a:x[1],c:'envelope',cn:'Free to spend',n:''}));__t.persist();__t.restructure();},list);
const relook=async p=>{await L.tab(p,'tab-month');await L.tab(p,'tab-home');};
(async()=>{
 /* ---- 1 and 3: the month-end answer card ---- */
 for(const how of ['bank','goal']){
  const {b,p,errs}=await open();
  await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts=[];__t.persist();__t.restructure();});
  await addRc(p,[['2026-11-03',40.25],['2026-11-09',47.25]]);await relook(p);
  const one=await p.evaluate(()=>{const C=__t.calcAll(__t.S);return C.byYm['2026-11'].pendLeft;});
  const c0=await card(p);
  ck(`[${how}] the offer names the model's unspent amount to the cent (m.pendLeft ${one})`,one===212.5&&/\$212\.50 of free to spend is not logged/.test(c0),c0);
  await p.evaluate(h=>document.querySelector(h==='bank'?'[data-sweepbank]':'[data-sweep]').click(),how);await w(600);
  const c1=await card(p);
  ck(`[${how}] the answer card says the full amount`,how==='bank'?/\$212\.50 counted in the bank/.test(c1):/\$212\.50 put toward Trip/.test(c1),c1);
  await addRc(p,[['2026-11-20',100]]);await relook(p);
  const c2=await card(p),m2=await p.evaluate(()=>{const m=__t.calcAll(__t.S).byYm['2026-11'];return [m.counted,m.topup&&m.topup.used];});
  ck(`[${how}] after a later receipt the card follows the model (${m2})`,m2[0]===112.5&&(how==='bank'?/\$112\.50 counted in the bank/.test(c2):/\$112\.50 put toward Trip/.test(c2)),c2);
  await addRc(p,[['2026-11-25',112.5]]);await relook(p);
  const c3=await card(p),m3=await p.evaluate(()=>{const m=__t.calcAll(__t.S).byYm['2026-11'];return m.counted||0;});
  ck(`[${how}] once receipts used it all (counted ${m3}) the card never says "0 counted" or "no room left"`,m3===0&&!/\b0(\.00)? counted|\$0(\.00)? put toward|no room left/.test(c3),c3);
  ck(`[${how}] no page errors`,errs.length===0,errs.join(' | '));
  await b.close();
 }
 /* ---- 2: spending past the plan uses the pay with no place ---- */
 for(const [spent,unpl] of [[0,820],[500,620],[1500,0]]){
  const {b,p,errs}=await open();
  await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts=[];__t.persist();__t.restructure();});
  if(spent)await addRc(p,[['2026-12-02',spent]]);
  await L.tab(p,'tab-month');await p.evaluate(()=>{const e=document.getElementById('monthSel');e.value='2026-12';e.dispatchEvent(new Event('change',{bubbles:true}));});await w(500);
  const r=await p.evaluate(()=>{const C=__t.calcAll(__t.S),m=C.byYm['2026-12'];const tip=(document.querySelector('#bar [data-k="rest"]')||{}).dataset||{};
   const txt=[document.getElementById('legend').innerText,document.getElementById('verdict').innerText,document.getElementById('chip').innerText,document.getElementById('dockTxt').innerText,(document.getElementById('dockNum')||{}).innerText||'',(tip.tip||'').replace(/<br>/g,' | ').replace(/<[^>]+>/g,'')].join(' || ').replace(/\s+/g,' ');
   return {txt,overNow:m.overNow||0};});
  const amts=[...r.txt.matchAll(/\$([\d,]+(?:\.\d\d)?)\s*(?:of (?:your )?pay )?not placed yet|not placed yet[^|$]*?\$([\d,]+(?:\.\d\d)?)/g)].map(x=>+(x[1]||x[2]).replace(/,/g,''));
  const says=/not placed/i.test(r.txt);
  if(unpl===0) ck(`[spent ${spent}] spending past plan used all the pay with no place: no amount above 0 is called "not placed"`,amts.every(a=>a===0),r.txt);
  else ck(`[spent ${spent}] every "not placed" amount is ${unpl} (found ${amts.join(', ')||'none'})`,says&&amts.length>0&&amts.every(a=>a===unpl),r.txt);
  { const tip=r.txt.split(' || ').pop(), used=Math.max(0,Math.min(820,spent-300));
    ck(`[spent ${spent}] the Left piece of the bar says ${used?'$'+used.toLocaleString('en-US')+' used for spending past plan':'only pay not placed'}`,used?new RegExp('\\$'+used.toLocaleString('en-US')+' used for spending past plan').test(tip)&&(unpl?new RegExp('\\$'+unpl+' not placed yet').test(tip):!/not placed/.test(tip)):/not placed yet/.test(tip)&&!/spending past plan/.test(tip),tip); }
  ck(`[spent ${spent}] no page errors`,errs.length===0,errs.join(' | '));
  await b.close();
 }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
