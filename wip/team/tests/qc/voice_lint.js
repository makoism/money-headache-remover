/* voice_lint: the voice tells a script can catch for free (cost rule 3; the rules are in VOICE.md, the numbers below are its rule numbers).
   It POINTS, it does not judge: a flagged line can be fine and an unflagged line can still sound like AI. The qc-voice agent judges.
   It prints findings and always exits 0, so it never fails a build. With --strict it exits 1 when there is any finding marked "strong"
   (the main session decides when that becomes a gate).

   What it reads:
     node tests/qc/voice_lint.js                 the app's source strings: every .js part named in build.sh, plus body.html
     node tests/qc/voice_lint.js --text F...     plain text or markdown files, one finding per line (help texts, screen pack .txt files)
   Options: --all (also the weak hints: long sentences, a missing contraction, a full stop on a one-line note), --strict, --quiet (counts only),
            --tsv (file, line, kind, text: the strings it would check, nothing else; used to build COPY_V1.md)
   Needs acorn for the source strings (bash tests/setup_env.sh installs it); without it, it says so and checks body.html only.
   No browser. About one second. Run from wip/team. */
const fs = require('fs'), path = require('path');
const TEAM = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const flag = f => args.includes(f);
const ALL = flag('--all'), STRICT = flag('--strict'), QUIET = flag('--quiet'), TSV = flag('--tsv'), SELF = flag('--selftest');

/* ---------- the rules ---------- */
/* A9, strong: words counted in studies of AI text or on editors' lists, and never needed in a money app */
const AI_WORDS = ['delve', 'delves', 'delving', 'tapestry', 'testament', 'pivotal', 'underscore', 'underscores', 'showcase', 'showcasing', 'foster', 'fostering',
  'garner', 'interplay', 'intricate', 'intricacies', 'meticulous', 'meticulously', 'commendable', 'realm', 'landscape', 'vibrant', 'enduring', 'groundbreaking',
  'renowned', 'nestled', 'boasts', 'profound', 'exemplifies', 'deep dive', 'game-changer', 'game changer', 'leverage', 'leveraging', 'utilize', 'utilise',
  'streamline', 'streamlined', 'robust', 'empower', 'empowers', 'empowering', 'facilitate', 'seamless', 'seamlessly', 'elevate', 'unlock', 'unlocks', 'navigate',
  'navigating', 'journey', 'holistic', 'harness', 'crucial', 'comprehensive', 'effortless', 'effortlessly', 'supercharge', 'tailored', 'curated', 'peace of mind',
  'rest assured', 'at a glance', 'take control', 'in control of', 'financial wellness', 'financial health', 'best practices', 'moreover', 'furthermore',
  'additionally', 'in conclusion', 'in summary', 'ultimately', 'essentially', 'it is important to note', "it's important to note", 'it is worth noting',
  "it's worth noting", 'worth noting', 'plays a vital role', 'plays a key role', 'serves as', 'stands as', 'a testament to', "here's the thing",
  'let that sink in', 'the best part', 'no fluff', 'i hope this helps', 'great question', 'as an ai', 'let me know if', 'feel free to', "we're excited",
  'we are excited', 'oops', 'uh oh', 'whoops', 'hooray', 'yay', 'amazing', 'congrats', 'congratulations', "you've got this", 'you got this'];
/* A1: comfort nobody asked for */
const COMFORT = ['and that is fine', "and that's fine", 'that is okay', "that's okay", 'that is ok', "that's ok", 'it is okay to', "it's okay to", 'without guilt',
  'no guilt', 'no shame', 'guilt-free', 'guilt free', 'not being tested', 'not a verdict', 'not a judgment', 'not a judgement', 'not a grade', 'do not owe',
  "don't owe", 'no wrong feeling', 'no wrong answer', 'be kind to yourself', "you're not alone", 'you are not alone', "don't worry", 'do not worry', 'no worries',
  'no rush', 'no pressure', 'take your time', 'calming', 'your calm', 'the calm', 'feel calm', 'gentle', 'gently', 'worse person', 'ashamed', 'to be safe later',
  'happens to almost everyone', 'happens to everyone', 'we understand', 'we know it'];
/* B2: stiff words in the app today that Mako would not say, with what he would say */
const STIFF = { exceeds: 'is more than', exceed: 'go over', invented: 'made up', regularly: 'every now and then', 'in order to': 'to', 'such as': 'like',
  however: 'but', therefore: 'so', ensure: 'make sure', ensures: 'makes sure', additional: 'more', approximately: 'about', prior: 'before', 'prior to': 'before',
  purchase: 'buy', purchases: 'things you buy', assistance: 'help', obtain: 'get', receive: 'get', require: 'need', requires: 'needs', indicates: 'shows',
  'e.g.': 'like', 'i.e.': '', etc: '', simply: '', plainly: '', kindly: '', please: '', 'is not available': "can't", 'not available': "can't", via: 'with',
  upon: 'when', whilst: 'while', thus: 'so', hence: 'so', utilised: 'used', commence: 'start', sufficient: 'enough', insufficient: 'not enough' };
/* A7 */
const SWEEPING = ['most people', 'many people', 'people who', 'almost everyone', 'nearly everyone', 'everyone knows', 'a lot of us', 'most of us', 'studies show', 'experts'];
/* A12 */
const HEDGES = /\b(may|might|perhaps|possibly|tends? to|can sometimes|could potentially|generally|typically|in most cases|it seems)\b/gi;
/* B3 */
const UNCONTRACTED = /\b(do not|does not|did not|is not|are not|was not|were not|will not|cannot|can not|could not|would not|should not|have not|has not|it is|that is|there is|you are|you have|you will|what is|here is|let us)\b/i;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = list => new RegExp('(?:^|[^A-Za-z])(' + list.map(esc).sort((a, b) => b.length - a.length).join('|') + ')(?![A-Za-z])', 'i');
const RE_AI = wordRe(AI_WORDS), RE_COMFORT = wordRe(COMFORT), RE_STIFF = wordRe(Object.keys(STIFF)), RE_SWEEP = wordRe(SWEEPING);
/* A3: "it is not X, it is Y", "not just X", "not about X. It is about Y" */
const RE_NOTXY = /\b(?:it|this|that|these|they)(?:'s| is|'re| are)\s+not\s+(?:just\s+|only\s+|about\s+|to\s+)?[^.?!]{1,60}[,.;]\s*(?:it|this|that|they)(?:'s| is|'re| are)\b|\bnot (?:just|only|merely)\b[^.?!]{1,60}\bbut\b|\b(?:isn't|is not|aren't) (?:just|only|about)\b/i;
/* A4: three items in one sentence: "a, b and c" or "a, b, and c" (single words or short phrases) */
const RE_THREE = /(?:^|[\s(:])((?:[A-Za-z'’-]+\s){0,2}[A-Za-z'’-]+), (?!then |or |and |so |but |like |which |if |when )((?:[A-Za-z'’-]+\s){0,2}[A-Za-z'’-]+),? (?:and|or) ((?:[A-Za-z'’-]+\s){0,2}[A-Za-z'’-]+)/;
/* the same without "and": a sentence that is only three short phrases, "a broken phone, a sick relative, a quiet month" */
const RE_THREE_BARE = /^(?:[^,.?!]*: )?(?:[A-Za-z'’-]+\s){0,4}[A-Za-z'’-]+, (?:[A-Za-z'’-]+\s){0,4}[A-Za-z'’-]+, (?:[A-Za-z'’-]+\s){0,5}[A-Za-z'’-]+[.?!]?$/;
/* A2: a short last sentence that sums up */
const RE_CLOSER = /^(?:that is|that's|it is just|it's just|it is that|it's that|nothing more|nothing else|done|simple as that|that is all|that's all|that is it|that's it|same money|and that is|and that's|no more|every time|one step at a time|small steps)\b/i;
/* A8 */
const RE_WARMUP = /^(?:here's the thing|here is the thing|let me explain|let's be honest|the truth is|the good news|the result\?|the best part\?|so what does|why\? because|think of it (?:as|like))/i;
const MAX_WORDS = 24;          /* a sentence longer than this is a hint (--all) */

const sentences = t => t.replace(/\{…\}/g, 'X').split(/(?<=[.?!])\s+(?=[A-Z"“'‘¥₱$€£0-9])/).map(s => s.trim()).filter(Boolean);
const words = s => (s.match(/[A-Za-z0-9'’$¥₱€£%.,-]+/g) || []).filter(w => /[A-Za-z0-9]/.test(w));

/* one string in, a list of [level, rule, message] out. kind: 'button' | 'label' | 'note' | 'text' */
function lint(text, kind) {
  const out = []; const add = (lvl, rule, msg) => out.push([lvl, rule, msg]);
  const t = text.replace(/\s+/g, ' ').trim(); if (!t) return out;
  let m;
  if (/—/.test(t)) add('strong', 'A13', 'em dash');
  if (/\s–\s/.test(t)) add('strong', 'A13', 'en dash used as punctuation');
  if (/;/.test(t.replace(/&[a-z#0-9]+;/gi, ''))) add('strong', 'C', 'semicolon');
  if (/!/.test(t)) add('strong', 'A14', 'exclamation mark');
  if (/\.\.\.|…/.test(t.replace(/\{…\}/g, ''))) add('weak', 'C', 'ellipsis');
  if ((m = RE_AI.exec(t))) add('strong', 'A9', 'AI word: "' + m[1] + '"');
  if ((m = RE_COMFORT.exec(t))) add('strong', 'A1', 'comfort nobody asked for: "' + m[1] + '"');
  if ((m = RE_NOTXY.exec(t))) add('strong', 'A3', 'the "not X, it is Y" shape: "' + m[0].slice(0, 60) + '"');
  if ((m = RE_SWEEP.exec(t))) add('strong', 'A7', 'sweeping claim about people: "' + m[1] + '"');
  if ((m = RE_STIFF.exec(t))) { const w = m[1].toLowerCase(); add('weak', 'B2', 'stiff word: "' + m[1] + '"' + (STIFF[w] ? ' (say "' + STIFF[w] + '")' : ' (cut it)')); }
  const S = sentences(t);
  for (const s of S) {
    if ((m = RE_THREE.exec(s)) || (m = RE_THREE_BARE.exec(s))) add('weak', 'A4', 'three in a row: "' + m[0].trim().slice(0, 70) + '" (fine if it is a real list)');
    if (RE_WARMUP.test(s)) add('strong', 'A8', 'warm-up or question-then-answer: "' + s.slice(0, 40) + '"');
    const n = words(s).length; if (n > MAX_WORDS) add('hint', 'B12', 'long sentence, ' + n + ' words');
  }
  for (let i = 0; i + 1 < S.length; i++) if (/\?$/.test(S[i]) && words(S[i]).length <= 6 && !/\?$/.test(S[i + 1]) && /^(?:it|this|that|because|yes|no|simple)\b/i.test(S[i + 1])) add('weak', 'A8', 'question then its own answer: "' + S[i] + '"');
  if (S.length >= 2) {
    const last = S[S.length - 1]; const n = words(last).length;
    if (n <= 7 && RE_CLOSER.test(last)) add('strong', 'A2', 'neat closing line: "' + last + '"');
  }
  let run = 0, worst = 0; for (const s of S) { if (words(s).length <= 4) { run++; worst = Math.max(worst, run); } else run = 0; }
  if (worst >= 3) add('weak', 'A5', worst + ' short fragments in a row');
  const hedges = (t.match(HEDGES) || []).length; if (hedges >= 2) add('weak', 'A12', hedges + ' hedges in one string');
  if ((m = UNCONTRACTED.exec(t))) add('hint', 'B3', 'no contraction: "' + m[1] + '"');
  /* Part C, by where the string sits */
  if (/\(/.test(t) && !/\((?:optional|[^)]{0,3})\)/i.test(t)) add('hint', 'C', 'a side note in brackets');
  if (/^[^.?!:]{3,30}:\s+[a-z]/.test(t) && !/^[^:]*:\s*[\d$¥₱€£{]/.test(t) && S.length <= 2 && kind !== 'label') add('hint', 'A13', 'a colon that sets up a reveal');
  if (kind === 'button' || kind === 'label') {
    if (/[.:;,]$/.test(t)) add(kind === 'button' ? 'strong' : 'weak', 'C', kind + ' ends with punctuation');
    if (kind === 'button' && words(t).length > 4) add('hint', 'C', 'button longer than 4 words');
  } else if (kind === 'note' && S.length === 1 && /\.$/.test(t)) add('hint', 'C', 'one-line note ends with a full stop');
  return out;
}

/* ---------- reading the strings ---------- */
const INLINE = /<\/?(?:b|i|em|strong|span|a|u|small|code|sup|sub|abbr|mark)\b[^>]*>/gi;
const looksLikeProse = t => {
  if (t.length < 3 || !/[A-Za-z]{2}/.test(t)) return false;
  if (/^https?:|^data:|^[#.][\w-]+$|^[\w-]+\.(?:js|css|png|jpg|mp4|json|html)$/i.test(t)) return false;
  if (/^[a-z0-9_\-.#:[\]="' ,>()*%+/]+$/.test(t) && !/^[a-z]+(?: [a-z']+){2,}$/.test(t)) return false;      /* selectors, ids, css values, keys */
  if (/^[A-Za-z0-9_$.-]+$/.test(t) && !/^[A-Z][a-z]{2,}$/.test(t)) return false;                                /* one token, unless a Capitalised word */
  if (/[{};]|=>|\bfunction\b|rgba?\(|\d(?:px|ms|rem)\b|^M[\d .-]+|&[a-z]+=|\bvar\(/.test(t.replace(/\{…\}/g, '')) && !/[a-z]{3,} [a-z]{2,} [a-z]{2,}/.test(t)) return false;
  if (/\bYYYY\b|\bJSON\b|\bnull\b|^[;,] |^[A-Z]{4,} [a-z_]+: |^(?:PICTURE|MY NUMBERS FOR) /.test(t)) return false;                       /* parts of prompts sent to the assistant */
  if (/^(?:You are|You answer|You write|You read|You turn|Return only|Reply with)\b/.test(t) && t.length > 160) return false;   /* prompts sent to the assistant, never shown */
  return true;
};
const kindOf = (t, ctx) => {
  if (ctx === 'button') return 'button';
  const n = words(t).length;
  if (n <= 4 && !/[.?!]/.test(t)) return 'label';
  return sentences(t).length === 1 && n <= 16 ? 'note' : 'text';
};
/* split a chunk of html-ish text into the pieces a person sees */
function pieces(raw) {
  const out = []; const s = raw.replace(/<!--[\s\S]*?-->/g, '').replace(INLINE, '');
  const re = /<(\/?)([a-zA-Z0-9]+)[^>]*>|([^<]+)/g; let m, lastTag = '';
  while ((m = re.exec(s))) {
    if (m[3] !== undefined) { const t = m[3].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim(); if (t && looksLikeProse(t)) out.push([t, kindOf(t, lastTag)]); lastTag = ''; }
    else lastTag = m[1] ? '' : m[2].toLowerCase();
  }
  (raw.match(/(?:aria-label|title|placeholder|alt|data-tip)="([^"<>]{3,})"/g) || []).forEach(a => { const t = a.replace(/^[^"]+"/, '').slice(0, -1).trim(); if (looksLikeProse(t)) out.push([t, 'note']); });
  return out;
}
function loadAcorn() {
  for (const p of ['acorn', '/home/claude/work/tools/node_modules/acorn', path.join(TEAM, 'node_modules', 'acorn')]) { try { return require(p); } catch (e) { /* next */ } }
  return null;
}
/* every string literal and template in a .js part, with its line; ${...} in a template becomes {…} */
function jsStrings(file, acorn) {
  const src = fs.readFileSync(file, 'utf8'); const out = []; const stack = [];
  try {
    for (const tk of acorn.tokenizer(src, { ecmaVersion: 'latest', locations: true })) {
      const lab = tk.type.label;
      if (lab === '`') { const top = stack[stack.length - 1]; if (top && top.open && top.depth === 0) { stack.pop(); out.push([top.line, top.text]); } else stack.push({ open: true, depth: 0, text: '', line: tk.loc.start.line }); }
      else if (lab === 'template') { const top = stack[stack.length - 1]; if (top) top.text += tk.value; }
      else if (lab === '${') { const top = stack[stack.length - 1]; if (top) { top.text += '{…}'; top.depth++; stack.push({ open: false, braces: 1 }); } }
      else if (lab === '{') { const top = stack[stack.length - 1]; if (top && !top.open) top.braces++; }
      else if (lab === '}') { const top = stack[stack.length - 1]; if (top && !top.open && --top.braces === 0) { stack.pop(); const t = stack[stack.length - 1]; if (t) t.depth--; } }
      else if (lab === 'string') out.push([tk.loc.start.line, tk.value]);
    }
  } catch (e) { console.log('voice_lint: could not read all of ' + path.basename(file) + ' (' + e.message + ')'); }
  return out;
}
/* not checked: ui45t.js is the transcript of Mako's own video. It is him talking, so it is the voice, whatever a rule says */
const SKIP = ['ui45t.js'];
function sourceStrings() {
  const rows = []; const acorn = loadAcorn();
  const parts = [...new Set((fs.readFileSync(path.join(TEAM, 'build.sh'), 'utf8').match(/\b\w+\.js\b/g) || []))].filter(f => !SKIP.includes(f) && fs.existsSync(path.join(TEAM, f)));
  if (!acorn) console.log('voice_lint: acorn not found (bash tests/setup_env.sh installs it). Checking body.html only.');
  else for (const f of parts) for (const [line, s] of jsStrings(path.join(TEAM, f), acorn)) for (const [t, k] of pieces(s)) rows.push([f, line, k, t]);
  fs.readFileSync(path.join(TEAM, 'body.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, m => m.replace(/[^\n]/g, '')).split('\n')
    .forEach((l, i) => pieces(l).forEach(([t, k]) => rows.push(['body.html', i + 1, k, t])));
  return rows;
}
function textStrings(files) {
  const rows = [];
  for (const f of files) fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    const t = l.replace(/^\s*(?:[-*>]|\d+\.|#+)\s+/, '').replace(/\*\*|__|`/g, '').replace(/\|/g, ' ').trim();
    if (t && /[A-Za-z]{2}/.test(t)) rows.push([path.basename(f), i + 1, kindOf(t, ''), t]);
  });
  return rows;
}

/* ---------- self-test: each rule catches its own example and leaves plain copy alone ---------- */
function selftest() {
  const has = (t, rule, kind) => lint(t, kind || 'text').some(f => f[1] === rule && f[0] !== 'hint');
  const cases = [
    ['Everyone skips a week. You do not owe the app an apology.', 'A1'], ['Type the number. The gap is just a gap.'.replace('The gap is', 'That is'), 'A2'],
    ['It is not about having more. It is about knowing.', 'A3'], ['A broken phone, a sick relative, a quiet month at work.', 'A4'],
    ['Busy. Tired. A rough patch. It does not undo anything.', 'A5'], ['People who feel calm about money spend less.', 'A7'],
    ["Here's the thing about pay day.", 'A8'], ['A seamless journey to financial wellness.', 'A9'], ['Saved — for later.', 'A13'], ['All set!', 'A14'],
    ['Log spend.', 'C', 'button'], ['Plan exceeds pay by 400.', 'B2']];
  const clean = ['Log spend', 'still to pay in Nov', 'Free to spend is $204.', 'These numbers are made up. Do the step below to put yours in.', "Type what's in your bank right now and carry on from there."];
  let bad = 0;
  for (const [t, rule, kind] of cases) if (!has(t, rule, kind)) { bad++; console.log('SELFTEST FAIL: rule ' + rule + ' missed: ' + t); }
  for (const t of clean) { const f = lint(t, kindOf(t, '')).filter(x => x[0] !== 'hint'); if (f.length) { bad++; console.log('SELFTEST FAIL: plain line flagged: ' + t + ' -> ' + f.map(x => x[1] + ' ' + x[2]).join('; ')); } }
  return bad;
}

/* ---------- run ---------- */
const stBad = selftest();
if (SELF) { console.log(stBad ? 'VOICE LINT SELFTEST FAILED' : 'VOICE LINT SELFTEST OK'); process.exit(stBad ? 1 : 0); }
const ti = args.indexOf('--text');
const rows = ti >= 0 ? textStrings(args.slice(ti + 1).filter(a => !a.startsWith('--'))) : sourceStrings();
if (TSV) { const seen = new Set(); for (const r of rows) { const k = r[0] + '\t' + r[3]; if (!seen.has(k)) { seen.add(k); console.log(r.join('\t')); } } process.exit(0); }
const seen = new Set(); const byRule = {}; let strong = 0, weak = 0, hint = 0, flagged = 0, checked = 0; const lines = [];
for (const [file, line, kind, text] of rows) {
  const key = file + '|' + text; if (seen.has(key)) continue; seen.add(key); checked++;
  const f = lint(text, kind).filter(x => ALL || x[0] !== 'hint'); if (!f.length) continue; flagged++;
  for (const [lvl, rule, msg] of f) { byRule[rule] = (byRule[rule] || 0) + 1; if (lvl === 'strong') strong++; else if (lvl === 'weak') weak++; else hint++;
    lines.push(`${lvl.toUpperCase().padEnd(6)} ${rule.padEnd(3)} ${file}:${line}  ${msg}\n         | ${text.length > 220 ? text.slice(0, 220) + ' ...' : text}`); }
}
const order = { STRONG: 0, 'WEAK  ': 1, 'HINT  ': 2 };
if (!QUIET) lines.sort((a, b) => order[a.slice(0, 6)] - order[b.slice(0, 6)]).forEach(l => console.log(l));
console.log('by rule: ' + (Object.keys(byRule).sort().map(r => r + ' ' + byRule[r]).join(', ') || 'none'));
console.log(`VOICE LINT: ${checked} strings read, ${flagged} flagged: ${strong} strong, ${weak} weak` + (ALL ? `, ${hint} hints` : ' (--all adds the hints)') + '. Pointers only, the qc-voice agent judges. Not a gate.' + (stBad ? ' SELFTEST FAILED.' : ''));
process.exit(STRICT && strong ? 1 : 0);
