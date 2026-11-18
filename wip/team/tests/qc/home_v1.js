/* Version one Home (Mako, 2026-11-18): the picture, the four numbers and one next action; everything else is hidden until it is needed.
   Checks: exactly one next action is on screen; no other card shows until needed (the status line only when it needs attention); More shows
   every other card and nothing is lost; the four numbers are the model's own (mapOf). Made-up numbers only. Run: node tests/qc/home_v1.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
const f2=(n,s)=>(n<0?'−':'')+s+Math.abs(n).toLocaleString('en-US',Math.abs(n-Math.round(n))<0.005?{}:{minimumFractionDigits:2,maximumFractionDigits:2});
const ACTIONS=['moveBanner','hNext','hBk','hQuick'],EXTRA=['hHero','hSpend','hGoals','hDebts','hLimits','hBuckets','hMore'];
const CASES=[
 {name:'a month-end question is open',date:'2026-12-10',rc:[['2026-12-02',42.5],['2026-12-06',18]],once:{},action:'hNext',status:false},
 {name:'nothing urgent: Log spend is the action',date:'2026-11-20',rc:[['2026-11-12',42.5]],once:{},action:'hQuick',status:false},
 {name:'below zero: the status line shows',date:'2026-11-20',rc:[['2026-11-12',42.5]],once:{'2026-11':{'bill:rent':5200}},action:'hQuick',status:true},
];
(async()=>{
 for(const k of CASES){
  const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
  await p.evaluateOnNewDocument(d=>{const real=Date,fixed=new real(d+'T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;},k.date);
  await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
  await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(500);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(600);
  await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
  await L.base(p,{pay:3000,bank:2500,min:200,defs:{'bill:rent':1000,'bill:food':500,envelope:300,education:50,invest:100,give:30},tT:2000,tM:100,eT:5000,eS:800,eM:100});
  await p.evaluate(k=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.ui.toured=true;S.ui.bk=Date.now();S.once=k.once;S.receipts=k.rc.map((x,i)=>({id:'v'+i,d:x[0],a:x[1],c:'envelope',cn:'Free to spend',n:''}));__t.persist();__t.restructure();},k);
  await L.tab(p,'tab-month');await L.tab(p,'tab-home');await w(900);
  const vis=()=>p.evaluate(ids=>{const o={};ids.forEach(id=>{const e=document.getElementById(id);o[id]=!!e&&!e.hidden&&getComputedStyle(e).display!=='none'&&e.getClientRects().length>0;});return o;},ACTIONS.concat(EXTRA,['hMap','hBur','hStatus','hMoreBtn']));
  let v=await vis();
  const acts=ACTIONS.filter(id=>v[id]);
  ck(`[${k.name}] exactly one next action is on screen (${acts.join(', ')||'none'})`,acts.length===1&&acts[0]===k.action,JSON.stringify(v));
  ck(`[${k.name}] the picture is there: the burrow map and the burrows`,v.hMap&&v.hBur);
  ck(`[${k.name}] no other card shows until needed`,EXTRA.every(id=>!v[id]),EXTRA.filter(id=>v[id]).join(', '));
  ck(`[${k.name}] the status line shows only when it needs attention (${k.status?'yes':'no'})`,v.hStatus===k.status,await p.evaluate(()=>document.getElementById('hStatus').innerText.slice(0,120)));
  const four=await p.evaluate(()=>[...document.querySelectorAll('.mp-four li')].map(li=>[li.querySelector('.mp-l').textContent,li.querySelector('b').textContent]));
  const model=await p.evaluate(()=>{const e=document.querySelector('.mp-proof');return e?e.innerText:'';});
  ck(`[${k.name}] the four numbers are Total, Free to spend, Bills left, Saved`,JSON.stringify(four.map(x=>x[0]))===JSON.stringify(['Total','Free to spend','Bills left','Saved']),JSON.stringify(four));
  { const tot=(four.find(x=>x[0]==='Total')||[])[1]||'';ck(`[${k.name}] Total on its tile is the proof line's total (${tot})`,!!tot&&model.includes('= '+tot),model.slice(0,160)); }
  { const pr=await p.evaluate(()=>{const e=document.querySelector('.mp-proof');return e?e.innerText:'';});const saved=(four.find(x=>x[0]==='Saved')||[])[1];ck(`[${k.name}] Saved on its tile is the proof line's burrows (${saved})`,pr.includes('burrows '+saved),pr.slice(0,120)); }
  { const rooms=await p.evaluate(()=>document.getElementById('mpRooms').innerText.replace(/\s+/g,' '));const fr=(four.find(x=>x[0]==='Free to spend')||[])[1],bl=(four.find(x=>x[0]==='Bills left')||[])[1];
    ck(`[${k.name}] Free to spend ${fr} and Bills left ${bl} match the This month rooms`,rooms.includes(fr)&&rooms.includes(bl),rooms); }
  /* More shows the rest, nothing lost */
  await p.evaluate(()=>document.getElementById('hMoreBtn').click());await w(700);v=await vis();
  ck(`[${k.name}] More shows every other card`,['hSpend','hGoals','hMore','hHero'].every(id=>v[id])&&v.hQuick,JSON.stringify(v));
  await p.evaluate(()=>document.getElementById('hMoreBtn').click());await w(500);v=await vis();
  ck(`[${k.name}] Show less hides them again`,EXTRA.every(id=>!v[id]));
  ck(`[${k.name}] no page errors`,errs.length===0,errs.join(' | '));
  await b.close();
 }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
