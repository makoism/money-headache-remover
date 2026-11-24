/* ---------- Home: the Total in the home currency (stage 2 S5, STAGE2_PLAN 2.4 step 1) ----------
   Shown only when an account is in another currency: the engine's res.total.inHome, each such account with the rate
   in force, its day and who gave it, and an account with no rate yet named apart. Every figure is the engine's; this
   file words and places (tests: no_maths.js, e3_rates.js). Words are drafts for Mako's copy pass (FOR_MAKO.md). */
function totalWords3(r, yr) {
  const x = r.total && r.total.inHome;
  if (!x) return '';
  const home = E3.home();
  const by = { typed: 'typed by you', convert: 'from your own conversion' };
  const parts = x.parts.map(t => {
    const pair = `1 ${t.currency} = ${t.shown} ${home}`;   // [S6] the engine's rate in this direction, rounded for display only
    return `<li data-fig="totalpart" data-acct="${esc3(t.account)}">${esc3(E3.nameOf(t.account))} ${money3(t.amount, t.currency)} at ${esc3(pair)} from ${esc3(day3(t.rateFrom, yr))}, ${esc3(by[t.src] || by.typed)}${t.old ? ', over 30 days old' : ''}: ${fig3('total.inHome.parts.*.converted', t.converted, home)}</li>`;
  }).join('');
  const missing = x.missing.map(m => `<p class="a3-warn" data-fig="totalmissing" data-acct="${esc3(m.account)}">${esc3(E3.nameOf(m.account))} ${money3(m.amount, m.currency)} is not counted: no rate yet. Type one in Settings, Rates</p>`).join('');
  return `<section class="a3-card" data-card="total"><h2>${esc3(label3('total'))}, about, in ${esc3(home)}</h2>
    <p class="a3-big" data-fig="totalhome">${fig3('total.inHome.amount', x.amount, home)}</p>
    ${parts ? `<ul class="a3-rows a3-sub">${parts}</ul>` : ''}${missing}</section>`;
}
