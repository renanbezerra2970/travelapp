import { useMemo, type CSSProperties } from 'react';
import { ArrowRight, Compass, Plane, BedDouble, Phone, ExternalLink, AlertTriangle, Sunset } from 'lucide-react';
import type { Nav } from '../App';
import { useApp } from '../state/AppContext';
import { cityTheme, stopMeta, trip, todayIndex, turnoById, type Stop } from '../lib/trip';
import { POIS, RARITY } from '../data/pois';
import { distance, fmtAgo, fmtDistance } from '../lib/geo';
import { Avatar } from '../components/ui';
import DayPhotos from '../components/DayPhotos';

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

export default function HomeScreen({ nav }: { nav: Nav }) {
  const { members, locations, myPos, privateData, profile } = useApp();
  const idx = todayIndex();
  const dayI = Math.min(Math.max(idx, 0), trip.days.length - 1);
  const day = trip.days[dayI];
  const theme = cityTheme(day.city);
  const totalKm = useMemo(() => Math.round(trip.cities.flatMap((c) => c.turnos).reduce((s, t) => s + t.km, 0)), []);

  // Próximas paradas de hoje, pelo horário do aparelho
  const upcoming = useMemo(() => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const stops: (Stop & { period: string })[] = day.turnos.flatMap((id) => {
      const t = turnoById.get(id)?.turno;
      return t ? t.stops.map((s) => ({ ...s, period: t.period })) : [];
    });
    if (idx !== dayI) return stops.slice(0, 3);
    const i = stops.findIndex((s) => toMin(s.t) + (s.stay || 0) >= nowMin);
    return i < 0 ? [] : stops.slice(i, i + 3);
  }, [day, idx, dayI]);

  const nearby = useMemo(() => {
    if (!myPos) return [];
    return POIS.map((p) => ({ p, d: distance(myPos, p) }))
      .filter((x) => x.d < 1500)
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);
  }, [myPos]);

  const live = members.filter((m) => locations[m.id] && Date.now() - new Date(locations[m.id].updated_at).getTime() < 15 * 60000);
  const before = idx < 0;
  const daysLeft = Math.ceil((new Date(2026, 9, 29).getTime() - Date.now()) / 86400000);

  return (
    <div className="screen">
      <div className="home-head">
        <div>
          <div className="eyebrow">29 out – 10 nov · {members.length} viajantes</div>
          <h1 className="home-title">Eurotrip</h1>
        </div>
        <button className="avatars" onClick={() => nav.go('grupo')} aria-label="Ver grupo">
          {members.slice(0, 4).map((m) => (
            <Avatar key={m.id} p={m} live={!!live.find((l) => l.id === m.id)} />
          ))}
        </button>
      </div>
      <div className="route-line">
        {['Lisboa', 'Roma', 'Veneza', 'Paris', 'Lisboa'].map((c, i) => (
          <span key={i} className="row" style={{ gap: 6 }}>
            {i > 0 && <span className="sep">→</span>}
            <span style={{ color: cityTheme(c).color }}>{c}</span>
          </span>
        ))}
      </div>

      <div className="hero" style={{ '--city': theme.color } as CSSProperties}>
        <span className="hero-emoji">{theme.emoji}</span>
        <div className="eyebrow">{before ? `Faltam ${daysLeft} dias` : idx >= trip.days.length ? 'Viagem concluída' : `Hoje · ${day.dow} ${day.date}`}</div>
        <h2>{day.city} — {day.title}</h2>
        <div style={{ position: 'relative', zIndex: 1, opacity: 0.9, fontSize: 14 }}>
          Olá, {profile?.display_name} {profile?.avatar}
        </div>
        <div className="hero-actions">
          <button className="btn" onClick={() => nav.openDay(dayI)}>Abrir o dia <ArrowRight size={18} /></button>
          <button className="btn glass" onClick={() => nav.explore()}><Compass size={18} /> Explorar ao redor</button>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>13</b><span>dias</span></div>
        <div className="stat"><b>4</b><span>cidades</span></div>
        <div className="stat"><b>{totalKm}</b><span>km a pé</span></div>
        <div className="stat"><b>{POIS.length}</b><span>pontos</span></div>
      </div>

      {day.alerts && day.alerts.length > 0 && (
        <div className="stack" style={{ marginTop: 14 }}>
          {day.alerts.map((a, i) => (
            <div key={i} className="alert"><AlertTriangle size={18} style={{ flex: 'none' }} /> {a}</div>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="section">
          <div className="section-title">
            <h2>{idx === dayI ? 'A seguir' : 'Primeiras paradas'}</h2>
            <button className="small muted" onClick={() => nav.openDay(dayI)}>Ver tudo</button>
          </div>
          <div className="list">
            {upcoming.map((s, i) => (
              <button key={i} className="list-item" onClick={() => (s.ll ? nav.explore({ at: { lat: s.ll[0], lng: s.ll[1] } }) : nav.openDay(dayI))}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: 'var(--city)', minWidth: 58 }}>{s.t}</div>
                <div className="grow">
                  <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{s.name}</div>
                  <div className="small muted">{stopMeta(s.type).emoji} {stopMeta(s.type).label}{s.stay ? ` · ${s.stay} min` : ''}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {idx === dayI && <DayPhotos day={day.date} />}

      <button className="card tap row" style={{ width: '100%', textAlign: 'left', marginTop: 14 }} onClick={nav.story}>
        <span style={{ fontSize: 30 }}>🎬</span>
        <span className="grow"><b>A história da viagem</b><div className="small muted">Monte a colagem com as fotos e descobertas quando quiser</div></span>
        <ArrowRight size={18} />
      </button>

      <div className="section">
        <div className="section-title">
          <h2>Perto de você</h2>
          <button className="small muted" onClick={() => nav.explore()}>Abrir mapa</button>
        </div>
        {nearby.length ? (
          <div className="chips" style={{ gap: 10 }}>
            {nearby.map(({ p, d }) => (
              <button key={p.id} className="poi-card" style={{ '--r': RARITY[p.rarity].color, width: 200 } as CSSProperties} onClick={() => nav.explore({ poi: p.id })}>
                <span className="orb">{p.emoji}</span>
                <span className="grow">
                  <span className="rarity">{RARITY[p.rarity].label}</span>
                  <b className="ellipsis">{p.name}</b>
                  <span className="tiny muted">{fmtDistance(d)}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <button className="card tap row" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.explore()}>
            <span style={{ fontSize: 34 }}>🧭</span>
            <span className="grow">
              <b>Descubra o que está ao seu redor</b>
              <div className="small muted">Ative a localização e veja no mapa as lendas, obras e histórias de cada lugar.</div>
            </span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>

      {live.length > 0 && (
        <div className="section">
          <div className="section-title">
            <h2>Grupo agora</h2>
            <button className="small muted" onClick={() => nav.go('grupo')}>Ver no mapa</button>
          </div>
          <div className="list">
            {live.slice(0, 4).map((m) => {
              const l = locations[m.id];
              return (
                <div key={m.id} className="member-row">
                  <Avatar p={m} live />
                  <div className="grow">
                    <b>{m.display_name}</b>
                    <div className="small muted">{fmtAgo(l.updated_at)}{myPos && m.id !== profile?.id ? ` · a ${fmtDistance(distance(myPos, l))}` : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-title"><h2>Voos e trem</h2></div>
        <div className="list">
          {trip.flights.map((f, i) => {
            const priv = privateData.flights?.[i];
            return (
              <div key={i} className="list-item" style={{ alignItems: 'flex-start' }}>
                <span className="pill" style={{ minWidth: 52, justifyContent: 'center' }}>{f.date}</span>
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}><Plane size={15} /> <b>{f.route}</b></div>
                  {priv && <div className="small muted" style={{ marginTop: 4 }}>{priv.info}</div>}
                  {priv?.docs && (
                    <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                      {priv.docs.map((d) => (
                        <a key={d.url + d.label} className="doc-link" href={d.url} target="_blank" rel="noreferrer">{d.label} <ExternalLink size={13} /></a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-title"><h2>Hospedagem</h2></div>
        <div className="stack">
          {trip.stays.map((s, i) => {
            const priv = privateData.stays?.[i];
            const th = cityTheme(s.city);
            return (
              <div key={i} className="card" style={{ borderLeft: `5px solid ${th.color}` }}>
                <div className="eyebrow" style={{ color: th.color }}>{s.city} · {s.dates} · {s.nights}</div>
                <div className="row" style={{ marginTop: 6, gap: 8 }}><BedDouble size={17} /><b>{s.name}</b></div>
                <div className="small muted" style={{ marginTop: 2 }}>{s.addr}</div>
                {priv && <div className="small" style={{ marginTop: 8 }}>{priv.info}</div>}
                <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                  <a className="doc-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name} ${s.addr} ${s.city}`)}`} target="_blank" rel="noreferrer">Mapa <ExternalLink size={13} /></a>
                  {priv?.tel && <a className="doc-link" href={priv.tel}><Phone size={13} /> Ligar</a>}
                  {priv?.docs?.map((d) => (
                    <a key={d.url} className="doc-link" href={d.url} target="_blank" rel="noreferrer">{d.label} <ExternalLink size={13} /></a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="card row" style={{ alignItems: 'flex-start' }}>
          <Sunset size={22} style={{ flex: 'none', color: 'var(--city)' }} />
          <div className="small">{trip.info.sunset}</div>
        </div>
      </div>
    </div>
  );
}
