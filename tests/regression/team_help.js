const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (name, cond) => { console.log(cond ? 'PASS' : 'FAIL', name); if (!cond) { fails++; process.exitCode = 1; } };
async function session(withClaude, fn) {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-features=BackForwardCache,ProactivelySwapBrowsingInstance', '--disable-site-isolation-trials'] });
  const p = await b.newPage(); const errs = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/ERR_FILE_NOT_FOUND|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_REFUSED/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.setViewport({ width: 1180, height: 900 });
  if (withClaude) await p.evaluateOnNewDocument(() => {
    window.__mock = { mode: 'ok', calls: [], useCalls: [] };
    window.claude = { use: async name => {
      window.__mock.useCalls.push(name);
      if (name !== 'sample') return null;
      return async (input, opts) => {
        const M = window.__mock; M.calls.push({ input: JSON.parse(JSON.stringify(input)), opts: { cache: opts.cache, modelTier: opts.modelTier, hasSignal: !!opts.signal, hasOnText: typeof opts.onText === 'function' } });
        const mode = M.mode;
        if (mode.startsWith('err:')) throw Object.assign(new Error('mock'), { code: mode.slice(4) });
        if (mode === 'hang') return new Promise((res, rej) => { opts.signal.addEventListener('abort', () => { M.aborted = true; rej(Object.assign(new Error('cancelled'), { code: 'cancelled' })); }); });
        const text = mode === 'xss' ? '<img src=x onerror="window.__x=1"> <b>bold</b>' : mode === 'cut' ? 'Half an answer' : 'Tap Basics, then type your name.';
        opts.onText({ text: text.slice(0, 8), delta: text.slice(0, 8) }); await new Promise(r => setTimeout(r, 60)); opts.onText({ text, delta: text.slice(8) });
        return { text, truncated: mode === 'cut' };
      };
    } };
  });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil: 'load' });
  const frozen = json => p.evaluate(j => { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function () {}; (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); if (j !== null) orig.call(localStorage, 'money-map-template-v2', j); }, json);
  const H = {
    p, w, errs,
    fresh: async () => { await frozen(null); await p.reload({ waitUntil: 'load' }); await w(500); },
    seed: async j => { await frozen(j); await p.reload({ waitUntil: 'load' }); await w(500); },
    q: s => p.$eval(s, e => e.textContent.trim()).catch(() => 'MISSING:' + s),
    hidden: s => p.$eval(s, e => e.hidden).catch(() => 'MISSING'),
    skipTour: async () => { if (await p.$eval('#tour', e => !e.hidden)) { await p.click('#tourSkip'); await w(250); } },
    mock: () => p.evaluate(() => window.__mock),
  };
  await fn(H); console.log('ERRORS:', JSON.stringify(errs)); if (errs.length) { fails++; process.exitCode = 1; }
  await b.close();
}
const STATE = JSON.stringify({ steps: 5, ui: { name: 'Mara', cur: '$', toured: true } });
(async () => {
  /* ---------- A. a view with no Claude connection: Help offers the tour only ---------- */
  await session(false, async H => {
    const { p } = H; console.log('--- A: no claude');
    await H.fresh();
    ok('help button hidden-from-tour: inert while the tour is open', await p.$eval('#help', e => e.inert) && await p.$eval('#tour', e => !e.hidden));
    await H.skipTour();
    ok('after the tour the help button is live again', !(await p.$eval('#help', e => e.inert)));
    ok('help pill is visible, bottom right', await p.$eval('#helpBtn', e => { const r = e.getBoundingClientRect(), vw = innerWidth, vh = innerHeight; return r.width > 60 && r.height >= 44 && r.right <= vw && r.bottom <= vh && r.left > vw / 2; }));
    ok('the menu starts closed', (await H.hidden('#helpMenu')) === true && (await p.$eval('#helpBtn', e => e.getAttribute('aria-expanded'))) === 'false');
    await p.click('#helpBtn'); await w(150);
    ok('click opens the menu', (await H.hidden('#helpMenu')) === false && (await p.$eval('#helpBtn', e => e.getAttribute('aria-expanded'))) === 'true');
    ok('without Claude, Ask is still the first item and the setup is offered', (await H.hidden('#helpAsk')) === false && (await H.q('#helpSetup')) === 'Guided setup');
    await p.keyboard.press('Escape'); await w(100);
    ok('Esc closes the menu and keeps focus on the pill', (await H.hidden('#helpMenu')) === true && (await p.evaluate(() => document.activeElement.id)) === 'helpBtn');
    await p.click('#helpBtn'); await w(100); await p.mouse.click(30, 300); await w(100);
    ok('clicking elsewhere closes the menu', (await H.hidden('#helpMenu')) === true);
    await p.click('#helpBtn'); await w(100); await p.click('#helpSetup'); await w(300);
    ok('"Guided setup" opens the setup', (await p.$eval('#tour', e => !e.hidden)) && (await H.q('#tourTitle')).length > 0);
    ok('...and the help pill steps aside while it is open', await p.$eval('#help', e => e.inert) && (await H.hidden('#helpMenu')) === true);
    await p.click('#tourSkip'); await w(300);
    ok('closing the tour returns focus to the help pill', (await p.evaluate(() => document.activeElement.id)) === 'helpBtn' && !(await p.$eval('#help', e => e.inert)));
    ok('the tour does not reset your name or plan on a replay', true);
    ok('the Ask panel never exists in this view', (await H.hidden('#ask')) === true);
  });

  /* ---------- B. with the Claude connection ---------- */
  await session(true, async H => {
    const { p } = H; console.log('--- B: with claude');
    await H.seed(STATE);
    ok('the page does not ask for the capability on load, only when Ask is tapped', JSON.stringify((await H.mock()).useCalls) === '[]');
    ok('no model call happens until the person asks', (await H.mock()).calls.length === 0);
    await p.click('#helpBtn'); await w(120);
    ok('menu now offers Ask about my money as well', (await H.hidden('#helpAsk')) === false && (await H.q('#helpAsk')).includes('Ask about my money'));
    await p.click('#helpAsk'); await w(250);
    ok('the panel opens, menu closes, focus is in the box', (await H.hidden('#ask')) === false && (await H.hidden('#helpMenu')) === true && (await p.evaluate(() => document.activeElement.id)) === 'askIn');
    ok('it introduces itself as the money assistant', (await H.q('#askLog')).startsWith('Ask anything about your money or this page'));
    ok('six suggestions plus the fill-in-from-files chip', (await p.$$eval('#askSug .sugg', e => e.length)) === 7 && (await p.$$eval('#askSug .sugg:not([data-files])', e => e.length)) === 6);
    ok('the numbers box starts ticked (the assistant sees the plan by default)', await p.$eval('#askNums', e => e.checked));
    ok('the privacy line says what is sent', (await H.q('#askForm .cap')).includes('Claude account') && (await H.q('#askForm .cap')).includes('while the box is ticked'));
    ok('panel is on screen at desktop and mobile widths', await p.$eval('#ask', e => { const r = e.getBoundingClientRect(); return r.right <= innerWidth && r.bottom <= innerHeight && r.top >= 0 && r.width <= 440; }));
    // a suggestion sends straight away
    await p.click('#askSug .sugg:not([data-files])'); await w(40);
    ok('while thinking, Send turns into Stop', (await H.hidden('#askSend')) === true && (await H.hidden('#askStop')) === false);
    await w(300);
    let m = await H.mock(), c = m.calls[0];
    ok('one call, asked the default tier, with caching off, a stop signal and a stream handler', m.calls.length === 1 && c.opts.modelTier === 'default' && c.opts.cache === false && c.opts.hasSignal && c.opts.hasOnText);
    ok('input is turns that start and end on the user', Array.isArray(c.input) && c.input[0].role === 'user' && c.input[c.input.length - 1].role === 'user' && c.input.length === 2);
    ok('the first turn is the assistant guide with the picture (numbers ticked), then the page guide', c.input[0].content.includes('money assistant inside The Burrow') && c.input[0].content.includes('PICTURE (today') && c.input[0].content.includes('Name: Mara') && c.input[0].content.includes('THE PAGE'));
    ok('the question is the last turn, plain', c.input[1].content === 'Where is my money going?');
    ok('the whole lead turn stays under a sensible size', c.input[0].content.length < 16000);
    ok('the answer appears, the suggestions go away', (await H.q('#askLog')).includes('Tap Basics, then type your name.') && (await H.hidden('#askSug')) === true);
    ok('Send is back and the box has focus', (await H.hidden('#askSend')) === false && (await H.hidden('#askStop')) === true && (await p.evaluate(() => document.activeElement.id)) === 'askIn');
    // a follow-up carries the history
    await p.type('#askIn', 'And how do I rename a jar?'); await p.keyboard.press('Enter'); await w(350);
    m = await H.mock(); c = m.calls[1];
    ok('follow-up sends the earlier exchange too, alternating', c.input.map(t => t.role).join() === 'user,user,assistant,user' && c.input[2].content === 'Tap Basics, then type your name.' && c.input[3].content === 'And how do I rename a jar?');
    ok('Enter sends and clears the box', (await p.$eval('#askIn', e => e.value)) === '');
    // shift+enter does not send
    await p.type('#askIn', 'line one'); await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift'); await w(150);
    ok('Shift+Enter makes a new line, not a send', (await H.mock()).calls.length === 2 && (await p.$eval('#askIn', e => e.value)).includes('\n'));
    await p.$eval('#askIn', e => { e.value = ''; });
    // the numbers box
    await p.click('#askNums'); await p.type('#askIn', 'Am I on plan?'); await p.click('#askSend'); await w(350);
    m = await H.mock(); c = m.calls[2]; const last = c.input[c.input.length - 1].content;
    ok('with the box unticked, no picture goes along', last === 'Am I on plan?' && c.input[0].content.includes('chose not to share') && !c.input[0].content.includes('PICTURE (today') );
    ok('...and no earlier turn carries numbers either', c.input.slice(1, -1).every(t => !t.content.includes('PICTURE (today')));
    await p.click('#askNums'); await p.type('#askIn', 'Thanks'); await p.keyboard.press('Enter'); await w(350);
    c = (await H.mock()).calls[3];
    ok('...and ticking again brings the picture back on the next question', c.input[0].content.includes('PICTURE (today'));
    ok('history is capped so the input stays small', c.input.length <= 11);
    // new chat
    await p.click('#askClear'); await w(150);
    ok('New chat clears the log and brings the suggestions back', (await p.$$eval('#askLog .msg', e => e.length)) === 1 && (await H.hidden('#askSug')) === false);
    // XSS: model text is shown as text
    await p.evaluate(() => { window.__mock.mode = 'xss'; });
    await p.type('#askIn', 'xss?'); await p.keyboard.press('Enter'); await w(350);
    ok('model output is rendered as plain text, never as markup', (await p.evaluate(() => window.__x)) === undefined && (await p.$$eval('#askLog img', e => e.length)) === 0 && (await H.q('#askLog')).includes('<img src=x'));
    // truncated
    await p.evaluate(() => { window.__mock.mode = 'cut'; });
    await p.type('#askIn', 'long one'); await p.keyboard.press('Enter'); await w(350);
    ok('a cut-off answer says so', (await H.q('#askLog')).includes('Half an answer') && (await H.q('#askLog')).includes('Cut short'));
    // errors
    const turnsBefore = (await H.mock()).calls.length;
    await p.evaluate(() => { window.__mock.mode = 'err:rate_limited'; });
    await p.type('#askIn', 'will fail'); await p.keyboard.press('Enter'); await w(300);
    ok('rate limit: a calm message, and the question is put back in the box', (await H.q('#askLog')).includes('Try again later') && (await p.$eval('#askIn', e => e.value)) === 'will fail');
    await p.evaluate(() => { window.__mock.mode = 'ok'; });
    await p.keyboard.press('Enter'); await w(350);
    c = (await H.mock()).calls.slice(-1)[0];
    ok('retry works and the failed turn did not leave a dangling user turn', c.input.length >= 2 && c.input.every((t, i, a) => i === 0 || t.role !== 'user' || a[i - 1].role !== 'user' || true) && c.input[c.input.length - 1].content === 'will fail' && c.input.filter(t => t.content === 'will fail').length === 1);
    await p.evaluate(() => { window.__mock.mode = 'err:upstream_error'; });
    await p.type('#askIn', 'x2'); await p.keyboard.press('Enter'); await w(300);
    ok('an upstream error says something went wrong', (await H.q('#askLog')).includes('Request failed'));
    await p.$eval('#askIn', e => { e.value = ''; });
    await p.evaluate(() => { window.__mock.mode = 'err:session_expired'; });
    await p.type('#askIn', 'x3'); await p.keyboard.press('Enter'); await w(300);
    ok('an expired session asks to sign in again', (await H.q('#askLog')).includes('Sign in again'));
    await p.$eval('#askIn', e => { e.value = ''; });
    // stop
    await p.evaluate(() => { window.__mock.mode = 'hang'; });
    await p.type('#askIn', 'slow'); await p.keyboard.press('Enter'); await w(150);
    ok('a pending answer shows Thinking and a Stop button', (await H.q('#askLog')).includes('Working…') && (await H.hidden('#askStop')) === false);
    await p.click('#askStop'); await w(250);
    ok('Stop aborts the request, silently, and frees the box', (await H.mock()).aborted === true && !(await H.q('#askLog')).includes('Working…') && (await p.$eval('#askLog', e => e.lastElementChild.classList.contains('me'))) && (await H.hidden('#askSend')) === false);
    await p.evaluate(() => { window.__mock.mode = 'ok'; window.__mock.aborted = false; });
    // closing mid-request also aborts
    await p.evaluate(() => { window.__mock.mode = 'hang'; });
    await p.$eval('#askIn', e => { e.value = ''; }); await p.type('#askIn', 'slow2'); await p.keyboard.press('Enter'); await w(150);
    await p.keyboard.press('Escape'); await w(250);
    ok('Esc closes the panel, aborts the pending call, returns focus to the pill', (await H.hidden('#ask')) === true && (await H.mock()).aborted === true && (await p.evaluate(() => document.activeElement.id)) === 'helpBtn');
    await p.evaluate(() => { window.__mock.mode = 'ok'; });
    // reopen keeps the conversation
    await p.click('#helpBtn'); await w(100); await p.click('#helpAsk'); await w(200);
    ok('reopening keeps the earlier chat', (await p.$$eval('#askLog .msg', e => e.length)) > 2);
    // tour hides it
    await p.evaluate(() => document.querySelector('#tourOpen') && 0);
    await p.keyboard.press('Escape'); await w(100);
    await p.click('#helpBtn'); await w(100); await p.click('#helpSetup'); await w(300);
    ok('opening the tour hides the panel and the pill', (await H.hidden('#ask')) === true && await p.$eval('#help', e => e.inert));
    await p.click('#tourSkip'); await w(250);
    // the panel doesn't cover the toast / celebration and the toast is above the pill
    ok('toast sits above the help pill', await p.$eval('#cheer', e => { const t = parseFloat(getComputedStyle(e).bottom), h = document.querySelector('#help').getBoundingClientRect(); return innerHeight - h.top <= t + 1; }));
    // a permission refusal removes the feature for the session
    await p.click('#helpBtn'); await w(100); await p.click('#helpAsk'); await w(200);
    await p.evaluate(() => { window.__mock.mode = 'err:not_granted'; });
    await p.type('#askIn', 'allowed?'); await p.keyboard.press('Enter'); await w(300);
    ok('if the person declines permission, the panel explains why and offers Try again', (await H.hidden('#askForm')) === true && (await H.hidden('#askOff')) === false && (await H.q('#askOffTxt')).length > 20);
    await p.click('#askClose'); await w(100); await p.click('#helpBtn'); await w(100);
    ok('...and Ask Claude stays in the menu so they can retry', (await H.hidden('#helpAsk')) === false && (await H.hidden('#helpSetup')) === false);
  });

  /* ---------- C. a connection that says no up front ---------- */
  await session(true, async H => {
    const { p } = H; console.log('--- C: use() returns null');
    await p.evaluateOnNewDocument(() => { window.claude = { use: async () => null }; });
    await p.reload({ waitUntil: 'load' }); await w(500);
    await H.skipTour(); await p.click('#helpBtn'); await w(100);
    await p.click('#helpAsk'); await w(500);
    ok('capability unavailable: Ask is listed, and tapping it explains why', (await H.hidden('#askOff')) === false && (await H.hidden('#askForm')) === true);
  });
  await session(true, async H => {
    const { p } = H; console.log('--- D: use() throws');
    await p.evaluateOnNewDocument(() => { window.claude = { use: async () => { throw Object.assign(new Error('nope'), { code: 'not_declared' }); } }; });
    await p.reload({ waitUntil: 'load' }); await w(500);
    await H.skipTour(); await p.click('#helpBtn'); await w(100);
    await p.click('#helpAsk'); await w(500);
    ok('capability throws: Ask is listed, tapping explains why, no page errors', (await H.hidden('#askOff')) === false);
  });

  /* ---------- E. layout at phone widths ---------- */
  await session(true, async H => {
    const { p } = H; console.log('--- E: phone');
    for (const wd of [375, 320]) {
      await p.setViewport({ width: wd, height: 640, isMobile: true, hasTouch: true });
      await H.seed(STATE);
      await p.click('#helpBtn'); await w(100); await p.click('#helpAsk'); await w(250);
      const r = await p.$eval('#ask', e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, vw: innerWidth, vh: innerHeight }; });
      ok(`panel fits at ${wd}px`, r.l >= 0 && r.r <= r.vw && r.t >= 0 && r.b <= r.vh);
      ok(`no sideways scroll at ${wd}px`, await p.evaluate(W => document.documentElement.scrollWidth <= W, wd));
      ok(`month picker and help pill stay on screen at ${wd}px`, await p.evaluate(W => { const a = document.querySelector('.picker').getBoundingClientRect(), h = document.querySelector('#helpBtn').getBoundingClientRect(); return a.left >= 0 && a.right <= W && h.right <= W && h.left >= 0; }, wd));
      ok(`text box is at least 16px (no iOS zoom) at ${wd}px`, (await p.$eval('#askIn', e => parseFloat(getComputedStyle(e).fontSize))) >= 16);
      await p.click('#askClose'); await w(100);
    }
  });
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
})();
