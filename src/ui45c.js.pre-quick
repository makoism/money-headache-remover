/* ---------- before the uploads: a short conversation ----------
   One screen, right before Your statements. It asks what the person has (bank accounts, cards, e-wallets, cash) and how many,
   lets them name each one, then explains in a few short messages why statements, what happens to the files and how the
   categories work, and takes questions. The answers become the upload boxes on the next screen, named as the person said.
   Common questions are answered on the spot with no AI; anything typed goes to Claude when it can be reached.
   Saved in S.ui.onb, so Back, Finish later and a reload all come back to the same place in the conversation. */
const ONB_KINDS = [['bank', 'Bank account'], ['card', 'Credit card'], ['wallet', 'E-wallet'], ['cash', 'Mostly cash']];
const ONB_WORD = { bank: ['bank account', 'bank accounts'], card: ['card', 'cards'], wallet: ['e-wallet', 'e-wallets'] };
const onbWalletEg = () => (sym() === '₱' ? 'GCash, Maya' : sym() === '¥' ? 'PayPay, Suica' : 'PayPal, Venmo, Revolut');
const ONB_FAQ = [
  ['cash', 'Some of my bills are paid in cash', () => 'Statements only show what went through an account. After the upload, the check screen lists every bill and has Add a line: put the cash ones there. Day-to-day cash spending goes in Receipts any time.'],
  ['extra', 'I have an expense that is not on any statement', () => 'Add it on the check screen after the upload (Add a line), or later on the Plan tab if it comes every month. A one-off goes in Receipts, Log spend.'],
  ['wrong', 'What if something gets the wrong category?', () => 'The check screen shows every shop with its category. Tap one and pick another. The app remembers it, so next month it is already right.'],
  ['safe', 'Is it safe to upload my statements?', () => 'The files are sent once to Claude to be read and this app does not keep them. Only the numbers stay, in this browser. Nobody else can see them, Mako included.'],
  ['pdf', 'My bank sends PDFs with a password', () => 'Open the PDF with its password, then save or print it as a new PDF without one, or take screenshots of the pages. Both work.'],
  ['none', 'I have no statements at hand', () => 'Tap Type numbers instead on the next screen. It takes about five minutes. Statements can go in later from Receipts, and the numbers become exact then.'],
  ['shared', 'I share an account with someone', () => 'Upload it like any other. On the check screen, untick what is not yours, or change an amount to your share.'],
];
const onbFaqFor = text => {
  const t = text.toLowerCase();
  const hit = [[/cash/, 'cash'], [/password|locked|lock/, 'pdf'], [/categor|wrong/, 'wrong'], [/safe|privacy|private|secur|store|keep/, 'safe'], [/share|partner|joint|wife|husband/, 'shared'], [/no statement|don.?t have|without/, 'none'], [/not on|missing|add|extra|expense|bill/, 'extra']].find(x => x[0].test(t));
  return hit ? ONB_FAQ.find(f => f[0] === hit[1]) : null;
};
const ONB_GUIDE = `You answer questions from someone setting up The Burrow, a simple money app, right before they upload bank, card and e-wallet statements. Facts about the app:
- They upload the last 2 or 3 months of each account: PDF, CSV or Excel exports, or screenshots. One box per account, named the way they say it.
- Claude reads each file once into a table (date, description, amount). The app does all the arithmetic itself. The files are not kept; only the numbers stay, in their browser, and nobody else can see them.
- Every shop or payee gets a category (rent, utilities, food, internet, phone, insurance, subscription, transport, loan, play and so on). The next screen shows every number and category; they can change any of them and the app remembers it for next month. Nothing is used until they tap Use these numbers.
- Pay is worked out from the regular deposits; each bill is the average over the full months; the balance is the latest closing balance.
- Cash is not on statements: add it on the check screen (Add a line) or later in Receipts. A bill that comes every month can also be added on the Plan tab.
- No statements? Type the numbers instead (a button on the next screen), and upload later from Receipts.
Answer in 1 to 3 short sentences, plain words, like a user manual. No em dashes, no emoji, no lists. If the question is not about money or this app, say you can only help with setting up their money here.`;
let onbBusy = false;
function onbState() {
  if (!S.ui.onb || typeof S.ui.onb !== 'object') S.ui.onb = { stage: 'kinds', k: {}, n: {}, names: {}, log: [] };
  const o = S.ui.onb; ['k', 'n', 'names'].forEach(x => { if (!o[x] || typeof o[x] !== 'object') o[x] = {}; }); if (!Array.isArray(o.log)) o.log = [];
  return o;
}
/* the boxes the answers describe, in order: banks, then cards, then wallets */
function onbBoxes() {
  const o = onbState(), out = [];
  ['bank', 'card', 'wallet'].forEach(k => { if (!o.k[k]) return; const n = Math.max(1, Math.min(4, +o.n[k] || 1)); for (let i = 0; i < n; i++) out.push({ kind: k, i, name: String(o.names[k + i] || '').trim().slice(0, 40) }); });
  return out.slice(0, ACCT_MAX);
}
const onbBoxLabel = (b, all) => b.name || ((b.kind === 'bank' ? 'Bank account' : b.kind === 'card' ? 'Card' : 'E-wallet') + (all.filter(x => x.kind === b.kind).length > 1 ? ' ' + (b.i + 1) : ''));
/* the conversation so far, rebuilt from the answers each time the screen is drawn */
function onbScript() {
  const o = onbState(), nm = firstName(), m = [], me = t => m.push(['me', t]), ai = t => m.push(['ai', t]);
  ai(`${nm ? `Hi ${nm}. ` : ''}Before the uploads, a few quick questions so the right upload boxes are ready for you.`);
  ai('Where does your money come in and go out? Pick all that apply.');
  if (o.stage === 'kinds') return m;
  const ks = ONB_KINDS.filter(x => o.k[x[0]]);
  me(ks.length ? ks.map(x => x[1]).join(', ') : 'None of these');
  const acc = ['bank', 'card', 'wallet'].filter(k => o.k[k]);
  if (!acc.length) {
    ai('Then there are no statements to upload, and that is fine. On the next screen tap Type numbers instead: pay, bills and goals, about five minutes.');
    if (o.k.cash) ai('Day-to-day cash goes in Receipts. Log it as you spend, or once a week.');
    return onbTail(m, o);
  }
  ai('How many of each?');
  if (o.stage === 'count') return m;
  me(acc.map(k => { const n = +o.n[k] || 1; return `${n}${n >= 4 ? '+' : ''} ${ONB_WORD[k][n > 1 ? 1 : 0]}`; }).join(', '));
  ai(`What do you call them? Use your own words, for example ${acc.map(k => (k === 'bank' ? (sym() === '₱' ? 'BPI' : sym() === '¥' ? 'Resona' : 'Chase') : k === 'card' ? (sym() === '₱' ? 'BDO Visa' : sym() === '¥' ? 'Rakuten Card' : 'Amex') : onbWalletEg().split(', ')[0])).join(', ')}. The app will use these names everywhere. Optional.`);
  if (o.stage === 'names') return m;
  const bx = onbBoxes(); me(bx.some(b => b.name) ? bx.map(b => onbBoxLabel(b, bx)).join(', ') : 'Skip names');
  ai(`Here are your upload boxes: ${bx.map(b => onbBoxLabel(b, bx)).join(', ')}. Each takes the last 2 or 3 months, as PDF, CSV or Excel exports, or screenshots of the transaction list.`);
  if (o.k.cash) ai('Cash does not show on statements. The check screen after the upload has a line for it, and Receipts takes cash any time.');
  return onbTail(m, o);
}
function onbTail(m, o) {
  const acc = ['bank', 'card', 'wallet'].some(k => o.k[k]);
  if (acc) {
    m.push(['ai', 'Why statements: they already know where your money went, so there is nothing to guess or remember, and the numbers come out exact.']);
    m.push(['ai', 'What happens: each file is sent once to Claude, an AI, which turns its rows into a table (date, description, amount). This app then does all the arithmetic itself: your pay, each bill as a monthly average, your balance. The files are not kept.']);
    m.push(['ai', 'How it is sorted: every shop and payee gets a category, like rent, food, transport, subscriptions or play. The next screen shows every number and category before anything is used. Tap one to change it, and the app remembers your choice for next month.']);
  }
  m.push(['ai', 'Any questions before you start? Tap one below or type your own.']);
  o.log.forEach(x => m.push(x));
  return m;
}
/* what the person answers with, under the conversation */
function onbAnswerHTML() {
  const o = onbState();
  if (o.stage === 'kinds') return `<div class="onb-pick" role="group" aria-label="Where your money goes">${ONB_KINDS.map(([k, l]) => `<button type="button" class="chip onb-k${o.k[k] ? ' on' : ''}" data-onbk="${k}" aria-pressed="${!!o.k[k]}"><span>${esc(l)}</span>${k === 'wallet' ? `<small>${esc(onbWalletEg())}</small>` : ''}</button>`).join('')}</div>
    <div class="row-btns"><button type="button" class="btn solid" id="onbGo">${ONB_KINDS.some(x => o.k[x[0]]) ? 'That is all' : 'None of these'}</button></div>`;
  if (o.stage === 'count') return `<div class="onb-counts">${['bank', 'card', 'wallet'].filter(k => o.k[k]).map(k => `<div class="onb-cnt"><span>${esc(ONB_WORD[k][1][0].toUpperCase() + ONB_WORD[k][1].slice(1))}</span><div class="seg" role="radiogroup" aria-label="How many ${esc(ONB_WORD[k][1])}">${[1, 2, 3, 4].map(n => `<button type="button" role="radio" class="seg-b${(+o.n[k] || 1) === n ? ' on' : ''}" aria-checked="${(+o.n[k] || 1) === n}" data-onbn="${k}" data-v="${n}">${n}${n === 4 ? '+' : ''}</button>`).join('')}</div></div>`).join('')}</div>
    <div class="row-btns"><button type="button" class="btn solid" id="onbGo">Next</button><button type="button" class="link" data-onbback="kinds">Change</button></div>`;
  if (o.stage === 'names') { const bx = onbBoxes(); return `<div class="onb-names">${bx.map(b => `<div class="inp sm"><input type="text" maxlength="40" autocomplete="off" data-onbname="${b.kind}${b.i}" aria-label="Name of ${esc(onbBoxLabel(Object.assign({}, b, { name: '' }), bx))}" placeholder="${esc(onbBoxLabel(Object.assign({}, b, { name: '' }), bx))}" value="${esc(b.name)}"></div>`).join('')}</div>
    <div class="row-btns"><button type="button" class="btn solid" id="onbGo">Done</button><button type="button" class="link" id="onbSkipNames">Skip</button><button type="button" class="link" data-onbback="count">Change</button></div>`; }
  const asked = new Set(o.log.filter(x => x[0] === 'me').map(x => x[1]));
  return `<div class="onb-faq">${ONB_FAQ.filter(f => !asked.has(f[1])).slice(0, 5).map(f => `<button type="button" class="chip onb-q" data-onbq="${f[0]}"><span>${esc(f[1])}</span></button>`).join('')}</div>
    <form class="onb-ask" id="onbAsk" autocomplete="off"><div class="inp"><input type="text" id="onbIn" maxlength="300" placeholder="Type a question" aria-label="Your question"></div><button type="submit" class="btn small solid" id="onbSend">Ask</button></form>
    <p class="cap"><button type="button" class="link" id="onbReset">Start over</button></p>`;
}
function onbPaint(scroll) {
  const log = $('#onbLog'), ans = $('#onbAns'); if (!log || !ans) return;
  log.innerHTML = onbScript().map(([r, t]) => `<div class="msg ${r}">${esc(t)}</div>`).join('') + (onbBusy ? '<div class="msg ai wait">Working…</div>' : '');
  ans.innerHTML = onbAnswerHTML();
  const nx = $('#tourNext'); if (nx) { nx.textContent = onbNextLabel(); nx.classList.toggle('solid', onbState().stage === 'qa'); }
  if (scroll) { const last = log.lastElementChild; if (last) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); ans.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}
const onbNextLabel = () => (onbState().stage === 'qa' ? (onbBoxes().length ? 'Go to the uploads' : 'Next') : 'Skip to uploads');
function onbSay(role, text) { const o = onbState(); o.log.push([role, String(text).slice(0, 900)]); if (o.log.length > 30) o.log.splice(0, o.log.length - 30); persist(); }
async function onbAsk(q) {
  q = String(q || '').trim(); if (!q || onbBusy) return;
  onbSay('me', q.slice(0, 300)); sfx('tap');
  const faq = onbFaqFor(q);
  if (!askFn) await connectAsk().catch(() => {});
  if (!askFn) { onbSay('ai', faq ? faq[2]() : 'Typed questions need Claude, which this copy of the page cannot reach. The Ask button on Home answers anything once setup is done, or tap one of the questions below.'); onbPaint(true); return; }
  onbBusy = true; onbPaint(true);
  try {
    const turns = onbState().log.slice(-8).map(([r, t]) => ({ role: r === 'me' ? 'user' : 'assistant', content: t }));
    while (turns.length && turns[0].role !== 'user') turns.shift();
    turns[0] = { role: 'user', content: ONB_GUIDE + `\n\nTheir currency: ${sym()}.\n\nQuestion: ` + turns[0].content };
    const r = await askFn(turns, { cache: false, modelTier: 'quick' });
    const t = String((r && r.text) || '').replace(/\s*—\s*/g, ', ').trim();
    onbSay('ai', t || (faq ? faq[2]() : 'No answer came back. Try again, or tap one of the questions below.'));
  } catch (e) { onbSay('ai', faq ? faq[2]() : 'That did not go through. Try again in a moment, or tap one of the questions below.'); }
  onbBusy = false; onbPaint(true);
}
/* the answers become the boxes on the next screen. Boxes that already hold files, or that the person named there, stay. */
function onbApply() {
  const bx = onbBoxes(); if (!bx.length) return;
  if (impAccts.some(a => a.files.length)) return;
  impAccts = bx.map(b => acctNew(b.kind, b.name));
}
const STEP_CHAT = { id: 'chat', part: PART.money, setup: true, art: '', title: 'Before the uploads', when: () => !impOnly || !(Array.isArray(S.ui.accts) && S.ui.accts.length),
  next: () => onbNextLabel(), nextPlain: true,
  leave: d => { if (d > 0) onbApply(); },
  body: () => `<div class="onb" id="onbLog" role="log" aria-live="polite"></div><div class="onb-a" id="onbAns"></div>`,
  after: () => {
    const body = $('#tourBody'); onbPaint(false);
    connectAsk().catch(() => {});
    body.addEventListener('click', e => {
      const o = onbState();
      const k = e.target.closest('[data-onbk]');
      if (k) { o.k[k.dataset.onbk] = !o.k[k.dataset.onbk]; if (k.dataset.onbk === 'cash' && o.k.cash && !['bank', 'card', 'wallet'].some(x => o.k[x])) { /* cash alone is fine */ } persist(); sfx('tap'); onbPaint(false); return; }
      const n = e.target.closest('[data-onbn]'); if (n) { o.n[n.dataset.onbn] = +n.dataset.v; persist(); sfx('tap'); onbPaint(false); return; }
      const bk = e.target.closest('[data-onbback]'); if (bk) { o.stage = bk.dataset.onbback; if (o.stage === 'kinds') o.log = []; persist(); sfx('back'); onbPaint(true); return; }
      const q = e.target.closest('[data-onbq]'); if (q) { const f = ONB_FAQ.find(x => x[0] === q.dataset.onbq); if (f) { onbSay('me', f[1]); onbSay('ai', f[2]()); sfx('tap'); onbPaint(true); } return; }
      if (e.target.closest('#onbReset')) { S.ui.onb = null; onbState(); persist(); sfx('back'); onbPaint(true); return; }
      if (e.target.closest('#onbSkipNames')) { o.names = {}; o.stage = 'qa'; persist(); sfx('next'); onbPaint(true); return; }
      if (e.target.closest('#onbGo')) {
        if (o.stage === 'kinds') o.stage = ['bank', 'card', 'wallet'].some(x => o.k[x]) ? 'count' : 'qa';
        else if (o.stage === 'count') o.stage = 'names';
        else if (o.stage === 'names') { $$('[data-onbname]', body).forEach(i => { const v = i.value.trim().slice(0, 40); if (v) o.names[i.dataset.onbname] = v; else delete o.names[i.dataset.onbname]; }); o.stage = 'qa'; }
        persist(); sfx('next'); onbPaint(true);
      }
    });
    body.addEventListener('input', e => { const i = e.target.closest('[data-onbname]'); if (i) { const o = onbState(), v = i.value.slice(0, 40); if (v.trim()) o.names[i.dataset.onbname] = v; else delete o.names[i.dataset.onbname]; } });
    body.addEventListener('submit', e => { if (e.target.id !== 'onbAsk') return; e.preventDefault(); const i = $('#onbIn'); const v = i.value; i.value = ''; onbAsk(v); });
  } };
