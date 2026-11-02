// Gera src/data/amenities.json: banheiros e pontos de água potável ao longo do roteiro (OpenStreetMap).
// Para cada turno das cidades escolhidas, busca no Overpass em volta do trajeto das paradas e fica
// com os mais próximos, garantindo que cada turno tenha os dois tipos. Guarda grátis/pago, preço,
// horário, acessibilidade e se é só para clientes.
// Uso: node scripts/build-amenities.mjs [total=100] [cidades=Veneza,Paris]
import { readFileSync, writeFileSync } from 'node:fs';

const TOTAL = Number(process.argv[2] ?? 100);
const CITIES = (process.argv[3] ?? 'Veneza,Paris').split(',');
const RADIUS = 350; // metros em volta do trajeto do turno
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const UA = { 'User-Agent': 'EurotripTravelApp/1.0 (build script; github.com/renanbezerra2970/travelapp)' };

const trip = JSON.parse(readFileSync(new URL('../src/data/trip.json', import.meta.url), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dist = (a, b) => {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

async function overpass(q) {
  for (let i = 0; i < 6; i++) {
    const url = OVERPASS[i % OVERPASS.length];
    try {
      const r = await fetch(url, { method: 'POST', headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
      if (r.ok) {
        const j = await r.json();
        // sob carga o Overpass responde 200 com "remark" e sem elementos: trata como falha
        if (j.elements?.length) return j.elements;
        console.warn('Overpass vazio:', j.remark ?? '(sem remark)');
      }
    } catch {
      /* rede */
    }
    await sleep(3000 * (i + 1));
  }
  throw new Error('Overpass indisponível');
}

/** Preço legível a partir de charge=1.50 EUR / 1,5 € etc. */
function price(t) {
  const c = t.charge ?? t['charge:conditional'];
  if (!c) return null;
  const m = String(c).match(/(\d+(?:[.,]\d+)?)\s*(eur|€)?/i);
  return m ? `€${Number(m[1].replace(',', '.')).toFixed(2).replace('.', ',')}` : String(c).slice(0, 20);
}

function describe(kind, t, cityName) {
  const bits = [];
  if (kind === 'wc') {
    if (/sanisette|jcdecaux/i.test(`${t.operator ?? ''} ${t.name ?? ''} ${t.brand ?? ''}`)) bits.push('Sanisette: banheiro público automático, que se limpa sozinho após cada uso.');
    else if (/veritas|ama/i.test(`${t.operator ?? ''}`) || (cityName === 'Veneza' && t.fee === 'yes')) bits.push('Banheiro público da cidade (Veritas), com atendente.');
    else if (t.access === 'customers') bits.push('Banheiro de estabelecimento: liberado para clientes.');
    else bits.push('Banheiro público.');
    if (t.changing_table === 'yes') bits.push('Tem trocador.');
    if (t.unisex === 'yes') bits.push('Unissex.');
  } else {
    if (/wallace/i.test(`${t.name ?? ''} ${t.brand ?? ''} ${t.description ?? ''}`) || t.fountain === 'drinking' && cityName === 'Paris') bits.push('Fonte de água potável (muitas são as históricas fontes Wallace, de 1872).');
    else if (cityName === 'Veneza') bits.push('Fontanella de água potável: pode encher a garrafa à vontade.');
    else bits.push('Ponto de água potável para encher a garrafa.');
    if (t.bottle === 'yes') bits.push('Fácil para encher garrafa.');
    if (t.seasonal === 'yes') bits.push('Pode ficar desligada no inverno.');
  }
  return bits.join(' ');
}

const out = [];
for (const cityName of CITIES) {
  const city = trip.cities.find((c) => c.name === cityName);
  if (!city) continue;
  const short = (n) => n.split(/ — | – | \(| · |:/)[0].replace(/^(Saída|Chegada) (do|da|de) /i, '').trim().slice(0, 34);
  const turnos = city.turnos.map((t) => ({ id: t.id, title: t.title, pts: t.stops.filter((s) => s.ll).map((s) => ({ lat: s.ll[0], lng: s.ll[1], name: short(s.name) })) })).filter((t) => t.pts.length);
  // uma consulta por cidade: união dos trajetos de todos os turnos
  // referências para o nome ("perto de …"): só paradas de passeio
  const landmarks = city.turnos.flatMap((t) => t.stops.filter((st) => st.ll && !['hotel', 'transit', 'food', 'flight'].includes(st.type)).map((st) => ({ lat: st.ll[0], lng: st.ll[1], name: short(st.name.split(' → ')[0]) }))).filter((l) => !/^(volta|ida|vaporetto|metr[ôo]|rer|trem|[ôo]nibus|barco|táxi|bolt|pouso|voo|check)/i.test(l.name));
  const lines = turnos.map((t) => t.pts.map((p) => `${p.lat},${p.lng}`).join(','));
  const around = lines.map((l) => `(around:${RADIUS},${l})`);
  const q = `[out:json][timeout:90];(${around
    .map((a) => `nwr${a}[amenity=toilets];nwr${a}[amenity=drinking_water];nwr${a}[man_made=water_tap][drinking_water=yes];nwr${a}[amenity=fountain][drinking_water=yes];`)
    .join('')});out center tags;`;
  const els = await overpass(q);
  const found = new Map();
  for (const e of els) {
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    if (lat == null) continue;
    const t = e.tags ?? {};
    if (t.access === 'private' || t.access === 'no' || t.disused === 'yes') continue;
    const kind = t.amenity === 'toilets' ? 'wc' : 'agua';
    found.set(`${e.type}/${e.id}`, { osm: `${e.type}/${e.id}`, kind, lat, lng, t });
  }
  console.log(`${cityName}: ${found.size} encontrados (${[...found.values()].filter((x) => x.kind === 'wc').length} banheiros)`);

  // cota da cidade proporcional ao número de turnos; dentro do turno, mais banheiros que água
  const quota = Math.round((TOTAL * turnos.length) / CITIES.reduce((s, c) => s + (trip.cities.find((x) => x.name === c)?.turnos.length ?? 0), 0));
  const perTurno = Math.max(4, Math.floor(quota / turnos.length));
  const picked = new Map();
  for (const tr of turnos) {
    // banheiro com grátis/pago informado ganha prioridade (o viajante precisa saber antes de ir)
    const penalty = (x) => (x.kind === 'wc' && !x.t.fee ? 140 : 0) + (x.kind === 'wc' && x.t.access === 'customers' ? 60 : 0);
    const near = [...found.values()]
      .map((x) => ({ x, d: Math.min(...tr.pts.map((p) => dist(p, x))) }))
      .filter((y) => y.d <= RADIUS)
      .sort((a, b) => a.d + penalty(a.x) - (b.d + penalty(b.x)));
    const wcWant = Math.ceil(perTurno * 0.55);
    const take = (kind, n) => near.filter((y) => y.x.kind === kind && !picked.has(y.x.osm)).slice(0, n).forEach((y) => picked.set(y.x.osm, { ...y.x, turno: tr.id }));
    take('wc', wcWant);
    take('agua', perTurno - wcWant);
    // completa com o que houver se faltou de um dos tipos
    const missing = perTurno - [...picked.values()].filter((p) => p.turno === tr.id).length;
    if (missing > 0) near.filter((y) => !picked.has(y.x.osm)).slice(0, missing).forEach((y) => picked.set(y.x.osm, { ...y.x, turno: tr.id }));
  }
  // ajusta para a cota exata da cidade, priorizando o que está mais perto de qualquer parada
  let list = [...picked.values()];
  if (list.length < quota) {
    const all = turnos.flatMap((t) => t.pts);
    const extra = [...found.values()].filter((x) => !picked.has(x.osm)).map((x) => ({ x, d: Math.min(...all.map((p) => dist(p, x))) })).sort((a, b) => a.d - b.d);
    list.push(...extra.slice(0, quota - list.length).map((y) => y.x));
  }
  list = list.slice(0, quota);

  const n = { wc: 0, agua: 0 };
  for (const p of list) {
    const t = p.t;
    // água potável pública é grátis; Sanisettes de Paris são grátis desde 2006
    const sanisette = /sanisette|jcdecaux/i.test(`${t.operator ?? ''} ${t.name ?? ''} ${t.brand ?? ''}`);
    const fee = t.fee === 'yes' ? true : t.fee === 'no' ? false : p.kind === 'agua' || sanisette ? false : null;
    const all = landmarks.length ? landmarks : turnos.flatMap((tt) => tt.pts);
    const nearest = all.reduce((best, q) => (dist(q, p) < dist(best, p) ? q : best), all[0]);
    const i = ++n[p.kind];
    out.push({
      id: `${p.kind}-${cityName.slice(0, 3).toLowerCase()}-${p.osm.replace('/', '-')}`,
      city: cityName,
      amenity: p.kind,
      name: t.name || t['name:pt'] || `${p.kind === 'wc' ? 'Banheiro' : 'Água potável'} · perto de ${nearest.name}`,
      lat: +p.lat.toFixed(6),
      lng: +p.lng.toFixed(6),
      fee,
      price: price(t),
      hours: t.opening_hours ?? null,
      wheelchair: t.wheelchair ?? null,
      access: t.access === 'customers' ? 'customers' : null,
      story: describe(p.kind, t, cityName),
      osm: p.osm,
      n: i,
    });
  }
  console.log(`${cityName}: ${list.length} escolhidos · banheiros ${n.wc} · água ${n.agua} · grátis ${out.filter((x) => x.city === cityName && x.fee === false).length} · pagos ${out.filter((x) => x.city === cityName && x.fee === true).length}`);
  await sleep(2000);
}

if (out.length < TOTAL * 0.8) {
  console.error(`só ${out.length} pontos — arquivo anterior mantido`);
  process.exit(1);
}
writeFileSync(new URL('../src/data/amenities.json', import.meta.url), JSON.stringify(out));
console.log(`total: ${out.length}`);
