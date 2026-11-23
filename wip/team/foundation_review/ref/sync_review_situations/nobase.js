const S=require('/home/user/money-headache-remover/wip/team/foundation_review/rules/sync_v1_ref');
const mk=(p,t)=>{const st={told:t,at:t,by:p};const b=p+'-m2xq7ab9zt-1';return {v:3,rev:1,at:t,
 home:{country:{v:'JP',at:t,by:p},main:{v:{acct:b,min:null},at:t,by:p}},
 accounts:[{id:b,kind:'bank',name:'Bank',...st}],
 schedules:[{id:p+'-m2xq7ab9zt-2',kind:'income',name:'Pay',acct:b,rules:[{from:'2026-11-01',rule:{every:'month',days:[10]},at:t,by:p}],steps:[{from:'2026-11-01',amount:250000,at:t,by:p}],...st}],
 events:[{id:p+'-m2xq7ab9zt-3',k:'open',acct:b,date:t.slice(0,10),a:400000,...st}]};};
const phone=mk('k7qzpa','2026-11-20T09:00:00.000+09:00'), desk=mk('w3hmxd','2026-11-22T21:00:00.000+09:00');
// the desktop, set up on its own, turns the cloud on: no base, the cloud holds the phone's copy
const r=S.syncDevice({copy:desk,base:undefined,baseRev:0},{rev:5,copy:phone});
const c=r.device.copy;
console.log('accounts',c.accounts.length,'pay schedules',c.schedules.length,'opening figures',c.events.filter(e=>e.k==='open').map(e=>e.a));
console.log('questions',JSON.stringify(S.afterSync(c).questions));
