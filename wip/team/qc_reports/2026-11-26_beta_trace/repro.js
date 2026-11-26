const A='/home/user/money-headache-remover/wip/team/app3/tests/';
const T=require(A+'lib3.js'), R=require(A+'chat_real.js'), fs=require('fs');
const BETA=+process.argv[2], CARDD=+(process.argv[3]||0);
const out=[]; const log=(...a)=>{const s=a.join(' ');out.push(s);console.log(s);};
const txt=(p,sel)=>p.$eval(sel,e=>e.innerText).catch(()=>'(none)');
const eng=p=>p.evaluate(()=>{const b=BurrowApp3.E3.book,r=BurrowEngine.lookahead.lookahead(b,BurrowApp3.E3.today());const nm=id=>(b.accounts.find(a=>a.id===id)||{}).name;
 return {safe:r.safeToSpend,accts:Object.fromEntries(Object.entries(r.accounts).map(([id,a])=>[nm(id),{bank:a.bank,min:a.minimum,lowest:a.lowest,lowestDay:a.lowestDay,headroom:a.headroom,spendFrom:a.spendFrom,why:a.why,firstUnder:a.firstUnder}])),warn:r.warnings.map(w=>w.text)};});
async function tab(p,name){await p.evaluate(n=>{const b=[...document.querySelectorAll('button,a,[role=tab]')].find(e=>e.offsetParent&&e.innerText.trim()===n);if(b)b.click();},name);await T.w(500);}
async function snap(p,label){
  await tab(p,'Home'); log('=== '+label+' HOME ===\n'+(await txt(p,'#a3Home')));
  await tab(p,'Plan'); log('=== '+label+' PLAN ===\n'+(await txt(p,'#a3Plan')));
  await tab(p,'Home');
  log('=== '+label+' ENGINE ===\n'+JSON.stringify(await eng(p),null,1));
}
(async()=>{
  const prof=fs.mkdtempSync(require('os').tmpdir()+'/prof-');
  const {b,p,errs}=await T.open({profile:prof}); p.on('dialog',d=>d.accept());
  const ai=await R.relay(p);
  await p.goto(T.URL0+'?today=2026-11-24'); await T.w(700);
  const cards=R.MAKO.cards.map(c=>c.name==='Card A'?Object.assign({},c,{payFrom:'Beta Bank'}):c);
  await R.setup(p,ai,{banks:[{name:'Main bank',amount:286000},{name:'Beta Bank',amount:BETA}],cards});
  log('24 Nov home',JSON.stringify(await R.home(p)));
  await p.goto(T.URL0+'?today=2026-12-01'); await T.w(900);
  for (const n of ['Power','Rent','Internet']) { ai.push(body=>R.say('',[R.call('change',{steps:[{do:'landed',ref:R.ref(body,n)}]})]),R.say('Ticked.')); await R.tell(p,n+' came out'); }
  ai.push(body=>R.say('',[R.call('change',{steps:[{do:'change_bill',ref:R.ref(body,'Rent'),account:R.ref(body,'Beta Bank')}]})]),R.say('Done.'));
  await R.tell(p,'pay rent from Beta Bank');
  ai.push(body=>R.say('',[R.call('change',{steps:[{do:'add_card',name:'Card D',owed:CARDD,payDay:20,closeDay:'not sure',shift:'before',account:R.ref(body,'Beta Bank')}]})]),R.say('Added.'));
  await R.tell(p,'add Card D from Beta Bank');
  log('cards so far', JSON.stringify(await p.$$eval('[data-card=chat-change]',e=>e.map(x=>x.dataset.status+': '+x.innerText.replace(/\s+/g,' ')))));
  await snap(p,'BEFORE');
  ai.push(body=>R.say('',[R.call('change',{steps:[{do:'change_bill',ref:R.ref(body,'Power'),account:R.ref(body,'Beta Bank')}]})]),R.say('Power is paid from Beta Bank from its next one.'));
  await R.tell(p,'pay power from Beta Bank');
  const cc=await p.$$eval('[data-card=chat-change]',e=>e.map(x=>x.dataset.status+': '+x.innerText));
  log('=== POWER CHANGE CARD ===\n'+cc.slice(-1)[0]);
  await snap(p,'AFTER');
  log('errs',JSON.stringify(errs));
  fs.writeFileSync(require('os').tmpdir()+'/repro_'+BETA+'_'+CARDD+'.txt',out.join('\n'));
  await b.close();
})();
