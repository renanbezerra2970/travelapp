import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Maximize2, X } from 'lucide-react';
import { DEMO, useApp } from '../state/AppContext';
import { signedUrls, thumbPath, useTripPhotos } from '../lib/photos';
import { trip } from '../lib/trip';
import InfiniteGallery, { type GalleryImage } from '../components/InfiniteGallery';
import { Viewer } from '../components/DayPhotos';
import { demoPhotos } from './Story';

/** Álbum em tela cheia no formato "canvas infinito": coletivo, meu ou de um viajante, por dia */
export default function PhotoAlbum({ onBack, initial = 'all' }: { onBack: () => void; initial?: 'all' | 'me' }) {
  const { tripId, members, session } = useApp();
  const me = session?.user.id;
  const live = useTripPhotos(tripId);
  const photos = DEMO ? demoPhotos() : live.photos;
  const [who, setWho] = useState<string>(initial === 'me' && me ? me : 'all');
  const [day, setDay] = useState<string>('all');
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<number | null>(null);
  const [immersive, setImmersive] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // modo imersivo: só o mural, de borda a borda (tela cheia de verdade onde o navegador permite)
  async function enterImmersive() {
    setImmersive(true);
    try {
      await rootRef.current?.requestFullscreen?.({ navigationUI: 'hide' });
      (screen.orientation as any)?.lock?.('any').catch?.(() => {});
    } catch {
      /* iPhone e afins: fica só sem a interface */
    }
  }
  function exitImmersive() {
    setImmersive(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  useEffect(() => {
    const onFs = () => !document.fullscreenElement && setImmersive(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setImmersive(false);
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      window.removeEventListener('keydown', onKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const list = useMemo(() => photos.filter((p) => (who === 'all' || p.user_id === who) && (day === 'all' || p.day === day)), [photos, who, day]);

  useEffect(() => {
    if (DEMO) return setThumbs(Object.fromEntries(photos.map((p) => [p.path, p.path])));
    if (photos.length) signedUrls(photos.map((p) => thumbPath(p.path))).then((u) => setThumbs(Object.fromEntries(photos.map((p) => [p.path, u[thumbPath(p.path)]]))));
  }, [photos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const images: GalleryImage[] = useMemo(() => list.filter((p) => thumbs[p.path]).map((p) => ({ src: thumbs[p.path], key: p.id, alt: p.caption ?? '' })), [list, thumbs]);
  const days = trip.days.filter((d) => photos.some((p) => p.day === d.date));
  const people = members.filter((m) => photos.some((p) => p.user_id === m.id));
  const title = who === 'all' ? 'Álbum coletivo' : who === me ? 'Meu álbum' : `Álbum de ${members.find((m) => m.id === who)?.display_name ?? ''}`;

  return (
    <div ref={rootRef} className={`album-screen ${immersive ? "immersive" : ""}`}>
      {images.length > 0 ? (
        // a key força remontar a galeria quando o filtro muda (novas fotos no plano)
        <InfiniteGallery key={`${who}-${day}-${images.length}`} images={images} density={images.length < 6 ? 3 : 9} imageWidth={120} imageHeight={150} onOpen={(key) => setOpen(list.findIndex((p) => p.id === key))} />
      ) : (
        <div className="center-fill" style={{ position: 'absolute', inset: 0, color: 'rgba(255,255,255,.75)', textAlign: 'center', padding: 24 }}>
          <div>
            <div style={{ fontSize: 44 }}>📷</div>
            <p style={{ marginTop: 8 }}>{photos.length ? 'Nenhuma foto com esse filtro.' : 'Ainda não há fotos. Poste em "Fotos do dia" e elas aparecem aqui.'}</p>
          </div>
        </div>
      )}

      <div className="album-top">
        <div className="row" style={{ gap: 10 }}>
          <button className="icon-btn glass" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
          <div className="grow">
            <div style={{ fontWeight: 700, fontSize: 17 }}>{title}</div>
            <div className="tiny" style={{ opacity: 0.7 }}>{list.length} foto{list.length === 1 ? '' : 's'} · arraste, aproxime com dois dedos, toque para abrir</div>
          </div>
          {images.length > 0 && (
            <button className="icon-btn glass" onClick={enterImmersive} aria-label="Tela cheia sem bordas" title="Tela cheia">
              <Maximize2 size={19} />
            </button>
          )}
        </div>
        <div className="chips" style={{ marginTop: 10 }}>
          <button className={`chip dark ${who === 'all' ? 'on' : ''}`} onClick={() => setWho('all')}>👥 Coletivo</button>
          {me && <button className={`chip dark ${who === me ? 'on' : ''}`} onClick={() => setWho(me)}>⭐ Meu álbum</button>}
          {people.filter((m) => m.id !== me).map((m) => (
            <button key={m.id} className={`chip dark ${who === m.id ? 'on' : ''}`} onClick={() => setWho(m.id)}>{m.avatar} {m.display_name}</button>
          ))}
        </div>
        {days.length > 1 && (
          <div className="chips" style={{ marginTop: 8 }}>
            <button className={`chip dark ${day === 'all' ? 'on' : ''}`} onClick={() => setDay('all')}>Viagem toda</button>
            {days.map((d) => (
              <button key={d.date} className={`chip dark ${day === d.date ? 'on' : ''}`} onClick={() => setDay(d.date)}>{d.date}</button>
            ))}
          </div>
        )}
      </div>

      {immersive && (
        <button className="immersive-exit" onClick={exitImmersive} aria-label="Sair da tela cheia"><X size={18} /></button>
      )}

      {open !== null && open >= 0 && list[open] && (
        <Viewer list={list} index={open} onIndex={setOpen} onClose={() => setOpen(null)} onDeleted={() => { setOpen(null); live.reload(); }} onChanged={() => live.reload()} />
      )}
    </div>
  );
}
