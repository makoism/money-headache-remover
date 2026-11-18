/* ---------- realm title card ----------
   Each time the app opens, the realm it opens in announces itself: its name, one line, a short fade in and out.
   It never blocks a tap (pointer-events none) and removes itself. Skipped when a test or a link pins the realm or time of day. */
(() => {
  try {
    const q = location.search; if (/[?&](realm|tod|lifetest|sfxtest|nocard)\b/.test(q)) return;
    const id = (function () { try { return localStorage.getItem('mhr-realm') || ''; } catch (e) { return ''; } })(), R = (typeof REALMS !== 'undefined') && REALMS[id]; if (!R) return;
    const C = { wood: ['#0e2a1a', '#b8f0a0'], crystal: ['#06161e', '#9ae8ff'], sea: ['#06223a', '#8ae8ff'], shire: ['#10301a', '#d8ff9a'], chiba: ['#1c1a28', '#ffd8a0'], rune: ['#06122c', '#9af4ff'], grove: ['#1c2a10', '#ffe8a0'], hollow: ['#2a1a10', '#ffd890'], frost: ['#0c1a2c', '#d8f4ff'], dream: ['#140a3a', '#e8d8ff'] }[id] || ['#0e2a1a', '#b8f0a0'];
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st = document.createElement('style');
    st.textContent = '#realmCard{position:fixed;inset:0;z-index:9990;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;color:' + C[1] + ';background:radial-gradient(ellipse at 50% 50%,' + C[0] + 'f2 0%,' + C[0] + 'ee 55%,' + C[0] + ' 100%);opacity:0;animation:rcIn .5s ease forwards,rcOut .9s ease 2.7s forwards}' + (still ? '#realmCard{animation:rcOut .6s ease 1.8s forwards;opacity:1}' : '') +
      '#realmCard .rcName{font-family:Georgia,"Times New Roman",serif;font-size:clamp(30px,7vw,64px);letter-spacing:.04em;font-weight:600;text-shadow:0 0 24px ' + C[1] + '66;transform:translateY(8px);animation:rcUp 1.1s cubic-bezier(.2,.7,.2,1) .15s forwards;opacity:0}' +
      '#realmCard .rcLine{width:min(220px,50vw);height:1px;background:linear-gradient(90deg,transparent,' + C[1] + ',transparent);transform:scaleX(0);animation:rcLine 1s ease .5s forwards}' +
      '#realmCard .rcTag{font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:clamp(14px,2.6vw,20px);opacity:0;animation:rcUp 1s ease .9s forwards;max-width:80vw}' +
      '@keyframes rcIn{to{opacity:1}}@keyframes rcOut{from{opacity:1}to{opacity:0;visibility:hidden}}@keyframes rcUp{to{opacity:1;transform:none}}@keyframes rcLine{to{transform:scaleX(1)}}';
    document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'realmCard'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<div class="rcName"></div><div class="rcLine"></div><div class="rcTag"></div>'; d.querySelector('.rcName').textContent = R.name; d.querySelector('.rcTag').textContent = R.tag;
    document.body.appendChild(d); setTimeout(() => { try { d.remove(); st.remove(); } catch (e) { } }, 3800);
  } catch (e) { }
})();
