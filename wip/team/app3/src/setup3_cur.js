/* ---------- setup: an account in another currency (stage 2 S5, STAGE2_PLAN 2.4) ----------
   Each extra account row gets "Money in", the home currency by default. What it holds is read in its own currency
   (its own minor units). Joined in setup3.js by the row's HTML and the answers. Words are drafts for Mako's copy pass. */
const CURS3 = [['JPY', 'Yen'], ['USD', 'US dollars'], ['PHP', 'Philippine pesos'], ['EUR', 'Euros']];
function curPick3(k) {
  const home = $('#s3Cur').value;
  return `<div class="a3-field"><label for="s3-${k}-c">Money in</label><select class="a3-in a3-sel" id="s3-${k}-c" data-f="cur">${CURS3.map(([v, t]) => `<option value="${v}"${v === home ? ' selected' : ''}>${t}</option>`).join('')}</select></div>`;
}
/* the row's currency (the home one when the row has no pick) */
function rowCur3(row) { const s = row && row.querySelector('[data-f=cur]'); return s ? s.value : $('#s3Cur').value; }
