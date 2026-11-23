/* ---------- the shared screen pieces, in short names (wip/team/screens/, lane D) ----------
   money.js writes and reads amounts, names.js gives every label and day, status.js the one verdict, inputs.js the one
   box behaviour, provenance.js the typed-or-sample mark, messages.js the one message band. No sums here. */
const SM = BurrowScreens.money, SN = BurrowScreens.names;
const money3 = (minor, cur) => SM.format(minor, cur);
/* a typed amount as whole minor units, or null (never rounded; a minus is refused) */
function typed3(text, cur) { const r = SM.parse(text, cur); return r.ok ? r.minor : null; }
/* '2026-12-10' as '10 Dec', with the year when it is not the shown day's year */
const day3 = (s, thisYear) => (s ? SN.dayLabel(s, !!thisYear && s.slice(0, 4) !== thisYear) : '');
const label3 = key => SN.label(key);
/* [S1] a period by its dates; on the day its pay lands and counts (res.period.payToday) it runs "to today's pay", never
   "10 Nov to 10 Dec" beside a safe to spend that already counts that pay */
const period3 = p => (p.payToday ? SN.periodLabel(p.start, p.end).split(' to ')[0] + ' to today\'s pay' : SN.periodLabel(p.start, p.end));
const esc3 = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/* a figure on screen: its engine path (data-figure, checked by names and provenance), its amount (data-amt) */
const fig3 = (path, minor, cur, tag) => `<${tag || 'span'} data-figure="${esc3(path)}" data-amt="${minor}">${money3(minor, cur)}</${tag || 'span'}>`;
const MSG3 = BurrowScreens.messages.createQueue();
const msg3 = text => MSG3.post({ kind: 'toast', key: 'a3', text });
