// Galeria infinita (arrastar em qualquer direção + zoom infinito por "oitavas").
// Adaptada do componente "Infinity Canvas — Originkit": sem framer-motion (refs simples),
// com pinça no celular, toque para abrir a foto e etiqueta opcional em cada foto.
import { useEffect, useMemo, useRef } from 'react';

export type GalleryImage = { src: string; alt?: string; key: string };

type Props = {
  images: GalleryImage[];
  density?: number; // 1..15 fotos por célula
  imageWidth?: number;
  imageHeight?: number;
  rounded?: number; // 0..20
  dragSpeed?: number; // 1..100 (20 = 1×)
  driftAmount?: number;
  friction?: number; // 1..20
  backgroundColor?: string;
  onOpen?: (key: string) => void;
};

function hash3(cx: number, cy: number, cz: number, salt: number) {
  let h = (cx | 0) * 0x8da6b343;
  h ^= Math.imul(cy | 0, 0xd8163841);
  h ^= Math.imul(cz | 0, 0xcb1ab31f);
  h ^= salt | 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Tile = { wx: number; wy: number; cx: number; cy: number; slot: number; octave: number; imgIdx: number; w: number; h: number; rot: number; bakedScale: number };

const PX_PER_UNIT = 6;
const CELL_SIZE = 110;
const MAX_RANGE = 20;
const SCALE_MIN = 0.45;
const SCALE_MAX = 1.6;

export default function InfiniteGallery({
  images,
  density = 5,
  imageWidth = 150,
  imageHeight = 190,
  rounded = 3,
  dragSpeed = 20,
  driftAmount = 8,
  friction = 10,
  backgroundColor = '#0b0b10',
  onOpen,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;

  const safeDensity = Math.max(1, Math.min(15, Math.floor(density)));
  const safeRounded = Math.max(0, Math.min(20, rounded));
  const safeDragSpeed = Math.max(0.1, Math.min(5, dragSpeed / 20));
  const safeDrift = Math.max(0, Math.min(20, driftAmount));
  const safeFriction = 1 - (Math.max(1, Math.min(20, friction)) / 20) * 0.3;

  // estado da câmera fora do React (nada re-renderiza por quadro)
  const st = useRef({ pinching: false, tx: 0, ty: 0, cx: 0, cy: 0, vx: 0, vy: 0, tlz: 0, lz: 0, vlz: 0, dtx: 0, dty: 0, dx: 0, dy: 0 });

  const subN = Math.max(1, Math.ceil(Math.sqrt(safeDensity)));
  const subSize = CELL_SIZE / subN;
  const perCell = Math.min(safeDensity, subN * subN);
  const n = images.length;

  const generateCell = useMemo(
    () =>
      (gx: number, gy: number, octave: number): Tile[] => {
        const rand = mulberry32(hash3(gx, gy, octave | 0, 0x9e3779b1));
        const total = subN * subN;
        const subs = Array.from({ length: total }, (_, i) => i);
        for (let i = total - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [subs[i], subs[j]] = [subs[j], subs[i]];
        }
        const pad = subSize * 0.1;
        const inner = Math.max(0, subSize - pad * 2);
        const tiles: Tile[] = [];
        for (let slot = 0; slot < perCell; slot++) {
          const si = subs[slot];
          tiles.push({
            wx: gx * CELL_SIZE + (si % subN) * subSize + pad + rand() * inner,
            wy: gy * CELL_SIZE + Math.floor(si / subN) * subSize + pad + rand() * inner,
            cx: gx,
            cy: gy,
            slot,
            octave,
            bakedScale: SCALE_MIN + rand() * (SCALE_MAX - SCALE_MIN),
            imgIdx: n ? Math.floor(rand() * n) % n : 0,
            w: imageWidth / PX_PER_UNIT,
            h: imageHeight / PX_PER_UNIT,
            rot: (rand() - 0.5) * 6,
          });
        }
        return tiles;
      },
    [n, imageWidth, imageHeight, subN, subSize, perCell],
  );

  // ── laço de quadros ──
  useEffect(() => {
    const scene = sceneRef.current;
    const container = containerRef.current;
    if (!scene || !container || !n) return;
    let cW = container.clientWidth || 400;
    let cH = container.clientHeight || 700;
    const ro = new ResizeObserver(() => {
      cW = container.clientWidth || cW;
      cH = container.clientHeight || cH;
    });
    ro.observe(container);

    const pools = new Map<number, Map<string, HTMLDivElement>>();
    const pool = (o: number) => {
      let p = pools.get(o);
      if (!p) pools.set(o, (p = new Map()));
      return p;
    };
    const dispose = (o: number) => {
      pools.get(o)?.forEach((el) => el.remove());
      pools.delete(o);
    };

    const ensure = (t: Tile) => {
      const p = pool(t.octave);
      const key = `${t.cx},${t.cy},${t.slot}`;
      let el = p.get(key);
      if (!el) {
        el = document.createElement('div');
        el.style.cssText = 'position:absolute;left:50%;top:50%;transform-origin:0 0;will-change:transform,opacity;';
        const img = document.createElement('img');
        const src = images[t.imgIdx];
        img.src = src.src;
        img.alt = src.alt ?? '';
        img.draggable = false;
        img.decoding = 'async';
        img.loading = 'lazy';
        img.dataset.photo = src.key;
        img.style.cssText = `width:100%;height:100%;object-fit:cover;display:block;user-select:none;box-shadow:0 8px 24px rgba(0,0,0,.45);background:#222;border-radius:${(safeRounded / 20) * (Math.min(imageWidth, imageHeight) / 2)}px`;
        el.appendChild(img);
        scene.appendChild(el);
        p.set(key, el);
      }
      return el;
    };

    const projectLayer = (octave: number, scale: number, alpha: number, zBase: number, cx: number, cy: number) => {
      const p = pool(octave);
      const ccx = Math.floor(cx / CELL_SIZE);
      const ccy = Math.floor(cy / CELL_SIZE);
      const rx = Math.min(MAX_RANGE, Math.ceil(cW / 2 / (PX_PER_UNIT * scale) / CELL_SIZE) + 1);
      const ry = Math.min(MAX_RANGE, Math.ceil(cH / 2 / (PX_PER_UNIT * scale) / CELL_SIZE) + 1);
      const visible = new Set<string>();
      const order: [HTMLDivElement, number][] = [];
      for (let dy = -ry; dy <= ry; dy++)
        for (let dx = -rx; dx <= rx; dx++)
          for (const t of generateCell(ccx + dx, ccy + dy, octave)) {
            const key = `${t.cx},${t.cy},${t.slot}`;
            visible.add(key);
            const el = ensure(t);
            const wPx = t.w * PX_PER_UNIT;
            const hPx = t.h * PX_PER_UNIT;
            el.style.transform = `translate3d(${(t.wx - cx) * scale * PX_PER_UNIT}px,${(t.wy - cy) * scale * PX_PER_UNIT}px,0) scale(${t.bakedScale * scale}) rotate(${t.rot}deg) translate(${-wPx / 2}px,${-hPx / 2}px)`;
            el.style.width = `${wPx}px`;
            el.style.height = `${hPx}px`;
            el.style.opacity = String(alpha);
            el.style.pointerEvents = alpha > 0.5 ? 'auto' : 'none';
            order.push([el, t.bakedScale]);
          }
      p.forEach((el, key) => {
        if (!visible.has(key)) {
          el.remove();
          p.delete(key);
        }
      });
      order.sort((a, b) => a[1] - b[1]).forEach(([el], k) => (el.style.zIndex = String(zBase + k)));
    };

    let last = new Set<number>();
    let prev = '';
    const project = () => {
      const s = st.current;
      // parado: não redesenha
      const sig = `${s.cx.toFixed(2)},${s.cy.toFixed(2)},${s.lz.toFixed(4)},${cW},${cH}`;
      if (sig === prev) return;
      prev = sig;
      const octave = Math.floor(s.lz);
      const frac = s.lz - octave;
      const now = new Set<number>();
      // camada quase invisível não é desenhada (metade do trabalho quando o zoom está assentado)
      if (1 - frac > 0.02) {
        projectLayer(octave, 2 ** frac, 1 - frac, 0, s.cx, s.cy);
        now.add(octave);
      }
      if (frac > 0.02) {
        projectLayer(octave + 1, 2 ** (frac - 1), frac, 100000, s.cx, s.cy);
        now.add(octave + 1);
      }
      [...last, ...pools.keys()].forEach((o) => !now.has(o) && dispose(o));
      last = now;
    };

    let raf = 0;
    const loop = () => {
      const s = st.current;
      s.tx += s.vx;
      s.ty += s.vy;
      s.vx *= safeFriction;
      s.vy *= safeFriction;
      if (s.vlz) {
        s.tlz += s.vlz;
        s.vlz = Math.abs(s.vlz) < 1e-4 ? 0 : s.vlz * safeFriction;
      } else if (!s.pinching) {
        // em repouso, assenta na camada mais próxima (fotos nítidas, sem transparência)
        s.tlz = lerp(s.tlz, Math.round(s.tlz), 0.08);
      }
      s.dx = lerp(s.dx, s.dtx * safeDrift, 0.08);
      s.dy = lerp(s.dy, s.dty * safeDrift, 0.08);
      s.cx = lerp(s.cx, s.tx + s.dx, 0.18);
      s.cy = lerp(s.cy, s.ty + s.dy, 0.18);
      s.lz = lerp(s.lz, s.tlz, 0.18);
      project();
      raf = requestAnimationFrame(loop);
    };
    project();
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      [...pools.keys()].forEach(dispose);
    };
  }, [generateCell, images, n, safeFriction, safeDrift, safeRounded, imageWidth, imageHeight]);

  // ── entrada: arrastar, roda do mouse, pinça e toque ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const s = st.current;
    const pointers = new Map<number, { x: number; y: number }>();
    let last = { x: 0, y: 0, t: 0 };
    let moved = 0;
    let pinch = 0;

    const effScale = () => {
      const frac = s.lz - Math.floor(s.lz);
      return (1 - frac) * 2 ** frac + frac * 2 ** (frac - 1);
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* sem captura */
      }
      if (pointers.size === 1) {
        last = { x: e.clientX, y: e.clientY, t: e.timeStamp };
        moved = 0;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
        s.pinching = true;
        moved = 99; // pinça nunca é toque
      }
      el.style.cursor = 'grabbing';
    };

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      s.dtx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      s.dty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) s.tlz += Math.log2(d / pinch);
        pinch = d;
        return;
      }
      const dpx = e.clientX - last.x;
      const dpy = e.clientY - last.y;
      moved += Math.abs(dpx) + Math.abs(dpy);
      const k = PX_PER_UNIT * effScale();
      const wx = (-dpx / k) * safeDragSpeed;
      const wy = (-dpy / k) * safeDragSpeed;
      s.tx += wx;
      s.ty += wy;
      const dt = Math.max(1, e.timeStamp - last.t);
      s.vx = wx * (16 / dt);
      s.vy = wy * (16 / dt);
      last = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    };

    const up = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* sem captura */
      }
      if (pointers.size < 2) {
        pinch = 0;
        s.pinching = false;
      }
      if (pointers.size === 0) {
        el.style.cursor = 'grab';
        // toque curto sem arrastar = abrir a foto embaixo do dedo
        if (moved < 8) {
          s.vx = s.vy = 0;
          const hit = document.elementsFromPoint(e.clientX, e.clientY).find((n) => (n as HTMLElement).dataset?.photo) as HTMLElement | undefined;
          if (hit) openRef.current?.(hit.dataset.photo!);
        }
      } else {
        const p = [...pointers.values()][0];
        last = { x: p.x, y: p.y, t: e.timeStamp };
      }
    };

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= 400;
      s.vlz += -d * 0.0015 * safeDragSpeed;
    };
    const leave = () => {
      s.dtx = 0;
      s.dty = 0;
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('pointerleave', leave);
    };
  }, [safeDragSpeed]);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor, touchAction: 'none', userSelect: 'none', cursor: 'grab' }}>
      <div ref={sceneRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
