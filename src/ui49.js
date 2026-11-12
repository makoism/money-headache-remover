/* ---------- Scan receipts: the card at the top of the Receipts tab ----------
   Take a photo or pick pictures, Claude reads them through the viewer's own Claude account, the page checks every field and shows
   what it found with a category picker on each line, and nothing is added until the person taps "Add to my page".
   If this copy of the page cannot reach Claude, the same card offers the Claude app: copy one message, paste Claude's answer back. */
let scanFiles = [], scanBusy = false, scanCtl = null, scanTried = false, scanSettled = false, scanConn = null, scanOpened = false, scanUrls = [], scanKeep = null;
const SCAN_MAX_PX = 2400;

/* phone photos are big: shrink to a sensible size and turn HEIC and the like into JPEG when the browser can decode them */
async function shrinkPhoto(file) {
  try {
    if (!/^image\//.test(file.type) && !/\.(heic|heif|jpe?g|png|webp)$/i.test(file.name || '')) return file;
    if (/gif/.test(file.type)) return file;
    let bmp = null, w = 0, h = 0;
    if (typeof createImageBitmap === 'function') { try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { bmp = await createImageBitmap(file); } }
    if (!bmp) return file;
    w = bmp.width; h = bmp.height;
    const sc = Math.min(1, SCAN_MAX_PX / Math.max(w, h));
    if (sc === 1 && file.size < 1500000 && /^image\/(jpeg|png|webp)$/.test(file.type)) { if (bmp.close) bmp.close(); return file; }
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * sc)); cv.height = Math.max(1, Math.round(h * sc));
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bmp, 0, 0, cv.width, cv.height);
    if (bmp.close) bmp.close();
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.86));
    if (!blob || !blob.size) return file;
    return new File([blob], (file.name || 'receipt').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch (e) { return file; }
}

function scanNote(t) { const e = $('#scanMsg'); if (Array.isArray(t)) return renderNotes(e, t); e.textContent = t || ''; e.hidden = !t; }

/* decide what the card shows: the camera and file buttons when Claude can be reached, otherwise a short reason and the Claude app steps */
function paintScan() {
  const off = scanSettled && !askFn && !scanBusy;
  $('#scanDirect').hidden = off;
  $('#scanSub').textContent = off ? 'Send receipts to an AI app, then paste its reply here. Items are sorted into your categories and listed for review before anything is added.' : (askDoc ? 'Take a photo, or choose pictures, a bank CSV, Excel or PDF statement. ' : 'Take a photo, or choose pictures or a bank CSV. ') + 'Claude reads and sorts them into your categories. You review before anything is added.';
  const msg = $('#scanOff'); msg.hidden = !off;
  if (off) {
    msg.textContent = askReason === 'no_runtime' ? 'This copy is not running inside Claude and cannot read photos itself. Use an AI app below.'
      : askReason === 'not_granted' || askReason === 'sampling_disabled' || askReason === 'capability_disabled' ? 'Reading photos needs a signed-in Claude and your permission. Open this page from its Claude link, or use an AI app below.'
      : 'Claude could not be reached. Try again, or use an AI app below.';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'link'; b.id = 'scanRetry'; b.textContent = 'Try again'; msg.append(' ', b);
    if (!scanOpened) { $('#scanApp').open = true; scanOpened = true; }
  }
  $('#scanCam').disabled = $('#scanPick').disabled = scanBusy;
}
function scanConnect(force) {
  if (askFn && !force) return Promise.resolve(true);
  if (force) scanConn = null;
  if (!scanConn) scanConn = (async () => { scanTried = true; scanSettled = false; askGone = false; askFn = null; await connectAsk(); scanSettled = true; paintScan(); return !!askFn; })();
  return scanConn;
}

function paintScanFiles() {
  scanUrls.forEach(u => URL.revokeObjectURL(u)); scanUrls = [];
  const box = $('#scanFiles'); box.hidden = !scanFiles.length; $('#scanGo').hidden = !scanFiles.length;
  box.innerHTML = '';
  scanFiles.forEach((f, i) => {
    const c = document.createElement('span'); c.className = 'sfile';
    if (f.kind === 'image') { const im = document.createElement('img'), u = URL.createObjectURL(f.file); scanUrls.push(u); im.src = u; im.alt = ''; c.append(im); }
    else { const t = document.createElement('span'); t.className = 'sdoc'; t.textContent = f.kind === 'pdf' ? 'PDF' : 'CSV'; c.append(t); }
    const b = document.createElement('button'); b.type = 'button'; b.dataset.rm = i; b.setAttribute('aria-label', 'Remove ' + f.file.name); b.textContent = '×'; c.append(b);
    box.append(c);
  });
  const n = scanFiles.length, imgs = scanFiles.filter(f => f.kind === 'image').length;
  $('#scanRead').textContent = n ? (imgs === n ? `Read ${n} photo${n === 1 ? '' : 's'}` : `Read ${n} file${n === 1 ? '' : 's'}`) : 'Read my receipts';
}
function setScanBusy(b) {
  scanBusy = b; $('#scanRead').hidden = b; $('#scanStop').hidden = !b; $('#scanClear').hidden = b; $('#scanCam').disabled = $('#scanPick').disabled = b;
}

async function scanAdd(list) {
  list = Array.from(list || []); await scanConnect();
  const notes = [], maxImg = Math.min(askImg ? askImg.maxCount : 10, 10);
  for (const f of Array.from(list || [])) {
    if (isTextFile(f)) {
      if (f.size > 2000000) { notes.push(`${f.name} is too large. Try one month at a time.`); continue; }
      if (scanFiles.filter(x => x.kind === 'text').length >= ASK_MAX_TEXT) { notes.push(`Maximum ${ASK_MAX_TEXT} CSV or Excel files at a time.`); continue; }
      scanFiles.push({ file: f, kind: 'text' }); continue;
    }
    if (isPdfFile(f)) {
      if (!askDoc) { notes.push(pdfHereNote(f)); continue; }
      if (f.size > askDoc.maxInputBytes) { notes.push(`${f.name} is too large. Export fewer months, or take screenshots of the pages.`); continue; }
      if (scanFiles.filter(x => x.kind === 'pdf').length >= askDoc.maxCount) { notes.push(`Up to ${askDoc.maxCount} PDFs at a time. One month per read keeps the review short.`); continue; }
      scanFiles.push({ file: f, kind: 'pdf' }); continue;
    }
    if (!/^image\//.test(f.type) && !/\.(heic|heif|jpe?g|png|webp)$/i.test(f.name || '')) { notes.push(oldSheetNote(f) || `${f.name}: only photos, screenshots, CSV and Excel files can be read.`); continue; }
    if (!askImg) { notes.push('Photos cannot be sent from here. Use an AI app below, or a CSV from your bank.'); continue; }
    if (scanFiles.filter(x => x.kind === 'image').length >= maxImg) { notes.push(`Maximum ${maxImg} photos at a time. Read these first, then add the rest.`); continue; }
    const g = await shrinkPhoto(f);
    if (askImg.mediaTypes.indexOf(g.type) < 0) { notes.push(`${f.name}: photo format not supported. Use a screenshot instead.`); continue; }
    if (g.size > askImg.maxInputBytes) { notes.push(`${f.name} is too large. Use a screenshot instead of the original photo.`); continue; }
    scanFiles.push({ file: g, kind: 'image' });
  }
  paintScanFiles(); scanNote(notes);
}

/* the card is built by the same code as the chat, with this tab's own buttons */
function scanCtx() {
  return {
    note: scanNote, scroll: () => {}, openLabel: 'See receipts', tail: ' They are in the list below.',
    open: () => { $('#rcMonthCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };
}
function scanFail(e, bot) {
  const code = e && e.code;
  if (code === 'cancelled') { bot.remove(); return; }
  const gone = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].indexOf(code) >= 0;
  if (code === 'invite_required') scanFiles = scanKeep || scanFiles;
  askFilesFail(e, bot, () => scanRead());
  if (gone) { askFn = null; askReason = code; askGone = true; scanConn = Promise.resolve(false); scanSettled = true; paintScan(); }
}
async function scanRead() {
  if (scanBusy || !scanFiles.length) return;
  if (!(await scanConnect())) { paintScan(); return; }
  const files = scanFiles.slice(), out = $('#scanOut'); scanNote(''); out.textContent = ''; scanKeep = files;
  const bot = document.createElement('div'); bot.className = 'msg ai wait'; bot.textContent = 'Reading receipts. A few seconds.'; out.append(bot);
  scanCtl = new AbortController(); setScanBusy(true);
  try {
    const { p, clipped } = await extractFromFiles(files, '', scanCtl.signal);
    scanFiles = []; scanKeep = null; paintScanFiles();
    if (!p.receipts.length && p.pay == null && p.balance == null && !p.bills.length) {
      bot.classList.remove('wait'); bot.classList.add('note');
      bot.textContent = (p.summary ? p.summary + '\n\n' : '') + 'Nothing new found to add.' + (p.outside ? ` ${p.outside} receipt${p.outside === 1 ? '' : 's'} dated outside ${monthLabel(START)} to ${monthLabel(END)}.` : '') + ' Try a clearer photo with the whole receipt in view.';
    } else { askCard(bot, p, clipped, scanCtx()); sfx('next'); }
  } catch (e) { scanFail(e, bot); }
  setScanBusy(false); paintScan();
}

/* ---------- the Claude app path: one message to copy, one answer to paste back, in any AI app ---------- */
function scanCatLabels() {
  const count = {}; S.plan.lines.forEach(l => { count[l.name] = (count[l.name] || 0) + 1; });
  return S.plan.lines.map(l => ({ key: l.key, name: l.name, label: count[l.name] > 1 ? `${l.name} (${(JARS.find(j => j.id === l.jar) || { name: l.jar }).name})` : l.name }));
}
function scanMessage() {
  const cats = scanCatLabels().map(c => c.label).concat('Other'), cur = sym() || 'the same currency as the page';
  return `I am sending you photos of my receipts. Read every receipt and reply with ONLY a CSV block, no other text, one line per receipt, in exactly this format:
date,amount,category,note

Rules:
- date: YYYY-MM-DD. Today is ${todayStr()}. If a receipt has no year, use today's date to work it out.
- amount: the total I paid, as a plain number. No currency symbol, no thousands separators, no minus sign. My currency is ${cur}.
- category: exactly one of these names, or Other if none fits: ${cats.join('; ')}
- note: the shop or item in a few words, with no commas.
- Leave out anything that is not a purchase, and anything you cannot read. Never invent a number.

My receipt photos are attached to this message.`;
}
function csvCells(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  if (out.length > 4) return out.slice(0, 3).concat(out.slice(3).join(', '));
  return out;
}
function scanDate(v) {
  const m = String(v || '').trim().match(/^(\d{4})[-\/.年](\d{1,2})[-\/.月](\d{1,2})日?$/);
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : '';
}
function scanAmount(v) {
  let t = String(v == null ? '' : v).replace(/[^\d.,]/g, ''); if (!t) return NaN;
  if (t.indexOf('.') >= 0 && t.indexOf(',') >= 0) t = t.replace(/,/g, '');
  else if (t.indexOf(',') >= 0) t = /^\d+,\d{2}$/.test(t) ? t.replace(',', '.') : t.replace(/,/g, '');
  return +t;
}
function scanCategory(name) {
  const n = String(name || '').trim().toLowerCase(); if (!n || n === 'other') return 'other';
  const list = scanCatLabels();
  let hit = list.find(c => c.label.toLowerCase() === n) || list.find(c => c.name.toLowerCase() === n);
  if (!hit) hit = list.find(c => n.indexOf(c.name.toLowerCase()) >= 0 || c.name.toLowerCase().indexOf(n) >= 0);
  return hit ? hit.key : 'other';
}
/* turns what Claude answered (a CSV block, a table, tab separated lines or the page's own JSON) into the shape askClean checks */
function scanParse(text) {
  let t = String(text || '').replace(/\r/g, '').trim();
  const fence = t.match(/```[a-z]*\n([\s\S]*?)```/i); if (fence) t = fence[1].trim();
  let rows = [];
  if (/^[\[{]/.test(t)) {
    try {
      const j = JSON.parse(t), arr = Array.isArray(j) ? j : j && j.receipts;
      if (Array.isArray(arr)) rows = arr.map(r => [r && (r.date || r.d), r && (r.amount != null ? r.amount : r.a), r && (r.category || r.c), r && (r.note || r.n)]);
    } catch (e) { rows = []; }
  }
  if (!rows.length) {
    t.split('\n').map(s => s.trim()).filter(Boolean).forEach(line => {
      if (/^[\s|:\-+]+$/.test(line)) return;
      if (line.indexOf('|') >= 0) rows.push(line.replace(/^\||\|$/g, '').split('|').map(s => s.trim()));
      else if (line.indexOf('\t') >= 0) rows.push(line.split('\t').map(s => s.trim()));
      else rows.push(csvCells(line));
    });
  }
  const receipts = [];
  rows.forEach(c => {
    if (!c.length || /^date$/i.test(String(c[0]).trim())) return;
    if (c.length < 2) return;
    receipts.push({ date: scanDate(c[0]), amount: scanAmount(c[1]), category: scanCategory(c[2]), note: c[3] == null ? '' : String(c[3]) });
  });
  return { summary: '', receipts };
}
/* copy text to the clipboard, falling back to the older way, and say what happened in msg */
async function copyText(t, msg, done) {
  try { await navigator.clipboard.writeText(t); msg.textContent = done; return true; } catch (e) { /* try the older way */ }
  const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.append(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  msg.textContent = ok ? done : 'Copy blocked by the browser. Select the text and copy it by hand.';
  return ok;
}
/* Reading photos and the chat run on Claude, inside this page. Any other AI works through copy and paste, so these buttons just open its site. */
const AI_APPS = [['claude', 'Claude', 'https://claude.ai/new'], ['chatgpt', 'ChatGPT', 'https://chatgpt.com/'], ['gemini', 'Gemini', 'https://gemini.google.com/app'], ['copilot', 'Copilot', 'https://copilot.microsoft.com/'], ['perplexity', 'Perplexity', 'https://www.perplexity.ai/'], ['grok', 'Grok', 'https://grok.com/']];
const aiPickHTML = () => '<span class="ai-l">Open your AI:</span>' + AI_APPS.map(a => `<a class="btn small" href="${a[2]}" target="_blank" rel="noopener noreferrer" data-ai="${a[0]}">${a[1]}</a>`).join('');
async function scanCopy() {
  const t = scanMessage(), msg = $('#scanCopyMsg');
  const ok = await copyText(t, msg, 'Copied. Paste it into your AI app.');
  if (!ok) { const box = $('#scanPaste'); box.value = t; box.focus(); box.select(); }
}
function scanCheck() {
  const out = $('#scanOut2'), msg = $('#scanPasteMsg'), txt = $('#scanPaste').value; out.textContent = ''; msg.textContent = '';
  if (!txt.trim()) { msg.textContent = 'Paste the reply first.'; return; }
  const p = askClean(scanParse(txt));
  if (!p.receipts.length) {
    msg.textContent = p.outside && !p.dropped ? `Those receipts are dated outside ${monthLabel(START)} to ${monthLabel(END)}.` : 'No receipts found. Paste the whole reply: one line per receipt, as date, amount, category, note.';
    return;
  }
  const bot = document.createElement('div'); bot.className = 'msg ai card'; out.append(bot);
  askCard(bot, p, false, scanCtx()); sfx('next');
}

/* ---------- the camera ----------
   On a phone the Camera button opens the phone's own camera (the file input with capture). On a computer that input only opens a
   file dialog, which is misleading, so there the button opens the computer's camera in a sheet: a live view, Take photo as many
   times as needed, Done. Each photo joins the files to read like a chosen picture. */
const handheld = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches);
let camStream = null, camShots = 0;
function camOpen() {
  scanConnect();
  if (handheld() || !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { $('#scanCamIn').click(); return; }
  const box = $('#cam'), vid = $('#camVid'), msg = $('#camMsg');
  camShots = 0; box.hidden = false; $('#camShot').hidden = false; $('#camShot').disabled = true; $('#camDone').hidden = true; $('#camPick').hidden = true;
  msg.textContent = 'Starting the camera…';
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false }).then(stream => {
    if (box.hidden) { stream.getTracks().forEach(t => t.stop()); return; }
    camStream = stream; vid.srcObject = stream; $('#camShot').disabled = false; $('#camShot').focus();
    msg.textContent = 'Hold the receipt flat in the frame, then take the photo. Take as many as you need.';
  }, err => {
    const why = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? 'The camera was not allowed.' : err && err.name === 'NotFoundError' ? 'No camera was found on this computer.' : 'The camera could not be started.';
    msg.textContent = why + ' Choose files instead.'; $('#camShot').hidden = true; $('#camPick').hidden = false; $('#camPick').focus();
  });
}
function camClose() {
  const box = $('#cam'); if (box.hidden) return;
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  $('#camVid').srcObject = null; box.hidden = true;
  if (camShots && scanFiles.length) $('#scanRead').focus({ preventScroll: true }); else $('#scanCam').focus({ preventScroll: true });
}
function camShot() {
  const vid = $('#camVid'); if (!camStream || !vid.videoWidth) return;
  const long = Math.max(vid.videoWidth, vid.videoHeight), k = Math.min(1, 1600 / long), c = document.createElement('canvas');
  c.width = Math.round(vid.videoWidth * k); c.height = Math.round(vid.videoHeight * k);
  c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
  const fl = $('#camFlash'); fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on'); sfx('coin');
  c.toBlob(blob => {
    if (!blob) return;
    camShots++;
    const f = new File([blob], `photo-${camShots}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    scanAdd([f]).then(() => { $('#camMsg').textContent = `${camShots} photo${camShots === 1 ? '' : 's'} added. Take another, or Done.`; $('#camDone').hidden = false; });
  }, 'image/jpeg', .9);
}
function wireCam() {
  $('#camShot').addEventListener('click', camShot);
  $('#camDone').addEventListener('click', camClose);
  $('#camClose').addEventListener('click', camClose);
  $('#camPick').addEventListener('click', () => { camClose(); $('#scanPickIn').click(); });
  $('#cam').addEventListener('click', e => { if (e.target === e.currentTarget) camClose(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#cam').hidden) camClose(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) camClose(); });
}
function wireScan() {
  wireCam();
  const pick = e => { const l = Array.from(e.target.files); scanAdd(l).then(() => { if (scanFiles.length) $('#scanRead').focus({ preventScroll: true }); }); e.target.value = ''; };
  $('#scanCam').addEventListener('click', camOpen);
  $('#scanPick').addEventListener('click', () => { scanConnect(); $('#scanPickIn').click(); });
  $('#scanCamIn').addEventListener('change', pick);
  $('#scanPickIn').addEventListener('change', pick);
  $('#scanFiles').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; scanFiles.splice(+b.dataset.rm, 1); paintScanFiles(); scanNote(''); });
  $('#scanClear').addEventListener('click', () => { scanFiles = []; paintScanFiles(); scanNote(''); });
  $('#scanRead').addEventListener('click', scanRead);
  $('#scanStop').addEventListener('click', () => { if (scanCtl) scanCtl.abort(); });
  $('#scanOff').addEventListener('click', async e => { if (!e.target.closest('#scanRetry')) return; $('#scanOff').hidden = true; await scanConnect(true); });
  $('#scanCopy').addEventListener('click', scanCopy); $('#scanAis').innerHTML = aiPickHTML();
  $('#scanCheck').addEventListener('click', scanCheck);
  const sc = $('#scan');
  sc.addEventListener('dragover', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0 && askFn) e.preventDefault(); });
  sc.addEventListener('drop', e => { if (!askFn || !e.dataTransfer || !e.dataTransfer.files.length) return; e.preventDefault(); scanAdd(e.dataTransfer.files); });
  /* Home: the quick way into the camera */
  $('#hScan').addEventListener('click', () => {
    switchTab('receipts');
    if (scanSettled && !askFn) { $('#scan').scrollIntoView({ block: 'start' }); return; }
    camOpen();
  });
}
/* first time the Receipts tab opens, find out whether Claude can be reached so the card shows the right thing */
function scanInit() { if (!scanTried) scanConnect(); }
