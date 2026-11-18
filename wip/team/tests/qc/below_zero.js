/* Decision 2 (Mako, 2026-11-18): when the bank ends a month below zero, Home shows one plain amber line naming the month, the amount and the
   causes the model knows. Never red, never "cushion", never says bills are unpaid. Every amount on the line is the model's (viewOf().month.belowZero).
   Made-up numbers only. Run: node tests/qc/below_zero.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
const f2=n=>(n<0?'−':'')+'$'+Math.abs(n).toLocaleString('en-US',Math.abs(n-Math.round(n))<0.005?{}:{minimumFractionDigits:2,maximumFractionDigits:2});
const CASES=[
 {name:'starts below zero, the month adds',once:{'2026-11':{'bill:rent':4000}},rc:[],want:z=>z.startBelow>0&&z.adds>0,
  must:z=>[`It starts the month at ${f2(-z.startBelow)}, and Dec adds ${f2(z.adds)}.`]},
 {name:'the month plans more than comes in',once:{'2026-12':{'bill:rent':4200}},rc:[],want:z=>z.planGap>0&&z.startBelow===0,
  must:z=>[`Dec plans ${f2(z.planGap)} more than comes in.`]},
 {name:'spending past the plan this month',once:{},rc:[['2026-12-02',2900.5]],want:z=>z.overNow>0&&z.startBelow===0,
  must:z=>[`${f2(z.overNow)} went past the plan this month.`]},
];
(async()=>{
 for(const k of CASES){
  const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
  await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-12-03T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
  await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1200);
  await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
  await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
  await L.base(p,{pay:3000,bank:100,min:0,defs:{'bill:rent':1000,'bill:food':500,envelope:300,education:50,invest:100,give:30},tT:2000,tM:100,eT:5000,eS:500,eM:100});
  await p.evaluate(k=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.once=k.once;S.receipts=k.rc.map((x,i)=>({id:'rz'+i,d:x[0],a:x[1],c:'envelope',cn:'Free to spend',n:''}));__t.persist();__t.restructure();},k);
  await L.tab(p,'tab-month');await L.tab(p,'tab-home');
  const r=await p.evaluate(()=>{const el=document.getElementById('hStatus'),chip=el&&el.querySelector('.chip');return {txt:el?el.innerText.replace(/\s+/g,' '):'',cls:chip?chip.className:'',m:__t.calcAll(__t.S).byYm['2026-12']};});
  const m=r.m,ch=+(m.bankEnd-m.bankStart).toFixed(2),z={by:-m.bankEnd,startBelow:m.bankStart<0?-m.bankStart:0,adds:ch>0?ch:0,planGap:m.pool.left<0?-m.pool.left:0,overNow:m.overNow||0};
  ck(`[${k.name}] the case really is below zero (bank ends ${m.bankEnd})`,m.bankEnd<0&&k.want(z),JSON.stringify(z));
  ck(`[${k.name}] Home says "Below zero" in amber, never red`,/Below zero/.test(r.txt)&&/\btight\b/.test(r.cls)&&!/\bshort\b/.test(r.cls),r.cls+' | '+r.txt);
  ck(`[${k.name}] it names the month and the amount: "Your bank ends Dec at ${f2(m.bankEnd)}."`,r.txt.includes(`Your bank ends Dec at ${f2(m.bankEnd)}.`),r.txt);
  for(const s of k.must(z)) ck(`[${k.name}] it names the cause: "${s}"`,r.txt.includes(s),r.txt);
  ck(`[${k.name}] never "cushion", never unpaid bills`,!/cushion|unpaid|not paid|can.t pay/i.test(r.txt),r.txt);
  if(process.env.SHOW)console.log('   TEXT:',r.txt);
  ck(`[${k.name}] no page errors`,errs.length===0,errs.join(' | '));
  await b.close();
 }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
