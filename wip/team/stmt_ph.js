/* stmt_ph.js: Philippine statements read on the device, no AI call.
   Self-contained: it uses nothing from the other files and nothing here touches the page.
   Text in (as it comes out of a PDF, or a CSV), ledger-shaped rows out. Money is whole cents inside (c), never floats.
   A read is only trusted (ok: true) when the statement's own figures agree with the rows: the running balance
   chains row by row, and the totals and closing balance printed on the statement match. Anything else goes to the
   person or to the AI path, with the reason in read.why.
   Layouts and their sources: LANE_statements.md. Design and wiring: STATEMENTS_DESIGN.md. */

const PH_MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const PH_PROVIDERS = {
  gcash: { name: 'GCash', kind: 'ewallet', head: /gcash transaction history|\bgcash\b/i, words: ['gcash'] },
  maya: { name: 'Maya', kind: 'bank', head: /\bmaya\b|paymaya/i, words: ['maya'] },
  bdo: { name: 'BDO', kind: 'bank', head: /\bbdo\b|banco de oro/i, words: ['bdo'] },
  bpi: { name: 'BPI', kind: 'bank', head: /bank of the philippine islands|\bbpi\b/i, words: ['bpi'] },
  unionbank: { name: 'UnionBank', kind: 'bank', head: /union ?bank/i, words: ['unionbank', 'union bank'] },
  metrobank: { name: 'Metrobank', kind: 'bank', head: /metrobank|metropolitan bank/i, words: ['metrobank'] }
};
const PH_MONEY = /^\(?-?(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}\)?-?$/;

/* "1,234.50" "-1,234.50" "(1,234.50)" "1,234.50-" to whole cents; null when it is not money */
function phCents(s) {
  s = String(s === null || s === undefined ? '' : s).replace(/[₱\s]|PHP|Php/g, '');
  if (!PH_MONEY.test(s)) return null;
  const neg = /^\(|-/.test(s), p = s.replace(/[(),-]/g, '').split('.');
  const c = parseInt(p[0], 10) * 100 + parseInt(p[1], 10);
  return neg ? -c : c;
}
const phFmt = c => { const s = String(Math.abs(c)).padStart(3, '0'); return (c < 0 ? '-' : '') + s.slice(0, -2).replace(/\B(?=(\d{3})+$)/g, ',') + '.' + s.slice(-2); };
const phIso = (y, m, d) => { y = +y; m = +m; d = +d; if (y < 100) y += 2000; if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1990 && y <= 2100)) return ''; const t = new Date(Date.UTC(y, m - 1, d)); if (t.getUTCMonth() !== m - 1) return ''; return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; };
const phDays = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
const phHash = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); };
const phNorm = t => String(t || '').toLowerCase().replace(/[0-9*#]+/g, ' ').replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

/* a date at the start of a line. Returns { iso, rest } or { md: [month, day], rest } when no year is printed, or null.
   Philippine statements print month first when both are numbers (08/05/2026 is the 5th of August). */
function phLeadDate(line) {
  let m;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})\b/.exec(line))) { const iso = phIso(m[1], m[2], m[3]); return iso ? { iso, rest: line.slice(m[0].length) } : null; }
  if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/.exec(line))) { const iso = phIso(m[3], m[1], m[2]); return iso ? { iso, rest: line.slice(m[0].length) } : null; }
  if ((m = /^(\d{1,2})[- ]([A-Za-z]{3,9})[- ,]+(\d{4})\b/.exec(line))) { const mo = PH_MON[m[2].slice(0, 3).toLowerCase()], iso = mo ? phIso(m[3], mo, m[1]) : ''; return iso ? { iso, rest: line.slice(m[0].length) } : null; }
  if ((m = /^([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})\b/.exec(line))) { const mo = PH_MON[m[1].slice(0, 3).toLowerCase()], iso = mo ? phIso(m[3], mo, m[2]) : ''; return iso ? { iso, rest: line.slice(m[0].length) } : null; }
  if ((m = /^(\d{1,2})\/(\d{1,2})(?=\s)/.exec(line))) { return +m[1] >= 1 && +m[1] <= 12 && +m[2] >= 1 && +m[2] <= 31 ? { md: [+m[1], +m[2]], rest: line.slice(m[0].length) } : null; }
  if ((m = /^([A-Za-z]{3,9})\.? (\d{1,2})(?=\s)/.exec(line))) { const mo = PH_MON[m[1].slice(0, 3).toLowerCase()]; return mo && +m[2] >= 1 && +m[2] <= 31 ? { md: [mo, +m[2]], rest: line.slice(m[0].length) } : null; }
  return null;
}
/* any date inside a piece of text (for "Statement Date: January 08, 2026") */
function phAnyDate(s) {
  s = String(s || '');
  for (let i = 0; i < s.length; i++) { if (i && /[A-Za-z0-9]/.test(s[i - 1])) continue; const d = phLeadDate(s.slice(i) + ' '); if (d && d.iso) return d.iso; }
  return '';
}
/* a day and month with no year: the year comes from the statement date, never from the file name or today */
const phYearFor = (md, stmtIso) => { const y = +stmtIso.slice(0, 4), sm = +stmtIso.slice(5, 7); return phIso(md[0] > sm ? y - 1 : y, md[0], md[1]); };

/* the money figures at the end of a line, and the text before them */
function phTail(rest) {
  const tok = rest.trim().split(/\s+/), nums = []; let cr = false;
  while (tok.length) {
    const t = tok[tok.length - 1];
    if (/^(CR|DR)$/.test(t) && !nums.length) { if (t === 'CR') cr = true; tok.pop(); continue; }
    const c = phCents(t); if (c === null) break;
    nums.unshift(c); tok.pop();
  }
  return { text: tok.join(' '), nums, cr };
}
const phLabel = (lines, re) => { for (let i = 0; i < lines.length; i++) { const m = re.exec(lines[i]); if (m) { const t = phTail(lines[i]); if (t.nums.length) return t.nums[t.nums.length - 1]; } } return null; };
const phTailOf = s => { const d = String(s || '').replace(/[^0-9]/g, ''); return d.length >= 4 ? d.slice(-4) : ''; };

/* which provider and which kind of statement, from the top of the file only (rows name other banks) */
function phDetect(text) {
  const lines = String(text || '').split(/\r?\n/).slice(0, 14), head = lines.join('\n');
  let best = '', at = 1e9;
  Object.keys(PH_PROVIDERS).forEach(id => { const m = PH_PROVIDERS[id].head.exec(head); if (m && m.index < at) { at = m.index; best = id; } });
  if (/gcash transaction history/i.test(head)) best = 'gcash';
  const all = String(text || '').split(/\r?\n/), first = all.findIndex(l => { const d = phLeadDate(l.trim()); return d && phTail(d.rest).nums.length; });
  const card = /credit card statement|cardholder|card number|minimum amount due|payment due date/i.test(all.slice(0, first < 0 ? 30 : first).join('\n'));
  const csv = lines.filter(l => l.split(',').length >= 4).length >= 2;
  return { provider: best, card, csv, kind: card ? 'card' : best ? (best === 'maya' && /wallet/i.test(head) ? 'ewallet' : PH_PROVIDERS[best].kind) : 'unknown' };
}

/* the account's last four digits, from a labelled line or the phone number at the top */
function phAccountTail(lines) {
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const m = /(?:account|card|acct)\s*(?:number|no\.?|#)\s*[:,]?\s*([\dXx*][\dXx* -]{4,}[\dXx*])/i.exec(lines[i]); if (m) return phTailOf(m[1]);
  }
  for (let i = 0; i < Math.min(lines.length, 8); i++) { const m = /^(?:\+?63|0)9\d{9}$/.exec(lines[i].replace(/[\s-]/g, '')); if (m) return m[0].slice(-4); }
  return '';
}

/* one statement with a running balance, as text lines: GCash, Maya, BDO, BPI and Metrobank accounts */
function phReadTable(lines, det) {
  const raw = [], unread = []; let hasRef = false, started = false, last = null, periodEnd = '';
  for (let i = 0; i < Math.min(lines.length, 25) && !periodEnd; i++) { if (/period|covered|date range|from .* to /i.test(lines[i])) { const ds = lines[i].split(/\s+(?:to|-|–)\s+/).map(x => phAnyDate(x)).filter(Boolean); if (ds.length) periodEnd = ds[ds.length - 1]; } }
  const stop = /^(total|ending|closing|beginning|starting|opening|previous|balance|page \d|end of|this is|\*)/i;
  lines.forEach((line, n) => {
    const l = line.replace(/\s+/g, ' ').trim(); if (!l) return;
    if (!started && /balance/i.test(l) && /\bdate\b/i.test(l) && !phTail(l).nums.length) { hasRef = /\bref/i.test(l); started = true; return; }
    const d = phLeadDate(l);
    if (d && !phTail(d.rest).nums.length) { last = null; return; } /* a date with no money: the period line, a heading */
    if (d && d.md) { if (periodEnd) d.iso = phYearFor(d.md, periodEnd); else { unread.push({ n: n + 1, line: l }); last = null; return; } }
    if (!d || !d.iso) { if (started && last && !stop.test(l) && !phTail(l).nums.length) last.text += ' ' + l; else last = null; return; }
    let rest = d.rest.replace(/^\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?/i, m => { d.time = m.trim(); return ''; });
    const t = phTail(rest);
    if (t.nums.length < 2 || t.nums.length > 3) { unread.push({ n: n + 1, line: l }); last = null; return; }
    let ref = ''; if (hasRef) { const m = /\s([A-Za-z0-9-]*\d[A-Za-z0-9-]*)$/.exec(' ' + t.text); if (m && m[1].length >= 6) { ref = m[1]; t.text = t.text.slice(0, t.text.length - m[1].length).trim(); } }
    const r = { n: n + 1, date: d.iso, time: d.time || '', text: t.text.trim() || '(no description)', ref, bal: t.nums[t.nums.length - 1], c: 0, dir: '' };
    if (t.nums.length === 3) { if (t.nums[0] && !t.nums[1]) { r.c = Math.abs(t.nums[0]); r.dir = 'out'; } else if (t.nums[1] && !t.nums[0]) { r.c = Math.abs(t.nums[1]); r.dir = 'in'; } else { unread.push({ n: n + 1, line: l }); last = null; return; } }
    else { r.c = Math.abs(t.nums[0]); if (t.nums[0] < 0) r.dir = 'out'; } /* one amount column with a sign */
    raw.push(r); last = r; started = true;
  });
  const open = phLabel(lines, /^\s*(starting|beginning|opening|previous) balance|balance (forwarded|brought forward)/i);
  const meta = { opening: open, closing: phLabel(lines, /^\s*(ending|closing) balance/i), totalOut: phLabel(lines, /^\s*total (debits?|withdrawals?)/i), totalIn: phLabel(lines, /^\s*total (credits?|deposits?)/i) };
  return phFinishTable(raw, unread, meta, det, lines);
}

/* walk the running balance: each row must take the balance from the one before to its own, to the cent.
   That also gives the direction when the PDF text dropped the empty column. Tries oldest first, then newest first. */
function phChain(rows, open) {
  const walk = list => {
    let b = open, breaks = 0; const dirs = [];
    for (let i = 0; i < list.length; i++) {
      const r = list[i]; let dir = r.dir;
      if (b === null) { dir = dir || phGuess({ text: r.text, dir: '' }, 'bank').dirHint || ''; if (!dir) return null; }
      else if (b - r.c === r.bal && (!dir || dir === 'out')) dir = 'out';
      else if (b + r.c === r.bal && (!dir || dir === 'in')) dir = 'in';
      else { breaks++; dir = dir || (r.bal < b ? 'out' : 'in'); }
      dirs.push(dir); b = r.bal;
    }
    return { breaks, dirs };
  };
  const fwd = walk(rows), back = walk(rows.slice().reverse());
  if (fwd && (!back || fwd.breaks <= back.breaks)) return { order: 'oldest', rows, breaks: fwd.breaks, dirs: fwd.dirs };
  if (back) return { order: 'newest', rows: rows.slice().reverse(), breaks: back.breaks, dirs: back.dirs };
  return null;
}
function phFinishTable(raw, unread, meta, det, lines) {
  const read = phBlank(det, lines); read.unread = unread; read.opening = meta.opening;
  if (!raw.length) { read.why = 'no rows found'; return read; }
  const ch = phChain(raw, meta.opening);
  if (!ch) { read.why = 'no opening balance and no way to tell money in from money out'; read.rows = []; return read; }
  ch.rows.forEach((r, i) => { r.dir = ch.dirs[i]; });
  if (meta.opening === null) { const f = ch.rows[0]; read.opening = f.dir === 'out' ? f.bal + f.c : f.bal - f.c; read.notes.push('opening balance worked out from the first row'); }
  const sum = d => ch.rows.filter(r => r.dir === d).reduce((s, r) => s + r.c, 0);
  read.totalIn = sum('in'); read.totalOut = sum('out'); read.closing = ch.rows[ch.rows.length - 1].bal;
  read.checks = { chain: ch.breaks === 0, closing: meta.closing === null ? null : meta.closing === read.closing, totals: meta.totalIn === null && meta.totalOut === null ? null : (meta.totalIn === null || meta.totalIn === read.totalIn) && (meta.totalOut === null || meta.totalOut === read.totalOut), sum: read.opening + read.totalIn - read.totalOut === read.closing };
  read.order = ch.order;
  return phSeal(read, ch.rows);
}
function phBlank(det, lines) {
  const tail = phAccountTail(lines), p = PH_PROVIDERS[det.provider];
  return { ok: false, why: '', provider: det.provider || 'unknown', kind: det.kind, cur: 'PHP', tail, account: ((p ? p.name : 'Account') + (det.card ? ' card' : '') + (tail ? ' ••' + tail : '')), from: '', to: '', opening: null, closing: null, totalIn: 0, totalOut: 0, rows: [], unread: [], notes: [], checks: {} };
}
/* last steps for every reader: ids, guesses, the period from the rows' own dates, and the verdict */
function phSeal(read, rows) {
  const seen = {};
  rows.forEach(r => {
    const base = [read.provider, read.kind, read.tail, r.date, r.dir, r.c].join('|');
    let x = r.ref ? 'r' + r.ref : r.bal !== undefined && r.bal !== null ? 'b' + r.bal : 't' + (r.post || '') + phNorm(r.text);
    if (!r.ref && (r.bal === undefined || r.bal === null)) { seen[base + x] = (seen[base + x] || 0) + 1; x += '#' + seen[base + x]; }
    r.lid = 'ph1:' + read.provider + ':' + r.date + ':' + phHash(base + '|' + x);
    r.a = r.c / 100; r.acct = read.provider + (read.kind === 'card' ? '_card' : '') + (read.tail ? ':' + read.tail : '');
    const g = phGuess(r, read.kind); r.cat = g.cat; r.k = g.k; r.sub = g.sub; r.conf = g.conf;
  });
  read.rows = rows.slice().sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : 0);
  if (read.rows.length) { read.from = read.rows[0].date; read.to = read.rows[read.rows.length - 1].date; }
  const c = read.checks, bad = Object.keys(c).filter(k => c[k] === false);
  if (read.unread.length) read.why = read.unread.length + ' line(s) looked like rows but could not be read';
  else if (bad.length) read.why = 'the statement\'s own figures do not match the rows: ' + bad.join(', ');
  else if (c.chain === undefined && c.sum === undefined) read.why = 'nothing on the statement to check the rows against';
  read.ok = !read.why;
  read.proof = read.ok ? (c.chain && c.closing ? 'balance' : c.chain ? 'chain' : 'totals') : 'none';
  return read;
}

/* a CSV with named columns: UnionBank's Excel export saved as CSV, and any bank file with the same kind of header */
function phCsvRows(text) {
  const out = []; let row = [], cell = '', q = false; const s = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s[i + 1] === '\n') i++; row.push(cell); cell = ''; out.push(row); row = []; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); out.push(row); }
  return out.map(r => r.map(c => c.trim()));
}
function phReadCsv(text, det) {
  const rows = phCsvRows(text), lines = rows.map(r => r.join(' ')); let h = -1, col = {};
  const find = (hdr, re) => hdr.findIndex(c => re.test(c));
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const hdr = rows[i].map(c => c.toLowerCase());
    const c = { date: find(hdr, /^(transaction |posting |txn )?date/), text: find(hdr, /descri|details|particular|narrat|remark/), ref: find(hdr, /ref|check n/), out: find(hdr, /debit|withdraw/), in: find(hdr, /credit|deposit/), amt: find(hdr, /^amount/), bal: find(hdr, /balance/) };
    if (c.date >= 0 && (c.amt >= 0 || (c.out >= 0 && c.in >= 0))) { h = i; col = c; break; }
  }
  const read = phBlank(det, lines.slice(0, h < 0 ? 30 : h));
  if (h < 0) { read.why = 'no column names found'; return read; }
  const raw = [], unread = [];
  rows.slice(h + 1).forEach((r, i) => {
    if (!r.join('')) return;
    const d = phLeadDate((r[col.date] || '') + ' '), n = h + 2 + i, money = j => j >= 0 && r[j] ? phCents(/\.\d{2}\)?-?$/.test(r[j]) ? r[j] : r[j] + '.00') : null;
    if (!d || !d.iso) { if (/\d/.test(r[col.date] || '')) unread.push({ n, line: r.join(',') }); return; }
    const o = money(col.out), inn = money(col.in), a = money(col.amt); let c = 0, dir = '';
    if (o) { c = Math.abs(o); dir = 'out'; } else if (inn) { c = Math.abs(inn); dir = 'in'; } else if (a) { c = Math.abs(a); dir = a < 0 ? 'out' : 'in'; } else { unread.push({ n, line: r.join(',') }); return; }
    raw.push({ n, date: d.iso, time: '', text: (col.text >= 0 && r[col.text]) || '(no description)', ref: col.ref >= 0 ? r[col.ref] || '' : '', bal: money(col.bal), c, dir });
  });
  if (col.bal >= 0 && raw.length && raw.every(r => r.bal !== null)) return phFinishTable(raw, unread, { opening: null, closing: null, totalIn: null, totalOut: null }, det, lines.slice(0, h));
  read.unread = unread; read.totalIn = raw.filter(r => r.dir === 'in').reduce((s, r) => s + r.c, 0); read.totalOut = raw.filter(r => r.dir === 'out').reduce((s, r) => s + r.c, 0);
  read.notes.push('this file has no running balance, so the rows could not be checked against it');
  return phSeal(read, raw);
}

/* a credit card statement: previous balance, payments, purchases, fees, total due, cut-off and due date.
   On a card, a purchase is "out" (what is owed goes up) and a payment or credit is "in", the same as stmt.js. */
function phReadCard(lines, det) {
  const read = phBlank(det, lines), val = re => phLabel(lines, re);
  const dateOf = re => { for (let i = 0; i < lines.length; i++) { const m = re.exec(lines[i]); if (m) { const d = phAnyDate(lines[i].slice(m.index + m[0].length).replace(/^[\s:]+/, '')); if (d) return d; } } return ''; };
  read.stmtDate = dateOf(/statement date|cut-?off date/i); read.dueDate = dateOf(/payment due date|due date/i);
  read.prev = val(/previous (statement )?balance/i); read.due = val(/total amount due|total statement balance/i); read.min = val(/minimum (amount|payment) due/i);
  const pPay = val(/^\s*payments?\b.*credits?/i), pBuy = val(/^\s*purchases?\b/i), pFee = val(/^\s*(finance charges?|fees)\b/i);
  const raw = [], unread = []; read.instalments = [];
  lines.forEach((line, n) => {
    const l = line.replace(/\s+/g, ' ').trim(); if (!l) return;
    const d1 = phLeadDate(l); if (!d1) { const m = /^remaining instal+ment balance (.+?) ([\d,]+\.\d{2})$/i.exec(l); if (m) read.instalments.push({ text: m[1], left: phCents(m[2]) }); return; }
    if (/^(statement|payment|due|cut)/i.test(l)) return;
    const d2 = phLeadDate(d1.rest.trim()), t = phTail((d2 ? d2.rest : d1.rest));
    const iso = d => d.iso || (read.stmtDate ? phYearFor(d.md, read.stmtDate) : '');
    if (t.nums.length !== 1 || !iso(d1) || !t.text) { if (t.nums.length) unread.push({ n: n + 1, line: l }); return; }
    const credit = t.cr || t.nums[0] < 0, r = { n: n + 1, date: iso(d1), post: d2 ? iso(d2) : '', text: t.text.trim(), ref: '', bal: null, c: Math.abs(t.nums[0]), dir: credit ? 'in' : 'out' };
    const im = /instal+ment.*?(\d{1,2})\s*(?:\/|of)\s*(\d{1,2})$/i.exec(r.text); if (im) r.inst = { n: +im[1], of: +im[2], left: r.c * (+im[2] - +im[1]) };
    raw.push(r);
  });
  read.unread = unread; read.opening = read.prev;
  read.totalIn = raw.filter(r => r.dir === 'in').reduce((s, r) => s + r.c, 0); read.totalOut = raw.filter(r => r.dir === 'out').reduce((s, r) => s + r.c, 0);
  read.closing = read.prev === null ? null : read.prev + read.totalOut - read.totalIn;
  if (read.prev !== null && read.due !== null) read.checks.sum = read.closing === read.due;
  if (pPay !== null) read.checks.payments = Math.abs(pPay) === read.totalIn;
  if (pBuy !== null) read.checks.purchases = pBuy + (pFee || 0) === read.totalOut;
  if (!read.stmtDate && raw.some(r => !r.date)) read.why = 'no statement date to take the year from';
  raw.filter(r => r.inst).forEach(r => read.notes.push('instalment ' + r.inst.n + ' of ' + r.inst.of + ': ' + phFmt(r.inst.left) + ' more is owed and is not in this statement\'s balance'));
  const out = phSeal(read, raw);
  if (read.stmtDate) { out.to = read.stmtDate; if (!out.from || out.from > out.to) out.from = out.to; }
  return out;
}

/* the front door: any statement text or CSV. opts.provider overrides the guess when the person picked the account. */
function phRead(text, opts) {
  opts = opts || {}; const det = phDetect(text); if (opts.provider && PH_PROVIDERS[opts.provider]) { det.provider = opts.provider; if (!det.card) det.kind = PH_PROVIDERS[opts.provider].kind; }
  if (opts.kind === 'card') { det.card = true; det.kind = 'card'; }
  const lines = String(text || '').split(/\r?\n/);
  let read; try { read = det.card ? phReadCard(lines, det) : det.csv ? phReadCsv(text, det) : phReadTable(lines, det); } catch (e) { read = phBlank(det, lines); read.why = 'could not be read'; }
  read.file = opts.file || '';
  return read;
}

/* a first guess at what each row is, from words that are the same on every statement. cat is one of stmt.js's
   STMT_CATS; k and sub are the ledger's kind. conf under 0.6 means: ask (the AI gets the merchant name only). */
const PH_RULES = [
  [/reversal|reversed|refund|chargeback/, 'in', 'transfer_in', 'in', 'refund', 0.9],
  [/payroll|salary|sweldo|13th month/, 'in', 'pay', 'in', 'pay', 0.9],
  [/interest (earned|credit)|^interest/, 'in', 'other_income', 'in', 'interest', 0.9],
  [/withholding tax|tax withheld/, 'out', 'other', 'spend', 'tax', 0.9],
  [/atm withdrawal|cash[- ]?out|encash|over.the.counter withdrawal/, 'out', 'cash', 'transfer', 'cash out', 0.9],
  [/credit card|card payment/, 'out', 'card_payment', 'repay', 'card payment', 0.85],
  [/cash[- ]?in|deposit via|fund transfer from|transfer from|instapay (credit|transfer)|pesonet (credit|transfer)|inward remittance/, 'in', 'transfer_in', 'transfer', 'own money in', 0.6],
  [/received (gcash|money)|receive money/, 'in', 'other_income', 'in', 'from a person', 0.5],
  [/send money|sent gcash|express send/, 'out', 'transfer_out', 'spend', 'to a person', 0.5],
  [/instapay|pesonet|ibft|fund transfer|bank transfer|transfer .*\bto\b/, 'out', 'transfer_out', 'transfer', 'own money out', 0.6],
  [/service charge|\bfees?\b|finance charge|late payment/, 'out', 'other', 'spend', 'fee', 0.85],
  [/check deposit|cash deposit/, 'in', 'other_income', 'in', 'deposit', 0.4],
  [/meralco|maynilad|manila water|electric coop|veco\b/, 'out', 'util', 'spend', 'bill', 0.9],
  [/pldt|converge|sky ?cable|globe at home/, 'out', 'net', 'spend', 'bill', 0.9],
  [/buy load|globe|smart comm|\bdito\b|\btnt\b/, 'out', 'phone', 'spend', 'bill', 0.8],
  [/\bsss\b|philhealth|pag-?ibig|\bhdmf\b|insurance|sun life|pru life/, 'out', 'ins', 'spend', 'bill', 0.85],
  [/netflix|spotify|youtube|disney|apple\.com|google one|icloud|hbo/, 'out', 'subs', 'spend', 'bill', 0.9],
  [/home credit|billease|tala\b|sloan|spaylater|gloan|ggives|atome|amortization/, 'out', 'loan', 'repay', 'instalment', 0.8],
  [/grab|angkas|joyride|shell|petron|caltex|seaoil|easytrip|autosweep|beep|cebu pacific|philippine airlines/, 'out', 'gas', 'spend', 'spend', 0.75],
  [/supermarket|puregold|savemore|7-eleven|ministop|alfamart|landers|s&r|robinsons|jollibee|mcdonald|chowking|mang inasal/, 'out', 'food', 'spend', 'spend', 0.7],
  [/lazada|shopee|zalora|abenson|sm store|uniqlo/, 'out', 'play', 'spend', 'spend', 0.6]
];
function phGuess(row, kind) {
  const t = String(row.text || '').toLowerCase();
  if (kind === 'card') {
    if (row.dir === 'in') return /payment/.test(t) && !/reversal|refund/.test(t) ? { cat: 'transfer_in', k: 'repay', sub: 'card payment', conf: 0.95 } : { cat: 'transfer_in', k: 'in', sub: 'refund', conf: 0.9 };
    if (/finance charge|late payment|annual fee|\bfees?\b|interest/.test(t)) return { cat: 'other', k: 'spend', sub: 'fee', conf: 0.9 };
  }
  for (let i = 0; i < PH_RULES.length; i++) { const r = PH_RULES[i]; if (r[0].test(t) && (!row.dir || row.dir === r[1])) return { cat: r[2], k: r[3], sub: r[4], conf: r[5], dirHint: r[1] }; }
  return row.dir === 'in' ? { cat: 'other_income', k: 'in', sub: 'other', conf: 0.2 } : { cat: 'other', k: 'spend', sub: 'spend', conf: 0.2 };
}

/* many reads into one list. A line met twice (two statements that overlap, or the same file again) is kept once.
   known: the line ids already in the ledger (from each event's src); those rows come back flagged already: true. */
function phMerge(reads, known) {
  const seen = new Set(), had = new Set(known || []), rows = []; let dupes = 0, already = 0;
  (reads || []).forEach(rd => (rd.rows || []).forEach(r => { if (seen.has(r.lid)) { dupes++; return; } seen.add(r.lid); const x = Object.assign({}, r, { kind: rd.kind, file: rd.file || '' }); if (had.has(r.lid)) { x.already = true; already++; } rows.push(x); }));
  rows.sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : x.n - y.n);
  return { rows, dupes, already };
}

/* a charge and its reversal or refund, on the same account: same amount, opposite direction, the refund not earlier,
   and one word of the name in common. Both stay in the ledger (the balance needs them); neither is spending or income. */
function phPairReversals(rows) {
  const words = t => phNorm(t).split(' ').filter(w => w.length > 2 && !/^(reversal|reversed|refund|payment|from|the|pos|purchase)$/.test(w));
  let n = 0;
  rows.forEach(b => {
    if (b.rev || b.pair || b.sub !== 'refund') return;
    const wb = words(b.text); let best = null;
    rows.forEach(a => { if (a === b || a.rev || a.pair || a.acct !== b.acct || a.c !== b.c || a.dir === b.dir || a.date > b.date || phDays(a.date, b.date) > 60) return; if (!words(a.text).some(w => wb.indexOf(w) >= 0)) return; if (!best || a.date > best.date || (a.date === best.date && a.n > best.n)) best = a; });
    if (best) { best.rev = b.lid; b.rev = best.lid; n++; }
  });
  return n;
}

/* money moved between the person's own accounts: an "out" on one statement and an "in" of the same amount on another,
   0 to 3 days later (1 day earlier is allowed: banks post on different days). Both rows are marked; it is one transfer. */
function phPairTransfers(rows) {
  const names = r => { const p = PH_PROVIDERS[String(r.acct).split(/[_:]/)[0]]; return p ? p.words : []; };
  const says = (r, other) => { const t = String(r.text).toLowerCase(); return names(other).some(w => t.indexOf(w) >= 0) || (other.kind === 'card' && /credit card|card payment/.test(t)); };
  const outs = rows.filter(r => r.dir === 'out' && r.kind !== 'card' && !r.rev && (r.k === 'transfer' || r.k === 'repay' || r.cat === 'transfer_out'));
  const ins = rows.filter(r => r.dir === 'in' && !r.rev && (r.k === 'transfer' || r.k === 'repay' || r.cat === 'transfer_in') && r.sub !== 'refund');
  const cand = [];
  outs.forEach(o => ins.forEach(i => { if (o.acct === i.acct || o.c !== i.c) return; const gap = phDays(o.date, i.date); if (gap < -1 || gap > 3) return; const hint = (says(o, i) ? 1 : 0) + (says(i, o) ? 1 : 0); if (!hint && (o.sub === 'cash out' || o.sub === 'to a person')) return; cand.push({ o, i, score: hint * 10 - Math.abs(gap) }); }));
  cand.sort((x, y) => y.score - x.score); let n = 0;
  cand.forEach(c => { if (c.o.pair || c.i.pair) return; c.o.pair = c.i.lid; c.i.pair = c.o.lid; const card = c.i.kind === 'card'; c.o.k = c.i.k = card ? 'repay' : 'transfer'; c.o.sub = c.i.sub = card ? 'card payment' : 'own transfer'; c.o.cat = card ? 'card_payment' : 'transfer_out'; c.i.cat = 'transfer_in'; c.o.conf = c.i.conf = c.score >= 9 ? 0.95 : 0.7; n++; });
  return n;
}

/* rows that match something the person already logged by hand or by receipt (no line id to compare):
   same direction, same amount, within 3 days. Each logged event matches one row at most. Flagged maybe: true, never dropped. */
function phAlreadyLogged(rows, events) {
  const used = new Set(); let n = 0;
  rows.forEach(r => {
    if (r.already) return;
    const dir = e => (e.k === 'in' || e.k === 'borrow') ? 'in' : 'out';
    const j = (events || []).findIndex((e, idx) => !used.has(idx) && e && e.date && Math.round(+e.a * 100) === r.c && dir(e) === (r.kind === 'card' && r.dir === 'out' ? 'out' : r.dir) && Math.abs(phDays(e.date, r.date)) <= 3 && !(e.src && e.src.lid));
    if (j >= 0) { used.add(j); r.maybe = events[j].id || true; n++; }
  });
  return n;
}

/* the whole job after reading: merge, flag, pair. Returns what the review screen needs. */
function phPrepare(reads, known, events) {
  const m = phMerge(reads, known), rev = phPairReversals(m.rows), own = phPairTransfers(m.rows), maybe = phAlreadyLogged(m.rows, events);
  m.rows.forEach(r => { r.keep = !r.already && !r.maybe; });
  return { rows: m.rows, dupes: m.dupes, already: m.already, maybe, reversals: rev, transfers: own, totals: phTotals(m.rows) };
}
/* what really came in and went out: own transfers, card payments and reversed pairs are left out; refunds lower spending */
function phTotals(rows) {
  let inn = 0, out = 0, moved = 0, reversed = 0;
  rows.forEach(r => {
    if (r.already) return;
    if (r.rev) { reversed += r.c; return; }
    if (r.pair || r.k === 'transfer' || r.k === 'repay') { if (r.dir === 'out' || !r.pair) moved += r.c; return; }
    if (r.sub === 'refund') { out -= r.c; return; }
    if (r.kind === 'card') { if (r.dir === 'out') out += r.c; return; }
    if (r.dir === 'in') inn += r.c; else out += r.c;
  });
  return { in: inn, out, moved, reversed: reversed / 2 };
}

/* kept rows as ledger events (LEDGER_DESIGN.md fields). acctOf(row) gives the app's account id for a row.
   A paired transfer becomes one event with acct and acct2; every event carries src so the next import says "already logged". */
function phEvents(rows, acctOf) {
  const id = r => (acctOf ? acctOf(r) : '') || r.acct, by = {}; rows.forEach(r => { by[r.lid] = r; });
  const out = [];
  rows.forEach(r => {
    if (r.keep === false || r.already) return;
    const base = { date: r.date, a: r.c / 100, note: r.text, conf: r.conf };
    if (r.pair && by[r.pair] && by[r.pair].keep !== false) { if (r.dir !== 'out') return; const o = by[r.pair]; out.push(Object.assign(base, { k: r.k, sub: r.sub, acct: id(r), acct2: id(o), src: { t: 'stmt', lid: r.lid, lid2: o.lid } })); return; }
    const e = Object.assign(base, { k: r.k, sub: r.sub, acct: id(r), src: { t: 'stmt', lid: r.lid } });
    if (r.k === 'transfer' || r.k === 'repay') e.dir = r.dir; /* the other side is not in these statements: the app asks which account */
    if (r.rev) e.undoes = r.sub === 'refund' ? r.rev : undefined, e.reversed = true;
    if (r.inst) e.inst = r.inst;
    out.push(e);
  });
  return out;
}

/* ---------- privacy, on the device, before anything is sent ----------
   phMask takes statement text and returns it with account numbers, card numbers, phone numbers, emails, the owner's
   name and address taken out. Dates, merchant names and amounts stay. opts.names: more names to remove (the person's
   own name from setup, a partner's). found says how many of each were removed, for the screen. */
const PH_NAME_STOP = /\b(bank|statement|account|inc|card|credit|history|transaction|corporation|savings|unibank|maya|gcash|philippine|philippines|islands|trust|company|of|the|date|balance|total|page|number|period|currency|branch|type)\b/i;
function phMask(text, opts) {
  opts = opts || {}; const found = { name: 0, address: 0, phone: 0, card: 0, account: 0, email: 0, person: 0 };
  let lines = String(text || '').split(/\r?\n/);
  const firstRow = (() => { const i = lines.findIndex(l => phLeadDate(l.trim()) && phTail(l).nums.length); return i < 0 ? Math.min(lines.length, 30) : i; })();
  const names = (opts.names || []).slice();
  lines.slice(0, firstRow).forEach((l, i) => {
    const m = /(?:account name|cardholder(?: name)?|customer name|client name|name)\s*[:,\s]\s*(.+)$/i.exec(l);
    if (m && !/\d/.test(m[1])) names.push(m[1]);
    else if (i < 6 && /^[A-ZÑ][A-ZÑ.,' -]{4,40}$/.test(l.trim()) && l.trim().split(/\s+/).length >= 2 && l.trim().split(/\s+/).length <= 5 && !PH_NAME_STOP.test(l)) names.push(l.trim());
  });
  const toks = Array.from(new Set(names.join(' ').toUpperCase().split(/[^A-ZÑ]+/).filter(Boolean)));
  const nameRe = toks.filter(t => t.length > 1).length ? new RegExp('(?<![A-Za-zÑñ])(?:' + toks.filter(t => t.length > 1).join('|') + ')(?:[\\s,.]+(?:' + toks.join('|') + '|[A-ZÑ](?![A-Za-zÑñ]))\\.?)+(?![A-Za-zÑñ])', 'gi') : null;
  const addr = /\b(blk|block|lot|brgy|barangay|street|st\.|ave|avenue|subd|subdivision|village|bldg|building|unit|purok|sitio|phase|city|province|metro manila)\b|^[A-Za-zÑñ .,'-]+ \d{4}$/i;
  lines = lines.map((l, i) => {
    if (i < firstRow) {
      const a = /^(\s*(?:billing |mailing |home )?address\s*[:,]?\s*)(.+)$/i.exec(l);
      if (a) { found.address++; return a[1] + '[address]'; }
      if (!/[:]/.test(l) && !phTail(l).nums.length && addr.test(l) && !PH_NAME_STOP.test(l.replace(/\bcity\b/i, ''))) { found.address++; return '[address]'; }
    }
    return l;
  });
  let s = lines.join('\n');
  if (nameRe) s = s.replace(nameRe, () => { found.name++; return '[name]'; });
  s = s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, () => { found.email++; return '[email]'; });
  s = s.replace(/(?<![\d.,])(?:\+?63[\s-]?|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}(?![\d.,]\d)/g, () => { found.phone++; return '[phone]'; });
  s = s.replace(/(?<![\dA-Za-z.,])(?:[\dXx*]{4}[\s-]?){3}\d{4}(?![\d.,]\d)/g, m => { found.card++; return '[card ••' + m.slice(-4) + ']'; });
  s = s.replace(/((?:account|card|acct)\s*(?:number|no\.?|#)\s*[:,]?\s*)([\dXx*][\dXx* -]{4,}[\dXx*])/gi, (m, a, b) => { found.account++; return a + '••' + phTailOf(b); });
  s = s.replace(/(with account ending in |ending in )\d{4}/gi, (m, a) => a + '••••');
  s = s.replace(/\b(send money to|sent gcash to|received gcash from|received money from|express send to)\s+(?!\[)([A-ZÑ][A-Za-zÑñ*]*\.?(?:\s+[A-ZÑ][A-Za-zÑñ*]*\.?){0,3})/gi, (m, a) => { found.person++; return a + ' [person]'; });
  s = s.replace(/(?<![\d.,A-Za-z])\d{9,}(?!\d|\.\d|,\d{3}(?!\d))/g, m => { found.account++; return '••' + m.slice(-4); });
  s = s.replace(/(?<![A-Za-z0-9.])(?=[A-Za-z0-9-]*[A-Za-z])(?=(?:[A-Za-z-]*\d){6})[A-Za-z0-9-]{8,}(?![A-Za-z0-9]|\.\d)/g, m => { if (phLeadDate(m + ' ')) return m; found.ref = (found.ref || 0) + 1; return '[ref]'; });
  return { text: s, found };
}
/* a last look before sending: anything that still looks like a number that names a person or an account */
function phLeaks(text) {
  const out = [], s = String(text || '');
  (s.match(/(?<![\d.,])\d{6,}(?!\d|\.\d|,\d{3}(?!\d))/g) || []).forEach(m => out.push(m));
  (s.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).forEach(m => out.push(m));
  return out;
}
/* what the AI still gets when the device read the statement itself: only the names it could not place, with no
   dates, no balances, no account, and digits removed. One line per merchant: name, how many times, total, direction. */
function phAskList(rows, limit) {
  const m = {};
  rows.forEach(r => { if (r.already || r.pair || r.rev || r.conf >= 0.6 || /person/.test(r.sub || '')) return; const k = phNorm(phMask(r.text).text.replace(/\[[^\]]*\]/g, ' ')).split(' ').slice(0, 4).join(' '); if (!k) return; const key = k + '|' + r.dir; m[key] = m[key] || { k, dir: r.dir, n: 0, c: 0 }; m[key].n++; m[key].c += r.c; });
  return Object.values(m).sort((x, y) => y.c - x.c).slice(0, limit || 160).map(x => ({ k: x.k, dir: x.dir, n: x.n, total: x.c / 100 }));
}
/* a read in the shape stmt.js works with today (what stmtCleanRows returns), so stmtNumbers and the review can take it as is */
function phToStmtRead(read, fileName) {
  return { file: fileName || read.file || '', account: read.account, kind: read.kind, currency: read.cur, from: read.from, to: read.to, closing: read.kind === 'card' || read.closing === null ? null : read.closing / 100,
    rows: read.rows.map(r => ({ d: r.date, t: phMask(r.text).text.slice(0, 80), a: r.c / 100, dir: r.dir, k: phNorm(r.text).split(' ').slice(0, 3).join(' '), f: fileName || read.file || '', lid: r.lid, cat: r.conf >= 0.6 ? r.cat : '' })), notes: read.notes.slice(0, 4) };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { PH_PROVIDERS, phCents, phFmt, phLeadDate, phAnyDate, phDetect, phRead, phReadTable, phReadCsv, phReadCard, phCsvRows, phGuess, phMerge, phPairReversals, phPairTransfers, phAlreadyLogged, phPrepare, phTotals, phEvents, phMask, phLeaks, phAskList, phToStmtRead, phNorm, phDays };
