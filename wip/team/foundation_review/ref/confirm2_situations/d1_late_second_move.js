// d1: the phone moves on 24 Nov and is used for a week; the desktop opens on 1 Dec and runs the move on the same 38.31 copy.
const R='/home/user/money-headache-remover/wip/team/foundation_review/rules/';
const {move}=require(R+'move_ref.js'); const {merge}=require(R+'merge_ref.js');
const copy={v:1,cfg:{bankStart:200000,bankAt:'2026-11-22'},ui:{cur:'¥',preset:'¥',done:{pay:true,bills:true,goals:true}},
 steps:{a:[{from:'2026-11',v:250000}]},
 plan:{lines:[{id:'rent',key:'bill:rent',jar:'nec',name:'Rent or mortgage',def:80000}],goals:[{id:'trip',name:'Trip',target:300000,start:100000,due:'2027-06'}]}};
// stamp like move_ref.stamp
function stamp(m, now, by){const rec=r=>Object.assign({told:m.saved},r,{at:now,by});
 for(const k of ['people','accounts','places','schedules','events']) m[k]=(m[k]||[]).map(rec);
 m.plan.shares=m.plan.shares.map(rec); m.plan.budgets=m.plan.budgets.map(rec); Object.assign(m.home,{at:now,by});
 for(const k of ['device','asks','unplaced','held','zero','rounded','sample','saved','frozen3831','pendingMove']) delete m[k]; return m;}
const phone=stamp(move({copy,answers:{cur:'JPY'},now:'2026-11-24T09:00:00.000+09:00',idb:{t:'2026-11-23T20:00:00.000+09:00'}}),'2026-11-24T09:00:00.000+09:00','phn001');
// a week of use on the phone: pay day answered, bank renamed, rent due day answered, goal money answered "another account" (simplified as a field)
const E='2026-11-25T08:00:00.000+09:00';
const pay=phone.schedules.find(s=>s.id==='mv:pay:steps.a'); pay.rules=[{from:'2026-11-24',rule:{every:'month',day:25},at:E,by:'phn001'}]; pay.at=E;
const bank=phone.accounts.find(a=>a.id==='mv:acct:cfg'); bank.name='Mizuho'; bank.at=E;
const rent=phone.schedules.find(s=>s.id==='mv:bill:rent'); rent.rules=[{from:'2026-11-24',rule:{every:'month',day:27},at:E,by:'phn001'}]; rent.at=E;
const trip=phone.places.find(p=>p.id==='mv:place:trip'); trip.target=350000; trip.at=E;
const desk=stamp(move({copy,answers:{cur:'JPY'},now:'2026-12-01T21:00:00.000+09:00',idb:{t:'2026-11-23T20:00:00.000+09:00'}}),'2026-12-01T21:00:00.000+09:00','dsk001');
const m=merge(phone,desk);
const g=(l,id)=>m[l].find(r=>r.id===id);
console.log('pay rules after merge:',JSON.stringify(g('schedules','mv:pay:steps.a').rules));
console.log('rent rules after merge:',JSON.stringify(g('schedules','mv:bill:rent').rules));
console.log('bank name:',g('accounts','mv:acct:cfg').name);
console.log('trip target:',g('places','mv:place:trip')&&g('places','mv:place:trip').target);
// the same, for a moved receipt the phone removed on 25 Nov
const copy2=JSON.parse(JSON.stringify(copy)); copy2.receipts=[{id:'r1',d:'2026-11-21',a:5000,c:'other',cn:'Other',n:'typed twice'}];
const p2=stamp(move({copy:copy2,answers:{cur:'JPY'},now:'2026-11-24T09:00:00.000+09:00',idb:{t:'2026-11-23T20:00:00.000+09:00'}}),'2026-11-24T09:00:00.000+09:00','phn001');
const r=p2.events.find(e=>e.id==='mv:rc:r1'); r.gone='2026-11-25'; r.at=E;
const d2=stamp(move({copy:copy2,answers:{cur:'JPY'},now:'2026-12-01T21:00:00.000+09:00',idb:{t:'2026-11-23T20:00:00.000+09:00'}}),'2026-12-01T21:00:00.000+09:00','dsk001');
const m2=merge(p2,d2); console.log('removed receipt after merge: gone =',m2.events.find(e=>e.id==='mv:rc:r1').gone);
// frozen3831 of two different 38.31 copies: what the merge keeps
const a={frozen3831:'{"phone copy"}'}, b={frozen3831:'{"desktop copy"}'};
console.log('frozen3831 on phone after merge:',merge(a,b).frozen3831,'| on desktop:',merge(b,a).frozen3831);
