import { useEffect, useState, type CSSProperties } from 'react';
import { X, MapPin, BookOpen, Footprints, Sparkles, Check, Lock, Eye, GraduationCap } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { poiById, RARITY, xpFor, type Poi } from '../data/pois';
import { distance, fmtDistance, mapsLink, walkMinutes, type LatLng } from '../lib/geo';
import { wikiForPlace, wikiSummary, type WikiSummary } from '../lib/wiki';
import { Avatar, Confetti, Sheet, toast } from './ui';

export const CAPTURE_RADIUS = 80;
/** Dentro de museus e igrejas o GPS erra muito: obras aceitam estar perto do prédio */
const INSIDE_RADIUS = 150;

export type Target =
  | { kind: 'poi'; poi: Poi }
  | { kind: 'wiki'; title: string; lat: number; lng: number };

/** Distância efetiva para marcar "Vi" e o raio permitido */
export function captureReach(p: Poi, at: LatLng | null): { d: number | null; radius: number } {
  if (!at) return { d: null, radius: CAPTURE_RADIUS };
  const parent = p.inside ? poiById.get(p.inside) : null;
  const d = Math.min(distance(at, p), parent ? distance(at, parent) : Infinity);
  return { d, radius: p.inside ? INSIDE_RADIUS : CAPTURE_RADIUS };
}

export default function PoiSheet({ target, onClose, onOpenPoi }: { target: Target; onClose: () => void; onOpenPoi: (id: string) => void }) {
  const { myPos, posSource, checkins, members, session, capture, role } = useApp();
  const [wiki, setWiki] = useState<WikiSummary | null | undefined>(undefined);
  const [burst, setBurst] = useState(false);

  const poi = target.kind === 'poi' ? target.poi : null;
  const at: LatLng = poi ?? (target as LatLng);
  const title = poi?.name ?? (target as { title: string }).title;
  const r = poi?.food ? { label: `Restaurante · ${poi.price}`, color: '#E4572E', glow: '', xp: 20 } : poi ? RARITY[poi.rarity] : { label: 'História', color: '#5B6170', glow: '', xp: 0 };

  useEffect(() => {
    setWiki(undefined);
    if (poi?.food) return setWiki(null);
    const p = poi ? wikiForPlace(poi.wiki, poi) : wikiSummary((target as { title: string }).title);
    p.then(setWiki);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const dist = myPos ? distance(myPos, at) : null;
  const reach = poi ? captureReach(poi, myPos) : { d: dist, radius: CAPTURE_RADIUS };
  const inRange = reach.d !== null && reach.d <= reach.radius;
  const me = session?.user.id;
  const marks = poi ? checkins.filter((c) => c.poi_id === poi.id) : [];
  const seenBy = marks.filter((c) => c.kind === 'seen');
  const mineSeen = seenBy.some((c) => c.user_id === me);
  const mineLearned = marks.some((c) => c.kind === 'learned' && c.user_id === me);
  const parent = poi?.inside ? poiById.get(poi.inside) : null;
  const children = poi ? [...poiById.values()].filter((p) => p.inside === poi.id) : [];
  const traveler = !!role; // o admin acompanha, mas não pontua

  async function mark(kind: 'seen' | 'learned') {
    if (!poi) return;
    const xp = xpFor(poi, kind);
    await capture(poi.id, kind, xp);
    navigator.vibrate?.(kind === 'seen' ? [30, 40, 60] : 30);
    if (kind === 'seen') {
      setBurst(true);
      setTimeout(() => setBurst(false), 1300);
    } else toast(`📖 Aprendido! +${xp} XP`);
  }

  const img = poi?.food ? undefined : wiki?.image ?? wiki?.thumbnail;
  // restaurantes: busca pelo nome + endereço (mais certeiro que a coordenada)
  const route = poi?.food
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${poi.name}, ${poi.addr}, ${poi.city}`)}`
    : mapsLink(parent ?? at);
  const story = poi?.story;
  const showWikiExtract = wiki && (!poi || (poi.source !== 'wiki' && wiki.extract !== story));

  return (
    <Sheet onClose={onClose}>
      {burst && <Confetti colors={[r.color, '#F5C542', '#E4572E', '#2C7BE5', '#2E9E6A']} />}
      <div style={{ '--r': r.color } as CSSProperties}>
        <div className="poi-hero" style={img ? { backgroundImage: `url("${img}")` } : undefined}>
          {!img && <div className="big-emoji">{wiki === undefined ? '' : poi?.emoji ?? '📜'}</div>}
          <button className="icon-btn close" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
          {img && <span className="credit">Foto: Wikimedia Commons</span>}
        </div>
        <div className="sheet-body">
          <div className="poi-title">
            <span className={`orb ${burst ? 'captured-burst' : ''}`}>{poi?.emoji ?? '📜'}</span>
            <div className="grow" style={{ paddingBottom: 2 }}>
              <span className="rarity">{r.label}{poi ? ` · ${poi.obra ? '🖼️ ' : ''}${poi.kind}` : ''}</span>
              <h2>{title}</h2>
            </div>
          </div>

          <div className="poi-facts">
            <div><span>Distância</span><b>{dist === null ? '—' : fmtDistance(dist)}</b></div>
            <div><span>A pé</span><b>{dist === null ? '—' : `${walkMinutes(dist)} min`}</b></div>
            {poi?.food ? (
              <div><span>Preço</span><b>{poi.price} <span style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'none', letterSpacing: 0 }}>{poi.price === '€' ? 'até €15' : poi.price === '€€' ? '€15–40' : '€40+'}</span></b></div>
            ) : (
            <div><span>{poi?.year ? 'Época' : 'Vale'}</span><b style={{ fontSize: poi?.year && poi.year.length > 12 ? 12 : 14 }}>{poi?.year ?? (poi ? `${xpFor(poi, 'seen') + xpFor(poi, 'learned')} XP` : '—')}</b></div>
            )}
          </div>

          {parent && (
            <button className="chip" style={{ marginTop: 14 }} onClick={() => onOpenPoi(parent.id)}>📍 Fica em: {parent.name}</button>
          )}

          {poi && (
            <>
              <h3 style={{ marginTop: 22, fontSize: 19 }}>{poi.food ? 'Por que vale a pena' : 'A história'}</h3>
              {poi.addr && <div className="small muted" style={{ marginTop: 4 }}>📍 {poi.addr}</div>}
              <p className="story story-drop">{story}</p>
              {poi.fact && <div className="fact"><b>✨ Curiosidade · </b>{poi.fact}</div>}
              {poi.tip && <div className="tip" style={{ marginTop: 12 }}><span>💡</span><span>{poi.tip}</span></div>}
              {poi.source === 'wiki' && wiki && (
                <a className="doc-link" style={{ marginTop: 12 }} href={wiki.url} target="_blank" rel="noreferrer">Ler artigo completo na Wikipédia</a>
              )}
              {traveler && !poi.food && (
                <button
                  className={`btn block ${mineLearned ? 'light' : ''}`}
                  style={{ marginTop: 16, ...(mineLearned ? { color: 'var(--ok)' } : { background: '#2C7BE5' }) }}
                  disabled={mineLearned}
                  onClick={() => mark('learned')}
                >
                  {mineLearned ? <><Check size={18} /> Você aprendeu esta história</> : <><GraduationCap size={19} /> Li e aprendi · +{xpFor(poi, 'learned')} XP</>}
                </button>
              )}
            </>
          )}

          {children.length > 0 && (
            <>
              <h3 style={{ marginTop: 22, fontSize: 17 }}>Lá dentro você pode ver</h3>
              <div className="chips" style={{ marginTop: 10 }}>
                {children.map((c) => (
                  <button key={c.id} className="chip" onClick={() => onOpenPoi(c.id)} style={{ height: 38 }}>
                    <span style={{ fontSize: 18 }}>{c.emoji}</span> {c.name}
                    {checkins.some((k) => k.poi_id === c.id && k.kind === 'seen' && k.user_id === me) && ' ✓'}
                  </button>
                ))}
              </div>
            </>
          )}

          {wiki === undefined ? (
            <div className="row" style={{ marginTop: 20 }}><div className="spinner" style={{ width: 20, height: 20 }} /><span className="small muted">Buscando na Wikipédia…</span></div>
          ) : showWikiExtract ? (
            <div style={{ marginTop: 22 }}>
              <h3 style={{ fontSize: 17 }} className="row"><BookOpen size={17} /> {poi ? 'Na Wikipédia' : 'A história'}</h3>
              <p className={`story ${poi ? '' : 'story-drop'}`} style={{ fontSize: 15 }}>{wiki!.extract}</p>
              <a className="doc-link" style={{ marginTop: 10 }} href={wiki!.url} target="_blank" rel="noreferrer">Ler artigo completo</a>
            </div>
          ) : !poi && !wiki ? (
            <p className="muted" style={{ marginTop: 16 }}>Não encontramos um resumo para este lugar.</p>
          ) : null}

          {seenBy.length > 0 && (
            <div className="row" style={{ marginTop: 20 }}>
              <div className="avatars">
                {seenBy.map((c) => {
                  const m = members.find((x) => x.id === c.user_id);
                  return m ? <Avatar key={c.user_id} p={m} size="sm" /> : null;
                })}
              </div>
              <span className="small muted">
                {seenBy.map((c) => (c.user_id === me ? 'você' : members.find((x) => x.id === c.user_id)?.display_name)).filter(Boolean).join(', ')} já {poi?.food ? (seenBy.length > 1 ? 'comeram aqui' : 'comeu aqui') : seenBy.length > 1 ? 'viram' : 'viu'}
              </span>
            </div>
          )}

          <div className="capture-bar">
            {poi && traveler ? (
              mineSeen ? (
                <div className="btn block light" style={{ color: 'var(--ok)' }}><Check size={20} /> {poi.food ? 'Você comeu aqui' : 'Você viu'} · +{xpFor(poi, 'seen')} XP</div>
              ) : inRange ? (
                <button className="btn block gold" onClick={() => mark('seen')}>
                  {poi.obra ? <Eye size={20} /> : <Sparkles size={20} />} {poi.food ? 'Comi aqui!' : poi.obra ? 'Eu vi!' : 'Estive aqui!'} · +{xpFor(poi, 'seen')} XP
                </button>
              ) : (
                <div className="row" style={{ gap: 8 }}>
                  <div className="btn light grow" style={{ color: 'var(--ink-2)', fontSize: 13.5 }}>
                    <Lock size={17} /> {reach.d === null ? 'Ative a localização' : `Chegue a ${reach.radius} m para marcar`}
                  </div>
                  <a className="btn city" href={route} target="_blank" rel="noreferrer" aria-label="Rota a pé"><Footprints size={18} /> Ir</a>
                </div>
              )
            ) : (
              <a className="btn block city" href={route} target="_blank" rel="noreferrer"><MapPin size={18} /> Como chegar</a>
            )}
            {poi && traveler && inRange && posSource === 'sim' && !mineSeen && <div className="tiny muted" style={{ textAlign: 'center', marginTop: 6 }}>Posição simulada — vale para testar.</div>}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
