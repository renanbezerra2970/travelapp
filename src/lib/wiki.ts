import type { LatLng } from './geo';

export type WikiSummary = {
  title: string;
  extract: string;
  thumbnail?: string;
  image?: string;
  url: string;
};

export type WikiNearby = { pageid: number; title: string; lat: number; lng: number; dist: number };

const API = 'https://pt.wikipedia.org/w/api.php';
const REST = 'https://pt.wikipedia.org/api/rest_v1/page/summary/';
const cache = new Map<string, Promise<WikiSummary | null>>();

export function wikiSummary(title: string): Promise<WikiSummary | null> {
  if (!cache.has(title)) {
    cache.set(
      title,
      fetch(REST + encodeURIComponent(title.replace(/ /g, '_')))
        .then((r) => (r.ok ? r.json() : null))
        .then((j) =>
          j && j.type !== 'disambiguation' && j.extract
            ? {
                title: j.title,
                extract: j.extract,
                thumbnail: j.thumbnail?.source,
                image: j.originalimage?.source,
                url: j.content_urls?.mobile?.page ?? j.content_urls?.desktop?.page,
              }
            : null,
        )
        .catch(() => null),
    );
  }
  return cache.get(title)!;
}

/** Artigos da Wikipédia com coordenadas ao redor de um ponto (máx. 10 km) */
export async function wikiNearby(c: LatLng, radius = 900, limit = 40): Promise<WikiNearby[]> {
  const u = new URL(API);
  u.search = new URLSearchParams({
    action: 'query',
    list: 'geosearch',
    gscoord: `${c.lat}|${c.lng}`,
    gsradius: String(Math.min(10000, radius)),
    gslimit: String(limit),
    format: 'json',
    origin: '*',
  }).toString();
  try {
    const j = await fetch(u).then((r) => r.json());
    return (j?.query?.geosearch ?? []).map((g: any) => ({ pageid: g.pageid, title: g.title, lat: g.lat, lng: g.lon, dist: g.dist }));
  } catch {
    return [];
  }
}

/** Resumo para um ponto: tenta o título; se falhar, usa o artigo mais próximo das coordenadas */
export async function wikiForPlace(title: string | undefined, at: LatLng): Promise<WikiSummary | null> {
  if (title) {
    const s = await wikiSummary(title);
    if (s) return s;
  }
  const near = await wikiNearby(at, 120, 1);
  return near[0] ? wikiSummary(near[0].title) : null;
}
