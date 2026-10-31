import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Star, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { deletePhoto, PHOTO_LIMIT, signedUrls, thumbPath, updatePhoto, uploadPhoto, useTripPhotos, type TripPhoto } from '../lib/photos';
import { Avatar, Sheet, toast } from './ui';

/** "Fotos do dia": cada viajante sobe até 20; todos veem as do grupo */
export default function DayPhotos({ day, compact }: { day: string; compact?: boolean }) {
  const { tripId, session, role, members, myPos } = useApp();
  const me = session?.user.id;
  const { photos, setPhotos } = useTripPhotos(tripId);
  const dayPhotos = useMemo(() => photos.filter((p) => p.day === day), [photos, day]);
  const mine = dayPhotos.filter((p) => p.user_id === me).length;
  const left = PHOTO_LIMIT - mine;
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dayPhotos.length) return;
    signedUrls(dayPhotos.map((p) => thumbPath(p.path))).then((u) => setThumbs((s) => ({ ...s, ...u })));
  }, [dayPhotos]);

  async function onFiles(list: FileList | null) {
    if (!list || !tripId || !me) return;
    const files = [...list].slice(0, left);
    if (list.length > left) toast(`Só cabem mais ${left} fotos hoje — enviando as primeiras ${files.length}.`);
    setBusy({ done: 0, total: files.length });
    let ok = 0;
    for (const f of files) {
      try {
        const p = await uploadPhoto({ tripId, userId: me, day, file: f, at: myPos });
        setPhotos((s) => (s.some((x) => x.id === p.id) ? s : [...s, p]));
        ok++;
      } catch (e: any) {
        toast(e.message);
        break;
      }
      setBusy({ done: ok, total: files.length });
    }
    setBusy(null);
    if (ok) toast(`📸 ${ok} foto${ok > 1 ? 's' : ''} adicionada${ok > 1 ? 's' : ''}`);
    if (input.current) input.current.value = '';
  }

  const canPost = !!role; // admin acompanha, não posta

  return (
    <div className={compact ? '' : 'section'}>
      <div className="section-title">
        <h2 style={{ fontSize: compact ? 20 : 22 }}>📸 Fotos do dia</h2>
        {canPost && <span className="small muted">{mine}/{PHOTO_LIMIT} suas</span>}
      </div>
      {canPost && (
        <>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <button className="card tap row" style={{ width: '100%', textAlign: 'left', marginBottom: 12, borderStyle: 'dashed' }} disabled={!!busy || left <= 0} onClick={() => input.current?.click()}>
            <span className="avatar" style={{ background: 'var(--city-soft)', boxShadow: 'none', color: 'var(--city)' }}><Camera size={20} /></span>
            <span className="grow">
              <b>{busy ? `Enviando ${busy.done + 1} de ${busy.total}…` : left > 0 ? 'Adicionar fotos' : 'Limite do dia atingido'}</b>
              <div className="small muted">
                {left > 0 ? `Até ${left} foto${left > 1 ? 's' : ''} · viram a colagem da viagem e o vídeo do grupo` : 'Apague uma para trocar por outra'}
              </div>
            </span>
            {busy && <div className="spinner" style={{ width: 22, height: 22 }} />}
          </button>
        </>
      )}
      {dayPhotos.length > 0 ? (
        <div className="photo-grid">
          {dayPhotos.map((p, i) => {
            const m = members.find((x) => x.id === p.user_id);
            return (
              <button key={p.id} className="photo-cell" onClick={() => setOpen(i)} style={thumbs[thumbPath(p.path)] ? { backgroundImage: `url("${thumbs[thumbPath(p.path)]}")` } : undefined}>
                {m && <span className="photo-by"><Avatar p={m} size="sm" /></span>}
                {p.favorite && <span className="photo-fav">★</span>}
              </button>
            );
          })}
        </div>
      ) : (
        !canPost && <div className="empty small">Ninguém postou fotos deste dia ainda.</div>
      )}
      {open !== null && dayPhotos[open] && (
        <Viewer
          list={dayPhotos}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          onDeleted={(id) => {
            setPhotos((s) => s.filter((x) => x.id !== id));
            setOpen(null);
          }}
          onChanged={(p) => setPhotos((s) => s.map((x) => (x.id === p.id ? p : x)))}
        />
      )}
    </div>
  );
}

function Viewer({ list, index, onIndex, onClose, onDeleted, onChanged }: { list: TripPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void; onDeleted: (id: string) => void; onChanged: (p: TripPhoto) => void }) {
  const { members, session, isAdmin } = useApp();
  const p = list[index];
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState(p.caption ?? '');
  const m = members.find((x) => x.id === p.user_id);
  const mine = p.user_id === session?.user.id;

  useEffect(() => {
    setUrl('');
    setCaption(p.caption ?? '');
    signedUrls([p.path]).then((u) => setUrl(u[p.path]));
  }, [p]);

  return (
    <Sheet onClose={onClose}>
      <div className="viewer">
        <div className="viewer-img" style={url ? { backgroundImage: `url("${url}")` } : undefined}>
          {!url && <div className="spinner" />}
          <button className="icon-btn close" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
          {index > 0 && <button className="icon-btn nav-l" onClick={() => onIndex(index - 1)} aria-label="Anterior"><ChevronLeft size={22} /></button>}
          {index < list.length - 1 && <button className="icon-btn nav-r" onClick={() => onIndex(index + 1)} aria-label="Próxima"><ChevronRight size={22} /></button>}
        </div>
        <div className="sheet-body">
          <div className="row" style={{ marginTop: 12 }}>
            {m && <Avatar p={m} size="sm" />}
            <div className="grow small">
              <b>{m?.display_name ?? 'Viajante'}</b>
              <div className="tiny muted">{p.taken_at ? new Date(p.taken_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''} · {index + 1}/{list.length}</div>
            </div>
            {mine && (
              <button className="icon-btn" style={{ boxShadow: 'none' }} onClick={async () => { await updatePhoto(p.id, { favorite: !p.favorite }); onChanged({ ...p, favorite: !p.favorite }); }} aria-label="Favorita">
                <Star size={19} fill={p.favorite ? '#E0A100' : 'none'} color={p.favorite ? '#E0A100' : 'currentColor'} />
              </button>
            )}
            {(mine || isAdmin) && (
              <button className="icon-btn" style={{ boxShadow: 'none', color: 'var(--danger)' }} onClick={async () => { if (confirm('Apagar esta foto?')) { await deletePhoto(p); onDeleted(p.id); } }} aria-label="Apagar">
                <Trash2 size={18} />
              </button>
            )}
          </div>
          {mine ? (
            <input
              className="input"
              style={{ marginTop: 12 }}
              value={caption}
              maxLength={280}
              placeholder="Legenda (opcional) — vira texto no vídeo"
              onChange={(e) => setCaption(e.target.value)}
              onBlur={async () => { if (caption !== (p.caption ?? '')) { await updatePhoto(p.id, { caption: caption || null }); onChanged({ ...p, caption: caption || null }); } }}
            />
          ) : (
            p.caption && <p style={{ marginTop: 12 }}>{p.caption}</p>
          )}
          {mine && <div className="tiny muted" style={{ marginTop: 8 }}>★ marque suas preferidas: elas têm prioridade na colagem e no vídeo.</div>}
        </div>
      </div>
    </Sheet>
  );
}
