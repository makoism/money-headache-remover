/* Mako's answers on the eight open points (DECISIONS.md, 2026-11-19), each checked on the built page. Made-up numbers.
   (1) Home says when the bank balance was entered ("Balance you entered on 18 Nov"), from a date stored when the balance is typed;
       an older saved copy with no date shows no date (never a guessed one), and the date survives a reload.
   (2) No screen uses the word "Chest": the treasure chest is only a picture.
   (3) One word per thing: Plan and setup call the places that pile up "Burrows", as Home does (no "Goals" page or "Add goal").
   (5) Home's proof is one line: Bank + burrows = total, without the long "They add up" paragraph.
   (7) Setup shows the step's name and the progress dots, never "of N".
   Run: node tests/qc/mako_answers.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
const PAGE = 'file://' + (process.env.BUILD || '/home/claude/work/money-map-team.html') + '?sfxtest';
const allText = p => p.evaluate(() => document.body.innerText);
(async () => {
  /* (7) setup step label, before anything is skipped */
  { const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true });
    await p.goto(PAGE); await w(1400);
    const labels = [];
    for (let i = 0; i < 4; i++) { labels.push(await p.evaluate(() => { const t = document.getElementById('tourPart'), d = document.getElementById('tourDots'); return (t ? t.textContent : '') + ' | ' + (d ? d.getAttribute('aria-label') : ''); }));
      await p.evaluate(() => { const n = document.getElementById('tourNext'); n && n.click(); }); await w(700); }
    ck('(7) setup labels never say "of N" (' + labels.join(' / ') + ')', labels.every(s => s.trim() !== '|' && !/\bof \d/.test(s)), labels.join(' / '));
    ck('(7) the step name is still shown', /Welcome/.test(labels[0]), labels[0]);
    ck('no page errors (setup)', errs.length === 0, errs.join(' | ')); await b.close(); }

  /* (1) (2) (3) (5) on a made-up dollar plan */
  { const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
    await p.goto(PAGE); await w(1400);
    await p.evaluate(() => { const s = document.getElementById('tourSkip'); s && s.click(); }); await w(400); await p.evaluate(() => { const s = document.getElementById('coSkip'); s && s.click(); }); await w(400);
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
    await L.base(p, { pay: 3200, bank: 1500, min: 200, defs: { 'bill:rent': 1100, 'bill:food': 400, envelope: 300, education: 50, invest: 100, give: 30 }, tT: 1200, tM: 150, eT: 5000, eS: 900, eM: 200 });
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; delete S.cfg.bankAt; __t.persist(); __t.restructure(); });
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(500);
    let home = await allText(p);
    ck('(1) a plan whose balance has no stored date shows no date on Home', !/Balance you entered on/.test(home), (home.match(/Balance you entered.{0,40}/) || [''])[0]);
    /* type a new balance in Settings, the way a person does */
    await L.settings(p);
    await L.typeIn(p, '#st-bankStart', '1640.5'); await p.evaluate(() => { const e = document.getElementById('st-bankStart'); e.dispatchEvent(new Event('change', { bubbles: true })); e.blur(); }); await w(700);
    const at = await p.evaluate(() => __t.S.cfg.bankAt || '');
    await p.keyboard.press('Escape'); await w(400); await p.evaluate(() => { const c = document.querySelector('#setClose,[data-close="sets"],.sheet-close'); c && c.click(); }); await w(300);
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
    home = await allText(p);
    const today = await p.evaluate(() => { const d = new Date(); return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; });
    ck('(1) typing a balance stores the day it was entered (' + at + ')', /^\d{4}-\d{2}-\d{2}$/.test(at), at);
    ck('(1) Home says "Balance you entered on ' + today + '" with the amount', new RegExp('Balance you entered on ' + today + '\\b[^\\n]*\\$1,640\\.50').test(home), (home.match(/Balance you entered.{0,60}/) || ['(none)'])[0]);
    const fresh = await p.evaluate(() => { const f = document.querySelector('.mp-fresh'), k = [...document.querySelectorAll('.mp-key')].pop(); return f && k ? f.getBoundingClientRect().top >= k.getBoundingClientRect().top : false; });
    ck('(1) the date sits under the bank figure (the "where your money sits" key)', fresh);
    await p.reload(); await w(1600);
    await p.evaluate(() => { const s = document.getElementById('tourSkip'); s && s.click(); }); await w(300);
    home = await allText(p);
    ck('(1) the date survives a reload', new RegExp('Balance you entered on ' + today).test(home) && (await p.evaluate(() => __t.S.cfg.bankAt)) === at, (home.match(/Balance you entered.{0,60}/) || ['(none)'])[0]);
    /* (5) the proof line */
    const proof = await p.evaluate(() => { const e = document.querySelector('.mp-proof'); return e ? e.innerText : ''; });
    ck('(5) the proof is the one line "Bank + burrows = total" ("' + proof + '")', /^Bank .+ \+ burrows .+ = .+ at the end of \w+\./.test(proof) && !/They add up|not yet compared|Burrow amounts include/.test(proof) && proof.split('. ').length <= 2, proof);
    /* (2) (3) every tab: no "Chest", no "Goals" page or "Add goal" */
    const texts = {};
    for (const [n, t, sub] of [['home', 'tab-home'], ['spending', 'tab-receipts'], ['plan', 'tab-month', 'month'], ['plan burrows', 'tab-month', 'goals'], ['plan all months', 'tab-month', 'months'], ['burrows', 'tab-goals'], ['basics', 'tab-basics']]) {
      await L.tab(p, t); if (sub) { await p.evaluate(s => { const e = document.querySelector(`[data-sub="${s}"]`); e && e.click(); }, sub); await w(500); }
      texts[n] = await allText(p); }
    const chest = Object.keys(texts).filter(k => /\bchest\b/i.test(texts[k]));
    ck('(2) no screen says "Chest" (' + (chest.join(', ') || 'none') + ')', chest.length === 0, chest.map(k => k + ': ' + texts[k].match(/.{0,40}\bchest\b.{0,40}/i)[0]).join(' || '));
    const goalsWord = Object.keys(texts).filter(k => /(^|\n)\s*Goals\s*(\n|$)|\bAdd goal\b|\bAdd a goal\b/.test(texts[k]));
    ck('(3) Plan and the other tabs say Burrows, never a "Goals" heading or "Add goal" (' + (goalsWord.join(', ') || 'none') + ')', goalsWord.length === 0, goalsWord.map(k => k + ': ' + (texts[k].match(/.{0,30}(Goals|Add a? ?goal).{0,30}/) || [''])[0]).join(' || '));
    ck('(3) the Plan subpage button reads "Burrows"', await p.evaluate(() => [...document.querySelectorAll('[data-sub="goals"]')].every(e => e.textContent.trim() === 'Burrows')));
    ck('no page errors (plan)', errs.length === 0, errs.join(' | ')); await b.close(); }

  /* (1) an older saved copy (no date stored) loads and shows no date; the backup keeps a date when there is one */
  { const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true });
    await p.goto(PAGE); await w(1400);
    await p.evaluate(() => { const s = document.getElementById('tourSkip'); s && s.click(); }); await w(400);
    const kept = await p.evaluate(() => { const c = __t.cleanCfg || (typeof cleanCfg !== 'undefined' ? cleanCfg : null); if (!c) return 'no cleanCfg'; return JSON.stringify([c({ bankStart: 10, bankAt: '2026-11-18' }), c({ bankStart: 10, bankAt: 'yesterday' }), c({ bankStart: 10 })]); });
    ck('(1) a saved copy keeps a real date and drops anything else (' + kept + ')', kept === JSON.stringify([{ bankStart: 10, bankAt: '2026-11-18' }, { bankStart: 10 }, { bankStart: 10 }]), kept);
    ck('no page errors (load)', errs.length === 0, errs.join(' | ')); await b.close(); }
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
