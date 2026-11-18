/* ---------- realms: a different magical place each time the app opens (used by scene.js) ----------
   A realm is a recipe laid over the four moods of the day: a colour turn for the whole palette (the same forest, seen as an
   autumn of embers, a frozen glass wood, a violet mushroom deep, a golden glade), a kind of back tree, a landmark on the left, the
   little lights that drift through the air, and what the waterfall is made of. The picture is still one scene: the same layers,
   the same river along the bottom, the same lighting. `?realm=wood|ember|frost|violet|gold` fixes one for tests. */
const REALMS = {
  wood:   { name: 'Fairy Woods',      tag: 'Moss, lantern light and a hidden stream',        hue: 0,    sat: 1,    lit: 1,    wh: 0,    trees: 'broad',  mark: 'hut',     air: 'fairy',     fairy: null },
  crystal:{ name: 'Crystal Deep',     tag: 'Old stone, quiet crystal and the pale ones',     hue: 12,   sat: .8,   lit: .8,   wh: 40,   trees: 'broad',  mark: 'crystal', air: 'snow',      fairy: ['#e8fff8', '#bfffe8', '#ffffff', '#c8f0ff'] },
  sea:    { name: 'The Underwater Dynasty', tag: 'A drowned court that speaks in light',         hue: 118,  sat: 1,    lit: .9,   wh: 60,   trees: 'shroom', mark: 'caphut',  air: 'spore',     fairy: ['#9affff', '#ff9ad8', '#c8b0ff', '#fff1a8'] },
  shire:  { name: 'The Green',        tag: 'Every blade of grass is listening',              hue: -20,  sat: 1.1,  lit: 1.05, wh: 0,    trees: 'broad',  mark: 'hut',     air: 'butterfly', fairy: ['#d8ff9a', '#9aff9a', '#fff1a8', '#b8ffd8'] },
  chiba:  { name: 'Chiba, After',     tag: 'The cats kept the lights on',                    hue: -50,  sat: 1,    lit: 1.05, wh: 20,   trees: 'broad',  mark: 'hut',     air: 'butterfly', fairy: ['#ffd8a0', '#ffe9a0', '#d8ffd0', '#ffc8d8'] },
  rune:   { name: 'Rune Wood',        tag: 'The old trees remember what is written on them', hue: 105,  sat: 1,    lit: .9,   wh: 0,    trees: 'broad',  mark: 'hut',     air: 'fairy',     fairy: ['#9af4ff', '#b0a0ff', '#ffffff', '#8ac0ff'] },
  grove:  { name: 'Elder Grove',      tag: 'Two old trees and everything in their light',    hue: -12,  sat: 1.05, lit: 1.05, wh: 0,    trees: 'broad',  mark: 'hut',     air: 'butterfly', fairy: ['#fff1a8', '#ffd8a0', '#d8ff9a', '#ffffff'] },
  hollow: { name: 'Hearth Hollow',    tag: 'A warm den under the stones',                    hue: -30,  sat: .9,   lit: .95,  wh: 20,   trees: 'broad',  mark: 'hut',     air: 'fairy',     fairy: ['#ffd890', '#ffb870', '#fff1a8', '#ffe8c8'] },
  frost:  { name: 'Frost Hollow',     tag: 'Snow on the pines and one light in the window',  hue: 80,   sat: .55,  lit: 1.15, wh: 40,   trees: 'broad',  mark: 'hut',     air: 'snow',      fairy: ['#e8ffff', '#c8e8ff', '#ffffff', '#d8f0ff'] },
  dream:  { name: 'The Dreaming',     tag: 'You were here before you knew it',               hue: 160,  sat: 1,    lit: 1.1,  wh: 90,   trees: 'shroom', mark: 'caphut',  air: 'spore',     fairy: ['#ffd8f8', '#c8d8ff', '#fff4c0', '#d0fff0'] },
};
const REALM_IDS = Object.keys(REALMS);
const REALM_GLOW = { wood: '#8fd9b0', crystal: '#7ad8f0', sea: '#6adcf0', shire: '#b8f070', chiba: '#ffc890', rune: '#8ae8ff', grove: '#ffd890', hollow: '#ffb870', frost: '#c8ecff', dream: '#d8b8ff' };
/* until the other realms are rebuilt to match, every visit opens Fairy Woods (a ?realm= address still shows the others). Set to '' to bring the random choice back. */
const ONLY_REALM = 'wood';
function pickRealm() {
  let id = (location.search.match(/[?&]realm=(\w+)/) || [])[1];
  if (!(id && REALMS[id]) && ONLY_REALM) id = ONLY_REALM;
  if (!(id && REALMS[id])) {
    let last = ''; try { last = localStorage.getItem('mhr-realm') || ''; } catch (e) { }
    const common = REALM_IDS.filter(r => r !== 'dream' && r !== last); id = (Math.random() < .08 && last !== 'dream') ? 'dream' : common[Math.floor(Math.random() * common.length)];
    try { localStorage.setItem('mhr-realm', id); } catch (e) { }
  }
  try { document.documentElement.style.setProperty('--realm', REALM_GLOW[id] || '#8fd9b0'); } catch (e) { }
  return id;
}
/* colour maths: hex to hsl and back, so a whole palette can be turned a given number of degrees */
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hsl2hex(h, s, l) { h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join(''); }
function turnHex(hx, deg, sat, lit) { const [h, s, l] = rgb2hsl(parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)); return hsl2hex(h + deg, s * sat, l * lit + (lit > 1 ? (1 - l) * (lit - 1) * .3 : 0)); }
/* the realm's palette: the day's palette with its colours turned. Greens and the sky go all the way; bark and stone only part of the way, so wood stays wood. */
function realmPalette(base, id) {
  const R = REALMS[id]; if (!R || (!R.hue && R.sat === 1 && R.lit === 1)) return Object.assign({}, base, { realm: id });
  const out = Object.assign({}, base, { realm: id }), full = ['fog', 'moss', 'mossL', 'mossD', 'leaf', 'leafD', 'ground', 'groundD', 'groundL', 'shaft', 'win', 'smoke'], part = { trunk: .3, trunkD: .3, trunkL: .3, stone: .4, stoneD: .4, stoneL: .4, rune: .6 };
  for (const k of full) if (base[k]) out[k] = turnHex(base[k], R.hue, R.sat, R.lit);
  for (const k in part) if (base[k]) out[k] = turnHex(base[k], R.hue * part[k], 1 - (1 - R.sat) * part[k], 1);
  out.sky = base.sky.map(c => turnHex(c, R.hue * .9, R.sat, R.lit)); out.far = base.far.map(c => turnHex(c, R.hue, R.sat, R.lit));
  for (const k of ['water', 'water2', 'foam']) out[k] = turnHex(base[k], R.wh, k === 'foam' ? .5 : 1, 1);
  if (R.fairy && base.fairy) out.fairy = R.fairy.slice();
  return out;
}
