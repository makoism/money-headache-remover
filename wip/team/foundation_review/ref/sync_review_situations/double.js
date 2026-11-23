// Money counted twice across devices: a tick or typed spend on one device, the statement line read on the other.
const R='/home/user/money-headache-remover/wip/team/foundation_review/rules/';
const S=require(R+'sync_v1_ref'), MT=require(R+'matching_ref');
const bank='k7qzpa-m2xq7ab9zt-1', rent='k7qzpa-m2xq7ab9zt-7', food='k7qzpa-m2xq7ab9zt-51';
const st=(t,by)=>({told:t,at:t,by});
const base={events:[],schedules:[],accounts:[{id:bank,kind:'bank',name:'Bank',...st('2026-11-01T09:00:00.000+09:00','k7qzpa')}],home:{main:{v:{acct:bank,min:null},at:'2026-11-01T09:00:00.000+09:00',by:'k7qzpa'}}};
// Desktop side, worked by matching_ref: it never saw the phone's tick or the phone's coffee.
const desk=MT.applyImports({schedules:{rent:{}},expected:[{s:'rent',due:'2026-11-27',lands:'2026-11-27',acct:'bank',dir:'out',a:80000}],
  imports:[{id:'f1',src:'statement',acct:'bank',lines:[{id:'i1',dir:'out',a:80000,date:'2026-11-27',posted:'2026-11-27'},{id:'i2',dir:'out',a:1200,date:'2026-11-28',posted:'2026-11-28'}]}]});
console.log('desktop matching:', JSON.stringify(desk.lines.map(l=>({id:l.id,a:l.a,settles:l.settles,gone:!!l.gone}))));
const imp=(id,a,date,settles)=>Object.assign({id,k:'spend',date,acct:bank,a,src:{type:'statement',file:'bank-2026-11.csv',from:'2026-11-01',to:'2026-11-30'}},settles?{settles}:{},st('2026-11-29T21:00:00.000+09:00','w3hmxd'));
const mineD={...base,events:[imp('imp:'+bank+':2026-11-27:80000:out:1',80000,'2026-11-27',[{s:rent,due:'2026-11-27'}]),imp('imp:'+bank+':2026-11-28:1200:out:1',1200,'2026-11-28')]};
// Phone, offline on the train: ticked rent at its check-in, typed the coffee.
const mineP={...base,events:[
  Object.assign({id:'set:'+rent+'@2026-11-27',k:'spend',date:'2026-11-27',acct:bank,a:80000,settles:[{s:rent,due:'2026-11-27'}]},st('2026-11-29T08:10:00.000+09:00','k7qzpa')),
  Object.assign({id:'k7qzpa-p9x2m4q7ra-3',k:'spend',date:'2026-11-28',acct:bank,a:1200,line:food,src:{type:'typed'}},st('2026-11-28T12:30:00.000+09:00','k7qzpa'))]};
const j=S.sync(base,mineP,mineD);
const liveOut=j.events.filter(e=>!e.gone).reduce((t,e)=>t+e.a,0);
console.log('joined live events:', j.events.filter(e=>!e.gone).map(e=>e.id+' '+e.a).join(', '));
console.log('money out of the bank after sync:', liveOut, '(real: 81200)');
const settledBy={}; for(const e of j.events.filter(e=>!e.gone)) for(const s of e.settles||[]) (settledBy[s.s+'@'+s.due]=settledBy[s.s+'@'+s.due]||[]).push(e.id);
console.log('occurrences settled by more than one live record:', JSON.stringify(Object.entries(settledBy).filter(([k,v])=>v.length>1)));
console.log('questions after sync:', JSON.stringify(S.afterSync(j)));
console.log('possible doubles (H9):', JSON.stringify(MT.possibleDoubles(j.events.map(e=>({...e,dir:'out',src:e.src&&e.src.type==='statement'?'statement':'typed'})))));
