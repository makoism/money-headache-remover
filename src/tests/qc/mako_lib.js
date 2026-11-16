const { phone, w } = require('/tmp/v39/real.js');
exports.w=w;
exports.open=async(o)=>{ const r=await phone(o); await r.p.goto('file:///home/claude/work/money-map-team.html?nocard',{waitUntil:'load'});await w(2500); return r;};
exports.dump=async(p,n=1500)=>p.evaluate((n)=>({t:document.querySelector('#tourBody').innerText.slice(0,n), inp:[...document.querySelectorAll('#tourBody input,#tourBody select,#tourBody button,#tourBody textarea')].filter(e=>e.offsetParent).map(e=>(e.id||e.className)+'['+(e.type||'')+']'+(e.value||e.innerText||'').replace(/\n/g,' ').slice(0,30)).slice(0,60)}),n);
