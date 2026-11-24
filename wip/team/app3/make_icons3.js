#!/usr/bin/env node
/* app3's home screen icons (MAKO_SAYS M33), drawn as plain shapes: a green square, a light mound with a strip of ground,
   and a dark door in it. Run by build3.sh; writes icon3-192.png and icon3-512.png beside the page. Everything sits inside
   the middle circle that Android keeps when it crops a maskable icon (40% of the width from the centre), and the square
   fills to every edge, so one file serves as both the plain and the maskable icon. Not a screen: it is never in the page. */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const BG = hex('#1f7a52'), MOUND = hex('#8fd9b0'), DOOR = hex('#0c1a15');
/* the colour at a point, u and v from 0 to 1 across and down */
function at(u, v) {
  if (v <= 0.58 && (u - 0.5) ** 2 + (v - 0.58) ** 2 <= 0.09 ** 2) return DOOR;          // the door's round top
  if (u >= 0.41 && u <= 0.59 && v >= 0.58 && v <= 0.66) return DOOR;                     // the door
  if (v <= 0.66 && (u - 0.5) ** 2 + (v - 0.66) ** 2 <= 0.30 ** 2) return MOUND;          // the mound
  if (u >= 0.18 && u <= 0.82 && v >= 0.66 && v <= 0.71) return MOUND;                   // the ground
  return BG;
}
const TABLE = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xffffffff; for (const x of buf) c = TABLE[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(size) {
  const S = 4, row = size * 3 + 1, raw = Buffer.alloc(row * size);   // 4 by 4 samples a pixel, so the round edges are smooth
  for (let y = 0; y < size; y++) {
    raw[y * row] = 0;
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const c = at((x + (i + 0.5) / S) / size, (y + (j + 0.5) / S) / size); sum[0] += c[0]; sum[1] += c[1]; sum[2] += c[2]; }
      for (let k = 0; k < 3; k++) raw[y * row + 1 + x * 3 + k] = Math.round(sum[k] / (S * S));
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;   // 8 bits, RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
for (const size of [192, 512]) fs.writeFileSync(path.join(__dirname, `icon3-${size}.png`), png(size));
