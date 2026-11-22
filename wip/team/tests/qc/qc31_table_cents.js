/* QC round 11 numbers 3 and money accuracy 6: the Receipts table wrote "$1,100" in one row and "$400.00" in the next, and "$0" next to
   "$0.00", because each row chose its own way of writing amounts. One table now writes every amount one way: with cents when any
   amount in it has cents. Made-up numbers. Run: node tests/qc/qc31_table_cents.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function open(setup){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:3000,bank:5000,min:0,defs:{'bill:rent':1100,'bill:food':420.75,envelope:250,education:0,invest:0,give:0},eT:20000,eS:0,eM:100,noTrip:true});
 await p.evaluate(setup);await w(300);await L.tab(p,'tab-receipts');await w(700);
 const cells=await p.evaluate(()=>[...document.querySelectorAll('#rcCats td')].map(t=>t.innerText.replace(/⁠/g,'').trim()).filter(t=>/\$\d/.test(t)));
 await b.close();return {cells,errs};}
(async()=>{
 const a=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts=[{id:'r1',d:'2026-11-03',a:1100,c:'bill:rent',cn:'Rent',n:''},{id:'r2',d:'2026-11-05',a:400,c:'bill:food',cn:'Food',n:''}];__t.persist();__t.restructure();});
 const withC=a.cells.filter(t=>/\.\d\d/.test(t)),noC=a.cells.filter(t=>!/\.\d\d/.test(t));
 ck('the table has amounts',a.cells.length>=4,JSON.stringify(a.cells));
 ck('every amount in the table is written one way (cents in one row means cents in all)',withC.length===0||noC.length===0,JSON.stringify(a.cells));
 ck('no page errors',a.errs.length===0,a.errs.join(' | '));
 console.log(bad?'qc31_table_cents: '+bad+' FAIL':'qc31_table_cents: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc31_table_cents: FAIL');process.exit(1);});
