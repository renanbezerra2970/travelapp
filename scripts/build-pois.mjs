// Gera src/data/pois-wiki.json: pontos turísticos por cidade a partir da Wikipédia em português.
// Busca artigos com coordenadas nas áreas visitadas, ordena por audiência (pageviews de 60 dias),
// filtra o que não é atração (estações, ruas, hotéis…) e guarda o resumo como "história".
// Uso: node scripts/build-pois.mjs [porCidade=140]

import { readFileSync, writeFileSync } from 'node:fs';

const PER_CITY = Number(process.argv[2] ?? 140);
const API = 'https://pt.wikipedia.org/w/api.php';
const REST = 'https://pt.wikipedia.org/api/rest_v1/page/summary/';
const UA = { 'User-Agent': 'EurotripTravelApp/1.0 (build script; github.com/renanbezerra2970/travelapp)' };

const AREAS = {
  Roma: [[41.9022, 12.4539], [41.8986, 12.4769], [41.8902, 12.4922], [41.9058, 12.4823], [41.8894, 12.47], [41.884, 12.48], [41.8976, 12.4985], [41.9142, 12.492], [41.9065, 12.4665]],
  Lisboa: [[38.697, -9.206], [38.71, -9.137], [38.712, -9.13], [38.712, -9.144], [38.72, -9.145], [38.713, -9.16], [38.7075, -9.15]],
  Veneza: [[45.434, 12.339], [45.438, 12.336], [45.431, 12.327], [45.443, 12.33], [45.435, 12.35], [45.4395, 12.32], [45.457, 12.353], [45.485, 12.417], [45.4285, 12.343]],
  Paris: [[48.858, 2.2945], [48.861, 2.336], [48.854, 2.347], [48.847, 2.344], [48.858, 2.36], [48.871, 2.332], [48.87, 2.307], [48.886, 2.341], [48.8565, 2.312], [48.8049, 2.1204]],
};
const RADIUS = { Roma: 1300, Lisboa: 1200, Veneza: 1000, Paris: 1300 };

// Não são atrações
const BAD_TITLE = /^albergo|^auditorium|associa[çc][ãa]o|funda[çc][ãa]o|fondation|^apeadeiro|^central |esta[çc][ãa]o|metr[oô]|metropolitano|linha \d|hotel|escola|liceu|col[ée]gio|embaixada|^rua |^avenida|^via |^viale |^corso |^largo do |^travessa|^cal(le)? |^rue |^boulevard|^avenue|^quai |^calçada|freguesia|^rione|^sestiere|arrondissement|^quartier|aeroporto|hospital|instituto|minist[ée]rio|banco |tribunal|^lista |^edif[íi]cio |^bairro|^distrito|^zona |gare |porto de |conservat[óo]rio|pontif[íi]cia universidade|sede d|^campo de |futebol|est[áa]dio ol[ií]mpico|^(\d{4}) /i;
const BAD_EVENT = /^(ataque|atentado|batalha|cerco|massacre|revolta|inc[êe]ndio|tratado|tomada|motim|greve|ag[êe]ncia|caritas|assembleia|minist|conselho|autoridade|comiss[ãa]o|federa[çc][ãa]o|sindicato|partido|jornal|editora|empresa|sociedade)|antidopagem|(em|de) \d{4}$/i;
const BAD_DESC = /esta[çc][ãa]o|metr[oô]|freguesia|rua|avenida|hotel|escola|empresa|bairro|subdivis|banco|jogador|futebolista|pessoa|ator|atriz|cantor|pol[ií]tico|clube|universidade|faculdade|hospital/i;

const KINDS = [
  [/bas[íi]lica/i, '⛪', 'Basílica'], [/catedral|s[ée] de/i, '⛪', 'Catedral'], [/capela|chapelle|cappella/i, '⛪', 'Capela'],
  [/igreja|église|chiesa|santa |santo |san |são |saint-|sainte-|oratório|convento|mosteiro|abadia|scuola grande/i, '⛪', 'Igreja'],
  [/museu|musée|museo|galeria|galleria|pinacoteca|mus[ée]e/i, '🖼️', 'Museu'],
  [/pal[áa]cio|palazzo|palais|pa[çc]o|h[ôo]tel de|ca' |villa |ch[âa]teau|casa /i, '🏰', 'Palácio'],
  [/castelo|castel|fortaleza|forte |torre de bel/i, '🏯', 'Fortaleza'],
  [/ponte|pont |puente/i, '🌉', 'Ponte'], [/fonte|fontana|fontaine|chafariz/i, '⛲', 'Fonte'],
  [/obelisco|ob[ée]lisque/i, '🗿', 'Obelisco'], [/est[áa]tua|monumento|monument|mem[oó]rial|coluna|colonne/i, '🗿', 'Monumento'],
  [/arco|arc de|porta |porte /i, '🏛️', 'Arco/Porta'],
  [/templo|tempio|f[óo]rum|foro|termas|terme|teatro de |mausol[ée]u|circo|est[áa]dio de domiciano|aqueduto|ru[íi]nas|domus|catacumba|thermes|arènes/i, '🏚️', 'Ruínas'],
  [/teatro|th[ée]âtre|[óo]pera|cinema|cabaré/i, '🎭', 'Teatro'], [/torre|tour |campan[áa]rio|campanile|elevador/i, '🗼', 'Torre'],
  [/jardim|jardin|giardino|parque|parc |villa borghese|bosque/i, '🌳', 'Jardim'],
  [/pra[çc]a|piazza|place |largo|campo |square|terreiro|rossio/i, '🏟️', 'Praça'],
  [/mercado|march[ée]|mercato|galerias? lafayette|passage/i, '🧺', 'Mercado'],
  [/biblioteca|livraria|biblioth/i, '📚', 'Biblioteca'], [/cemit[ée]rio|cimeti/i, '🪦', 'Cemitério'],
  [/miradouro|mirante|belvedere/i, '🌅', 'Mirante'], [/colina|monte |montagne|butte/i, '⛰️', 'Colina'],
  [/ilha|isola|île/i, '🏝️', 'Ilha'], [/canal|rio |canale/i, '🛶', 'Canal'],
  [/sinagoga|gueto|ghetto/i, '🕍', 'Sinagoga'], [/universidade|sorbonne|academia|accademia/i, '🎓', 'Academia'],
  [/caf[ée]|restaurante|pastelaria|brasserie|bistro/i, '☕', 'Café'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// A Wikipédia limita rajadas ("too busy", 429, página de erro HTML): tenta de novo com espera crescente
async function getJSON(url, tries = 7) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.status === 404) return null;
      const text = await r.text();
      if (r.ok && text.startsWith('{')) {
        const j = JSON.parse(text);
        const code = j?.error?.code ?? '';
        if (!/busy|maxlag|ratelimit|internal/i.test(code)) return j;
      }
    } catch {
      /* rede */
    }
    await sleep(2000 * 2 ** i);
  }
  console.warn('falhou:', url.slice(0, 120));
  return null;
}
const q = (params) => `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;

function dist(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// Pontos curados (src/data/pois.ts) para não duplicar
const curatedSrc = readFileSync(new URL('../src/data/pois.ts', import.meta.url), 'utf8');
const curated = [...curatedSrc.matchAll(/lat: ([\d.-]+), lng: ([\d.-]+)(?:, year: '[^']*')?, wiki: '((?:[^'\\]|\\.)*)'/g)].map((m) => ({ lat: +m[1], lng: +m[2], wiki: m[3].replace(/\\'/g, "'").toLowerCase() }));
const curatedAll = [...curatedSrc.matchAll(/lat: ([\d.-]+), lng: ([\d.-]+)/g)].map((m) => ({ lat: +m[1], lng: +m[2] }));
console.log(`curados: ${curatedAll.length} (com wiki: ${curated.length})`);

const out = [];
const usedTitles = new Set(curated.map((c) => c.wiki));

for (const [city, centers] of Object.entries(AREAS)) {
  const found = new Map();
  for (const [lat, lng] of centers) {
    const j = await getJSON(q({ action: 'query', list: 'geosearch', gscoord: `${lat}|${lng}`, gsradius: String(RADIUS[city]), gslimit: '500', gsnamespace: '0' }));
    for (const g of j?.query?.geosearch ?? []) if (!found.has(g.title)) found.set(g.title, { title: g.title, lat: g.lat, lng: g.lon });
    await sleep(1200);
  }
  let cands = [...found.values()].filter((c) => !BAD_TITLE.test(c.title) && !usedTitles.has(c.title.toLowerCase()) && !curatedAll.some((p) => dist(p, c) < 30));
  console.log(`${city}: ${found.size} artigos, ${cands.length} candidatos`);

  // audiência dos últimos 60 dias
  for (let i = 0; i < cands.length; i += 50) {
    const batch = cands.slice(i, i + 50);
    const j = await getJSON(q({ action: 'query', prop: 'pageviews', pvipdays: '60', titles: batch.map((b) => b.title).join('|') }));
    for (const p of j?.query?.pages ?? []) {
      const c = batch.find((b) => b.title === p.title);
      if (c) c.views = Object.values(p.pageviews ?? {}).reduce((s, v) => s + (v ?? 0), 0);
    }
    await sleep(800);
  }
  console.log(`${city}: audiência obtida para ${cands.filter((c) => c.views != null).length}/${cands.length}`);
  cands.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));

  // resumos, na ordem de audiência, até completar a cota
  const picked = [];
  let idx = 0;
  while (picked.length < PER_CITY && idx < cands.length) {
    const chunk = cands.slice(idx, idx + 4);
    idx += 4;
    const sums = await Promise.all(chunk.map((c) => getJSON(REST + encodeURIComponent(c.title.replace(/ /g, '_')))));
    chunk.forEach((c, k) => {
      const s = sums[k];
      if (!s || s.type !== 'standard' || !s.extract || s.extract.length < 120) return;
      if (s.description && BAD_DESC.test(s.description)) return;
      if (BAD_EVENT.test(s.title) || /(foi um|foi uma) (ataque|atentado|batalha|conflito|cerco|massacre|evento)/i.test(s.extract.slice(0, 200))) return;
      if (BAD_DESC.test(s.extract.slice(0, 90)) && !/igreja|bas[íi]lica|museu|pal[áa]cio|monumento|pra[çc]a|ponte|fonte|torre/i.test(s.extract.slice(0, 90))) return;
      if (picked.some((p) => dist(p, c) < 15)) return;
      const text = `${c.title} ${s.description ?? ''} ${s.extract.slice(0, 160)}`;
      const kind = KINDS.find(([re]) => re.test(c.title)) ?? KINDS.find(([re]) => re.test(text)) ?? [null, '📍', 'Atração'];
      picked.push({
        id: `${city.slice(0, 3).toLowerCase()}-w-${slug(c.title)}`,
        city,
        name: s.title,
        emoji: kind[1],
        kind: kind[2],
        lat: +c.lat.toFixed(5),
        lng: +c.lng.toFixed(5),
        wiki: s.title,
        story: s.extract.replace(/\s+/g, ' ').trim(),
        views: c.views ?? 0,
      });
    });
    await sleep(400);
  }
  picked.forEach((p, i) => {
    p.rarity = i < 8 ? 'lendario' : i < 30 ? 'epico' : i < 70 ? 'raro' : 'comum';
    delete p.views;
  });
  console.log(`${city}: ${picked.length} pontos`);
  out.push(...picked);
}

const ids = new Set();
const final = out.filter((p) => (ids.has(p.id) ? false : ids.add(p.id)));
writeFileSync(new URL('../src/data/pois-wiki.json', import.meta.url), JSON.stringify(final));
console.log(`total: ${final.length}`);
