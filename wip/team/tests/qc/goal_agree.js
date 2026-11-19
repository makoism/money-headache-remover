/* S5 (38.30 gate): a goal's percent must be one figure everywhere, and nothing about it pops up over the pictures on load.
   Checks every place a goal's percent shows (Home burrow buttons, the main goal card, Plan > Goals, each burrow's own pop-up) against the model's
   goalRows percent, on the yen and dollar samples and on a plan with the longer emergency goal switched on. Made-up numbers only.
   Run: node tests/qc/goal_agree.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 for(const kase of ['¥ sample','$ plan','$ plan, longer emergency goal']){
  const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
  await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
  await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(500);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(800);
  if(kase!=='¥ sample'){await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
   await L.base(p,{pay:3000,bank:3000,min:200,defs:{'bill:rent':1000,'bill:food':500,envelope:300,education:50,invest:100,give:30},tT:2000,tM:100,eT:1200,eS:1150,eM:100});
   await p.evaluate(on=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;const eg=S.plan.goals.find(g=>g.emergency);if(on){eg.stretch=4000;eg.stretchOn=true;}__t.persist();__t.restructure();},kase.includes('longer'));
   await L.tab(p,'tab-month');await L.tab(p,'tab-home');await w(800);}
  const pops=await p.evaluate(()=>{const out=[];document.querySelectorAll('body *').forEach(e=>{const cs=getComputedStyle(e);if((cs.position==='fixed'||cs.position==='absolute')&&e.offsetParent!==null&&cs.visibility!=='hidden'&&+cs.opacity>0.1){const t=(e.innerText||'').replace(/\s+/g,' ').trim();if(/\d%/.test(t)&&t.length<160)out.push(t);}});return out;});
  ck(`[${kase}] nothing with a percent pops up over the page on load`,pops.length===0,pops.join(' | '));
  const want=await p.evaluate(()=>{const S=__t.S,C=__t.calcAll(S);return null;});
  const got=await p.evaluate(()=>{const o={};const add=(name,src,v)=>{(o[name]=o[name]||[]).push(src+':'+v);};
   document.querySelectorAll('#hBur .hb-b,[aria-label*="percent full"]').forEach(e=>{const m=/^(.+?), .*?(\d+) percent full/.exec(e.getAttribute('aria-label')||'');if(m)add(m[1],'home',m[2]);});
   document.querySelectorAll('[aria-label*="percent of"]').forEach(e=>{const m=/(\d+) percent of (.+?) saved/.exec(e.getAttribute('aria-label')||'');if(m)add(m[2],'main',m[1]);});
   return o;});
  await L.tab(p,'tab-month');await L.clickText(p,'Burrows')   /* the Plan page is called Burrows (Mako, 2026-11-19) */;await w(600);
  const plan=await p.evaluate(()=>{const o={};document.querySelectorAll('[aria-label*="% of"],.gbar').forEach(e=>{const m=/^(.+?): (\d+)% of/.exec(e.getAttribute('aria-label')||e.innerText||'');if(m)o[m[1]]=m[2];});return o;});
  Object.keys(plan).forEach(k=>{(got[k]=got[k]||[]).push('plan:'+plan[k]);});
  await L.tab(p,'tab-home');await w(400);
  /* each burrow's own pop-up: open the first burrow, then step through the others with the pop-up's dots */
  await p.evaluate(()=>{const b=document.querySelector('#hBur .hb-b');b&&b.click();});await w(900);
  const nd=await p.evaluate(()=>document.querySelectorAll('.bv-dots button').length);
  for(let i=0;i<nd;i++){await p.evaluate(i=>{const d=document.querySelectorAll('.bv-dots button')[i];d&&d.click();},i);await w(700);
   const pop=await p.evaluate(()=>{const s=document.querySelector('.bv-s'),h=s&&s.parentElement.querySelector('h2');return h?[h.textContent,s.textContent]:null;});
   if(pop){const m=/(\d+)%/.exec(pop[1]);if(m)(got[pop[0]]=got[pop[0]]||[]).push('burrow:'+m[1]);}}
  const model=await p.evaluate(()=>{const S=__t.S,C=__t.calcAll(S);const d=new Date(),ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');const M=C.byYm[ym]?ym:C.months[0].ym;const o={};
   S.plan.goals.forEach(g=>{const m=C.byYm[M],cap=g.emergency&&g.stretchOn===true?Math.max(g.stretch||0,g.target):g.target;if(cap>0)o[g.name]=Math.floor(m.bal[g.id]/cap*100+1e-9);});return o;});
  let seen=0;
  Object.keys(got).forEach(name=>{if(!(name in model))return;seen++;const vals=got[name].map(x=>+x.split(':')[1]);
   ck(`[${kase}] ${name}: every percent is ${model[name]}% (${got[name].join(', ')})`,vals.every(v=>v===Math.min(100,model[name])),'model '+model[name]);});
  ck(`[${kase}] the percents were found in at least two places per goal`,seen>0&&Object.values(got).every(a=>a.length>=2),JSON.stringify(got));
  ck(`[${kase}] no page errors`,errs.length===0,errs.join(' | '));
  await b.close();
 }
 console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
