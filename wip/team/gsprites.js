/* ---------- the garden's sprite library: small pixel drawings, one cell = one pixel, drawn here as text ----------
   gsUrl(name, variant) turns a drawing into a crisp PNG data address (cached). Rows are padded with clear cells to the widest row.
   Letters are colours (GP); '.' is clear. A variant swaps colours (GV) so one drawing can give several creatures and flowers.
   The older PIX sprites (pixel.js) are part of the pool too, so a page draws from about fifty different things. */
const GP = {
  k: '#1f4a37', G: '#3d8f68', g: '#5db98a', l: '#a4e6bf', y: '#f4cf63', Y: '#cf9b34', o: '#ec8a4c', O: '#bd5b2c',
  r: '#e8586c', R: '#a63248', p: '#f391ad', P: '#c4607f', q: '#ffd3df', w: '#f8f4e8', c: '#d4d9d2', C: '#8e9a94',
  b: '#7bb8ea', B: '#4a7bbd', v: '#b698ea', V: '#7a5dbc', n: '#a07548', N: '#5e4129', t: '#e6d6b6', T: '#b99c72', s: '#262626', e: '#ffe4cc',
};
const GS = {
  poppy: ['..RRRRR..', '.RrrrrrR.', 'RrrNNNrrR', 'RrrNsNrrR', '.RrrNrrR.', '..RRRRR..', '....g....', '.g..g....', '.gg.gG...', '..ggG....', '....g....', '....G....'],
  bluebell: ['...ggg...', '..g...g..', '..g...bB.', '.bB..bBbB', 'bBbB.BbBb', '.bB...B..', '..g......', '..g......', '..gG.....', '.gg.g....', '..g......', '..G......'],
  lavender: ['..v..', '.vVv.', '..v..', '.vVv.', '..v..', '.vVv.', '..g..', '..g..', '.gg..', '..g.g', '..gg.', '..G..'],
  daffodil: ['.y.y.y.', 'yyyyyyy', '.yoooy.', '.yoooy.', '..yyy..', '...g...', '...g...', '..gg...', '..g.g..', '..g.g..', '..g....'],
  rose: ['..rRrr...', '.rrRrrR..', 'rrRrrrrR.', 'rRrrRrrR.', '.rrrrrR..', '..RrrR...', '...g.....', '.g.g.g...', '.gggg....', '...g.....', '...G.....'],
  cherry: ['..........p..p.', '.....p..pPp.pPp', '....pPp..p...p.', '.p...p...n.....', 'pPp...n.nn.....', '.p..nnnn.......', '...nn..........', 'nnnn...........'],
  lotus: ['.....p.......', '....pqp......', '..p.pqp.p....', '.pqppqppqp...', '..pPpPpPp....', '.ggggggggggg.', 'gGgggggggGggg', '.GGgggggggGG.', '..GGGGGGGGG..'],
  cosmos: ['.p.p.p.p.', '.ppppppp.', 'pppyyyppp', '.ppyyypp.', '.ppppppp.', '.p.p.p.p.', '....g....', '.g..g....', '.gg.g....', '..gggG...', '....g....'],
  forgetme: ['.b..b....', 'bwb.bwb.b', '.b..b..bw', '..g.g...b', '..gGg..g.', '...g..g..', '...gg.g..', '....ggg..'],
  heartflower: ['.rr...rr.', 'rrrr.rrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....g....', '..g.g....', '..gggg...', '....g....', '....G....'],
  heart: ['.RR.RR.', 'RrrRrrR', 'RrwrrrR', 'RrrrrrR', '.RrrrR.', '..RrR..', '...R...'],
  heartleaf: ['.RR.RR...', 'RrrRrrR..', 'RrwrrrR..', 'RrrrrrR..', '.RrrrR...', '..RrR.g..', '...R.gGg.', '.g..gg.g.', 'gGg..G...'],
  mushroom: ['..RRRRR..', '.RrrwrrR.', 'RrwrrrwrR', 'RrrrrrrrR', '.RRRRRRR.', '...ttt...', '...ttt...', '...tTt...', '..tttTt..'],
  bluecap: ['..BBB..', '.BbbwB.', 'BbwbbbB', 'BbbbwbB', '.BBBBB.', '..ttt..', '..ttt..', '..ttT..', '..ttT..', '.tttTT.'],
  fern: ['....gg....', '...gGg....', '..ggGgg...', '.gg.G.gg..', '...gGg....', '..ggGgg...', '.gg.G.gg..', '....G.....', '...gGg....', '..ggGgg...', '....G.....', '....G.....'],
  leafpair: ['..gg.gg..', '.gGggGgg.', 'gGggggGgg', '.gGg.gGg.', '..gg.gg..', '....G....', '....G....', '...GG....'],
  clover4: ['.gg...gg.', 'gGgg.ggGg', 'gGgggggGg', '.ggGgGgg.', '..gGgGg..', '.ggGgGgg.', 'gGgggggGg', 'gGgg.ggGg', '.gg..gg..', '....G....', '....G....'],
  tuft: ['.g..g..g..', '.g.gG.g.g.', 'gG.gG.gG.g', 'gGgGGgGGgG', 'GGGGGGGGGG'],
  mossrock: ['...ggg.....', '..gGgglg...', '.ccCccgcc..', 'cCcccccCcc.', 'cCccCcccCc.', '.CCCCCCCC..'],
  bamboo: ['.gG..', '.gG..', 'GGGG.', '.gG..', '.gG..', '.gGl.', 'GGGG.', '.gG..', '.gG..', 'GGGG.', '.gG..'],
  berries: ['.g.......', '.gg..rR..', '..gg.rr..', '.g.gg.R..', '...ggg...', '.rR.gg...', '.rr..g...', '..R..g...'],
  acorn: ['..NNN..', '.NNnNN.', 'NNnNnNN', '.NNNNN.', '.nnnnn.', '.nnnnn.', '..nnn..', '...n...'],
  pinecone: ['...n...', '..nNn..', '.nNnNn.', '.NnNnN.', 'nNnNnNn', '.nNnNn.', '..NnN..', '...n...'],
  wheat: ['..y.y..', '.yYyYy.', '..y.y..', '.yYyYy.', '..y.y..', '.yYyYy.', '...t...', '...t...', '...t...', '...t...'],
  cattail: ['..N..', '.NnN.', '.NnN.', '.NnN.', '..N..', '..g..', '..g..', '..g..', 'g.g..', 'gGg..', '..g..'],
  sprout: ['.gg.gg.', 'gGggGgg', '.gG.Gg.', '..gGg..', '...g...', '...g...'],
  ivy: ['..g...gg....', '.gGg.gGGg...', '.ggG.ggGg...', '..GgGgGg.gg.', '...GG.G.gGg.', '..g..G..ggg.'],
  bee: ['..ww......', '.wwww.....', '..yysy.ss.', '.yyssyyyss', '.yysyyyss.', '..yyyy....', '..s..s....'],
  ladybug: ['..s..s..', '..ssss..', '.rrsrrR.', 'rrsrrrsR', 'rsrrsrrR', '.rrsrrR.', '..RRRR..'],
  butterfly: ['ooo..s..ooo', 'oOoo.s.ooOo', 'oOOooSooOOo', '.oOooSooOo.', '..ooo.ooo..', '.oo.....oo.'],
  mouse: ['..cc.......', '.cqcc......', '.ccccc.....', 'cwcscccc...', 'ccccccccc..', '.cccccccc.p', '..cc..cc.pP'],
  hedgehog: ['...N.N.N.N...', '..NnNnNnNnN..', '.NnNnNnNnNnN.', '.NnNnNnNnNnNt', 'NnNnNnNnNnNtts', '.NNNNNNNNNttt.', '..tt.....tt..'],
  bluebird: ['...BBB...', '..BbbbB..', '..BsbbBy.', '..BbbbByy', '.BBwwwBB.', '.BwwwwwB.', '..BwwwB..', '...y.y...'],
  robin: ['..nnn....', '.nnsnn...', '.nnnnny..', '.nrrrnn..', '.nrrrrn..', '..nrrn...', '...n.n...', '...y.y...'],
  turtle: ['..gGgGg...', '.gGgGgGg..', 'gGgGgGgGgg', 'GgGgGgGgGe', '.GGGGGGG.e', '.e.e..e.e.'],
  caterpillar: ['.g.g.g.g.g..', 'gGgGgGgGgGgg', 'gGgGgGgGgGgs', '.G.G.G.G.G..'],
  squirrel: ['.......nn.', '......nNnn', '.nn..nNnnn', 'nNnnnNnn..', 'nNnnnnsnn.', '.nnnnnnnn.', '..nnnnnn..', '..n..nn...'],
  cat: ['.o.o......', 'ooooo.....', 'ososo.....', 'ooooooooo.', 'oOoOoOoOoo', 'oooooooooo', '.oooooooo.'],
  fawn: ['.n.n.....', 'nnnn.....', 'nsnn.....', '.nnnnnnnn.', '.nwnwnnnn.', '.nnnnnnnn.', '.n.n..n.n.', '.n.n..n.n.'],
  firefly: ['..y..', '.yYy.', 'sYYYs', '.sss.'],
  star: ['..y..', '..y..', 'yyyyy', '..y..', '..y..'],
};
/* colour swaps: [drawing, {from: to}] so one drawing makes several things */
const GV = {
  butterflyB: ['butterfly', { o: 'b', O: 'B' }], butterflyP: ['butterfly', { o: 'p', O: 'P' }], butterflyV: ['butterfly', { o: 'v', O: 'V' }],
  heartP: ['heart', { r: 'p', R: 'P' }], heartB: ['heart', { r: 'b', R: 'B' }], heartY: ['heart', { r: 'y', R: 'Y' }],
  poppyY: ['poppy', { r: 'y', R: 'Y' }], poppyP: ['poppy', { r: 'p', R: 'P' }],
  rosePink: ['rose', { r: 'p', R: 'P' }], roseWhite: ['rose', { r: 'w', R: 'c' }], roseYellow: ['rose', { r: 'y', R: 'Y' }],
  cosmosW: ['cosmos', { p: 'w' }], cosmosV: ['cosmos', { p: 'v' }],
  mushroomO: ['mushroom', { r: 'o', R: 'O' }], mushroomV: ['mushroom', { r: 'v', R: 'V' }],
  heartflowerP: ['heartflower', { r: 'p' }], heartflowerV: ['heartflower', { r: 'v' }],
  bluebellV: ['bluebell', { b: 'v', B: 'V' }], bluebellP: ['bluebell', { b: 'p', B: 'P' }],
  bluebirdY: ['bluebird', { B: 'Y', b: 'y', y: 'o' }], ladybugY: ['ladybug', { r: 'y', R: 'Y' }], beeB: ['bee', { y: 'o' }],
  catG: ['cat', { o: 'c', O: 'C' }], mouseB: ['mouse', { c: 't', C: 'T' }], berriesB: ['berries', { r: 'B', R: 'V' }],
  lavenderP: ['lavender', { v: 'p', V: 'P' }], forgetmeP: ['forgetme', { b: 'p' }],
};
const GCACHE = {};
function gsDef(name) { const v = GV[name]; return v ? { rows: GS[v[0]], map: v[1] } : { rows: GS[name], map: null }; }
function gsSize(name) { const d = gsDef(name); if (d.rows) return { w: Math.max(...d.rows.map(r => r.length)), h: d.rows.length }; const p = PIX[name]; return p ? { w: p.w, h: p.h } : null; }
function gsUrl(name) {
  if (GCACHE[name]) return GCACHE[name];
  const d = gsDef(name); if (!d.rows) return '';
  const w = Math.max(...d.rows.map(r => r.length)), h = d.rows.length, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); if (!x) return '';
  d.rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { let ch = row[i]; if (ch === '.') continue; if (d.map && d.map[ch]) ch = d.map[ch]; if (!GP[ch]) continue; x.fillStyle = GP[ch]; x.fillRect(i, j, 1, 1); } });
  return (GCACHE[name] = c.toDataURL('image/png'));
}
/* every name the garden can draw: the drawings above, their colour swaps, and the older PIX sprites */
const GARDEN_POOL = { flower: ['poppy', 'poppyY', 'poppyP', 'bluebell', 'bluebellV', 'bluebellP', 'lavender', 'lavenderP', 'daffodil', 'rose', 'rosePink', 'roseWhite', 'roseYellow', 'cherry', 'lotus', 'cosmos', 'cosmosW', 'cosmosV', 'forgetme', 'forgetmeP', 'heartflower', 'heartflowerP', 'heartflowerV', 'tulip', 'daisy', 'sunflower'],
  plant: ['fern', 'leafpair', 'clover4', 'clover', 'tuft', 'mossrock', 'bamboo', 'berries', 'berriesB', 'acorn', 'pinecone', 'wheat', 'cattail', 'sprout', 'ivy', 'mushroom', 'mushroomO', 'mushroomV', 'bluecap', 'cactus'],
  creature: ['bee', 'beeB', 'ladybug', 'ladybugY', 'butterfly', 'butterflyB', 'butterflyP', 'butterflyV', 'mouse', 'mouseB', 'hedgehog', 'bluebird', 'bluebirdY', 'robin', 'turtle', 'caterpillar', 'squirrel', 'cat', 'catG', 'fawn', 'firefly', 'snail', 'frog', 'bunny', 'fox', 'chick', 'duck', 'sheep', 'owl'],
  heart: ['heart', 'heartP', 'heartB', 'heartY', 'heartleaf'] };
