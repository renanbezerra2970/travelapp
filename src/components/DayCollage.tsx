import { useMemo, useState } from 'react';
import { Film, Share2, Download, X } from 'lucide-react';
import JSZip from 'jszip';
import { buildDayStory, planDay } from '../lib/collage';
import { download, useStoryInput } from '../screens/Story';
import { Sheet, toast } from './ui';

/** Colagem só deste dia, sob demanda */
export default function DayCollage({ dayIndex }: { dayIndex: number }) {
  const { input } = useStoryInput();
  const day = input.days.find((d) => d.index === dayIndex);
  const cards = useMemo(() => (day ? planDay(day).length : 0), [day]);
  const [frames, setFrames] = useState<{ name: string; blob: Blob; url: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function make() {
    setBusy('Montando…');
    try {
      const out = await buildDayStory(input, dayIndex, (d, t) => setBusy(`Montando ${d} de ${t}…`));
      setFrames(out.map((f) => ({ ...f, url: URL.createObjectURL(f.blob) })));
      setOpen(true);
    } catch (e: any) {
      toast(e.message ?? 'Não foi possível montar a colagem');
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    const files = frames.map((f) => new File([f.blob], f.name, { type: 'image/jpeg' }));
    if (navigator.canShare?.({ files })) return navigator.share({ files, title: `Eurotrip · ${day?.date}` }).catch(() => {});
    const zip = new JSZip();
    frames.forEach((f) => zip.file(f.name, f.blob));
    download(await zip.generateAsync({ type: 'blob' }), `eurotrip-${day?.date.replace('/', '-')}.zip`);
  }

  if (!day) return null;
  return (
    <>
      <button className="btn block light" style={{ marginTop: 12 }} disabled={!!busy || !cards} onClick={make}>
        <Film size={18} /> {busy ?? (cards ? `Montar colagem do dia · ${cards} card${cards > 1 ? 's' : ''}` : 'Colagem do dia: poste fotos ou marque lugares')}
      </button>
      {open && (
        <Sheet onClose={() => setOpen(false)}>
          <div className="sheet-body">
            <div className="row between">
              <h2 style={{ fontSize: 22 }}>Colagem de {day.date}</h2>
              <button className="icon-btn" style={{ boxShadow: 'none' }} onClick={() => setOpen(false)} aria-label="Fechar"><X size={18} /></button>
            </div>
            <p className="small muted" style={{ margin: '4px 0 14px' }}>{day.photos.length} fotos e {day.places.length} lugares viraram {frames.length} card{frames.length > 1 ? 's' : ''}.</p>
            <div className="story-frames">
              {frames.map((f) => <a key={f.name} href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={f.name} /></a>)}
            </div>
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <button className="btn grow" onClick={share}><Share2 size={17} /> Compartilhar</button>
              <button className="btn light grow" onClick={() => frames.forEach((f) => download(f.blob, f.name))}><Download size={17} /> Baixar</button>
            </div>
          </div>
        </Sheet>
      )}
    </>
  );
}
