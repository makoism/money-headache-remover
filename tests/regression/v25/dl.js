const puppeteer=require('/home/claude/work/tools/node_modules/puppeteer-core');
const w=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log('PASS',n);} else {fail++;console.log('FAIL',n,x||'');} };
(async()=>{
 for (const mode of ['ok','declined','none','unavailable']) {
  const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu'],headless:'new'});
  const p=await b.newPage(); await p.setViewport({width:430,height:900});
  await p.evaluateOnNewDocument((mode)=>{
    try{localStorage.setItem('money-map-template-v2',JSON.stringify({ui:{toured:true,setup:true,sampleHidden:true}}));}catch(e){}
    window.__saved=[];
    window.claude={use:async(n)=>{ if(n!=='downloads') return null; if(mode==='none') return null; return {save:async(r)=>{ if(mode==='declined') throw {code:'declined'}; if(mode==='unavailable') throw {code:'unavailable'}; window.__saved.push({filename:r.filename,data:r.data}); return {status:'saved'}; }}; }};
  },mode);
  await p.goto('file:///home/claude/work/money-map-team.html'); await w(900);
  await p.evaluate(()=>document.querySelector('#tab-home').click());
  const click=async id=>{ await p.evaluate(i=>document.querySelector(i).click(),id); await w(500); };
  const msg=()=>p.$eval('#bkMsg',e=>e.textContent);
  await click('#bkSave'); const m1=await msg();
  const sv=await p.evaluate(()=>window.__saved.slice());
  await click('#bkCsv'); const m2=await msg(); const sv2=await p.evaluate(()=>window.__saved.slice());
  if(mode==='ok'){
    ok('save file: message says Saved.', m1==='Saved.', m1);
    ok('save file: .json name and valid backup content', sv.length===1 && /^money-headache-remover-\d{4}-\d{2}-\d{2}\.json$/.test(sv[0].filename) && (()=>{try{const d=JSON.parse(sv[0].data);return !!d.steps&&!!d.once&&!!d.cfg;}catch(e){return false;}})());
    ok('spreadsheet: message Saved. and .csv with a header row', m2==='Saved.' && sv2.length===2 && /\.csv$/.test(sv2[1].filename) && sv2[1].data.split('\n').length>5, m2);
  } else if(mode==='declined'){ ok('declined says Not saved.', m1==='Not saved.' && m2==='Not saved.', m1+'|'+m2); }
  else if(mode==='none'){ ok('no download route says so, and does not claim Saved', /unavailable/i.test(m1) && !/Saved/.test(m1) && /unavailable/i.test(m2), m1+'|'+m2); }
  else { ok('failure says Save failed and points to Copy text', /Save failed/.test(m1) && /Copy text/.test(m1) && /Save failed/.test(m2), m1+'|'+m2); }
  await b.close();
 }
 console.log('PASS',pass,'FAIL',fail);
})();
