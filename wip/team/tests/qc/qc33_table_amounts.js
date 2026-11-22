/* QC round 13 layout blocker 1: at 320 wide the Receipts month table broke amounts inside ("¥123,4" / "56 over"), so they read as other numbers.
   Every amount stays on one line, and the table stays inside the screen. Made-up numbers. Run: node tests/qc/qc33_table_amounts.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
(async()=>{for(const W of [320,390]){const {b,p,errs}=await R.phone({w:W,h:640,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='¥';});
 await L.base(p,{pay:900000,bank:500000,min:30000,defs:{'bill:rent':131000,'bill:food':31000,envelope:20000,education:0,invest:0,give:0},eT:400000,eS:50000,eM:10000,noTrip:true});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();});
 await L.rc(p,48350,'bill:food','2026-11-05');await L.rc(p,123456,'envelope','2026-11-06');await L.rc(p,9876,'other','2026-11-07','Transport');await L.rc(p,131000,'bill:rent','2026-11-01');
 await L.tab(p,'tab-receipts');await w(700);
 const r=await p.evaluate(()=>{const t=document.querySelector('#rcCats table');if(!t)return {none:true};const split=[];
  t.querySelectorAll('td').forEach(td=>{const walk=document.createTreeWalker(td,NodeFilter.SHOW_TEXT);let n;while((n=walk.nextNode())){const re=/[−-]?⁠?[¥$€₱]?[\d,]+(\.\d+)?/g;let m;while((m=re.exec(n.data))){if(!/\d{2}/.test(m[0]))continue;const g=document.createRange();g.setStart(n,m.index);g.setEnd(n,m.index+m[0].length);const tops=new Set([...g.getClientRects()].map(x=>Math.round(x.top)));if(tops.size>1)split.push(m[0]);}}});
  const wr=document.querySelector('#rcCats').getBoundingClientRect(),tr=t.getBoundingClientRect();return {split,over:Math.round(tr.right-Math.min(wr.right,innerWidth)),pageW:document.documentElement.scrollWidth,iw:innerWidth};});
 ck(W+': the table is there',!r.none);
 ck(W+': no amount breaks across two lines',r.split&&r.split.length===0,JSON.stringify(r.split));
 ck(W+': the table stays inside the screen',r.over<=1&&r.pageW<=r.iw,JSON.stringify(r));
 ck(W+': no page errors',errs.length===0,errs.join(' | '));
 await b.close();}
 console.log(bad?'qc33_table_amounts: '+bad+' FAIL':'qc33_table_amounts: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc33_table_amounts: FAIL');process.exit(1);});
