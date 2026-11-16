const SCENE = (() => {
  const TOD = {
    morning: { sky: ['#8fbfb2', '#c6e0cc', '#efdcae'], fog: '#d8ecdc', far: ['#8fb9a8', '#6f9d8a', '#50806d'], trunk: '#4d3d2f', trunkD: '#352a20', trunkL: '#6e5a44', moss: '#6fae5a', mossL: '#9bd27c', mossD: '#3f7a3f', leaf: '#3a7d50', leafD: '#2a6040', ground: '#52924f', groundD: '#3b7240', groundL: '#78b868', stone: '#8d978f', stoneD: '#5f6a63', stoneL: '#b0bab1', rune: '#a8f4ff', water: '#c8f2f2', water2: '#86d4dc', foam: '#ffffff', shaft: '#fff4c8', shaftA: .16, win: '#ffe1a0', lit: .6, smoke: '#eef2ee', fairy: ['#ffd6f0', '#c8f7ff', '#fff1a8', '#e2ccff'], motes: 36, mist: .26, stars: false, dew: true, glowA: .45 },
    day: { sky: ['#86cad2', '#bce6d4', '#ecf6d2'], fog: '#d6efdf', far: ['#86b8a0', '#66a086', '#4a8668'], trunk: '#524130', trunkD: '#3a2d21', trunkL: '#735e46', moss: '#7cc866', mossL: '#b0ec8c', mossD: '#4a9446', leaf: '#3a8c55', leafD: '#27693f', ground: '#59a054', groundD: '#41803f', groundL: '#7ec46c', stone: '#929c95', stoneD: '#636e67', stoneL: '#b6c0b8', rune: '#9ff0ff', water: '#bdf0f4', water2: '#78cfe0', foam: '#ffffff', shaft: '#fffbe0', shaftA: .14, win: '#e8f4f0', lit: .15, smoke: '#f4f6f4', fairy: ['#ffe0f4', '#d2fbff', '#fff6b8', '#e8d6ff'], motes: 26, mist: .16, stars: false, dew: false, glowA: .3 },
    sunset: { sky: ['#4b3f7c', '#b4648c', '#f4a86a'], fog: '#e8b8c6', far: ['#9b739b', '#775882', '#563f62'], trunk: '#3f2d29', trunkD: '#2b1f1c', trunkL: '#5c4339', moss: '#6f8f55', mossL: '#94b06c', mossD: '#45603c', leaf: '#3d5246', leafD: '#283a33', ground: '#4b6042', groundD: '#34462f', groundL: '#6c8258', stone: '#8a7f8a', stoneD: '#5d5262', stoneL: '#ac9fab', rune: '#ffc8f0', water: '#f6c0a0', water2: '#c98aa6', foam: '#ffece0', shaft: '#ffd6a0', shaftA: .18, win: '#ffc86a', lit: 1, smoke: '#dcbcc6', fairy: ['#ffc0e0', '#ffd890', '#ffb0b0', '#e0b8ff'], motes: 40, mist: .24, stars: false, dew: false, glowA: .6 },
    night: { sky: ['#060b1f', '#0f1b3b', '#1b2b54'], fog: '#2c4370', far: ['#1b2a48', '#142138', '#0e192b'], trunk: '#22191b', trunkD: '#160f12', trunkL: '#31272a', moss: '#1f4a3c', mossL: '#2f6a55', mossD: '#163a2f', leaf: '#0f2a24', leafD: '#09201b', ground: '#13291f', groundD: '#0c1d16', groundL: '#1e3d2e', stone: '#3a4556', stoneD: '#262f3d', stoneL: '#4e5b70', rune: '#6affd8', water: '#5f90cc', water2: '#3a64a0', foam: '#d8eaff', shaft: '#b8d0ff', shaftA: .1, win: '#ffd27a', lit: 1, smoke: '#4a5a7a', fairy: ['#7affd8', '#c8ff9a', '#9ad8ff', '#f0b8ff'], motes: 56, mist: .3, stars: true, dew: false, glowA: 1 },
  };
  const DEER = [
    ['..........a..a', '...........aa.', '..........bbb.', '.........bbkbw', '.........bbbb.', '.........bb...', '.wbbbbbbbbb...', '.bbbbbbbbbb...', '.bwwwwwbbbb...', '.b.b....b.b...', '.d.d....d.d...'],
    ['..............', '..............', '..............', '..............', '..............', '..............', '.wbbbbbbbbb...', '.bbbbbbbbbbb..', '.bwwwwwbbbbbba', '.b.b....b.bbaa', '.d.d....d.dbk.'],
  ];
  /* the spirit stag: tall antlers, pale, looking out over the clearing */
  const STAG = ['.......a.a.a..', '........aaa...', '.....a..a.....', '......aaaa.a..', '.........aaa..', '.........bbbb.', '........bbbkbw', '........bbbb..', '........bbb...', '.wbbbbbbbbb...', '.bbbbbbbbbb...', '.bbbbbbbbbb...', '..b.b...b.b...', '..b.b...b.b...', '..d.d...d.d...'];
  let cv = null, cx = null, sk = null, skx = null, stb = null, stb2 = null, st = null, sx = null, vl = null, vx = null, W = 0, H = 0, PX = 3, T = null, mood = '', timer = 0, frame = 0, L = null, still = false, lt = {}, lx = {};
  const rnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  let look = '';   /* a burrow screen can ask for its own light (morning, day, sunset, night); '' follows the clock */
  const pickMood = () => {
    const q = (location.search.match(/[?&]tod=(morning|day|sunset|night)\b/) || [])[1]; if (q) return q; if (look) return look;
    return moodAt(new Date());
  };
  /* the light follows the real sun. Where you are comes from the device's time zone (a city for it, no location asked for); sunrise and sunset come from the date and that place,
     so the days are long in summer and short in winter. Morning: from a little before sunrise to about three and a half hours after. Day: until an hour and a half before sunset.
     Sunset: from there to three quarters of an hour after it. Night: the rest. Where the sun never rises or sets (far north) it falls back to fixed hours. */
  const TZ = { 'Asia/Tokyo': [35.7, 139.7], 'Asia/Seoul': [37.6, 127], 'Asia/Manila': [14.6, 121], 'Asia/Singapore': [1.35, 103.8], 'Asia/Hong_Kong': [22.3, 114.2], 'Asia/Shanghai': [31.2, 121.5], 'Asia/Taipei': [25, 121.5],
    'Asia/Bangkok': [13.75, 100.5], 'Asia/Jakarta': [-6.2, 106.8], 'Asia/Kolkata': [28.6, 77.2], 'Asia/Calcutta': [19, 72.8], 'Asia/Dubai': [25.2, 55.3], 'Asia/Karachi': [24.9, 67], 'Asia/Dhaka': [23.8, 90.4], 'Asia/Kuala_Lumpur': [3.1, 101.7], 'Asia/Ho_Chi_Minh': [10.8, 106.7],
    'Australia/Sydney': [-33.9, 151.2], 'Australia/Melbourne': [-37.8, 145], 'Australia/Brisbane': [-27.5, 153], 'Australia/Perth': [-31.95, 115.9], 'Pacific/Auckland': [-36.85, 174.8],
    'Europe/London': [51.5, -.1], 'Europe/Dublin': [53.3, -6.3], 'Europe/Paris': [48.85, 2.35], 'Europe/Berlin': [52.5, 13.4], 'Europe/Madrid': [40.4, -3.7], 'Europe/Rome': [41.9, 12.5], 'Europe/Amsterdam': [52.4, 4.9], 'Europe/Stockholm': [59.3, 18.1], 'Europe/Moscow': [55.75, 37.6], 'Europe/Istanbul': [41, 29], 'Europe/Lisbon': [38.7, -9.1],
    'Africa/Cairo': [30, 31.2], 'Africa/Lagos': [6.5, 3.4], 'Africa/Johannesburg': [-26.2, 28], 'Africa/Nairobi': [-1.3, 36.8],
    'America/New_York': [40.7, -74], 'America/Chicago': [41.9, -87.6], 'America/Denver': [39.7, -105], 'America/Los_Angeles': [34, -118.2], 'America/Toronto': [43.65, -79.4], 'America/Vancouver': [49.3, -123.1], 'America/Mexico_City': [19.4, -99.1], 'America/Sao_Paulo': [-23.5, -46.6], 'America/Argentina/Buenos_Aires': [-34.6, -58.4], 'America/Bogota': [4.7, -74.1], 'Pacific/Honolulu': [21.3, -157.9] };
  const placeNow = d => { let z = ''; try { z = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* unknown */ } const p = TZ[z]; if (p) return p; const lon = -d.getTimezoneOffset() / 60 * 15; return [/^(Australia|Antarctica)|Johannesburg|Santiago|Sao_Paulo|Buenos/.test(z) ? -30 : 35, lon]; };
  /* sunrise and sunset in minutes after local midnight (NOAA's simple method), or null when the sun does not rise or set that day */
  function sunTimes(d, lat, lon) {
    const rad = Math.PI / 180, start = new Date(d.getFullYear(), 0, 0), n = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12) - start) / 864e5), g = 2 * Math.PI / 365 * (n - 1 + (12 - 12) / 24);
    const eot = 229.18 * (.000075 + .001868 * Math.cos(g) - .032077 * Math.sin(g) - .014615 * Math.cos(2 * g) - .040849 * Math.sin(2 * g)), dec = .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2 * g) + .000907 * Math.sin(2 * g) - .002697 * Math.cos(3 * g) + .00148 * Math.sin(3 * g);
    const c = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec)); if (c < -1 || c > 1) return null;
    const ha = Math.acos(c) / rad, off = -new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTimezoneOffset();
    return { rise: 720 - 4 * (lon + ha) - eot + off, set: 720 - 4 * (lon - ha) - eot + off };
  }
  function moodAt(d) {
    const m = d.getHours() * 60 + d.getMinutes(), [lat, lon] = placeNow(d), s = sunTimes(d, lat, lon);
    if (!s) { const h = d.getHours(); return h >= 5 && h < 10 ? 'morning' : h >= 10 && h < 16 ? 'day' : h >= 16 && h < 19 ? 'sunset' : 'night'; }
    if (m >= s.rise - 45 && m < s.rise + 210) return 'morning';
    if (m >= s.rise + 210 && m < s.set - 90) return 'day';
    if (m >= s.set - 90 && m < s.set + 45) return 'sunset';
    return 'night';
  }
  const on = () => !(S && S.ui && S.ui.scene === false);
  /* the spirit stag: the picture is never changed. It breathes (the head lifts a little), grazes (bows its head to the grass and chews), and now and then walks a few steps along the bank,
     legs in diagonal pairs, turning to face the way it goes. Frames come at 6 a second. */
  const STAGP = { b: '#eef4f6', d: '#c8d6dc', w: '#ffffff', k: '#2a3a48', a: '#bff4ff', g: '#8cc48a' };
  const stagRnd = rnd(91);
  function stagLife(c, f) {
    const S0 = L.stag; if (!S0.m) S0.m = { mode: 'stand', t: 0, n: 40, wx: 0, dir: -1, face: -1 };
    const m = S0.m; m.t++;
    if (m.t >= m.n) { const r = stagRnd(); m.t = 0;
      if (m.mode !== 'stand') { m.mode = 'stand'; m.n = 24 + (stagRnd() * 40 | 0); }
      else if (r < .4) { m.mode = 'eat'; m.n = 46; }
      else if (r < .75) { m.mode = 'walk'; m.n = 18 + (stagRnd() * 22 | 0); m.dir = m.wx < -8 ? 1 : m.wx > 6 ? -1 : (stagRnd() < .5 ? -1 : 1); m.face = m.dir; }
      else { m.mode = 'stand'; m.n = 30 + (stagRnd() * 40 | 0); } }
    if (m.mode === 'walk') m.wx = Math.max(-14, Math.min(9, m.wx + m.dir * .6));
    const g = .3 + .2 * Math.sin(f / 11), bx = Math.round(S0.x + m.wx);
    glow(c, bx + 7, S0.y + 7, 10, '#d8f4ff', g * (mood === 'day' ? .6 : 1.2));
    const flip = m.face < 0;
    let dy = 0, dx = 0, chew = false;
    if (m.mode === 'eat') { const t = m.t; if (t < 2) { dy = 2; dx = 0; } else if (t < 4) { dy = 4; dx = 1; } else if (t < 40) { dy = 5; dx = 2; chew = true; } else if (t < 43) { dy = 3; dx = 1; } else { dy = 1; dx = 0; } }
    else if (Math.sin(f / 6) > .55) dy = -1;
    if (m.mode === 'walk') dy = (m.t % 6 < 3) ? 0 : -1;
    const lift = m.mode === 'walk' ? (m.t % 6 < 3 ? 1 : 2) : 0;   /* which diagonal pair of legs is in the air */
    const put = (i, j, ch) => { const pc = STAGP[ch]; if (!pc) return; const xx = flip ? 13 - i : i; c.fillStyle = pc; c.fillRect(bx + xx, Math.round(S0.y + j), 1, 1); };
    for (let j = 0; j < STAG.length; j++) { const row = STAG[j];
      for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.') continue;
        if (j < 9 && dy) {   /* the head and antlers */
          if (j === 8 && dy < 0) { put(i, j, ch); continue; }
          if (j === 7 && dy < 0) put(i, j, ch);   /* lifting the head one pixel keeps the throat where it was, so the head never comes loose from the neck */
          const jj = j + dy - (chew && j === 8 && (m.t % 6 < 3) ? 1 : 0); put(i + dx, jj, ch); continue; }
        if (j >= 12) { const leg = (i === 2 || i === 10) ? 1 : 2; if (lift === leg) { if (j === 12) put(i, j, 'b'); else if (j === 13) put(i, j, 'd'); continue; } }
        put(i, j, ch); }
    }
    if (dy > 0) for (let q = 0; q < 2 && dy >= 4; q++) put(8 + q, 8 + dy - 1 + 0, 'b');   /* the neck stays joined to the chest while the head is bowed */
    if (chew && m.t % 6 < 3) put(11 + dx, 8 + dy, 'g');
  }
  /* ---------- light: sun, lamps and the glowing water each have their own layer, and each breathes in its own way ----------
     sun: colour, strength, slant of the beams.  lamp: how lit the lanterns and the window are.  wf: how much the waterfall glows.
     veil: how much of the page colour lies over the scenery behind the words.  shade: depth of the dark at the edges. */
  const LIGHT = {
    morning: { sun: '#ffdca0', sunA: .8, ang: .3, lamp: .2, wf: 0, veil: .6, shade: .8, tint: '#02140a' },
    day: { sun: '#fff8cc', sunA: 1, ang: .2, lamp: 0, wf: 0, veil: .6, shade: .75, tint: '#02140a' },
    sunset: { sun: '#ffa868', sunA: .85, ang: .38, lamp: .8, wf: .55, veil: .56, shade: 1, tint: '#1a0b22' },
    night: { sun: '#9cb4ff', sunA: .5, ang: .2, lamp: 1, wf: 1, veil: .6, shade: 1, tint: '#02040f' },
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const canopyD = x => 12 + Math.round(4 * Math.sin(x / 11) + 3 * Math.sin(x / 4.1));
  const mk = () => { const k = document.createElement('canvas'); k.width = W; k.height = H; return [k, k.getContext('2d')]; };
  const GSP = {};
  const gsp = (r, col) => { const key = r + col; if (GSP[key]) return GSP[key]; const k = document.createElement('canvas'); k.width = k.height = r * 2 + 3; glow(k.getContext('2d'), r + 1, r + 1, r, col, .9); return (GSP[key] = k); };
  const spot = (c, x, y, r, col, a) => { c.globalAlpha = a; c.drawImage(gsp(r, col), Math.round(x - r - 1), Math.round(y - r - 1)); c.globalAlpha = 1; };
  const grid = (c, x, y, rows, pal, flip) => { for (let j = 0; j < rows.length; j++) { const row = rows[j]; for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.' || !pal[ch]) continue; c.fillStyle = pal[ch]; c.fillRect(Math.round(x + (flip ? row.length - 1 - i : i)), Math.round(y + j), 1, 1); } } };
  const disk = (c, x0, y0, rad, col) => { c.fillStyle = col; for (let y = -rad; y <= rad; y++) { const w = Math.round(Math.sqrt(rad * rad - y * y)); c.fillRect(Math.round(x0 - w), Math.round(y0 + y), w * 2 + 1, 1); } };
  const glow = (c, x, y, r, col, a) => { for (let k = r; k >= 1; k--) { c.globalAlpha = a * (1 - k / (r + 1)) * .5; disk(c, x, y, k, col); } c.globalAlpha = 1; };

  /* ---------- the layout ---------- */
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    PX = Math.max(2, Math.round(vh / 200)); W = Math.ceil(vw / PX); H = Math.ceil(vh / PX);
    const col = Math.min(W, Math.ceil(800 / PX)), side = Math.max(0, (W - col) / 2), wide = side >= 46;
    const R = rnd(7), hz = Math.round(H * .62);
    L = { col, side, wide, hz, cx0: side, cx1: W - side, floor: Math.round(H * .8) };
    L.hut = { x: wide ? Math.max(18, Math.round(side * .3)) : 4, y: Math.round(H * .8) };
    L.fall = { x: wide ? Math.round(W - side * .5) : W - 10, top: Math.round(hz - (wide ? 52 : 34)), bot: Math.round(H * .79), w: wide ? 8 : 5 };
    /* the fall comes down in steps: each drop lands on a rock ledge and spills over to the next, a little to one side */
    { const F = L.fall, nT = wide ? 3 : 2, hh = F.bot - F.top, dx = wide ? [0, -1, -2] : [0, -1], dw = wide ? [0, 3, 6] : [0, 3]; F.tiers = []; F.ledges = [];
      for (let i = 0; i < nT; i++) F.tiers.push({ x: F.x + dx[i], w: F.w + dw[i], y0: F.top + Math.round(i * hh / nT) + (i ? 4 : 0), y1: i === nT - 1 ? F.bot : F.top + Math.round((i + 1) * hh / nT) });
      for (let i = 0; i < nT - 1; i++) { const a = F.tiers[i], b = F.tiers[i + 1]; F.ledges.push({ y: a.y1, x0: Math.min(a.x, b.x) - 5, x1: Math.max(a.x + a.w, b.x + b.w) + 5 }); } }
    /* each drop wanders a few pixels to one side and the other, in soft curves, and breathes a little in width */
    { const F = L.fall; F.ex = (ti, y) => { const tr = F.tiers[ti]; return Math.round(2 * Math.max(0, Math.min(1, (y - tr.y0) / Math.max(1, tr.y1 - tr.y0 - 1)))); }; }
    { const F = L.fall; F.off = (ti, y) => { const tr = F.tiers[ti], u = y - tr.y0, k = Math.min(1, u / 7); return Math.round((Math.sin(u * .12 + ti * 2.1) * 1.25 + Math.sin(u * .3 + ti * .9) * .5) * k * (wide ? 1 : .7)); }; }
    L.pool = { x: L.fall.x + Math.round(L.fall.w / 2), y: L.fall.bot + 3, rx: wide ? 22 : 11, ry: 4 };
    /* the floor, from back to front: cottage and its lantern, the ring in front of it, a standing stone and the deer to the right of the ring;
       on the other side the stag stands on the bank by the pool, two stones at the water's edge. Each stands on its own ground, none on another. */
    L.stones = wide ? [{ x: L.pool.x + 8, y: L.pool.y + 9, h: 12 }, { x: L.pool.x - 25, y: L.pool.y + 10, h: 9 }] : [{ x: W - 22, y: Math.round(H * .85), h: 10 }];
    L.ring = { x: wide ? Math.round(side * .62) : 18, y: Math.round(H * .9) };
    L.stag = wide ? { x: L.pool.x - 43, y: L.pool.y + 14 - 15 } : null;
    L.deer = wide ? [{ x: L.hut.x + 36, y: L.floor + 15 - 11, flip: true, ph: 0 }] : [];
    /* the main beam of sun comes down onto the cottage; lanterns stand by the cottage, the ring, the stones and the pool */
    { const Lm = LIGHT[pickMood()], sk = wide ? Lm.ang : Lm.ang * .4, hx = L.hut.x + 14, hy = L.hut.y - 8; L.sun = { hx, hy, sk, bx0: hx - sk * hy, w: wide ? 22 : 16 }; }
    { const tw = wide ? Math.max(18, Math.round(side * .28)) : 7;
      L.lamps = wide ? [{ x: L.hut.x + 31, y: L.hut.y - 12, kind: 'hut', gy: L.hut.y - 12, gr: 15 }, { x: L.ring.x - 19, y: L.ring.y + 2, kind: 'post', gy: L.ring.y - 11, gr: 13 }, { x: tw - Math.round(tw * .35) + 2, y: Math.round(H * .56), kind: 'hang', dir: 1, gy: Math.round(H * .56) - 1, gr: 14 }, { x: W - Math.round(tw * .65) - 3, y: Math.round(H * .6), kind: 'hang', dir: -1, gy: Math.round(H * .6) - 1, gr: 14 }]
        : [{ x: L.hut.x + 31, y: L.hut.y - 12, kind: 'hut', gy: L.hut.y - 12, gr: 15 }, { x: L.ring.x + 16, y: L.ring.y + 2, kind: 'post', gy: L.ring.y - 11, gr: 13 }]; }
    L.lamps.forEach((l, i) => { l.ph = i * 2.1; });
    L.flies = []; { const R3 = rnd(91), n = wide ? 26 : 12; for (let i = 0; i < n; i++) L.flies.push({ x: R3() * W, y: hz * .72 + R3() * (H - hz * .72 - 6), p: R3() * 60, per: 9 + R3() * 9, vx: (R3() - .5) * .08 }); }
    L.drift = []; { const R5 = rnd(113), n = wide ? 24 : 12; for (let i = 0; i < n; i++) L.drift.push({ ax: R5() * W, ay: hz * .18 + R5() * hz * .78, rx: 8 + R5() * 24, ry: 4 + R5() * 12, sp: .006 + R5() * .014, ph: R5() * 6.28, r: 2 + (R5() * 2 | 0), ci: i, per: 14 + R5() * 20 }); }
    L.dust = []; { const R4 = rnd(97); for (let i = 0; i < 16; i++) L.dust.push({ y: L.hut.y - 70 + R4() * 78, u: (R4() - .5) * 1.7, p: R4() * 40 }); }
    L.stars = []; for (let i = 0; i < Math.round(W * H / 300); i++) L.stars.push([Math.floor(R() * W), Math.floor(R() * hz * .6), R()]);
    L.shafts = []; for (let i = 0; i < (wide ? 5 : 3); i++) { const left = i % 2 === 0; L.shafts.push({ x: wide ? (left ? R() * side * .9 : W - side * .9 + R() * side * .8) : R() * W, w: 6 + R() * 10, sk: .35 + R() * .2 }); }
    L.fairies = []; const nf = wide ? 9 : 4;
    for (let i = 0; i < nf; i++) { const left = i % 2 === 0; L.fairies.push({ cx: wide ? (left ? side * (.2 + R() * .7) : W - side * (.2 + R() * .7)) : R() * W, cy: H * (.45 + R() * .4), rx: 6 + R() * 14, ry: 3 + R() * 8, sp: .03 + R() * .04, ph: R() * 6.28, c: i % 4, trail: [] }); }
    { const hx = L.hut.x + 14; const a = L.fairies[0], b = L.fairies[2], c2 = L.fairies[4]; if (a) { a.cx = hx + 9; a.cy = L.hut.y - 26; a.rx = 9; a.ry = 6; } if (b) { b.cx = hx - 5; b.cy = L.hut.y - 40; b.rx = 8; b.ry = 5; } if (c2) { c2.cx = hx + 22; c2.cy = L.hut.y - 12; c2.rx = 7; c2.ry = 4; } }
    L.motes = []; L.dew = []; L.mist = [];
    for (let i = 0; i < 70; i++) L.dew.push([Math.floor(R() * W), Math.round(L.floor - 2 + R() * (H - L.floor)), Math.floor(R() * 40)]);
    for (let i = 0; i < 5; i++) L.mist.push({ x: R() * W, y: L.floor - 8 + R() * 16, w: 30 + R() * 50, v: .05 + R() * .08 });
  }

  /* ---------- the still layer ---------- */
  function paint() {
    const c = sx, t = T, R = rnd(11), hz = L.hz;
    c.clearRect(0, 0, W, H);
    /* sky, seen through the canopy */
    for (let y = 0; y < H; y++) { const f = Math.min(1, y / hz), seg = f < .55 ? 0 : 1, lf = seg ? (f - .55) / .45 : f / .55; skx.fillStyle = mix(t.sky[seg], t.sky[seg + 1], Math.round(lf * 8) / 8); skx.fillRect(0, y, W, 1); }
    if (t.stars) for (const s of L.stars) { skx.fillStyle = s[2] > .85 ? '#ffffff' : '#9fb0d8'; skx.fillRect(s[0], s[1], 1, 1); }
    if (mood === 'night') { const mx = L.wide ? Math.round(L.side * .35) : 12; glow(skx, mx, 22, 16, '#c8d6ff', .7); disk(skx, mx, 22, 7, '#f2f0d8'); disk(skx, mx + 3, 20, 6, t.sky[1]); }
    /* layers of forest fading into the mist: the deeper, the paler. Every tree is its own: crooked, leaning, forked, twisted,
       with branches, hanging vines, knots and moss, and vines drape from one tree to the next. The middle layer is softened with a haze. */
    L.climb = [];
    for (let k = 0; k < 3; k++) {
      const base = hz + 4 + k * 10, hz2 = [.1, .3, .04][k], col = mixh(t.far[k], t.fog, hz2), R2 = rnd(31 + k), trees = [];
      for (let x = -4; x < W + 6; x += 12 + k * 4 + Math.floor(R2() * 13)) trees.push(farTree(c, x, base, k, col, t, R2));
      if (k > 0) for (const tr of trees) if (tr.w >= 3) L.climb.push({ x: tr.x, off: tr.off, w: tr.w, base: tr.base, k, yt: Math.round(tr.base * .3), yb: tr.base - 3 });
      for (let i = 1; i < trees.length; i++) if (R2() < .55 && trees[i].x - trees[i - 1].x < 46) drapeVine(c, trees[i - 1], trees[i], col, t, R2);
      for (let x = -4; x < W + 6; x += 4 + Math.floor(R2() * 5)) disk(c, x, base - 2, 3 + k + Math.floor(R2() * 3), col);
      c.globalAlpha = t.mist; c.fillStyle = t.fog; c.fillRect(0, base - 6, W, 10); c.globalAlpha = 1;
      /* the deepest row of trees is kept apart: flyers pass in front of it and between the rows nearer to us */
      if (k === 0) { stb.width = W; stb.height = H; stb.getContext('2d').drawImage(st, 0, 0); c.clearRect(0, 0, W, H); }
    }
    stb2.width = W; stb2.height = H; stb2.getContext('2d').drawImage(st, 0, 0); c.clearRect(0, 0, W, H);
    /* the forest floor: moss, ferns */
    c.fillStyle = t.ground; c.fillRect(0, L.floor, W, H - L.floor);
    c.fillStyle = t.groundD; c.fillRect(0, L.floor, W, 1);
    for (let y = L.floor + 1; y < H; y++) for (let x = (y * 7) % 4; x < W; x += 4) { const v = R(); if (v < .35) { c.fillStyle = v < .17 ? t.groundD : t.groundL; c.fillRect(x, y, 1, 1); } }
    for (let i = 0; i < Math.round(W / 6); i++) fern(c, Math.floor(R() * W), L.floor + 2 + Math.floor(R() * (H - L.floor - 4)), t, R);
    meadow(c, t);
    /* shafts of light through the canopy */
    for (const s of L.shafts) { c.globalAlpha = t.shaftA; c.fillStyle = t.shaft; for (let y = 0; y < L.floor + 6; y++) c.fillRect(Math.round(s.x + y * s.sk), y, Math.round(s.w), 1); c.globalAlpha = 1; }
    /* the carved cliff and the glowing pool */
    const F = L.fall, cl = F.x - 22, cr = F.x + F.w + 24, RC = rnd(77), dim = mixh(mixh(t.stoneD, t.fog, .4), '#000000', .1);
    const inCh = x => x >= F.x - 3 && x <= F.x + F.w + (L.wide ? 6 : 3);
    /* the back wall of the gorge: higher, paler, softer, so the cliff has depth behind it */
    const topB = x => F.top - 15 + Math.round(Math.sin(x * .31) * 3 + Math.sin(x * .13 + 1) * 4) + Math.round(Math.max(0, 8 - Math.min(x - cl + 6, cr + 6 - x)) * 1.5);
    for (let x = cl - 6; x < cr + 6; x++) for (let y = topB(x); y < F.bot + 3; y++) put(c, x, y, y % 9 === 0 ? mixh(dim, t.fog, .15) : dim);
    for (let x = cl - 4; x < cr + 4; x += 3 + Math.floor(RC() * 4)) { const y = topB(x); put(c, x, y - 1, t.mossD); put(c, x - 1, y, t.mossD); put(c, x + 1, y, t.mossD); }
    /* the near rock: an uneven mass, narrower at the top, with a notch where the stream arrives */
    const prof = x => (inCh(x) ? F.top - 1 : F.top - 5 + Math.round(Math.sin(x * .5) * 2 + Math.sin(x * .21 + 2) * 3)) + Math.round(Math.max(0, 9 - Math.min(x - cl, cr - 1 - x)) * 1.7);
    for (let x = cl; x < cr; x++) for (let y = prof(x); y < F.bot + 3; y++) put(c, x, y, mixh(t.stoneD, '#000000', .35));
    for (let yy = F.top - 4; yy < F.bot + 6; yy += 5) {
      let x = cl - 4 + RC() * 3;
      while (x < cr + 4) { const rx = 3 + RC() * 3.5, ry = rx * (.7 + RC() * .2), cy = yy + RC() * 2.5; if (cy - ry * .6 >= prof(Math.round(x)) - 1 && cy - ry < F.bot + 2 && (x > cl + 1 || RC() < .6)) boulder(c, x, cy, rx, ry, t, RC, { moss: RC() < .3 }); x += rx * 1.5 + RC() * 2; }
    }
    /* wet dark rock behind each drop, so the water sits in the stone and not on it */
    F.tiers.forEach((tr, ti) => { for (let y = tr.y0; y < tr.y1; y++) { const o = F.off(ti, y), ex = F.ex(ti, y); for (let x = tr.x - 3 + o - (ex >> 1); x < tr.x + tr.w + 3 + o + ex; x++) { c.globalAlpha = .5; put(c, x, y, '#06100c'); c.globalAlpha = 1; } } });
    /* the ledges the water lands on: slabs of rock with a lit top, a mossy front and a sheet of water over the lip */
    F.ledges.forEach((lg, i) => {
      const lo = F.tiers[i + 1], up = F.tiers[i];
      for (let x = lg.x0; x < lg.x1; x += 4) boulder(c, x + 1, lg.y + 2, 4.6 + RC(), 2.8 + RC() * .8, t, RC, { moss: true });
      for (let x = lg.x0 + 1; x < lg.x1 - 1; x++) { put(c, x, lg.y - 1, mixh(t.stoneL, '#ffffff', .1)); put(c, x, lg.y, t.stone); }
      for (let x = Math.min(up.x, lo.x); x < Math.max(up.x + up.w, lo.x + lo.w); x++) { put(c, x, lg.y - 1, t.water); put(c, x, lg.y, t.water2); put(c, x, lg.y + 1, t.water2); }
      for (let x = lg.x0; x < lg.x1; x += 2) if (RC() < .5) { put(c, x, lg.y + 3 + Math.floor(RC() * 2), t.mossD); }
      for (let k = 0; k < 4; k++) for (let x = lg.x0 + 1; x < lg.x1 - 1; x++) { c.globalAlpha = .38 - k * .08; put(c, x, lg.y + 2 + k, '#06100c'); }
      c.globalAlpha = 1; for (let x = lg.x0 - 1; x < lg.x0 + 3; x++) put(c, x, lg.y + 1, t.stone); for (let x = lg.x1 - 3; x < lg.x1 + 1; x++) put(c, x, lg.y + 1, t.stone);
      fern(c, lg.x0 + 1, lg.y - 1, t, RC); fern(c, lg.x1 - 2, lg.y - 1, t, RC);
    });
    /* the stream arriving from behind, between mossy banks, and the lip it goes over */
    for (let x = F.x + F.w; x < F.x + F.w + 12; x++) { put(c, x, F.top - 3 + Math.round((x - F.x - F.w) * .12), t.water2); put(c, x, F.top - 2 + Math.round((x - F.x - F.w) * .12), t.water); }
    /* moss and ivy on every edge, roots of the trees above reaching over the top */
    for (let x = cl; x < cr; x++) { const top = prof(x); put(c, x, top - 1, t.moss); put(c, x, top, t.mossD); if (RC() < .3) put(c, x, top - 2, t.mossL); if (RC() < .35 && !inCh(x)) { const n = 3 + Math.floor(RC() * 9); for (let k = 1; k <= n; k++) put(c, x, top + k, k === n ? t.moss : t.mossD); } }
    for (const [sx, dir] of [[cl + 5, 1], [cr - 6, -1], [cl + 16, 1]]) { let rx = sx, ry = prof(sx) - 1; for (let j = 0; j < 16; j++) { rx += dir * (.7 + Math.sin(j / 2.2) * .5); ry += j < 4 ? -.2 : .75; put(c, Math.round(rx), Math.round(ry), '#2a1c14'); put(c, Math.round(rx), Math.round(ry) + 1, '#3a2a1e'); } }
    /* boulders at the foot, half in the water */
    for (const bx of [cl - 3, cl + 7, cl + 15, cr - 14, cr - 5, cr + 3]) boulder(c, bx, F.bot + 1 + Math.floor(RC() * 2), 4 + RC() * 4, 3.4 + RC() * 2, t, RC, { moss: RC() < .6 });
    /* light catching the rock on the side the sun comes from */
    for (let y = F.top; y < F.bot; y += 2) if (RC() < .5) put(c, cl + 1 + Math.floor(RC() * 3), y, t.stoneL);
    for (let i = 0; i < 4; i++) rune(c, cl + 3 + Math.floor(R() * (cr - cl - 8)), F.top + 10 + Math.floor(R() * (F.bot - F.top - 20)), t, .55);
    const P = L.pool; glow(c, P.x, P.y, P.rx, t.water2, t.glowA * .6);
    c.fillStyle = t.water2; for (let y = -P.ry; y <= P.ry; y++) { const w = Math.round(P.rx * Math.sqrt(1 - (y * y) / (P.ry * P.ry))); c.fillRect(P.x - w, P.y + y, w * 2, 1); }
    c.fillStyle = t.water; for (let y = -P.ry + 1; y < P.ry; y++) { const w = Math.round((P.rx - 3) * Math.sqrt(1 - (y * y) / (P.ry * P.ry))); c.fillRect(P.x - w, P.y + y, w * 2, 1); }
    /* standing stones, mossy, carved with runes */
    for (const s of L.stones) standing(c, s.x, s.y, s.h, t, R);
    /* the overgrown cottage */
    hut(c, L.hut.x, L.hut.y, t, R);
    /* giant ancient trunks framing both sides, roots over the floor */
    const tw = L.wide ? Math.max(18, Math.round(L.side * .28)) : 7;
    trunk(c, -Math.round(tw * .35), tw, t, R); trunk(c, W - Math.round(tw * .65), tw, t, R);
    if (L.wide) { trunk(c, Math.round(L.side * .96) - 6, Math.round(tw * .45), t, R, true); trunk(c, Math.round(W - L.side) - 2, Math.round(tw * .5), t, R, true); }
    /* the fairy ring */
    ring(c, L.ring.x, L.ring.y, t);
    /* a canopy across the top, with hanging moss and vines */
    for (let x = 0; x < W; x++) { const d = 9 + Math.round(4 * Math.sin(x / 11) + 3 * Math.sin(x / 4.1)); c.fillStyle = t.leafD; c.fillRect(x, 0, 1, d + 3); c.fillStyle = t.leaf; c.fillRect(x, 0, 1, d); }
    for (let x = 0; x < W; x += 3) { if (R() < .7) disk(c, x, 4 + Math.floor(R() * 9), 2 + Math.floor(R() * 3), R() < .4 ? t.leafD : R() < .6 ? t.leaf : t.moss); }
    const strands = L.wide ? Math.round(L.side / 4) : 8;
    for (let i = 0; i < strands; i++) { const left = i % 2 === 0, x = L.wide ? (left ? Math.round(R() * L.side) : Math.round(W - R() * L.side)) : Math.round(R() * W); hang(c, x, 4, Math.round(H * (.12 + R() * (L.wide ? .55 : .15))), t, R); }
    shade(c);
    if (L.wide) foreground(c, t, R);
    meadowFront(c, t);
    for (const l of L.lamps) { if (l.kind === 'post') lampPost(c, l.x, l.y, t); else if (l.kind === 'hang') lampHang(c, l.x, l.y, l.dir, t); }
  }
  /* a lantern on a post */
  function lampPost(c, x, y, t) {
    const lit = LIGHT[mood].lamp > 0;
    c.fillStyle = t.trunkD; c.fillRect(x, y - 10, 1, 10); c.fillRect(x - 2, y - 11, 5, 1); c.fillRect(x - 1, y - 16, 3, 1); c.fillRect(x - 1, y - 12, 3, 1); c.fillRect(x - 2, y - 15, 1, 3); c.fillRect(x + 2, y - 15, 1, 3);
    c.fillStyle = lit ? '#ffd27a' : '#bfa060'; c.fillRect(x - 1, y - 15, 3, 3); if (lit) { c.fillStyle = '#fff4c0'; c.fillRect(x, y - 14, 1, 1); }
    c.fillStyle = t.stoneD; c.fillRect(x - 1, y, 3, 1);
  }
  /* a lantern hung from an iron arm nailed to a trunk */
  function lampHang(c, x, y, dir, t) {
    const lit = LIGHT[mood].lamp > 0;
    c.fillStyle = t.trunkD; c.fillRect(Math.min(x, x - dir * 3), y - 6, 4, 1); c.fillRect(x, y - 5, 1, 2); c.fillRect(x - 1, y - 3, 3, 1); c.fillRect(x - 1, y + 1, 3, 1);
    c.fillStyle = lit ? '#ffd27a' : '#bfa060'; c.fillRect(x - 1, y - 2, 3, 3); if (lit) { c.fillStyle = '#fff4c0'; c.fillRect(x, y - 1, 1, 1); }
  }
  /* the dark at the edges, under the canopy and on the floor, in dithered steps: the clearing stays bright, the corners go deep */
  function shade(c) {
    const Lm = LIGHT[mood], [tk, tc] = mk(), id = tc.createImageData(W, H), d = id.data, rgb = hex(Lm.tint), cxm = W / 2, S = L.sun;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const e = Math.max(0, Math.abs(x - cxm) / cxm - .45) / .55;
      let v = Math.pow(e, 1.5) * .8 + Math.max(0, 1 - y / (H * .3)) * .3 + Math.max(0, (y - H * .88) / (H * .12)) * .5;
      const dx = x - S.hx, dy = (y - S.hy) * 1.8; v *= Math.min(1, Math.sqrt(dx * dx + dy * dy) / (W * .16));
      v *= Lm.shade; if (v < .02) continue;
      const lv = Math.floor(v * 8 + BAYER[(y & 3) * 4 + (x & 3)] / 16); if (lv <= 0) continue;
      const i = (y * W + x) * 4; d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = Math.min(150, lv * 20);
    }
    tc.putImageData(id, 0, 0); c.drawImage(tk, 0, 0);
  }
  /* ---------- the three light layers, painted once per scene ---------- */
  function paintLights() {
    for (const k of ['sun', 'lamp', 'wf']) { const [a, b] = mk(); lt[k] = a; lx[k] = b; }
    const Lm = LIGHT[mood], t = T, S = L.sun, A = Lm.sunA * (L.wide ? 1 : .6), R = rnd(53), F = L.fall;
    /* SUN: a soft glow from the upper left, a haze of light along the treeline, beams under the leaves, and dapples on the floor */
    { const c = lx.sun; c.fillStyle = Lm.sun;
      glow(c, Math.round(W * .2), -6, Math.round(H * .55), Lm.sun, .03 * A);
      for (let y = L.hz - 26; y < L.hz + 16; y++) { const k = 1 - Math.abs(y - (L.hz - 4)) / 30; c.globalAlpha = Math.round(Math.max(0, k) * 5) / 5 * .13 * A; c.fillRect(0, y, W, 1); }
      const sk = S.sk, ground = L.floor + 8;
      const beam = (x0, w, a) => {
        for (let y = 0; y < ground; y++) {
          const cxy = x0 + sk * y, hw = w / 2 + y * .035;
          for (let x = Math.floor(cxy - hw - 1); x <= Math.ceil(cxy + hw + 1); x++) {
            const cd = canopyD(x); if (y < cd) continue;
            const d = Math.abs(x - cxy) / hw; if (d > 1) continue;
            if (Math.sin(x * 1.9 + y * .7) + Math.sin(x * .8 - y * 1.1 + 2) > 1.5) continue;
            let lv = (1 - d * d) * Math.min(1, (y - cd) / 18) * Math.min(1, (ground - y) / 30) * a; lv = Math.round(lv * 6) / 6;
            if (lv <= 0) continue;
            c.globalAlpha = lv * A * .34; c.fillRect(x, y, 1, 1);
          }
        }
        const gx = x0 + sk * L.floor, n = Math.round(w * .9); for (let k = 0; k < 4; k++) { c.globalAlpha = A * .09; for (let y = -3 + k; y <= 3 - k; y++) { const ww = Math.round(Math.sqrt(1 - (y * y) / (16)) * (n - k * 3)); c.fillRect(Math.round(gx - ww), L.floor + 6 + y, ww * 2, 1); } }
      };
      beam(S.bx0, S.w, 1.9);
      const others = L.wide ? 5 : 2;
      for (let i = 0; i < others; i++) { const left = i % 2 === 0; beam(L.wide ? (left ? L.side * (.25 + R() * .6) : W - L.side * (.1 + R() * .8)) : R() * W, 6 + R() * 8, .35 + R() * .3); }
      for (let i = 0; i < (L.wide ? 30 : 12); i++) { const bx = S.bx0 + sk * L.floor, x = (L.wide ? (i % 3 ? bx + (R() - .5) * 90 : R() * W) : R() * W), y = L.floor + 3 + R() * (H - L.floor - 6), rx = 2 + R() * 5; c.globalAlpha = A * (.08 + R() * .1); for (let yy = -1; yy <= 1; yy++) { const w = Math.round(rx * (yy ? .7 : 1)); c.fillRect(Math.round(x - w), Math.round(y + yy), w * 2, 1); } }
      c.globalAlpha = 1; }
    /* LAMP: warm pools of light on the ground and the walls (the flickering glows are drawn live) */
    if (Lm.lamp) { const c = lx.lamp, lp = Lm.lamp, col = mood === 'sunset' ? '#ffb070' : '#ffc060'; c.fillStyle = col;
      const pool = (x, y, rx, ry, a) => { for (let k = 0; k < 4; k++) { c.globalAlpha = a * lp * .22; const rr = rx * (1 - k * .2), hh = ry * (1 - k * .2); for (let yy = -Math.round(hh); yy <= Math.round(hh); yy++) { const w = Math.round(rr * Math.sqrt(1 - (yy * yy) / (hh * hh + .01))); c.fillRect(Math.round(x - w), Math.round(y + yy), w * 2, 1); } } c.globalAlpha = 1; };
      pool(L.hut.x + 20, L.hut.y + 4, 17, 4, 1); pool(L.hut.x + 31, L.hut.y + 1, 12, 3, 1);
      for (const l of L.lamps) if (l.kind === 'post') pool(l.x, l.y + 1, 13, 3, 1);
      const w = L.hut; c.globalAlpha = .13 * lp; c.fillRect(w.x + 14, w.y - 15, 14, 15); c.globalAlpha = 1; }
    /* WATERFALL: the water gives off light at dusk and in the night; a halo over the pool and mist */
    if (Lm.wf) { const c = lx.wf, col = mood === 'sunset' ? '#ffc8a0' : '#7fe3ff'; c.fillStyle = col;
      /* a vague glow in the air around the fall, strongest next to the water and gone about fourteen pixels out; the water itself is left alone */
      F.tiers.forEach((tr, ti) => { for (let y = tr.y0 - 4; y < tr.y1 + 2; y++) { const o = F.off(ti, Math.max(tr.y0, Math.min(tr.y1 - 1, y))), ex = F.ex(ti, Math.max(tr.y0, Math.min(tr.y1 - 1, y))), x0 = tr.x + o - (ex >> 1), x1 = tr.x + o + tr.w + ex; for (let d = 1; d <= 14; d++) { const q = 1 - d / 15, a = Math.round(q * q * 4) / 4 * .085 * Lm.wf; if (a <= 0) continue; c.globalAlpha = a; c.fillRect(x0 - d, y, 1, 1); c.fillRect(x1 + d - 1, y, 1, 1); } } });
      c.globalAlpha = 1; const P = L.pool; for (const lg of F.ledges) glow(c, Math.round((lg.x0 + lg.x1) / 2), lg.y, 9, col, .035 * Lm.wf); glow(c, P.x, P.y - 2, P.rx + 16, col, .03 * Lm.wf); }
  }
  /* ONE FAR TREE. Five kinds (plain, crooked, leaning, forked, twisted), each with its own width, bends, flared roots, knots,
     moss, side branches ending in leaf clumps, and vines hanging from the branches. Returns where vines can be tied. */
  function farTree(c, x, base, k, col, t, R) {
    const dk = mixh(col, '#000000', k === 1 ? .08 : .2), r = R(), type = r < .88 ? 'plain' : 'fork'; /* straight trunks only: no crooks, twists or sways (Mako) */
    let w = 2 + k * 2 + Math.floor(R() * 3); if (R() < .12) w += 3;
    const lean = (type === 'lean' ? (R() < .5 ? -1 : 1) * (.03 + R() * .07) : (R() - .5) * .05), amp = R() * .3, per = 16 + R() * 22, ph = R() * 6.28;
    const off = dy => lean * dy + amp * Math.sin(dy / per + ph) - amp * Math.sin(ph), moss = mixh(t.far[k], t.mossD, .35), hz = mixh(col, t.fog, .5), A = [];
    const bot = base + 40, soft = k === 1;
    const bar = (X, Y, ww, cc) => { c.fillStyle = cc; c.fillRect(X, Y, ww, 1); };
    for (let y = 0; y < bot; y++) {
      const dy = base - y, o = off(dy), fl = y > base - 7 ? Math.floor((y - (base - 7)) / 2.5) : 0, ww = w + fl;
      let X = Math.round(x + o - ww / 2);
      if (type === 'twist' && dy > 8) { const sw = Math.round(Math.sin(dy / 9 + ph) * (w * .45)); bar(X + sw, y, Math.max(1, ww - 1), col); bar(X - sw, y, Math.max(1, ww - 1), col); }
      else bar(X, y, ww, col);
      if (soft) { c.globalAlpha = .3; bar(X - 1, y, 1, hz); bar(X + ww, y, 1, hz); c.globalAlpha = .15; bar(X - 2, y, 1, hz); bar(X + ww + 1, y, 1, hz); c.globalAlpha = 1; }
      if (R() < .035 && y < base - 4) { c.fillStyle = moss; c.fillRect(X, y, 1, 2 + Math.floor(R() * 4)); }
    }
    /* a knot or two, and a hollow */
    for (let i = 0, n = 1 + Math.floor(R() * 2); i < n; i++) { const y = Math.round(base * (.25 + R() * .6)), o = off(base - y); c.fillStyle = mixh(col, '#000000', .35); c.fillRect(Math.round(x + o - 1), y, 2, 3); }
    /* branches: out and up from the trunk, bending, with twigs and a leaf clump on the end */
    const nb = 2 + Math.floor(R() * (3 + k));
    for (let i = 0; i < nb; i++) {
      const dy0 = base * (.12 + R() * .8), y0 = Math.round(base - dy0), side = R() < .5 ? -1 : 1, len = 7 + Math.floor(R() * (10 + k * 6)), rise = .25 + R() * .9, th = k > 0 && R() < .5 ? 2 : 1;
      let bx = x + off(dy0) + side * w * .4, by = y0, wob = R() * 6.28; if (type === 'crook' && R() < .5) wob += 2;
      for (let j = 0; j < len; j++) {
        bx += side * (.85 + Math.sin(j / 3 + wob) * .35); by -= rise * (.4 + j / len) + Math.sin(j / 4 + wob) * .2;
        bar(Math.round(bx), Math.round(by), 1, dk); if (th > 1 && j < len * .6) bar(Math.round(bx), Math.round(by) + 1, 1, dk);
        if (j > 3 && j % 5 === 0 && R() < .7) { const sd = R() < .5 ? 1 : -1; for (let q = 1; q <= 2 + Math.floor(R() * 3); q++) bar(Math.round(bx + side * q * .7), Math.round(by - sd * q * .7), 1, dk); }
      }
      const ex = Math.round(bx), ey = Math.round(by);
      for (let q = 0, m = 2 + Math.floor(R() * 3); q < m; q++) disk(c, ex + Math.round((R() - .5) * 6), ey + Math.round((R() - .6) * 4), 1 + Math.floor(R() * 2) + (k > 0 ? 1 : 0), R() < .5 ? dk : mixh(col, t.leafD, .4));
      A.push({ x: ex, y: ey });
      if (R() < .6) hangVine(c, ex, ey, 8 + Math.floor(R() * 24), dk, t, R);
    }
    /* the fork: a second trunk leaves the first and climbs away from it */
    if (type === 'fork') {
      const dy0 = base * (.35 + R() * .3), side = R() < .5 ? -1 : 1; let fx = x + off(dy0), fy = base - dy0; const wf = Math.max(1, w - 1);
      for (let j = 0; fy > -2; j++) { fx += side * Math.max(.1, .75 - j * .02); fy -= 1; bar(Math.round(fx - wf / 2), Math.round(fy), wf, col); }
    }
    for (let i = 0, n = 1 + Math.floor(R() * 2); i < n; i++) hangVine(c, Math.round(x + off(base * (.2 + R() * .5)) + (R() - .5) * w), Math.round(base * (.1 + R() * .3)), 10 + Math.floor(R() * 26), col, t, R);
    A.push({ x: Math.round(x + off(base * .55)), y: Math.round(base * .45) });
    return { x, A, off, w, base };
  }
  function hangVine(c, x, y, len, col, t, R) {
    const sw = (R() - .5) * 2, ph = R() * 6.28, lc = mixh(col, t.leafD, .4);
    for (let i = 0; i < len; i++) { const X = Math.round(x + Math.sin(i / 6 + ph) * sw * 1.5), Y = y + i; c.fillStyle = col; c.fillRect(X, Y, 1, 1); if (i > 3 && i % 4 === 0 && R() < .7) { c.fillStyle = lc; c.fillRect(X + (i % 8 === 0 ? 1 : -1), Y, 1, 1); } }
  }
  /* a vine slung between two trees: a sagging curve with a few leaves */
  function drapeVine(c, a, b, col, t, R) {
    const p = a.A[Math.floor(R() * a.A.length)], q = b.A[Math.floor(R() * b.A.length)], n = Math.max(6, Math.abs(q.x - p.x)), sag = 4 + R() * 9, lc = mixh(col, t.leafD, .4);
    for (let i = 0; i <= n; i++) { const u = i / n, X = Math.round(p.x + (q.x - p.x) * u), Y = Math.round(p.y + (q.y - p.y) * u + sag * 4 * u * (1 - u)); c.fillStyle = col; c.fillRect(X, Y, 1, 1); if (i % 6 === 3 && R() < .7) { c.fillStyle = lc; c.fillRect(X, Y + 1, 1, 2); } }
  }
  /* THE NEAR LAYER of the forest, painted last: dark ferns arching up from the bottom corners, big leaves hanging into the top
     corners, all darker than anything behind them and rim-lit, so the scene has a front, a middle and a far. */
  function frond(c, x, y, len, dir, col, hi) {
    let px = x, py = y;
    for (let i = 0; i < len; i++) {
      const a = i / len; px += dir * (.9 - a * .3); py -= 1.25 * (1 - a * 1.15);
      const X = Math.round(px), Y = Math.round(py); put(c, X, Y, col); put(c, X, Y + 1, col);
      if (i > 3 && i % 2 === 0) { const n = Math.round(7 * Math.sin(a * 3.1) + 2); for (let k = 1; k <= n; k++) { put(c, X + dir * Math.round(k * .5), Y - Math.round(k * .85), k === n ? hi : col); put(c, X + dir * Math.round(k * .85), Y + Math.round(k * .6), col); } }
    }
  }
  function hangLeaf(c, x, len, dir, col, hi) {
    for (let i = 0; i < len; i++) { const w = Math.round(3.2 * Math.sin(Math.PI * (i + 2) / (len + 4)) + 1), o = Math.round(Math.sin(i / 9) * 2 * dir); for (let k = 0; k < w; k++) put(c, x + o + k - (w >> 1), i, k === 0 ? hi : col); put(c, x + o, i, mixh(col, '#000000', .25)); }
  }
  /* ---------- the foreground: close, dark and sharp, so the clearing behind it has depth ----------
     arching ferns with leaflets, grass, foxglove and bluebell stalks, a mossy boulder with toadstools, a fallen log.
     Lit from the upper left like the rest of the scene. */
  function foreground(c, t, R) {
    const stem = mixh(t.leafD, '#000000', .25), dk = t.leaf, md = mixh(t.leaf, t.moss, .55), hi = mixh(t.moss, t.mossL, .5), tip = t.mossL;
    const pt = (x, y, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); };
    /* a fern: n fronds fanning out from one root, each arching over, leaflets in pairs getting shorter towards the tip */
    const ferns = (x, y, n, len, dir) => {
      for (let k = 0; k < n; k++) {
        const a = ((n === 1 ? .5 : k / (n - 1)) - .5) * 2.3 + dir * .25, ln = len * (.62 + R() * .38), bend = (a < 0 ? -1 : 1) * (.7 + R() * .5);
        let px = x, py = y;
        for (let st = 1; st <= ln; st++) {
          const u = st / ln, th = a + bend * u * u * 1.3; px += Math.sin(th); py -= Math.cos(th) * (1 - u * .35);
          pt(px, py, stem);
          if (u > .14 && st % 2 === 0) { const ll = Math.round((1 - u) * 4.4 + 1), qx = Math.cos(th), qy = Math.sin(th);
            for (let i = 1; i <= ll; i++) { const dy = i > 2 ? 1 : 0; pt(px - qx * i, py - qy * i + dy, i === ll ? hi : md); pt(px + qx * i, py + qy * i + dy, dk); } }
        }
        pt(px, py, tip); pt(px + (a < 0 ? -1 : 1), py + 1, hi);
      }
    };
    const grass = (x, y, n, h) => { for (let i = 0; i < n; i++) { const hh = h * (.5 + R() * .6), lean = (R() - .5) * 3; for (let j = 0; j < hh; j++) pt(x + i * 1.5 + lean * j / hh, y - j, j > hh * .65 ? tip : j > hh * .3 ? md : dk); } };
    const foxglove = (x, y, h) => { for (let j = 0; j < h; j++) pt(x, y - j, j % 5 === 0 ? md : dk); for (let j = 3; j < h - 1; j += 2) { const sd = j % 4 === 1 ? -1 : 1, k = 1 - j / h; pt(x + sd, y - j, '#c88ae0'); pt(x + sd * 2, y - j + 1, k > .5 ? '#9a62b8' : '#7a4a98'); pt(x + sd, y - j + 1, '#f0c0f4'); } pt(x, y - h, '#e8b0f0'); };
    const bluebell = (x, y, h, dir) => { let px = x, py = y; for (let j = 0; j < h; j++) { px += dir * (j > h * .55 ? .5 : .08); py -= 1; pt(px, py, dk); } for (let k = 0; k < 4; k++) { const bx = px - dir * k * 1.5, by = py + k * 2 + 1; pt(bx, by, '#7a9cf0'); pt(bx, by + 1, '#c8d8ff'); pt(bx + dir, by, '#4a6ad0'); } };
    const shroom = (x, y, z) => { c.fillStyle = '#efe6d6'; c.fillRect(x, y - z, 1, z); c.fillStyle = '#e6736a'; c.fillRect(x - 1, y - z - 1, 3, 1); c.fillRect(x - 2, y - z, 5, 1); c.fillStyle = '#ffffff'; c.fillRect(x - 1, y - z, 1, 1); c.fillRect(x + 1, y - z - 1, 1, 1); c.fillStyle = '#b4504a'; c.fillRect(x + 2, y - z, 1, 1); };
    const log = (x, y, len) => {
      for (let i = 0; i < len; i++) { const top = y - 6 + Math.round(Math.sin(i / 7) * .8); for (let j = top; j < y; j++) { c.fillStyle = j === top ? t.moss : (j - top) % 3 === 2 ? t.trunkD : t.trunk; c.fillRect(x + i, j, 1, 1); } if (i % 4 === 1) pt(x + i, top + 2, t.trunkL); if (i % 5 === 3) pt(x + i, top, t.mossL); }
      c.fillStyle = t.trunkL; c.fillRect(x, y - 6, 2, 6); c.fillStyle = t.trunkD; c.fillRect(x, y - 4, 2, 1); c.fillStyle = t.mossD; c.fillRect(x + len - 1, y - 6, 1, 6);
      shroom(x + Math.round(len * .55), y - 6, 2); shroom(x + Math.round(len * .55) + 4, y - 5, 1);
    };
    const side = L.side, Wd = W;
    /* bottom left */
    foxglove(23, H - 2, 24); foxglove(28, H - 2, 17); grass(14, H - 1, 4, 9); grass(40, H - 1, 4, 7); grass(62, H - 1, 3, 8);
    boulder(c, 52, H - 2, 8, 5, t, R, { moss: true }); shroom(48, H - 6, 2); shroom(55, H - 5, 3); shroom(57, H - 4, 1);
    ferns(2, H - 1, 6, 24, 1); ferns(34, H, 4, 12, -1);
    /* bottom right */
    log(Wd - 74, H - 2, 22); bluebell(Wd - 44, H - 1, 15, -1); bluebell(Wd - 40, H - 1, 11, -1); grass(Wd - 54, H - 1, 3, 7); grass(Wd - 24, H - 1, 4, 8);
    ferns(Wd - 3, H - 1, 6, 26, -1); ferns(Wd - 30, H, 4, 12, 1);
    const dark = mixh(t.leafD, '#000000', .5), hi2 = mixh(t.mossL, '#000000', .3);
    for (const [x0, dir] of [[2, 1], [W - 3, -1]]) for (let k = 0; k < 5; k++) hangLeaf(c, x0 + dir * k * 5 + Math.floor(R() * 3), 14 + Math.floor(R() * 20), dir, dark, hi2);
    L.bokeh = []; for (let i = 0; i < 8; i++) { const left = i % 2 === 0; L.bokeh.push({ x: left ? R() * L.side : W - R() * L.side, y: H * (.2 + R() * .65), r: 3 + Math.floor(R() * 3), sp: .01 + R() * .015, ph: R() * 6.28, c: t.fairy[i % 4] }); }
  }
  function fern(c, x, y, t, R) { c.fillStyle = R() < .5 ? t.moss : t.mossD; c.fillRect(x, y - 3, 1, 3); c.fillRect(x - 1, y - 2, 1, 1); c.fillRect(x + 1, y - 2, 1, 1); c.fillRect(x - 2, y - 1, 1, 1); c.fillRect(x + 2, y - 1, 1, 1); }
  function rune(c, x, y, t, a) { c.globalAlpha = a; c.fillStyle = t.rune; c.fillRect(x, y, 1, 3); c.fillRect(x + 1, y + 1, 1, 1); c.fillRect(x + 2, y, 1, 1); c.fillRect(x + 2, y + 2, 1, 1); c.globalAlpha = 1; }
  function standing(c, x, y, h, t, R) {
    const w = Math.max(5, Math.round(h * .45));
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x - 1, y, w + 3, 2);
    for (let j = 0; j < h; j++) { const ww = w - (j < 2 ? 2 - j : 0); c.fillStyle = j < 3 ? t.stoneL : t.stone; c.fillRect(x + (w - ww) / 2, y - h + j, ww, 1); }
    c.fillStyle = t.stoneD; c.fillRect(x + w - 1, y - h + 2, 1, h - 2);
    c.fillStyle = t.moss; c.fillRect(x, y - h, w, 1); for (let i = 0; i < w; i++) if (R() < .6) c.fillRect(x + i, y - h + 1, 1, 1 + Math.floor(R() * Math.min(5, h / 3)));
    c.fillStyle = t.mossD; c.fillRect(x - 1, y - 2, w + 2, 2);
    rune(c, x + Math.floor(w / 2) - 1, y - Math.round(h * .55), t, .7);
  }
  function trunk(c, x, w, t, R, back) {
    const base = Math.round(L.floor + (back ? 2 : 8));
    for (let xx = 0; xx < w; xx++) { const edge = Math.min(xx, w - 1 - xx); c.fillStyle = edge < 1 ? t.trunkD : (xx % 5 === 2 ? t.trunkL : t.trunk); c.fillRect(x + xx, 0, 1, base); }
    for (let i = 0; i < w * 4; i++) { c.fillStyle = t.trunkD; c.fillRect(x + 1 + Math.floor(R() * (w - 2)), Math.floor(R() * base), 1, 3 + Math.floor(R() * 6)); }
    for (let i = 0; i < w * 5; i++) { const xx = x + Math.floor(R() * w), yy = Math.floor(base - Math.pow(R(), 1.6) * base); c.fillStyle = R() < .5 ? t.moss : t.mossL; c.fillRect(xx, yy, 1 + Math.floor(R() * 2), 1 + Math.floor(R() * 3)); }
    for (let k = 0; k < 4; k++) { let rx = x + Math.round(w * (k < 2 ? .1 : .9)), ry = base - 4; const dir = k < 2 ? -1 : 1, len = Math.round(w * (.5 + R() * .6)); for (let s = 0; s < len; s++) { rx += dir; if (s % 3 === 0) ry += 1; c.fillStyle = t.trunk; c.fillRect(rx, ry, 1, Math.max(1, 3 - Math.floor(s / (len / 3)))); if (R() < .3) { c.fillStyle = t.moss; c.fillRect(rx, ry - 1, 1, 1); } } }
    if (w > 12) { const hx = x + Math.round(w * .45), hy = Math.round(base * .45); c.fillStyle = t.trunkD; c.fillRect(hx - 2, hy - 3, 5, 6); c.globalAlpha = .5 * t.glowA + .2; c.fillStyle = t.rune; c.fillRect(hx - 1, hy - 1, 3, 3); c.globalAlpha = 1; }
  }
  function hang(c, x, y0, len, t, R) {
    let vx = x; const ph = R() * 6, moss = R() < .5;
    for (let y = y0; y < len; y++) {
      vx = x + Math.round(Math.sin(y / 10 + ph) * 1.5);
      if (moss) { c.fillStyle = (y % 3) ? t.mossD : t.moss; c.fillRect(vx, y, 1, 1); if (y % 2 === 0 && R() < .5) c.fillRect(vx + (R() < .5 ? -1 : 1), y, 1, 1); }
      else { c.fillStyle = t.leafD; c.fillRect(vx, y, 1, 1); if (y % 4 === 0) { c.fillStyle = (y % 8) ? t.moss : t.leaf; c.fillRect(vx + ((y / 4) % 2 ? 1 : -2), y, 2, 2); } }
      if (y % 19 === 11 && R() < .6) { c.fillStyle = ['#f6b8d8', '#fff2c0', '#c8b8ff'][Math.floor(R() * 3)]; c.fillRect(vx - 1, y, 1, 1); c.fillRect(vx + 1, y, 1, 1); c.fillRect(vx, y - 1, 1, 1); c.fillRect(vx, y + 1, 1, 1); c.fillStyle = '#fff6c0'; c.fillRect(vx, y, 1, 1); }
    }
  }
  function ring(c, x, y, t) {
    const n = 9; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, mx = Math.round(x + Math.cos(a) * 11), my = Math.round(y + Math.sin(a) * 3);
      glow(c, mx, my - 2, 3, t.rune, t.glowA * .5);
      c.fillStyle = '#efe6d6'; c.fillRect(mx, my - 2, 1, 2); c.fillStyle = mood === 'night' ? '#7affd8' : i % 2 ? '#e6736a' : '#c48ad8'; c.fillRect(mx - 1, my - 3, 3, 1); c.fillRect(mx, my - 4, 1, 1); }
  }
  function hut(c, x, base, t, R) {
    const w = 28, hW = 15;
    c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x - 3, base, w + 8, 2);
    for (let j = 0; j < hW; j++) { c.fillStyle = j % 3 === 2 ? t.trunkD : mix(t.stone, t.trunk, .35); c.fillRect(x, base - hW + j, w, 1); }
    for (let i = 0; i < 18; i++) { c.fillStyle = t.stoneL; c.fillRect(x + 1 + Math.floor(R() * (w - 3)), base - hW + 1 + Math.floor(R() * (hW - 2)), 2, 1); }
    for (let j = 0; j < 12; j++) { const ww = w + 8 - Math.round(j * 1.6); c.fillStyle = j % 3 === 0 ? t.mossD : t.moss; c.fillRect(x - 4 + Math.round(j * .8), base - hW - 1 - j, ww, 1); }
    for (let i = 0; i < w + 8; i += 2) if (R() < .7) { c.fillStyle = R() < .5 ? t.mossD : t.moss; c.fillRect(x - 4 + i, base - hW, 1, 1 + Math.floor(R() * 4)); }
    c.fillStyle = '#efe6d6'; c.fillRect(x + 4, base - hW - 8, 1, 2); c.fillStyle = '#e6736a'; c.fillRect(x + 3, base - hW - 9, 3, 1);
    c.fillStyle = '#efe6d6'; c.fillRect(x + 19, base - hW - 5, 1, 2); c.fillStyle = '#c48ad8'; c.fillRect(x + 18, base - hW - 6, 3, 1);
    c.fillStyle = t.trunkD; c.fillRect(x + 21, base - hW - 15, 3, 7);
    disk(c, x + 7, base - 6, 4, t.trunkD); c.fillStyle = t.trunkD; c.fillRect(x + 3, base - 6, 9, 6); c.fillStyle = '#f6d860'; c.fillRect(x + 9, base - 4, 1, 1);
    const lit = t.lit > .3; if (lit) glow(c, x + 20, base - 9, 7, t.win, .5 * t.lit);
    disk(c, x + 20, base - 9, 3, lit ? t.win : mix(t.win, t.trunk, .4)); c.fillStyle = t.trunkD; c.fillRect(x + 20, base - 12, 1, 7); c.fillRect(x + 17, base - 9, 7, 1);
    for (let k = 0; k < 4; k++) { const vx = x + 2 + k * 7; for (let y = base - hW; y < base - 2 - (k % 2) * 4; y++) { const o = Math.round(Math.sin(y / 3 + k)); c.fillStyle = t.mossD; c.fillRect(vx + o, y, 1, 1); if (y % 3 === 0) { c.fillStyle = t.mossL; c.fillRect(vx + o + 1, y, 1, 1); } } }
    c.fillStyle = t.trunkD; c.fillRect(x + w + 3, base - 9, 1, 9); if (t.lit > 0) glow(c, x + w + 3, base - 10, 4, '#ffd27a', .6 * t.lit); c.fillStyle = t.lit > 0 ? '#ffd27a' : '#c9a35a'; c.fillRect(x + w + 2, base - 11, 3, 3);
    c.fillStyle = t.stone; for (let i = 0; i < 5; i++) c.fillRect(x + 6 + i * 4, base + 2 + (i % 2), 3, 1);
  }

  /* ---------- things that cross the sky behind the trees: birds often, a dragon rarely, a saucer very rarely ----------
     They are drawn between the sky and the trees, so a trunk can pass in front of them. ?fly=bird|dragon|ufo brings one in at once, for looking at. */
  const FLYQ = (location.search.match(/[?&]fly=(bird|dragon|ufo)\b/) || [])[1] || '';
  const fly = { birds: [], dragon: null, ufo: null, nb: 36 + Math.random() * 90, nd: 2400 + Math.random() * 2400, nu: 3600 + Math.random() * 3600 };
  if (FLYQ) { fly.nb = fly.nd = fly.nu = 1e9; fly[{ bird: 'nb', dragon: 'nd', ufo: 'nu' }[FLYQ]] = 8; }
  const line = (c, x0, y0, x1, y1, col) => { c.fillStyle = col; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) c.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); };
  const BIRD = [['b...b', '.b.b.', '..b..'], ['.....', 'bbbbb', '..b..'], ['..b..', 'bb.bb', '.....']];
  function flyers(c, f) {
    if (!L) return; const top = 26, bot = Math.round(L.hz * .78), night = mood === 'night';
    /* birds: a small flock, a loose V, flapping out of step */
    if (f > fly.nb) { fly.nb = f + (FLYQ === 'bird' ? 120 : 160 + Math.random() * 280); const dir = Math.random() < .5 ? 1 : -1, n = 3 + Math.floor(Math.random() * 4), y0 = top + 4 + Math.random() * (bot - top - 24), sp = 1.6 + Math.random() * .8;
      for (let i = 0; i < n; i++) fly.birds.push({ x: dir > 0 ? -6 - i * 5 : W + 6 + i * 5, y: y0 + Math.abs(i - (n >> 1)) * 3 + (i % 2) * 2, dir, sp, ph: Math.floor(Math.random() * 8), bob: Math.random() * 6 }); }
    const bc = night ? '#9fb4e0' : mood === 'sunset' ? '#3a2a44' : '#22332f';
    fly.birds = fly.birds.filter(b => { b.x += b.dir * b.sp; if (b.dir > 0 ? b.x > W + 14 : b.x < -16) return false; const fr = BIRD[((f + b.ph) >> 1) % 3 === 2 ? 1 : ((f + b.ph) >> 1) % 2], yy = b.y + Math.sin(f / 9 + b.bob) * 1.5; c.save(); c.translate(Math.round(b.x), Math.round(yy)); c.scale(2, 2); grid(c, 0, 0, fr, { b: bc }, false); c.restore(); return true; });
    /* the dragon: long, slow wingbeats, a tail that follows the body */
    if (!fly.dragon && f > fly.nd) { fly.nd = f + (FLYQ === 'dragon' ? 150 : 4500 + Math.random() * 4500); const dir = Math.random() < .5 ? 1 : -1; fly.dragon = { x: dir > 0 ? -40 : W + 40, y: top + 14 + Math.random() * (bot - top - 40), dir, sp: 1, y0: 0, t: 0, ph: Math.random() * 6.28 }; fly.dragon.y0 = fly.dragon.y; }
    if (fly.dragon) { const d = fly.dragon; d.t++; d.x += d.dir * d.sp * (.8 + .35 * Math.sin(d.t / 70 + d.ph)); d.y = d.y0 + Math.sin(d.t / 34 + d.ph) * 10 + Math.sin(d.t / 13) * 2.2 + (d.t / 60) * -1.6 * Math.sin(d.ph); if (d.dir > 0 ? d.x > W + 44 : d.x < -44) fly.dragon = null; else { c.save(); c.globalAlpha = .94; c.translate(Math.round(d.x), Math.round(d.y)); dragon(c, 0, 0, f, d.dir, night); c.restore(); } }
    /* the saucer: glides in, stops and wobbles, then is gone in a jump */
    if (!fly.ufo && f > fly.nu) { fly.nu = f + (FLYQ === 'ufo' ? 150 : 5400 + Math.random() * 5400); const dir = Math.random() < .5 ? 1 : -1; fly.ufo = { x: dir > 0 ? -10 : W + 10, y: top + 6 + Math.random() * (bot - top - 30), dir, hx: W * (.3 + Math.random() * .4), st: 0, t: 0, vy: 0 }; }
    if (fly.ufo) { const u = fly.ufo; u.t++;
      if (u.st === 0) { u.x += u.dir * 2.2; if ((u.x - u.hx) * u.dir > 0) { u.st = 1; u.t = 0; } }
      else if (u.st === 1) { u.y += Math.sin(u.t / 2) * .6; if (u.t > 22) { u.st = 2; u.vy = -(.5 + Math.random() * .8); } }
      else { u.x += u.dir * 6; u.y += u.vy * 3; }
      if (u.x < -14 || u.x > W + 14 || u.y < -8) fly.ufo = null; else ufo(c, u.x, u.y, f, night, u.st === 1); }
  }
  /* the dragon: dark green, outlined, round-headed, with one big shiny eye and a pink cheek. Drawn at the scene's own pixel size (no scaling).
     Local coordinates: +x is forward, and the sprite is mirrored by dir. Colours come from the palette (pal.js): moss for the body, teal for the wings,
     ember for the horns and the tip of the tail. */
  function dragon(c, x, y, f, dir, night) {
    const M = PAL.moss, T = PAL.teal, E = PAL.ember, flap = Math.sin(f / 2.4), O = M[2]; /* v38.17: no black outline. The darkest tone used is a deep green, and the body is shaded instead of ringed */
    const P = (ox, oy, cc) => { c.fillStyle = cc; c.fillRect(Math.round(x + dir * ox), Math.round(y + oy), 1, 1); };
    const Ln = (x0, y0, x1, y1, cc) => line(c, x + dir * x0, y + y0, x + dir * x1, y + y1, cc);
    const wing = k => { const sx0 = -(1 + k * 3), sy0 = -3, up = k ? flap * .6 : flap, tx = sx0 - (5 + (k ? 0 : 2)) + Math.abs(up) * 3, ty = sy0 - 8 - up * 10, mem = k ? T[1] : T[0], edge = k ? T[3] : T[2];
      for (let q = 0; q <= 9; q++) Ln(tx, ty, sx0 - q * 1.7 - 1, sy0 + 2 + (q > 6 ? 1 : 0), mem);
      for (let q = 1; q <= 3; q++) Ln(tx, ty, sx0 - q * 5.4, sy0 + 2 + (q === 3 ? 2 : 0), edge);
      Ln(sx0, sy0, tx, ty, M[1]); P(tx, ty - 1, E[3]); };
    wing(0);
    /* tail and body: a wave that travels back from the shoulders; outline first, then fill */
    const seg = []; for (let i = 0; i < 22; i++) seg.push([-i, Math.round(Math.sin(f / 5 - i * .5) * (1 + i * .12)), i < 4 ? 5 : i < 9 ? 4 : i < 15 ? 3 : 2]);
    seg.forEach(([ox, cy, th], i) => { for (let j = 0; j < th; j++) P(ox, cy - 1 + j, j === 0 ? M[4] : j === th - 1 ? (i < 10 ? M[5] : M[2]) : j === 1 ? M[3] : M[2]); if (i > 1 && i < 17 && i % 3 === 1) { P(ox, cy - 2, M[5]); P(ox - 1, cy - 2, O); } });
    { const [ox, cy] = seg[21]; [[-1, -1], [-1, 0], [-2, -1], [-2, 0], [-3, 0]].forEach(([a, b]) => P(ox + a, cy + b, a === -1 ? E[4] : E[3])); P(ox - 4, cy, E[1]); }
    wing(1);
    /* neck, round head, snout */
    [[1, -1], [2, -2], [3, -3]].forEach(([a, b]) => { P(a, b, M[4]); P(a, b + 1, M[3]); });
    const hx = 6, hy = -6;
    const inH = (xx, yy) => (xx * xx) / 17 + (yy * yy) / 10 <= 1 || (xx >= 3 && xx <= 6 && yy >= -1 && yy <= 2);
    for (let yy = -4; yy <= 4; yy++) for (let xx = -5; xx <= 7; xx++) if (inH(xx, yy)) P(hx + xx, hy + yy, yy < -1 ? M[4] : yy > 1 ? M[5] : M[3]);
    /* the cute part: a big dark eye with two shines, a pink cheek, a nostril and a small smile */
    [[0, -1], [1, -1], [2, -1], [0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]].forEach(([a, b]) => P(hx + a, hy + b, PAL.night[0]));
    P(hx, hy - 1, PAL.ash[5]); P(hx + 1, hy - 1, PAL.ash[3]); P(hx + 2, hy + 1, E[5]);
    P(hx - 2, hy + 2, PAL.rose[4]); P(hx - 1, hy + 2, PAL.rose[3]); P(hx + 6, hy - .5, PAL.night[0]); P(hx + 3, hy + 3, O); P(hx + 4, hy + 3, O); P(hx + 5, hy + 2, O);
    /* two small horns and a fin behind the eye */
    P(hx - 1, hy - 5, E[3]); P(hx - 1, hy - 6, E[4]); P(hx + 2, hy - 5, E[3]); P(hx + 2, hy - 6, E[4]); P(hx - 4, hy - 3, T[3]); P(hx - 5, hy - 2, T[2]);
    if (night && f % 36 < 3) { P(hx + 9, hy + 1, E[4]); P(hx + 10, hy + 1, E[5]); P(hx + 11, hy + 1, E[6]); P(hx + 10, hy, E[3]); }
  }
  function ufo(c, x, y, f, night, hover) {
    const X = Math.round(x), Y = Math.round(y);
    if (night || hover) spot(c, X + 5, Y + 3, hover ? 9 : 7, night ? '#9affd0' : '#d0fff0', hover ? .5 : .3);
    c.fillStyle = '#bfe9ff'; c.fillRect(X + 3, Y, 5, 1); c.fillRect(X + 2, Y + 1, 7, 1); c.fillStyle = '#f2fbff'; c.fillRect(X + 4, Y, 1, 1);
    c.fillStyle = '#aeb8c2'; c.fillRect(X, Y + 2, 11, 1); c.fillRect(X + 1, Y + 3, 9, 1); c.fillStyle = '#6d7a84'; c.fillRect(X + 2, Y + 4, 7, 1);
    const L3 = ['#ff6a6a', '#ffe66a', '#6aff9a']; for (let i = 0; i < 3; i++) { c.fillStyle = (Math.floor(f / 2) + i) % 3 === 0 ? '#ffffff' : L3[i]; c.fillRect(X + 2 + i * 3, Y + 2, 1, 1); }
    if (hover && f % 4 < 2) { c.globalAlpha = .18; c.fillStyle = '#d8fff0'; for (let k = 0; k < 14; k++) c.fillRect(X + 3 - Math.round(k * .3), Y + 5 + k, 5 + Math.round(k * .6), 1); c.globalAlpha = 1; }
  }

  /* ---------- the meadow: the whole bottom of the screen, which is what you see when you scroll down. Tall grass in patches (cool, warm and deep greens),
     reeds, ferns, flower spikes, mushrooms, mossy stones, a fallen log and a stump with a tiny door. Clearings are left for the little things that
     live there (a frog on its stone, a snail on the log, a pair of eyes). Nothing is spread evenly: every clump has its own height, lean and colour. ---------- */
  const EGGQ = /[?&]eggs\b/.test(location.search) ? 130 : 0, SQQ = /[?&]sq\b/.test(location.search);
  const tones3 = t => [
    [mixh(t.mossD, t.fog, .1), t.moss, t.mossL, mixh(t.mossL, t.shaft, .3)],
    [mixh(t.mossD, '#000000', .15), mixh(t.moss, '#a8a050', .22), mixh(t.mossL, '#d8d070', .25), mixh(t.mossL, '#f0ecb0', .4)],
    [mixh(t.leafD, '#000000', .1), t.mossD, t.moss, mixh(t.mossL, t.shaft, .15)],
    /* lime: young, sunlit grass */
    [mixh(t.moss, '#6a8a30', .3), mixh(t.moss, '#8ab840', .4), mixh(t.mossL, '#c8e070', .4), mixh(t.mossL, '#f4f4b8', .5)],
    /* deep: old grass in the shade, almost blue */
    [mixh(t.mossD, '#000000', .35), mixh(t.mossD, '#0c3a40', .4), mixh(t.moss, '#0c3a40', .35), mixh(t.moss, t.shaft, .12)]];
  const blade2 = (c, x, y, h, lean, c1, c2) => { for (let i = 0; i < h; i++) { c.fillStyle = i >= h - 2 ? c2 : c1; c.fillRect(x + Math.round(lean * Math.pow(i / h, 2) * 3.4), y - i, 1, 1); } };
  const leaf2 = (c, x, y, h, lean, c0, c1, c2) => { for (let i = 0; i < h; i++) { const u = i / h, xo = Math.round(lean * u * u * 3.4); c.fillStyle = c0; c.fillRect(x + xo, y - i, 1, 1); if (u >= .18 && u < .7) { c.fillStyle = c1; c.fillRect(x + xo + 1, y - i, 1, 1); } if (i === h - 1) { c.fillStyle = c2; c.fillRect(x + xo, y - i, 1, 1); } } };
  const ell2 = (c, x, y, rx, ry, col) => { c.fillStyle = col; for (let j = -Math.ceil(ry); j <= ry; j++) { const w = Math.round(Math.sqrt(Math.max(0, 1 - (j / ry) ** 2)) * rx); c.fillRect(Math.round(x - w), Math.round(y + j), w * 2 + 1, 1); } };
  function meadow(c, t) {
    const RM = rnd(131), T3 = tones3(t), x0 = L.wide ? L.cx0 - 22 : 0, x1 = L.wide ? L.cx1 + 22 : W, fl = L.floor, bandH = H - fl, span = x1 - x0, ph = RM() * 6.28, ph2 = RM() * 6.28;
    const E = L.eggs = { stump: { x: Math.round(x0 + span * (.2 + RM() * .06)), y: Math.round(fl + bandH * .56) }, frog: { x: Math.round(x0 + span * (.64 + RM() * .06)), y: Math.round(fl + bandH * .44) }, eyes: { x: Math.round(x0 + span * (.44 + RM() * .05)), y: Math.round(fl + bandH * .3) } };
    const lgx = Math.round(x0 + span * .82), lgy = Math.round(fl + bandH * .5), clear = (x, y) => Math.hypot((x - E.stump.x) / 21, (y - E.stump.y + 4) / 12) < 1 || Math.hypot((x - lgx) / 16, (y - lgy + 3) / 8) < 1 || Math.hypot((x - E.frog.x) / 11, (y - E.frog.y) / 6) < 1 || Math.hypot((x - E.eyes.x) / 9, (y - E.eyes.y) / 6) < 1;
    E.log = { x: lgx, y: lgy };
    const flowerCols = [PAL.violet[4], PAL.rose[4], PAL.ash[5], PAL.gold[3]].map(cc => mixh(cc, t.fog, .1));
    /* a dark, damp floor with patches of lighter moss */
    for (let i = 0; i < Math.round(span / 7); i++) { const x = x0 + RM() * span, y = fl + 2 + RM() * (bandH - 4); ell2(c, x, y, 3 + RM() * 7, 1 + RM() * 1.8, RM() < .5 ? mixh(t.mossD, t.ground, .4) : mixh(t.moss, t.ground, .5)); }
    /* the log and the stump come first, so the grass can grow over their feet */
    { const lx = Math.round(x0 + span * .82), ly = Math.round(fl + bandH * .5), tc = [t.trunkD, t.trunk, t.trunkL];
      for (let x = -11; x <= 11; x++) { const h = 5 - (Math.abs(x) > 9 ? 1 : 0); for (let j = 0; j < h; j++) { c.fillStyle = j === 0 ? tc[2] : j >= h - 1 ? tc[0] : ((x * 3 + j * 5) % 7 === 0 ? tc[0] : tc[1]); c.fillRect(lx + x, ly - h + j, 1, 1); } }
      ell2(c, lx - 11, ly - 2.5, 1.4, 2.6, mixh(t.trunkL, '#e8d8a8', .3)); ell2(c, lx - 11, ly - 2.5, .6, 1.4, t.trunk);
      for (let x = -9; x <= 7; x++) if ((x * 7) % 3 !== 0) { c.fillStyle = (x & 1) ? t.moss : t.mossL; c.fillRect(lx + x, ly - 6, 1, 1 + ((x * 5) % 2)); }
      [[-3, 7], [1, 5], [5, 8]].forEach(([ox, h], i) => { c.fillStyle = PAL.ash[3]; c.fillRect(lx + ox, ly - 6 - h + 5, 1, 2); c.fillStyle = i === 1 ? PAL.rose[3] : PAL.ash[4]; c.fillRect(lx + ox - 1, ly - 7 - h + 5, 3, 1); }); }
    { const E1 = E.stump, sx = E1.x, sy = E1.y, tc = [t.trunkD, t.trunk, t.trunkL];
      for (let x = -8; x <= 8; x++) { const top = sy - 11 + Math.round(Math.abs(x) * .22); for (let y = top; y <= sy; y++) { c.fillStyle = y === top ? tc[2] : ((x + 20) * 5 % 7 === 0 || x === 8) ? tc[0] : tc[1]; c.fillRect(sx + x, y, 1, 1); } }
      ell2(c, sx, sy - 11, 8, 2.4, mixh(t.trunkL, '#e8d8a8', .3)); ell2(c, sx, sy - 11, 5.5, 1.5, mixh(t.trunk, '#c8b080', .25)); ell2(c, sx, sy - 11, 2.5, .7, mixh(t.trunkL, '#e8d8a8', .3));
      for (let x = -8; x <= -2; x++) { c.fillStyle = t.moss; c.fillRect(sx + x, sy - 11 + Math.round(Math.abs(x) * .22) - (x % 2 ? 1 : 0), 1, 2); c.fillStyle = t.mossL; c.fillRect(sx + x, sy - 12 + Math.round(Math.abs(x) * .22), 1, 1); }
      /* the door: an arch with a warm window, a round window over it, two steps */
      for (let y = -5; y <= 0; y++) for (let x = -2; x <= 2; x++) { if (y === -5 && Math.abs(x) === 2) continue; c.fillStyle = Math.abs(x) === 2 || y === -5 ? PAL.bark[2] : PAL.bark[0]; c.fillRect(sx + x - 1, sy + y, 1, 1); }
      c.fillStyle = PAL.ember[3]; c.fillRect(sx - 1, sy - 3, 1, 2); c.fillStyle = PAL.ember[5]; c.fillRect(sx - 1, sy - 4, 1, 1);
      ell2(c, sx + 4, sy - 6, 1.2, 1.2, PAL.bark[0]); c.fillStyle = PAL.ember[4]; c.fillRect(sx + 4, sy - 6, 1, 1);
      c.fillStyle = PAL.stone[3]; c.fillRect(sx - 3, sy + 1, 4, 1); c.fillStyle = PAL.stone[2]; c.fillRect(sx - 2, sy + 2, 3, 1);
      for (let r = 0; r < 4; r++) { c.fillStyle = tc[0]; c.fillRect(sx + 7 + r, sy - 1 + (r > 1 ? 1 : 0), 2, 1); c.fillRect(sx - 9 - r, sy - 1 + (r > 1 ? 1 : 0), 2, 1); }
      E1.wx = sx - 1; E1.wy = sy - 3; E1.rx = sx + 4; E1.ry = sy - 6;
      /* a lantern on a short post beside it */
      c.fillStyle = PAL.bark[1]; c.fillRect(sx + 11, sy - 7, 1, 8); c.fillStyle = PAL.ember[4]; c.fillRect(sx + 10, sy - 9, 3, 2); c.fillStyle = PAL.ember[6]; c.fillRect(sx + 11, sy - 9, 1, 1); E1.lx = sx + 11; E1.ly = sy - 8; }
    /* a flat mossy stone at the water-damp spot where the frog sits */
    { const F0 = E.frog; ell2(c, F0.x, F0.y + 2, 7.4, 3.3, mixh(t.stoneD, '#000000', .35)); ell2(c, F0.x, F0.y + 1, 7, 3, t.stoneD); ell2(c, F0.x - 1, F0.y, 5, 1.8, t.stone);
      for (let i = -6; i <= 5; i++) if ((i * 5) % 3 !== 0) { c.fillStyle = i & 1 ? t.moss : t.mossL; c.fillRect(F0.x + i, F0.y - 2 + (Math.abs(i) > 4 ? 1 : 0), 1, 1 + ((i * 3) & 1)); } }
    /* stones with moss on top, in threes */
    for (let g = 0; g < 4; g++) { const gx = x0 + 20 + RM() * (span - 40), gy = fl + 6 + RM() * (bandH - 12); if (clear(gx, gy)) continue; [[0, 0, 4.2, 2.6], [5, 1, 2.8, 1.9], [-4, 1, 2, 1.4]].forEach(([ox, oy, rx, ry]) => { ell2(c, gx + ox, gy + oy + 1, rx + .6, ry + .5, mixh(t.stoneD, '#000000', .4)); ell2(c, gx + ox, gy + oy, rx, ry, t.stoneD); ell2(c, gx + ox - 1, gy + oy - .6, rx * .6, ry * .5, t.stone); c.fillStyle = t.stoneL; c.fillRect(Math.round(gx + ox - rx * .4), Math.round(gy + oy - ry * .6), 2, 1); c.fillStyle = t.moss; c.fillRect(Math.round(gx + ox + rx * .2), Math.round(gy + oy - ry), 3, 1); c.fillStyle = t.mossL; c.fillRect(Math.round(gx + ox + rx * .3), Math.round(gy + oy - ry - 1), 1, 1); }); }
    /* the grass, band by band from far to near */
    for (let b = 0; b < 4; b++) {
      const by = fl - 1 + b * bandH / 3.3, kk = b / 3;
      for (let x = x0; x < x1; x += 3 + (RM() * 5 | 0)) {
        const y = Math.round(by + (RM() - .5) * 5), dens = .5 + .5 * Math.sin(x * .08 + ph + b) * Math.sin(x * .031 + ph2 + b * 2);
        if (RM() > .35 + dens * .75) continue;
        const cl = clear(x, y), r0 = RM(), sh = (RM() - .5) * .7, tone = T3[r0 < .32 ? 0 : r0 < .5 ? 1 : r0 < .66 ? 2 : r0 < .83 ? 3 : 4].map(col => { col = sh < 0 ? mixh(col, '#04100c', -sh * .8) : mixh(col, '#e4f6b0', sh * .5); return kk < .4 ? mixh(col, t.fog, .12 * (1 - kk * 2)) : col; }), roll = cl ? RM() * .5 : RM(), hmax = 9 + (RM() * 11 | 0) - Math.round(kk * 3);
        if (roll < .5) { const n = 4 + (RM() * 5 | 0); for (let i = 0; i < n; i++) blade2(c, x + i - (n >> 1) + (RM() * 2 | 0), y, cl ? 3 + (RM() * 2 | 0) : 5 + (RM() * (hmax - 5) | 0), (RM() - .5) * 2.6, tone[i % 2 ? 1 : 0] === tone[1] ? tone[1] : tone[0], i % 3 ? tone[3] : tone[2]); }
        else if (roll < .66) { for (let i = 0; i < 3; i++) leaf2(c, x + i * 2 - 2, y, 7 + (RM() * (hmax - 5) | 0), (i - 1) * 1.2 + (RM() - .5), tone[0], tone[1], tone[3]); }
        else if (roll < .75) { const n = 2 + (RM() * 2 | 0); for (let i = 0; i < n; i++) { const h = 14 + (RM() * 9 | 0), xx = x + i * 2 - 1; for (let j = 0; j < h; j++) put(c, xx, y - j, j > h - 4 ? mixh(PAL.bark[3], t.fog, .15) : tone[1]); put(c, xx, y - h - 1, mixh(PAL.bark[2], t.fog, .1)); put(c, xx, y - h, mixh(PAL.bark[3], t.fog, .1)); put(c, xx + 1, y - h + 1, mixh(PAL.bark[2], t.fog, .1)); } }
        else if (roll < .84) { for (let i = 0; i < 3; i++) frond(c, x + (i - 1), y, 8 + (RM() * 6 | 0), i === 0 ? -1 : 1, i === 1 ? tone[0] : tone[1], tone[3]); }
        else if (roll < .92) { const h = 8 + (RM() * 6 | 0), fc = flowerCols[RM() * 4 | 0]; for (let j = 0; j < h; j++) put(c, x, y - j, tone[1]); for (let j = 2; j < h - 1; j += 2) { put(c, x + (j & 2 ? 1 : -1), y - j, fc); put(c, x + (j & 2 ? 1 : -1), y - j - 1, tone[2]); } put(c, x, y - h, fc); put(c, x, y - h - 1, mixh(fc, '#ffffff', .3)); }
        else { const n = 2 + (RM() * 2 | 0); for (let i = 0; i < n; i++) { const mx = x + i * 4 - 3, h = 2 + (RM() * 3 | 0), cap = [PAL.rose[3], PAL.ash[4], PAL.ember[3]][i % 3]; c.fillStyle = PAL.ash[3]; c.fillRect(mx, y - h, 1, h); c.fillStyle = mixh(cap, t.fog, .08); c.fillRect(mx - 1, y - h - 1, 3, 1); c.fillRect(mx - 1, y - h, 1, 1); c.fillRect(mx + 1, y - h, 1, 1); c.fillStyle = PAL.ash[5]; c.fillRect(mx, y - h - 1, 1, 1); } }
      }
    }
  }
  /* the near grass: dark, sharp and tall along the bottom edge, leaving gaps; taller at the sides of the middle than in it */
  function meadowFront(c, t) {
    const RM = rnd(171), x0 = L.wide ? L.cx0 - 22 : 0, x1 = L.wide ? L.cx1 + 22 : W, T3 = tones3(t);
    for (let x = x0 - 6; x < x1 + 6; x += 3 + (RM() * 6 | 0)) {
      const edge = Math.min(1, Math.min(x - x0, x1 - x) / 40), tone = T3[RM() < .5 ? 2 : RM() < .5 ? 4 : 0].map(col => mixh(col, '#000000', .12 + RM() * .2)), n = 3 + (RM() * 4 | 0), gap = RM() < .22;
      if (gap) continue;
      for (let i = 0; i < n; i++) { const h = 8 + (RM() * (10 + 12 * (1 - edge)) | 0); (RM() < .3 ? leaf2 : blade2)(c, x + i - (n >> 1), H - 1, h, (RM() - .5) * 3, tone[1], tone[2], mixh(tone[2], t.shaft, .35)); }
    }
  }
  /* ---------- squirrels on the back trees: now and then one runs up a far trunk, stops to look about, and comes down again ---------- */
  const SQK = { list: [], next: 0 };
  function squirrel(c, x, y, up, side, ph, m, t, look) {
    /* the trunk is on the -side of the squirrel; the tail arches away from it and up over the head */
    const F = PAL.fur.map(cc => mixh(cc, t.fog, m)), hd = up ? -1 : 1, e = (ex, ey, rx, ry, col) => ell2(c, ex, ey, rx, ry, col), q = (ex, ey, col) => put(c, Math.round(ex), Math.round(ey), col);
    const P0 = [x + side * 1.2, y - hd * 3], P1 = [x + side * 8.5, y - hd * 2.5], P2 = [x + side * 3.2, y + hd * 7.5], pt = u => [(1 - u) * (1 - u) * P0[0] + 2 * u * (1 - u) * P1[0] + u * u * P2[0], (1 - u) * (1 - u) * P0[1] + 2 * u * (1 - u) * P1[1] + u * u * P2[1]];
    for (let i = 0; i <= 10; i++) { const u = i / 10, [tx, ty] = pt(u), r = 1.1 + 1.9 * Math.sin(Math.min(1, u * 1.15) * Math.PI) ; e(tx, ty, r + .9, r + .9, F[0]); }
    for (let i = 0; i <= 10; i++) { const u = i / 10, [tx, ty] = pt(u), r = 1.1 + 1.9 * Math.sin(Math.min(1, u * 1.15) * Math.PI); e(tx, ty, r, r, u > .8 ? F[5] : F[3]); if (u > .15 && u < .85) e(tx + side * -.5, ty, r * .55, r * .6, F[4]); }
    for (let i = 1; i < 10; i += 3) { const [tx, ty] = pt(i / 10); q(tx + side * 1.2, ty, F[2]); }
    e(x, y, 2.4, 3.5, F[0]); e(x, y, 1.6, 2.7, F[3]); e(x - side * .9, y + hd * .5, .7, 1.8, PAL.ash[5]);
    const hx = x - side * .3, hy = y + hd * 4.4; e(hx, hy, 2.5, 2.3, F[0]); e(hx, hy, 1.8, 1.6, F[3]); e(hx - side * .6, hy + hd * .8, .8, .6, PAL.ash[5]);
    q(hx + side * .9, hy + hd * 2.6, F[0]); q(hx + side * 1.4, hy + hd * 3.3, F[0]); q(hx + side * .9, hy + hd * 3.1, F[4]); q(hx - side * 1.4, hy + hd * 2.4, F[0]); q(hx - side * 1.4, hy + hd * 3, F[4]);
    const ex = look ? hx + side * .9 : hx - side * 1; q(ex, hy - hd * .3, PAL.night[0]); q(ex, hy - hd * .3 - hd, PAL.ash[5]); q(hx - side * (look ? 2.4 : 2.6), hy + hd * .6, PAL.night[0]);
    q(x - side * 2.6, y + hd * (1.2 + (ph & 1) * 1.6), F[1]); q(x - side * 2.6, y - hd * (1 + ((ph + 1) & 1) * 1.6), F[1]);
  }
  function climbers(c, f) {
    if (!L.climb || !L.climb.length) return; const t = T;
    if (f > SQK.next && SQK.list.length < 2) { const tr = L.climb[Math.floor(Math.random() * L.climb.length)], up = Math.random() < .7; SQK.list.push({ tr, y: up ? tr.yb : tr.yt, up, side: Math.random() < .5 ? -1 : 1, pause: 0, ph: 0, turns: Math.random() < .5 ? 1 : 0 }); SQK.next = f + (SQQ ? 60 : 110 + Math.random() * 230); }
    SQK.list = SQK.list.filter(s => {
      if (s.pause > 0) s.pause--; else { s.y += (s.up ? -1 : 1) * 1.5; s.ph++; if (Math.random() < .05) s.pause = 5 + (Math.random() * 9 | 0); }
      if (s.up && s.y < s.tr.yt) { if (s.turns > 0) { s.turns--; s.up = false; s.pause = 12; } else return false; }
      if (!s.up && s.y > s.tr.yb) return false;
      const X = Math.round(s.tr.x + s.tr.off(s.tr.base - s.y) + s.side * (s.tr.w / 2 + .5)); squirrel(c, X, Math.round(s.y), s.up, s.side, s.ph, s.tr.k === 1 ? .28 : .12, t, s.pause > 0); return true; });
  }
  /* ---------- lights drifting through the trees at the back, behind the trunks in front ---------- */
  function driftLights(c, f) {
    if (!L.drift) return; const t = T, day = mood === 'day' || mood === 'morning', col = t.fairy;
    c.globalCompositeOperation = 'lighter';
    for (const d of L.drift) { const a = d.ph + f * d.sp, x = Math.round(d.ax + Math.cos(a) * d.rx + Math.sin(a * 2.3) * 3), y = Math.round(d.ay + Math.sin(a * 1.4) * d.ry), br = .55 + .45 * Math.sin(f / d.per + d.ph); spot(c, x, y, d.r + 1, col[d.ci % col.length], (day ? .22 : .5) * br); c.globalAlpha = (day ? .4 : .85) * br; c.fillStyle = col[d.ci % col.length]; c.fillRect(x, y, 1, 1); c.globalAlpha = 1; }
    c.globalCompositeOperation = 'source-over';
  }
  /* ---------- the little things in the meadow ---------- */
  function meadowLife(c, f) {
    const E = L.eggs; if (!E) return; const t = T, ff = f + EGGQ, tg = (m, col) => { };
    /* the stump's window and lantern flicker, and a ring of light drifts up from the door */
    c.globalCompositeOperation = 'lighter'; const S1 = E.stump, fl = .75 + .15 * Math.sin(f * .7) + .1 * Math.sin(f * 1.9);
    spot(c, S1.wx, S1.wy, 6, '#ffc060', .5 * fl); spot(c, S1.rx, S1.ry, 3, '#ffc060', .4 * fl); spot(c, S1.lx, S1.ly, 7, '#ffd890', .45 * fl);
    for (let i = 0; i < 4; i++) { const age = (f * .6 + i * 9) % 36, x = S1.lx + Math.sin(age / 5 + i * 2) * 4, y = S1.ly - age * .5; c.globalAlpha = Math.max(0, .7 - age / 40); c.fillStyle = '#ffe9a8'; c.fillRect(Math.round(x), Math.round(y), 1, 1); } c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    /* the slim squirrel on the meadow floor: now and then it runs in from one side, sits up and looks about, and runs off again */
    { const G = L.sqg || (L.sqg = { mode: 'wait', next: ff + 120 + (Math.random() * 240 | 0), x: 0, n: 0, dir: 1, stop: 0 }), fy = Math.round(L.floor + (H - L.floor) * .62), lo = L.wide ? L.cx0 - 22 : 0, hi = L.wide ? L.cx1 + 22 : W;
      if (G.mode === 'wait' && (ff > G.next || (window.__sqForce && (window.__sqForce = 0, 1)))) { G.dir = Math.random() < .5 ? 1 : -1; G.x = G.dir > 0 ? lo - 14 : hi + 14; G.stop = G.dir > 0 ? lo + 26 + Math.random() * 40 : hi - 26 - Math.random() * 40; G.mode = 'in'; G.n = 0; }
      if (G.mode !== 'wait') { G.n++; let nm = 'idle' + (Math.floor(G.n / 3) % 6);
        if (G.mode === 'in') { G.x += G.dir * 5; nm = 'run' + (G.n % 8); if ((G.x - G.stop) * G.dir >= 0) { G.x = G.stop; G.mode = 'sit'; G.n = 0; } }
        else if (G.mode === 'sit') { nm = 'idle' + (Math.floor(G.n / 3) % 6); if (G.n > 26) { G.mode = 'out'; G.n = 0; } }
        else { G.x -= G.dir * 5; nm = 'run' + (G.n % 8); if (G.x < lo - 20 || G.x > hi + 20) { G.mode = 'wait'; G.next = ff + 600 + (Math.random() * 900 | 0); } }
        if (G.mode !== 'wait') SQP.drawTint(c, nm, G.x, fy, G.mode === 'out' ? G.dir > 0 : G.dir < 0, t.fog, .22); }
    }
    /* a small alien blob (a jelly of violet and teal with one big eye and two glowing feelers): it wanders slowly along the grass by the stone, squashing as it goes, stops to look about and blinks */
    { const F0 = E.frog, ph = ff / 190, sp = Math.sin(ph), mv = Math.abs(Math.cos(ph)) > .3, dir = Math.cos(ph) > 0 ? 1 : -1, bxp = Math.round(F0.x + sp * 13), by0 = F0.y + 1,
        sq = mv ? Math.sin(ff / 3.2) : Math.sin(ff / 14) * .35, rx = 3.8 - sq * .5, ry = 3 + sq * .6, hopY = mv ? Math.abs(Math.sin(ff / 3.2)) * 1.1 : 0, cy = Math.round(by0 - ry - hopY), blink = ff % 95 > 90, look = mv ? dir : (Math.sin(ff / 40) > .5 ? 1 : Math.sin(ff / 40) < -.5 ? -1 : 0),
        d1 = mixh(PAL.violet[1], t.fog, .1), d2 = mixh(PAL.violet[2], t.fog, .1), d3 = mixh(PAL.violet[3], t.fog, .1), hi = mixh(PAL.teal[5], t.fog, .08);
      PXK.halo(c, bxp, cy, 8, PAL.teal[4], .1, .9);
      c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(bxp - 4, by0 + 1, 9, 1);
      ell2(c, bxp, cy + .5, rx + .6, ry + .4, d1); ell2(c, bxp, cy, rx, ry, d2); ell2(c, bxp - .4, cy - .5, rx - .9, ry - .9, d3); ell2(c, bxp - 1.2, cy - ry * .5, rx * .35, ry * .22, hi);
      for (const o of [-2, 0, 2]) put(c, bxp + o, Math.round(cy + ry - .2), mixh(PAL.teal[3], t.fog, .1));
      if (blink) { c.fillStyle = d1; c.fillRect(bxp + look - 1, cy - 1, 3, 1); } else { ell2(c, bxp + look * .6, cy - 1, 1.7, 1.7, mixh(PAL.ash[5], t.fog, .06)); put(c, bxp + look * 1.2 + (look ? 0 : 0), cy - 1, PAL.night[0]); put(c, bxp + look * 1.2, cy - 2, mixh(PAL.ash[5], t.fog, .02)); }
      for (const sd of [-1, 1]) { const sw = Math.round(Math.sin(ff / 9 + sd) * .8), ax = bxp + sd * 2; put(c, ax, cy - Math.round(ry) - 1, d3); put(c, ax + sw, cy - Math.round(ry) - 2, d3); c.globalAlpha = .6 + .4 * Math.sin(ff / 7 + sd * 2); put(c, ax + sw, cy - Math.round(ry) - 3, PAL.gold[4]); c.globalAlpha = 1; } }
    /* a snail crosses the fallen log, a few minutes to the top and back */
    { const lx = E.log.x, ly = E.log.y, cyc = ff % 1400, u = cyc < 700 ? cyc / 700 : 1 - (cyc - 700) / 700, dirn = cyc < 700 ? 1 : -1, sx = Math.round(lx - 8 + u * 15), sy = ly - 6, body = mixh(PAL.ash[5], t.fog, .12), shell = mixh(PAL.bark[3], t.fog, .12);
      for (let i = 0; i < 5; i++) put(c, sx + dirn * (i - 2) - (dirn > 0 ? 0 : 0), sy, i === 4 ? body : mixh(PAL.ash[4], t.fog, .12));
      put(c, sx + dirn * 3, sy - 1, body); put(c, sx + dirn * 3, sy - 2, PAL.ash[3]); put(c, sx + dirn * 4, sy - 2, PAL.ash[3]);
      ell2(c, sx - dirn * .5, sy - 2, 2, 1.8, mixh(PAL.bark[1], t.fog, .12)); ell2(c, sx - dirn * .5, sy - 2, 1.4, 1.3, shell); put(c, sx - dirn * .5, sy - 2, mixh(PAL.gold[3], t.fog, .1)); }
    /* a pair of eyes in the tall grass, blinking, now and then */
    { const E2 = E.eyes, cyc = (ff + 90) % 520; if (cyc < 70) { const blink = cyc > 30 && cyc < 34; c.globalCompositeOperation = 'lighter'; c.fillStyle = '#ffd470'; if (!blink) { c.fillRect(E2.x - 2, E2.y, 1, 2); c.fillRect(E2.x + 2, E2.y, 1, 2); c.globalAlpha = .5; c.fillStyle = '#ffffff'; c.fillRect(E2.x - 2, E2.y, 1, 1); c.fillRect(E2.x + 2, E2.y, 1, 1); c.globalAlpha = 1; } else { c.fillRect(E2.x - 2, E2.y + 1, 1, 1); c.fillRect(E2.x + 2, E2.y + 1, 1, 1); } c.globalCompositeOperation = 'source-over'; const T4 = tones3(t)[2]; for (let i = -4; i <= 4; i += 2) blade2(c, E2.x + i, E2.y + 3, 5 + (i & 3), i * .3, T4[1], T4[3]); } }
  }
  /* ---------- the living layer ---------- */
  function draw() {
    if (!cx || !st) return;
    const c = cx, t = T, f = frame++;
    c.drawImage(sk, 0, 0);
    if (t.stars) for (let i = 0; i < L.stars.length; i += 6) { const s = L.stars[i]; if ((f + i) % 23 < 3) { c.fillStyle = '#ffffff'; c.fillRect(s[0] - 1, s[1], 3, 1); c.fillRect(s[0], s[1] - 1, 1, 3); } }
    c.drawImage(stb, 0, 0);
    flyers(c, f);
    c.drawImage(stb2, 0, 0);
    driftLights(c, f);
    c.drawImage(st, 0, 0);
    const F = L.fall;
    const Lm = LIGHT[mood];
    F.tiers.forEach((tr, ti) => {
      for (let y = tr.y0; y < tr.y1; y++) {
        const ex = F.ex(ti, y), x0 = tr.x + F.off(ti, y) - (ex >> 1), w = tr.w + ex + ((y >> 2) % 3 === 1 ? 1 : 0);
        c.fillStyle = t.water2; c.fillRect(x0, y, w, 1);
        for (let x = 0; x < w; x++) { const p = (((y - (f * 2 - x * 5 + ti * 3)) % 7) + 7) % 7; if (p < 4) { c.fillStyle = p < 2 ? t.foam : t.water; c.fillRect(x0 + x, y, 1, 1); } }
        if ((f + y * 3) % 11 === 0) { c.fillStyle = t.foam; c.fillRect(x0 - 1 + (y & 1) * (w + 1), y, 1, 1); }
      }
      /* spray where each drop lands */
      const ls = F.off(ti, tr.y1 - 1);
      for (let i = 0; i < 6; i++) { const ox = Math.round(Math.sin(f / 3 + i + ti) * (tr.w / 2 + 3)), oy = (f + i * 3) % 4; c.fillStyle = t.foam; c.fillRect(tr.x + ls + tr.w / 2 + ox, tr.y1 - oy, 2, 1); }
    });
    for (const lg of F.ledges) for (let i = 0; i < 3; i++) { const x = lg.x0 + 4 + ((f + i * 11) % Math.max(4, lg.x1 - lg.x0 - 8)); if ((f + i * 2) % 6 < 3) { c.fillStyle = t.foam; c.fillRect(x, lg.y - 1, 2, 1); } }
    const P = L.pool; for (let i = 0; i < 5; i++) { const x = P.x - P.rx + 4 + ((f * 2 + i * 13) % (P.rx * 2 - 8)); if ((f + i) % 5 < 3) { c.fillStyle = t.foam; c.fillRect(x, P.y - 1 + (i % 3), 3, 1); } }
    /* runes on the stones breathe in and out */
    const br = .45 + .45 * Math.sin(f / 9);
    for (const s of L.stones) { const w = Math.max(5, Math.round(s.h * .45)); c.globalAlpha = br * t.glowA * .6; c.fillStyle = t.rune; c.fillRect(s.x + Math.floor(w / 2) - 2, s.y - Math.round(s.h * .55) - 1, 5, 5); c.globalAlpha = 1; }
    const hx = L.hut.x + 22, hy = L.hut.y - 30; c.fillStyle = t.smoke;
    for (let i = 0; i < 5; i++) { const age = (f + i * 9) % 45, yy = hy - age * .6, xx = hx + Math.sin((age + i) / 6) * 2 + age * .12; c.globalAlpha = Math.max(0, .5 - age / 70); const s = 2 + Math.floor(age / 15); c.fillRect(Math.round(xx), Math.round(yy), s, s); }
    c.globalAlpha = 1;
    const pal = { b: mood === 'night' ? '#5a4a46' : '#a8714a', d: mood === 'night' ? '#3e3230' : '#7a4f32', w: '#f1e6d6', k: '#1e1a18', a: '#d9c3a0' };
    for (const d of L.deer) { const up = (f + d.ph) % 64 > 46; grid(c, d.x, d.y, DEER[up ? 0 : 1], pal, d.flip); }
    if (L.stag) stagLife(c, f);
    for (const m of L.mist) { m.x += m.v; if (m.x > W + m.w) m.x = -m.w; c.globalAlpha = t.mist * .7; c.fillStyle = t.fog; c.fillRect(Math.round(m.x), Math.round(m.y), Math.round(m.w), 3); c.fillRect(Math.round(m.x + 6), Math.round(m.y - 2), Math.round(m.w * .6), 2); c.globalAlpha = 1; }
    if (t.dew) for (const d of L.dew) { if ((f + d[2]) % 40 < 2) { c.fillStyle = '#ffffff'; c.fillRect(d[0], d[1], 1, 1); c.globalAlpha = .6; c.fillRect(d[0] - 1, d[1], 3, 1); c.fillRect(d[0], d[1] - 1, 1, 3); c.globalAlpha = 1; } }
    /* light: the sun breathes slowly, the lanterns flicker each in their own time, the waterfall pulses */
    c.globalCompositeOperation = 'screen';
    if (lt.sun && Lm.sunA) { c.globalAlpha = .9 + .1 * Math.sin(f / 15); c.drawImage(lt.sun, 0, 0); }
    c.globalCompositeOperation = 'lighter';
    if (Lm.lamp) {
      c.globalAlpha = 1; c.drawImage(lt.lamp, 0, 0);
      const lc = mood === 'sunset' ? '#ffb070' : '#ffc060';
      for (const l of L.lamps) { const fl = .8 + .12 * Math.sin(f * .8 + l.ph) + .08 * Math.sin(f * 2.1 + l.ph * 3); spot(c, l.x, l.gy, l.gr, lc, .55 * Lm.lamp * fl); }
      const wl = .85 + .1 * Math.sin(f * .7 + 1); spot(c, L.hut.x + 20, L.hut.y - 9, 11, lc, .6 * Lm.lamp * wl);
    }
    if (Lm.wf && lt.wf) {
      c.globalAlpha = .82 + .18 * Math.sin(f / 18); c.drawImage(lt.wf, 0, 0);
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    /* specks of dust turning gold in the main beam */
    if (Lm.sunA) { const S2 = L.sun; c.fillStyle = Lm.sun; for (const d of L.dust) { d.y += .04; if (d.y > L.floor) d.y = L.hut.y - 70; if ((f + d.p) % 24 > 15) continue; const x = S2.bx0 + S2.sk * d.y + d.u * (S2.w / 2 + d.y * .035) + Math.sin((f + d.p) / 13) * 1.5; c.globalAlpha = .55 + .35 * Math.sin((f + d.p) / 4); c.fillRect(Math.round(x), Math.round(d.y), 1, 1); } c.globalAlpha = 1; }
    /* fireflies: slow, soft, each blinking in its own time */
    if (mood === 'night' || mood === 'sunset') { const n = mood === 'night' ? L.flies.length : Math.ceil(L.flies.length / 2.5); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) { const q = L.flies[i]; q.x += q.vx + Math.sin((f + q.p) / 17) * .3; q.y += Math.cos((f + q.p) / 23) * .18; if (q.x < -4) q.x = W + 3; else if (q.x > W + 4) q.x = -3; const b = Math.sin((f + q.p) / q.per); if (b < .15) continue; const k = (b - .15) / .85; spot(c, q.x, q.y, 3, '#d8ff6a', .9 * k); c.globalAlpha = k; c.fillStyle = '#fffbd0'; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    /* fairies: a bright body, beating wings, a halo and a trail of sparkles */
    for (const fy of L.fairies) {
      const a = fy.ph + f * fy.sp, x = Math.round(fy.cx + Math.cos(a) * fy.rx + Math.sin(a * 2.3) * 3), y = Math.round(fy.cy + Math.sin(a * 1.4) * fy.ry), col = t.fairy[fy.c];
      fy.trail.push([x, y]); if (fy.trail.length > 7) fy.trail.shift();
      for (let i = 0; i < fy.trail.length - 1; i++) { if ((f + i) % 2) continue; c.globalAlpha = .12 + i * .07; c.fillStyle = col; c.fillRect(fy.trail[i][0], fy.trail[i][1] + 1, 1, 1); }
      if (Lm.sunA > .6) { const S3 = L.sun, bxy = S3.bx0 + S3.sk * y; if (Math.abs(x - bxy) < S3.w / 2 + y * .035) spot(c, x, y, 7, Lm.sun, .5); }
      glow(c, x, y, 5, col, .9); c.globalAlpha = .7; c.fillStyle = col; c.fillRect(x - 1, y - 1, 3, 3);
      c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(x, y, 2, 2);
      const up = f % 2; c.globalAlpha = .9; c.fillStyle = '#eafcff'; c.fillRect(x - 2, y - 2 - up, 2, 2); c.fillRect(x + 2, y - 2 - up, 2, 2); c.fillRect(x - 3, y - 1, 1, 1); c.fillRect(x + 4, y - 1, 1, 1); c.globalAlpha = 1;
    }
    while (L.motes.length < t.motes) L.motes.push({ x: Math.random() * W, y: L.hz * .5 + Math.random() * (H - L.hz * .5), v: .06 + Math.random() * .18, p: Math.random() * 40, c: t.fairy[Math.floor(Math.random() * t.fairy.length)] });
    for (const m of L.motes) {
      m.y -= m.v; m.x += Math.sin((f + m.p) / 9) * .3; if (m.y < 8) { m.y = H - 2; m.x = Math.random() * W; }
      const tw = (f + m.p) % 30; if (tw > 24) continue;
      c.fillStyle = m.c; c.globalAlpha = .85; c.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      if (tw < 6) { c.globalAlpha = .4; c.fillRect(Math.round(m.x) - 1, Math.round(m.y), 3, 1); c.fillRect(Math.round(m.x), Math.round(m.y) - 1, 1, 3); }
    }
    c.globalAlpha = 1;
    meadowLife(c, f);
    if (L.bokeh) for (const b of L.bokeh) { const a = b.ph + f * b.sp; glow(c, Math.round(b.x + Math.sin(a) * 6), Math.round(b.y + Math.cos(a * .8) * 4), b.r, b.c, .3 + .12 * Math.sin(a * 2)); }
    c.drawImage(vl, 0, 0);
  }
  function paintVeil() {
    const c = vx, bg = getComputedStyle(document.body).backgroundColor || 'rgb(12,26,21)', a0 = LIGHT[mood].veil;
    c.clearRect(0, 0, W, H);
    for (let x = 0; x < W; x++) { const d = L.wide ? Math.min(x - L.cx0, L.cx1 - x) : 99; if (d < -8) continue; const k = L.wide ? Math.min(1, (d + 8) / 16) : 1; c.globalAlpha = a0 * k; c.fillStyle = bg; c.fillRect(x, 0, 1, H); }
    c.globalAlpha = 1;
    /* the words rest less at the very bottom of the page so the meadow shows: six stepped bands are cleared from the scrim */
    c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .1; for (let i = 0; i < 6; i++) c.fillRect(0, Math.round(H * (.72 + i * .035)), W, H); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  /* ---------- on a phone: nothing behind the words ----------
   Two pieces, each built in layers so there is a near and a far to them.
   THE SIGN (top): a limb of the old tree across the top with two ropes, a dark carved board hanging from it, moss over its
   top edge and vines in front of its corners. The board's face is one flat dark panel so the words and buttons stay easy to
   read; all the wood grain lives in the frame around it. It is painted into the header's own background, so it scrolls away with it.
   THE ROCKS (bottom, fixed): far, hazy rocks and ferns behind; a heap of mossy boulders in the middle with an arched hollow
   cut into it exactly around Ask and Help (measured, so it follows any phone), lit from inside and floored with a slab; a
   brook running along the top of the heap, spilling down its face into a stream that crosses the bottom; and in front,
   dark boulders and blades of grass that overlap the ends of the water. Only the water, the foam and a few fireflies move. */
  const PHONE = 720;
  let mode = '', bot = null, bx = null, bst = null, bsx = null, bfg = null, bfx = null, BW = 0, BH = 42, B = null, signRO = null, botRO = null, signKey = '';
  const isPhone = () => false; /* v38.6: phones get the whole scene too (no sign, no rocks strip) */
  const mixh = (a, b, t) => { const A = hex(a), C = hex(b); return '#' + A.map((v, i) => Math.round(v + (C[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const put = (c, x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
  const WOOD = { morning: ['#8a5d39', '#7a5031', '#946543', '#5a3a22', '#33200f'], day: ['#8e603b', '#7d5333', '#9a6a46', '#5c3c23', '#33200f'], sunset: ['#7e4f36', '#6e432d', '#88583d', '#4e3021', '#2c1a0e'], night: ['#4f3a2e', '#443227', '#594236', '#30231b', '#1b130d'] };

  /* ----- the sign ----- */
  function paintSign() {
    const top = document.querySelector('.wrap > .top'); if (!top) return;
    const r = top.getBoundingClientRect(), P = 3, w = Math.max(24, Math.round(r.width / P)), h = Math.max(26, Math.round(r.height / P));
    const key = w + 'x' + h + mood; if (key === signKey) return; signKey = key;
    const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; const g = cv2.getContext('2d'); if (!g) return;
    const t = T, wd = WOOD[mood], R = rnd(5), Z = 6, S = 4, y0 = Z, y1 = h - S;           /* limb zone, shadow zone, the board between */
    /* BACK: the limb across the top, thick at the left and thinning, with its leaves behind the ropes */
    const limb = x => 3 + Math.round((1 - x / w) * 2);
    for (let x = 0; x < w; x++) { const th = limb(x), by = 1 + Math.round(Math.sin(x / 17) * .8); g.fillStyle = t.trunkD; g.fillRect(x, by, 1, th + 1); g.fillStyle = t.trunk; g.fillRect(x, by, 1, th - 1); g.fillStyle = t.trunkL; g.fillRect(x, by, 1, 1); if (R() < .12) { g.fillStyle = t.trunkD; g.fillRect(x, by + 1, 1, 2); } }
    for (let i = 0; i < 9; i++) { const x = Math.floor(R() * w), y = 1 + Math.floor(R() * 3); g.fillStyle = R() < .5 ? t.moss : t.mossD; g.fillRect(x, y, 2 + Math.floor(R() * 3), 1); }
    for (let i = 0; i < Math.round(w / 9); i++) { const x = 2 + Math.floor(R() * (w - 4)), y = 0 + Math.floor(R() * 3); disk(g, x, y, 2, i % 3 ? t.leafD : t.leaf); if (R() < .6) { g.fillStyle = t.mossL; g.fillRect(x - 1, y - 1, 1, 1); } }
    /* ropes: two twisted strands from the limb to the board, with a knot where they meet it */
    for (const rx of [Math.round(w * .17), Math.round(w * .83)]) { for (let y = 3; y <= y0 + 1; y++) { g.fillStyle = y % 2 ? '#c8a874' : '#8c6d44'; g.fillRect(rx, y, 1, 1); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(rx + 1, y, 1, 1); } g.fillStyle = '#d8bc88'; g.fillRect(rx - 1, y0, 3, 2); g.fillStyle = '#7c6038'; g.fillRect(rx - 1, y0 + 1, 3, 1); }
    /* MID: the board. A frame of wood with grain, and inside it one dark flat panel where everything is written */
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(3, y1, w - 6, 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(4, y1 + 2, w - 8, 1);    /* its shadow on the page */
    for (let y = y0; y < y1; y++) { for (let x = 0; x < w; x++) { g.fillStyle = (y - y0) % 5 < 2 ? wd[0] : (y - y0) % 5 < 4 ? wd[1] : wd[3]; g.fillRect(x, y, 1, 1); } }
    for (let i = 0; i < w; i++) { if (R() < .5) { g.fillStyle = R() < .5 ? wd[2] : wd[3]; g.globalAlpha = .5; g.fillRect(i, y0 + Math.floor(R() * (y1 - y0)), 2 + Math.floor(R() * 5), 1); g.globalAlpha = 1; } }
    g.fillStyle = wd[2]; g.fillRect(0, y0, w, 1); g.fillRect(0, y0, 1, y1 - y0);                       /* lit edges, top and left */
    g.fillStyle = wd[4]; g.fillRect(0, y1 - 1, w, 1); g.fillRect(w - 1, y0, 1, y1 - y0);                /* shaded edges, bottom and right */
    const px0 = 3, py0 = y0 + 3, px1 = w - 3, py1 = y1 - 3, plate = mixh(wd[4], '#000000', .15);
    g.fillStyle = plate; g.fillRect(px0, py0, px1 - px0, py1 - py0);
    g.fillStyle = mixh(plate, '#000000', .5); g.fillRect(px0, py0, px1 - px0, 1); g.fillRect(px0, py0, 1, py1 - py0);        /* the panel is sunk into the frame */
    g.fillStyle = mixh(plate, wd[2], .3); g.fillRect(px0, py1 - 1, px1 - px0, 1); g.fillRect(px1 - 1, py0, 1, py1 - py0);
    /* NEAR: round-log ends at the corners, moss over the top edge, vines hanging in front of the frame */
    for (const [x, y] of [[2, y0 + 2], [w - 3, y0 + 2], [2, y1 - 3], [w - 3, y1 - 3]]) { disk(g, x, y, 2, '#c9a273'); g.fillStyle = '#8a643e'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    for (let x = 0; x < w; x++) { const d = R() < .5 ? 1 : R() < .5 ? 2 : R() < .75 ? 3 : 4; for (let k = 0; k < d; k++) { g.fillStyle = k === 0 ? (R() < .4 ? t.mossL : t.moss) : (R() < .5 ? t.mossD : t.moss); g.fillRect(x, y0 - 1 + k, 1, 1); } }
    for (let i = 0; i < Math.round(w / 20); i++) { const x = 5 + Math.floor(R() * (w - 10)); g.fillStyle = i % 2 ? '#f4d6e6' : '#fff4c0'; g.fillRect(x, y0 - 2, 1, 1); g.fillStyle = '#ffffff'; g.fillRect(x + 1, y0 - 2, 1, 1); }
    for (const vx0 of [1, w - 2]) { const dir = vx0 < 8 ? 1 : -1, len = 10 + Math.floor(R() * 5); for (let y = y0; y < y0 + len; y++) { const o = Math.round(Math.sin(y / 2.2 + vx0) * 1); g.fillStyle = t.mossD; g.fillRect(vx0 + o, y, 1, 1); if ((y - y0) % 3 === 1) { g.fillStyle = t.moss; g.fillRect(vx0 + o + dir, y, 1, 1); g.fillStyle = t.mossL; g.fillRect(vx0 + o + dir * 2, y, 1, 1); } } }
    top.style.setProperty('--sign', `url(${cv2.toDataURL()})`);
  }

  /* ----- one boulder: lit from the upper left, shaded rim, cracks, a moss cap. tone > 0 pushes it back into the haze ----- */
  function boulder(c, cx, cy, rx, ry, t, R, o) {
    o = o || {}; const tone = o.tone || 0, dk0 = o.dark || 0;
    const m = col => mixh(tone ? mixh(col, t.fog, tone) : col, '#000000', dk0);
    const base = m(t.stone), dk = m(mixh(t.stoneD, '#000000', .3)), mid = m(mixh(t.stone, t.stoneD, .55)), lt = m(t.stoneL), hi = m(mixh(t.stoneL, '#ffffff', .4));
    const mo = [m(t.moss), m(t.mossD), m(t.mossL)];
    const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1), y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (o.clip && !o.clip(x, y)) continue;
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = nx * nx + ny * ny, wob = (((x * 7 + y * 13) % 5) - 2) * .04;
      if (d > 1 + wob) continue;
      const sh = -(nx * .55 + ny * .85);
      let col = sh > .6 ? hi : sh > .22 ? lt : sh > -.12 ? base : sh > -.5 ? mid : dk;
      if (d > .74) col = sh > .5 ? mid : dk;               /* a dark outline all round, so every stone reads as its own */
      else if (d > .6 && sh < -.2) col = dk;
      else if (R() < .025) col = R() < .5 ? dk : lt;
      put(c, x, y, col);
    }
    if (!o.clip && R() < .7) { let px = cx + (R() - .5) * rx, py = cy - ry * .3; for (let i = 0, n = Math.round(ry * .9); i < n; i++) { px += (R() - .45) * 1.3; py += .9; put(c, Math.round(px), Math.round(py), dk); } }
    if (o.moss !== false && (o.moss === true || R() < .4)) for (let x = x0; x <= x1; x++) {
      const nx = (x + .5 - cx) / rx; if (Math.abs(nx) > .8) continue;
      const topY = Math.round(cy - ry * Math.sqrt(Math.max(0, 1 - nx * nx))) + 1, depth = 1 + (R() < .35 ? 1 : 0) + (R() < .08 ? 2 : 0);
      for (let k = 0; k < depth; k++) { if (o.clip && !o.clip(x, topY + k)) continue; put(c, x, topY + k, k === 0 ? (R() < .25 ? mo[2] : mo[0]) : mo[1]); }
    }
  }
  function layoutBot() {
    const P = 3; BW = Math.ceil(innerWidth / P); BH = 42;
    const top = innerHeight - BH * P, yF = BH - 8, R = rnd(9);
    const rect = id => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return r.width > 10 ? r : null; };
    const rs = [rect('askBtn'), rect('helpBtn')].filter(Boolean); let hy0, niches;
    /* one niche per button, a stride of stone round each: two units of air at the sides, three above */
    if (rs.length) {
      hy0 = Math.max(6, Math.floor((Math.min.apply(null, rs.map(r => r.top)) - top) / P) - 3);
      niches = rs.map(r => { const x0 = Math.max(3, Math.floor(r.left / P) - 2), x1 = Math.min(BW - 3, Math.ceil(r.right / P) + 2); return { x0, x1, rr: Math.max(3, Math.min(10, Math.floor((x1 - x0) / 2.2), Math.floor((yF - hy0) / 2))) }; });
    } else { hy0 = yF - 20; niches = [{ x0: BW - 70, x1: BW - 46, rr: 10 }, { x0: BW - 38, x1: BW - 5, rr: 10 }]; }
    const hx0 = Math.min.apply(null, niches.map(n => n.x0)), hx1 = Math.max.apply(null, niches.map(n => n.x1));
    B = { yF, hy0, niches, hx0, hx1, flies: [] };
    /* the skyline of the heap: tall around the niches, lumpy everywhere (never a straight line), falling away to either side */
    B.mtop = x => { const out = x < hx0 ? hx0 - x : x > hx1 ? x - hx1 : 0, k = Math.max(0, 1 - out / 22), e = k * k * (3 - 2 * k); const lumps = Math.sin(x / 2.7) * 1.3 + Math.sin(x / 6.3 + 1.3) * 2.1 + Math.sin(x / 12.1 + .4) * 2.8; return Math.max(4, Math.round(BH - 17 - e * (BH - 17 - (hy0 - 9)) + lumps * (.6 + .8 * e))); };
    B.hollow = (x, y) => {
      if (y < hy0 || y >= yF) return false;
      for (const n of niches) { if (x < n.x0 || x > n.x1) continue; const q = y - hy0; if (q >= n.rr) return true; const dx = n.rr - Math.sqrt(Math.max(0, n.rr * n.rr - (n.rr - q) * (n.rr - q))); if (x >= n.x0 + dx && x <= n.x1 - dx) return true; }
      return false;
    };
    B.cx = hx0 > 40 ? Math.min(hx0 - 16, 30) : 0;                  /* where the brook leaves the heap, if there is room left of the niches */
    for (let i = 0; i < 6; i++) { const n = niches[i % niches.length]; B.flies.push({ cx: n.x0 + (n.x1 - n.x0) * (.15 + R() * .7), cy: hy0 + 4 + R() * (yF - hy0 - 8), rx: 3 + R() * 5, ry: 1 + R() * 3, sp: .035 + R() * .04, ph: R() * 6.28, c: i % 4 }); }
  }
  function paintBot() {
    const c = bsx, t = T, R = rnd(13), { yF, hy0, hx0, hx1, niches } = B, clipOut = (x, y) => !B.hollow(x, y);
    c.clearRect(0, 0, BW, BH);
    /* FAR: a hazy wall of rock behind everything, a little higher than the heap, with ferns on its crest */
    const farTop = x => Math.max(2, B.mtop(x) - 5 - Math.round(Math.sin(x / 5 + 2) * 1.5));
    for (let x = 0; x < BW; x++) for (let y = farTop(x); y < BH; y++) put(c, x, y, mixh(mixh(t.stoneD, t.fog, .5), t.far[1], .25));
    for (let i = 0, n = Math.round(BW / 8); i < n; i++) { const x = Math.round((i + R() * .8) * 8), rx = 3.5 + R() * 3, cy = Math.max(rx * .75 + 2, farTop(x) + rx * .6 + R() * 3); boulder(c, x, cy, rx, rx * .75, t, R, { tone: .6, moss: true }); }
    for (let x = 1; x < BW; x += 3 + Math.floor(R() * 4)) { const y = farTop(x) + 2, col = mixh(t.mossD, t.fog, .45); put(c, x, y - 3, col); put(c, x - 1, y - 2, col); put(c, x + 1, y - 2, col); put(c, x, y - 2, col); put(c, x - 2, y - 1, col); put(c, x + 2, y - 1, col); }
    /* MID: the heap. Dark crevices first, then boulders row by row so the nearer ones overlap the farther ones */
    for (let x = 0; x < BW; x++) for (let y = B.mtop(x); y < BH; y++) put(c, x, y, mixh(t.stoneD, '#000000', .6));
    for (let yy = 0; yy < BH + 6; yy += 4) {
      let x = -6 + R() * 4;
      while (x < BW + 8) { const rx = 4.5 + R() * 4, ry = rx * (.72 + R() * .15), cy = yy + R() * 2; if (cy - ry * .75 >= B.mtop(Math.round(x)) - 1.5 && cy - ry < BH) boulder(c, x, cy, rx, ry, t, R); x += rx * 1.45 + R() * 2.5; }
    }
    /* a crown of bigger stones on top, of different sizes and set at different heights, so the skyline is made of rocks and not a line */
    for (let x = 2 + R() * 6; x < BW; x += 9 + R() * 12) { const rx = 3.5 + R() * 4.5, ry = rx * (.7 + R() * .25), cy = Math.max(ry + 2, B.mtop(Math.round(x)) + ry * (.1 + R() * .5)); boulder(c, x, cy, rx, ry, t, R, { moss: R() < .55 }); }
    /* the niches: cut out, then made into rooms: a back wall, dim stones, a glow, a mossy ceiling */
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
    for (let y = hy0; y < yF; y++) for (let x = hx0; x <= hx1; x++) if (B.hollow(x, y)) c.fillRect(x, y, 1, 1);
    c.globalCompositeOperation = 'source-over';
    const wall = mixh(t.groundD, '#000000', .85), wallLo = mixh(t.groundD, '#000000', .6);
    for (let y = hy0; y < yF; y++) for (let x = hx0; x <= hx1; x++) if (B.hollow(x, y)) put(c, x, y, mixh(wall, wallLo, (y - hy0) / (yF - hy0)));
    for (const n of niches) {
      const w = n.x1 - n.x0;
      for (let i = 0, k = Math.max(2, Math.round(w / 9)); i < k; i++) boulder(c, n.x0 + 3 + R() * (w - 6), yF - 3 - R() * 5, 2.6 + R() * 2.4, 2.4 + R() * 1.6, t, R, { tone: .5, dark: .35, clip: B.hollow });
      const gc = t.lit > .3 ? t.win : t.fairy[1], ga = t.lit > .3 ? .55 : .34, gx = (n.x0 + n.x1) / 2, gy = yF - 6, gr = w * .7;
      for (let y = hy0; y < yF; y++) for (let x = n.x0; x <= n.x1; x++) { if (!B.hollow(x, y)) continue; const d = Math.hypot((x - gx) / gr, (y - gy) / (gr * .6)); if (d >= 1) continue; c.globalAlpha = ga * (1 - d) * (1 - d); put(c, x, y, gc); }
      c.globalAlpha = 1;
    }
    /* the frame: stones set round each opening like an arch (a keystone on top, blocks down the sides), clipped to the opening */
    for (const n of niches) {
      const cxA = (n.x0 + n.x1) / 2, topY = x => { let y = hy0; while (y < yF && !B.hollow(x, y)) y++; return y; };
      for (let x = n.x0 + 1; x < n.x1; x += (x < n.x0 + n.rr || x > n.x1 - n.rr) ? 3 : 5) { const y = topY(Math.round(x)); if (y >= yF) continue; boulder(c, x, y - 2.2 - R() * .8, 3.6 + R() * 1.4, 3 + R() * .8, t, R, { clip: clipOut, moss: R() < .3 }); }
      boulder(c, cxA, topY(Math.round(cxA)) - 3.2, 5.6, 4.3, t, R, { clip: clipOut, moss: false });
      for (const sx of [n.x0 - 2.2, n.x1 + 2.2]) for (let y = yF - 2.5; y > hy0 + n.rr - 1; y -= 5.5) boulder(c, sx + (R() - .5), y, 3 + R() * .8, 3.2 + R() * .6, t, R, { clip: clipOut, moss: R() < .25 });
    }
    /* the edge of every opening: a dark inner rim, so it reads as depth rather than a hole cut in a picture */
    for (let y = hy0; y < yF; y++) for (let x = hx0; x <= hx1; x++) { if (!B.hollow(x, y)) continue; if (!B.hollow(x - 1, y) || !B.hollow(x + 1, y) || !B.hollow(x, y - 1)) { c.globalAlpha = .75; put(c, x, y, '#06100c'); c.globalAlpha = 1; } }
    for (let x = hx0; x <= hx1; x++) { let y = hy0; while (y < yF && !B.hollow(x, y)) y++; if (y >= yF) continue; const len = 1 + Math.floor(R() * 3) + (R() < .2 ? 3 : 0); for (let k = 0; k < len; k++) put(c, x, y + 1 + k, k === len - 1 && R() < .5 ? t.mossL : (R() < .5 ? t.moss : t.mossD)); }
    for (const n of niches) {
      const gx = (n.x0 + n.x1) / 2;
      for (const fx of [n.x0 + 3, n.x1 - 3]) { fern(c, fx, yF - 1, t, R); fern(c, fx + (fx < gx ? 3 : -3), yF - 1, t, R); }
      for (const mx of [n.x0 + 6, Math.round(gx), n.x1 - 6]) { const col = mood === 'night' ? '#7affd8' : '#f0a8c8'; c.globalAlpha = .5; put(c, mx - 1, yF - 3, col); put(c, mx + 1, yF - 3, col); c.globalAlpha = 1; put(c, mx, yF - 2, '#efe6d6'); put(c, mx, yF - 3, col); put(c, mx - 1, yF - 4, col); put(c, mx, yF - 4, col); put(c, mx + 1, yF - 4, col); }
    }
    /* the slab the buttons stand on: lit top, shaded front, moss at its feet */
    for (let x = hx0 - 3; x <= hx1 + 3; x++) { put(c, x, yF, mixh(t.stoneL, '#ffffff', .15)); put(c, x, yF + 1, t.stone); }
    for (let x = hx0 - 3; x <= hx1 + 3; x++) if (!B.hollow(x, yF - 1) ? false : R() < .5) put(c, x, yF - 1, R() < .5 ? t.moss : t.mossD);
    for (let x = hx0 - 3; x <= hx1 + 3; x += 2) if (R() < .5) put(c, x, yF + 2, mixh(t.stoneD, '#000000', .3));
    /* the crest of the heap: tufts of grass, a few small flowers, ivy hanging over the arches */
    for (let x = 1; x < BW - 1; x++) { if (R() < .55) continue; const y = B.mtop(x), n = 1 + Math.floor(R() * 2); for (let k = 1; k <= n; k++) put(c, x, y - k, k === n ? t.moss : t.mossD); if (R() < .06) put(c, x, y - n - 1, ['#f4d6e6', '#fff4c0', '#d8c8ff'][Math.floor(R() * 3)]); }
    /* the stream's bed across the bottom, under the slab */
    for (let y = yF + 2; y < BH - 1; y++) for (let x = 0; x < BW; x++) put(c, x, y, mixh(mixh(t.water2, t.groundD, .55), '#000000', (y - yF - 2) * .03));
    for (let x = 0; x < BW; x++) { put(c, x, BH - 1, mixh(t.stoneD, '#000000', .35)); if (R() < .3) put(c, x, BH - 1, mixh(t.stone, '#000000', .3)); }
  }
  /* the nearest layer: dark boulders and grass that overlap the ends of the water. Painted separately so the moving water goes under it. */
  function paintFg() {
    const c = bfx, t = T, R = rnd(17), { yF } = B; c.clearRect(0, 0, BW, BH);
    boulder(c, 1, BH - 9, 13, 10, t, R, { dark: .22 }); boulder(c, 17, BH - 3, 7, 4.5, t, R, { dark: .2 });
    boulder(c, BW - 2, BH - 3, 10, 4.8, t, R, { dark: .2, moss: true }); boulder(c, BW - 16, BH - 1, 6, 3, t, R, { dark: .2 });
    for (let x = 0; x < BW; x++) { if (R() < .5) continue; const n = 2 + Math.floor(R() * 3), lean = R() < .5 ? -1 : 1; for (let k = 0; k < n; k++) { const col = k === n - 1 ? mixh(t.mossL, '#000000', .1) : (R() < .5 ? mixh(t.moss, '#000000', .25) : mixh(t.mossD, '#000000', .1)); put(c, x + (k > 1 ? lean : 0), BH - 1 - k, col); } }
    for (const fx of [5, 24, BW - 7]) { for (let k = 0; k < 7; k++) { const col = k > 4 ? t.mossL : k > 2 ? t.moss : t.mossD; put(c, fx - Math.round(k * .6), BH - 5 - k, col); put(c, fx + Math.round(k * .6), BH - 5 - k, col); } put(c, fx, BH - 5, t.mossD); }
  }
  function drawBot() {
    if (!bx || !bst || !B) return;
    const c = bx, t = T, f = frame++, { yF, hx0, hx1 } = B, y0 = yF + 2, y1 = BH - 1;
    c.drawImage(bst, 0, 0);
    /* the brook along the crest of the heap, spilling down its face where the ridge ends */
    if (B.cx) {
      const cx = B.cx, top = B.mtop(cx);
      for (let x = 0; x <= cx + 3; x++) { const y = B.mtop(x) - 1; put(c, x, y - 1, mixh(t.water, t.water2, .4)); put(c, x, y, ((x + f) % 7 < 3) ? t.foam : t.water); put(c, x, y + 1, t.water2); }
      for (let x = -1; x < 4; x++) { for (let y = top; y < y0; y++) { const o = ((f * 2 + y + x * 3) % 6); put(c, cx + x, y, x === -1 || x === 3 ? t.water2 : o < 2 ? t.foam : o < 4 ? t.water : t.water2); } }
      for (let i = 0; i < 9; i++) { const a = (f * 1.2 + i * 7) % 12, sx = cx + 1 + Math.round((i % 2 ? 1 : -1) * (a * .6 + 1)), sy = y0 - 1 - Math.round(Math.sin(a / 12 * 3.14) * 4); if (a < 11) put(c, sx, sy, t.foam); }
    }
    /* the stream: slides to the right, brighter where it is shallow, darker in the slab's shadow */
    for (let y = y0; y < y1; y++) {
      const rowI = y - y0; c.fillStyle = rowI === 0 ? mixh(t.water2, '#000000', .35) : rowI === 1 ? mixh(t.water2, '#000000', .12) : t.water2; c.fillRect(0, y, BW, 1);
      if (rowI > 0) { const sp = 1 + (rowI % 2), off = (f * sp + rowI * 7) % 13; for (let x = off - 13; x < BW; x += 13) { c.fillStyle = rowI === 2 ? t.water : mixh(t.water, t.water2, .35); c.fillRect(x, y, 3 + (rowI % 2), 1); } }
    }
    for (let i = 0; i < 12; i++) { const x = (i * 11 + f * 2) % BW, y = y0 + 1 + (i % 3); if ((f + i) % 6 < 2) put(c, x, y, t.foam); }
    c.drawImage(bfg, 0, 0);
    for (const fy of B.flies) { const a = fy.ph + f * fy.sp, x = Math.round(fy.cx + Math.cos(a) * fy.rx), y = Math.round(fy.cy + Math.sin(a * 1.3) * fy.ry), col = t.fairy[fy.c]; glow(c, x, y, 3, col, .85); put(c, x, y, '#ffffff'); }
  }
  function buildPhone() {
    if (!bot) return;
    layoutBot(); mood = pickMood(); T = TOD[mood]; document.documentElement.dataset.tod = mood;
    for (const k of [bot, bst, bfg]) { k.width = BW; k.height = BH; }
    bot.style.width = BW * 3 + 'px'; bot.style.height = BH * 3 + 'px';
    paintBot(); paintFg(); drawBot(); signKey = ''; paintSign();
  }
  function startPhone() {
    bot = document.createElement('canvas'); bot.id = 'sceneBot'; bot.setAttribute('aria-hidden', 'true');
    bx = bot.getContext('2d'); bst = document.createElement('canvas'); bsx = bst.getContext('2d'); bfg = document.createElement('canvas'); bfx = bfg.getContext('2d');
    if (!bx || !bsx || !bfx) { bot = null; return; }
    document.body.append(bot); document.body.classList.add('scene-phone');
    buildPhone(); loop();
    const top = document.querySelector('.wrap > .top');
    if (top && window.ResizeObserver) { signRO = new ResizeObserver(() => paintSign()); signRO.observe(top); }
    /* the hollow follows the buttons: when they change size, the rocks are rebuilt around them */
    const row = document.querySelector('.help-row'); if (row && window.ResizeObserver) { botRO = new ResizeObserver(() => { if (bot) { layoutBot(); paintBot(); paintFg(); drawBot(); } }); botRO.observe(row); }
  }
  function stopPhone() {
    if (signRO) signRO.disconnect(); signRO = null; if (botRO) botRO.disconnect(); botRO = null;
    if (bot) bot.remove(); bot = null; bx = null; document.body.classList.remove('scene-phone');
    const top = document.querySelector('.wrap > .top'); if (top) top.style.removeProperty('--sign'); signKey = '';
  }
  function build() {
    if (!cv) return;
    layout(); cv.width = W; cv.height = H; cv.style.width = W * PX + 'px'; cv.style.height = H * PX + 'px';
    sk.width = W; sk.height = H; st.width = W; st.height = H; vl.width = W; vl.height = H; mood = pickMood(); T = TOD[mood]; document.documentElement.dataset.tod = mood;
    paint(); paintLights(); paintVeil(); draw();
  }
  function loop() { clearTimeout(timer); if (still || document.hidden || !(cv || bot)) return; if (bot) drawBot(); else draw(); timer = setTimeout(loop, 166); }
  let rsT = 0;
  function start() {
    if (cv || bot || !on()) return;
    still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    mode = isPhone() ? 'phone' : 'wide'; if (mode === 'phone') { startPhone(); return; }
    cv = document.createElement('canvas'); cv.id = 'scene'; cv.setAttribute('aria-hidden', 'true');
    cx = cv.getContext('2d'); sk = document.createElement('canvas'); skx = sk.getContext('2d'); stb = document.createElement('canvas'); stb2 = document.createElement('canvas'); st = document.createElement('canvas'); sx = st.getContext('2d'); vl = document.createElement('canvas'); vx = vl.getContext('2d');
    if (!cx || !skx || !sx || !vx) { cv = null; return; }
    document.body.prepend(cv); document.body.classList.add('scene-on');
    /* v38.17: the forest is painted in its own task, after the page's first work, so startup never holds the main thread for one long stretch */
    const mine = cv; setTimeout(() => { if (cv === mine) { build(); loop(); } }, 0);
  }
  function stop() { clearTimeout(timer); stopPhone(); if (cv) cv.remove(); cv = null; document.body.classList.remove('scene-on'); delete document.documentElement.dataset.tod; }
  addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { if (!cv && !bot) return; if ((isPhone() ? 'phone' : 'wide') !== mode) { stop(); start(); } else if (bot) buildPhone(); else build(); }, 200); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && (cv || bot)) { if (pickMood() !== mood) (bot ? buildPhone() : build()); loop(); } });
  setInterval(() => { if ((cv || bot) && !document.hidden && pickMood() !== mood) (bot ? buildPhone() : build()); }, 60000);
  if (/[?&]scenetest\b/.test(location.search)) window.__scene = { squirrel: (c, x, y, up, side, ph, m, look) => squirrel(c, x, y, up, side, ph, m, T, look), dragon: (c, x, y, f, dir, night) => dragon(c, x, y, f, dir, night), get: () => ({ L, W, H, PX, mood }) };
  return { progress() { }, flare() { }, look(m) { m = m || ''; if (m === look) return; look = m; if (cv) build(); else if (bot) buildPhone(); }, start, stop, sync: () => (on() ? (cv ? build() : bot ? buildPhone() : start()) : stop()), mood: () => mood, set(v) { if (v) delete S.ui.scene; else S.ui.scene = false; persist(); this.sync(); }, on };
})();
