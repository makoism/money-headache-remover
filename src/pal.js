/* ---------- the Burrow palette ----------
   Every pixel in every picture comes from one of these ramps. A ramp runs dark to light and the hue turns as it goes: shadows lean
   blue or violet, lights lean warm yellow. Nothing is pure black or pure white. Read ART_GUIDE.md before drawing anything.
   Use as PAL.moss[3] or by name P('moss', 3). */
const PAL = {
  night:  ['#050b14', '#0a1424', '#111f36', '#1b3150', '#2b4a72', '#44689a', '#7d9cc4'],
  moss:   ['#06130e', '#0c2119', '#13382a', '#1c5238', '#2a7250', '#43945f', '#7cc489', '#c0eba8'],
  teal:   ['#0a2630', '#10424e', '#1a6a74', '#2a9a98', '#5ccfc0', '#a8f2e0'],
  bark:   ['#1a0f08', '#34200f', '#553318', '#7a4c28', '#a06c3c', '#cc9a62'],
  stone:  ['#0b1118', '#1b2530', '#2f3f4c', '#4b5f6e', '#76909f', '#a4bcc8'],
  ember:  ['#2c1408', '#5e2e12', '#9a5222', '#d27c32', '#f6a944', '#ffd470', '#fff1b0'],
  gold:   ['#5a3206', '#a86c10', '#dc9c1e', '#fcd23c', '#fff4a0'],
  fur:    ['#2a1208', '#5e280e', '#9c4c18', '#d27a30', '#f0aa5e', '#ffd9a2'],
  ash:    ['#221e1e', '#4a4440', '#7a726a', '#aaa298', '#d8d2c8', '#f6f2ea'],
  rose:   ['#240c1c', '#521e3c', '#82325a', '#bc5886', '#ee90b2', '#ffc8d8'],
  violet: ['#180c38', '#34206c', '#5e42a0', '#8c6cd0', '#bca0f4', '#e6d8ff'],
  rain:   ['#243c5c', '#456890', '#6c92bc', '#a2c8ee', '#dff0ff'],
};
const P = (ramp, i) => PAL[ramp][i];

/* ---------- pixel helpers shared by every picture ---------- */
const PXK = (() => {
  const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];   // 4x4 ordered (Bayer) dither
  const cache = {};
  const rgbOf = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
  /* a halo is 4 stepped rings, outer two dithered into the scene. never a smooth gradient. built once per size and colour */
  function haloSprite(r, sy, hex) {
    const k = r + '|' + sy + '|' + hex; if (cache[k]) return cache[k];
    const w = r * 2 + 1, h = Math.max(3, Math.ceil(r * 2 * sy) + 1), c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), rgb = rgbOf(hex);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x - r) / r, dy = (y - (h - 1) / 2) / (r * sy), d = Math.hypot(dx, dy); if (d >= 1) continue;
      const ring = d < .3 ? 3 : d < .55 ? 2 : d < .8 ? 1 : 0, b = B[y & 3][x & 3];
      if (ring === 0 && b >= 6) continue; if (ring === 1 && b >= 11) continue;
      g.fillStyle = `rgba(${rgb},${[.3, .5, .75, 1][ring]})`; g.fillRect(x, y, 1, 1);
    }
    return cache[k] = c;
  }
  function halo(g, cx, cy, r, hex, a, sy) {
    r = Math.max(2, Math.round(r)); const s = haloSprite(r, sy || 1, hex);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, a); g.drawImage(s, Math.round(cx - r), Math.round(cy - (s.height - 1) / 2)); g.restore();
  }
  return { B, halo };
})();
