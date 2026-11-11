/* ===== the money assistant =====
   The chat under Ask knows the person's whole picture (built fresh for every message from the same model the screens use)
   and can propose changes. Claude never touches the numbers: it ends a reply with one ```mhr block naming actions from a fixed
   list; the page checks each one, works out the exact before and after on a copy of the plan, shows a card, and changes
   nothing until the person taps Apply. Undo is one tap. Machine contract: ACTION_DOC and runActions belong together. */
const ASST_GUIDE = `You are the money assistant inside M.H.R.2000 (The Money Headache Remover 2000), a one-page budget planner the person has open right now. You know their whole picture from the PICTURE section below, which the page rebuilds for every message, so treat it as current and exact.

HOW TO ANSWER
- Like a trusted friend who is good with money: plain words, short sentences, concrete numbers from the picture, kind, never judging. No greeting, no praise, no exclamation marks, no filler.
- Usually under 120 words. Plain text only: no headings, no bold, no tables. A short list with dashes is fine.
- Be specific: say the number, the month, the goal by name. Say what is realistic and why, using the picture. If something cannot be known from the picture (a price outside the page, next month's pay), say so in a few words instead of guessing.
- Ask at most one short question when you truly need it; otherwise answer and, where useful, propose.
- The page's own arithmetic is the truth. When you propose a change, the person sees the exact before and after, so keep your own estimate short.
- You are not a licensed adviser: when a question is really about investment products, loans or taxes, say so in one line and stay with the budget.
- Money mindset of the page: awareness, not willpower. Every bit of pay gets a purpose. Play money is for spending with no guilt. Goals get a date. A short month is fixed by moving money, not by shame.

CHANGING THE PAGE
You cannot change anything yourself. To propose changes, end the reply with exactly one block in this form, after your text:
\`\`\`mhr
{"why":"one short line on what this does","actions":[{"do":"set_line","key":"bill:food","amount":5000}]}
\`\`\`
Rules for the block: only the action names and fields listed under ACTIONS; amounts are plain monthly numbers in the page's currency; ids and keys exactly as given in the picture; at most 8 actions; one block per reply; no block when nothing should change. For "what if" questions, propose the change: the person sees the before and after and can choose not to apply it. Propose one clear change rather than many small ones. Never propose removing anything unless asked.

ACTIONS
- set_pay {amount}: monthly take-home pay (Salary). set_other_income {amount}: the Second income line.
- set_balance {amount}: money today. set_min_balance {amount}: the safety line.
- set_line {key, amount, scope?}: a bill or a jar line's monthly amount. key is a line key from the picture. scope "after" (default) means from this month on; "month" means this month only.
- set_jar {jar, amount}: the whole monthly amount of the play, edu, ffa or give jar (it goes on the jar's main line).
- add_line {jar, name, amount}: a new line; jar is nec, play, edu, ffa or give. remove_line {key}: remove a line.
- add_goal {name, target, saved?, due?, monthly?}: a new goal; due is YYYY-MM-DD; monthly is the saving a month (left out: the page spreads it to the date, or over about a year).
- update_goal {id, name?, target?, saved?, due?}: change a goal. remove_goal {id}. set_goal_saving {id, amount}: the monthly saving for a goal; amount null returns to the page's suggested amount. set_main_goal {id}: the goal Home leads with.
- set_home {sections}: what Home shows and in what order, from goal, play, log, goals, jars, more. Leave one out to hide it.
- set_name {name}.`;
const JAR_WORD = { nec: 'Necessities', lts: 'Long-term savings', play: 'Play', edu: 'Education', ffa: 'Financial freedom', give: 'Give' };

/* the picture: everything the assistant may need, read from the same model as the screens, in about 2 KB */
function asstPicture(T) {
  T = T || S;
  const C2 = calcAll(T), ym = nowYm(), m = C2.byYm[ym], V = viewOf(T, C2, ym, ymd(new Date())), J = jarsOf(T, m), cur = sym() || 'no symbol';
  const n = v => (typeof v === 'number' ? (Math.abs(v - Math.round(v)) < 0.005 ? Math.round(v) : Math.round(v * 100) / 100) : v);
  const lines = T.plan.lines.map(l => `  ${l.key} | ${l.name} | ${JAR_WORD[l.jar] || l.jar} | ${n(val(T, l.key, ym))}${l.ends ? ' | last payment ' + l.ends : ''}`).join('\n');
  const goals = V.goals.map(r => `  ${r.id} | ${r.name}${r.emergency ? ' (emergency fund)' : ''} | goal ${n(r.target)} | saved ${n(r.saved)} | ${n(val(T, 'goal:' + r.id, ym))} a month | ${r.due ? 'needed by ' + r.due : 'no date'} | ${r.pct >= 100 ? 'full' : r.reached ? 'full in ' + monthLabel(r.reached) : 'not full within ' + SPAN}${V.main && V.main.id === r.id ? ' | main goal' : ''}`).join('\n') || '  (none)';
  const rs = receiptStats(T, ym), cats = Object.keys(rs.byKey || {}).map(k => [k, rs.byKey[k]]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const ahead = MONTHS.filter(x => x > ym).slice(0, 12), shorts = ahead.filter(x => statusOf(T, C2.byYm[x]) === 'short'), tights = ahead.filter(x => statusOf(T, C2.byYm[x]) === 'tight');
  const st = { good: 'On plan', tight: 'Tight', short: 'Short' };
  const home = (Array.isArray(T.ui.home) && T.ui.home.length ? T.ui.home : HOME_SECTIONS).join(', ');
  return `PICTURE (today ${todayStr()}, currency ${cur}, amounts per month, month in view ${monthLabel(ym)})
Name: ${T.ui.name || '(not given)'}
Income: salary ${n(val(T, 'a', ym))}, second income ${n(val(T, 'b', ym))}, side income ${n(val(T, 'side', ym))}; total in ${n(m.pool.in)}
Money today ${n(cfg(T, 'bankStart'))}; minimum balance ${n(cfg(T, 'minBank'))}; spending ceiling ${n(cfg(T, 'ceiling'))}
This month: left over ${n(m.pool.left)}, balance ends ${monthLabel(ym, true)} at ${n(m.bankEnd)}, status ${st[statusOf(T, m)]}. Next 12 months: ${shorts.length ? 'short in ' + shorts.map(x => monthLabel(x, true) + ' ' + x.slice(2, 4)).join(', ') : 'no short month'}${tights.length ? '; tight in ' + tights.length + ' month' + (tights.length === 1 ? '' : 's') : ''}.
Jars (amount, share of pay, usual share): ${J.list.map(j => `${j.name} ${n(j.v)} (${j.pct}%, usual ${j.usual}%)`).join('; ')}${J.rest > 0 ? `; unassigned ${n(J.rest)} (${J.restPct}%)` : ''}${J.over ? '; the plan spends more than the pay' : ''}
Play money this month: planned ${n(V.play.planned)}, spent ${n(V.play.spent)}, left ${n(V.play.left)}, ${V.play.daysLeft} days left${V.play.perWeek != null ? ', about ' + n(V.play.perWeek) + ' a week' : ''}
Lines (key | name | jar | amount):
${lines}
Goals (id | name | goal | saved | monthly | date | when full):
${goals}
Receipts this month: ${rs.count} logged, ${n(rs.total || 0)} in all${cats.length ? '; biggest: ' + cats.map(c => `${catName(T, { c: c[0] })} ${n(c[1])}`).join(', ') : ''}
Home shows, in order: ${home}
Setup: ${T.ui.src === 'import' ? 'numbers came from statements' : T.ui.setup ? 'typed in the guided setup' : 'not finished'}${sampleOn() ? '; the figures are still the invented sample' : ''}`;
}

/* ---- the fixed actions: check, run on any state, describe ---- */
const ASST_MAX = 8;
function lineOf(T, ref) { if (!ref) return null; const r = String(ref).trim(); return T.plan.lines.find(l => l.key === r) || T.plan.lines.find(l => l.id === r) || T.plan.lines.find(l => l.name.toLowerCase() === r.toLowerCase()) || null; }
function goalOf(T, ref) { if (!ref) return null; const r = String(ref).trim(); return T.plan.goals.find(g => g.id === r) || T.plan.goals.find(g => g.name.toLowerCase() === r.toLowerCase()) || null; }
const amtOf = v => { if (v === null) return null; const n = typeof v === 'string' ? +v.replace(/[,\s]/g, '') : +v; return isFinite(n) ? Math.max(0, Math.min(MAX_AMT, Math.round(n * 100) / 100)) : NaN; };
/* turn Claude's list into checked steps; each step knows how to run on a state T and how to read as a sentence */
function asstCheck(raw) {
  const list = Array.isArray(raw && raw.actions) ? raw.actions.slice(0, ASST_MAX) : [], out = [], dropped = [];
  const ym = nowYm(), f = v => fmt(v);
  list.forEach(a => {
    a = a && typeof a === 'object' ? a : {};
    const d = String(a.do || ''), scope = a.scope === 'month' ? 'month' : 'after', since = scope === 'month' ? ` for ${monthLabel(ym, true)} only` : '';
    const push = (text, run) => out.push({ text, run, on: true, a });
    const amt = amtOf(a.amount);
    if (d === 'set_pay') { if (!(amt >= 0)) return dropped.push(d); push(`Salary: ${f(val(S, 'a', ym))} to ${f(amt)} a month`, T => { setVal(T, 'a', ym, amt, 'after'); if (amt > 0) markDoneOn(T, 'pay'); }); }
    else if (d === 'set_other_income') { if (!(amt >= 0)) return dropped.push(d); push(`Second income: ${f(val(S, 'b', ym))} to ${f(amt)} a month`, T => setVal(T, 'b', ym, amt, 'after')); }
    else if (d === 'set_balance') { if (!(amt >= 0)) return dropped.push(d); push(`Money today: ${f(cfg(S, 'bankStart'))} to ${f(amt)}`, T => { T.cfg.bankStart = Math.round(amt); }); }
    else if (d === 'set_min_balance') { if (!(amt >= 0)) return dropped.push(d); push(`Minimum balance: ${f(cfg(S, 'minBank'))} to ${f(amt)}`, T => { T.cfg.minBank = Math.round(amt); }); }
    else if (d === 'set_line') { const l = lineOf(S, a.key); if (!l || !(amt >= 0)) return dropped.push(d + ' ' + (a.key || '')); push(`${l.name}: ${f(val(S, l.key, ym))} to ${f(amt)} a month${since}`, T => { setVal(T, l.key, ym, amt, scope); if (l.jar === 'nec') markDoneOn(T, 'bills'); }); }
    else if (d === 'set_jar') { const jar = String(a.jar || ''); const ls = S.plan.lines.filter(l => l.jar === jar); if (['play', 'edu', 'ffa', 'give'].indexOf(jar) < 0 || !ls.length || !(amt >= 0)) return dropped.push(d); const others = ls.slice(1).reduce((x, l) => x + val(S, l.key, ym), 0), now = ls.reduce((x, l) => x + val(S, l.key, ym), 0); push(`${JAR_WORD[jar]} jar: ${f(now)} to ${f(amt)} a month${since}`, T => setVal(T, ls[0].key, ym, Math.max(0, round2(amt - others)), scope)); }
    else if (d === 'add_line') { const jar = String(a.jar || 'nec'), name = cleanSubName(a.name); if (['nec', 'play', 'edu', 'ffa', 'give'].indexOf(jar) < 0 || !name || !(amt >= 0)) return dropped.push(d); push(`New line ${name} under ${JAR_WORD[jar]}: ${f(amt)} a month`, T => { const id = addLine(T, jar, name, 0); if (id) setVal(T, 'line:' + id, ym, amt, 'after'); }); }
    else if (d === 'remove_line') { const l = lineOf(S, a.key); if (!l) return dropped.push(d); push(`Remove the line ${l.name}`, T => removeLine(T, lineOf(T, l.key).id)); }
    else if (d === 'add_goal') {
      const name = cleanSubName(a.name), target = amtOf(a.target), saved = a.saved === undefined ? 0 : amtOf(a.saved), due = typeof a.due === 'string' && validDate(a.due) && MONTHS.indexOf(a.due.slice(0, 7)) >= 0 ? a.due : '', monthly = a.monthly === undefined || a.monthly === null ? null : amtOf(a.monthly);
      if (!name || !(target > 0) || !(saved >= 0) || S.plan.goals.length >= MAX_GOALS) return dropped.push(d);
      push(`New goal ${name}: ${f(target)}${saved > 0 ? ', ' + f(saved) + ' saved' : ''}${due ? ', needed by ' + dateLabel(due) : ''}${monthly !== null ? ', ' + f(monthly) + ' a month' : ''}`, T => { const id = addGoal(T, name); if (!id) return; updateGoal(T, id, { target, start: saved, due }); if (monthly !== null) setVal(T, 'goal:' + id, ym, monthly, 'after'); markDoneOn(T, 'goals'); });
    }
    else if (d === 'update_goal') {
      const g = goalOf(S, a.id); if (!g) return dropped.push(d + ' ' + (a.id || '')); const p = {}, parts = [];
      if (a.name !== undefined) { const nm = cleanSubName(a.name); if (nm) { p.name = nm; parts.push(`name to ${nm}`); } }
      if (a.target !== undefined) { const t = amtOf(a.target); if (t > 0) { p.target = t; parts.push(`goal ${f(g.target)} to ${f(t)}`); } }
      if (a.saved !== undefined) { const s2 = amtOf(a.saved); if (s2 >= 0) { p.start = s2; parts.push(`saved ${f(g.start)} to ${f(s2)}`); } }
      if (a.due !== undefined) { const du = a.due ? (typeof a.due === 'string' && validDate(a.due) && MONTHS.indexOf(a.due.slice(0, 7)) >= 0 ? a.due : null) : ''; if (du !== null) { p.due = du; parts.push(du ? `date to ${dateLabel(du)}` : 'no date'); } }
      if (!parts.length) return dropped.push(d);
      push(`${g.name}: ${parts.join(', ')}`, T => updateGoal(T, g.id, p));
    }
    else if (d === 'remove_goal') { const g = goalOf(S, a.id); if (!g) return dropped.push(d); push(`Remove the goal ${g.name}`, T => removeGoal(T, g.id)); }
    else if (d === 'set_goal_saving') { const g = goalOf(S, a.id); if (!g || (a.amount !== null && !(amt >= 0))) return dropped.push(d); push(a.amount === null ? `${g.name}: back to the suggested monthly amount` : `${g.name}: ${f(val(S, 'goal:' + g.id, ym))} to ${f(amt)} a month${since}`, T => { if (a.amount === null) useSuggested(T, g.id); else setVal(T, 'goal:' + g.id, ym, amt, scope); }); }
    else if (d === 'set_main_goal') { const g = goalOf(S, a.id); if (!g) return dropped.push(d); push(`Home leads with ${g.name}`, T => { T.ui.main = g.id; }); }
    else if (d === 'set_home') { const secs = Array.isArray(a.sections) ? a.sections.filter((x, i, arr) => HOME_SECTIONS.indexOf(x) >= 0 && arr.indexOf(x) === i) : []; if (!secs.length) return dropped.push(d); const names = { goal: 'main goal', play: 'play money', log: 'log spend', goals: 'goals', jars: 'jars', more: 'streak and badges' }; push(`Home shows: ${secs.map(x => names[x]).join(', ')}${secs.length < HOME_SECTIONS.length ? ' (the rest hidden)' : ''}`, T => { if (secs.join() === HOME_SECTIONS.join()) delete T.ui.home; else T.ui.home = secs; }); }
    else if (d === 'set_name') { const nm = cleanName(a.name); if (!nm) return dropped.push(d); push(`Name: ${nm}`, T => { T.ui.name = nm; }); }
    else dropped.push(d || '(no action)');
  });
  return { steps: out, dropped, why: typeof (raw && raw.why) === 'string' ? raw.why.replace(/[\u0000-\u001f<>]/g, ' ').slice(0, 160) : '' };
}
const markDoneOn = (T, k) => { const d = T.ui.done = T.ui.done || {}; d[k] = true; };
const runActions = (T, steps) => { steps.forEach(s => { if (s.on) s.run(T); }); };
/* the numbers that matter, before and after, worked out on a copy */
function asstDelta(steps) {
  const T = JSON.parse(JSON.stringify(S)); runActions(T, steps);
  const ym = nowYm(), a = calcAll(S).byYm[ym], b = calcAll(T).byYm[ym], CA = calcAll(S), CB = calcAll(T), st = { good: 'On plan', tight: 'Tight', short: 'Short' };
  const rows = [
    ['Play money', fmt(a.jar.play), fmt(b.jar.play)], ['Left over', fmt(a.pool.left), fmt(b.pool.left)],
    [`Balance, end of ${monthLabel(ym, true)}`, fmt(a.bankEnd), fmt(b.bankEnd)], ['Status', st[statusOf(S, a)], st[statusOf(T, b)]],
  ];
  const gA = goalRows(S, CA, ym), gB = goalRows(T, CB, ym);
  gB.forEach(r => { const o = gA.find(x => x.id === r.id); const was = o ? (o.pct >= 100 ? 'full' : o.reached ? monthLabel(o.reached) : 'over ' + SPAN) : 'new'; const now = r.pct >= 100 ? 'full' : r.reached ? monthLabel(r.reached) : 'over ' + SPAN; if (!o || was !== now || (o && val(S, 'goal:' + r.id, ym) !== val(T, 'goal:' + r.id, ym))) rows.push([r.name, o ? `${was}, ${fmt(val(S, 'goal:' + r.id, ym))}/mo` : 'new', `${now}, ${fmt(val(T, 'goal:' + r.id, ym))}/mo`]); });
  gA.forEach(o => { if (!gB.find(x => x.id === o.id)) rows.push([o.name, 'goal', 'removed']); });
  const changed = rows.filter(r => r[1] !== r[2]);
  return { rows, changed };
}
/* the card in the chat: each step with a tick, before and after, Apply and Undo */
function asstCard(bot, chk) {
  bot.classList.remove('wait'); bot.classList.add('card'); bot.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'asst';
  const h = document.createElement('p'); h.className = 'asst-h'; h.innerHTML = `<b>Proposed change</b>${chk.why ? `<span>${esc(chk.why)}</span>` : ''}`; wrap.append(h);
  const list = document.createElement('div'); list.className = 'asst-steps';
  chk.steps.forEach((s, i) => { const l = document.createElement('label'); l.className = 'asst-step on'; l.innerHTML = `<input type="checkbox" data-asi="${i}" checked><span>${esc(s.text)}</span>`; list.append(l); });
  wrap.append(list);
  const tbl = document.createElement('div'); tbl.className = 'asst-delta'; wrap.append(tbl);
  const foot = document.createElement('div'); foot.className = 'row-btns asst-foot';
  const apply = document.createElement('button'); apply.type = 'button'; apply.className = 'btn small solid'; foot.append(apply);
  const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'link'; skip.textContent = 'Not now'; foot.append(skip);
  const msg = document.createElement('span'); msg.className = 'msg'; msg.setAttribute('role', 'status'); foot.append(msg);
  if (chk.dropped.length) { const p = document.createElement('p'); p.className = 'cap'; p.textContent = `Left out (not understood): ${chk.dropped.join(', ')}.`; wrap.append(p); }
  wrap.append(foot); bot.append(wrap);
  const paint = () => {
    const n = chk.steps.filter(s => s.on).length, d = asstDelta(chk.steps);
    tbl.innerHTML = `<div class="asst-row asst-head"><span></span><span>Now</span><span>After</span></div>` + d.rows.map(r => `<div class="asst-row${r[1] !== r[2] ? ' chg' : ''}"><span>${esc(r[0])}</span><span>${esc(r[1])}</span><span>${esc(r[2])}</span></div>`).join('');
    apply.textContent = n === 1 ? 'Apply' : `Apply ${n} changes`; apply.disabled = !n;
  };
  list.addEventListener('change', e => { const c = e.target.closest('[data-asi]'); if (!c) return; chk.steps[+c.dataset.asi].on = c.checked; c.closest('.asst-step').classList.toggle('on', c.checked); paint(); });
  skip.addEventListener('click', () => { wrap.classList.add('done'); foot.innerHTML = '<span class="cap">Not applied.</span>'; sfx('tap'); });
  apply.addEventListener('click', () => {
    const on = chk.steps.filter(s => s.on); if (!on.length) return;
    ACT.tx('assistant', () => runActions(S, on));
    wrap.classList.add('done'); list.querySelectorAll('input').forEach(i => { i.disabled = true; });
    foot.innerHTML = '<span class="cap">Applied.</span>';
    const u = document.createElement('button'); u.type = 'button'; u.className = 'link'; u.textContent = 'Undo'; foot.append(u);
    u.addEventListener('click', () => { if (ACT.undo()) { foot.innerHTML = '<span class="cap">Undone.</span>'; sfx('back'); } });
    sfx('coin'); celebrate('small', 'Applied.');
    askTurns.push({ role: 'user', content: '(The person applied the proposed change. The picture below is now current.)' });
  });
  paint();
}
/* the reply text without the machine block, and the block itself when complete */
function asstSplit(text) {
  const i = text.indexOf('```mhr'); if (i < 0) return { shown: text, block: null, open: false };
  const rest = text.slice(i + 6), j = rest.indexOf('```');
  return { shown: text.slice(0, i).trim(), block: j >= 0 ? rest.slice(0, j).trim() : null, open: j < 0 };
}
function asstInput() {
  const nums = $('#askNums').checked;
  const head = ASST_GUIDE + '\n\n' + (nums ? asstPicture() : 'PICTURE: the person chose not to share their numbers for this question. Answer in general terms and offer no proposal.') + '\n\nPAGE GUIDE (for where-to-tap questions)\n' + ASK_GUIDE.slice(ASK_GUIDE.indexOf('THE PAGE')) + '\n\nThe conversation starts below. Answer only the latest message.';
  return [{ role: 'user', content: head }].concat(askTurns.slice(-10));
}
/* after a reply: show the text, and the card when a block came with it */
function asstAfter(bot, text, truncated) {
  const sp = asstSplit(text);
  bot.classList.remove('wait'); bot.textContent = (sp.shown || (sp.block ? 'Here is a change you can apply.' : '')) + (truncated ? '\n\n(Cut short. Ask for less at a time.)' : '');
  if (!sp.block) return;
  const p = parseLoose(sp.block);
  const card = document.createElement('div'); card.className = 'msg ai'; $('#askLog').appendChild(card);
  if (!p.ok) { card.classList.add('note'); card.textContent = 'The proposed change could not be read. Ask again in other words.'; return; }
  const chk = asstCheck(p.value);
  if (!chk.steps.length) { card.classList.add('note'); card.textContent = 'Nothing in that proposal matched the page. Ask again in other words.'; return; }
  asstCard(card, chk); sfx('next');
  $('#askLog').scrollTop = $('#askLog').scrollHeight;
}
