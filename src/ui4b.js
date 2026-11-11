/* ===== Excel exports (.xlsx) read as text =====
   Banks hand out .xlsx files. An .xlsx is a zip of XML; this turns the first sheets into CSV text in the browser, with no library:
   the zip directory is read by hand, each file is inflated with the browser's DecompressionStream, and the cells are read with
   plain string scanning (shared strings, inline strings, numbers, booleans, and dates when the cell's style is a date format).
   Old .xls files (binary) are not read; the person is told to save as CSV or .xlsx. Nothing here touches the money model. */
const isXlsxFile = f => !!f && (/\.xlsx$/i.test(f.name || '') || f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
const isXlsFile = f => !!f && (/\.xls$/i.test(f.name || '') || f.type === 'application/vnd.ms-excel');
const xlsxCan = () => typeof DecompressionStream === 'function';
const XLSX_MAX_ROWS = 20000, XLSX_MAX_SHEETS = 3;

/* --- the zip --- */
function zipEntries(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), n = u8.length;
  let eocd = -1;
  for (let i = n - 22; i >= Math.max(0, n - 70000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) throw new Error('not a zip');
  const count = dv.getUint16(eocd + 10, true), cdOff = dv.getUint32(eocd + 16, true), out = {};
  let p = cdOff;
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), loff = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
    out[name] = { method, csize, usize, loff };
    p += 46 + nlen + xlen + clen;
  }
  return out;
}
async function zipRead(u8, e) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (dv.getUint32(e.loff, true) !== 0x04034b50) throw new Error('bad zip entry');
  const nlen = dv.getUint16(e.loff + 26, true), xlen = dv.getUint16(e.loff + 28, true), start = e.loff + 30 + nlen + xlen;
  const raw = u8.subarray(start, start + e.csize);
  if (e.method === 0) return new TextDecoder().decode(raw);
  if (e.method !== 8) throw new Error('zip method ' + e.method);
  const buf = await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
  return new TextDecoder().decode(buf);
}

/* --- the XML, read with string scanning --- */
const xmlUn = s => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d)).replace(/&amp;/g, '&');
const xmlAttr = (tag, name) => { const m = tag.match(new RegExp('\\s' + name + '="([^"]*)"')); return m ? m[1] : null; };
const xmlTexts = frag => (frag.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g) || []).map(t => xmlUn(t.replace(/^<t[^>]*>/, '').replace(/<\/t>$/, ''))).join('');
function xlsxSharedStrings(xml) { return (xml.match(/<si>[\s\S]*?<\/si>/g) || []).map(xmlTexts); }
/* which cell styles are dates: built-in date formats, or a custom format with day, month or year letters and no fraction or currency marks */
function xlsxDateStyles(xml) {
  const custom = {}; (xml.match(/<numFmt\s[^>]*\/>/g) || []).forEach(t => { const id = xmlAttr(t, 'numFmtId'), code = xmlAttr(t, 'formatCode') || ''; if (id) custom[id] = code; });
  const isDate = id => { const n = +id; if ((n >= 14 && n <= 22) || (n >= 27 && n <= 36) || (n >= 45 && n <= 47) || (n >= 50 && n <= 58)) return true; const c = custom[id]; return !!c && /[dmy]/i.test(c.replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"/g, '')) && !/[#0]\.0|%|\$|¥|₱|€|£/.test(c); };
  const xfs = xml.match(/<cellXfs[\s\S]*?<\/cellXfs>/); if (!xfs) return [];
  return (xfs[0].match(/<xf\s[^>]*\/?>/g) || []).map(t => isDate(xmlAttr(t, 'numFmtId') || '0'));
}
function xlsxSerialToDate(v) {
  const n = Math.floor(+v); if (!isFinite(n) || n < 1 || n > 80000) return String(v);
  const ms = Math.round((n - 25569) * 864e5), d = new Date(ms); if (isNaN(d)) return String(v);
  const frac = +v - n, hhmm = frac > 0 ? ' ' + String(Math.floor(frac * 24)).padStart(2, '0') + ':' + String(Math.round((frac * 1440) % 60)).padStart(2, '0') : '';
  return d.toISOString().slice(0, 10) + hhmm;
}
const colIndex = ref => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
function xlsxSheetRows(xml, strings, dateStyles) {
  const rows = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g; let rm;
  while ((rm = rowRe.exec(xml)) && rows.length < XLSX_MAX_ROWS) {
    const cells = [];
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g; let cm;
    while ((cm = cellRe.exec(rm[1]))) {
      const attrs = cm[1], inner = cm[2] || '', r = xmlAttr(attrs, 'r') || '', t = xmlAttr(attrs, 't') || '', s = xmlAttr(attrs, 's');
      let v = '';
      if (t === 'inlineStr') v = xmlTexts(inner);
      else {
        const vm = inner.match(/<v>([\s\S]*?)<\/v>/); const raw = vm ? xmlUn(vm[1]) : '';
        if (t === 's') v = strings[+raw] !== undefined ? strings[+raw] : '';
        else if (t === 'b') v = raw === '1' ? 'TRUE' : 'FALSE';
        else if (t === 'str' || t === 'e') v = raw;
        else if (raw !== '' && s !== null && dateStyles[+s]) v = xlsxSerialToDate(raw);
        else v = raw;
      }
      const ci = r ? colIndex(r) : cells.length; while (cells.length < ci) cells.push(''); cells[ci] = v;
    }
    if (cells.some(x => x !== '')) rows.push(cells);
  }
  return rows;
}
const csvCell = v => (/[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
/* the whole file to CSV text: sheet name as a heading when there is more than one sheet */
async function xlsxToCsv(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const z = zipEntries(u8);
  const names = Object.keys(z).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a, b) => +a.match(/(\d+)\.xml$/)[1] - +b.match(/(\d+)\.xml$/)[1]).slice(0, XLSX_MAX_SHEETS);
  if (!names.length) throw new Error('no sheets');
  const strings = z['xl/sharedStrings.xml'] ? xlsxSharedStrings(await zipRead(u8, z['xl/sharedStrings.xml'])) : [];
  const dateStyles = z['xl/styles.xml'] ? xlsxDateStyles(await zipRead(u8, z['xl/styles.xml'])) : [];
  let titles = [];
  if (z['xl/workbook.xml']) { const wb = await zipRead(u8, z['xl/workbook.xml']); titles = (wb.match(/<sheet\b[^>]*\/?>/g) || []).map(t => xmlUn(xmlAttr(t, 'name') || '')); }
  const parts = [];
  for (let i = 0; i < names.length; i++) {
    const rows = xlsxSheetRows(await zipRead(u8, z[names[i]]), strings, dateStyles);
    if (!rows.length) continue;
    const width = Math.max.apply(null, rows.map(r => r.length));
    const text = rows.map(r => { const c = r.slice(); while (c.length < width) c.push(''); return c.map(csvCell).join(','); }).join('\n');
    parts.push((names.length > 1 ? '# Sheet: ' + (titles[i] || names[i]) + '\n' : '') + text);
  }
  if (!parts.length) throw new Error('empty');
  return parts.join('\n\n');
}
