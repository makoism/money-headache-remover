/* ---------- money3: one way to write an amount (WIRING_PLAN Q3 fallback until lane D's formatter lands) ----------
   TODO(lane D): switch to the wip/team/screens/ formatter in slice 2. Amounts come in whole minor units from the
   engine; BurrowEngine.units.fmt writes them, this only adds the currency's sign. No sums here. */
const CUR_SIGN = { JPY: '¥', USD: '$', PHP: '₱', EUR: '€', GBP: '£' };
function money3(minor, cur) {
  const s = BurrowEngine.units.fmt(minor, cur), sign = CUR_SIGN[cur] || (cur + ' ');
  return s.charAt(0) === '-' ? `-${sign}${s.slice(1)}` : `${sign}${s}`;
}
/* a typed amount as whole minor units, or null: commas, spaces and the sign in front are dropped, a minus is refused */
function typed3(text, cur) {
  const t = String(text || '').replace(/[,\s]/g, '').replace(/^[¥$₱€£]/, '');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  try { const r = BurrowEngine.units.toMinor(t, cur); return r.ask ? null : r.minor; } catch (e) { return null; }
}
const MON3 = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };
/* '2026-12-10' written as '10 Dec' (and '2027-01-12' as '12 Jan 2027' when the year is not the shown day's) */
function day3(s, thisYear) { if (!s) return ''; const d = s.slice(8, 10).replace(/^0/, '') + ' ' + MON3[s.slice(5, 7)]; return thisYear && s.slice(0, 4) !== thisYear ? d + ' ' + s.slice(0, 4) : d; }
const esc3 = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
