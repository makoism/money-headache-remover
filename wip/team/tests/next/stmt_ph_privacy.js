/* stmt_ph.js privacy: what is taken out of statement text on the device before anything is sent, and what stays.
   Run: node tests/next/stmt_ph_privacy.js   Ends with STMT PH PRIVACY PASS or FAIL n. Made-up data only. */
const fs = require('fs'), path = require('path');
const P = require(path.join(__dirname, '..', '..', 'stmt_ph.js')), dir = path.join(__dirname, 'fixtures_ph');
let bad = 0, n = 0; const ok = (c, what) => { n++; if (!c) { bad++; console.log('FAIL ' + what); } };
const files = fs.readdirSync(dir).filter(f => !/_dates\.txt$/.test(f)).sort();
/* everything in the fixtures that names the made-up person or her accounts */
const secrets = ['JUANA', 'CRUZ', 'DELA', 'SAMPAGUITA', 'MALINIS', 'BLK 7', 'LOT 12', '09175550142', '917 555 0142', '001230456789', '3149-0456-21', '3149045621', '8123 4567 8901', '812345678901', '06612345', '109450012345', '5234-5678-9012-3456', '5234567890123456', '4005 12XX', '0188', '0199', '70123456', 'MA***A', 'JO*N'];
files.forEach(f => {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8'), m = P.phMask(raw), up = m.text.toUpperCase();
  secrets.forEach(s => ok(up.indexOf(s.toUpperCase()) < 0, `${f}: "${s}" is still in the masked text`));
  ok(P.phLeaks(m.text).length === 0, `${f}: long numbers left: ${P.phLeaks(m.text).join(' ')}`);
  /* what the AI needs is still there: every row's date, amount and merchant words; and it still reads the same */
  const a = P.phRead(raw), b = P.phRead(m.text, { provider: a.provider, kind: a.kind });
  ok(b.ok && b.rows.length === a.rows.length, `${f}: masked text still reads (${b.why})`);
  ok(a.rows.every((r, i) => b.rows[i] && b.rows[i].date === r.date && b.rows[i].c === r.c && b.rows[i].dir === r.dir), `${f}: dates, amounts and directions unchanged`);
  ok(a.closing === b.closing && a.totalIn === b.totalIn && a.totalOut === b.totalOut, `${f}: totals unchanged`);
  ['Meralco', 'Jollibee', 'Shopee', 'MERCURY DRUG', 'PLDT', 'SM SUPERMARKET', 'LAZADA', 'PUREGOLD', '7-Eleven', 'GLOBE TELECOM', 'ACME BPO', 'Netflix'].forEach(w => { if (raw.indexOf(w) >= 0) ok(m.text.indexOf(w) >= 0, `${f}: merchant ${w} was lost`); });
  ok(m.text.split('\n').length === raw.split('\n').length, f + ': same number of lines');
});
/* single cases */
const one = (s, opts) => P.phMask(s, opts).text;
ok(one('x\nx\nx\nx\nx\nx\nx\nx\nPay to maria.santos@example.com 100.00') .indexOf('@') < 0, 'email');
ok(/\[phone\]/.test(one('Load for +63 917 555 0142')) && /\[phone\]/.test(one('Load for 0917-555-0142')) && /\[phone\]/.test(one('Load for 639175550142')), 'phone shapes');
ok(one('Card 4005 1234 5678 7788 x') === 'Card [card ••7788] x', 'card number keeps only the last four');
ok(one('2026-08-05 PAYMENT 12,345,678.90 1,234,567,890.12') === '2026-08-05 PAYMENT 12,345,678.90 1,234,567,890.12', 'big amounts are not mistaken for account numbers');
ok(one('08/05/2026 POS 123456.00 200000.00') === '08/05/2026 POS 123456.00 200000.00', 'amounts with no commas stay');
ok(one('Statement Period: 01 Aug 2026 - 31 Aug 2026') === 'Statement Period: 01 Aug 2026 - 31 Aug 2026', 'dates stay');
ok(one('2026-08-09 Send Money to PEDRO REYES 500.00 1,000.00').indexOf('PEDRO') < 0, 'the other person in a send is removed');
ok(one('2026-08-09 Payment to Meralco 500.00 1,000.00').indexOf('Meralco') > 0, 'a merchant is not a person');
ok(one('BDO\nStatement\n08/01/2026 TRANSFER FROM LIZA M SORIANO 500.00 900.00', { names: ['Liza Marie Soriano'] }).indexOf('SORIANO') < 0, 'a name given by the app is removed anywhere');
ok(one('08/01/2026 SM CITY NORTH EDSA QUEZON CITY 500.00 900.00').indexOf('QUEZON CITY') > 0, 'a city inside a row is a merchant place, kept');
const f = P.phMask(fs.readFileSync(path.join(dir, 'maya_savings_2026-08.txt'), 'utf8')).found; ok(f.name === 1 && f.address === 1 && f.phone === 1 && f.account >= 1, 'found counts for the screen: ' + JSON.stringify(f));
/* what the AI gets when the device read the statement itself: merchant names only */
const reads = files.map(x => P.phRead(fs.readFileSync(path.join(dir, x), 'utf8'), { file: x })), prep = P.phPrepare(reads, [], []);
ok(P.phAskList(prep.rows).length === 0, 'in the fixtures every line is placed on the phone, and lines about people are never asked about');
const odd = P.phRead('GCash Transaction History\nDate and Time Description Reference No. Debit Credit Balance\nSTARTING BALANCE 1,000.00\n2026-08-01 09:00 Payment to Kusina ni Aling Nena 09175550142 7012345600201 150.00 850.00\n2026-08-02 09:00 Payment to Kusina ni Aling Nena 7012345600202 150.00 700.00\n2026-08-03 09:00 Send Money to PEDRO R. 7012345600203 100.00 600.00\nENDING BALANCE 600.00');
ok(odd.ok, 'odd read: ' + odd.why); prep.rows = prep.rows.concat(odd.rows);
const ask = P.phAskList(prep.rows), js = JSON.stringify(ask); ok(ask.length === 1 && ask[0].n === 2 && ask[0].total === 300 && /kusina/.test(ask[0].k), 'one unknown shop, asked once: ' + js);
ok(!/\d{3}/.test(js.replace(/"(n|total)":[\d.]+/g, '')) && !/juana|cruz|\*/i.test(js), 'the ask list has no digits, no name: ' + js.slice(0, 200));
ok(ask.every(a => a.k && (a.dir === 'in' || a.dir === 'out') && a.n >= 1 && a.total > 0 && !('date' in a)), 'ask list shape: name, direction, count, total; no dates, no balances');
console.log(`${n} checks`); console.log(bad ? 'STMT PH PRIVACY FAIL ' + bad : 'STMT PH PRIVACY PASS'); process.exit(bad ? 1 : 0);
