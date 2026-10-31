import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Footprints, Clock, Wallet, MapPin, Compass, Lightbulb, ExternalLink, AlertTriangle } from 'lucide-react';
import type { Nav } from '../App';
import { useApp } from '../state/AppContext';
import { cityTheme, stopMeta, trip, turnoById } from '../lib/trip';
import { createMap, mapboxgl } from '../lib/mapbox';
import { mapsLink } from '../lib/geo';
import DayPhotos from '../components/DayPhotos';

export default function DayView({ index, nav, onBack }: { index: number; nav: Nav; onBack: () => void }) {
  const { privateData } = useApp();
  const day = trip.days[index];
  const turnos = day.turnos.map((id) => turnoById.get(id)!.turno);
  const [tab, setTab] = useState(0);
  const theme = cityTheme(day.city.split('→').pop()!.trim().split(' ')[0]);
  const turno = turnos[Math.min(tab, turnos.length - 1)];

  useEffect(() => setTab(0), [index]);

  return (
    <div className="screen" style={{ '--city': theme.color, '--city-soft': theme.soft } as CSSProperties}>
      <div className="day-hero">
        <div className="row between">
          <button className="icon-btn" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
          <div className="row" style={{ gap: 8 }}>
            <button className="icon-btn" disabled={index === 0} onClick={() => nav.openDay(index - 1)} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
            <button className="icon-btn" disabled={index === trip.days.length - 1} onClick={() => nav.openDay(index + 1)} aria-label="Próximo dia"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="eyebrow" style={{ marginTop: 14 }}>{day.dow} {day.date} · {day.city}</div>
        <h1>{day.title}</h1>
        {turnos.length > 0 && (
          <>
            <div className="tabs">
              {turnos.map((t, i) => (
                <button key={t.id} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>
                  {t.period} · {t.start}–{t.end}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10, fontWeight: 600, fontSize: 15 }}>{turno.title}</div>
            <div className="turno-meta">
              <span className="row" style={{ gap: 5 }}><Footprints size={15} /> {turno.km.toString().replace('.', ',')} km · {turno.walkMin} min a pé</span>
              <span className="row" style={{ gap: 5 }}><Clock size={15} /> {turno.stops.length} paradas</span>
              <span className="row" style={{ gap: 5 }}><Wallet size={15} /> €{Math.round(turno.cost)} (4 pax)</span>
            </div>
          </>
        )}
      </div>

      {day.alerts && day.alerts.length > 0 && (
        <div className="stack" style={{ marginTop: 16 }}>
          {day.alerts.map((a, i) => (
            <div key={i} className="alert"><AlertTriangle size={18} style={{ flex: 'none' }} /> {a}</div>
          ))}
        </div>
      )}

      {day.events.length > 0 && (
        <div className="section" style={{ marginTop: 18 }}>
          <div className="section-title"><h2 style={{ fontSize: 19 }}>Agenda do dia</h2></div>
          <div className="list">
            {day.events.map((e, j) => {
              const docs = privateData.dayDocs?.[`${index}:${j}`];
              return (
                <div key={j} className="event">
                  <div className="t">{e.t || '—'}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.text}</div>
                    {e.sub && <div className="small muted">{e.sub}</div>}
                    {docs && (
                      <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                        {docs.map((d) => <a key={d.url + d.label} className="doc-link" href={d.url} target="_blank" rel="noreferrer">{d.label} <ExternalLink size={13} /></a>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {turno && (
        <>
          <TurnoMap key={turno.id} stops={turno.stops} color={theme.color} />
          <div className="timeline">
            {turno.stops.map((s, i) => {
              const meta = stopMeta(s.type);
              const n = turno.stops.slice(0, i + 1).filter((x) => x.ll).length;
              return (
                <div key={i}>
                  <div className="stop">
                    <div className="stop-icon">
                      {meta.emoji}
                      {s.ll && <span className="n">{n}</span>}
                    </div>
                    <div className="card">
                      <div className="row between">
                        <span className="stop-time">{s.t}{s.stay ? ` · ${s.stay} min` : ''}</span>
                        <span className="pill">{meta.label}</span>
                      </div>
                      <h3>{s.name}</h3>
                      <p>{s.desc}</p>
                      {s.tip && <div className="tip"><Lightbulb size={16} style={{ flex: 'none', marginTop: 2 }} /> <span>{s.tip}</span></div>}
                      <div className="stop-foot">
                        {s.ll && (
                          <>
                            <button className="doc-link" onClick={() => nav.explore({ at: { lat: s.ll![0], lng: s.ll![1] } })}><Compass size={14} /> Explorar aqui</button>
                            <a className="doc-link" href={mapsLink({ lat: s.ll[0], lng: s.ll[1] })} target="_blank" rel="noreferrer"><MapPin size={14} /> Rota</a>
                          </>
                        )}
                        {s.cost && s.cost !== '0.0' && <span className="pill">€{s.cost.replace('.', ',')}</span>}
                      </div>
                    </div>
                  </div>
                  {s.walk > 0 && i < turno.stops.length - 1 && <div className="leg">🚶 {s.walk} min · {String(s.km).replace('.', ',')} km</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      <DayPhotos day={day.date} />
    </div>
  );
}

function TurnoMap({ stops, color }: { stops: { ll: [number, number] | null; name: string }[]; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const pts = stops.filter((s) => s.ll) as { ll: [number, number]; name: string }[];
    if (!ref.current || !pts.length) return;
    const bounds = new mapboxgl.LngLatBounds();
    pts.forEach((p) => bounds.extend([p.ll[1], p.ll[0]]));
    const map = createMap(ref.current, { bounds, fitBoundsOptions: { padding: 36, maxZoom: 15.5 }, flat: true, cooperativeGestures: true });
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts.map((p) => [p.ll[1], p.ll[0]]) } },
      });
      map.addLayer({ id: 'route', type: 'line', source: 'route', slot: 'middle', paint: { 'line-color': color, 'line-width': 3.5, 'line-dasharray': [1.2, 1.4], 'line-opacity': 0.85 } } as any);
    });
    pts.forEach((p, i) => {
      const el = document.createElement('div');
      el.className = 'stop-mk';
      el.style.background = color;
      el.textContent = String(i + 1);
      el.title = p.name;
      new mapboxgl.Marker({ element: el }).setLngLat([p.ll[1], p.ll[0]]).addTo(map);
    });
    return () => map.remove();
  }, [stops, color]);
  if (!stops.some((s) => s.ll)) return null;
  return <div ref={ref} className="mini-map" />;
}
