import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Share2, Sparkles, Package } from 'lucide-react';
import JSZip from 'jszip';
import { DEMO, useApp } from '../state/AppContext';
import { signedUrls, useTripPhotos, type TripPhoto } from '../lib/photos';
import { buildStory, planStory, type DayStory, type StoryInput } from '../lib/collage';
import { poiById, RARITY } from '../data/pois';
import { cityTheme, trip } from '../lib/trip';
import { wikiForPlace } from '../lib/wiki';
import { useLeaderboard } from '../components/Ranking';
import { toast } from '../components/ui';
import type { Profile } from '../lib/supabase';

const ddmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const cityOf = (c: string) => c.split('→')[0].trim().split(' ')[0];

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** Fotos fictícias para testar a colagem no modo demo */
function demoPhotos(): TripPhoto[] {
  const ds = ['30/10', '31/10', '31/10', '31/10', '31/10', '31/10', '01/11', '01/11', '01/11'];
  return ds.map((day, i) => ({
    id: `d${i}`, trip_id: 'demo', user_id: ['demo-me', 'demo-1', 'demo-2', 'demo-3'][i % 4], day, path: `https://picsum.photos/seed/euro${i}/1200/1500`,
    caption: i === 1 ? 'Primeira vista da cúpula' : null, taken_at: new Date(2026, +day.slice(3) - 1, +day.slice(0, 2), 9 + i, 10).toISOString(),
    lat: null, lng: null, width: 1200, height: 1500, favorite: i === 2, created_at: '',
  }));
}

export default function Story({ onBack }: { onBack: () => void }) {
  const { tripId, members, checkins, isAdmin, canManage } = useApp();
  const live = useTripPhotos(tripId);
  const photos = DEMO ? demoPhotos() : live.photos;
  const board = useLeaderboard();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [placeImgs, setPlaceImgs] = useState<Record<string, string>>({});
  const [frames, setFrames] = useState<{ name: string; blob: Blob; url: string }[]>([]);
  const [progress, setProgress] = useState<string | null>(null);

  // URLs das fotos (originais, para a colagem ficar nítida)
  useEffect(() => {
    if (DEMO) return setUrls(Object.fromEntries(photos.map((p) => [p.path, p.path])));
    if (photos.length) signedUrls(photos.map((p) => p.path)).then(setUrls);
  }, [photos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // lugares marcados como "Vi", agrupados por dia
  const seenByDay = useMemo(() => {
    const map = new Map<string, Map<string, { time: number; who: Profile[] }>>();
    for (const c of checkins) {
      if (c.kind !== 'seen' || !poiById.has(c.poi_id)) continue;
      const day = ddmm(c.created_at);
      const m = map.get(day) ?? new Map();
      const cur = m.get(c.poi_id) ?? { time: new Date(c.created_at).getTime(), who: [] };
      const who = members.find((x) => x.id === c.user_id);
      if (who && !cur.who.some((w: Profile) => w.id === who.id)) cur.who.push(who);
      cur.time = Math.min(cur.time, new Date(c.created_at).getTime());
      m.set(c.poi_id, cur);
      map.set(day, m);
    }
    return map;
  }, [checkins, members]);

  // foto de cada lugar (Wikipédia), em segundo plano
  useEffect(() => {
    const ids = [...new Set([...seenByDay.values()].flatMap((m) => [...m.keys()]))].filter((id) => !poiById.get(id)!.food && !placeImgs[id]);
    ids.forEach((id) => {
      const p = poiById.get(id)!;
      wikiForPlace(p.wiki, p).then((w) => w?.thumbnail && setPlaceImgs((s) => ({ ...s, [id]: w.thumbnail! })));
    });
  }, [seenByDay]); // eslint-disable-line react-hooks/exhaustive-deps

  const input: StoryInput = useMemo(() => {
    const days: DayStory[] = trip.days.map((d, index) => ({
      index,
      date: d.date,
      dow: d.dow,
      city: cityOf(d.city),
      title: d.title,
      photos: photos.filter((p) => p.day === d.date && urls[p.path]).map((p) => ({ photo: p, url: urls[p.path], time: new Date(p.taken_at ?? p.created_at).getTime() })),
      places: [...(seenByDay.get(d.date)?.entries() ?? [])].map(([id, v]) => {
        const p = poiById.get(id)!;
        return { id, name: p.name, emoji: p.emoji, kind: p.kind, story: p.story, color: p.food ? '#E4572E' : RARITY[p.rarity].color, img: placeImgs[id], time: v.time, who: v.who };
      }),
    }));
    return {
      members,
      days,
      totalPhotos: photos.length,
      totalSeen: checkins.filter((c) => c.kind === 'seen').length,
      km: Math.round(trip.cities.flatMap((c) => c.turnos).reduce((s, t) => s + t.km, 0)),
      top: board.filter((r) => r.xp > 0).map((r) => ({ name: r.m.display_name, avatar: r.m.avatar, xp: r.xp })),
    };
  }, [photos, urls, seenByDay, placeImgs, members, checkins, board]);

  const plan = useMemo(() => planStory(input), [input]);
  const nCards = plan.reduce((t, x) => t + x.cards.length, 0);

  async function make() {
    setFrames([]);
    setProgress('Preparando…');
    try {
      const out = await buildStory(input, (d, t) => setProgress(`Montando ${d} de ${t}…`));
      setFrames(out.map((f) => ({ ...f, url: URL.createObjectURL(f.blob) })));
    } catch (e: any) {
      toast(e.message ?? 'Não foi possível montar a colagem');
    } finally {
      setProgress(null);
    }
  }

  async function zipFrames() {
    const zip = new JSZip();
    frames.forEach((f) => zip.file(f.name, f.blob));
    download(await zip.generateAsync({ type: 'blob' }), 'eurotrip-2026-historia.zip');
  }

  async function share() {
    const files = frames.map((f) => new File([f.blob], f.name, { type: 'image/jpeg' }));
    if (navigator.canShare?.({ files })) await navigator.share({ files, title: 'Eurotrip 2026' }).catch(() => {});
    else zipFrames();
  }

  return (
    <div className="screen">
      <button className="icon-btn" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
      <div className="eyebrow" style={{ marginTop: 14 }}>Sob demanda · monte quantas vezes quiser</div>
      <h1 style={{ fontSize: 32 }}>A história da viagem</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        O app junta as fotos de todos com os lugares que vocês marcaram como "Vi" e conta cada dia em cards de story. Dias com mais conteúdo ganham mais cards.
      </p>

      <div className="stats" style={{ marginTop: 16 }}>
        <div className="stat"><b>{plan.length}</b><span>dias</span></div>
        <div className="stat"><b>{photos.length}</b><span>fotos</span></div>
        <div className="stat"><b>{input.days.reduce((t, d) => t + d.places.length, 0)}</b><span>lugares</span></div>
        <div className="stat"><b>{nCards + (nCards ? 2 : 0)}</b><span>cards</span></div>
      </div>

      {plan.length > 0 && (
        <div className="list" style={{ marginTop: 14 }}>
          {plan.map(({ day, cards }) => (
            <div key={day.date} className="cost-row">
              <span><b style={{ color: cityTheme(day.city).color }}>{day.date}</b> · {day.city}</span>
              <span className="small muted">{day.photos.length} fotos · {day.places.length} lugares → <b>{cards.length} card{cards.length > 1 ? 's' : ''}</b></span>
            </div>
          ))}
        </div>
      )}

      <button className="btn block city" style={{ marginTop: 16 }} disabled={!!progress || !nCards} onClick={make}>
        <Sparkles size={18} /> {progress ?? (nCards ? `Montar ${nCards + 2} cards` : 'Poste fotos ou marque lugares para começar')}
      </button>

      {frames.length > 0 && (
        <div className="section">
          <div className="story-frames">
            {frames.map((f) => (
              <a key={f.name} href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={f.name} /></a>
            ))}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn grow" onClick={share}><Share2 size={17} /> Compartilhar</button>
            <button className="btn light grow" onClick={zipFrames}><Download size={17} /> Baixar (ZIP)</button>
          </div>
        </div>
      )}

      {(isAdmin || canManage) && <ExportPhotos photos={photos} members={members} />}
    </div>
  );
}

/** Pacote com todas as fotos originais + manifesto, para montar o vídeo coletivo e os shorts de cada um */
function ExportPhotos({ photos, members }: { photos: TripPhoto[]; members: Profile[] }) {
  const [day, setDay] = useState<string>('todos');
  const [busy, setBusy] = useState<string | null>(null);
  const days = [...new Set(photos.map((p) => p.day))];
  const list = day === 'todos' ? photos : photos.filter((p) => p.day === day);

  async function run() {
    setBusy('Gerando links…');
    try {
      const urls = DEMO ? Object.fromEntries(list.map((p) => [p.path, p.path])) : await signedUrls(list.map((p) => p.path));
      const zip = new JSZip();
      const manifest: any[] = [];
      const counter = new Map<string, number>();
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        setBusy(`Baixando ${i + 1} de ${list.length}…`);
        const m = members.find((x) => x.id === p.user_id);
        const dIdx = trip.days.findIndex((d) => d.date === p.day);
        const d = trip.days[dIdx];
        const folder = `${String(dIdx + 1).padStart(2, '0')}_${p.day.replace('/', '-')}_${d ? cityOf(d.city) : 'extra'}/${m?.username ?? m?.display_name ?? 'viajante'}`;
        const n = (counter.get(folder) ?? 0) + 1;
        counter.set(folder, n);
        const time = p.taken_at ? new Date(p.taken_at).toTimeString().slice(0, 5).replace(':', 'h') : 'sem-hora';
        const file = `${folder}/${String(n).padStart(2, '0')}_${time}${p.favorite ? '_fav' : ''}.jpg`;
        const blob = await fetch(urls[p.path]).then((r) => r.blob());
        zip.file(file, blob);
        manifest.push({ file, day: p.day, city: d ? cityOf(d.city) : null, dayTitle: d?.title ?? null, author: m?.display_name, taken_at: p.taken_at, caption: p.caption, favorite: p.favorite, lat: p.lat, lng: p.lng, width: p.width, height: p.height });
      }
      zip.file('manifest.json', JSON.stringify({ trip: 'Eurotrip 2026', exported_at: new Date().toISOString(), photos: manifest }, null, 2));
      setBusy('Compactando…');
      download(await zip.generateAsync({ type: 'blob' }), `eurotrip-fotos-${day === 'todos' ? 'todas' : day.replace('/', '-')}.zip`);
    } catch (e: any) {
      toast(e.message ?? 'Falha na exportação');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="section">
      <div className="section-title"><h2 style={{ fontSize: 20 }}>🎬 Material para o vídeo</h2></div>
      <div className="card stack">
        <div className="small muted">
          Baixa as fotos originais organizadas por dia e por viajante, com um <b>manifest.json</b> (autor, hora, legenda, favorita, local) — a base para o vídeo da história coletiva e os shorts de cada um.
        </div>
        <select className="input" value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="todos">Todos os dias ({photos.length} fotos)</option>
          {days.map((d) => <option key={d} value={d}>{d} ({photos.filter((p) => p.day === d).length} fotos)</option>)}
        </select>
        <button className="btn block" disabled={!!busy || !list.length} onClick={run}><Package size={17} /> {busy ?? 'Exportar ZIP'}</button>
        <div className="tiny muted">Para a viagem inteira o arquivo fica grande — prefira fazer no computador, com wi-fi.</div>
      </div>
    </div>
  );
}
