const S=require('/home/user/money-headache-remover/wip/team/foundation_review/rules/sync_v1_ref');
const t=h=>`2026-12-0${h}T09:00:00.000+09:00`;
const rent=(a,h,by)=>({id:'k7qzpa-m2xq7ab9zt-7',name:'Rent',amount:a,told:t(1),at:t(h),by});
const goal=(x,h,by)=>({id:'k7qzpa-m2xq7ab9zt-9',name:'Trip',target:x,told:t(1),at:t(h),by});
const b0={schedules:[rent(80000,1,'k7qzpa')],places:[goal(200000,1,'k7qzpa')],rev:1};
const c2={...b0,schedules:[rent(82000,2,'w3hmxd')],rev:2};          // desktop writes rent 82,000
const aCopy={...b0,places:[goal(300000,2,'k7qzpa')]};                  // phone offline changed the goal
const joined=S.sync(b0,aCopy,c2);                                      // phone takes rev 2 and joins
const c3={...c2,schedules:[rent(85000,3,'w3hmxd')],rev:3};          // desktop writes again before the phone's write lands
console.log('push refused:', !S.push({cloud:{rev:3},baseRev:2}).accepted);
const right=S.sync(c2,joined,c3), wrong=S.sync(b0,joined,c3);
console.log('retry, base = what it took:', JSON.stringify(S.afterSync(right).questions));
console.log('retry, base left as before:', JSON.stringify(S.afterSync(wrong).questions));
