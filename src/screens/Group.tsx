import { useEffect, useMemo, useRef, useState } from 'react';
import { Footprints, LocateFixed, ShieldCheck } from 'lucide-react';
import type { Nav } from '../App';
import { useApp } from '../state/AppContext';
import type { Profile } from '../lib/supabase';
import { createMap, mapboxgl } from '../lib/mapbox';
import { cityTheme, currentCity } from '../lib/trip';
import { distance, fmtAgo, fmtDistance, mapsLink, walkMinutes, type LatLng } from '../lib/geo';
import { Avatar } from '../components/ui';
import Ranking from '../components/Ranking';
import Travelers from '../components/Travelers';

const LIVE_MS = 15 * 60000;

export default function Group({ nav }: { nav: Nav }) {
  const { members, locations, myPos, posSource, sharing, setSharing, startGps, gpsError, session, profile, canManage, isAdmin, role } = useApp();
  const me = session?.user.id;
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markers = useRef(new Map<string, mapboxgl.Marker>());
  const fitted = useRef(false);
  const [, tick] = useState(0);

  useEffect(() => {
    startGps();
    const id = setInterval(() => tick((n) => n + 1), 30000); // atualiza "há x min"
    return () => clearInterval(id);
  }, [startGps]);

  // Todos com posição (eu incluído, mesmo antes de o servidor responder)
  const people = useMemo(() => {
    const list: { m: Profile; at: LatLng | null; updated: string | null; sim: boolean }[] = members.map((m) => {
      if (m.id === me && myPos && sharing && role) return { m, at: myPos, updated: new Date().toISOString(), sim: posSource === 'sim' };
      const l = locations[m.id];
      return { m, at: l ? { lat: l.lat, lng: l.lng } : null, updated: l?.updated_at ?? null, sim: !!l?.is_simulated };
    });
    return list.sort((a, b) => (a.m.id === me ? -1 : b.m.id === me ? 1 : (b.updated ?? '').localeCompare(a.updated ?? '')));
  }, [members, locations, myPos, sharing, me, posSource, role]);

  useEffect(() => {
    if (!mapEl.current) return;
    const c = cityTheme(currentCity()).center;
    const map = createMap(mapEl.current, { center: [c[1], c[0]], zoom: 13, pitch: 35, flat: false, cooperativeGestures: true });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markers.current.clear();
      fitted.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    const bounds = new mapboxgl.LngLatBounds();
    for (const p of people) {
      if (!p.at) continue;
      seen.add(p.m.id);
      bounds.extend([p.at.lng, p.at.lat]);
      let mk = markers.current.get(p.m.id);
      if (!mk) {
        const el = document.createElement('div');
        el.className = 'friend-mk';
        el.innerHTML = '<span class="face"></span><span class="tag"></span>';
        mk = new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.at.lng, p.at.lat]).addTo(map);
        markers.current.set(p.m.id, mk);
      }
      const el = mk.getElement();
      el.style.setProperty('--c', p.m.color);
      el.querySelector('.face')!.textContent = p.m.avatar;
      el.querySelector('.tag')!.textContent = p.m.id === me ? 'Você' : p.m.display_name;
      el.classList.toggle('stale', !!p.updated && Date.now() - new Date(p.updated).getTime() > LIVE_MS);
      mk.setLngLat([p.at.lng, p.at.lat]);
    }
    markers.current.forEach((mk, id) => {
      if (!seen.has(id)) {
        mk.remove();
        markers.current.delete(id);
      }
    });
    if (!fitted.current && !bounds.isEmpty()) {
      fitted.current = true;
      map.fitBounds(bounds, { padding: 70, maxZoom: 16.5, duration: 0 });
    }
  }, [people, me]);

  const focus = (at: LatLng) => {
    mapRef.current?.flyTo({ center: [at.lng, at.lat], zoom: 17, essential: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const liveCount = people.filter((p) => p.updated && Date.now() - new Date(p.updated).getTime() < LIVE_MS).length;

  return (
    <div className="screen">
      <div className="eyebrow">{liveCount} de {members.length} compartilhando agora</div>
      <h1 style={{ fontSize: 34 }}>Grupo</h1>

      <div className="group-map" style={{ marginTop: 14 }}>
        <div ref={mapEl} style={{ position: 'absolute', inset: 0 }} />
      </div>

      {!role && isAdmin ? (
        <div className="card small muted" style={{ marginTop: 14 }}>Você está como administrador: acompanha o grupo, mas não aparece no mapa nem no ranking.</div>
      ) : (
      <div className="card share-card" style={{ marginTop: 14 }}>
        <ShieldCheck size={22} color={sharing ? 'var(--ok)' : 'var(--ink-3)'} style={{ flex: 'none' }} />
        <div className="grow">
          <b>Compartilhar minha localização</b>
          <div className="small muted">
            {!sharing
              ? 'Desligado: o grupo não vê onde você está.'
              : gpsError
                ? gpsError
                : posSource === 'sim'
                  ? 'Usando posição simulada (Explorar).'
                  : myPos
                    ? 'Visível só para quem está na viagem. Mantenha o app aberto.'
                    : 'Aguardando o GPS…'}
          </div>
        </div>
        <button className={`toggle ${sharing ? 'on' : ''}`} onClick={() => setSharing(!sharing)} aria-label="Compartilhar localização" aria-pressed={sharing} />
      </div>
      )}

      <div className="section">
        <div className="section-title"><h2>Viajantes</h2></div>
        <div className="list">
          {people.map(({ m, at, updated, sim }) => {
            const isMe = m.id === me;
            const live = !!updated && Date.now() - new Date(updated).getTime() < LIVE_MS;
            const d = !isMe && myPos && at ? distance(myPos, at) : null;
            return (
              <div key={m.id} className="member-row">
                <button onClick={() => at && focus(at)} aria-label={`Ver ${m.display_name} no mapa`}>
                  <Avatar p={m} live={at ? live : null} />
                </button>
                <div className="grow" style={{ minWidth: 0 }}>
                  <b>{isMe ? `${m.display_name} (você)` : m.display_name}</b>
                  <div className="small muted ellipsis">
                    {!at ? 'Localização desligada' : `${isMe ? 'agora' : fmtAgo(updated!)}${d !== null ? ` · a ${fmtDistance(d)} (${walkMinutes(d)} min)` : ''}${sim ? ' · simulada' : ''}`}
                  </div>
                </div>
                {at && !isMe && (
                  <a className="btn sm light" href={mapsLink(at)} target="_blank" rel="noreferrer"><Footprints size={15} /> Ir</a>
                )}
                {isMe && !myPos && (
                  <button className="btn sm light" onClick={startGps}><LocateFixed size={15} /> Ativar</button>
                )}
              </div>
            );
          })}
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          No navegador, a localização é enviada enquanto o app está aberto na tela. Instale na tela inicial para acesso rápido.
        </p>
      </div>

      <div className="section">
        <div className="section-title"><h2>Ranking da viagem</h2></div>
        <Ranking />
      </div>

      {canManage && (
        <div className="section">
          <div className="section-title"><h2>Viajantes e convites</h2>{isAdmin && <span className="pill">admin</span>}</div>
          <Travelers />
        </div>
      )}

      <div className="section">
        <button className="card tap row" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.explore()}>
          <span style={{ fontSize: 30 }}>{profile?.avatar}</span>
          <span className="grow"><b>Ver o grupo no mapa 3D</b><div className="small muted">No Explorar, os amigos aparecem junto com as lendas ao redor.</div></span>
        </button>
      </div>
    </div>
  );
}
