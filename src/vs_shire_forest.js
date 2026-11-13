/* ---------- The Green: a root cellar where the garden is alive ----------
   Push through the roots and you are in a round burrow under a hill. A shaft of daylight comes through a round door in the back wall and falls on a root garden;
   the Heart Tree stands on the right with its trunk running up into the ceiling and a hollow in it that glows. The burrow you are building is on the left, a larder
   is dug into the wall beside it. A mouse tends the beds, a mole carries water up from the brook, a rabbit brings apples to the larder, and the old hedgehog sits by the
   tree and talks to whoever comes by. Light sprites from the Tree's hollow wake a plant or feed an animal. Mushrooms in the dark corners cycle through colours.
   The psychedelic part: the Heart Tree's rings turn in its hollow, the spore mushrooms drift through the spectrum, and the butterfly's wings are small mandalas. */
(() => {
  const { mix, rnd, hsh, px, rect, disk, ell, vgrad, hazeBottom, haze, crown, cloud } = VG, P = NK2.PSY;
  const SKY = { morning: ['#9ad0e8', '#d8ecdc', '#ffe8c0', '#fff4d8'], day: ['#5ab4f0', '#92d0f4', '#cae8f0', '#eef6dc'], sunset: ['#4a4a9a', '#c0709a', '#f4a468', '#ffd890'], night: ['#060e2a', '#0e204a', '#1a3860', '#2a4a70'] };
  const FOG = { morning: '#e0ecd8', day: '#cbe6e4', sunset: '#e8a898', night: '#1a2e56' };
  const RAMPS = {
    hedge: ['#124a2c', '#1e7a3a', '#3ea048', '#7ad060'], grass: ['#2f6a34', '#4a8a3c', '#6aaa48', '#98cc58'], bark: ['#2a1e1c', '#5a3e2e', '#8a6444', '#c09868'], wood: ['#3a281c', '#6a4a30', '#a07848', '#d0aa70'],
    stone: ['#4e5a64', '#8a98a0', '#c0cac8', '#e8f0ee'], soil: ['#3a2a20', '#5a4030', '#7a5a3c', '#9a7a50'], water: ['#1a4a8a', '#3a82c8', '#78bef0', '#c8f0ff'], thatch: ['#6a4a1c', '#b88a38', '#e8c460', '#fff0a0'],
    wall: ['#5a4232', '#725640', '#8c6a4a', '#a8855a', '#c4a26e'], floor: ['#356a34', '#46853a', '#5a9c42', '#74b44c', '#92cc5c'], ring: ['#080706', '#130f0c', '#201813', '#38291d'], moss: ['#1e4a2a', '#2e7a3a', '#52a84a', '#8ad060'], door: ['#6a5238', '#8a6a46', '#b08a58'],
  };
  const GREEN = ['#0f5a2a', '#1f8a3a', '#3aaa4a', '#6ad25a', '#a8f070', '#e8ffb0'];
  const CLOTH = [['#6a2a22', '#c0553a', '#f09a62'], ['#22407a', '#4a78c0', '#8ab4f0'], ['#7a5a14', '#d4a030', '#f8d870'], ['#4a2a6a', '#8a5ac0', '#c8a4f0']];
  const FUR = { mouse: ['#3a2c28', '#7a6458', '#aa9080', '#d8c4b0'], mole: ['#2a2836', '#4a4858', '#6e6c82', '#9896ae'], hog: ['#2a1e18', '#5a4234', '#8a6a52', '#bc9a78'], rabbit: ['#5a4a3e', '#9a8472', '#c8b49e', '#efe2d0'], toad: ['#16402a', '#2e7a3e', '#58a850', '#98d070'] };

  function sky(c, g, T, L) {
    const R = rnd(5), hz = L.hz; vgrad(c, g.x0, g.x1, g.y0, g.y1, [T.sky[0], T.sky[1], T.sky[2], T.sky[3]]);
    if (T.mood === 'night') { for (let i = 0; i < 90; i++) px(c, g.x0 + Math.floor(R() * (g.x1 - g.x0)), g.y0 + Math.floor(R() * hz * 1.1), R() > .85 ? '#ffffff' : '#8fa4d8'); disk(c, L.cx + 18, 34, 7, '#f4f2dc'); disk(c, L.cx + 21, 32, 6, T.sky[1]); P.ribbons(c, 0, g.x0, g.x1, 18, 6, 3, { a: .35, gap: 6, len: 30, th: 3, l: .55 }); }
    else if (T.mood === 'sunset') { disk(c, L.cx - 8, hz - 4, 8, '#fff0b0'); disk(c, L.cx - 8, hz - 4, 5, '#ffffe0'); }
    else { disk(c, L.cx - 8, 40, 6, '#fffbe4'); disk(c, L.cx - 8, 40, 4, '#ffffff'); }
    for (let i = 0; i < 6; i++) cloud(c, L.cx - 70 + i * 28 + Math.floor(R() * 10), Math.round(L.hz * (.35 + R() * .5)), 28 + Math.floor(R() * 24), 5 + Math.floor(R() * 4), T.cloud, R);
  }
  function far(c, g, T, L) {
    const R = rnd(3), fog = T.fog, base = L.hz + 22, yf = x => base - 14 * (Math.sin(x / 34 + .8) * .5 + Math.sin(x / 15 + 2) * .25 + .6), z = .55;
    for (let x = g.x0; x < g.x1; x++) { const ry = Math.round(yf(x)); for (let y = ry; y < g.y1; y++) { const band = Math.floor((y - ry) / 5), cell = Math.floor((x + band * 7) / (10 + band * 3)); const cols = [T.grass[1], T.grass[2], T.thatch[1], T.grass[0], T.grass[2]]; c.fillStyle = haze(y - ry < 1 ? T.grass[3] : cols[(((band * 3 + cell) % 5) + 5) % 5], fog, z); c.fillRect(x, y, 1, 1); } }
    for (let x = g.x0 + 6; x < g.x1; x += 7 + Math.floor(R() * 9)) crown(c, x, Math.round(yf(x)) + 1, 3 + Math.floor(R() * 2), haze_(T.hedge, fog, z + .05).slice(0, 3), R);
    hazeBottom(c, g.x0, g.x1, L.hz - 6, L.hz + 34, fog, 0, .8);
  }
  const haze_ = (K, fog, z) => K.map(c => haze(c, fog, z));

  /* ---- the burrow you build, 8 stages ---- */
  function burrow(c, x, base, st, T, L) {
    const hx = x + 22, hw = 24, hh = 31, wd = T.wood, E = T.soil, G = T.grass, S = T.stone;
    NK.shadow(c, hx, base, hw + 3, .3);
    if (st === 0) {
      for (const sx of [x + 3, x + 41]) { rect(c, sx, base - 9, 1, 9, wd[1]); px(c, sx, base - 10, T.thatch[3]); } rect(c, x + 3, base - 8, 39, 1, wd[3]);
      for (let i = 0; i < 40; i += 2) px(c, x + 3 + i, base - 1 - (hsh(i, 2, 3) < .5 ? 0 : 1), E[3]); ell(c, hx, base - 2, 12, 3, E[2]); ell(c, hx - 2, base - 3, 9, 2, E[3]);
      rect(c, x + 33, base - 12, 1, 12, wd[1]); rect(c, x + 31, base - 14, 5, 3, S[1]); rect(c, x + 31, base - 14, 5, 1, S[3]); return;
    }
    /* the hill: turf over earth */
    for (let dy = 0; dy < hh; dy++) { const w = Math.round(hw * Math.sqrt(1 - Math.pow(dy / (hh + 2), 2))); for (let xx = -w; xx <= w; xx++) { const turf = dy > hh - 5 - Math.round(Math.sin((xx + 9) / 3) * .8), k = turf ? (hsh(xx, dy, 2) < .3 ? G[3] : G[2]) : hsh(xx, dy, 5) < .15 ? E[1] : E[2]; px(c, hx + xx, base - dy, dy === hh - 1 || (turf && dy === hh - 5 + 0) ? G[3] : k); } }
    for (let xx = -hw + 4; xx < hw - 3; xx += 3) if (hsh(xx, 1, 8) < .6) { px(c, hx + xx, base - hh + 1, G[3]); px(c, hx + xx + 1, base - hh, G[3]); }
    for (let i = 0; i < 44; i += 5) { rect(c, x + i, base - 4, 5, 4, i % 10 ? S[1] : S[2]); px(c, x + i, base - 4, S[3]); rect(c, x + i, base - 1, 5, 1, S[0]); }
    const dr = 12, dcy = base - dr - 3;
    /* the round doorway: dug out, dark, with a warm back wall once it is framed */
    for (let yy = -dr; yy <= dr; yy++) { const w = Math.round(Math.sqrt(dr * dr - yy * yy)); if (dcy + yy > base - 4) continue; rect(c, hx - w, dcy + yy, w * 2, 1, st >= 3 ? '#3a2410' : '#140a06'); }
    if (st === 1) return;
    for (let a = 0; a < 80; a++) { const an = a / 80 * 6.283, rr = dr + 1; for (let k = 0; k < 3; k++) { const xx = Math.round(hx + Math.cos(an) * (rr + k)), yy = Math.round(dcy + Math.sin(an) * (rr + k)); if (yy > base - 4) continue; px(c, xx, yy, k === 0 ? wd[3] : k === 1 ? wd[2] : wd[1]); } }
    if (st === 2) return;
    for (let yy = -dr + 3; yy <= dr; yy++) { const w = Math.round(Math.sqrt(Math.max(0, (dr - 1) * (dr - 1) - yy * yy))); if (dcy + yy > base - 4) continue; for (let k = 0; k < w * 2; k += 1) px(c, hx - w + k, dcy + yy, hsh(k, yy, 1) < .12 ? '#2a1a0c' : '#4a3018'); }
    rect(c, hx - 9, base - 5, 18, 1, wd[2]);
    if (st === 3) return;
    const closed = st < 7, doorCol = st >= 5 ? ['#1a4a22', '#2e8a3a', '#58b850'] : [wd[0], wd[1], wd[2]];
    if (closed) for (let yy = -dr + 1; yy <= dr - 1; yy++) { const w = Math.round(Math.sqrt((dr - 1) * (dr - 1) - yy * yy)); if (dcy + yy > base - 5) continue; for (let k = -w; k < w; k++) px(c, hx + k, dcy + yy, (k + w) % 4 === 0 ? doorCol[0] : (k + w) % 4 === 1 ? doorCol[2] : doorCol[1]); }
    else for (let yy = -dr + 1; yy <= dr - 1; yy++) { const w = Math.round(Math.sqrt((dr - 1) * (dr - 1) - yy * yy)); for (let k = -w; k < -w + 4; k++) px(c, hx + k, dcy + yy, doorCol[1 + (k & 1)]); }
    if (closed) { rect(c, hx - 10, dcy - 5, 20, 1, '#20180e'); rect(c, hx - 10, dcy + 4, 20, 1, '#20180e'); px(c, hx - 10, dcy - 5, S[3]); px(c, hx + 9, dcy + 4, S[3]); }
    if (st === 4) return;
    if (closed) { disk(c, hx + 5, dcy + 1, 1, '#ffd24a'); px(c, hx + 5, dcy, '#ffffff'); }
    /* a round window in the hill beside the door */
    const wx = hx - 19, wy = base - 17; disk(c, wx, wy, 4, wd[0]); disk(c, wx, wy, 3, T.mood === 'day' ? '#9ad0e8' : '#ffd88a'); rect(c, wx - 3, wy, 7, 1, wd[0]); rect(c, wx, wy - 3, 1, 7, wd[0]); px(c, wx - 2, wy - 2, '#ffffff');
    for (let i = -4; i <= 4; i++) px(c, wx + i, wy + 5, wd[1]);
    if (st === 5) return;
    for (let i = 0; i < 6; i++) { px(c, wx - 3 + i, wy + 5, G[2]); px(c, wx - 3 + i, wy + 4, P.col(i * .17 + .1, .9, .6)); }
    rect(c, x + 36, base - 33, 4, 6, S[1]); rect(c, x + 35, base - 34, 6, 2, S[0]); rect(c, x + 36, base - 33, 1, 6, S[2]);
    rect(c, x + 44, base - 22, 1, 22, wd[1]); rect(c, x + 44, base - 22, 5, 1, wd[2]); rect(c, x + 47, base - 21, 1, 3, wd[0]);
    if (st === 6) return;
    for (let i = 0; i < 9; i++) { const fx = hx - 16 + i * 4, fy = base - hh + 2 - (i & 1); rect(c, fx, fy - 1, 1, 3, G[1]); disk(c, fx, fy - 2, 1, P.col(i * .13 + .05, .9, .6)); px(c, fx, fy - 2, '#ffffff'); }
    for (let a = 0; a < 12; a++) { const an = 3.2 + a * .26, rr = dr + 2; px(c, hx + Math.cos(an) * rr, dcy + Math.sin(an) * rr, T.hedge[2]); if (a % 3 === 0) px(c, hx + Math.cos(an) * (rr + 1), dcy + Math.sin(an) * (rr + 1), '#ffe27a'); }
    rect(c, x + 14, base, 16, 1, '#c8a050'); rect(c, x + 15, base, 14, 1, '#e8c870');
  }
  function larder(c, x, base, T) {
    const wd = T.wood, w = 18, h = 18; NK.shadow(c, x + w / 2, base, 11, .3);
    for (let yy = 0; yy < h; yy++) { const hw = Math.round(w / 2 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, yy - h * .45) / (h * .55), 2)))); if (yy < 4) continue; rect(c, x + w / 2 - hw - 1, base - yy, hw * 2 + 2, 1, wd[0]); }
    for (let yy = 0; yy < h - 1; yy++) { const hw = Math.round((w / 2 - 1) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, yy - h * .45) / (h * .55), 2)))); if (yy < 4) continue; rect(c, x + w / 2 - hw, base - yy, hw * 2, 1, '#2a1a10'); }
    for (const sy of [8, 13]) { rect(c, x + 3, base - sy, w - 5, 1, wd[2]); for (let i = 0; i < 3; i++) { const jx = x + 4 + i * 4 + (sy > 10 ? 1 : 0); rect(c, jx, base - sy - 3, 3, 3, ['#d8683a', '#8ad060', '#f0c040'][(i + sy) % 3]); px(c, jx, base - sy - 3, '#ffffff'); } }
    rect(c, x + 1, base - 4, w - 1, 4, T.stone[1]); px(c, x + 1, base - 4, T.stone[3]); rect(c, x + 1, base - 1, w - 1, 1, T.stone[0]);
  }
  function heartTree(c, L, T) { NK.bigTrunk(c, L.spirit.x, L.sw + 2, T.bark, T.moss, { w: 8 }); }
  function heartEmit(c, L, T) {
    const x = L.spirit.x - 1, y = L.sw - 14, dk = '#06160c';
    for (let j = -8; j <= 8; j++) { const w = j < -4 ? Math.round(2 + (j + 8) * .5) : 5; rect(c, x - w - 1, y + j, w * 2 + 2, 1, dk); }
    for (let j = -7; j <= 8; j++) { const w = j < -4 ? Math.round(1 + (j + 8) * .5) : 4; rect(c, x - w, y + j, w * 2, 1, mix('#fff2b8', '#ffa850', Math.max(0, (j + 7) / 15))); }
    rect(c, x - 5, y + 9, 11, 1, T.stone[1]); px(c, x - 5, y + 9, T.stone[3]);
  }

  /* ---- plants, drawn live ---- */
  const PL = {
    carrot: (c, n, f, T) => { const e = n.en || 0, sw = ECO.sway(n.x, f, .4) * .4; for (let k = -3; k <= 3; k++) { const h = 3 + (k & 1) + Math.round(e * 2); for (let j = 0; j < h; j++) px(c, n.x + k * 2 + Math.round(sw * j / h), n.y - j, j > 1 ? T.grass[3] : T.grass[2]); px(c, n.x + k * 2, n.y + 1, e > .3 ? '#ff8a2a' : '#d06a1a'); } },
    radish: (c, n, f, T) => { const e = n.en || 0, sw = ECO.sway(n.x, f, .4) * .4; for (let k = -3; k <= 3; k++) { const h = 4 + (k & 1) + Math.round(e * 2); for (let j = 0; j < h; j++) px(c, n.x + k * 2 + Math.round(sw * j / h), n.y - j, j > 2 ? T.grass[3] : T.grass[2]); px(c, n.x + k * 2, n.y, e > .3 ? '#ff5a4a' : '#d04a3a'); px(c, n.x + k * 2, n.y + 1, '#f4ecd8'); } },
    cabbage: (c, n, f, T) => { const e = n.en || 0; for (const dx of [-8, 0, 8]) { const r = 3 + (e > .3 ? 1 : 0); ell(c, n.x + dx, n.y - r + 1, r + 1, r, T.hedge[1]); ell(c, n.x + dx - 1, n.y - r, r, r - 1, T.hedge[2]); px(c, n.x + dx - 2, n.y - r - 1, T.hedge[3]); rect(c, n.x + dx - 1, n.y - r, 1, r, T.hedge[3]); } },
    bean: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) * .3, e = n.en || 0; for (const dx of [-7, 0, 7]) { rect(c, n.x + dx, n.y - 14, 1, 14, T.wood[2]); for (let j = 0; j < 12; j++) { const xx = n.x + dx + Math.round(Math.sin(j / 2) * 1.5 + sw * j / 12); px(c, xx, n.y - 1 - j, T.hedge[2]); if (j % 4 === 2) px(c, xx + 1, n.y - 1 - j, T.hedge[3]); if (j % 5 === 3) px(c, xx - 1, n.y - 1 - j, e > .3 ? '#ff7a5a' : '#c85a4a'); } } },
    daisy: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2, e = n.en || 0; for (let k = -2; k <= 2; k++) { const h = 5 + (k & 1) * 3 + Math.round(e * 3), tx = n.x + k * 3 + Math.round(sw); for (let j = 0; j < h; j++) px(c, n.x + k * 3 + Math.round(sw * j / h), n.y - j, T.grass[1]); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(c, tx + dx, n.y - h + dy, '#ffffff'); px(c, tx, n.y - h, '#ffc82a'); } },
    sun: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) + n.kick, e = n.en || 0, h = 22 + Math.round(e * 4); for (let j = 0; j < h; j++) { rect(c, n.x + Math.round(sw * j / h), n.y - j, 2, 1, T.grass[1]); if (j % 6 === 3) rect(c, n.x - 4 + Math.round(sw * j / h), n.y - j, 4, 1, T.grass[2]); } const hx = n.x + Math.round(sw), hy = n.y - h; for (let a = 0; a < 12; a++) { const an = a / 12 * 6.28; rect(c, hx + Math.cos(an) * 5, hy + Math.sin(an) * 5, 2, 2, a % 2 ? '#ffd23a' : '#ffc01a'); } disk(c, hx, hy, 3, '#6a3a1a'); px(c, hx - 1, hy - 1, '#8a5a2a'); },
    lav: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2, e = n.en || 0; for (let k = -3; k <= 3; k++) { const h = 9 + (k & 1) * 3 + Math.round(e * 3); for (let j = 0; j < h; j++) px(c, n.x + k * 2 + Math.round(sw * j / h), n.y - j, j > h - 5 ? (j % 2 ? '#a890f0' : '#7a5ad0') : T.grass[1]); } },
    berry: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) + n.kick, e = n.en || 0; NK.leaves(c, n.x, n.y - 5, 6, T.hedge, rnd(n.seed)); for (let i = 0; i < 6; i++) { const bx = n.x - 5 + (i * 7 % 11) + Math.round(sw), by = n.y - 8 + (i * 3 % 7), col = P.col(i * .15 + f / 240, .9, e > .3 ? .65 : .5); px(c, bx, by, col); px(c, bx + 1, by, '#ffffff'); } },
    tulip: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2, e = n.en || 0; for (let k = -2; k <= 2; k++) { const h = 8 + (k & 1) * 3 + Math.round(e * 3), tx = n.x + k * 3 + Math.round(sw), col = ['#ff5a4a', '#ffc01a', '#4ad0e8', '#ffffff', '#a86af0'][(k + 2 + n.seed) % 5]; for (let j = 0; j < h; j++) px(c, n.x + k * 3 + Math.round(sw * j / h), n.y - j, T.grass[1]); rect(c, tx - 1, n.y - h - 3, 3, 3, col); px(c, tx - 1, n.y - h - 4, col); px(c, tx + 1, n.y - h - 4, col); px(c, tx, n.y - h - 3, '#ffffff'); } },
    pumpkin: (c, n, f, T) => { const e = n.en || 0, s = 1 + e * .3; for (const [dx, dy, r] of [[-5, 0, 3], [4, 1, 4]]) { ell(c, n.x + dx, n.y - r + dy, Math.round(r * s), Math.round(r * s) + 1, '#c8581a'); ell(c, n.x + dx - 1, n.y - r + dy - 1, Math.round(r * s), Math.max(1, Math.round(r * .75 * s)), '#f08a2a'); for (let k = -1; k <= 1; k++) rect(c, n.x + dx + k * 3, n.y - r * 2 + dy + 1, 1, r * 2 - 2, '#c8581a'); rect(c, n.x + dx, n.y - r * 2 + dy - 1, 2, 2, T.grass[0]); } },
    /* spore mushrooms: caps drift through the whole spectrum, each on its own phase */
    spore: (c, n, f, T) => { const e = n.en || 0, w = n.kick; for (const [dx, h, r, s] of [[-7, 5, 3, 1], [0, 9, 5, 2], [8, 6, 3, 3]]) P.shroom(c, n.x + dx, n.y, h + Math.round(e * 2), r + (e > .3 ? 1 : 0), f, n.seed + s); if (e > .3 || w) for (let i = 0; i < 6; i++) { const a = f / 7 + i * 1.05; px(c, n.x + Math.cos(a) * (8 + i), n.y - 10 - i * 2 + Math.sin(a * 1.3) * 2, P.col(i / 6 + f / 80, .9, .72)); } },
    fern: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) * .5, e = n.en || 0; for (const [dx, h, d] of [[-6, 12, -1], [0, 17, 1], [6, 10, -1]]) { let cx = n.x + dx, cy = n.y; for (let j = 0; j < h; j++) { px(c, cx, cy, j > h - 4 ? T.grass[3] : T.grass[2]); if (j > 3 && j % 3 === 0) { px(c, cx - 1, cy, T.grass[1]); px(c, cx + 1, cy, T.grass[1]); } cy -= 1; cx += Math.round(Math.sin(j / h * 3) * .6 * d + sw * j / h * .3); } const hx = cx, hy = cy; for (let t = 0; t < 14; t++) { const a = t * .7 + 3.4, r = 3 - t * .2; px(c, hx + Math.cos(a) * r * d, hy + Math.sin(a) * r, t > 9 ? P.col(f / 100 + dx * .05, .9, .7) : T.grass[3]); } } if (e > .3) px(c, n.x, n.y - 22, '#ffffff'); },
  };
  const PLN = { carrot: 'Carrots', radish: 'Radishes', cabbage: 'Cabbages', bean: 'Bean poles', daisy: 'Daisies', sun: 'Sunflower', lav: 'Lavender', berry: 'Glow berries', tulip: 'Tulips', pumpkin: 'Pumpkins', spore: 'Spore mushrooms', fern: 'Fiddlehead ferns' };
  const PD = (k, o) => Object.assign({ k, name: PLN[k], draw: PL[k], snd: 'rustle' }, o);

  /* ---- the creatures ---- */
  const folkDraw = (spec) => (c, n, f, T) => NK2.beast(c, n, f, Object.assign({ eye: '#0c0c14' }, spec(n, f, T)));
  const mouse = (n, f, T) => { const cl = T.cloth[n.cloth || 0], K = (T.fur && T.fur.mouse) || FUR.mouse; return { K, rx: 7, ry: 5, leg: 3, head: { dx: 7, dy: -2, r: 4 }, ears: [{ dx: -2, dy: -3, w: 4, h: 4, round: 1, in: '#d8a898' }, { dx: 2, dy: -3, w: 4, h: 4, round: 1, in: '#d8a898' }], back(c, x, y, d, f2, by) { for (let j = 0; j < 9; j++) px(c, x - d * (7 + j), by + 3 - Math.round(Math.sin(j / 3 + f2 / 12) * 1.5) - (j > 5 ? 1 : 0), K[2]); }, snout: { dx: 3, dy: 1, w: 2, h: 2, K: K[3] }, nose: '#c87868', extra: (c, x, y, d, f2, by) => { rect(c, x - 4, by - 1, 8, 5, cl[1]); rect(c, x - 4, by - 1, 8, 1, cl[2]); rect(c, x - 4, by + 2, 8, 1, cl[0]); } }; };
  const mole = (n, f, T) => { const cl = T.cloth[n.cloth || 1], K = (T.fur && T.fur.mole) || FUR.mole; return { K, rx: 7, ry: 5, leg: 2, head: { dx: 7, dy: 0, r: 4 }, ears: [], tail: { dx: 7, dy: 2, r: 1 }, snout: { dx: 4, dy: 1, w: 4, h: 3, K: '#e0a898' }, nose: '#f0c0b0', eye: '#e0e0e0', noGlint: true, extra: (c, x, y, d, f2, by) => { rect(c, x - 4, by - 1, 8, 3, cl[1]); rect(c, x - 4, by - 1, 8, 1, cl[2]); for (let k = 0; k < 3; k++) px(c, x + d * 6 + (d > 0 ? 0 : -1), y - 2 + (k & 1), '#e8e0c8'); } }; };
  const hedgehog = (n, f, T) => { const cl = T.cloth[3], K = (T.fur && T.fur.hog) || FUR.hog; return { K, rx: 10, ry: 7, leg: 2, head: { dx: 10, dy: 2, r: 4 }, ears: [{ dx: -1, dy: -3, w: 3, h: 3, round: 1 }], snout: { dx: 4, dy: 1, w: 4, h: 3, K: K[3] }, nose: '#1a1014', back(c, x, y, d, f2, by) { for (let k = -10; k <= 8; k++) { const hh = 4 + Math.round(hsh(k, 2, 4) * 3); for (let j = 0; j < hh; j++) px(c, x - d * k * .9 + (j - 1) * -d * .6, by - 4 - j + Math.abs(k) * .35, j > 1 ? K[1] : K[0]); } }, extra(c, x, y, d, f2, by, hx, hy) { rect(c, x + d * 3 - 2, by - 1, 5, 5, cl[1]); rect(c, x + d * 3 - 2, by - 1, 5, 1, cl[2]); for (let i = -2; i <= 2; i++) px(c, hx + i, hy - 3, '#f4f0e8'); px(c, hx + d * 2, hy - 1, '#dcd8c8'); px(c, hx + d * 3, hy - 1, '#dcd8c8'); } }; };
  const rabbit = (n, f, T) => { const cl = T.cloth[2], K = (T.fur && T.fur.rabbit) || FUR.rabbit; return { K, rx: 7, ry: 5, leg: 3, head: { dx: 7, dy: -2, r: 4 }, ears: [{ dx: -2, dy: -3, w: 3, h: 11, tilt: -2, in: '#e8b8a8' }, { dx: 2, dy: -3, w: 3, h: 10, tilt: 2, in: '#e8b8a8' }], tail: { dx: 8, dy: 1, r: 2, K: ['#b0a090', '#e0d4c4', '#f4eee4', '#ffffff'] }, snout: { dx: 3, dy: 1, w: 2, h: 2, K: K[3] }, nose: '#d08878', extra: (c, x, y, d, f2, by) => { rect(c, x - 4, by - 1, 8, 5, cl[1]); rect(c, x - 4, by - 1, 8, 1, cl[2]); } }; };
  const toad = (c, n, f, T) => { const K = (T.fur && T.fur.toad) || FUR.toad, d = n.dd || 1, throat = Math.round(Math.sin(f / 4)); NK2.beast(c, n, f, { K, rx: 6, ry: 4, leg: 1, head: { dx: 4, dy: -1, r: 3 }, ears: [], hop: true, snout: { dx: 2, dy: 1, w: 2, h: 1, K: '#d8e8a0' }, extra: (c2, x, y, dd, f2, by, hx, hy) => { disk(c2, hx - dd, hy - 2, 1, '#e8f0a0'); disk(c2, hx + dd, hy - 2, 1, '#e8f0a0'); px(c2, hx - dd + dd, hy - 2, '#101018'); px(c2, hx + dd * 2, hy - 2, '#101018'); px(c2, x, by + 2 + (throat > 0 ? 0 : 0), '#d8e8a0'); for (const [dx, dy] of [[-2, -1], [1, -2], [2, 0]]) px(c2, x + dx, by + dy, '#7a5a2a'); } }); };
  const snail = (c, n, f, T) => {
    const d = n.dd || 1, x = Math.round(n.x), y = Math.round(n.y), t = f / 90; NK.shadow(c, x, y, 6, .3);
    for (let i = 0; i < 9; i++) rect(c, x - d * 5 + d * i - (d < 0 ? 0 : 0), y - 2 - (i > 6 ? 1 : 0), 1, 2 + (i > 6 ? 1 : 0), i % 3 ? '#9ab88a' : '#7a9a6c'); px(c, x + d * 5, y - 4, '#9ab88a'); px(c, x + d * 6, y - 5, '#101018'); px(c, x + d * 4, y - 5, '#101018'); px(c, x + d * 6, y - 6, '#9ab88a');
    NK2.blob(c, x - d, y - 5, 5, 5, [P.col(t, .6, .15), P.col(t, .85, .38), P.col(t, .85, .58), P.col(t, .8, .8)], { outline: '#101018' });
    for (let i = 0; i < 22; i++) { const a = i * .55 + f / 70, r = i * .2; px(c, x - d + Math.cos(a) * r, y - 5 + Math.sin(a) * r, i > 15 ? '#ffffff' : P.col(i / 20 + t * 2, .95, .72)); }
  };
  const songbird = (c, n, f, T) => {
    const d = n.dd || 1, x = Math.round(n.x), y = Math.round(n.y), fl = Math.round(Math.sin(f * .9)) , K = ['#0e2a5a', '#2a62c0', '#5aa0f0', '#c0e0ff'];
    NK2.blob(c, x, y, 4, 3, K, { hi: false }); NK2.blob(c, x + d * 4, y - 2, 2, 2, K, { hi: false }); px(c, x + d * 6, y - 2, '#f0a020'); px(c, x + d * 5, y - 3, '#101018'); px(c, x - d * 6, y + 1, K[1]); px(c, x - d * 7, y + 1, K[0]); px(c, x - d * 6, y, K[2]);
    rect(c, x - 2, y - 5 + fl * 2, 4, 1, K[2]); px(c, x - 2, y - 6 + fl * 2, K[3]); px(c, x + 1, y - 6 + fl * 2, K[3]); px(c, x, y + 3, '#c08030');
  };
  const bee = (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd || 1, w = (f & 1); rect(c, x - 2, y - 1, 5, 3, '#ffc82a'); rect(c, x - 1, y - 1, 1, 3, '#101018'); rect(c, x + 1, y - 1, 1, 3, '#101018'); px(c, x + d * 3, y, '#101018'); c.globalAlpha = .75; rect(c, x - 2, y - 3 - w, 2, 2, '#e8f8ff'); rect(c, x + 1, y - 3 - w, 2, 2, '#e8f8ff'); c.globalAlpha = 1; };
  const butterfly = (c, n, f, T) => {
    const x = Math.round(n.x), y = Math.round(n.y), fl = Math.abs(Math.sin(f / 3)), wx = Math.max(1, Math.round(6 * (.3 + fl * .7))), t = f / 100 + n.ph;
    for (const s of [-1, 1]) { for (let j = -4; j <= 4; j++) { const w = Math.round(wx * Math.sqrt(Math.max(0, 1 - j * j / 20))); for (let i = 1; i <= w; i++) px(c, x + s * i, y + j - 1, i === w ? '#201830' : P.col(t + i * .08 + (j + 4) * .02, .95, .55)); } for (const [dx, dy] of [[.5, -1], [.5, 2]]) disk(c, x + s * Math.round(wx * dx), y + dy, 1, '#ffffff'); }
    rect(c, x, y - 2, 1, 5, '#101018'); px(c, x - 1, y - 3, '#101018'); px(c, x + 1, y - 3, '#101018');
  };
  const glowworms = (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y); for (let k = -6; k <= 6; k += 3) { const len = 7 + Math.abs(k) % 4 * 2; for (let j = 0; j < len; j++) px(c, x + k, y - 14 + j, '#3a4a50'); for (let j = 3; j < len; j += 2) { const a = .5 + .5 * Math.sin(f / 9 + k + j); c.globalAlpha = .4 + a * .6; px(c, x + k, y - 14 + j, P.col(j * .07 + f / 120 + k * .02, .8, .7)); c.globalAlpha = 1; } disk(c, x + k, y - 14 + len, 1, P.col(k * .05 + f / 90, .9, .78)); } };



  /* ---- the painted glade (NK.forest): a sunlit meadow, a pond ringed with red toadstools, a leaf-litter path of flagstones, an old oak and the Heart Tree ---- */
  const SFS = (() => {
    const F = NK.forest, lift = (a, col, t) => a.map(c => VG.mix(c, col, t));
    const CAP = ['#7a1418', '#c83028', '#f05a40', '#ffa888'], STEM = ['#8a8478', '#c8c4b4', '#ecead8', '#ffffff'];
    const pal = mood => {
      const B = F.pal(mood), n = mood === 'night';
      if (n) return Object.assign({}, B, { sky: ['#060e2a', '#0e204a', '#1a3860', '#2a4a70'], glow: ['#eaf2ff', '#6a90d0'], fog: '#1a2e56', farA: '#2c4c74', farB: '#1e3a5c', farC: '#12284a', rimC: '#5a84b4', land: ['#0a2a2a', '#103a34', '#18503e'], verge: ['#06201c', '#0c3a2c', '#14523a', '#1e6a48'], dirt: ['#14100e', '#241a14', '#3a2a20', '#54402e', '#6a5038'], cap: CAP, stem: STEM, shroomA: .35 });
      const s = mood === 'sunset' ? 1 : 0;
      return Object.assign({}, B, { sky: mood === 'day' ? ['#5ab4f0', '#92d0f4', '#cae8f0', '#eef6dc'] : B.sky, farA: s ? B.farA : '#9ccfa8', farB: s ? B.farB : '#6aaa7a', farC: s ? B.farC : '#3a7a52', rimC: s ? B.rimC : '#d8f8a8', land: lift(B.land, '#98d060', .2), verge: lift(B.verge, '#98d060', .3),
        dirt: lift(['#5a4030', '#7a5a3c', '#9a7a50', '#bc9a68', '#d8b886'], s ? '#ff9a60' : '#fff0c0', s ? .2 : .06), cap: CAP, stem: STEM, shroomA: .12 });
    };
    const ring = (L) => { const o = [], wp = L.water, rx = L.wide ? 26 : 18; for (let i = 0; i < 13; i++) { const a = i / 13 * 6.283 + .2, big = i % 4 === 0; o.push({ x: wp.x + Math.cos(a) * rx, y: wp.y + 1 + Math.sin(a) * 6.5, r: big ? 3.4 : 2.1 + (i % 3) * .4, h: big ? 5.5 : 3.2 }); } return o; };
    return {
      pal, heartDy: 14, waterDy: 25, waterU: .24,
      geom(L, sw) { L.shrooms = ring(L); },
      far: (Q, L, H, gx) => [
        { k: .09, blur: .8, trees: { seed: 3, n: 9, fn: F.oak, base: Math.round(H * .5), jit: 4, h: 80, w: 2.4, col: Q.farA, rim: F.pal('day').farA === Q.farA ? '#b8e0b4' : Q.farA }, fog: [.25, .56] },
        { k: .16, blur: .5, trees: { seed: 5, n: 6, fn: F.oak, base: Math.round(H * .56), jit: 5, h: 90, w: 3.4, col: Q.farB, rim: Q.farA }, fog: [.4, .62] },
        { k: .26, trees: { seed: 8, n: 4, fn: F.oak, base: Math.round(H * .6), jit: 5, h: 100, w: 5, col: Q.farC, rim: Q.rimC }, paint: (c, g2, Q2, L2, H2) => F.farGround(c, g2, Q2, H2), fog: [.5, .66, null, .4] },
      ],
      floor(c, g, Q, L, H) {
        const sw = L.sw, top = sw - 8, lx = L.lx, rx = L.spirit.x, wp = L.water, R = F.rnd(5);
        F.floor(c, g, Q, L, top); F.fogBand(c, g, Q.fog, top - 10, top + 8, 0, .4);
        for (let i = 0; i < 12; i++) F.mound(c, Q, g.x0 + 8 + i * (g.x1 - g.x0 - 16) / 11, top + 2 + (i % 2) * 2, 7 + (i * 7) % 6, 2.2, 40 + i);
        F.leaves(c, g, Q, L, 40, 17, top + 3); F.plot(c, Q, L);
        /* wildflowers in the grass */
        for (let i = 0; i < 90; i++) { const x = g.x0 + R() * (g.x1 - g.x0), y = top + 3 + R() * (H - top), t = (y - top) / (H - top); F.R_(c, x, y, .5 + t, .5 + t * .5, ['#ffffff', '#ffe870', '#fff6c8', '#a8c8ff'][i % 4]); }
        /* the pond */
        const rpx = L.wide ? 25 : 17; F.blob(c, wp.x, wp.y + 1, rpx + 2, 7.5, Q.bark[1]); F.blob(c, wp.x, wp.y + .5, rpx + 1, 6.8, Q.moss[2]); F.blob(c, wp.x, wp.y + 1, rpx - .5, 6, Q.water[0]); F.blob(c, wp.x, wp.y + .5, rpx - 2, 5, Q.water[1]); F.blob(c, wp.x - 4, wp.y, rpx * .6, 3, Q.water[2]);
        for (let i = 0; i < 9; i++) F.R_(c, wp.x - rpx * .6 + R() * rpx * 1.2, wp.y - 2 + R() * 4, 2 + R() * 4, .5, Q.water[3]);
        const sh = L.shrooms.slice().sort((a, b) => a.y - b.y); for (const m of sh) F.shroom(c, m.x, m.y, m.r, m.h, Q, Math.round(m.x * 7), m.r > 3);
        /* flagstone path through the meadow */
        for (let y = top + 2; y < H + 6; y += 5.5) { const t = (y - top) / (H - top), px = L.cx + Math.sin((y - sw) / 21 + .6) * 22 - (y - sw) * .22; for (const dx of [-2.5 - t * 6, 2.5 + t * 6, 0]) { const w = 2.5 + t * 5; F.blob(c, px + dx + (F.vn(y, dx, 3, 4) - .5) * 4, y + (dx ? 1.5 : 0), w, w * .36, Q.dirt[1]); F.blob(c, px + dx + (F.vn(y, dx, 3, 4) - .5) * 4, y + (dx ? 1.5 : 0) - .5, w * .9, w * .3, Q.dirt[4]); } }
        /* the old oak on the left, the Heart Tree on the right */
        F.trunk(c, g, Q, { x: lx, base: sw + 6, w0: 12, w1: 20, flare: 18, seed: 4, light: 1, lean: -2, sway: 2, moss: .02 });
        F.root(c, Q, { x: lx + 12, y: sw, dir: 1, len: 40, arch: 10, drop: 9, w: 6, seed: 3 }); F.root(c, Q, { x: lx + 8, y: sw + 12, dir: -1, len: 26, arch: 4, drop: 5, w: 4.4, seed: 6 });
        F.trunk(c, g, Q, { x: rx, base: sw + 6, w0: 14, w1: 22, flare: 14, seed: 8, light: -1, lean: 3, sway: 2, moss: .1 });
        F.root(c, Q, { x: rx - 12, y: sw + 3, dir: -1, len: 46, arch: 8, drop: 9, w: 5.4, seed: 9 }); F.root(c, Q, { x: rx + 12, y: sw + 5, dir: 1, len: 40, arch: 7, drop: 7, w: 5, seed: 11 });
      },
      near(c, g, Q, L, H) {
        const lx = Math.max(g.x0 + 10, L.x0 - 24), rx = Math.min(g.x1 - 10, L.x1 + 34);
        /* leaves overhead at the top corners, the grass in front at the bottom */
        for (const [x, d] of [[g.x0 + 6, 1], [g.x1 - 6, -1]]) for (let i = 0; i < 9; i++) { F.blob(c, x + d * i * 7 + (i % 2) * 3, 2 + (i % 3) * 3, 7 + (i % 3) * 3, 4 + (i % 2) * 2, Q.fern[1 + (i % 2)]); F.blob(c, x + d * i * 7 + (i % 2) * 3, 1 + (i % 3) * 3, 5 + (i % 3) * 2, 2.5, Q.fern[3]); }
        for (let i = 0; i < 7; i++) F.bigLeaf(c, Q, rx + (i - 3) * 5, H + 3, -Math.PI / 2 + (i - 3) * .32, 13 + (i % 3) * 3, 3.2 + (i % 2), 30 + i);
        for (let i = 0; i < 10; i++) F.frond(c, Q, lx + (i - 5) * 2.2, H + 4, -Math.PI / 2 + (i - 5) * .2, 20 + (i % 4) * 5, 50 + i);
      },
      lights(f, g, L) { const a = g.mood === 'night' ? .4 : g.mood === 'sunset' ? .22 : .08, o = []; for (const m of L.shrooms) if (m.r > 3) o.push({ x: m.x, y: m.y - m.h * .7, r: 12, col: '#ff7a5a', a: a * .8 }); o.push({ x: L.spirit.x - 1, y: L.sw - 14, r: 36, col: '#ffd890', a: a * 1.3 + .04 }); return o; },
    };
  })();

  const D0 = {
    id: 'shire', houseName: 'Your burrow', houseW: 44, hutName: 'The larder', hutW: 18, spiritH: .56,
    sky: SKY, fog: FOG, ramps: RAMPS, bubble: { bg: '#f6ffe8', edge: '#1c4a2a', ink: ['#2a9a4a', '#e0702a', '#2a8ad8', '#8a4ad0'] }, pulse: '#d8ffa0', waveCol: '#c8ff8a', windowCol: '#ffd890',
    pal(T, mood, MC) { T.green = GREEN.map(c => MC(c, mood, .3)); T.cloth = CLOTH.map(r => r.map(c => MC(c, mood))); return T; },
    wall: { clump: 'leaf', ramps: T => [T.hedge, T.hedge, T.hedge] },
    cav: { rx: 124, ry: .47, bump: .06, ph: [1.3, 4.1, 2.2] },
    door: (L, H) => ({ x: NK.u(L, .5), y: Math.round(H * .3), rx: L.wide ? 25 : 18, ry: L.wide ? 30 : 24 }),
    geom(L, G0, H) {
      const sw = L.sw; L.lamps = [{ x: L.house.x + 22, y: sw - 52 }, { x: L.hut.x + 9, y: sw - 36 }, { x: NK.u(L, L.wide ? .74 : .66), y: sw - 70 }]; L.heart = { x: L.spirit.x - 1, y: sw - 14 };
    },
    lit(T, L, H) {
      const m = T.mood, dr = L.E.door, sw = L.sw, k = { morning: { amb: [.5, .54, .52], dc: [1, .88, .62], da: .75 }, day: { amb: [.6, .64, .58], dc: [1, .96, .78], da: .8 }, sunset: { amb: [.4, .32, .38], dc: [1, .6, .34], da: .85 }, night: { amb: [.2, .26, .42], dc: [.4, .55, 1], da: .5 } }[m];
      const la = m === 'night' ? 1.25 : m === 'sunset' ? 1 : m === 'morning' ? .75 : .55, ha = m === 'night' ? 1.1 : .7;
      const Ls = [{ x: dr.x, y: dr.y + 6, r: 104, a: k.da, col: k.dc, sy: 1.1 }, { x: dr.x + 8, y: sw + 18, r: 66, a: k.da * .8, col: k.dc, sy: .45 }];
      for (const l of L.lamps) { Ls.push({ x: l.x, y: l.y, r: 48, a: la, col: [1, .72, .38] }); Ls.push({ x: l.x, y: sw + 12, r: 54, a: la * .55, col: [1, .72, .38], sy: .4 }); }
      Ls.push({ x: L.heart.x, y: L.heart.y, r: 84, a: ha, col: [.62, 1, .5] }); Ls.push({ x: L.heart.x - 12, y: sw + 14, r: 70, a: ha * .6, col: [.62, 1, .5], sy: .45 });
      return { Ls, amb: k.amb, ambStage: k.amb.map(v => v * .8 + .06) };
    },
    wallK: T => T.wall, floorK: T => T.floor, ringK: T => T.ring, doorFrame: T => [T.wood[2], T.wood[1], T.stone[1]],
    wallDeco(c, g, T, L, E, R) {
      const sw = L.sw;
      /* stones set in the earth */
      for (let i = 0; i < 26; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = 6 + Math.floor(R() * (sw + 4)); if (E.cav(x, y) > .96 || E.inDoor(x, y) < 1.4) continue; NK2.blob(c, x, y, 2 + Math.floor(R() * 4), 2 + Math.floor(R() * 2), [T.stone[0], T.stone[1], T.stone[2], T.stone[3]], { outline: T.soil[0] }); }
      /* moss gathering in the damp corners and under the ceiling */
      for (let i = 0; i < 40; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = 4 + Math.floor(R() * (sw + 8)), s = E.cav(x, y); if (s > .97 || (s < .7 && R() < .8) || E.inDoor(x, y) < 1.4) continue; NK2.blob(c, x, y, 3 + Math.floor(R() * 5), 2 + Math.floor(R() * 2), T.moss, { outline: false, hi: false }); }
      /* roots coming through the ceiling */
      for (let i = 0; i < 17; i++) { const x = E.cx - E.rx + 8 + Math.round(R() * (E.rx * 2 - 16)); let y = 0; while (y < 60 && E.cav(x, y) >= 1) y++; if (y >= 60) continue; NK2.root(c, x, y - 2, 18 + Math.floor(R() * 40), 1.57 + (R() - .5) * .6, 2 + R() * 1.5, [T.bark[0], T.bark[1], T.bark[2], T.bark[3]], R, { wob: .3, pull: (R() - .5) * .02, fork: R() < .5 }); }
      /* old carved spirals, a mandala in the earth that somebody pressed here long ago */
      for (const [dx, dy, r] of [[-92, 46, 13], [88, 60, 10], [-50, 24, 7]]) { const cx = E.cx + dx, cy = dy; if (E.cav(cx, cy) > .9) continue; NK2.blob(c, cx, cy, r + 3, r + 3, [T.soil[0], T.soil[1], T.soil[2], T.soil[2]], { outline: T.soil[0], hi: false }); P.mandala(c, cx, cy, r, 0, { step: 3, dots: true, s: .5, l: .46, petals: 6, wave: 1, span: 1.2 }); }
      /* the string the lanterns hang on */
      for (const l of L.lamps) for (let j = 0; j < Math.max(0, l.y - 4); j++) px(c, l.x, j, T.bark[0]);
    },
    wallEmit(c, g, T, L, E, R) {
      for (const l of L.lamps) { const x = l.x, y = l.y; rect(c, x - 3, y - 4, 7, 2, '#3a2a18'); rect(c, x - 3, y - 2, 7, 8, '#ffcf70'); rect(c, x - 2, y - 1, 5, 6, '#fff0b0'); rect(c, x - 1, y, 3, 3, '#ffffff'); rect(c, x - 4, y - 2, 1, 8, '#3a2a18'); rect(c, x + 4, y - 2, 1, 8, '#3a2a18'); rect(c, x - 3, y + 6, 7, 1, '#3a2a18'); }
      for (let i = 0; i < 30; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = 10 + Math.floor(R() * (L.sw + 6)); if (E.cav(x, y) > .94 || E.inDoor(x, y) < 1.5) continue; px(c, x, y, P.col(hsh(x, y, 5), .9, .66)); if (R() < .4) px(c, x + 1, y, P.col(hsh(x, y, 5) + .1, .9, .55)); }
    },
    paintSky: sky, paintFar: far,
    groundDeco(c, g, T, L, H) {
      const R = rnd(11), sw = L.sw;
      NK.tuftRows(c, g, L, H, [T.grass[0], T.grass[2], T.grass[3]], R);
      for (let i = 0; i < 24; i++) { const fx = L.x0 + Math.floor(R() * (L.x1 - L.x0)), fy = sw + 5 + Math.floor(R() * (H - sw - 5)); px(c, fx, fy, ['#ffffff', '#ffe27a', '#4ad0e8', '#b8a0ff'][i & 3]); }
      NK.path(c, g, L, H, [T.soil[1], T.soil[2], T.soil[2], T.soil[3]], {});
      NK.stream(c, g, L, H, T.water, { stones: T.stone, bank: [T.soil[1], T.grass[3]] }); NK.bridge(c, L, T.wood); NK.bed(c, L, T.soil); NK.fence(c, L, T.wood);
    },
    spiritPaint: (c, L, T) => heartEmit(c, L, T), hutPaint: (c, x, base, T) => larder(c, x, base, T),
    housePaint: (c, x, base, st, T, L) => burrow(c, x, base, st, T, L),
    stageEmit(c, g, T, L) { heartEmit(c, L, T); },
    ringDeco(c, g, T, L, E, R) {
      const sw = L.sw, hedge = T.hedge, K = [hedge[0], hedge[1], hedge[1], hedge[2]];
      for (let i = 0; i < 9; i++) { const x = E.cx - E.rx + 10 + Math.round(R() * (E.rx * 2 - 20)); let y = 0; while (y < 60 && E.cav(x, y) >= 1) y++; if (y >= 60) continue; for (let j = 0; j < 8 + R() * 22; j++) { px(c, x + Math.round(Math.sin(j / 4 + x) * 1.2), y + j, j % 5 === 4 ? hedge[3] : hedge[1]); } }
      for (let i = 0; i < 46; i++) { const a = R() * 6.283, x = Math.round(E.cx + Math.cos(a) * E.rx * 1.02), y = Math.round(E.cy + Math.sin(a) * E.ry * 1.02); if (E.cav(x, y) < .99) continue; NK.leaves(c, x, y, 3 + Math.floor(R() * 4), K, R); }
      for (let x = g.x0; x < g.x1; x += 3) { const y = sw + 60; if (E.cav(x, y + 4) < 1 && R() < .2) NK.tufts(c, x, x + 3, y + 22, [hedge[0], hedge[2], hedge[3]], R, .5, 3); }
    },
    fg(c, g, T, L, H, W) {
      const R = rnd(99), K = [T.hedge[0], T.hedge[1], T.hedge[1], T.hedge[2]];
      for (const side of [-1, 1]) for (let i = 0; i < 5; i++) NK.leaves(c, side < 0 ? g.x0 + 4 + i * 5 : g.x1 - 4 - i * 5, H - 6 + Math.floor(R() * 14) - i * 7, 10 + Math.floor(R() * 6), K, R);
      for (let i = 0; i < 8; i++) NK.leaves(c, L.x0 + Math.floor(R() * (L.x1 - L.x0)), H + 8 + Math.floor(R() * 6), 8 + Math.floor(R() * 5), K, R);
    },
    spirit: { name: 'The Heart Tree', snd: 'hum', sndK: 1, say: ['heart', 'leaf', 'sun', 'drop'], hw: 30, hh: 70,
      glow: (T, L) => ({ col: '#d8ff9a', r: 44, a: T.mood === 'night' ? .16 : .06, dy: 14 }),
      draw(c, n, f, T, L) { const x = L.spirit.x - 1, y = L.sw - 14; P.mandala(c, x, y - 2, 6, f, { step: 1, petals: 5, speed: 90, wave: .8, spin: 2 }); if (n.fl > .1) for (let i = 0; i < 8; i++) { const a = f / 5 + i * .785; px(c, x + Math.cos(a) * (14 + i * 2), y + Math.sin(a * 1.3) * 18, P.col(i / 8 + f / 60, .9, .75)); } } },
    nests: [{ dx: -3, yf: .78, name: 'Mouse door' }, { dx: 4, yf: .5, name: 'Tree door' }],
    nestDraw(c, n, f, T, i, lit) { const x = Math.round(n.x), y = Math.round(n.y); disk(c, x, y - 2, 5, '#3a2410'); disk(c, x, y - 2, 4, '#6a4826'); disk(c, x, y - 2, 3, lit ? '#ffcf70' : '#160c06'); rect(c, x - 3, y - 2, 7, 1, '#3a2410'); if (lit) { px(c, x - 1, y - 4, '#ffffff'); px(c, x + 1, y - 3, '#fff0b0'); } else px(c, x - 2, y - 4, '#a88458'); px(c, x - 3, y - 5, '#c09868'); rect(c, x - 3, y + 3, 7, 1, T.stone[1]); px(c, x - 3, y + 3, T.stone[3]); },
    plants: [
      PD('carrot', { p: .1, row: 10, crop: 1 }), PD('cabbage', { p: .5, row: 10, crop: 1 }), PD('bean', { p: .9, row: 10, crop: 1 }), PD('radish', { p: .12, row: 18, crop: 1 }), PD('pumpkin', { p: .5, row: 18, crop: 1 }), PD('cabbage', { p: .9, row: 18, crop: 1, name: 'Cabbages' }),
      PD('sun', { u: .06, row: 24, hh: 18 }), PD('lav', { u: .44, row: 5 }), PD('lav', { u: .2, row: 26 }), PD('tulip', { u: .13, row: 14 }), PD('tulip', { u: .82, row: 26 }), PD('daisy', { u: .27, row: 23 }), PD('daisy', { u: .62, row: 29 }), PD('daisy', { u: .95, row: 21 }),
      PD('berry', { u: .8, row: 15, glow: (n, T, f) => ({ col: P.col(f / 200, .8, .6), r: 12, a: T.lit * .3 + .08, dy: 6 }) }), PD('berry', { u: .02, row: 8 }),
      PD('spore', { u: .3, row: 20, hw: 10, hh: 12, snd: 'chime', sndK: 3, glow: (n, T, f) => ({ col: P.col(n.seed * .13 + f / 190, .85, .6), r: 16, a: T.lit * .4 + .12, dy: 6 }) }), PD('spore', { u: .72, row: 22, hw: 10, hh: 12, snd: 'chime', sndK: 5, glow: (n, T, f) => ({ col: P.col(n.seed * .13 + f / 190 + .4, .85, .6), r: 16, a: T.lit * .4 + .12, dy: 6 }) }),
      PD('fern', { u: .56, row: 30, hw: 10, hh: 20, snd: 'rustle' }), PD('fern', { u: .38, row: 7, hh: 20 }),
    ],
    animals: [
      { id: 'toad', name: 'Pond toad', mode: 'hop', u: .66, row: 31, range: 0, hw: 6, hh: 6, snd: 'ribbit', say: ['drop', 'leaf', 'note'], draw: toad },
      { id: 'snail', name: 'Prism snail', mode: 'crawl', u: .2, row: 31, range: 30, hw: 7, hh: 7, spd: .4, every: 4, snd: 'bloop', magic: true, say: ['star', 'heart', 'note'], draw: snail, glow: T => ({ col: '#c8a0ff', r: 12, a: T.lit * .25 + .06, dy: 5 }) },
      { id: 'songbird', name: 'Blue songbird', mode: 'hover', u: .5, dy: -46, hw: 7, hh: 6, snd: 'chirp', say: ['note', 'sun', 'heart'], air: true, hover: { dy: -46, rx: 38, ry: 8, sx: 41, sy: 23, jy: .5 }, draw: songbird },
      { id: 'bee', name: 'Honey bee', mode: 'hover', u: .55, dy: -9, hw: 5, hh: 5, snd: 'buzz', say: ['sun', 'drop'], air: true, hover: { dy: -9, rx: 36, ry: 5, sx: 19, sy: 7, jx: 1.2, jy: .8 }, draw: bee },
      { id: 'butterfly', name: 'Mandala butterfly', mode: 'hover', u: .4, dy: -26, hw: 8, hh: 7, snd: 'flutter', magic: true, say: ['star', 'heart', 'note', 'leaf'], air: true, hover: { dy: -26, rx: 48, ry: 12, sx: 37, sy: 17, jx: .8, jy: 1 }, draw: butterfly, glow: T => ({ col: '#a0e8ff', r: 12, a: T.lit * .3 + .05, dy: 4 }) },
      { id: 'worms', name: 'Glowworm curtain', mode: 'still', u: .72, dy: -66, hw: 9, hh: 8, snd: 'hum', sndK: 4, magic: true, say: ['star', 'note'], air: true, draw: glowworms, glow: T => ({ col: '#88f0d0', r: 20, a: T.lit * .4 + .1, dy: 2 }) },
    ],
    folk: [
      { id: 'mouse', name: 'Mouse gardener', rank: 3, cloth: 0, draw: folkDraw(mouse), u: .55, hw: 8, hh: 12, snd: 'squeak', needCrops: true, tasks: [{ to: { crop: 0 }, act: 'tend', t: 8, say: 'leaf' }, { to: { crop: 1 }, act: 'tend', t: 8 }, { to: { crop: 3 }, act: 'carry', take: 'basket', t: 4 }, { to: 'store', act: 'give', t: 5 }, { to: 'store', act: 'enter', t: 14 }, { to: { u: .45 }, act: 'talk', t: 8, say: 'sun' }] },
      { id: 'mole', name: 'Mole waterer', rank: 2, cloth: 1, draw: folkDraw(mole), u: .5, hw: 8, hh: 12, snd: 'snuffle', needCrops: true, tasks: [{ to: 'water', act: 'carry', take: 'bucket', t: 5 }, { to: { crop: 2 }, act: 'tend', t: 8, say: 'drop' }, { to: 'water', act: 'carry', take: 'bucket', t: 5 }, { to: { crop: 4 }, act: 'tend', t: 8 }, { to: 'water', act: 'carry', take: 'bucket', t: 5 }, { to: { crop: 5 }, act: 'tend', t: 8, say: 'drop' }] },
      { id: 'rabbit', name: 'Rabbit picker', rank: 4, cloth: 2, draw: folkDraw(rabbit), u: .6, hw: 8, hh: 14, snd: 'snuffle', needCrops: true, tasks: [{ to: { plant: 'berry' }, act: 'carry', take: 'apple', t: 6, say: 'heart' }, { to: 'store', act: 'give', t: 5 }, { to: { plant: 'tulip' }, act: 'tend', t: 8 }, { to: { nest: 1 }, act: 'look', t: 8 }, { to: 'house', act: 'enter', t: 18 }] },
      { id: 'elder', name: 'Old hedgehog', rank: 5, cloth: 3, draw: folkDraw(hedgehog), u: .9, lane: 1, elder: true, hw: 11, hh: 12, snd: 'snuffle', needCrops: true, tasks: [{ to: { u: .8 }, act: 'sit', t: 40 }, { to: { u: .8 }, act: 'talk', t: 10, say: 'leaf', reply: 'heart' }, { to: 'spirit', act: 'tend', t: 12, say: 'heart' }] },
    ],
    sprites: { n: 4, name: 'Light sprite', col: '#d8ffa0', r: 11, a: .2, say: ['leaf', 'drop', 'sun', 'heart', 'star'],
      draw(c, n, f, T, i) { const x = Math.round(n.x), y = Math.round(n.y), K = T.green, b = Math.round(Math.sin(f / 4 + i)); c.globalAlpha = .4; disk(c, x, y + b, 4, K[4]); c.globalAlpha = 1; disk(c, x, y + b, 2, K[3]); disk(c, x, y + b, 1, K[5]); px(c, x - 3, y + b - 3, K[4]); px(c, x + 3, y + b - 3, K[4]); px(c, x - 1, y + b, '#0a2a10'); px(c, x + 1, y + b, '#0a2a10'); for (let k = 0; k < 5; k++) { const a = f / 6 + k * 1.26 + i; px(c, x + Math.cos(a) * 5, y + b + Math.sin(a) * 3, P.col(k / 5 + f / 90 + i * .2, .95, .7)); } } },
    weather: { dir: 'up', cols: ['#d8ffb0', '#b0f0ff'], glow: true, depths: [{ n: 10, size: 1, dur: 42, z: 1, seed: 6, op: .7 }, { n: 3, size: 1, dur: 28, z: 3, seed: 3, op: .6, blur: 1 }] },
    heart: (L, T) => ({ x: L.spirit.x - 1, y: L.sw - 14 }),
    lights(f, g, L) { return []; },
    rays(g, L) { if (g.mood === 'night') return []; const d = L.E.door, out = []; for (let i = 0; i < 3; i++) out.push({ x: d.x - 14 + i * 14, w: 6 + i * 2, sk: .35, a: g.T.shaftA * 1.2, d: i * 2.2, col: g.T.shaft }); return out; },
  };
  NK.lib = Object.assign(NK.lib || {}, { sh: { PL, PLN, folkDraw, mouse, mole, hedgehog, rabbit, toad, snail, songbird, bee, butterfly, glowworms, FUR, CLOTH, GREEN, heartEmit } });
  NK.forest.compose(D0, SFS);
  NK.realm(D0);
})();
