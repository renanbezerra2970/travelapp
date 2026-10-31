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
const NOT_PHOTO = /map|mapa|locator|location|localiza|\.svg|flag|bandeira|coat_of_arms|bras[ãa]o/i;

async function englishImage(ptTitle: string): Promise<{ thumbnail?: string; image?: string } | null> {
  try {
    const u = `${API}?action=query&prop=langlinks&lllang=en&format=json&formatversion=2&origin=*&titles=${encodeURIComponent(ptTitle)}`;
    const en = (await fetch(u).then((r) => r.json()))?.query?.pages?.[0]?.langlinks?.[0]?.title;
    if (!en) return null;
    const j = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(en.replace(/ /g, '_'))}`).then((r) => (r.ok ? r.json() : null));
    const img = j?.originalimage?.source ?? j?.thumbnail?.source;
    return img && !NOT_PHOTO.test(img) ? { thumbnail: j.thumbnail?.source, image: j.originalimage?.source } : null;
  } catch {
    return null;
  }
}

export function wikiSummary(title: string): Promise<WikiSummary | null> {
  if (!cache.has(title)) {
    cache.set(
      title,
      fetch(REST + encodeURIComponent(title.replace(/ /g, '_')))
        .then((r) => (r.ok ? r.json() : null))
        .then(async (j) => {
          if (!j || j.type === 'disambiguation' || !j.extract) return null;
          let thumbnail = j.thumbnail?.source as string | undefined;
          let image = j.originalimage?.source as string | undefined;
          // muitos artigos em português usam um mapa de localização como imagem: troca pela foto do artigo em inglês
          if (!thumbnail || NOT_PHOTO.test(image ?? thumbnail)) {
            const en = await englishImage(j.title);
            thumbnail = en?.thumbnail;
            image = en?.image;
          }
          return { title: j.title, extract: j.extract, thumbnail, image, url: j.content_urls?.mobile?.page ?? j.content_urls?.desktop?.page };
        })
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
