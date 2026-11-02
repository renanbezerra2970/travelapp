import { toAmenityPoi, type Poi } from '../data/pois';
import type { LatLng } from './geo';

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];

/** Tenta os espelhos do Overpass em sequência, com limite de tempo em cada um */
async function query(q: string): Promise<any[]> {
  for (const url of OVERPASS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), signal: ctrl.signal });
      if (r.ok) {
        const j = await r.json();
        if (j.elements) return j.elements;
      }
    } catch {
      /* tenta o próximo */
    } finally {
      clearTimeout(t);
    }
  }
  return [];
}
const cache = new Map<string, Poi[]>();

/** Busca ao vivo no OpenStreetMap quando o catálogo não tem nada por perto (ex.: fora de Veneza/Paris) */
export async function liveNearby(kind: 'wc' | 'agua', at: LatLng, radius = 900): Promise<Poi[]> {
  const key = `${kind}:${at.lat.toFixed(3)},${at.lng.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key)!;
  const a = `(around:${radius},${at.lat},${at.lng})`;
  const sel = kind === 'wc' ? `nwr${a}[amenity=toilets];` : `nwr${a}[amenity=drinking_water];nwr${a}[man_made=water_tap][drinking_water=yes];nwr${a}[amenity=fountain][drinking_water=yes];`;
  try {
    const els: any[] = await query(`[out:json][timeout:15];(${sel});out center tags 40;`);
    const out = els
      .filter((e) => (e.lat ?? e.center?.lat) != null && !['private', 'no'].includes(e.tags?.access))
      .map((e) => {
        const t = e.tags ?? {};
        const charge = String(t.charge ?? '').match(/(\d+(?:[.,]\d+)?)/);
        const sanisette = /sanisette|jcdecaux/i.test(`${t.operator ?? ''} ${t.name ?? ''}`);
        return toAmenityPoi({
          id: `live-${kind}-${e.type}-${e.id}`,
          city: 'Paris',
          amenity: kind,
          name: t.name || (kind === 'wc' ? 'Banheiro' : 'Água potável'),
          lat: e.lat ?? e.center.lat,
          lng: e.lon ?? e.center.lon,
          fee: t.fee === 'yes' ? true : t.fee === 'no' || kind === 'agua' || sanisette ? false : null,
          price: charge ? `€${Number(charge[1].replace(',', '.')).toFixed(2).replace('.', ',')}` : null,
          hours: t.opening_hours ?? null,
          wheelchair: t.wheelchair ?? null,
          access: t.access === 'customers' ? 'customers' : null,
          story: kind === 'wc' ? 'Encontrado no OpenStreetMap perto de você.' : 'Ponto de água potável encontrado no OpenStreetMap perto de você.',
          osm: `${e.type}/${e.id}`,
        });
      });
    if (out.length) cache.set(key, out);
    return out;
  } catch {
    return [];
  }
}
