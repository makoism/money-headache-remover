/* QC round 12 numbers gate B1: with the bank short of the bills and Free to spend, Home said "planned, not safe to spend yet" but the card
   said "8,800 planned, 3,800 safe to spend", Plan > Month and Receipts said "3,800 left, not safe to spend yet" when 8,800 was left
   (38,800 planned less 30,000 spent). One answer: 8,800 left everywhere, not safe to spend yet, and nothing called safe.
   Made-up numbers. Run: node tests/qc/qc32_left_one.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:300000,bank:50000,min:30000,defs:{'bill:rent':90000,'bill:food':40000,envelope:38800,education:0,invest:0,give:0},eT:390000,eS:20000,eM:131200,noTrip:true});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;delete S.cfg.bankNow;S.cfg.bankAt='2026-11-20';__t.persist();__t.restructure();});
 await L.rc(p,30000,'envelope','2026-11-10');await L.rc(p,45000,'bill:food','2026-11-11');await L.rc(p,20000,'other','2026-11-12','Vet bill');
 const T={};
 for(const [k,t] of [['home','tab-home'],['plan','tab-month'],['rc','tab-receipts']]){await L.tab(p,t);await w(600);T[k]=await p.evaluate(()=>document.body.innerText.replace(/⁠/g,''));}
 const all=T.home+'\n'+T.plan+'\n'+T.rc;
 const st=await p.evaluate(()=>{const C=__t.calcAll(__t.S);const m=C.byYm['2026-11'];return {left:m.left,bankEnd:m.bankEnd,play:m.jar.play};});
 console.log('state',JSON.stringify(st));
 ck('Home says Free to spend is not safe to spend yet',/not safe to spend yet/.test(T.home));
 ck('no screen calls ¥3,800 safe to spend',!/¥3,800 safe to spend/.test(all),(all.match(/.{0,60}¥3,800 safe to spend.{0,20}/g)||[]).join(' | '));
 ck('no screen says ¥3,800 left',!/¥3,800 left/.test(all),(all.match(/.{0,60}¥3,800 left.{0,30}/g)||[]).join(' | '));
 ck('Receipts says ¥8,800 left, not safe to spend yet',/¥8,800 left, not safe to spend yet/.test(T.rc),(T.rc.match(/.{0,60}left.{0,30}/g)||[]).join(' | '));
 ck('Plan > Month receipts line says ¥8,800 left, not safe to spend yet',/¥8,800 left, not safe to spend yet/.test(T.plan),(T.plan.match(/Receipts:.{0,80}/g)||[]).join(' | '));
 ck('Receipts table Free to spend row left is ¥8,800',/Free to spend\s+¥38,800\s+¥30,000\s+¥8,800/.test(T.rc),(T.rc.match(/Free to spend\s+¥[\d,]+\s+¥[\d,]+\s+¥[\d,]+/g)||[]).join(' | '));
 /* QC round 12 numbers gate should-fix 5: the Other row's Plan cell was empty; nothing is planned for it, so it says ¥0 */
 ck('Receipts table Other row says ¥0 planned',/Other\s+¥0\s+¥20,000/.test(T.rc),(T.rc.match(/Other.{0,40}/g)||[]).join(' | '));
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'qc32_left_one: '+bad+' FAIL':'qc32_left_one: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc32_left_one: FAIL');process.exit(1);});
