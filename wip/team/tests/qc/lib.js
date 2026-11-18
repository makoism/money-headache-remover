const { phone, w } = require('./real.js');
exports.w=w;
exports.boot=async(opts={})=>{ const {b,p,errs}=await phone({w:390,h:844,dpr:2,mobile:true,...opts});
 const S={taps:0,t0:Date.now(),b,p,errs};
 S.log=m=>console.log(`[${S.taps} taps ${((Date.now()-S.t0)/1000).toFixed(1)}s] ${m}`);
 S.tap=async(sel,txt)=>{ const ok=await p.evaluate((sel,txt)=>{const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!='hidden'};
   let els=[...document.querySelectorAll(sel)].filter(vis); if(txt)els=els.filter(e=>(e.innerText||e.value||e.getAttribute('aria-label')||'').trim().toLowerCase().startsWith(txt.toLowerCase())); const e=els[0]; if(!e)return false; e.scrollIntoView({block:'center'}); e.click(); return true;},sel,txt); if(!ok)console.log('  MISS',sel,txt); else S.taps++; await w(450); return ok};
 S.type=async(sel,v)=>{await p.evaluate(s=>{const e=document.querySelector(s);e.focus();if(e.select)e.select()},sel); await p.keyboard.type(v,{delay:5}); S.taps++; await w(200)};
 S.typePh=async(re,v)=>{const ok=await p.evaluate((re)=>{const e=[...document.querySelectorAll('input')].filter(e=>new RegExp(re).test(e.placeholder)&&e.getBoundingClientRect().width>0)[0];if(!e)return false;e.scrollIntoView({block:'center'});e.focus();if(e.select)e.select();return true},re);if(!ok)console.log('  MISS ph',re);await p.keyboard.type(v,{delay:5});S.taps++;await w(200)};
 S.txt=async(sel='body',n=800)=>(await p.evaluate((s)=>{const t=document.querySelector(s);return t?t.innerText.replace(/\n+/g,' | '):'none'},sel)).slice(0,n);
 S.shot=async n=>p.screenshot({path:`/tmp/${n}.png`});
 return S;};
exports.shiftDays=async(S,days)=>{ await S.p.evaluate((d)=>{ if(!window.__RealDate){window.__RealDate=Date;} const RD=window.__RealDate; const off=d*86400000; 
  class FD extends RD{ constructor(...a){ if(a.length===0){super(RD.now()+off);} else super(...a);} static now(){return RD.now()+off;} }
  window.Date=FD; window.__off=off; }, days);
  await S.p.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));}); await w(400); };
exports.logAt=async(S,date,amt,cat,note='')=>{ const {p}=S; await S.tap('#tab-receipts'); await w(300);
 await p.evaluate((date,cat)=>{const d=document.querySelector('#rcDate');d.value=date;d.dispatchEvent(new Event('input',{bubbles:true}));d.dispatchEvent(new Event('change',{bubbles:true}));const s=document.querySelector('#rcCat');s.value=cat;s.dispatchEvent(new Event('change',{bubbles:true}));},date,cat);
 await S.type('#rcAmt',String(amt)); if(note) await S.type('#rcNote',note); await S.tap('#rcSave'); await w(500); };
