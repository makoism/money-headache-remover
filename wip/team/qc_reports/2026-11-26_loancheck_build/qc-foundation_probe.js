const T='/home/user/money-headache-remover/.claude/worktrees/c6/wip/team/engine/';
const BB=require(T+'build_book.js'),LA=require(T+'lookahead.js'),IDS=require(T+'ids.js'),CK=require(T+'checkin.js');
function kenji(owed,pay){const newId=IDS.idMaker('k3f9aq');
 const out=BB.buildBook({day:'2026-11-20',told:'2026-11-20T03:00:00.000+00:00',currency:'JPY',country:'JP',banks:[{key:'bank1',name:'Main bank',amount:300000,main:true,min:null}],pays:[{key:'pay1',name:'Pay',bank:'bank1',amount:400000,every:'month',day:10,shift:'none',startsPeriod:true}],cards:[],bills:[],free:60000},{newId});
 const book=out.book||out,bank=book.accounts[0].id,loan=newId(),grp=newId();
 book.accounts.push({id:loan,name:'Car loan',type:'loan',cur:'JPY',owner:null,payDay:27,shift:'none',payFrom:bank,amount:pay});
 const told='2026-11-20T04:00:00.000+00:00';
 book.events.push({id:newId(),k:'open',acct:loan,date:'2026-11-20',a:owed,told,at:told,grp},{id:newId(),k:'check',acct:loan,date:'2026-11-20',a:owed,told,at:told,grp});
 const h={book,bank,loan,newId};
 h.ci=(day,x)=>{const r=CK.checkIn(h.book,Object.assign({day,told:day+'T03:00:00.000+00:00',newId,figures:{},ticked:[],unticked:[],expected:{}},x));h.book.events.push(...r.events);(h.book.checkins=h.book.checkins||[]).push(...r.checkins);return r;};
 h.tick=(day,due,a)=>h.ci(day,{ticked:[loan+'@'+due],expected:{[loan+'@'+due]:a||pay}});
 h.L=d=>{const o=LA.lookahead(h.book,d).owed[loan];return [o.owedNow,o.overdue.map(x=>x.payment_date+':'+x.amount).join(','),o.next&&o.next.payment_date+':'+o.next.amount];};
 return h;}
// near the end: check1 lowers owed below the usual payment, check2 answered No
let h=kenji(100000,30000); h.tick('2026-11-27','2026-11-27'); h.tick('2026-12-27','2026-12-27');
console.log('walk', h.L('2027-01-05'));
h.ci('2027-01-05',{figures:{[h.loan]:25000}}); console.log('after check1 25k', h.L('2027-02-03'));
h.ci('2027-02-03',{figures:{[h.loan]:25000},notYet:{[h.loan]:[h.loan+'@2027-01-27']}}); console.log('after check2 25k No', h.L('2027-02-03'));
h.tick('2027-02-05','2027-01-27',30000); console.log('after tick 30k', h.L('2027-02-05'));
// same case: big extra payment shown by check1 above the walk (interest) -> payment smaller than truth?
let g=kenji(100000,30000); g.tick('2026-11-27','2026-11-27'); g.tick('2026-12-27','2026-12-27');
g.ci('2027-01-05',{figures:{[g.loan]:45000}}); console.log('g check1 45k', g.L('2027-02-03'));
g.ci('2027-02-03',{figures:{[g.loan]:45000},notYet:{[g.loan]:[g.loan+'@2027-01-27']}}); console.log('g check2 No', g.L('2027-02-03'));
