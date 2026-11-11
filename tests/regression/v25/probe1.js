const vm=require('vm'),fs=require('fs');
const ctx=vm.createContext({console,Math,JSON,Date});
vm.runInContext(fs.readFileSync('/home/claude/work/team/model.js','utf8'),ctx);
console.log(vm.runInContext(`(function(){
 const S=presetState('$'); const g=S.plan.goals.find(x=>!x.emergency)||S.plan.goals[0];
 g.target=3000; g.start=0; g.due='2027-03-20';
 const C0=calcAll(S);
 const rows=ms=>ms.map(ym=>{const m=C0.byYm[ym]; return ym+' planned '+m.g[g.id].planned+' actual '+m.g[g.id].actual+' bal '+m.bal[g.id]+' spent '+m.spent[g.id]}).join('\\n');
 let out='DEFAULT\\n'+rows(['2027-01','2027-02','2027-03','2027-04','2027-05']);
 setVal(S,'goal:'+g.id,'2026-11',400,'after');
 const C1=calcAll(S); const r=ms=>ms.map(ym=>{const m=C1.byYm[ym]; return ym+' planned '+m.g[g.id].planned+' actual '+m.g[g.id].actual+' bal '+m.bal[g.id]+' spent '+m.spent[g.id]+' state '+goalInfo(S,C1,g.id,ym).state}).join('\\n');
 out+='\\nWITH OWN 400/mo STEP\\n'+r(['2027-01','2027-02','2027-03','2027-04','2027-05','2028-10']);
 return out;})()`,ctx));
