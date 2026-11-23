// One device away for several of the other's syncs (three weeks without opening the desktop), then back.
const F=require('./fuzz_copy.js');
const S=require('/home/user/money-headache-remover/wip/team/foundation_review/rules/sync_v1_ref');
const M=require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref');
const C=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x)), canon=S.canon, MIN=60000;
const N=Number(process.argv[2]||500); let failed=0; const stats={}; const QH={}; const bump=k=>stats[k]=(stats[k]||0)+1;
for(let seed=1;seed<=N;seed++){
  const r=F.rngOf(seed*7919+13), set=F.setup(r), fails=[];
  const ctx={r,seed,A:set.A,goals:set.goals,budgets:set.budgets,lines:new Set(),fail:(w,d)=>fails.push(w+' '+d)};
  const ops=F.makeOps(ctx), names=Object.keys(F.WEIGHTS), tot=names.reduce((t,k)=>t+F.WEIGHTS[k],0);
  const choose=()=>{let x=r.next()*tot;for(const k of names){x-=F.WEIGHTS[k];if(x<0)return k;}return names[0];};
  let cloud={rev:1,copy:C(set.copy)}; let clock=Date.parse('2026-11-23T01:00:00Z');
  const devs={phone:F.device(r,'phone'),desktop:F.device(r,'desktop')};
  for(const d of Object.values(devs)){d.copy=C(cloud.copy);d.base=C(cloud.copy);d.baseRev=1;d.lastSeen=M.newestAt(cloud.copy);}
  const touched={phone:new Map(),desktop:new Map()};
  const edit=(d,n)=>{for(let i=0;i<n;i++){d.now+=r.int(5,60*36)*MIN;const op=choose(),before=C(d.copy),bq=new Set(F.oneDeviceQuestions(d.copy)),bn=d.n,bs=d.lastSeen;let it;
    try{it=ops[op](d);}catch(e){fails.push('threw '+op);it=null;}
    const aq=it?F.oneDeviceQuestions(d.copy):[]; if(!it||aq.some(q=>!bq.has(q))){d.copy=before;d.n=bn;d.lastSeen=bs;continue;}
    for(const x of it) if(x.list!=='kept') touched[d.name].set(F.keyOfItem(x),{it:x,v:C(F.itemIn(d.copy,x))});}};
  const sync=d=>{const x=S.syncDevice({copy:d.copy,base:d.base,baseRev:d.baseRev},cloud);Object.assign(d,x.device);cloud=x.cloud;d.lastSeen=[d.lastSeen,M.newestAt(d.copy)].sort((a,b)=>Date.parse(b)-Date.parse(a))[0];};
  // the desktop edits once, then is away while the phone does 2 to 4 rounds of edit, sync, answer
  devs.desktop.now=clock+r.int(10,600)*MIN; edit(devs.desktop,r.int(1,8));
  const away=r.int(2,4);
  for(let k=0;k<away;k++){const p=devs.phone;p.now=Math.max(p.now,clock)+r.int(60,60*24*7)*MIN;edit(p,r.int(1,8));sync(p);
    let g=0;while(g++<25){const qs=S.afterSync(p.copy).questions;if(!qs.length)break;p.now+=MIN;F.answerQuestion(ctx,p,qs[0]);sync(p);} clock=p.now;
    // the phone's own later edits replace its earlier ones as what must survive
  }
  // phone's touched: only its latest version matters (it saw its own edits); refresh to what the cloud holds now
  for(const [k,x] of touched.phone) x.v=C(F.itemIn(cloud.copy,x.it));
  const D0=C(devs.desktop.copy);
  devs.desktop.now=clock+MIN; sync(devs.desktop);
  const qs=S.afterSync(cloud.copy).questions; QH[qs.length]=(QH[qs.length]||0)+1; for(const q of qs) bump('q '+q.q);
  const final=cloud.copy;
  for(const [key,x] of touched.desktop){const v=F.itemIn(D0,x.it),f=F.itemIn(final,x.it); if(v===undefined||S.same(v,f))continue;
    const kk=(final.kept||[]).find(y=>y.id==='kept:'+key); if(!kk||!kk.versions.some(y=>S.same(y,v))) fails.push('desktop edit lost '+key); else if(!kk.ask && !(v.src&&v.src!=='person')) fails.push('desktop edit kept not asked '+key);}
  // what only the phone changed while the desktop was away must not be asked
  for(const q of qs) if(q.q==='which'){const key=q.of; if(!touched.desktop.has(key)) fails.push('asked about an item only the phone changed '+key);}
  for(const nm of ['phone']) for(const [key,x] of touched[nm]){const f=F.itemIn(final,x.it); if(x.v!==undefined && !S.same(x.v,f)){const kk=(final.kept||[]).find(y=>y.id==='kept:'+key); if(!kk||!kk.versions.some(y=>S.same(y,x.v))) fails.push('phone edit lost '+key);}}
  if(fails.length){failed++; if(failed<=5) console.log('seed',seed,fails.slice(0,3));}
}
console.log('questions when the desktop comes back (count: seeds):',JSON.stringify(QH),JSON.stringify(stats));
console.log(failed?`FAILED ${failed} of ${N}`:`All ${N} passed`);
