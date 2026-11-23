// Whole day numbers for the rules references [D8]: no `new Date(<date string>)`, no local time.
'use strict';
const MS = 86400000;
function dayNum(s) { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / MS); }
function dayStr(n) {
  const d = new Date(n * MS);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
const weekday = n => ((n % 7) + 7 + 4) % 7;   // day 0 (1 Jan 1970) was a Thursday; 0 = Sunday
function isWorking(n, holidays) { const w = weekday(n); return w !== 0 && w !== 6 && !(holidays || []).includes(dayStr(n)); }
// The day `n` working days after day `from` (weekends and the holidays given are skipped).
function addWorking(from, n, holidays) { let d = from; while (n > 0) { d++; if (isWorking(d, holidays)) n--; } return d; }
module.exports = { dayNum, dayStr, weekday, isWorking, addWorking };
