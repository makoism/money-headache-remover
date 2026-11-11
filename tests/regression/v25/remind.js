const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('/home/claude/work/team/model.js','utf8');
const ctx={console, Date, Math, JSON, encodeURIComponent, unescape, Set, Map, Array, Object, String, Number, isFinite, parseInt, parseFloat, RegExp};
vm.createContext(ctx);
vm.runInContext(src+'\n;this.__x={gcalUrl,outlookUrl,outlook365Url,yahooUrl,icsText,rruleOf,reminderTimesFor,nextMonthDay,nextWeekday,DOM_LAST};',ctx);
const X=ctx.__x; let bad=0, n=0;
const ok=(c,m)=>{n++; if(!c){bad++; console.log('FAIL',m);}};
const title='Log receipts; fix, "money" \\ ok', details='Line1\nLine2; with, punctuation 日本語のテスト ¥₱€ '+'x'.repeat(200);
const todays=[new Date(2026,10,11),new Date(2026,0,31),new Date(2026,1,28),new Date(2026,11,31),new Date(2028,1,29)];
for(const today of todays) for(const freq of ['daily','weekly','biweekly','monthly']) for(const day of [0,1,3,6]) for(const dom of [1,15,28,X.DOM_LAST]) for(const time of ['18:00','07:05','23:50','bad',undefined]){
  const o={freq,day,dom,time,title,details,today};
  const t=X.reminderTimesFor(o);
  ok(/^\d{8}T\d{6}$/.test(t.start)&&/^\d{8}T\d{6}$/.test(t.end),'stamp '+JSON.stringify(o));
  ok(t.end>t.start,'end after start '+freq+time);
  ok(t.start.slice(0,8)===t.end.slice(0,8),'same day '+freq+time);
  const ds=t.start.slice(0,8), d=new Date(+ds.slice(0,4),+ds.slice(4,6)-1,+ds.slice(6,8));
  const td=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  ok(d>=td,'not in past '+JSON.stringify([freq,day,dom,today])); 
  if(freq==='weekly'||freq==='biweekly') ok(d.getDay()===day,'weekday '+freq+day);
  if(freq==='monthly'){ if(dom===X.DOM_LAST){ const nx=new Date(d); nx.setDate(nx.getDate()+1); ok(nx.getDate()===1,'last day '+ds);} else ok(d.getDate()===dom,'dom '+ds+' '+dom); }
  if(freq==='daily') ok(d.getTime()===td.getTime(),'daily is today');
  const r=X.rruleOf(o);
  const exp=freq==='daily'?'FREQ=DAILY':freq==='monthly'?'FREQ=MONTHLY;BYMONTHDAY='+dom:freq==='biweekly'?'FREQ=WEEKLY;INTERVAL=2;BYDAY='+['SU','MO','TU','WE','TH','FR','SA'][day]:'FREQ=WEEKLY;BYDAY='+['SU','MO','TU','WE','TH','FR','SA'][day];
  ok(r===exp,'rrule '+r+' vs '+exp);
  const g=X.gcalUrl(o); ok(g.includes('recur='+encodeURIComponent('RRULE:'+r)),'gcal recur'); ok(g.includes('dates='+t.start+'/'+t.end),'gcal dates');
  ok(decodeURIComponent(g.split('text=')[1].split('&')[0])===title,'gcal title roundtrip');
  ok(decodeURIComponent(g.split('details=')[1].split('&')[0])===details,'gcal details roundtrip');
  const ou=X.outlookUrl(o); ok(ou.includes('startdt=')&&ou.startsWith('https://outlook.live.com/'),'outlook'); ok(X.outlook365Url(o).startsWith('https://outlook.office.com/'),'o365');
  const y=X.yahooUrl(o); ok(y.includes('st='+t.start)&&y.includes('dur=0030'),'yahoo');
  const ics=X.icsText(o);
  ok(ics.endsWith('\r\n')&&ics.startsWith('BEGIN:VCALENDAR'),'ics frame');
  const phys=ics.split('\r\n'); phys.pop();
  ok(phys.every(l=>Buffer.byteLength(l,'utf8')<=75),'ics line <=75 bytes: '+phys.filter(l=>Buffer.byteLength(l,'utf8')>75).length);
  const unf=ics.replace(/\r\n /g,'');
  ok(unf.includes('RRULE:'+r+'\r\n'),'ics rrule');
  const BS=String.fromCharCode(92); ok(unf.includes('SUMMARY:Log receipts'+BS+'; fix'+BS+', "money" '+BS+BS+' ok\r\n'),'ics summary escaped');
  ok(unf.includes('DESCRIPTION:Line1'+BS+'nLine2'+BS+'; with'+BS+', punctuation 日本語のテスト ¥₱€ '),'ics description escaped and not cut inside a character');
  ok(!/�/.test(ics),'no broken chars');
}
// Specific known cases
const T=new Date(2026,10,11); // Wed 11 Nov 2026
let t=X.reminderTimesFor({freq:'weekly',day:3,time:'18:00',today:T}); ok(t.start==='20261111T180000','weekly same-day Wed -> today '+t.start);
t=X.reminderTimesFor({freq:'monthly',dom:X.DOM_LAST,time:'09:00',today:T}); ok(t.start==='20261130T090000','last day Nov '+t.start);
t=X.reminderTimesFor({freq:'monthly',dom:1,time:'09:00',today:T}); ok(t.start==='20261201T090000','1st -> Dec 1 '+t.start);
t=X.reminderTimesFor({freq:'monthly',dom:28,time:'09:00',today:new Date(2026,1,28)}); ok(t.start==='20260228T090000','28 Feb same day '+t.start);
t=X.reminderTimesFor({freq:'monthly',dom:X.DOM_LAST,time:'09:00',today:new Date(2028,1,29)}); ok(t.start==='20280229T090000','leap last day '+t.start);
console.log(n+' checks, '+bad+' failures');
