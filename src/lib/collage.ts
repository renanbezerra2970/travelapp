// História da viagem em cards de story (1080×1920).
// Cada dia vira uma sequência cronológica que mistura as fotos do grupo com os lugares marcados como "Vi";
// a quantidade de cards por dia depende do volume de conteúdo (até MAX_PER_DAY).
import type { Profile } from './supabase';
import type { TripPhoto } from './photos';
import { cityTheme, trip } from './trip';
import { initials } from './faces';

const W = 1080;
const H = 1920;
const MAX_PER_DAY = 6;
const PHOTOS_PER_CARD = 4;
const PLACES_PER_CARD = 2;
/** "Peso" de cada item no card: um lugar ocupa mais espaço que uma foto */
const CARD_CAPACITY = 4;
const PLACE_WEIGHT = 1.5;

export type StoryPhoto = { photo: TripPhoto; url: string; time: number };
export type StoryPlace = { id: string; name: string; emoji: string; kind: string; story: string; color: string; img?: string; time: number; who: Profile[] };

export type DayStory = {
  index: number;
  date: string;
  dow: string;
  city: string;
  title: string;
  photos: StoryPhoto[];
  places: StoryPlace[];
};

export type StoryInput = {
  members: Profile[];
  days: DayStory[];
  totalPhotos: number;
  totalSeen: number;
  km: number;
  top: { id: string; name: string; xp: number }[];
  /** URL da foto do rosto por usuário */
  faces?: Record<string, string>;
};

type Card = { photos: StoryPhoto[]; places: StoryPlace[] };

// rostos carregados uma vez por geração
let FACES = new Map<string, HTMLImageElement | null>();
async function loadFaces(s: StoryInput) {
  FACES = new Map();
  await Promise.all(s.members.map(async (m) => FACES.set(m.id, s.faces?.[m.id] ? await loadImage(s.faces[m.id]) : null)));
}

/** Rosto redondo com anel na cor do viajante (ou iniciais) */
function drawFace(ctx: CanvasRenderingContext2D, p: Profile, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  const img = FACES.get(p.id);
  if (img) {
    ctx.clip();
    cover(ctx, img, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = p.color;
    ctx.font = `800 ${Math.round(r * 0.9)}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(p.display_name), cx, cy + 1);
  }
  ctx.restore();
}

/** Fileira de rostos; devolve a largura usada */
function faceRow(ctx: CanvasRenderingContext2D, people: Profile[], x: number, cy: number, r: number, gap = 8) {
  people.forEach((p, i) => drawFace(ctx, p, x + r + i * (r * 2 + gap), cy, r));
  return people.length ? people.length * (r * 2 + gap) - gap : 0;
}

// ── utilidades de desenho ──
function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = url;
  });
}

async function fonts() {
  try {
    await Promise.all([document.fonts.load('700 96px Fraunces'), document.fonts.load('500 40px Fraunces'), document.fonts.load('600 36px Inter'), document.fonts.load('400 32px Inter')]);
  } catch {
    /* segue com a fonte do sistema */
  }
}

function canvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return [c, c.getContext('2d')!] as const;
}

const toJpeg = (c: HTMLCanvasElement) => new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.92));

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines = 3) {
  const words = text.split(/\s+/);
  let line = '';
  let n = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      if (n === maxLines - 1) {
        let cut = line;
        while (ctx.measureText(`${cut}…`).width > maxW && cut.length) cut = cut.slice(0, -1);
        ctx.fillText(`${cut}…`, x, y + n * lh);
        return n + 1;
      }
      ctx.fillText(line, x, y + n * lh);
      line = w;
      n++;
    } else line = test;
  }
  ctx.fillText(line, x, y + n * lh);
  return n + 1;
}

/** Fonte do título que cabe na largura */
function fitFont(ctx: CanvasRenderingContext2D, text: string, size: number, maxW: number) {
  let s = size;
  do ctx.font = `700 ${s}px Fraunces`;
  while (ctx.measureText(text).width > maxW && (s -= 4) > 40);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Foto "colada": moldura branca, leve rotação, sombra e hora */
function polaroid(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, w: number, h: number, rot: number, label?: string, who?: Profile) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0,0,0,.35)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#fff';
  const pad = 14;
  ctx.fillRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2 + 34);
  ctx.shadowColor = 'transparent';
  cover(ctx, img, -w / 2, -h / 2, w, h);
  if (label) {
    let x = -w / 2;
    if (who) {
      drawFace(ctx, who, x + 15, h / 2 + 26, 15);
      x += 40;
    }
    ctx.fillStyle = '#5b6170';
    ctx.font = '400 24px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    let t = label;
    while (ctx.measureText(t).width > w - (x + w / 2) && t.length > 4) t = `${t.slice(0, -2)}…`;
    ctx.fillText(t, x, h / 2 + 34);
  }
  ctx.restore();
}

// Posições (cx, cy, w, h, rotação) para a área de fotos padrão 470..1650
const AREA_TOP = 470;
const AREA_H = 1180;
const LAYOUTS: Record<number, [number, number, number, number, number][]> = {
  1: [[540, 1050, 820, 1000, -2]],
  2: [[380, 820, 560, 640, -4], [700, 1320, 560, 640, 3]],
  3: [[330, 760, 480, 560, -5], [750, 980, 480, 560, 4], [420, 1400, 520, 420, -2]],
  4: [[310, 740, 450, 520, -4], [770, 800, 430, 500, 5], [320, 1330, 450, 520, 3], [770, 1380, 430, 500, -3]],
};

/** Grade arrumada para cards mistos (fotos + lugares): sem sobreposição, legendas visíveis */
function gridLayout(n: number, top: number, height: number) {
  const cols = n === 1 ? 1 : 2;
  const rows = Math.ceil(n / cols);
  const gap = 46;
  const label = 50;
  const maxW = (W - 200 - gap * (cols - 1)) / cols;
  const cellH = Math.min((height - (rows - 1) * gap) / rows - label, maxW * 1.25);
  const cellW = Math.min(maxW, cellH * (n === 1 ? 1.35 : 0.85));
  const out: [number, number, number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const inRow = Math.min(cols, n - r * cols);
    const c = i % cols;
    const rowW = inRow * cellW + (inRow - 1) * gap;
    const x = (W - rowW) / 2 + cellW / 2 + c * (cellW + gap);
    const y = top + cellH / 2 + 10 + r * (cellH + gap + label);
    out.push([x, y, cellW, cellH, i % 2 ? 2.5 : -2.5]);
  }
  return out;
}

/** Encaixa o layout numa área menor (quando o card também tem lugares) */
function fitLayout(n: number, top: number, height: number) {
  const s = height / AREA_H;
  return (LAYOUTS[n] ?? []).map(([cx, cy, w, h, r]) => [540 + (cx - 540) * Math.min(1, s * 1.1), top + (cy - AREA_TOP) * s, w * s, h * s, r] as [number, number, number, number, number]);
}

// ── montagem dos cards de um dia ──
/** Ordena fotos e lugares no tempo e divide em cards; se passar do máximo, fica com as melhores fotos */
export function planDay(d: DayStory): Card[] {
  let photos = [...d.photos].sort((a, b) => a.time - b.time);
  const places = [...d.places].sort((a, b) => a.time - b.time);
  // capacidade total do dia
  const capPhotos = MAX_PER_DAY * PHOTOS_PER_CARD;
  if (photos.length > capPhotos) {
    const fav = photos.filter((p) => p.photo.favorite);
    const rest = photos.filter((p) => !p.photo.favorite);
    const step = rest.length / Math.max(1, capPhotos - fav.length);
    const sampled = Array.from({ length: Math.max(0, capPhotos - fav.length) }, (_, i) => rest[Math.floor(i * step)]).filter(Boolean);
    photos = [...fav.slice(0, capPhotos), ...sampled].slice(0, capPhotos).sort((a, b) => a.time - b.time);
  }
  type Item = { t: number; photo?: StoryPhoto; place?: StoryPlace };
  const items: Item[] = [...photos.map((p) => ({ t: p.time, photo: p })), ...places.map((p) => ({ t: p.time, place: p }))].sort((a, b) => a.t - b.t);
  const cards: Card[] = [];
  let cur: Card = { photos: [], places: [] };
  let load = 0;
  for (const it of items) {
    const w = it.photo ? 1 : PLACE_WEIGHT;
    const full = load + w > CARD_CAPACITY || (it.photo ? cur.photos.length >= PHOTOS_PER_CARD : cur.places.length >= PLACES_PER_CARD);
    if (full) {
      cards.push(cur);
      cur = { photos: [], places: [] };
      load = 0;
    }
    it.photo ? cur.photos.push(it.photo) : cur.places.push(it.place!);
    load += w;
  }
  if (cur.photos.length || cur.places.length) cards.push(cur);
  // se ainda passar do limite (muitos lugares), junta os lugares excedentes no último card
  while (cards.length > MAX_PER_DAY) {
    const extra = cards.pop()!;
    cards[cards.length - 1].places.push(...extra.places.slice(0, 1));
  }
  return cards;
}

function placeCard(ctx: CanvasRenderingContext2D, p: StoryPlace, img: HTMLImageElement | null, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.3)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#fbf7f1';
  roundRect(ctx, x, y, w, h, 28);
  ctx.fill();
  ctx.restore();
  const s = h - 40;
  ctx.save();
  roundRect(ctx, x + 20, y + 20, s, s, 20);
  ctx.clip();
  if (img) cover(ctx, img, x + 20, y + 20, s, s);
  else {
    ctx.fillStyle = p.color;
    ctx.fillRect(x + 20, y + 20, s, s);
    ctx.font = `${Math.round(s * 0.5)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(p.emoji, x + 20 + s / 2, y + 20 + s * 0.68);
  }
  ctx.restore();
  const tx = x + s + 48;
  const tw = w - s - 72;
  ctx.textAlign = 'left';
  ctx.fillStyle = p.color;
  ctx.font = '700 22px Inter';
  ctx.fillText(`${p.emoji}  ${p.kind.toUpperCase()}`, tx, y + 54);
  ctx.fillStyle = '#1a1d26';
  ctx.font = '700 40px Fraunces';
  const nl = wrap(ctx, p.name, tx, y + 102, tw, 44, 2);
  ctx.fillStyle = '#5b6170';
  ctx.font = '400 25px Inter';
  wrap(ctx, p.story, tx, y + 102 + nl * 44 + 4, tw, 33, nl > 1 ? 2 : 3);
  if (p.who.length) {
    ctx.fillStyle = '#5b6170';
    ctx.font = '600 22px Inter';
    ctx.fillText('viram:', tx, y + h - 26);
    faceRow(ctx, p.who.slice(0, 6), tx + 76, y + h - 34, 17, 6);
  }
}

async function dayCard(d: DayStory, card: Card, k: number, total: number, members: Profile[]): Promise<Blob> {
  const [c, ctx] = canvas();
  const th = cityTheme(d.city.split(' → ')[0]);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, th.color);
  g.addColorStop(1, '#1f2a44');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let y = 30; y < H; y += 44) for (let x = (y / 44) % 2 ? 30 : 52; x < W; x += 44) ctx.fillRect(x, y, 3, 3);

  // cabeçalho: grande no primeiro card do dia, compacto nos seguintes
  const first = k === 0;
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = '600 32px Inter';
  ctx.fillText(`DIA ${d.index + 1} · ${d.dow.toUpperCase()} ${d.date}${total > 1 ? `   ${k + 1}/${total}` : ''}`, 80, 120);
  ctx.fillStyle = '#fff';
  let top: number;
  if (first) {
    fitFont(ctx, `${th.emoji} ${d.city}`, 104, W - 150);
    ctx.fillText(`${th.emoji} ${d.city}`, 76, 240);
    ctx.font = '500 44px Fraunces';
    const n = wrap(ctx, d.title, 80, 320, W - 160, 54, 2);
    top = 320 + n * 54 + 40;
  } else {
    fitFont(ctx, `${th.emoji} ${d.city}`, 64, W - 150);
    ctx.fillText(`${th.emoji} ${d.city}`, 76, 200);
    top = 260;
  }

  const placeH = 290;
  const bottom = H - 120;
  const placesH = card.places.length * (placeH + 30);
  const photoH = bottom - top - placesH;

  const imgs = (await Promise.all(card.photos.map((p) => loadImage(p.url)))).filter(Boolean) as HTMLImageElement[];
  if (imgs.length) {
    const lay = card.places.length ? gridLayout(imgs.length, top + 10, photoH - 50) : fitLayout(imgs.length, top + 30, bottom - top - 60);
    imgs.forEach((img, i) => {
      const p = card.photos[i];
      const who = members.find((m) => m.id === p.photo.user_id);
      const hh = new Date(p.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      polaroid(ctx, img, ...lay[i], `${who ? `${who.display_name} · ` : ''}${hh}${p.photo.caption ? ` · ${p.photo.caption}` : ''}`, who);
    });
  }
  const placeTop = imgs.length ? bottom - placesH : top + Math.max(0, (bottom - top - placesH) / 2);
  const placeImgs = await Promise.all(card.places.map((p) => (p.img ? loadImage(p.img) : Promise.resolve(null))));
  card.places.forEach((p, i) => placeCard(ctx, p, placeImgs[i], 70, placeTop + i * (placeH + 30), W - 140, placeH));

  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '400 26px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('Eurotrip 2026', W / 2, H - 50);
  return toJpeg(c);
}

async function coverFrame(s: StoryInput, mosaic: string[]): Promise<Blob> {
  const [c, ctx] = canvas();
  const g = ctx.createLinearGradient(0, 0, W * 0.6, H);
  g.addColorStop(0, '#1f2a44');
  g.addColorStop(0.55, '#3b2a52');
  g.addColorStop(1, '#c4502a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const imgs = (await Promise.all(mosaic.slice(0, 9).map(loadImage))).filter(Boolean) as HTMLImageElement[];
  const cell = W / 3;
  imgs.forEach((img, i) => cover(ctx, img, (i % 3) * cell, Math.floor(i / 3) * cell, cell - 4, cell - 4));
  const fade = ctx.createLinearGradient(0, 600, 0, 1100);
  fade.addColorStop(0, 'rgba(31,42,68,0)');
  fade.addColorStop(1, 'rgba(45,40,80,1)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, 1100);

  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.font = '600 34px Inter';
  ctx.fillText('29 OUT – 10 NOV 2026', 80, 900);
  ctx.fillStyle = '#fff';
  ctx.font = '700 150px Fraunces';
  ctx.fillText('Eurotrip', 72, 1050);
  ctx.font = '500 46px Fraunces';
  ctx.fillText('Lisboa → Roma → Veneza → Paris', 80, 1130);
  const stats: [string, string][] = [
    [String(trip.days.length), 'dias'],
    [String(s.km), 'km a pé'],
    [String(s.totalPhotos), 'fotos'],
    [String(s.totalSeen), 'descobertas'],
  ];
  stats.forEach(([n, l], i) => {
    const x = 80 + (i % 2) * 470;
    const y = 1260 + Math.floor(i / 2) * 170;
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    roundRect(ctx, x, y, 440, 140, 24);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 64px Fraunces';
    ctx.fillText(n, x + 30, y + 80);
    ctx.font = '400 28px Inter';
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.fillText(l, x + 30, y + 118);
  });
  if (s.top.length) {
    const medals = ['🥇', '🥈', '🥉'];
    let x = 80;
    s.top.slice(0, 3).forEach((t, i) => {
      const m = s.members.find((mm) => mm.id === t.id);
      ctx.fillStyle = '#fff';
      ctx.font = '600 32px Inter';
      ctx.fillText(medals[i], x, 1652);
      if (m) drawFace(ctx, m, x + 72, 1640, 24);
      ctx.fillText(t.name, x + 106, 1652);
      x += 106 + ctx.measureText(t.name).width + 44;
    });
  }
  const used = faceRow(ctx, s.members, 80, 1760, 30, 12);
  ctx.font = '400 28px Inter';
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.fillText(s.members.map((m) => m.display_name).join(' · '), 80 + used + 20, 1770);
  return toJpeg(c);
}

async function endFrame(s: StoryInput, cards: number): Promise<Blob> {
  const [c, ctx] = canvas();
  ctx.fillStyle = '#1f2a44';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = '700 130px Fraunces';
  ctx.fillText('Fim.', W / 2, 860);
  ctx.font = '500 48px Fraunces';
  ctx.fillText('…ou até a próxima viagem ✈️', W / 2, 960);
  ctx.font = '400 32px Inter';
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.fillText(`${s.totalPhotos} fotos · ${s.totalSeen} descobertas · ${cards} capítulos`, W / 2, 1060);
  const r = 44;
  const total = s.members.length * (r * 2 + 16) - 16;
  faceRow(ctx, s.members, (W - total) / 2, 1190, r, 16);
  return toJpeg(c);
}

/** Quantos cards cada dia vai gerar (para mostrar antes de montar) */
export function planStory(s: StoryInput) {
  return s.days.map((d) => ({ day: d, cards: planDay(d) })).filter((x) => x.cards.length);
}

/** Gera todos os quadros da história, em ordem */
export async function buildStory(s: StoryInput, onProgress?: (done: number, total: number) => void): Promise<{ name: string; blob: Blob }[]> {
  await fonts();
  await loadFaces(s);
  const plan = planStory(s);
  const nCards = plan.reduce((t, x) => t + x.cards.length, 0);
  const total = nCards + 2;
  const out: { name: string; blob: Blob }[] = [];
  // mosaico da capa: favoritas primeiro, sem repetir, espalhadas pelos dias
  const all = plan.flatMap((x) => x.day.photos);
  const mosaic = [...new Set([...all.filter((p) => p.photo.favorite), ...all].map((p) => p.url))].slice(0, 9);
  out.push({ name: '00-capa.jpg', blob: await coverFrame(s, mosaic) });
  onProgress?.(1, total);
  for (const { day, cards } of plan) {
    for (let k = 0; k < cards.length; k++) {
      const name = `${String(day.index + 1).padStart(2, '0')}-${day.date.replace('/', '-')}-${day.city.toLowerCase().replace(/ → /g, "-")}-${k + 1}.jpg`;
      out.push({ name, blob: await dayCard(day, cards[k], k, cards.length, s.members) });
      onProgress?.(out.length, total);
    }
  }
  out.push({ name: '99-fim.jpg', blob: await endFrame(s, nCards) });
  onProgress?.(total, total);
  return out;
}

/** Só os cards de um dia (colagem do dia, sob demanda) */
export async function buildDayStory(s: StoryInput, dayIndex: number, onProgress?: (done: number, total: number) => void): Promise<{ name: string; blob: Blob }[]> {
  await fonts();
  await loadFaces(s);
  const day = s.days.find((d) => d.index === dayIndex);
  if (!day) return [];
  const cards = planDay(day);
  const out: { name: string; blob: Blob }[] = [];
  for (let k = 0; k < cards.length; k++) {
    out.push({ name: `dia-${String(day.index + 1).padStart(2, '0')}-${day.date.replace('/', '-')}-${k + 1}.jpg`, blob: await dayCard(day, cards[k], k, cards.length, s.members) });
    onProgress?.(k + 1, cards.length);
  }
  return out;
}
