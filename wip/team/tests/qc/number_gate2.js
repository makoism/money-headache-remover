/* 38.31 number gate, round 2: (1) pay not placed is one figure to the cent everywhere; (2) with no Free to spend plan, the Plan card counts only
   Free to spend receipts; (3) the bar's label never calls borrowed money pay; (4) once pay is typed, nothing calls it sample pay. Made-up numbers.
   Run: node tests/qc/number_gate2.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function open(setup){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:4000,bank:0,min:0,defs:{'bill:rent':0,'bill:food':0,envelope:0,education:0,invest:0,give:0},tT:0,tM:0,eT:0,eS:0,eM:0,noTrip:true});
 await p.evaluate(setup);await w(300);await L.tab(p,'tab-home');await L.tab(p,'tab-month');await w(500);return {b,p,errs};}
(async()=>{
 /* 1 and 2: pay 4,000, nothing planned, receipts in cents in two lines */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;S.receipts=[{id:'n1',d:'2026-11-05',a:0.01,c:'envelope',cn:'Free to spend',n:''},{id:'n2',d:'2026-11-06',a:19.99,c:'envelope',cn:'Free to spend',n:''},{id:'n3',d:'2026-11-07',a:19.99,c:'bill:food',cn:'Food',n:''}];__t.persist();__t.restructure();});
  const t=await p.evaluate(()=>[document.getElementById('dockNum').innerText,document.getElementById('verdict').innerText,document.getElementById('rcLine').innerText]);
  const nums=(t[0]+' '+t[1]).match(/\$3,9\d\d(\.\d\d)?/g)||[];
  ck(`(1) every "not placed" amount on Plan is $3,960.01 (${nums.join(', ')})`,nums.length>=2&&nums.every(x=>x==='$3,960.01'),t.join(' | '));
  ck(`(2) with no Free to spend plan, the card counts only its own receipts ("${t[2].slice(0,70)}")`,/\$20 spent from Free to spend/.test(t[2])&&!/39\.99/.test(t[2]),t[2]);
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 /* 3: borrowed money on the bar's label */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true};S.ui.sampleHidden=true;S.plan.lines.find(l=>l.key==='bill:rent').def=4500;const eg=S.plan.goals.find(g=>g.emergency);eg.target=5000;eg.start=2000;S.once={'2026-11':{draw:500}};__t.persist();__t.restructure();});
  const lab=await p.evaluate(()=>document.getElementById('bar').getAttribute('aria-label')||'');
  ck(`(3) the bar's label says pay and borrowed apart ("${lab.slice(0,60)}")`,/^\$4,000 pay and \$500 borrowed, by place/.test(lab),lab);
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 /* 4: pay typed, bills and goals not yet: the sample word stays off the pay */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.cleared=false;S.ui.preset='$';S.ui.done={pay:true};S.ui.sampleHidden=false;__t.persist();__t.restructure();});
  const d=await p.evaluate(()=>document.getElementById('dockTxt').innerText);
  ck(`(4) after typing pay the dock does not say "sample pay" ("${d.slice(0,60)}")`,!/sample pay/.test(d),d);
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 /* 5 (round 3): amounts with cents read the same on every screen: rent 1,234.56, Free to spend 300.44, receipts 0.01 and 19.99 */
 { const {b,p,errs}=await open(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;
    S.plan.lines.find(l=>l.key==='bill:rent').def=1234.56;S.plan.lines.find(l=>l.key==='bill:food').def=400;S.plan.lines.find(l=>l.key==='envelope').def=300.44;
    S.receipts=[{id:'c1',d:'2026-11-05',a:0.01,c:'envelope',cn:'Free to spend',n:''},{id:'c2',d:'2026-11-06',a:19.99,c:'envelope',cn:'Free to spend',n:''}];__t.persist();__t.restructure();});
  const plan=await p.evaluate(()=>document.getElementById('p-month').innerText.replace(/\s+/g,' '));
  ck('(5) Plan says "Planned $300.44 this month", never "$300"',/Planned \$300\.44 this month/.test(plan)&&!/Planned \$300 this month/.test(plan),plan.slice(0,200));
  ck('(5) Plan writes Bills and basics as $1,634.56, never $1,635',/\$1,634\.56/.test(plan)&&!/\$1,635\b/.test(plan));
  await L.tab(p,'tab-receipts');await w(600);
  const rc=await p.evaluate(()=>document.getElementById('p-receipts').innerText.replace(/\s+/g,' '));
  ck('(5) the Receipts row for Free to spend reads $300.44, $20, $280.44',/Free to spend \$300\.44 \$20 \$280\.44/.test(rc),(rc.match(/Free to spend \$[^A-Z]{0,40}/g)||[]).join(' | '));
  ck('no page errors',errs.length===0,errs.join(' | '));await b.close(); }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
