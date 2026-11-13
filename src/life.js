/* ---------- the living world: animals in their homes, plants that sway, and a world that answers what you do ----------
   Each realm has its own cast (seven or more animals, at least two of them magical, and eight kinds of plant). Animals live somewhere:
   a burrow, a hollow in a tree, a little house, a log, the lake. They come out, forage, go back in, and peek out now and then;
   some only wake at dusk. Plants sway in the wind, and brush against whatever walks past. Tap anything and it answers with a sound.
   The whole world also listens to the app: opening the scroll sends a gust through the grass and the shy ones duck away; closing it
   lets the magic drift off in sparks and they come back; saving a receipt drops a pebble of light into the lake; a streak or a goal
   makes the fairies flare. It hooks in through sfx(), so every sound the app makes is also something that happens in the world.
   Drawn in the scene's live layer, six times a second; nothing here runs while the tab is hidden. */
const LIFE = (() => {
  const P = {   /* creature colours */
    brown: { a: '#b98a5e', b: '#7a5236', w: '#f1e3cc', k: '#1d1510', e: '#e89aa6', g: '#ffe27a' },
    grey: { a: '#9a9a96', b: '#5e5e66', w: '#ecebe4', k: '#1b1b20', e: '#d8a0a8', g: '#ffe27a' },
    red: { a: '#d8693a', b: '#8c3a24', w: '#f6e2cc', k: '#1d1010', e: '#2a1a16', g: '#ffd27a' },
    snow: { a: '#f2f4f6', b: '#aab4c4', w: '#ffffff', k: '#26303c', e: '#f0a8b4', g: '#bfefff' },
    black: { a: '#2c2c3a', b: '#14141e', w: '#4a4a5e', k: '#ffd27a', e: '#8a6a4a', g: '#ffd27a' },
    green: { a: '#6aa84a', b: '#3e6e34', w: '#d8ecb0', k: '#1a2a14', e: '#e89aa6', g: '#b8ff9a' },
    violet: { a: '#8a6ab8', b: '#4e3a7a', w: '#e4d4f8', k: '#1a1228', e: '#f0a8d8', g: '#e8a8ff' },
    gold: { a: '#e8b84a', b: '#a8742a', w: '#fff0c0', k: '#2a1a0a', e: '#ff9a5a', g: '#fff1a8' },
    tan: { a: '#d8b078', b: '#8a6238', w: '#fbf0d8', k: '#241810', e: '#e89a8a', g: '#ffe9a0' },
    glow: { a: '#9ad8ff', b: '#4a86c8', w: '#e8f8ff', k: '#1a2a4a', e: '#ffffff', g: '#d8f4ff' },
  };
  const pal = (b, o) => Object.assign({}, P[b], o || {});
  /* the cast of each realm. beh: peek (lives in a home and looks out), walk, sit, visit (flies from flower to flower), fly, float, hop (pond).
     hab: burrow | tree | house | log | pond | free. night: only about at dusk and after. magic: counts as a magical creature. */
  const CAST = {
    wood: {
      guide: 'Fairy Wood', habs: { burrow: 'mound', tree: 'oak', house: 'timber' },
      stag: { b: '#eef4f6', d: '#c8d6dc', w: '#ffffff', k: '#2a3a48', a: '#bff4ff' },
      animals: [
        { id: 'rabbit', name: 'Meadow rabbit', spr: 'rabbit', beh: 'peek', hab: 'burrow', c: pal('brown'), snd: 'squeak' },
        { id: 'hedgehog', name: 'Hedgehog', spr: 'hedgehog', beh: 'walk', range: [.3, .5], c: pal('brown', { b: '#5a4030', a: '#c8a47a' }), snd: 'snuffle' },
        { id: 'frog', name: 'Pond frog', spr: 'frog', beh: 'hop', hab: 'pond', c: pal('green'), snd: 'ribbit' },
        { id: 'owl', name: 'Hollow owl', spr: 'owl', beh: 'peek', hab: 'tree', night: true, c: pal('tan', { a: '#9a7a5a', b: '#5e4632' }), snd: 'hoot' },
        { id: 'squirrel', name: 'Red squirrel', spr: 'squirrel', beh: 'sit', at: .345, c: pal('red', { a: '#c8643a' }), snd: 'chitter' },
        { id: 'moth', name: 'Lantern moth', spr: 'moth', beh: 'visit', magic: true, c: pal('gold', { a: '#f4f0d8', b: '#b8a878', g: '#ffe27a' }), snd: 'chime' },
        { id: 'fairy', name: 'Wood fairies', magic: true, builtin: true, snd: 'chime' },
        { id: 'stag', name: 'Spirit stag', magic: true, builtin: true, snd: 'hoot' },
      ],
      plants: [['fern', '#4a9a4a', '#7acc6a'], ['bell', '#6a7ad8', '#b8c4ff', 'Bluebell'], ['flower', '#d86aa8', '#ffd0ec', 'Foxglove', 'tall'], ['shroom', '#d8584a', '#fff0e0', 'Toadstool'], ['moss', '#4a8a4a', '#8ad87a', 'Moss'], ['reed', '#5a8a3a', '#8a5a2a', 'Cattail'], ['flower', '#ffffff', '#ffd84a', 'Daisy'], ['bush', '#2a6a3a', '#d83a5a', 'Bramble']],
    },
    ember: {
      guide: 'Ember Hollow', habs: { burrow: 'den', tree: 'charred', house: 'stone' },
      stag: { b: '#f4c898', d: '#d8946a', w: '#fff0d8', k: '#3a1a10', a: '#ffb060' },
      animals: [
        { id: 'fox', name: 'Red fox', spr: 'fox', beh: 'peek', hab: 'burrow', c: pal('red'), snd: 'yip' },
        { id: 'crow', name: 'Ash crow', spr: 'crow', beh: 'sit', at: .3, c: pal('black', { k: '#ffd27a', e: '#c8884a' }), snd: 'caw' },
        { id: 'tortoise', name: 'Cinder tortoise', spr: 'tortoise', beh: 'walk', range: [.32, .5], c: pal('tan', { a: '#8a7a68', b: '#4a3a30', w: '#d8c8a8' }), snd: 'snuffle' },
        { id: 'mouse', name: 'Hearth mouse', spr: 'mouse', beh: 'peek', hab: 'house', c: pal('grey', { a: '#a89080' }), snd: 'squeak' },
        { id: 'newt', name: 'Ember newt', spr: 'salamander', beh: 'walk', range: [.5, .7], magic: true, c: pal('red', { a: '#d84a2a', b: '#6a1a10', g: '#ffd24a' }), snd: 'crackle' },
        { id: 'cinderowl', name: 'Cinder owl', spr: 'owl', beh: 'peek', hab: 'tree', magic: true, night: true, c: pal('red', { a: '#4a2a28', b: '#241210', w: '#ff9a4a', k: '#ffe27a', e: '#ffb040' }), snd: 'hoot' },
        { id: 'wisp', name: 'Flame wisp', spr: 'wisp', beh: 'float', magic: true, c: pal('gold', { g: '#ff8a3a', w: '#ffe9a0' }), snd: 'crackle' },
        { id: 'stag', name: 'Ember stag', magic: true, builtin: true, snd: 'hoot' },
        { id: 'fairy', name: 'Ember sprites', magic: true, builtin: true, snd: 'crackle' },
      ],
      plants: [['tuft', '#8a6a3a', '#c8a45a', 'Ashgrass'], ['flower', '#ff7a2a', '#ffd24a', 'Ember lily', 'glow'], ['fern', '#8a4a2a', '#c8702a', 'Cinder fern'], ['flower', '#ff4a3a', '#ffb04a', 'Lava bloom', 'glow'], ['stump', '#3a2a22', '#ff7a2a', 'Smouldering stump'], ['shroom', '#c84a2a', '#ffd0a0', 'Red cap'], ['bush', '#5a3a28', '#ff7a2a', 'Thornbush'], ['reed', '#7a5a3a', '#ff9a4a', 'Smoke reed']],
    },
    frost: {
      guide: 'Frostglass', habs: { burrow: 'snow', tree: 'ice', house: 'igloo' },
      stag: { b: '#dff4ff', d: '#a8c8e8', w: '#ffffff', k: '#1a2a48', a: '#8ae8ff' },
      animals: [
        { id: 'hare', name: 'Snow hare', spr: 'rabbit', beh: 'peek', hab: 'burrow', c: pal('snow'), snd: 'squeak' },
        { id: 'snowyowl', name: 'Snowy owl', spr: 'owl', beh: 'peek', hab: 'tree', night: true, c: pal('snow', { a: '#f4f4f8', b: '#b0b8c8', e: '#ffb840', k: '#1a1a24' }), snd: 'hoot' },
        { id: 'ermine', name: 'Ermine', spr: 'weasel', beh: 'walk', range: [.3, .5], c: pal('snow', { a: '#f0e8dc', b: '#2a2a30' }), snd: 'squeak' },
        { id: 'fawn', name: 'Reindeer fawn', spr: 'deerling', beh: 'walk', range: [.4, .6], c: pal('snow', { a: '#d8c8b8', b: '#a89888', w: '#ffffff', k: '#3a2a20' }), snd: 'snuffle' },
        { id: 'bunting', name: 'Snow bunting', spr: 'finch', beh: 'sit', at: .66, c: pal('snow', { a: '#f4f0e8', b: '#4a4a52', e: '#e8a840' }), snd: 'chirp' },
        { id: 'auroramoth', name: 'Aurora moth', spr: 'moth', beh: 'visit', magic: true, c: pal('glow', { a: '#c8f0ff', b: '#7a9ad8', g: '#a8ffd8' }), snd: 'chime' },
        { id: 'icewisp', name: 'Ice wisp', spr: 'wisp', beh: 'float', magic: true, c: pal('glow'), snd: 'chime' },
        { id: 'stag', name: 'Ice stag', magic: true, builtin: true, snd: 'chime' },
        { id: 'fairy', name: 'Frost sprites', magic: true, builtin: true, snd: 'chime' },
      ],
      plants: [['fern', '#6aa8c8', '#d8f4ff', 'Frost fern'], ['crystal', '#8ad8ff', '#f0fcff', 'Ice crystal'], ['flower', '#ffffff', '#a8d8ff', 'Snowdrop', 'bell'], ['pine', '#2a5a5a', '#d8f0f0', 'Snow pine'], ['crystal', '#c8b8ff', '#f4f0ff', 'Rime spire'], ['bush', '#3a6a6a', '#e84a5a', 'Winterberry'], ['moss', '#6a9aa8', '#b8e0ea', 'Blue lichen'], ['reed', '#9ac0c8', '#e8f8ff', 'Frozen reed']],
    },
    violet: {
      guide: 'Violet Deep', habs: { burrow: 'root', tree: 'capdoor', house: 'cap' },
      stag: { b: '#e8d4ff', d: '#b898e0', w: '#ffffff', k: '#2a1048', a: '#e8a8ff' },
      animals: [
        { id: 'snail', name: 'Lantern snail', spr: 'snail', beh: 'walk', range: [.3, .45], c: pal('violet', { a: '#c8a8e8', b: '#7a5aa8', k: '#2a1a38' }), snd: 'bloop' },
        { id: 'toad', name: 'Mire toad', spr: 'frog', beh: 'hop', hab: 'pond', c: pal('violet', { a: '#7a8ac8', b: '#4a5a98', w: '#d8e0ff' }), snd: 'ribbit' },
        { id: 'bat', name: 'Cave bat', spr: 'bat', beh: 'fly', night: true, c: pal('violet', { a: '#5a4a88', b: '#2a1a48' }), snd: 'squeak' },
        { id: 'mouse', name: 'Cap mouse', spr: 'mouse', beh: 'peek', hab: 'house', c: pal('violet', { a: '#a898c8', b: '#6a5a98' }), snd: 'squeak' },
        { id: 'shroomling', name: 'Shroomling', spr: 'shroomling', beh: 'walk', range: [.45, .62], magic: true, c: pal('violet', { a: '#e868b8', b: '#9a2a78', w: '#fff0f8', k: '#3a1a38' }), snd: 'bloop' },
        { id: 'jelly', name: 'Glow jelly', spr: 'jelly', beh: 'float', magic: true, c: pal('violet', { a: '#a8d8ff', w: '#e8f8ff', g: '#a8d8ff' }), snd: 'bloop' },
        { id: 'sporemoth', name: 'Spore moth', spr: 'moth', beh: 'visit', magic: true, c: pal('violet', { a: '#e0c8ff', b: '#8a6ab8', g: '#ff9ad8' }), snd: 'chime' },
        { id: 'stag', name: 'Violet stag', magic: true, builtin: true, snd: 'chime' },
        { id: 'fairy', name: 'Spore sprites', magic: true, builtin: true, snd: 'bloop' },
      ],
      plants: [['shroom', '#e868b8', '#fff0f8', 'Glowcap', 'glow', 'tall'], ['moss', '#6a4aa8', '#b88aff', 'Glow moss'], ['pod', '#68d8e8', '#e8ffff', 'Bubble pod'], ['flower', '#b86aff', '#ffd0ff', 'Spore flower', 'glow'], ['fern', '#6a58b8', '#a8c8ff', 'Glow fern'], ['crystal', '#b86aff', '#f0d8ff', 'Amethyst'], ['bell', '#e868b8', '#ffc0ec', 'Dream bell'], ['reed', '#5a48a8', '#68d8e8', 'Lantern reed']],
    },
    gold: {
      guide: 'Golden Glade', habs: { burrow: 'mound', tree: 'hive', house: 'timber' },
      stag: { b: '#fff4d0', d: '#e8c880', w: '#ffffff', k: '#3a2a10', a: '#ffe27a' },
      animals: [
        { id: 'butterfly', name: 'Meadow butterflies', spr: 'butterfly', beh: 'visit', n: 3, c: pal('gold', { a: '#ff9a4a', b: '#6a3a1a', w: '#fff0c0' }), snd: 'flutter' },
        { id: 'bee', name: 'Honey bees', spr: 'bee', beh: 'visit', n: 2, c: pal('gold', { a: '#ffd24a', b: '#3a2a10', w: '#e8f8ff', k: '#1a1208' }), snd: 'buzz' },
        { id: 'finch', name: 'Goldfinch', spr: 'finch', beh: 'sit', at: .66, c: pal('gold', { a: '#ffd84a', b: '#4a3a1a', e: '#ff9a5a', w: '#fff4c0' }), snd: 'chirp' },
        { id: 'heron', name: 'Pond heron', spr: 'heron', beh: 'sit', at: 'pond', c: pal('grey', { a: '#c8d0d8', b: '#6a7480', e: '#e8a840', w: '#f0f4f8' }), snd: 'caw' },
        { id: 'hare', name: 'Golden hare', spr: 'rabbit', beh: 'peek', hab: 'burrow', c: pal('gold', { a: '#e8b868', b: '#a8762a', w: '#fff4d8' }), snd: 'squeak' },
        { id: 'fawn', name: 'Sun fawn', spr: 'deerling', beh: 'walk', range: [.36, .56], magic: true, c: pal('gold', { a: '#f4d088', b: '#c8984a', w: '#fffbe8', k: '#3a2a10', g: '#fff1a8' }), snd: 'chime' },
        { id: 'honeysprite', name: 'Honey sprite', spr: 'wisp', beh: 'float', magic: true, c: pal('gold', { g: '#ffd24a', w: '#fffbe0' }), snd: 'chime' },
        { id: 'stag', name: 'Sun stag', magic: true, builtin: true, snd: 'chime' },
        { id: 'fairy', name: 'Glade fairies', magic: true, builtin: true, snd: 'chime' },
      ],
      plants: [['flower', '#ffd24a', '#a86a1a', 'Sunflower', 'tall'], ['tuft', '#d8b84a', '#fff0a0', 'Wheat grass'], ['flower', '#fff04a', '#ffb02a', 'Buttercup'], ['bush', '#6a9a3a', '#ffd24a', 'Honey blossom'], ['fern', '#a8a83a', '#ffe27a', 'Golden fern'], ['bell', '#b88aff', '#e8d4ff', 'Lavender'], ['puff', '#fff8e0', '#d8c890', 'Dandelion'], ['bell', '#ffb04a', '#ffe8a0', 'Wind chime bloom']],
    },
  };
  /* the cottage that grows with the main goal, as stages: each piece shows once the goal reaches its share */
  let c0 = null, W = 0, H = 0, T = null, Lr = null, realm = 'wood', mood = 'day', ents = [], plants = [], habs = [], parts = [], pond = [], gust = 0, wind = 0, tip = null, tipT = 0, f = 0, hover = null, prog = 0;
  const hexL = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixh = (a, b, t) => { const A = hexL(a), C = hexL(b); return '#' + A.map((v, i) => Math.round(v + (C[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const disk = (c, x0, y0, rad, col) => { c.fillStyle = col; for (let y = -rad; y <= rad; y++) { const w = Math.round(Math.sqrt(rad * rad - y * y)); c.fillRect(Math.round(x0 - w), Math.round(y0 + y), w * 2 + 1, 1); } };
  const glow = (c, x, y, r, col, a) => { for (let k = r; k >= 1; k--) { c.globalAlpha = a * (1 - k / (r + 1)) * .5; disk(c, x, y, k, col); } c.globalAlpha = 1; };
  const rnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const nightish = () => mood === 'night' || mood === 'sunset';
  const dim = col => (mood === 'night' ? mixh(col, '#0a1430', .42) : mood === 'sunset' ? mixh(col, '#4a2a5a', .16) : mood === 'morning' ? mixh(col, '#fff0d0', .06) : col);
  const spec = () => CAST[realm] || CAST.wood;
  const px = (x, y, col) => { c0.fillStyle = col; c0.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const rect = (x, y, w, h, col) => { c0.fillStyle = col; c0.fillRect(Math.round(x), Math.round(y), w, h); };
  /* draw a sprite: frame, position (feet centre), colours, mirrored, only the top `clip` rows (for something looking out of a hole) */
  function spr(name, fr, x, y, cols, flip, clip, glowCol) {
    const S = SPR[name]; if (!S) return; const g = S[fr % S.length], w = g[0].length, x0 = Math.round(x - w / 2), y0 = Math.round(y - g.length);
    for (let j = 0; j < g.length; j++) { if (clip && j >= clip) break; const row = g[j]; for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.') continue; const col = cols[ch]; if (!col) continue; px(x0 + (flip ? row.length - 1 - i : i), y0 + j, col); } }
    if (glowCol) glow(c0, Math.round(x), Math.round(y - g.length / 2), Math.round(g.length * .9 + 2), glowCol, .55);
  }
  const part = (x, y, vx, vy, life, col, kind) => { if (parts.length < 260) parts.push({ x, y, vx, vy, life, max: life, col, kind: kind || 'dot' }); };
  const burst = (x, y, n, col, sp, up) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = (.3 + Math.random()) * (sp || 1); part(x, y, Math.cos(a) * s, Math.sin(a) * s - (up || 0), 8 + Math.floor(Math.random() * 8), col); } };

  /* ---------- homes ---------- */
  const floorY = () => Lr.floor + 3;
  function layoutHabs() {
    const wide = Lr.wide, X = v => Math.round(W * v), y = floorY(); habs = [];
    const spots = wide ? { burrow: .215, tree: .4, house: .305, log: .445 } : { burrow: .22, tree: .44, house: .32, log: .5 };
    const sp = spec().habs;
    habs.push({ id: 'burrow', type: sp.burrow, x: X(spots.burrow), y, w: 15, owner: null });
    habs.push({ id: 'tree', type: sp.tree, x: X(spots.tree), y, w: 13, owner: null });
    habs.push({ id: 'house', type: sp.house, x: X(spots.house), y: y + 4, w: 14, owner: null });
  }
  /* the still painting of the homes: part of the scene's still layer, so it sits behind the creatures and in front of the forest */
  function paintHabs(c, t) {
    c0 = c; const R = rnd(55);
    for (const h of habs) {
      const x = h.x, y = h.y;
      if (h.id === 'burrow') {
        const earth = h.type === 'snow' ? '#e8f0f8' : h.type === 'den' ? mixh(t.stoneD, '#5a2a1a', .4) : t.ground, edge = h.type === 'snow' ? '#b8c8dc' : t.groundD, top = h.type === 'snow' ? '#ffffff' : t.groundL;
        for (let j = 0; j < 9; j++) { const w = Math.round(8 - j * .3 + Math.sqrt(Math.max(0, 9 - (8 - j) * (8 - j)) ) * .8); rect(x - w, y - 9 + j, w * 2, 1, j < 2 ? top : earth); px(x - w, y - 9 + j, edge); px(x + w - 1, y - 9 + j, edge); }
        rect(x - 8, y - 1, 16, 2, edge);
        rect(x - 3, y - 6, 6, 6, '#120c0a'); rect(x - 2, y - 7, 4, 1, '#120c0a'); rect(x - 4, y - 6, 1, 6, mixh(edge, '#000000', .3)); rect(x + 3, y - 6, 1, 6, mixh(edge, '#000000', .3));
        px(x - 4, y - 7, top); px(x + 3, y - 7, top);
        if (h.type !== 'snow') for (let i = 0; i < 6; i++) px(x - 7 + Math.floor(R() * 14), y - 9 + Math.floor(R() * 3), t.moss);
      } else if (h.id === 'tree') {
        /* a thick old trunk from the canopy to the ground with a hollow and a little door */
        const bark = h.type === 'ice' ? '#8ab8d8' : h.type === 'capdoor' ? '#e8b8e8' : h.type === 'charred' ? '#2a2220' : t.trunk, barkD = h.type === 'ice' ? '#5a88a8' : h.type === 'capdoor' ? '#a878b0' : h.type === 'charred' ? '#161012' : t.trunkD, barkL = h.type === 'ice' ? '#d8f0ff' : h.type === 'capdoor' ? '#ffe8ff' : h.type === 'charred' ? '#4a3a34' : t.trunkL;
        const top = 0, w = 7;
        if (h.type === 'capdoor') { for (let yy = y - 22; yy < y; yy++) { const ww = 5 + (yy > y - 5 ? 2 : 0); rect(x - ww, yy, ww * 2, 1, yy < y - 14 ? barkL : bark); px(x - ww, yy, barkD); px(x + ww - 1, yy, barkD); }
          for (let j = 0; j < 8; j++) { const ww = Math.round(15 - j * 1.1 - (j > 5 ? j - 5 : 0)); rect(x - ww, y - 30 + j, ww * 2, 1, j < 2 ? mixh(t.mossL, '#ffd0ff', .5) : j < 5 ? '#d868c8' : '#a8409a'); }
          for (let i = 0; i < 6; i++) px(x - 10 + Math.floor(R() * 20), y - 29 + Math.floor(R() * 5), '#fff0f8');
        } else {
          const top2 = Math.round(Lr.hz * .62), leafA = h.type === 'ice' ? '#bfe4f4' : h.type === 'charred' ? null : t.leafD, leafB = h.type === 'ice' ? '#e8f8ff' : h.type === 'charred' ? null : t.leaf, leafC = h.type === 'ice' ? '#ffffff' : t.mossL;
          for (let yy = top2; yy < y; yy++) { const fl = yy > y - 12 ? Math.round((yy - (y - 12)) * .75) : 0, bulge = Math.round(Math.sin((yy - top2) / 14) * 1.2), ww = w + fl + bulge - (yy < top2 + 10 ? Math.round((top2 + 10 - yy) * .25) : 0); rect(x - ww, yy, ww * 2, 1, bark); rect(x - ww, yy, 2, 1, barkL); rect(x + ww - 3, yy, 3, 1, barkD); if (R() < .28) px(x - ww + 3 + Math.floor(R() * (ww * 2 - 6)), yy, barkD); if ((yy - top2) % 6 === 0) rect(x - ww + 2, yy, Math.max(1, Math.floor(ww * .8)), 1, barkL); }
          for (let k = 0; k < 4; k++) rect(x - 11 + k * 6, y - 1, 6, 2, barkD);
          /* the crown: three limbs reaching up and out, ending in leaf clumps (bare and ashen in the Hollow) */
          for (const [sd, len, rise] of [[-1, 17, .8], [1, 19, .7], [0, 13, 1.7]]) { let bx = x + sd * 3, by = top2 + 2; const pts = []; for (let j = 0; j < len; j++) { bx += sd * .85 + (sd === 0 ? Math.sin(j / 3) * .3 : 0); by -= rise * .55; for (let q = 0; q < Math.max(1, 3 - Math.floor(j / 6)); q++) px(Math.round(bx) + q - 1, Math.round(by), q === 0 ? barkL : j % 2 ? bark : barkD); if (j > 5 && j % 4 === 0) pts.push([bx, by]); }
            if (leafA) { disk(c, Math.round(bx), Math.round(by) - 1, 7, leafA); disk(c, Math.round(bx) - 1, Math.round(by) - 2, 5, leafB); px(Math.round(bx) - 3, Math.round(by) - 4, leafC); px(Math.round(bx) - 2, Math.round(by) - 4, leafC); for (const [qx, qy] of pts) disk(c, Math.round(qx) + sd * 2, Math.round(qy) - 2, 3, leafB); }
            else for (const [qx, qy] of pts) for (let q = 1; q <= 4; q++) px(Math.round(qx + (q % 2 ? 1 : -1) * q * .8), Math.round(qy - q * .9), barkD); }
          for (let yy = top2 + 14; yy < y - 8; yy += 3) if (R() < .5) px(x - w + 2 + Math.floor(R() * 10), yy, h.type === 'ice' ? '#ffffff' : t.moss);
        }
        h.hole = { x, y: y - 11, w: 5, h: 8 };
        rect(x - 5, y - 19, 10, 9, '#0c0806'); rect(x - 4, y - 20, 8, 1, '#0c0806'); rect(x - 6, y - 18, 1, 7, barkD); rect(x + 5, y - 18, 1, 7, barkD); rect(x - 5, y - 10, 10, 1, barkL);
        h.hole = { x, y: y - 10 };
      } else {
        /* a little house */
        const wall = h.type === 'stone' ? '#8a7a76' : h.type === 'igloo' ? '#e8f4ff' : h.type === 'cap' ? '#f0e0f0' : '#c8a070', wallD = h.type === 'stone' ? '#5a4a48' : h.type === 'igloo' ? '#a8c0dc' : h.type === 'cap' ? '#b898c0' : '#8a6a44', roof = h.type === 'stone' ? '#5a3a30' : h.type === 'igloo' ? '#ffffff' : h.type === 'cap' ? '#e858b8' : t.mossD;
        if (h.type === 'igloo') { for (let j = 0; j < 9; j++) { const w = Math.round(Math.sqrt(Math.max(0, 81 - (8 - j) * (8 - j))) * .95 + 1); rect(x - w, y - 9 + j, w * 2, 1, j < 3 ? '#ffffff' : wall); px(x - w, y - 9 + j, wallD); px(x + w - 1, y - 9 + j, wallD); if (j % 3 === 1) rect(x - w + 1, y - 9 + j, w * 2 - 2, 1, wallD); } }
        else { rect(x - 7, y - 9, 14, 9, wall); rect(x - 7, y - 9, 14, 1, mixh(wall, '#ffffff', .25)); for (let j = 0; j < 9; j += 3) rect(x - 7, y - 9 + j + 2, 14, 1, wallD); rect(x - 7, y - 9, 1, 9, mixh(wall, '#ffffff', .15)); rect(x + 6, y - 9, 1, 9, wallD);
          for (let j = 0; j < 6; j++) { const w = 9 - j; rect(x - w, y - 15 + j, w * 2, 1, j === 0 ? mixh(roof, '#ffffff', .25) : roof); } px(x - 9, y - 10, roof); px(x + 8, y - 10, roof);
          if (h.type === 'timber' || h.type === 'stone') { rect(x + 3, y - 18, 2, 4, wallD); } }
        h.door = { x: x - 1, y: y - 1 };
        rect(x - 3, y - 6, 6, 6, '#2a1a10'); rect(x - 2, y - 7, 4, 1, '#2a1a10'); px(x + 1, y - 3, '#ffd27a');
        h.win = { x: x + 3, y: y - 7 };
        rect(x + 2, y - 8, 3, 3, '#ffe9a0'); px(x + 3, y - 8, '#8a6a44'); rect(x + 3, y - 7, 1, 1, '#8a6a44');
        for (let i = 0; i < 3; i++) px(x - 6 + Math.floor(R() * 12), y - 14, t.moss);
      }
    }
  }

  /* ---------- plants ---------- */
  function layoutPlants() {
    plants = []; const R = rnd(91), Q = Lr.fall.pool, wide = Lr.wide, per = wide ? 5 : 2, ys0 = Lr.floor + 2, ys1 = H - 4;
    const avoid = (x, y) => (Math.abs(x - W / 2) < (wide ? 20 : 16) && y > H * .82) || habs.some(h => Math.abs(x - h.x) < 11 && y < h.y + 8 && y > h.y - 3) || (x > Q.cx - Q.rx - 2 && y < Q.y0 + Q.ryh + 3 && x < Q.cx + Q.rx + 4 && y > Q.y0 - 4);
    spec().plants.forEach((p, i) => {
      const [kind, a, b, name, opt, opt2] = p;
      for (let k = 0; k < per; k++) {
        let x, y, tries = 0; do { x = Math.round(8 + R() * (W - 16)); y = Math.round(ys0 + R() * (ys1 - ys0)); tries++; } while (avoid(x, y) && tries < 20); if (tries >= 20) continue;
        plants.push({ kind, a, b, name: name || kind, opt, opt2, x, y, sz: .8 + R() * .5, ph: R() * 6.28, kick: 0, id: i, h: kind === 'reed' || opt === 'tall' || opt2 === 'tall' ? 8 + Math.floor(R() * 5) : 4 + Math.floor(R() * 4) });
      }
    });
    plants.sort((p, q) => p.y - q.y);
  }
  /* one plant, swaying: the base is fixed, the top moves with the wind (more of it for taller things) */
  function drawPlant(p) {
    const t = T, a = dim(p.a), b = dim(p.b), sw = Math.round(Math.sin(f / 5 + p.ph) * (.5 + wind * 1.4 + gust * 2) + p.kick * Math.sin(f * .9) * 1.6), x = p.x, y = p.y, h = p.h, glowy = p.opt === 'glow' && (mood !== 'day');
    const lean = k => Math.round(sw * k);
    switch (p.kind) {
      case 'fern': for (let d = -1; d <= 1; d++) { const L2 = 5 + (d === 0 ? 2 : 0); for (let j = 0; j < L2; j++) px(x + d * (j * .8) + lean(j / L2), y - j * (d === 0 ? 1 : .7), j % 2 ? a : b); } break;
      case 'tuft': for (let d = -2; d <= 2; d++) for (let j = 0; j < h - Math.abs(d); j++) px(x + d + lean(j / h) * (1 + Math.abs(d) * .2), y - j, j > h - 3 ? b : a); break;
      case 'moss': for (let i = -3; i <= 3; i++) { const hh = 2 - Math.floor(Math.abs(i) / 2); for (let j = 0; j < hh; j++) px(x + i, y - j, j === hh - 1 ? b : a); } if (glowy || p.opt === 'glow') px(x + Math.round(Math.sin(f / 7 + p.ph) * 2), y - 2, b); break;
      case 'flower': { for (let j = 0; j < h; j++) px(x + lean(j / h), y - j, '#3a7a3a'); if (h > 6) { px(x + 2 + lean(.6), y - 3, '#3a7a3a'); px(x + 1 + lean(.5), y - 3, '#3a7a3a'); }
        const hx = x + lean(1), hy = y - h; const big = p.opt === 'tall' || p.name === 'Sunflower';
        if (glowy) glow(c0, hx, hy, 5, b === '#ffd24a' ? '#ffd24a' : a, .55);
        for (const [dx, dy] of big ? [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]] : [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(hx + dx, hy + dy, a); rect(hx - (big ? 1 : 0), hy - (big ? 1 : 0), big ? 3 : 1, big ? 3 : 1, b); } break;
      case 'bell': { for (let j = 0; j < h; j++) px(x + lean(j / h * .6) + (j > h - 3 ? 1 : 0), y - j, '#3a7a3a'); const bx = x + lean(.8) + 1; for (let k = 0; k < 3; k++) { const yy = y - h + 1 + k * 2, xx = bx + (k % 2 ? -2 : 1); px(xx, yy, a); px(xx, yy + 1, b); px(xx + (k % 2 ? 1 : -1), yy + 1, a); } if (glowy) glow(c0, bx, y - h + 3, 4, a, .5); } break;
      case 'shroom': { const w2 = Math.round(2 + (h > 6 ? 2 : 1) * p.sz); rect(x - 1, y - 3, 2, 3, mixh(b, '#8a6a4a', .3)); for (let i = -w2; i <= w2; i++) { const hh = Math.round(Math.sqrt(Math.max(0, w2 * w2 - i * i)) * .9) + 1; for (let j = 0; j < hh; j++) px(x + i, y - 3 - j, j === hh - 1 ? mixh(a, '#ffffff', .25) : a); } px(x - 1, y - 5, b); px(x + 1, y - 4, b); if (p.opt === 'glow') { glow(c0, x, y - 4, 6, a, mood === 'day' ? .25 : .7); } } break;
      case 'reed': for (let j = 0; j < h; j++) px(x + lean(j / h), y - j, j > h - 3 ? b : a); rect(x + lean(1) - 1 + 0, y - h - 2, 2, 3, b); if (p.opt === 'glow' || p.b === '#ff9a4a') px(x + lean(1), y - h - 3, '#ffd24a'); break;
      case 'bush': { const r = Math.round(3 * p.sz) + 1; disk(c0, x, y - r, r, mixh(a, '#000000', .15)); disk(c0, x - 1, y - r - 1, Math.max(1, r - 1), a); px(x - 2, y - r - 2, mixh(a, '#ffffff', .3)); for (let i = 0; i < 3; i++) px(x - r + 1 + i * 2, y - r + (i % 2), b); } break;
      case 'crystal': { const hh = 4 + (p.id % 3) * 2; for (let k = -1; k <= 1; k++) { const kh = hh - Math.abs(k) * 2; for (let j = 0; j < kh; j++) { const w3 = j > kh - 3 ? 0 : 1; px(x + k * 2, y - j, j % 3 === 0 ? b : a); if (w3 && k === 0) px(x + k * 2 + 1, y - j, a); } px(x + k * 2, y - kh, b); } if ((f + p.id * 5) % 9 < 2) px(x + 1, y - hh + 1, '#ffffff'); if (glowy || mood === 'night') glow(c0, x, y - 4, 5, a, .4); } break;
      case 'pod': for (let j = 0; j < 4; j++) px(x + lean(j / 4), y - j, '#3a7a6a'); disk(c0, x + lean(1), y - 6, 2, a); px(x + lean(1) - 1, y - 7, b); if (mood !== 'day') glow(c0, x + lean(1), y - 6, 5, a, .5); break;
      case 'pine': { const hh = 7 + Math.floor(p.sz * 4); for (let j = 0; j < hh; j++) { const w4 = Math.floor((hh - j) / 2.2) + (j === hh - 1 ? 0 : 1); for (let i = -w4; i <= w4; i++) px(x + i + (j > hh - 4 ? lean(.5) : 0), y - 2 - j, (i + j) % 3 === 0 || j % 3 === 2 ? b : a); } rect(x - 1, y - 2, 2, 2, '#3a2a20'); } break;
      case 'stump': { rect(x - 3, y - 4, 6, 4, a); rect(x - 3, y - 5, 6, 1, mixh(a, '#ffffff', .2)); px(x - 3, y - 4, mixh(a, '#000000', .3)); const e = (f + p.id * 3) % 6; if (e < 4) { glow(c0, x, y - 5, 5, b, .6); px(x - 1 + (e % 3), y - 5, b); px(x + 1, y - 6 - (e % 2), '#ffd24a'); } if (f % 11 === p.id % 11) part(x, y - 6, Math.random() * .4 - .2, -.5, 10, '#ffb04a'); } break;
      case 'lily': { rect(x - 3, y - 1, 7, 1, a); rect(x - 2, y - 2, 5, 1, a); px(x + 1, y - 2, mixh(a, '#000000', .3)); if (p.opt === 'flower') { px(x - 1, y - 3, b); px(x, y - 4, b); px(x + 1, y - 3, b); } } break;
      case 'puff': { for (let j = 0; j < h; j++) px(x + lean(j / h * .6), y - j, '#6a9a3a'); disk(c0, x + lean(.7), y - h - 1, 2, a); px(x + lean(.7) - 1, y - h - 2, '#ffffff'); if (f % 40 === (p.id * 7) % 40) part(x + lean(.7), y - h - 1, .5, -.2, 16, '#fff8e0'); } break;
    }
  }

  /* ---------- the cast ---------- */
  function mkEnt(a, i, R) {
    const wide = Lr.wide, e = { a, id: a.id, name: a.name, x: 0, y: 0, vx: 0, st: 'in', t: 0, fr: 0, flip: false, ph: R() * 100, kick: 0, hab: null, sp: a.spr };
    const fl = floorY();
    if (a.beh === 'peek') { e.hab = habs.find(h => h.id === a.hab); e.st = 'in'; e.t = 6 + Math.floor(R() * 50); if (!e.hab) return null; e.x = e.hab.x; e.y = e.hab.y; }
    else if (a.beh === 'walk') { const [r0, r1] = a.range; e.x0 = Math.round(W * r0); e.x1 = Math.round(W * r1); e.x = e.x0 + R() * (e.x1 - e.x0); e.y = fl + 6 + Math.floor(R() * 8); e.st = 'pause'; e.t = 4 + Math.floor(R() * 20); e.tx = e.x; }
    else if (a.beh === 'sit') { const stumpX = typeof a.at === 'number' ? Math.round(W * a.at) : Lr.fall.pool.cx - Lr.fall.pool.rx + 4; e.x = stumpX; e.y = a.at === 'pond' ? Lr.fall.pool.y0 + 7 : fl + 4 + Math.floor(R() * 6); e.t = 8 + Math.floor(R() * 40); e.st = 'sit'; }
    else if (a.beh === 'hop') { const Q = Lr.fall.pool; e.pad = { x: Q.cx - Math.round(Q.rx * .4) + (i % 2) * 14, y: Q.y0 + Math.round(Q.ryh * .6) + (i % 2) * 2 }; e.x = e.pad.x; e.y = e.pad.y; e.st = 'sit'; e.t = 10 + Math.floor(R() * 40); }
    else if (a.beh === 'visit') { e.x = W * (.2 + R() * .55); e.y = Lr.hz + 20 + R() * 30; e.st = 'fly'; e.tx = e.x; e.ty = e.y; e.t = 0; }
    else if (a.beh === 'fly') { e.cx = W * (.3 + R() * .35); e.cy = Lr.hz + 12 + R() * 22; e.rx = 20 + R() * 40; e.ry = 6 + R() * 8; e.sp = 'bat'; e.sp2 = a.spr; e.sp = a.spr; e.x = e.cx; e.y = e.cy; }
    else if (a.beh === 'float') { e.x = W * (.2 + R() * .5); e.y = Lr.hz * .8 + R() * Lr.hz * .6; e.cx = e.x; e.cy = e.y; }
    return e;
  }
  function layoutLife() {
    ents = []; const R = rnd(33), s = spec(), cast = s.animals.filter(a => !a.builtin), lim = Lr.wide ? 99 : 6;
    cast.forEach((a, i) => { if (ents.length >= lim) return; for (let n = 0; n < (a.n || 1); n++) { const e = mkEnt(a, i + n, R); if (e) { if (n) { e.x += n * 10; e.ph += n * 17; } ents.push(e); } } });
    /* the lake has life of its own: a fish that leaps now and then */
    pond = [{ t: 20 + Math.floor(R() * 60), st: 0, x: 0, y: 0, ph: 0 }];
  }
  const dayHere = a => !a.night || nightish() || Math.random() < .08;
  function stepEnt(e) {
    const a = e.a, F = Lr.fall, Q = F.pool;
    if (e.kick > 0) e.kick--;
    if (a.beh === 'peek') {
      if (--e.t > 0) { if (e.st === 'out' || e.st === 'back') walkOut(e); return; }
      if (e.st === 'in') { if (dayHere(a) && !(scrollOpen())) { e.st = 'peek'; e.t = 12 + Math.floor(Math.random() * 14); } else e.t = 10 + Math.floor(Math.random() * 40); }
      else if (e.st === 'peek') { if (Math.random() < .55) { e.st = 'out'; e.dir = Math.random() < .5 ? -1 : 1; e.dist = 8 + Math.floor(Math.random() * 14); e.t = 30; e.ox = 0; } else { e.st = 'in'; e.t = 40 + Math.floor(Math.random() * 150); } }
      else if (e.st === 'out') { e.st = 'forage'; e.t = 20 + Math.floor(Math.random() * 30); }
      else if (e.st === 'forage') { e.st = 'back'; e.t = 40; }
      else if (e.st === 'back') { e.st = 'in'; e.t = 50 + Math.floor(Math.random() * 160); e.ox = 0; }
    } else if (a.beh === 'walk') {
      if (e.st === 'pause') { if (--e.t <= 0) { e.tx = e.x0 + Math.random() * (e.x1 - e.x0); e.st = 'go'; } }
      else { const d = e.tx - e.x, sp = e.kick > 0 ? 2.2 : (a.id === 'snail' || a.id === 'tortoise' ? .35 : .8); if (Math.abs(d) < 1) { e.st = 'pause'; e.t = 12 + Math.floor(Math.random() * 50); } else { e.x += Math.sign(d) * Math.min(Math.abs(d), sp); e.flip = d < 0; e.fr = (e.fr + 1) % 2; } }
    } else if (a.beh === 'sit') {
      if (--e.t <= 0) { e.t = 8 + Math.floor(Math.random() * 40); e.fr = e.fr ? 0 : 1; if (e.fr === 0 && Math.random() < .3) { e.flip = !e.flip; } if (e.fr && a.snd && Math.random() < .35 && !scrollOpen()) amb(a.snd, e.x, .5); }
    } else if (a.beh === 'hop') {
      if (--e.t <= 0) {
        if (e.st === 'sit') { e.fr = 1; e.t = 4; e.st = 'croak'; if (Math.random() < .5) amb(a.snd, e.x, .6); } else if (e.st === 'croak') { e.fr = 0; e.st = 'sit'; e.t = 20 + Math.floor(Math.random() * 80); if (Math.random() < .25) { e.st = 'jump'; e.t = 8; e.jx = e.x; e.tx = Q.cx + (Math.random() - .5) * Q.rx * .8; e.ty = Q.y0 + Q.ryh * (.35 + Math.random() * .4); } }
        else if (e.st === 'jump') { e.x = e.tx; e.y = e.ty; e.st = 'sit'; e.t = 20; splash(e.x, e.y); }
      }
      if (e.st === 'jump') { const u = 1 - e.t / 8; e.x = e.jx + (e.tx - e.jx) * u; e.yo = -Math.sin(u * Math.PI) * 6; } else e.yo = 0;
    } else if (a.beh === 'visit') {
      const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy); e.fr = (e.fr + 1) % 2;
      if (e.hover > 0) { e.hover--; if (e.hover === 0) pickTarget(e); }
      else if (d < 2) { e.hover = 6 + Math.floor(Math.random() * 14); if (e.pl) { e.pl.kick = 6; if (Math.random() < .5) part(e.x, e.y, 0, -.3, 10, e.a.c.g || '#ffe27a'); } }
      else { const sp = a.id === 'bee' ? 2.6 : 1.5; e.x += dx / d * sp + Math.sin((f + e.ph) / 3) * .5; e.y += dy / d * sp + Math.cos((f + e.ph) / 4) * .5; e.flip = dx < 0; }
      if (!e.tx || (e.hover === undefined)) pickTarget(e);
    } else if (a.beh === 'fly') { e.fa = (e.fa || 0) + .06; e.x = e.cx + Math.cos(e.fa + e.ph) * e.rx; e.y = e.cy + Math.sin(e.fa * 1.7 + e.ph) * e.ry; e.flip = Math.sin(e.fa + e.ph) > 0; e.fr = (e.fr + 1) % 2; }
    else if (a.beh === 'float') { e.fa = (e.fa || 0) + .04; e.x = e.cx + Math.sin(e.fa + e.ph) * 14 + e.fa * .6 % 1; e.y = e.cy + Math.sin(e.fa * 1.3 + e.ph) * 5; e.cx += .06; if (e.cx > W * .9) e.cx = W * .1; e.fr = (f >> 1) % 2; }
  }
  function pickTarget(e) {
    const flowers = plants.filter(p => p.kind === 'flower' || p.kind === 'bell' || p.kind === 'puff' || p.kind === 'shroom' || p.kind === 'pod' || p.kind === 'crystal');
    if (flowers.length && Math.random() < .75) { const p = flowers[Math.floor(Math.random() * flowers.length)]; e.pl = p; e.tx = p.x; e.ty = p.y - p.h - 2; } else { e.pl = null; e.tx = W * (.15 + Math.random() * .7); e.ty = Lr.hz + 15 + Math.random() * 45; }
    e.hover = 0;
  }
  function walkOut(e) { if (e.st === 'out') { const k = Math.min(1, 1 - e.t / 30); e.ox = e.dir * e.dist * k; } else if (e.st === 'back') { e.ox *= .88; } }
  const scrollOpen = () => document.body.classList.contains('world') && !document.body.classList.contains('shut');
  function splash(x, y) { burst(x, y, 6, '#ffffff', .8, .6); amb('splash', x, .5); }
  const amb = (n, x, v, k) => { try { if (typeof AMBI !== 'undefined') AMBI.sound(n, x / W, v, k); } catch (e) { /* sound is a bonus */ } };

  /* ---------- drawing ---------- */
  function drawEnt(e) {
    const a = e.a, cols = {}; for (const k in a.c) cols[k] = dim(a.c[k]);
    const glowy = a.magic && (a.id !== 'bee') ? (a.c.g) : null, nightGlow = glowy && mood !== 'day' ? glowy : null;
    if (a.beh === 'peek') {
      const h = e.hab; if (!h) return; const S = SPR[e.sp][0], hh = S.length, hole = h.id === 'tree' ? { x: h.x, y: h.y - 10 } : h.id === 'house' ? { x: h.x, y: h.y - 3 } : { x: h.x, y: h.y - 1 };
      if (e.st === 'peek') { const k = Math.min(1, (e.t > 20 ? 1 : e.t / 6)), rise = Math.round(Math.min(hh, 3 + (1 - Math.abs(Math.sin((e.t) / 4))) * 2 + (e.t < 24 ? 3 : 0))); spr(e.sp, Math.floor(f / 3) % 2, hole.x, hole.y + (hh - rise) * (h.id === 'tree' ? 0 : 1) * 0 + (h.id === 'tree' ? 0 : 0), cols, false, h.id === 'tree' ? Math.max(5, rise + 2) : rise + 1, nightGlow); }
      else if (e.st === 'out' || e.st === 'forage' || e.st === 'back') { if (h.id === 'tree') { /* an owl does not walk: it flies out and back */ const k = e.st === 'forage' ? 1 : (e.st === 'out' ? 1 - e.t / 30 : e.t / 40); const ex = hole.x + (e.dir || 1) * 30 * Math.sin(k * 1.6), ey = hole.y - 14 * Math.sin(k * Math.PI); spr(e.sp, f % 2, ex, ey, cols, (e.dir || 1) < 0, 0, nightGlow); }
        else { const bob = e.st === 'forage' ? (f % 4 < 2 ? 0 : 0) : (f % 2 ? -1 : 0), y = h.y + 2 + bob; spr(e.sp, e.st === 'forage' ? (f >> 1) % 2 : f % 2, hole.x + (e.ox || 0), y, cols, (e.dir || 1) < 0, 0, nightGlow); if (e.st === 'forage' && Math.random() < .05) part(hole.x + (e.ox || 0), y - 2, 0, -.3, 7, '#7acc6a'); } }
      else if (e.kick > 0) { /* ducked */ }
      /* a lit window or a knock: the house shows who is home */
      return;
    }
    if (a.beh === 'walk') { const hop = e.id === 'rabbit' || a.id === 'hare' ? 0 : 0; spr(e.sp, e.fr, e.x, e.y + (e.st === 'go' && f % 2 ? -1 : 0), cols, e.flip, 0, nightGlow); if (a.id === 'newt' && f % 3 === 0) part(e.x - (e.flip ? -3 : 3), e.y - 2, 0, -.2, 7, '#ff9a3a'); if (a.id === 'shroomling' && mood !== 'day') glow(c0, e.x, e.y - 4, 6, '#ff9ad8', .35); return; }
    if (a.beh === 'sit') { spr(e.sp, e.fr, e.x, e.y, cols, e.flip, 0, nightGlow); return; }
    if (a.beh === 'hop') { spr(e.sp, e.fr, e.x, e.y + (e.yo || 0) , cols, e.flip, 0, null); return; }
    if (a.beh === 'visit') { if (a.id === 'bee' || a.id === 'butterfly') { spr(e.sp, e.fr, e.x, e.y, cols, e.flip, 0, null); } else { if (nightGlow || a.magic) glow(c0, Math.round(e.x), Math.round(e.y - 2), 7, a.c.g, mood === 'day' ? .25 : .6); spr(e.sp, e.fr, e.x, e.y, cols, e.flip, 0, null); if (f % 3 === 0) part(e.x, e.y, 0, .15, 9, a.c.g); } return; }
    if (a.beh === 'fly') { if (a.night && !nightish() && !(e.kick > 0)) return; spr(e.sp, e.fr, e.x, e.y, cols, e.flip, 0, null); return; }
    if (a.beh === 'float') { glow(c0, Math.round(e.x), Math.round(e.y - 3), 9, a.c.g, mood === 'day' ? .35 : .75); spr(e.sp, e.fr, e.x, e.y, cols, false, 0, null); if (f % 5 === 0) part(e.x + Math.random() * 4 - 2, e.y, 0, -.15, 12, a.c.g); }
  }
  function drawPond() {
    const Q = Lr.fall.pool;
    for (const p of pond) { if (p.st === 0) { if (--p.t <= 0) { p.st = 1; p.ph = 0; p.x = Q.cx + Math.round((Math.random() - .5) * Q.rx * 1.1); p.y = Q.y0 + Math.round(Q.ryh * (.35 + Math.random() * .45)); } continue; }
      p.ph++; const u = p.ph / 9, yy = p.y - Math.sin(Math.min(1, u) * Math.PI) * 9, xx = p.x + u * 5; const col = dim(realm === 'violet' ? '#a8f0ff' : realm === 'gold' ? '#ffd24a' : realm === 'ember' ? '#ff9a4a' : '#c8e0f0');
      if (p.ph < 10) { rect(xx - 2, yy - 1, 4, 1, col); px(xx + 2, yy - 2, col); px(xx - 3, yy, mixh(col, '#000000', .3)); px(xx, yy, '#ffffff'); }
      if (p.ph === 1 || p.ph === 10) { splash(xx, p.y); }
      if (p.ph > 14) { p.st = 0; p.t = 60 + Math.floor(Math.random() * 120); } }
  }
  function draw(ctx, fr, mo) {
    if (!habs.length) return; c0 = ctx; f = fr; mood = mo;
    wind = .35 + .25 * Math.sin(f / 70); gust = Math.max(0, gust - .03);
    /* plants behind, creatures in front, sorted by how far down the screen they stand */
    for (const p of plants) { if (p.kick > 0) p.kick -= .08; if (p.kick < 0) p.kick = 0; }
    for (const e of ents) { if (f % 1 === 0) stepEnt(e); if (e.a.beh === 'walk' || e.a.beh === 'sit') for (const p of plants) { if (Math.abs(p.x - e.x) < 5 && Math.abs(p.y - e.y) < 4 && p.kick < .5) { p.kick = 1; } } }
    const rows = [];
    for (const p of plants) rows.push([p.y, () => drawPlant(p)]);
    for (const e of ents) rows.push([(e.a.beh === 'peek' ? e.hab.y + 3 : e.y), () => drawEnt(e)]);
    rows.sort((a, b) => a[0] - b[0]); for (const r of rows) r[1]();
    /* a lit window on the little house when someone is in; a glow in the hollow when the owl is */
    for (const h of habs) { const own = ents.find(e => e.hab === h); if (h.win && own) { const lit = own.st === 'in' || own.st === 'peek'; const al = (mood === 'day' ? .2 : .8) * (lit ? 1 : .3); glow(c0, h.win.x + 1, h.win.y + 1, 5, '#ffd27a', al); } if (h.id === 'tree' && own && nightish() && own.st === 'in') { px(h.x - 2, h.hole.y - 6, '#ffe27a'); px(h.x + 2, h.hole.y - 6, '#ffe27a'); } }
    drawPond();
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; if (p.kind === 'dot') p.vy += .02; p.life--; if (p.life <= 0) { parts.splice(i, 1); continue; } c0.globalAlpha = Math.min(1, p.life / p.max * 1.4); px(p.x, p.y, p.col); } c0.globalAlpha = 1;
    if (tip && Date.now() > tipT) { tip.classList.remove('show'); }
  }


  /* ---------- the house that grows with the main goal ----------
     Eight stages. Nothing built at 0: a plot with stakes and rope and a pile of timber. Foundation at 1%, frame at 20, walls at 35, roof frame at 55,
     roof at 70, door and lit window at 85, and at 100 the garden, the lantern, bunting and a little smoke. Each realm builds it in its own stuff. */
  const STAGES = [0, 1, 20, 35, 55, 70, 85, 100];
  const stageOf = p => { let s = 0; for (let i = 0; i < STAGES.length; i++) if (p >= STAGES[i] && (i > 0 || p >= 0)) s = i; return p <= 0 ? 0 : Math.max(1, s); };
  const MAT = {
    wood: { wall: '#b98550', wallD: '#7a5030', roof: '#4e8a3e', roofL: '#8ac86a', beam: '#6a4428', glass: '#ffe9a0' },
    ember: { wall: '#7a6a66', wallD: '#4a3a38', roof: '#b04a2a', roofL: '#e8803a', beam: '#3a2a26', glass: '#ff9a3a' },
    frost: { wall: '#cfe6f4', wallD: '#8ab0cc', roof: '#f4fbff', roofL: '#ffffff', beam: '#6a8aa8', glass: '#ffe9a0' },
    violet: { wall: '#f0e0f4', wallD: '#b890c8', roof: '#e0489c', roofL: '#ff9ad8', beam: '#8a5aa8', glass: '#a8f0ff' },
    gold: { wall: '#f0d8a0', wallD: '#b8904a', roof: '#d8a030', roofL: '#ffe27a', beam: '#7a5a2a', glass: '#fff4c0' },
    dream: { wall: '#e8e0ff', wallD: '#9a88d0', roof: '#6a58c8', roofL: '#b8a8ff', beam: '#4a3a98', glass: '#ffe0f8' },
  };
  function paintHouse(c, t, x, base, pct, rl) {
    c0 = c; const st = stageOf(pct), M0 = MAT[rl] || MAT.wood, M = {}, W2 = 26, Hw = 14, x0 = x, R = rnd(66); for (const k in M0) M[k] = dim(M0[k]);
    /* the plot and the timber pile: always there */
    rect(x0 - 3, base, W2 + 7, 2, 'rgba(0,0,0,.22)');
    if (st === 0) { for (const sx of [x0, x0 + W2]) { rect(sx, base - 7, 1, 8, M.beam); px(sx, base - 8, M.roofL); } for (let i = 0; i <= W2; i += 2) px(x0 + i, base - 5 + (i % 4 ? 0 : 1), '#d8c8a0'); }
    if (st < 5) { for (let k = 0; k < 4; k++) rect(x0 + W2 + 3, base - 1 - k, 7 - (k % 2), 1, k % 2 ? M.wall : M.wallD); rect(x0 + W2 + 4, base - 6, 3, 1, M.beam); }
    if (st === 0) { rect(x0 + 10, base - 12, 1, 12, M.beam); rect(x0 + 8, base - 13, 5, 3, M.wall); px(x0 + 10, base - 12, M.beam); return; }
    /* 1: foundation */
    const stones = mixh(t.stone, '#000000', .1), stoneL = t.stoneL;
    for (let i = 0; i < W2; i += 4) { rect(x0 + i, base - 2, 4, 2, i % 8 ? stones : mixh(stones, '#ffffff', .12)); px(x0 + i, base - 2, stoneL); px(x0 + i + 3, base - 1, mixh(stones, '#000000', .35)); }
    if (st === 1) return;
    /* 2: the frame; 3 and up: walls between the posts */
    const wallTop = base - Hw - 2;
    for (const px0 of [0, 7, 13, 19, W2 - 1]) rect(x0 + px0, wallTop, 1, Hw, M.beam);
    rect(x0, wallTop, W2, 1, M.beam); rect(x0, base - 3, W2, 1, M.beam);
    if (st >= 3) { const hgt = st === 3 ? Math.round(Hw * .55) : Hw - 1; for (let j = 0; j < hgt; j++) { const yy = base - 3 - j; for (let i = 1; i < W2 - 1; i++) { if ([7, 13, 19].includes(i)) continue; px(x0 + i, yy, j % 3 === 2 ? M.wallD : (i + j) % 9 === 0 ? mixh(M.wall, '#ffffff', .12) : M.wall); } } }
    if (st < 4) return;
    /* 4: the roof frame; 5: the roof */
    const rH = 12;
    if (st === 4) { for (let k = 0; k < 6; k++) { px(x0 + k * 2, wallTop - k, M.beam); px(x0 + W2 - k * 2, wallTop - k, M.beam); px(x0 + k * 2 + 1, wallTop - k, M.beam); px(x0 + W2 - k * 2 - 1, wallTop - k, M.beam); } rect(x0 + W2 / 2 - 1, wallTop - 7, 2, 7, M.beam); return; }
    if (rl === 'violet') { for (let j = 0; j < 11; j++) { const w = Math.round(17 * Math.sqrt(Math.max(0, 1 - ((j - 10) / 11) * ((j - 10) / 11)))); rect(x0 + W2 / 2 - w, wallTop - 10 + j, w * 2, 1, j < 2 ? M.roofL : M.roof); px(x0 + W2 / 2 + w - 1, wallTop - 10 + j, mixh(M.roof, '#000000', .3)); } for (const [dx, dy] of [[-8, 4], [-2, 2], [6, 5], [10, 7], [1, 7]]) px(x0 + W2 / 2 + dx, wallTop - 10 + dy, '#fff0f8'); }
    else for (let j = 0; j < rH; j++) { const w = Math.round((W2 / 2 + 4) * (1 - j / (rH + 1))); rect(x0 + W2 / 2 - w, wallTop - j - 1, w * 2, 1, j === rH - 1 ? M.roofL : j % 3 === 0 ? mixh(M.roof, '#ffffff', .14) : M.roof); px(x0 + W2 / 2 - w, wallTop - j - 1, mixh(M.roof, '#000000', .25)); px(x0 + W2 / 2 + w - 1, wallTop - j - 1, mixh(M.roof, '#000000', .25)); if (rl === 'wood' || rl === 'gold') { if (R() < .4) px(x0 + W2 / 2 - w + 2 + Math.floor(R() * (w * 2 - 4)), wallTop - j - 1, rl === 'wood' ? t.mossL : '#fff0a0'); } }
    if (st === 5) return;
    /* 6: door, window, chimney */
    rect(x0 + 8, base - 9, 6, 7, mixh(M.beam, '#000000', .35)); rect(x0 + 9, base - 10, 4, 1, mixh(M.beam, '#000000', .35)); px(x0 + 12, base - 6, '#ffd27a'); rect(x0 + 8, base - 9, 1, 7, M.beam);
    const lit = mood !== 'day'; if (lit) glow(c, x0 + 19, base - 9, 7, M.glass, .55); rect(x0 + 17, base - 11, 5, 5, lit ? M.glass : mixh(M.glass, '#6a8aa8', .5)); px(x0 + 19, base - 11, M.beam); rect(x0 + 17, base - 9, 5, 1, M.beam); px(x0 + 19, base - 10, M.beam); px(x0 + 19, base - 8, M.beam);
    if (rl !== 'violet') { rect(x0 + W2 - 7, wallTop - 11, 4, 8, rl === 'ember' ? '#4a3a38' : M.wallD); rect(x0 + W2 - 8, wallTop - 12, 6, 2, mixh(M.wallD, '#000000', .2)); }
    if (st === 6) return;
    /* 7: finished. flowers at the door, a lantern post, bunting */
    for (let i = 0; i < 6; i++) { const fx = x0 + 3 + i * 4; px(fx, base - 1, '#3a7a3a'); px(fx, base - 2, ['#ff7aa8', '#ffe27a', '#ffffff', '#b88aff'][i % 4]); }
    rect(x0 + W2 + 5, base - 10, 1, 10, M.beam); rect(x0 + W2 + 3, base - 12, 5, 3, '#ffd27a'); px(x0 + W2 + 5, base - 13, M.beam); glow(c, x0 + W2 + 5, base - 11, 6, '#ffd27a', mood === 'day' ? .25 : .75);
    for (let i = 0; i <= W2; i += 1) { const yy = wallTop + 2 + Math.round(Math.sin(i / W2 * Math.PI) * 3); if (i % 3 === 0) px(x0 + i, yy, ['#ff7aa8', '#ffe27a', '#8ae8ff', '#b88aff'][(i / 3) % 4 | 0]); }
  }

  /* ---------- hearing the app ---------- */
  function onSfx(n) {
    if (!habs.length) return; const cx = Math.round(W / 2), by = Math.round(H * .86);
    if (n === 'whoosh' || n === 'next' || n === 'back') { gust = Math.min(1.6, gust + 1); for (const e of ents) if (e.a.beh === 'peek' && e.st === 'peek') { e.st = 'in'; e.t = 25 + Math.floor(Math.random() * 40); } for (let i = 0; i < 10; i++) part(W * (.2 + Math.random() * .6), Lr.floor - 4 - Math.random() * 20, 1.2 + Math.random(), -.1, 14, dim(spec().plants[0][1])); }
    else if (n === 'soft') { burst(cx, by - 20, 18, T.fairy[0], 1.1, .8); burst(cx, by - 14, 10, '#ffffff', .6, .5); gust = Math.max(gust, .4); for (const e of ents) if (e.a.beh === 'peek' && e.st === 'in' && Math.random() < .6) e.t = Math.min(e.t, 8 + Math.floor(Math.random() * 20)); }
    else if (n === 'coin') { const Q = Lr.fall.pool; for (let i = 0; i < 12; i++) part(Q.cx + (Math.random() - .5) * Q.rx, Q.y0 + 4 + Math.random() * Q.ryh * .6, (Math.random() - .5) * .3, -.45 - Math.random() * .3, 14 + Math.floor(Math.random() * 8), i % 3 ? '#fff1a8' : '#ffffff'); for (const p of pond) if (p.st === 0) p.t = Math.min(p.t, 2); const fr = ents.find(e => e.a.beh === 'hop' && e.st === 'sit'); if (fr) { fr.t = 1; fr.st = 'sit'; } }
    else if (n === 'sparkle' || n === 'fanfare') { for (let i = 0; i < (n === 'fanfare' ? 40 : 20); i++) part(W * Math.random(), Lr.hz + Math.random() * (H - Lr.hz), (Math.random() - .5) * .5, -.4 - Math.random() * .4, 16 + Math.floor(Math.random() * 12), T.fairy[i % T.fairy.length]); for (const e of ents) if (e.a.magic) e.kick = 8; if (n === 'fanfare') { gust = 1.2; if (typeof SCENE !== 'undefined' && SCENE.flare) SCENE.flare(); } }
    else if (n === 'pop') { burst(cx + (Math.random() - .5) * 60, by - 30, 6, '#ffffff', .6, .5); }
    else if (n === 'thunk') { const Q = Lr.fall.pool; burst(Q.cx - Q.rx * .5, Q.y0 + 6, 5, '#ffffff', .5, .4); }
  }
  /* a new stage of the house: hammering, a burst of light, the fairies gather */
  function houseUp(x, y, st) { for (let i = 0; i < 3; i++) setTimeout(() => amb('knock', x + 12, .8), i * 220); burst(x + 13, y - 12, 26, st >= 7 ? '#ffd27a' : '#fff1a8', 1.1, .9); for (const fy of Lr.fairies) fy.cx = x + 14 + (Math.random() - .5) * 30; setTimeout(() => amb('sparkle', x / W, .9), 600); }
  function nearest(ax, ay) {
    let best = null, bd = 99;
    const test = (x, y, r, o) => { const d = Math.hypot(ax - x, (ay - y) * 1.1); if (d < r && d < bd) { bd = d; best = o; } };
    for (const e of ents) { const S = SPR[e.sp] ? SPR[e.sp][0] : null; if (!S) continue; if (e.a.beh === 'peek') { if (e.st === 'in') continue; const h = e.hab; test(h.x + (e.ox || 0), h.y - 4, 8, { k: 'ent', e }); } else test(e.x, e.y - S.length / 2, Math.max(6, S[0].length * .65), { k: 'ent', e }); }
    for (const p of plants) test(p.x, p.y - p.h / 2, 5, { k: 'plant', p });
    for (const h of habs) test(h.x, h.y - 6, 9, { k: 'hab', h });
    if (Lr.stag) test(Lr.stag.x + 7, Lr.stag.y + 8, 9, { k: 'stag' });
    for (const fy of Lr.fairies) test(fy.cx + Math.cos(fy.ph + f * fy.sp) * fy.rx, fy.cy + Math.sin((fy.ph + f * fy.sp) * 1.4) * fy.ry, 7, { k: 'fairy', fy });
    const H0 = Lr.hut; if (H0) test(H0.x + 12, H0.y - 10, 16, { k: 'house' });
    return best;
  }
  function label(txt, x, y) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'lifetip'; document.body.append(tip); }
    tip.textContent = txt; tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.add('show'); tipT = Date.now() + 1800; clearTimeout(tip._t); tip._t = setTimeout(() => tip.classList.remove('show'), 1800);
  }
  function poke(o, cxp, cyp) {
    const ax = o.ax, ay = o.ay;
    if (o.k === 'ent') { const e = o.e, a = e.a; label(a.name, cxp, cyp - 28); e.kick = 8; if (a.beh === 'peek') { e.st = 'in'; e.t = 30 + Math.floor(Math.random() * 40); } else if (a.beh === 'walk') { e.tx = Math.max(e.x0, Math.min(e.x1, e.x + (e.x > ax ? 14 : -14))); e.st = 'go'; } else if (a.beh === 'sit') { e.fr = 1; e.t = 6; } else if (a.beh === 'hop') { e.st = 'croak'; e.t = 3; e.fr = 1; } else if (a.beh === 'visit') { e.hover = 0; pickTarget(e); } burst(e.x || o.e.hab.x, (e.y || o.e.hab.y) - 6, 7, a.c.g || '#ffffff', .8, .5); amb(a.snd || 'chime', (e.x || e.hab.x), .9); }
    else if (o.k === 'plant') { const p = o.p; p.kick = 1.4; label(p.name, cxp, cyp - 20); burst(p.x, p.y - p.h, 6, dim(p.b), .6, .4); amb(p.kind === 'bell' || p.kind === 'crystal' || p.opt === 'glow' ? 'chime' : 'rustle', p.x, .8, Math.floor(p.x / W * 9)); }
    else if (o.k === 'hab') { const h = o.h; label(h.id === 'tree' ? 'Hollow tree' : h.id === 'house' ? 'Tiny house' : 'Burrow', cxp, cyp - 24); const e = ents.find(q => q.hab === h); if (e) { e.st = 'peek'; e.t = 20; } amb('knock', h.x, .9); burst(h.x, h.y - 8, 5, '#ffd27a', .5, .3); }
    else if (o.k === 'stag') { label('Spirit stag', cxp, cyp - 20); gust = Math.max(gust, .6); burst(Lr.stag.x + 7, Lr.stag.y + 4, 14, '#bff4ff', 1, .6); amb('hoot', Lr.stag.x, 1); }
    else if (o.k === 'fairy') { label('Fairy', cxp, cyp - 16); burst(ax, ay, 10, T.fairy[o.fy.c], .9, .5); amb('chime', ax, 1); }
    else if (o.k === 'house') { label('Your house', cxp, cyp - 30); burst(Lr.hut.x + 12, Lr.hut.y - 12, 10, '#ffd27a', .8, .6); amb('knock', Lr.hut.x, 1); const b = document.querySelector('.tabs [data-tab="home"]'); if (b && document.body.classList.contains('shut')) setTimeout(() => b.click(), 350); }
  }
  /* a tap on the picture (not on a control) */
  function hit(clientX, clientY, PX) {
    if (!habs.length) return false; const ax = clientX / PX, ay = clientY / PX, o = nearest(ax, ay);
    if (!o) { return false; } o.ax = ax; o.ay = ay; poke(o, clientX, clientY); return true;
  }
  function hover1(clientX, clientY, PX) { if (!habs.length) return false; return !!nearest(clientX / PX, clientY / PX); }

  function init(L, w, h, t, rl, mo) {
    Lr = L; W = w; H = h; T = t; realm = rl; mood = mo; parts = [];
    layoutHabs(); layoutPlants(); layoutLife();
  }
  if (/[?&]lifetest\b/.test(location.search)) window.__LIFE = { stage: p => window.__SCENEP && window.__SCENEP(p), dbg: () => ({ ents, plants, habs, parts }), force: (st) => { for (const e of ents) if (e.a.beh === 'peek') { e.st = st; e.t = 99; e.dir = 1; e.ox = 10; } } };
  return { init, paintHabs, paintHouse, stageOf, houseUp, draw, onSfx, hit, hover: hover1, cast: () => spec(), habs: () => habs, setProgress: v => { prog = v; }, gust: v => { gust = Math.max(gust, v); }, burst, stagPal: () => spec().stag, name: () => spec().guide, CAST };
})();
