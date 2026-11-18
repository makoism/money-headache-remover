const R=require('/tmp/v39/real.js');
exports.R=R;
exports.start=async(opt={})=>{const o=await R.phone(opt);const {p}=o;
 await p.goto('file://'+(process.env.BUILD||'/home/claude/work/money-map-team.html')+'?sfxtest');await R.w(1200);
 await p.evaluate(()=>{const s=document.getElementById('tourSkip');s&&s.click();});await R.w(500);
 await p.evaluate(()=>{const s=document.getElementById('coSkip');s&&s.click();});await R.w(500);
 return o;};
exports.txt=p=>p.evaluate(()=>document.body.innerText);
exports.vis=p=>p.evaluate(()=>[...document.querySelectorAll('button,a,input,select,textarea')].filter(e=>e.offsetParent||e.getClientRects().length).map(e=>e.tagName[0]+'#'+(e.id||'')+'['+(e.getAttribute('aria-label')||e.placeholder||'')+']:'+(e.value!==undefined&&e.tagName!='BUTTON'?'='+e.value:'')+(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,40)));
exports.tab=async(p,t)=>{await p.evaluate(t=>document.getElementById(t).click(),t);await exports.R.w(500);};
exports.settings=async p=>{await p.evaluate(()=>document.getElementById('gearBtn').click());await exports.R.w(600);};
exports.clickText=async(p,txt,sel='button')=>p.evaluate((txt,sel)=>{const e=[...document.querySelectorAll(sel)].find(e=>e.innerText.trim()===txt&&(e.offsetParent||e.getClientRects().length));if(e){e.click();return true}return false},txt,sel);
exports.typeIn=async(p,sel,val)=>{await p.focus(sel);await p.evaluate(s=>{const e=document.querySelector(s);e.select&&e.select();},sel);await p.keyboard.down('Control');await p.keyboard.press('a');await p.keyboard.up('Control');await p.keyboard.press('Backspace');if(val!=='')await p.keyboard.type(String(val));await p.keyboard.press('Tab');await exports.R.w(400);};
exports.S=p=>p.evaluate(()=>JSON.parse(JSON.stringify(__t.S)));
exports.C=p=>p.evaluate(()=>{const C=__t.calcAll(__t.S);return C.months.slice(0,4).map(m=>({ym:m.ym,inflow:m.inflow,out:m.out,left:m.left,bankStart:m.bankStart,bankEnd:m.bankEnd,over:m.over,overNow:m.overNow,goalsTotal:m.goalsTotal,jar:m.jar,bal:m.bal,draw:m.draw}));});
exports.zero=async p=>{await exports.settings(p);await p.evaluate(()=>document.getElementById('blankBtn').click());await exports.R.w(300);await p.evaluate(()=>document.getElementById('blankBtn').click());await exports.R.w(700);};
exports.base=async(p,o={})=>{await p.evaluate(o=>{const S=__t.S;
 S.cfg.bankStart=o.bank??100000;S.cfg.minBank=o.min??20000;
 const defs=Object.assign({'bill:rent':100000,'bill:food':50000,envelope:40000,education:10000,invest:20000,give:5000},o.defs||{});
 S.plan.lines.forEach(l=>{l.def=defs[l.key]||0;});
 S.steps={a:[{from:'2026-11',v:o.pay??300000}]};S.once={};S.items={};
 const eg=S.plan.goals.find(g=>g.emergency);eg.target=o.eT??200000;eg.start=o.eS??50000;eg.monthly=o.eM??10000;eg.stretch=0;
 if(!o.noTrip&&!S.plan.goals.find(g=>g.id==='trip1')){S.plan.goals.unshift({id:'trip1',name:'Trip',target:o.tT??60000,start:0,due:'',monthly:o.tM??15000,slot:5});}
 S.ui.main='trip1';
 __t.persist();__t.restructure();},o);
 await exports.tab(p,'tab-month');await exports.tab(p,'tab-home');};
exports.dump=async(p,tag)=>{let out='';for(const t of ['tab-home','tab-month','tab-receipts']){await exports.tab(p,t);out+=`\n===== ${tag} ${t}\n`+await exports.txt(p);}
 for(const sub of ['Goals','All months']){await exports.tab(p,'tab-month');await exports.clickText(p,sub);await exports.R.w(500);out+=`\n===== ${tag} plan/${sub}\n`+await exports.txt(p);}
 await exports.tab(p,'tab-month');await exports.clickText(p,'Month');await exports.R.w(300);
 return out;};
exports.rc=async(p,amt,cat='envelope',date=null,note='',opts={})=>{await exports.tab(p,'tab-receipts');
 if(date)await p.evaluate(d=>{const e=document.getElementById('rcDate');e.value=d;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},date);
 await p.select('#rcCat',cat);
 await p.focus('#rcNote');await p.evaluate(n=>{document.getElementById('rcNote').value=n;},note);
 await p.focus('#rcAmt');await exports.R.w(150);await p.evaluate(()=>{const e=document.getElementById('rcAmt');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');delete e.dataset.neg;e.setSelectionRange(0,0);});
 if(opts.paste){await p.evaluate(v=>{const e=document.getElementById('rcAmt');const dt=new DataTransfer();dt.setData('text/plain',v);e.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));},String(amt));await p.keyboard.sendCharacter(String(amt));}
 else await p.keyboard.type(String(amt));
 await p.click('#rcSave');await exports.R.w(500);
 for(let i=0;i<(opts.again||0);i++){await p.click('#rcSave');await exports.R.w(500);}
 return p.evaluate(()=>document.getElementById('rcMsg').innerText);};
exports.cond=async(p,tag)=>{const t=await exports.dump(p,tag);const ls=t.split('\n');const o=[];
 ls.forEach((l,i)=>{if(/^=====/.test(l)||/[¥%]|NaN|undefined|Infinity|−0\b/.test(l))o.push((/^=====/.test(l)?'':'  ['+(ls[i-1]||'').slice(0,40)+'] ')+l);});return o.join('\n');};
