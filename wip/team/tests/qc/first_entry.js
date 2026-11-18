/* Decision 5 (Mako, 2026-11-18): the first pay or bills entry becomes the usual amount for every month, unless the person changes a month.
   Also gate finding B2: entering pay from the Home "Next: enter pay" card no longer leaves later months on the old pay.
   Typed key by key, so a first entry never turns into a one-month change halfway. Made-up numbers only. Run: node tests/qc/first_entry.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{
 const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-12-03T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1200);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:0,bank:2000,min:0,defs:{'bill:rent':1000,'bill:food':500,envelope:300,education:50,invest:100,give:30},tT:2000,tM:100,eT:5000,eS:500,eM:100});
 /* nothing entered yet: no pay, and the bills are the plan's starting amounts (never set by the person) */
 await p.evaluate(()=>{const S=__t.S;S.ui.done={};S.steps={};S.once={};__t.persist();__t.restructure();});
 const vals=key=>p.evaluate(key=>{const C=__t.calcAll(__t.S);const pick=k=>key==='a'?C.byYm[k].a:(C.byYm[k].lines.find(l=>l.key===key)||{}).v;return ['2026-11','2026-12','2027-01','2027-09'].map(pick);},key);
 const onceHas=key=>p.evaluate(key=>Object.keys(__t.S.once).filter(ym=>__t.S.once[ym][key]!==undefined),key);
 const toast=()=>p.waitForFunction(()=>{const e=document.getElementById('cheer');return !!e&&e.textContent==='Saved as the usual amount for every month.';},{timeout:5000,polling:100}).then(()=>true,()=>false);
 const typeKeys=async(sel,txt)=>{await p.focus(sel);await w(250);await p.keyboard.down('Control');await p.keyboard.press('a');await p.keyboard.up('Control');for(const ch of txt){await p.keyboard.type(ch);await w(60);}await p.keyboard.press('Tab');await w(700);};
 /* 1. pay, from the Home card */
 await L.tab(p,'tab-home');
 const hasCard=await p.evaluate(()=>{const b=document.querySelector('#hNext [data-open="a"]');if(b){b.click();return true;}return false;});
 ck('Home offers "Enter pay" and it opens the pay box',hasCard);await w(800);
 await p.evaluate(()=>{const e=document.getElementById('monthSel');e.value='2026-12';e.dispatchEvent(new Event('change',{bubbles:true}));});await w(500);
 await typeKeys('#h-a','3100');
 let v=await vals('a');ck('the first pay entry is the usual amount in every month (Nov, Dec, Jan, Sep: 3100)',v.every(x=>x===3100),JSON.stringify(v));
 ck('and nothing was saved as a one-month change',(await onceHas('a')).length===0,JSON.stringify(await onceHas('a')));
 ck('the page says it is now the usual amount',await toast(),await p.evaluate(()=>{const e=document.getElementById('cheer');return 'cheer='+(e?JSON.stringify(e.textContent):'none');}));
 /* 2. a later pay edit is for the month shown only */
 await typeKeys('#h-a','3300');
 v=await vals('a');ck('a later pay edit changes Dec only (3100, 3300, 3100, 3100)',JSON.stringify(v)===JSON.stringify([3100,3300,3100,3100]),JSON.stringify(v));
 /* 3. bills: each line's first entry is its usual amount; its next edit is for one month */
 const ids=await p.evaluate(()=>{const S=__t.S;const f=k=>S.plan.lines.find(l=>l.key===k).id;return {rent:f('bill:rent'),food:f('bill:food')};});
 await p.evaluate(()=>{const h=document.querySelector('.row[data-id="nec"] .row-h');h&&h.click();});await w(600);
 await typeKeys('#i-l-'+ids.rent,'1250');
 v=await vals('bill:rent');ck('the first rent entry is the usual amount in every month (1250)',v.every(x=>x===1250),JSON.stringify(v));
 await typeKeys('#i-l-'+ids.food,'480');
 v=await vals('bill:food');ck('the first food entry, made after rent, is also its usual amount (480)',v.every(x=>x===480),JSON.stringify(v));
 await typeKeys('#i-l-'+ids.rent,'1300');
 v=await vals('bill:rent');ck('a later rent edit changes Dec only (1250, 1300, 1250, 1250)',JSON.stringify(v)===JSON.stringify([1250,1300,1250,1250]),JSON.stringify(v));
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0);})();
