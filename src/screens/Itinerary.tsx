import { useMemo, type CSSProperties } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Nav } from '../App';
import { cityTheme, trip, todayIndex, turnoById } from '../lib/trip';

export default function Itinerary({ nav }: { nav: Nav }) {
  const today = todayIndex();
  const groups = useMemo(() => {
    const out: { city: string; items: { i: number }[] }[] = [];
    trip.days.forEach((d, i) => {
      const c = d.city.split('→').pop()!.trim().split(' ')[0];
      const last = out[out.length - 1];
      if (last && last.city === c) last.items.push({ i });
      else out.push({ city: c, items: [{ i }] });
    });
    return out;
  }, []);

  return (
    <div className="screen">
      <div className="eyebrow">13 dias · 17 turnos</div>
      <h1 style={{ fontSize: 34 }}>Roteiro</h1>
      {groups.map((g, gi) => {
        const th = cityTheme(g.city);
        const first = trip.days[g.items[0].i].date;
        const last = trip.days[g.items[g.items.length - 1].i].date;
        return (
          <div key={gi} className="city-block" style={{ '--c': th.color } as CSSProperties}>
            <div className="city-head">
              <span className="bar" />
              <h2>{th.emoji} {g.city}</h2>
              <span className="small muted">{first === last ? first : `${first} – ${last}`}</span>
            </div>
            <div className="list">
              {g.items.map(({ i }) => {
                const d = trip.days[i];
                const periods = d.turnos.map((id) => turnoById.get(id)?.turno.period).filter(Boolean);
                const stops = d.turnos.reduce((s, id) => s + (turnoById.get(id)?.turno.stops.length ?? 0), 0);
                const [dd, mm] = d.date.split('/');
                return (
                  <button key={i} className={`day-row ${i === today ? 'today' : ''} ${i < today ? 'past' : ''}`} style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.openDay(i)}>
                    <div className="day-date"><b>{dd}</b><span>{d.dow} · {['', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][+mm]}</span></div>
                    <div style={{ minWidth: 0 }}>
                      {i === today && <span className="pill" style={{ background: th.color, color: '#fff', marginBottom: 4 }}>Hoje</span>}
                      <div style={{ fontWeight: 650, lineHeight: 1.3 }}>{d.title}</div>
                      <div className="small muted">
                        {d.city}{periods.length ? ` · ${periods.join(' + ')}` : ''}{stops ? ` · ${stops} paradas` : ''}
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--ink-3)" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
