/* QC round 13 layout 2: at 320 wide, Plan > All months broke a status chip inside a word ("Emergenc" / "y fund full"), because cards let any
   text break anywhere. Words on All months stay whole; only long numbers may still wrap. Made-up numbers. Run: node tests/qc/qc33_no_midword.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{const {b,p,errs}=await R.phone({w:320,h:640,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:900000,bank:500000,min:30000,defs:{'bill:rent':131000,'bill:food':31000,envelope:20000,education:0,invest:0,give:0},eT:150000,eS:50000,eM:20000,noTrip:true});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();});
 await p.evaluate(()=>{const e=document.querySelector('[data-tab-go="months"]');e&&e.click();});await w(900);
 const r=await p.evaluate(()=>{const root=document.querySelector('.panel.on, section.on')||document.body;const out=[];let words=0;const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length;};
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=walk.nextNode())){const el=n.parentElement;if(!el||!vis(el)||el.closest('[hidden],script,style,.stw,.sr-now'))continue;const re=/[A-Za-z]{3,}/g;let m;while((m=re.exec(n.data))){const g=document.createRange();g.setStart(n,m.index);g.setEnd(n,m.index+m[0].length);const rs=[...g.getClientRects()].filter(x=>x.width>0);if(!rs.length)continue;words++;const tops=new Set(rs.map(x=>Math.round(x.top)));if(tops.size>1)out.push(m[0]+' in "'+el.textContent.trim().slice(0,40)+'"');}}
  return {out,words,full:/fund full/.test(document.body.innerText)};});
 console.log('words checked',r.words);
 ck('All months shows a fund-full chip',r.full,'');
 ck('no word on the screen breaks in the middle at 320',r.out.length===0,JSON.stringify(r.out.slice(0,8)));
 ck('no page errors',errs.length===0,errs.join(' | '));
 await b.close();console.log(bad?'qc33_no_midword: '+bad+' FAIL':'qc33_no_midword: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc33_no_midword: FAIL');process.exit(1);});
