/* QC round 11 numbers 1: on Receipts at 390x844, for about 8 seconds after a save the "Logged ... Undo Close" bar sat over Log spend:
   the next tap on Log spend hit the bar, nothing was logged and no message showed, with Undo right next to it. The bar now never
   covers a Log spend button: wherever the page is scrolled, the middle of Log spend is Log spend. Made-up numbers.
   Run: node tests/qc/qc31_undo_cover.js */
let bad=0;const ck=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,c?'':(x||''));if(!c)bad++;};
const L=require('./lib_r12.js');const R=L.R;const w=R.w;
async function open(setup){const {b,p,errs}=await R.phone({w:390,h:844,dpr:1,mobile:true});
 await p.evaluateOnNewDocument(()=>{const real=Date,fixed=new real('2026-11-20T10:00:00').getTime(),start=real.now();class D extends real{constructor(...a){if(!a.length)super(fixed+(real.now()-start));else super(...a);}static now(){return fixed+(real.now()-start);}}window.Date=D;});
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await w(1300);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await w(400);await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await w(400);
 await L.zero(p);await p.evaluate(()=>{__t.S.ui.cur='$';});
 await L.base(p,{pay:3000,bank:5000,min:0,defs:{'bill:rent':1100,'bill:food':420.75,envelope:250,education:0,invest:0,give:0},eT:20000,eS:0,eM:100,noTrip:true});
 await p.evaluate(()=>{const S=__t.S;S.ui.done={pay:true,bills:true,goals:true,receipts:true};S.ui.sampleHidden=true;__t.persist();__t.restructure();});await w(300);
 return {b,p,errs};}
(async()=>{
 const {b,p,errs}=await open();
 await L.rc(p,'19.99');
 const vis=await p.evaluate(()=>{const u=document.getElementById('undoBar');return !!u&&!u.hidden;});
 ck('the Undo bar shows after a save',vis);
 const hits=[];
 for(const y of [120,300,450,520,560,600,640,680,720,760]){
  const r=await p.evaluate(y=>{const s=document.getElementById('rcSave');const r0=s.getBoundingClientRect();window.scrollBy(0,r0.top+r0.height/2-y);window.dispatchEvent(new Event('scroll'));return null;},y);
  await w(120);
  const h=await p.evaluate(()=>{const s=document.getElementById('rcSave'),r=s.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return 'off';const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e&&(e===s||s.contains(e))?'ok':(e?(e.id||e.className||e.tagName):'none');});
  if(h!=='ok'&&h!=='off')hits.push(y+':'+h);}
 ck('Log spend is never under the Undo bar, wherever the page is scrolled',hits.length===0,hits.join(' '));
 await p.evaluate(()=>{const s=document.getElementById('rcSave'),r=s.getBoundingClientRect();window.scrollBy(0,r.top+r.height/2-680);});await w(200);
 await p.focus('#rcAmt');await p.evaluate(()=>{const e=document.getElementById('rcAmt');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');});await p.keyboard.type('12');
 await p.click('#rcSave');await w(500);
 const n=await p.evaluate(()=>__t.S.receipts.length);
 ck('a second Log spend tap during the Undo bar logs the next receipt (2 receipts)',n===2,'receipts '+n);
 ck('no page errors',errs.length===0,errs.join(' | '));await b.close();
 console.log(bad?'qc31_undo_cover: '+bad+' FAIL':'qc31_undo_cover: ALL PASS');process.exit(bad?1:0);})().catch(e=>{console.log('crashed '+e.stack);console.log('qc31_undo_cover: FAIL');process.exit(1);});
