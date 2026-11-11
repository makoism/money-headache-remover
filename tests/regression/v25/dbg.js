const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('/home/claude/work/team/model.js','utf8');
const ctx={console, Date, Math, JSON, encodeURIComponent, unescape, Set, Map, Array, Object, String, Number, isFinite, parseInt, parseFloat, RegExp};
vm.createContext(ctx);
vm.runInContext(src+'\n;this.__x={icsText};',ctx);
const ics=ctx.__x.icsText({freq:'weekly',day:3,time:'18:00',title:'Log receipts; fix, "money" \\ ok',details:'Line1\nLine2; with, punctuation 日本語のテスト ¥₱€ '+'x'.repeat(50),today:new Date(2026,10,11)});
console.log(JSON.stringify(ics.split('\r\n'),null,1));
const unf=ics.replace(/\r\n /g,'');
const e1='SUMMARY:Log receipts\; fix\\, "money" \\\\ ok\r\n';
console.log('has summary', unf.includes(e1));
const e2='DESCRIPTION:Line1\\nLine2\; with\\, punctuation 日本語のテスト ¥₱€ ';
console.log('has desc', unf.includes(e2));
console.log(JSON.stringify(unf.split('\r\n').filter(l=>/^(SUMMARY|DESCRIPTION)/.test(l))));
const line=unf.split('\r\n').find(l=>l.startsWith('SUMMARY'));
const exp=e1.replace(/\r\n$/,'');
console.log(line.length, exp.length, line===exp);
for(let i=0;i<Math.max(line.length,exp.length);i++){ if(line[i]!==exp[i]){console.log('diff at',i,JSON.stringify(line.slice(i-3,i+5)),JSON.stringify(exp.slice(i-3,i+5)));break;} }
console.log(JSON.stringify(unf.slice(unf.indexOf('SUMMARY'), unf.indexOf('SUMMARY')+60)));
