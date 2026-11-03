// Gera os ícones do app Android (mipmaps) a partir do desenho do logo, sem dependências:
// rasteriza círculos e retângulo arredondado com supersampling e grava PNG com zlib.
// Uso: node scripts/make-android-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const RES = new URL('../android/app/src/main/res/', import.meta.url);
const BG = [0x1f, 0x2a, 0x44];
const DOT = [0xfb, 0xf7, 0xf1];
const CIRCLES = [
  [150, 190, '#3A6EA5'],
  [350, 160, '#D9643A'],
  [165, 350, '#1F8A84'],
  [365, 330, '#8A4F9E'],
];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// pontos do trajeto tracejado entre as cidades (espaço 512×512)
const path = [];
for (let i = 0; i < CIRCLES.length - 1; i++) {
  const [x1, y1] = CIRCLES[i];
  const [x2, y2] = CIRCLES[i + 1];
  const len = Math.hypot(x2 - x1, y2 - y1);
  for (let d = 0; d < len; d += 34) path.push([x1 + ((x2 - x1) * d) / len, y1 + ((y2 - y1) * d) / len]);
}

/** cor do pixel (x,y) no espaço 512; null = transparente */
function shade(x, y, withBg, round) {
  if (withBg) {
    if (round) {
      if (Math.hypot(x - 256, y - 256) > 256) return null;
    } else {
      const r = 112;
      const cx = Math.min(Math.max(x, r), 512 - r);
      const cy = Math.min(Math.max(y, r), 512 - r);
      if (x < 0 || y < 0 || x > 512 || y > 512 || Math.hypot(x - cx, y - cy) > r) return null;
    }
  }
  for (const [cx, cy, c] of CIRCLES) if (Math.hypot(x - cx, y - cy) <= 44) return hex(c);
  for (const [px, py] of path) if (Math.hypot(x - px, y - py) <= 9) return DOT;
  return withBg ? BG : null;
}

function png(size, { withBg, round = false, inset = 0 }) {
  const SS = 4;
  const data = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    data[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          // inset: área útil do ícone adaptativo (66 de 108 dp)
          const u = ((x + (sx + 0.5) / SS) / size - inset) / (1 - 2 * inset);
          const v = ((y + (sy + 0.5) / SS) / size - inset) / (1 - 2 * inset);
          const c = shade(u * 512, v * 512, withBg, round);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a++;
          }
        }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      const n = SS * SS;
      if (a) {
        data[o] = r / a;
        data[o + 1] = g / a;
        data[o + 2] = b / a;
      }
      data[o + 3] = Math.round((a / n) * 255);
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const tb = Buffer.concat([Buffer.from(type), body]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(tb));
    return Buffer.concat([len, tb, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(data)), chunk('IEND', Buffer.alloc(0))]);
}

const DENS = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, s] of Object.entries(DENS)) {
  const dir = new URL(`mipmap-${d}/`, RES);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('ic_launcher.png', dir), png(s, { withBg: true }));
  writeFileSync(new URL('ic_launcher_round.png', dir), png(s, { withBg: true, round: true }));
  writeFileSync(new URL('ic_launcher_foreground.png', dir), png(Math.round((s * 108) / 48), { withBg: false, inset: 21 / 108 }));
}
writeFileSync(new URL('values/ic_launcher_background.xml', RES), '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1F2A44</color>\n</resources>\n');
// ícone grande também para a página de download
writeFileSync(new URL('../public/icon-512.png', import.meta.url), png(512, { withBg: true }));
console.log('ícones gerados');
