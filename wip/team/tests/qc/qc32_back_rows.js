/* QC round 12 numbers gate should-fix 6: Receipts "Last month" put "in plan" in the Spent column for Bills and basics, and Investing was
   missing. The Spent column holds amounts only, and every place with a plan has a row. Made-up numbers. Run: node tests/qc/qc32_back_rows.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-12-05T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:300000,bank:200000,min:30000,defs:{'bill:rent':90000,'bill:food':40000,envelope:38800,education:10000,invest:20000,give:5000},noTrip:true});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts.push({id:'rb1',d:'2026-11-10',a:30000,c:'envelope',cn:'Free to spend',n:''});__t.persist();__t.restructure();});
 await L.tab(p,'tab-month');await p.evaluate(()=>{const e=document.getElementById('monthSel');e.value='2026-12';e.dispatchEvent(new Event('change',{bubbles:true}));});await w(500);await L.tab(p,'tab-receipts');await w(700);
 const t=await p.evaluate(()=>{const e=document.getElementById('rcBack');return e&&!e.hidden?e.innerText:'(hidden)';});
 console.log(t.replace(/\n/g,' | ').slice(0,400));
 ck('Last month shows',/Last month/.test(t));
 ck('no "in plan" in the Spent column',!/in plan/.test(t),t.match(/.{0,40}in plan/));
 ck('Bills and basics row: planned ¥130,000, spent ¥0',/Bills and basics\s+¥130,000\s+¥0/.test(t),(t.match(/Bills and basics.{0,30}/)||[])[0]);
 ck('Investing has a row: planned ¥20,000',/Investing\s+¥20,000\s+¥0/.test(t),(t.match(/Investing.{0,30}/)||[])[0]);
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'qc32_back_rows: '+bad+' FAIL':'qc32_back_rows: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc32_back_rows: FAIL');process.exit(1);});
