import { useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../state/AppContext';
import { CATEGORIES, categoryOf, POIS, RARITY, type Category, type Rarity } from '../data/pois';
import { cityTheme, currentCity } from '../lib/trip';
import Ranking, { LEVEL_XP, useLeaderboard } from './Ranking';

export function useMyMarks() {
  const { checkins, session } = useApp();
  return useMemo(() => {
    const mine = checkins.filter((c) => c.user_id === session?.user.id);
    return {
      seen: new Set(mine.filter((c) => c.kind === 'seen').map((c) => c.poi_id)),
      learned: new Set(mine.filter((c) => c.kind === 'learned').map((c) => c.poi_id)),
    };
  }, [checkins, session]);
}

const ORDER: Rarity[] = ['lendario', 'epico', 'raro', 'comum'];

export default function Album({ onOpen }: { onOpen: (id: string) => void }) {
  const { session } = useApp();
  const { seen, learned } = useMyMarks();
  const board = useLeaderboard();
  const meRow = board.find((r) => r.m.id === session?.user.id);
  const xp = meRow?.xp ?? 0;
  const level = Math.floor(xp / LEVEL_XP) + 1;
  const toNext = LEVEL_XP - (xp % LEVEL_XP);
  const pos = board.findIndex((r) => r.m.id === session?.user.id) + 1;

  const [tab, setTab] = useState<'album' | 'ranking'>('album');
  const [city, setCity] = useState<string>(currentCity());
  const [filter, setFilter] = useState<Category | 'tudo'>('tudo');
  const list = POIS.filter((p) => p.city === city && (filter === 'tudo' || categoryOf(p) === filter)).sort(
    (a, b) => ORDER.indexOf(a.rarity) - ORDER.indexOf(b.rarity) || Number(seen.has(b.id)) - Number(seen.has(a.id)),
  );
  const got = list.filter((p) => seen.has(p.id)).length;

  return (
    <div>
      <div className="card">
        <div className="row between">
          <div>
            <div className="eyebrow">Nível {level}{pos ? ` · ${pos}º no grupo` : ''}</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, lineHeight: 1.1 }}>{xp} XP</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28 }}>{pos === 1 && xp > 0 ? '🥇' : '🏆'}</div>
            <div className="tiny muted">👁️ {seen.size} · 📖 {learned.size}</div>
          </div>
        </div>
        <div className="progress" style={{ marginTop: 12 }}><i style={{ width: `${((LEVEL_XP - toNext) / LEVEL_XP) * 100}%` }} /></div>
        <div className="tiny muted" style={{ marginTop: 6 }}>Faltam {toNext} XP para o nível {level + 1} · "Vi" vale o XP da raridade, "Aprendi" vale metade</div>
      </div>

      <div className="seg" style={{ marginTop: 14 }}>
        <button className={tab === 'album' ? 'on' : ''} onClick={() => setTab('album')}>Álbum</button>
        <button className={tab === 'ranking' ? 'on' : ''} onClick={() => setTab('ranking')}>Ranking do grupo</button>
      </div>

      {tab === 'ranking' ? (
        <div style={{ marginTop: 14 }}><Ranking /></div>
      ) : (
        <>
          <div className="chips" style={{ marginTop: 14 }}>
            {['Lisboa', 'Roma', 'Veneza', 'Paris'].map((c) => (
              <button key={c} className={`chip ${c === city ? 'on' : ''}`} onClick={() => setCity(c)}>{cityTheme(c).emoji} {c}</button>
            ))}
          </div>
          <div className="chips" style={{ marginTop: 8 }}>
            <button className={`chip ${filter === 'tudo' ? 'on' : ''}`} onClick={() => setFilter('tudo')}>Tudo</button>
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`chip ${c.id === filter ? 'on' : ''}`} onClick={() => setFilter(c.id)}>{c.emoji} {c.label}</button>
            ))}
          </div>
          <div className="small muted" style={{ margin: '12px 0 10px' }}>{got} de {list.length} vistos em {city}</div>
          <div className="album">
            {list.map((p) => (
              <button key={p.id} className={seen.has(p.id) ? '' : 'locked'} style={{ '--r': p.food ? '#E4572E' : RARITY[p.rarity].color } as CSSProperties} onClick={() => onOpen(p.id)}>
                <span className="orb">{p.emoji}</span>
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                {learned.has(p.id) && <span className="tiny">📖</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
