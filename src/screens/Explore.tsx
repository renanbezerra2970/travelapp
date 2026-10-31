import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { LocateFixed, Trophy, Navigation, MapPinned, X, Layers as LayersIcon, SlidersHorizontal } from 'lucide-react';
import type { Nav } from '../App';
import { storage, useApp } from '../state/AppContext';
import { createMap, mapboxgl, presetForNow } from '../lib/mapbox';
import { CATEGORIES, categoryOf, POIS, poiById, RARITY, type Category, type Poi } from '../data/pois';
import { CITY_THEME, cityTheme, currentCity, todayIndex, trip, turnoById } from '../lib/trip';
import { circlePolygon, distance, fmtAgo, fmtDistance, type LatLng } from '../lib/geo';
import { wikiNearby, type WikiNearby } from '../lib/wiki';
import PoiSheet, { CAPTURE_RADIUS, captureReach, type Target } from '../components/PoiSheet';
import Album from '../components/Album';
import { Sheet, toast } from '../components/ui';
import { faceHtml } from '../lib/faces';

const NEAR_RADIUS = 700;
/** Abaixo deste zoom o mapa mostra agrupamentos (concentrações) em vez dos tokens */
const TOKEN_ZOOM = 15;
const ALL_CATS = CATEGORIES.map((c) => c.id);
type Overlays = { wiki: boolean; roteiro: boolean; grupo: boolean };

const TELEPORTS: { city: string; name: string; at: LatLng }[] = [
  { city: 'Roma', name: 'Praça de São Pedro', at: { lat: 41.90215, lng: 12.4572 } },
  { city: 'Roma', name: 'Coliseu', at: { lat: 41.8908, lng: 12.4915 } },
  { city: 'Roma', name: 'Fontana di Trevi', at: { lat: 41.9007, lng: 12.4831 } },
  { city: 'Roma', name: 'Panteão e Navona', at: { lat: 41.8985, lng: 12.4755 } },
  { city: 'Roma', name: 'Fórum e Campidoglio', at: { lat: 41.8929, lng: 12.4838 } },
  { city: 'Roma', name: 'Trastevere', at: { lat: 41.8895, lng: 12.4705 } },
  { city: 'Lisboa', name: 'Belém', at: { lat: 38.6965, lng: -9.2055 } },
  { city: 'Lisboa', name: 'Baixa e Alfama', at: { lat: 38.7095, lng: -9.1345 } },
  { city: 'Veneza', name: 'Praça São Marcos', at: { lat: 45.4341, lng: 12.3388 } },
  { city: 'Veneza', name: 'Ponte de Rialto', at: { lat: 45.4378, lng: 12.3356 } },
  { city: 'Paris', name: 'Trocadéro e Torre Eiffel', at: { lat: 48.8608, lng: 2.2905 } },
  { city: 'Paris', name: 'Louvre', at: { lat: 48.8608, lng: 2.3365 } },
  { city: 'Paris', name: 'Notre-Dame e Cité', at: { lat: 48.8535, lng: 2.3478 } },
  { city: 'Paris', name: 'Montmartre', at: { lat: 48.8858, lng: 2.3409 } },
];

function nearestCity(p: LatLng) {
  let best: string | null = null;
  let bd = 40000;
  for (const [name, t] of Object.entries(CITY_THEME)) {
    const d = distance(p, { lat: t.center[0], lng: t.center[1] });
    if (d < bd) {
      bd = d;
      best = name;
    }
  }
  return best;
}

function tokenEl(emoji: string, color: string, glow: string, label: string, i: number, small = false) {
  const el = document.createElement('div');
  el.className = `mk ${small ? 'small' : ''}`;
  el.style.setProperty('--r', color);
  el.style.setProperty('--g', glow);
  el.style.setProperty('--d', `${(i % 9) * 0.29}s`);
  el.innerHTML = `<div class="shadow"></div><div class="bob"><div class="token"></div></div><div class="label"></div>`;
  el.querySelector('.token')!.textContent = emoji;
  el.querySelector('.label')!.textContent = label;
  return el;
}

const loadCats = (): Set<Category> => {
  try {
    const s = storage.get('exploreCats');
    if (s) return new Set(JSON.parse(s));
  } catch {
    /* padrão */
  }
  return new Set(ALL_CATS);
};

export default function Explore({ focus, clearFocus }: { nav: Nav; focus?: { poi?: string; at?: LatLng }; clearFocus: () => void }) {
  const { myPos, posSource, startGps, simulate, gpsError, profile, members, faces, locations, checkins, session, myAccuracy } = useApp();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cats, setCats] = useState<Set<Category>>(loadCats);
  const [overlays, setOverlays] = useState<Overlays>({ wiki: false, roteiro: false, grupo: true });
  const [target, setTarget] = useState<Target | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [wikiItems, setWikiItems] = useState<WikiNearby[]>([]);
  const [follow, setFollow] = useState(!focus);
  const [view, setView] = useState<{ c: LatLng; b: mapboxgl.LngLatBounds } | null>(null);
  const [sheet, setSheet] = useState<'teleport' | 'album' | 'filters' | null>(null);
  const [pendingSim, setPendingSim] = useState<LatLng | null>(null);
  const [zoom, setZoom] = useState(16.8);
  const meMarker = useRef<mapboxgl.Marker | null>(null);
  const poiMarkers = useRef(new Map<string, mapboxgl.Marker>());
  const wikiMarkers = useRef<mapboxgl.Marker[]>([]);
  const stopMarkers = useRef<mapboxgl.Marker[]>([]);
  const friendMarkers = useRef(new Map<string, mapboxgl.Marker>());

  const me = session?.user.id;
  const myCaptures = useMemo(() => new Set(checkins.filter((c) => c.user_id === me && c.kind === 'seen').map((c) => c.poi_id)), [checkins, me]);
  const center = view?.c ?? null;
  const ref: LatLng | null = follow && myPos ? myPos : center ?? myPos;
  const tokens = zoom >= TOKEN_ZOOM;

  const shown = useMemo(() => POIS.filter((p) => cats.has(categoryOf(p))), [cats]);

  const saveCats = (n: Set<Category>) => {
    storage.set('exploreCats', JSON.stringify([...n]));
    setCats(n);
  };
  const toggleCat = (c: Category) => {
    const n = new Set(cats);
    n.has(c) ? n.delete(c) : n.add(c);
    if (!n.size) ALL_CATS.forEach((x) => n.add(x));
    saveCats(n);
  };
  const onlyCat = (c: Category | 'all') => saveCats(new Set<Category>(c === 'all' ? ALL_CATS : [c]));

  const openPoi = useCallback((id: string) => {
    const p = poiById.get(id);
    if (!p) return;
    setSelId(id);
    setTarget({ kind: 'poi', poi: p });
  }, []);

  // ── Mapa ──
  useEffect(() => {
    if (!mapEl.current) return;
    const focusPoi = focus?.poi ? poiById.get(focus.poi) : null;
    const start =
      focus?.at ??
      focusPoi ??
      myPos ??
      (() => {
        const c = cityTheme(currentCity()).center;
        return { lat: c[0], lng: c[1] };
      })();
    const map = createMap(mapEl.current, { center: [start.lng, start.lat], zoom: 16.8, pitch: 62, bearing: -18, light: presetForNow(), maxPitch: 75 });
    mapRef.current = map;
    if (import.meta.env.DEV) (window as any).__map = map;

    map.on('load', () => {
      // raio de descoberta / de "Vi"
      map.addSource('range', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'range-near', type: 'line', source: 'range', slot: 'top', filter: ['==', ['get', 'k'], 'near'], paint: { 'line-color': '#ffffff', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.9 } } as any);
      map.addLayer({ id: 'range-cap-fill', type: 'fill', source: 'range', slot: 'top', filter: ['==', ['get', 'k'], 'cap'], paint: { 'fill-color': profile?.color ?? '#E4572E', 'fill-opacity': 0.14 } } as any);
      map.addLayer({ id: 'range-cap', type: 'line', source: 'range', slot: 'top', filter: ['==', ['get', 'k'], 'cap'], paint: { 'line-color': profile?.color ?? '#E4572E', 'line-width': 2.5, 'line-opacity': 0.8 } } as any);

      // concentrações: agrupamento nativo do Mapbox quando o mapa está afastado
      map.addSource('pois', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: TOKEN_ZOOM - 1, // precisa ser inteiro
        clusterProperties: {
          legend: ['+', ['case', ['==', ['get', 'rarity'], 'lendario'], 1, 0]],
          food: ['+', ['case', ['==', ['get', 'cat'], 'comer'], 1, 0]],
        },
      });
      const far = ['<', ['zoom'], TOKEN_ZOOM];
      map.addLayer({
        id: 'clusters', type: 'circle', source: 'pois', slot: 'top', filter: ['all', ['has', 'point_count'], far],
        paint: {
          'circle-color': ['case', ['>', ['get', 'legend'], 0], '#E0A100', ['==', ['get', 'food'], ['get', 'point_count']], '#E4572E', '#8B4FD8'],
          'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 2, 16, 10, 22, 40, 32, 120, 42],
          'circle-stroke-width': 4,
          'circle-stroke-color': 'rgba(255,255,255,.9)',
          'circle-opacity': 0.92,
          'circle-emissive-strength': 1,
        },
      } as any);
      map.addLayer({
        id: 'cluster-count', type: 'symbol', source: 'pois', slot: 'top', filter: ['all', ['has', 'point_count'], far],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 14, 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'], 'text-allow-overlap': true },
        paint: { 'text-color': '#ffffff', 'text-emissive-strength': 1 },
      } as any);
      map.addLayer({
        id: 'poi-dots', type: 'circle', source: 'pois', slot: 'top', filter: ['all', ['!', ['has', 'point_count']], far],
        paint: {
          'circle-color': ['match', ['get', 'cat'], 'comer', '#E4572E', ['match', ['get', 'rarity'], 'lendario', RARITY.lendario.color, 'epico', RARITY.epico.color, 'raro', RARITY.raro.color, RARITY.comum.color]],
          'circle-radius': ['match', ['get', 'rarity'], 'lendario', 9, 'epico', 7.5, 6],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#fff',
          'circle-emissive-strength': 1,
        },
      } as any);
      map.addLayer({
        id: 'poi-dot-labels', type: 'symbol', source: 'pois', slot: 'top', filter: ['all', ['!', ['has', 'point_count']], far, ['in', ['get', 'rarity'], ['literal', ['lendario', 'epico']]]],
        layout: { 'text-field': ['get', 'name'], 'text-size': 11.5, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'], 'text-max-width': 9, 'text-optional': true },
        paint: { 'text-color': '#1a1d26', 'text-halo-color': '#fff', 'text-halo-width': 1.6, 'text-emissive-strength': 1 },
      } as any);

      map.on('click', 'clusters', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        (map.getSource('pois') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(f.properties!.cluster_id, (err, z) => {
          if (err || z == null) return;
          const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
          const street = z >= TOKEN_ZOOM - 0.5;
          setFollow(false);
          map.easeTo({ center: [lng, lat], zoom: street ? TOKEN_ZOOM + 0.8 : z + 0.3, pitch: street ? 60 : 40, duration: 700 });
        });
      });
      map.on('click', 'poi-dots', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) openPoi(id);
      });
      ['clusters', 'poi-dots'].forEach((l) => {
        map.on('mouseenter', l, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', l, () => (map.getCanvas().style.cursor = ''));
      });
      setLoaded(true);
    });

    const syncView = () => {
      const c = map.getCenter();
      setView({ c: { lat: c.lat, lng: c.lng }, b: map.getBounds()! });
    };
    syncView();
    map.on('moveend', syncView);
    map.on('zoom', () => setZoom(map.getZoom()));
    map.on('dragstart', () => setFollow(false));

    // segurar no mapa (ou botão direito) = simular estar ali
    let t: number | undefined;
    const offer = (ll: mapboxgl.LngLat) => setPendingSim({ lat: ll.lat, lng: ll.lng });
    map.on('contextmenu', (e) => offer(e.lngLat));
    map.on('touchstart', (e) => {
      if (e.originalEvent.touches.length !== 1) return;
      t = window.setTimeout(() => offer(e.lngLat), 650);
    });
    ['touchend', 'touchmove', 'dragstart', 'zoomstart'].forEach((ev) => map.on(ev as 'touchend', () => clearTimeout(t)));

    if (focusPoi) setTimeout(() => openPoi(focusPoi.id), 400);
    clearFocus();
    if (!myPos) startGps();
    return () => {
      map.remove();
      mapRef.current = null;
      meMarker.current = null;
      poiMarkers.current.clear();
      friendMarkers.current.clear();
      wikiMarkers.current = [];
      stopMarkers.current = [];
      setLoaded(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // dados das concentrações seguem as categorias ativas
  useEffect(() => {
    const src = mapRef.current?.getSource('pois') as mapboxgl.GeoJSONSource | undefined;
    if (!loaded || !src) return;
    src.setData({
      type: 'FeatureCollection',
      features: shown.map((p) => ({ type: 'Feature', properties: { id: p.id, name: p.name, rarity: p.rarity, cat: categoryOf(p) }, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } })),
    });
  }, [shown, loaded]);

  // raio
  useEffect(() => {
    const src = mapRef.current?.getSource('range') as mapboxgl.GeoJSONSource | undefined;
    if (!loaded || !src) return;
    src.setData({
      type: 'FeatureCollection',
      features: myPos ? [{ ...circlePolygon(myPos, NEAR_RADIUS), properties: { k: 'near' } }, { ...circlePolygon(myPos, CAPTURE_RADIUS), properties: { k: 'cap' } }] : [],
    });
  }, [myPos, loaded]);

  // seguir o jogador
  useEffect(() => {
    if (follow && myPos && mapRef.current) mapRef.current.easeTo({ center: [myPos.lng, myPos.lat], duration: 900 });
  }, [myPos, follow]);

  // meu avatar
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!myPos) {
      meMarker.current?.remove();
      meMarker.current = null;
      return;
    }
    if (!meMarker.current) {
      const el = document.createElement('div');
      el.className = 'me-mk';
      el.innerHTML = '<span class="ring"></span><span class="face"></span>';
      el.style.zIndex = '20';
      meMarker.current = new mapboxgl.Marker({ element: el, pitchAlignment: 'viewport', rotationAlignment: 'viewport' }).setLngLat([myPos.lng, myPos.lat]).addTo(map);
    }
    const el = meMarker.current.getElement();
    el.style.setProperty('--c', profile?.color ?? '#E4572E');
    el.querySelector('.face')!.innerHTML = faceHtml(profile?.display_name, me ? faces[me] : undefined);
    meMarker.current.setLngLat([myPos.lng, myPos.lat]);
  }, [myPos, profile, loaded, faces, me]);

  // tokens ilustrados: só no zoom de perto e só dentro da área vista
  const bKey = view ? view.b.toArray().flat().map((n) => n.toFixed(3)).join(',') : '';
  const visible = useMemo(() => {
    if (!view || !tokens) return [];
    const b = view.b;
    const padLat = (b.getNorth() - b.getSouth()) * 0.25;
    const padLng = (b.getEast() - b.getWest()) * 0.25;
    return shown.filter((p) => p.lat > b.getSouth() - padLat && p.lat < b.getNorth() + padLat && p.lng > b.getWest() - padLng && p.lng < b.getEast() + padLng).slice(0, 220);
  }, [bKey, tokens, shown]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const want = new Set(visible.map((p) => p.id));
    poiMarkers.current.forEach((m, id) => {
      if (!want.has(id)) {
        m.remove();
        poiMarkers.current.delete(id);
      }
    });
    visible.forEach((p, i) => {
      if (poiMarkers.current.has(p.id)) return;
      const r = RARITY[p.rarity];
      const el = tokenEl(p.emoji, p.food ? '#E4572E' : r.color, p.food ? 'rgba(228,87,46,.4)' : r.glow, p.name, i, !!p.inside || !!p.food || (p.source === 'wiki' && p.rarity === 'comum'));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openPoi(p.id);
      });
      poiMarkers.current.set(p.id, new mapboxgl.Marker({ element: el, anchor: 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport', occludedOpacity: 0.35 } as any).setLngLat([p.lng, p.lat]).addTo(map));
    });
  }, [visible, openPoi, loaded]);

  useEffect(
    () => () => {
      poiMarkers.current.forEach((m) => m.remove());
      poiMarkers.current.clear();
    },
    [],
  );

  useEffect(() => {
    poiMarkers.current.forEach((m, id) => {
      const p = poiById.get(id)!;
      const el = m.getElement();
      const reach = captureReach(p, myPos);
      const can = reach.d !== null && reach.d <= reach.radius;
      el.classList.toggle('inrange', can && !myCaptures.has(id));
      el.classList.toggle('far', myPos ? distance(myPos, p) > NEAR_RADIUS : false);
      el.classList.toggle('sel', selId === id);
      // obras dentro de prédios e pontos menores só aparecem chegando mais perto
      const minZoom = p.inside ? 16.4 : p.rarity === 'comum' && !p.food ? 15.6 : 0;
      el.style.display = zoom >= minZoom ? '' : 'none';
      el.querySelector('.label')!.toggleAttribute('hidden', zoom < (p.rarity === 'lendario' || p.rarity === 'epico' ? 16.2 : 17.3));
      let badge = el.querySelector('.check, .bang');
      const want = myCaptures.has(id) ? 'check' : can ? 'bang' : null;
      if (badge && badge.className !== want) {
        badge.remove();
        badge = null;
      }
      if (want && !badge) {
        const b = document.createElement('span');
        b.className = want;
        b.textContent = want === 'check' ? '✓' : '!';
        el.querySelector('.bob')!.appendChild(b);
      }
    });
  }, [myPos, myCaptures, selId, zoom, visible]);

  // histórias ao vivo da Wikipédia (o que não está no catálogo)
  const lastWikiAt = useRef<LatLng | null>(null);
  useEffect(() => {
    if (!ref || !overlays.wiki) return;
    if (lastWikiAt.current && distance(lastWikiAt.current, ref) < 300) return;
    const id = setTimeout(async () => {
      lastWikiAt.current = ref;
      const items = await wikiNearby(ref, 1200, 60);
      const known = new Set(POIS.map((p) => p.wiki?.toLowerCase()));
      setWikiItems(items.filter((w) => !known.has(w.title.toLowerCase()) && !POIS.some((p) => distance(p, w) < 30)));
    }, 500);
    return () => clearTimeout(id);
  }, [ref?.lat, ref?.lng, overlays.wiki]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    wikiMarkers.current.forEach((m) => m.remove());
    wikiMarkers.current = [];
    if (!overlays.wiki || !tokens) return;
    wikiItems.forEach((w, i) => {
      const el = tokenEl('📜', '#5B6170', 'rgba(91,97,112,.35)', w.title, i, true);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelId(null);
        setTarget({ kind: 'wiki', title: w.title, lat: w.lat, lng: w.lng });
      });
      wikiMarkers.current.push(new mapboxgl.Marker({ element: el, anchor: 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport', occludedOpacity: 0.35 } as any).setLngLat([w.lng, w.lat]).addTo(map));
    });
  }, [wikiItems, overlays.wiki, tokens, loaded]);

  useEffect(() => {
    wikiMarkers.current.forEach((m) => m.getElement().querySelector('.label')!.toggleAttribute('hidden', zoom < 17.4));
  }, [zoom, wikiItems]);

  // paradas do roteiro de hoje
  useEffect(() => {
    const map = mapRef.current;
    stopMarkers.current.forEach((m) => m.remove());
    stopMarkers.current = [];
    if (!map || !overlays.roteiro) return;
    const i = Math.min(Math.max(todayIndex(), 0), trip.days.length - 1);
    let n = 0;
    trip.days[i].turnos.forEach((id) => {
      const t = turnoById.get(id);
      if (!t) return;
      const color = cityTheme(t.city.name).color;
      t.turno.stops.forEach((s) => {
        if (!s.ll) return;
        const el = document.createElement('div');
        el.className = 'stop-mk';
        el.style.background = color;
        el.textContent = String(++n);
        el.title = `${s.t} · ${s.name}`;
        el.addEventListener('click', () => toast(`${s.t} · ${s.name}`));
        stopMarkers.current.push(new mapboxgl.Marker({ element: el }).setLngLat([s.ll[1], s.ll[0]]).addTo(map));
      });
    });
  }, [overlays.roteiro, loaded]);

  // amigos
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    if (overlays.grupo) {
      for (const m of members) {
        const l = locations[m.id];
        if (!l || m.id === me) continue;
        seen.add(m.id);
        let mk = friendMarkers.current.get(m.id);
        if (!mk) {
          const el = document.createElement('div');
          el.className = 'friend-mk';
          el.innerHTML = '<span class="face"></span><span class="tag"></span>';
          el.style.zIndex = '15';
          el.addEventListener('click', () => map.flyTo({ center: mk!.getLngLat(), zoom: 17.5 }));
          mk = new mapboxgl.Marker({ element: el, anchor: 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport' }).setLngLat([l.lng, l.lat]).addTo(map);
          friendMarkers.current.set(m.id, mk);
        }
        const el = mk.getElement();
        el.style.setProperty('--c', m.color);
        const face = el.querySelector('.face')!;
        if (face.getAttribute('data-src') !== (faces[m.id] ?? '')) {
          face.innerHTML = faceHtml(m.display_name, faces[m.id]);
          face.setAttribute('data-src', faces[m.id] ?? '');
        }
        el.querySelector('.tag')!.textContent = `${m.display_name} · ${fmtAgo(l.updated_at)}`;
        el.classList.toggle('stale', Date.now() - new Date(l.updated_at).getTime() > 15 * 60000);
        mk.setLngLat([l.lng, l.lat]);
      }
    }
    friendMarkers.current.forEach((mk, id) => {
      if (!seen.has(id)) {
        mk.remove();
        friendMarkers.current.delete(id);
      }
    });
  }, [members, locations, overlays.grupo, me, loaded, faces]);

  // lista "por perto": mais raros primeiro, depois os mais próximos
  const nearby = useMemo(() => {
    if (!ref) return [];
    const from = myPos ?? ref;
    const order = { lendario: 0, epico: 1, raro: 2, comum: 3 } as const;
    const cur = shown
      .filter((p) => distance(ref, p) < NEAR_RADIUS)
      .map((p) => ({ key: p.id, poi: p as Poi | null, w: null as WikiNearby | null, d: distance(from, p), r: distance(ref, p) }))
      .sort((a, b) => a.r + order[a.poi!.rarity] * 120 - (b.r + order[b.poi!.rarity] * 120))
      .slice(0, 30);
    const wk = overlays.wiki
      ? wikiItems.filter((w) => distance(ref, w) < NEAR_RADIUS).map((w) => ({ key: `w${w.pageid}`, poi: null, w, d: distance(from, w), r: distance(ref, w) })).sort((a, b) => a.r - b.r).slice(0, 10)
      : [];
    return [...cur, ...wk];
  }, [ref, myPos, wikiItems, overlays.wiki, shown]);

  const inView = useMemo(() => (view ? shown.filter((p) => view.b.contains([p.lng, p.lat])).length : 0), [bKey, shown]); // eslint-disable-line react-hooks/exhaustive-deps

  const city = ref ? nearestCity(ref) : null;
  const flyTo = (p: LatLng, z = 16.8) => mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: z, pitch: 62, essential: true });
  const allOn = cats.size === ALL_CATS.length;
  const showCarousel = nearby.length > 0 && tokens;

  return (
    <div className={`explore ${tokens ? "" : "zoomed-out"}`}>
      <div ref={mapEl} className="map" />

      <div className="explore-top">
        <div className="explore-bar">
          <div className="grow">
            <div className="title ellipsis">{city ? `${cityTheme(city).emoji} ${city}` : '🧭 Explorar'}</div>
            <div className="sub">{tokens ? `${nearby.filter((x) => x.poi).length} pontos a até ${NEAR_RADIUS} m` : `${inView} pontos na área · toque num círculo para ampliar`}</div>
          </div>
          <button className="icon-btn" style={{ boxShadow: 'none' }} onClick={() => setSheet('filters')} aria-label="Filtros do mapa"><SlidersHorizontal size={19} /></button>
          <button className="icon-btn" style={{ boxShadow: 'none' }} onClick={() => setSheet('album')} aria-label="Álbum e ranking"><Trophy size={20} color="#E0A100" /></button>
        </div>
        <div className="chips">
          <button className={`chip ${allOn ? 'on' : ''}`} onClick={() => onlyCat('all')}>Tudo</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`chip ${!allOn && cats.has(c.id) ? 'on' : ''}`} onClick={() => (allOn ? onlyCat(c.id) : toggleCat(c.id))}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        {posSource === 'sim' && (
          <div className="sim-banner">
            📍 Posição simulada
            <button onClick={() => { simulate(null); startGps(); setFollow(true); }}>Usar GPS</button>
          </div>
        )}
        {!myPos && (
          <div className="card" style={{ padding: 14 }}>
            <b>Onde você está?</b>
            <div className="small muted" style={{ margin: '4px 0 10px' }}>{gpsError ?? 'Ative a localização para descobrir o que há ao seu redor — ou simule estar em um lugar da viagem.'}</div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn sm" onClick={startGps}><LocateFixed size={16} /> Usar GPS</button>
              <button className="btn sm light" onClick={() => setSheet('teleport')}><MapPinned size={16} /> Simular lugar</button>
            </div>
          </div>
        )}
      </div>

      <div className="explore-side" style={{ bottom: showCarousel ? 104 : 24 }}>
        <button
          className="icon-btn"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            setFollow(false);
            if (tokens) map.easeTo({ zoom: 13.2, pitch: 30, duration: 800 });
            else map.easeTo({ ...(myPos ? { center: [myPos.lng, myPos.lat] as [number, number] } : {}), zoom: 16.8, pitch: 62, duration: 800 });
          }}
          aria-label={tokens ? 'Ver concentrações' : 'Voltar ao nível da rua'}
          title={tokens ? 'Ver concentrações' : 'Voltar ao nível da rua'}
          style={!tokens ? { background: '#8B4FD8', color: '#fff' } : undefined}
        >
          <LayersIcon size={20} />
        </button>
        <button className="icon-btn" onClick={() => setSheet('teleport')} aria-label="Ir para um lugar"><MapPinned size={20} /></button>
        <button
          className="icon-btn"
          onClick={() => {
            if (!myPos) return startGps();
            setFollow(true);
            mapRef.current?.easeTo({ center: [myPos.lng, myPos.lat], zoom: 17, pitch: 62, duration: 800 });
          }}
          aria-label="Centralizar em mim"
          style={follow && myPos ? { background: 'var(--ink)', color: '#fff' } : undefined}
        >
          <Navigation size={20} />
        </button>
      </div>

      {showCarousel && (
        <div className="carousel">
          {nearby.map((x) => {
            const p = x.poi;
            const r = p ? (p.food ? { color: '#E4572E', label: `${p.kind} · ${p.price}` } : RARITY[p.rarity]) : { color: '#5B6170', label: 'História' };
            const reach = p ? captureReach(p, myPos) : null;
            const inRange = !!p && !myCaptures.has(p.id) && reach!.d !== null && reach!.d <= reach!.radius;
            return (
              <button
                key={x.key}
                className={`poi-card ${inRange ? 'inrange' : ''}`}
                style={{ '--r': r.color } as CSSProperties}
                onClick={() => {
                  if (p) {
                    openPoi(p.id);
                    flyTo(p, Math.max(zoom, 17));
                  } else if (x.w) {
                    setSelId(null);
                    setTarget({ kind: 'wiki', title: x.w.title, lat: x.w.lat, lng: x.w.lng });
                  }
                }}
              >
                <span className="orb">{p?.emoji ?? '📜'}</span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="rarity">{r.label}{p && myCaptures.has(p.id) ? ' · ✓' : ''}</span>
                  <b className="ellipsis">{p?.name ?? x.w!.title}</b>
                  <span className="tiny muted">{myPos ? fmtDistance(x.d) : '—'}{inRange ? ' · marque!' : ''}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {pendingSim && (
        <div className="card" style={{ position: 'absolute', left: 12, right: 12, bottom: showCarousel ? 104 : 24, zIndex: 6, boxShadow: 'var(--shadow-lg)' }}>
          <div className="row between">
            <b>Simular que você está aqui?</b>
            <button onClick={() => setPendingSim(null)} aria-label="Cancelar"><X size={18} /></button>
          </div>
          <div className="small muted" style={{ margin: '4px 0 10px' }}>Ótimo para planejar o passeio ou testar o mapa antes de chegar.</div>
          <button className="btn block city" onClick={() => { simulate(pendingSim); setFollow(true); setPendingSim(null); }}>📍 Teleportar para cá</button>
        </div>
      )}

      {target && (
        <PoiSheet
          target={target}
          onClose={() => { setTarget(null); setSelId(null); }}
          onOpenPoi={(id) => {
            openPoi(id);
            const p = poiById.get(id);
            if (p) flyTo(p, 17.6);
          }}
        />
      )}

      {sheet === 'filters' && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="sheet-body">
            <h2 style={{ fontSize: 24 }}>O que mostrar no mapa</h2>
            <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Categorias</div>
            <div className="list">
              {CATEGORIES.map((c) => {
                const n = POIS.filter((p) => categoryOf(p) === c.id && (!city || p.city === city)).length;
                return (
                  <button key={c.id} className="list-item" onClick={() => toggleCat(c.id)}>
                    <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{c.emoji}</span>
                    <span className="grow"><b>{c.label}</b><div className="tiny muted">{n} em {city ?? 'todas as cidades'}</div></span>
                    <span className={`toggle ${cats.has(c.id) ? 'on' : ''}`} />
                  </button>
                );
              })}
            </div>
            <div className="eyebrow" style={{ margin: '18px 0 8px' }}>Camadas extras</div>
            <div className="list">
              {([
                ['grupo', '👥', 'Grupo', 'Onde cada viajante está'],
                ['roteiro', '🗓️', 'Roteiro de hoje', 'Paradas numeradas do dia'],
                ['wiki', '📜', 'Histórias da Wikipédia', 'Tudo que tem artigo por perto, além do catálogo'],
              ] as [keyof Overlays, string, string, string][]).map(([k, e, l, d]) => (
                <button key={k} className="list-item" onClick={() => setOverlays((s) => ({ ...s, [k]: !s[k] }))}>
                  <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{e}</span>
                  <span className="grow"><b>{l}</b><div className="tiny muted">{d}</div></span>
                  <span className={`toggle ${overlays[k] ? 'on' : ''}`} />
                </button>
              ))}
            </div>
            <div className="card small" style={{ marginTop: 16 }}>
              <b>Legenda</b>
              <div className="row wrap" style={{ gap: 12, marginTop: 8 }}>
                {(['lendario', 'epico', 'raro', 'comum'] as const).map((r) => (
                  <span key={r} className="row" style={{ gap: 6 }}><i style={{ width: 12, height: 12, borderRadius: 99, background: RARITY[r].color, display: 'inline-block' }} /> {RARITY[r].label}</span>
                ))}
                <span className="row" style={{ gap: 6 }}><i style={{ width: 12, height: 12, borderRadius: 99, background: '#E4572E', display: 'inline-block' }} /> Restaurante</span>
              </div>
              <div className="tiny muted" style={{ marginTop: 8 }}>Afaste o mapa (ou toque no botão de camadas) para ver as concentrações: círculos com número, dourados quando têm um lendário. Toque num círculo para ampliar.</div>
            </div>
          </div>
        </Sheet>
      )}

      {sheet === 'teleport' && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="sheet-body">
            <h2 style={{ fontSize: 24 }}>Ir para…</h2>
            <p className="small muted" style={{ marginTop: 4 }}>Simule sua posição em um ponto da viagem. Dica: toque e segure (ou clique com o botão direito) em qualquer lugar do mapa.</p>
            {myPos && posSource === 'gps' && <div className="small muted" style={{ marginTop: 8 }}>GPS ativo{myAccuracy ? ` · precisão de ${Math.round(myAccuracy)} m` : ''}.</div>}
            {['Roma', 'Lisboa', 'Veneza', 'Paris'].map((c) => (
              <div key={c} style={{ marginTop: 18 }}>
                <div className="eyebrow" style={{ color: cityTheme(c).color, marginBottom: 8 }}>{cityTheme(c).emoji} {c}</div>
                <div className="list">
                  {TELEPORTS.filter((t) => t.city === c).map((t) => (
                    <button
                      key={t.name}
                      className="list-item"
                      onClick={() => {
                        simulate(t.at);
                        setFollow(true);
                        setSheet(null);
                        mapRef.current?.jumpTo({ center: [t.at.lng, t.at.lat], zoom: 16.8, pitch: 62 });
                      }}
                    >
                      <span className="grow" style={{ fontWeight: 600 }}>{t.name}</span>
                      <span className="small muted">{POIS.filter((p) => distance(p, t.at) < NEAR_RADIUS).length} pontos</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {posSource === 'sim' && (
              <button className="btn block light" style={{ marginTop: 18 }} onClick={() => { simulate(null); startGps(); setSheet(null); }}><LocateFixed size={18} /> Voltar a usar o GPS</button>
            )}
          </div>
        </Sheet>
      )}

      {sheet === 'album' && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="sheet-body">
            <h2 style={{ fontSize: 24, marginBottom: 14 }}>Álbum e ranking</h2>
            <Album
              onOpen={(id) => {
                setSheet(null);
                const p = poiById.get(id)!;
                setFollow(false);
                flyTo(p, 17.4);
                openPoi(id);
              }}
            />
          </div>
        </Sheet>
      )}
    </div>
  );
}
