/* ===== statements to numbers =====
   Pure functions, no DOM. Claude does two small, fixed-shape jobs: each file becomes a table of rows (date, text, amount, in or out),
   and each merchant gets one category word. Everything else is arithmetic here, so the page can show it and a test can check it.
   Vocabulary: pay, other_income, transfer_in (own money arriving), rent, util, food, net, phone, ins, subs, gas (transport), loan,
   card_payment (the bank paying the card bill: never a bill, the card's own rows carry the spending), transfer_out, cash (ATM), play, other.
   Files of one account (monthly PDFs, a CSV plus a PDF) are one account: its months are averaged, never added; accounts are added up. */
const STMT_CATS = ['pay', 'other_income', 'transfer_in', 'rent', 'util', 'food', 'net', 'phone', 'ins', 'subs', 'gas', 'loan', 'card_payment', 'transfer_out', 'cash', 'play', 'other'];
const STMT_BILL_CATS = ['rent', 'util', 'food', 'net', 'phone', 'ins', 'gas'];
const STMT_CAT_LABEL = { pay: 'Pay', other_income: 'Other income', transfer_in: 'Own money in', rent: 'Rent', util: 'Utilities', food: 'Food', net: 'Internet', phone: 'Phone', ins: 'Insurance', subs: 'Subscription', gas: 'Transport', loan: 'Loan', card_payment: 'Card payment', transfer_out: 'Transfer out', cash: 'Cash', play: 'Play money', other: 'Other' };
const STMT_MAX_ROWS = 600, STMT_MAX_MERCHANTS = 160;

/* the merchant key: letters only, the first few words (or the first twelve characters where there are no spaces) */
function stmtNorm(text) {
  let s = String(text || '').toLowerCase().replace(/[0-9*#]+/g, ' ').replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '?';
  const words = s.split(' ').slice(0, 3); s = words.join(' ');
  if (words.length === 1 && s.length > 12) s = s.slice(0, 12);
  return s;
}
const stmtMonthOf = d => d.slice(0, 7);
const stmtDaysIn = ym => new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
const stmtValidDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d + 'T00:00:00').getTime()) && d.slice(5, 7) >= '01' && d.slice(5, 7) <= '12';
const stmtAddMonths = (ym, n) => { const y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; return `${y + Math.floor(m / 12)}-${String((m % 12 + 12) % 12 + 1).padStart(2, '0')}`; };

/* one file's answer, checked: bad rows dropped, dates in order, a period worked out when the file gave none */
function stmtCleanRows(obj, fileName, today) {
  const o = obj && typeof obj === 'object' ? obj : {};
  const kind = ['bank', 'ewallet', 'card'].indexOf(o.kind) >= 0 ? o.kind : 'unknown';
  const rows = [];
  (Array.isArray(o.rows) ? o.rows : []).slice(0, STMT_MAX_ROWS).forEach(r => {
    if (!r || typeof r !== 'object') return;
    const a = Math.round(+r.amount * 100) / 100, d = String(r.date || '').slice(0, 10), dir = r.dir === 'in' ? 'in' : r.dir === 'out' ? 'out' : '';
    if (!(a > 0) || a > 1e9 || !stmtValidDate(d) || !dir) return;
    if (today && d > stmtAddMonths(today.slice(0, 7), 1) + '-01') return; /* a date in the far future is a misread */
    const t = String(r.text || '').replace(/\s+/g, ' ').trim().slice(0, 80) || '(no description)';
    rows.push({ d, t, a, dir, k: stmtNorm(t), f: fileName });
  });
  rows.sort((x, y) => x.d < y.d ? -1 : x.d > y.d ? 1 : 0);
  let from = o.period && stmtValidDate(String(o.period.from || '').slice(0, 10)) ? String(o.period.from).slice(0, 10) : '';
  let to = o.period && stmtValidDate(String(o.period.to || '').slice(0, 10)) ? String(o.period.to).slice(0, 10) : '';
  if (rows.length) { if (!from || from > rows[0].d) from = rows[0].d; if (!to || to < rows[rows.length - 1].d) to = rows[rows.length - 1].d; }
  const closing = o.closing_balance === null || o.closing_balance === undefined || o.closing_balance === '' ? null : (isFinite(+o.closing_balance) ? Math.round(+o.closing_balance * 100) / 100 : null);
  return { file: fileName, account: String(o.account || '').replace(/\s+/g, ' ').trim().slice(0, 60), kind, currency: String(o.currency || '').trim().slice(0, 8), from, to, closing, rows,
    notes: (Array.isArray(o.notes) ? o.notes : []).map(n => String(n).replace(/\s+/g, ' ').trim().slice(0, 140)).filter(Boolean).slice(0, 4) };
}
/* the months a read covers in full: the period reaches the first and the last day of the month */
function stmtMonths(read) {
  if (!read.from || !read.to) return { full: [], partial: [] };
  const full = [], partial = [];
  let ym = stmtMonthOf(read.from); const last = stmtMonthOf(read.to);
  for (let i = 0; i < 36 && ym <= last; i++, ym = stmtAddMonths(ym, 1)) {
    const first = ym + '-01', end = ym + '-' + String(stmtDaysIn(ym)).padStart(2, '0');
    (read.from <= first && read.to >= end ? full : partial).push(ym);
  }
  return { full, partial };
}
/* the same statement uploaded twice, or a CSV and a PDF of the same month: identical rows of one account are kept once.
   The same row on two different accounts (two cards charged the same amount the same day) is two transactions. */
function stmtMerge(reads) {
  const rows = []; let dupes = 0;
  stmtGroups(reads).forEach(g => { const seen = new Set(); g.reads.forEach(r => r.rows.forEach(x => { const key = `${x.d}|${x.a}|${x.dir}|${x.k}`; if (seen.has(key)) { dupes++; return; } seen.add(key); rows.push(x); })); });
  rows.sort((x, y) => x.d < y.d ? -1 : x.d > y.d ? 1 : 0);
  return { rows, dupes };
}
/* merchants, for the category job: the rows grouped by key, biggest first */
function stmtMerchants(rows) {
  const m = {};
  rows.forEach(r => { const g = m[r.k] || (m[r.k] = { k: r.k, name: r.t, n: 0, inTotal: 0, outTotal: 0, months: {}, samples: [], days: [] }); g.n++; g[r.dir === 'in' ? 'inTotal' : 'outTotal'] += r.a; g.months[stmtMonthOf(r.d)] = (g.months[stmtMonthOf(r.d)] || 0) + 1; if (g.samples.length < 3 && g.samples.indexOf(r.t) < 0) g.samples.push(r.t); g.days.push(+r.d.slice(8, 10)); });
  return Object.values(m).map(g => Object.assign(g, { months: Object.keys(g.months).sort(), inTotal: Math.round(g.inTotal * 100) / 100, outTotal: Math.round(g.outTotal * 100) / 100 })).sort((a, b) => (b.inTotal + b.outTotal) - (a.inTotal + a.outTotal));
}
const stmtMedian = xs => { if (!xs.length) return 0; const s = xs.slice().sort((a, b) => a - b), h = Math.floor(s.length / 2); return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const stmtTypicalDay = days => { if (!days.length) return 0; return Math.round(stmtMedian(days)); };
const stmtOrd = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const stmtWhole = (x, cents) => cents ? Math.round(x * 100) / 100 : Math.round(x);

/* the reads of one account, together: a card's monthly PDFs, or a bank's CSV plus a PDF, are one account whose months are averaged,
   never added. The transaction dates decide, not file names: two reads of the same kind are one account when their periods do not
   overlap (consecutive statements), or when they overlap and are the same statement twice (the same name printed, or half or more
   of the smaller one's rows repeated). Two different account numbers (four digits or more, as printed) always mean two accounts. */
const stmtAccNorm = a => String(a || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function stmtSameAccount(a, b) {
  const ka = a.kind === 'unknown' ? b.kind : a.kind, kb = b.kind === 'unknown' ? a.kind : b.kind; if (ka !== kb) return false;
  const na = stmtAccNorm(a.account), nb = stmtAccNorm(b.account);
  const da = na.match(/\d{4,}/g) || [], db = nb.match(/\d{4,}/g) || [];
  if (da.length && db.length) return da.some(d => db.indexOf(d) >= 0);
  const apart = !a.from || !b.from || !a.to || !b.to || a.to < b.from || b.to < a.from;
  if (apart) return true;
  if (na && na === nb) return true;
  const keys = new Set(a.rows.map(r => `${r.d}|${r.a}|${r.dir}|${r.k}`)), small = Math.min(a.rows.length, b.rows.length) || 1;
  return b.rows.filter(r => keys.has(`${r.d}|${r.a}|${r.dir}|${r.k}`)).length * 2 >= small;
}
/* the months an account covers, from its statements' periods joined end to end: a month inside the joined run is full
   (statements that close on the 15th still add up to whole months), a month only touched is partial */
function stmtGroupMonths(reads) {
  const spans = reads.filter(r => r.from && r.to).map(r => ({ from: r.from, to: r.to })).sort((x, y) => (x.from < y.from ? -1 : x.from > y.from ? 1 : 0));
  const runs = []; const next = d => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };
  spans.forEach(sp => { const last = runs[runs.length - 1]; if (last && sp.from <= next(last.to)) { if (sp.to > last.to) last.to = sp.to; } else runs.push({ from: sp.from, to: sp.to }); });
  const full = [], partial = [];
  runs.forEach(run => { const mo = stmtMonths(run); mo.full.forEach(m => { if (full.indexOf(m) < 0) full.push(m); }); mo.partial.forEach(m => { if (partial.indexOf(m) < 0) partial.push(m); }); });
  return { full: full.sort(), partial: partial.filter(m => full.indexOf(m) < 0).sort() };
}
function stmtGroups(reads) {
  const groups = [];
  reads.forEach(r => {
    const hits = groups.filter(g => g.reads.some(x => stmtSameAccount(x, r)));
    let x = hits[0];
    if (!x) { x = { reads: [] }; groups.push(x); }
    else hits.slice(1).forEach(h => { x.reads = x.reads.concat(h.reads); groups.splice(groups.indexOf(h), 1); }); /* a read that bridges two groups makes them one */
    x.reads.push(r);
  });
  groups.forEach(x => {
    x.files = {}; x.reads.forEach(r => { x.files[r.file] = true; });
    const mo = stmtGroupMonths(x.reads); x.full = mo.full; x.partial = mo.partial;
    x.kind = x.reads.some(r => r.kind === 'card') ? 'card' : (x.reads.map(r => r.kind).find(k => k !== 'unknown') || 'unknown');
    x.account = x.reads.map(r => r.account).filter(Boolean).sort((p, q) => q.length - p.length)[0] || '';
  });
  return groups;
}
/* the monthly amount of a category inside one account, over the months it covers in full (or its partial months when it has none):
   spending is the plain average, so a bill paid every other month lands at half; money in counts only when it shows up in most months,
   so a one-off payout is a question, not income */
function stmtTypical(group, rows, want, pred) {
  const months = group.full.length ? group.full : group.partial, partial = !group.full.length;
  if (!months.length) return { a: 0, partial: true, months: [] };
  const per = months.map(ym => rows.filter(r => group.files[r.f] && stmtMonthOf(r.d) === ym && pred(r)).reduce((s, r) => s + r.a, 0));
  const income = want === 'pay' || want === 'other_income' || want === 'transfer_in';
  if (income) { const seen = per.filter(x => x > 0).length; return { a: seen >= Math.ceil((months.length + 1) / 2) ? stmtMedian(per) : 0, partial, months }; }
  return { a: per.reduce((s, x) => s + x, 0) / per.length, partial, months };
}
/* everything the review needs, from the reads and a category per merchant key */
function stmtNumbers(reads, catOf, today) {
  const merged = stmtMerge(reads), rows = merged.rows, cents = rows.some(r => r.a % 1 !== 0);
  const cat = r => { const c = catOf(r.k); return STMT_CATS.indexOf(c) >= 0 ? c : (r.dir === 'in' ? 'other_income' : 'other'); };
  const groups = stmtGroups(reads), money = groups.filter(g => g.kind !== 'card'), cards = groups.filter(g => g.kind === 'card');
  const sum = (list, want) => list.reduce((s, g) => s + stmtTypical(g, rows, want, x => x.dir === (want === 'pay' || want === 'other_income' || want === 'transfer_in' ? 'in' : 'out') && cat(x) === want).a, 0);
  const out = { summary: '', pay: null, how: '', other: null, balance: null, bills: {}, notes: {}, subs: [], loans: [], card: null, questions: [], skipped: [], meta: { files: [], dupes: merged.dupes, rows: rows.length, cents } };
  /* pay and other income: from the accounts money arrives in */
  const pay = sum(money, 'pay'); if (pay > 0) out.pay = stmtWhole(pay, cents);
  const payRows = rows.filter(r => r.dir === 'in' && cat(r) === 'pay');
  if (payRows.length) {
    const days = payRows.map(r => +r.d.slice(8, 10)).sort((a, b) => a - b), months = {}; payRows.forEach(r => { months[stmtMonthOf(r.d)] = (months[stmtMonthOf(r.d)] || 0) + 1; });
    const perMonth = stmtMedian(Object.values(months));
    if (perMonth >= 2) { const lo = days.filter(d => d <= 15), hi = days.filter(d => d > 15); out.how = `twice a month, around the ${stmtOrd(stmtTypicalDay(lo) || stmtTypicalDay(days))} and the ${stmtOrd(stmtTypicalDay(hi) || stmtTypicalDay(days))}`; }
    else out.how = `once a month, around the ${stmtOrd(stmtTypicalDay(days))}`;
  }
  const other = sum(money, 'other_income'); if (other > 0) out.other = stmtWhole(other, cents);
  /* balance: the latest closing balance of each account that holds money, added up */
  const latest = money.map(g => g.reads.filter(r => r.closing !== null && r.to).sort((x, y) => (x.to < y.to ? 1 : x.to > y.to ? -1 : 0))[0]).filter(Boolean);
  if (latest.length) { out.balance = stmtWhole(latest.reduce((s, r) => s + r.closing, 0), cents); out.balanceDate = latest.map(r => r.to).sort().pop(); }
  /* bills: every account's own typical month, added up; the card's own rows carry what the bank only shows as one card payment */
  STMT_BILL_CATS.forEach(c => { const a = sum(groups, c); if (a > 0) { out.bills[c] = stmtWhole(a, cents); const names = stmtMerchants(rows.filter(r => r.dir === 'out' && cat(r) === c)).slice(0, 2); const day = stmtTypicalDay(rows.filter(r => r.dir === 'out' && cat(r) === c).map(r => +r.d.slice(8, 10))); out.notes[c] = names.map(m => m.name.slice(0, 24)).join(', ') + (names.length === 1 && day ? `, around the ${stmtOrd(day)}` : ''); } });
  /* subscriptions and loans: one line per merchant */
  const subsM = stmtMerchants(rows.filter(r => r.dir === 'out' && cat(r) === 'subs')), loanM = stmtMerchants(rows.filter(r => r.dir === 'out' && cat(r) === 'loan'));
  const perMerchant = m => { const per = {}; rows.filter(r => r.k === m.k && r.dir === 'out').forEach(r => { per[stmtMonthOf(r.d)] = (per[stmtMonthOf(r.d)] || 0) + r.a; }); return stmtMedian(Object.values(per)); };
  subsM.forEach(m => { const a = perMerchant(m); if (a > 0) out.subs.push({ n: m.name.slice(0, 40), a: stmtWhole(a, cents) }); });
  loanM.forEach(m => { const a = perMerchant(m); if (a > 0) out.loans.push({ n: m.name.slice(0, 40), a: stmtWhole(a, cents), e: '' }); });
  /* card: itemised when card statements are in, else the bank's card payments as one number */
  if (cards.length) { const a = sum(cards, 'play') + sum(cards, 'other') + sum(cards, 'cash'); if (a > 0) out.card = stmtWhole(a, cents); }
  else { const a = sum(money, 'card_payment'); if (a > 0) out.card = stmtWhole(a, cents); }
  /* questions: the recurring transfer out, and income seen only once */
  stmtMerchants(rows.filter(r => r.dir === 'out' && cat(r) === 'transfer_out')).slice(0, 2).forEach(m => { if (m.months.length >= 2 || groups.every(g => g.full.length <= 1)) { const a = perMerchant(m); if (out.pay === null || a >= out.pay * 0.05) out.questions.push({ t: `Is the ${stmtWhole(a, cents).toLocaleString()} sent to ${m.name.slice(0, 30)} each month something you want counted in your budget?`, r: '' }); } });
  const fullMonths = Math.max.apply(null, groups.map(g => g.full.length).concat([0]));
  stmtMerchants(rows.filter(r => r.dir === 'in' && cat(r) === 'other_income')).slice(0, 2).forEach(m => { if (m.months.length === 1 && fullMonths >= 2) out.questions.push({ t: `Is the ${stmtWhole(m.inTotal, cents).toLocaleString()} from ${m.name.slice(0, 30)} regular income?`, r: '' }); });
  out.questions = out.questions.slice(0, 4);
  /* what was left out, and what each file gave */
  reads.forEach(r => { const mo = stmtMonths(r), g = groups.find(x => x.files[r.file]); out.meta.files.push({ file: r.file, account: r.account, kind: r.kind, rows: r.rows.length, from: r.from, to: r.to, full: mo.full, partial: mo.partial, closing: r.closing }); r.notes.forEach(n => out.skipped.push(`${r.file}: ${n}`)); if (!mo.full.length && r.rows.length && !(g && g.full.length)) out.skipped.push(`${r.file} covers only part of a month (${r.from} to ${r.to}); its numbers come from that part.`); if (!r.rows.length) out.skipped.push(`${r.file}: no transactions could be read.`); });
  groups.filter(g => g.reads.length > 1).forEach(g => out.skipped.push(`${Object.keys(g.files).length} files are one account (${g.account || g.kind}): their months were put together, ${g.full.length ? g.full.length + (g.full.length === 1 ? ' full month' : ' full months') : 'part of a month'}, and averaged.`));
  if (merged.dupes) out.skipped.push(`${merged.dupes} repeated ${merged.dupes === 1 ? 'row was' : 'rows were'} counted once.`);
  out.skipped = out.skipped.slice(0, 8);
  const accs = groups.map(g => g.account || g.kind);
  const first = reads.map(r => r.from).filter(Boolean).sort()[0], last = reads.map(r => r.to).filter(Boolean).sort().pop();
  const monthName = ym => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4);
  const span = g => { const ms = g.full.length ? g.full : g.partial; if (!ms.length) return ''; const n = ms.length; return `${n === 1 ? monthName(ms[0]) : monthName(ms[0]) + ' to ' + monthName(ms[n - 1])} (${g.full.length ? n + (n === 1 ? ' full month' : ' full months') : 'part of ' + (n === 1 ? 'a month' : n + ' months')})`; };
  const spans = groups.map(span).filter(Boolean), same = spans.every(x => x === spans[0]);
  out.months = !spans.length ? '' : same ? `Monthly amounts are the average over ${spans[0]}.` : `Monthly amounts are the average over the months each account covers: ${groups.map(g => `${g.account || g.kind} ${span(g)}`).filter(x => !/ $/.test(x)).join('; ')}.`;
  out.summary = `${groups.length === 1 ? '1 account' : groups.length + ' accounts'}, ${reads.length} ${reads.length === 1 ? 'file' : 'files'} (${accs.slice(0, 3).join(', ')}${accs.length > 3 ? ' and more' : ''})${first && last ? `, ${first} to ${last}` : ''}: ${rows.length} transactions.` + (out.pay !== null ? ` Pay ${out.how}.` : ' No pay was found.') + (out.months ? ' ' + out.months : '');
  out.found = out.pay !== null || out.balance !== null || Object.keys(out.bills).length > 0 || out.subs.length > 0 || out.loans.length > 0 || out.card !== null;
  return out;
}
/* the spending rows as receipts, on the lines the page has; money arriving and the bank's card payments are not spending */
const STMT_LINE = { rent: 'bill:rent', util: 'bill:util', food: 'bill:food', net: 'bill:net', phone: 'bill:phone', ins: 'bill:ins', subs: 'bill:subs', gas: 'bill:gas', loan: 'bill:loan', play: 'envelope', cash: 'envelope', other: 'card' };
function stmtReceipts(rows, catOf) {
  const out = [];
  rows.forEach(r => { if (r.dir !== 'out') return; const c = catOf(r.k), line = STMT_LINE[c]; if (!line) return; out.push({ d: r.d, a: r.a, c: line, n: r.t, k: `${r.d}|${r.a}|${r.k}` }); });
  return out;
}
