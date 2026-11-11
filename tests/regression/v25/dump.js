const puppeteer=require('/home/claude/work/tools/node_modules/puppeteer-core');
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu'],headless:'new'});
 const p=await b.newPage(); await p.setViewport({width:430,height:900});
 await p.evaluateOnNewDocument(()=>{try{localStorage.setItem('money-map-template-v2',JSON.stringify({ui:{toured:true,setup:true,sampleHidden:true}}));}catch(e){}});
 await p.goto('file:///home/claude/work/money-map-team.html'); await new Promise(r=>setTimeout(r,800));
 const tabs=await p.evaluate(()=>[...document.querySelectorAll('[id^=tab-]')].map(x=>x.id+':'+x.textContent.trim()+(x.hidden?' (hidden)':'')));
 console.log(tabs.join(' | '));
 for (const t of ['month','receipts','plan','goals','settings']){
   await p.evaluate(t=>{const x=document.querySelector('#tab-'+t); if(x) x.click();},t); await new Promise(r=>setTimeout(r,300));
   const txt=await p.evaluate(()=>{const v=[...document.querySelectorAll('main section, main .page, .page')].filter(e=>e.offsetParent!==null); return document.body.innerText.replace(/\n+/g,' / ').slice(0,1800);});
   console.log('=== '+t+'\n'+txt);
 }
 await b.close();
})();
