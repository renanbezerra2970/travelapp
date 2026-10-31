import { useMemo } from 'react';
import { useApp } from '../state/AppContext';
import { poiById, xpFor } from '../data/pois';
import { fmtAgo } from '../lib/geo';
import { Avatar } from './ui';

export const LEVEL_XP = 300;

/** Placar da viagem: XP de "Vi" + "Aprendi" por viajante (calculado do catálogo, não do cliente) */
export function useLeaderboard() {
  const { checkins, members } = useApp();
  return useMemo(() => {
    const rows = members.map((m) => {
      const mine = checkins.filter((c) => c.user_id === m.id && poiById.has(c.poi_id));
      const seen = mine.filter((c) => c.kind === 'seen');
      const learned = mine.filter((c) => c.kind === 'learned');
      const xp = mine.reduce((s, c) => s + xpFor(poiById.get(c.poi_id)!, c.kind), 0);
      const obras = seen.filter((c) => poiById.get(c.poi_id)!.obra).length;
      const legend = seen.filter((c) => poiById.get(c.poi_id)!.rarity === 'lendario').length;
      return { m, xp, seen: seen.length, learned: learned.length, obras, legend, level: Math.floor(xp / LEVEL_XP) + 1 };
    });
    return rows.sort((a, b) => b.xp - a.xp || b.seen - a.seen);
  }, [checkins, members]);
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Ranking({ compact }: { compact?: boolean }) {
  const rows = useLeaderboard();
  const { session, checkins, members } = useApp();
  const me = session?.user.id;
  const feed = useMemo(
    () => [...checkins].filter((c) => poiById.has(c.poi_id)).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, compact ? 0 : 8),
    [checkins, compact],
  );
  const top = rows[0]?.xp || 1;

  return (
    <>
      <div className="list">
        {rows.map((r, i) => (
          <div key={r.m.id} className="member-row" style={r.m.id === me ? { background: 'color-mix(in srgb, var(--city) 6%, #fff)' } : undefined}>
            <span style={{ width: 26, textAlign: 'center', fontSize: i < 3 && r.xp > 0 ? 22 : 15, fontWeight: 700, color: 'var(--ink-3)' }}>
              {i < 3 && r.xp > 0 ? MEDALS[i] : i + 1}
            </span>
            <Avatar p={r.m} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row between">
                <b className="ellipsis">{r.m.display_name}{r.m.id === me ? ' (você)' : ''}</b>
                <b style={{ fontFamily: 'var(--display)', fontSize: 17 }}>{r.xp} XP</b>
              </div>
              <div className="progress" style={{ height: 6, margin: '6px 0 4px' }}><i style={{ width: `${(r.xp / top) * 100}%` }} /></div>
              <div className="tiny muted">
                Nv {r.level} · 👁️ {r.seen} vistos · 📖 {r.learned} aprendidos{r.obras ? ` · 🖼️ ${r.obras} obras` : ''}{r.legend ? ` · ⭐ ${r.legend} lendários` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      {feed.length > 0 && (
        <>
          <div className="eyebrow" style={{ margin: '18px 0 8px' }}>Últimas descobertas</div>
          <div className="list">
            {feed.map((c) => {
              const p = poiById.get(c.poi_id)!;
              const m = members.find((x) => x.id === c.user_id);
              return (
                <div key={`${c.user_id}${c.poi_id}${c.kind}`} className="member-row" style={{ padding: '10px 16px' }}>
                  {m && <Avatar p={m} size="sm" />}
                  <div className="grow small" style={{ minWidth: 0 }}>
                    <b>{c.user_id === me ? 'Você' : m?.display_name}</b> {c.kind === 'seen' ? 'viu' : 'aprendeu sobre'} <b>{p.emoji} {p.name}</b>
                    <div className="tiny muted">{fmtAgo(c.created_at)} · +{xpFor(p, c.kind)} XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
