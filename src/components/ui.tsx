import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useApp } from '../state/AppContext';
import { cropFace, initials } from '../lib/faces';
import { createPortal } from 'react-dom';
import { UserRound } from 'lucide-react';
import type { Profile } from '../lib/supabase';

export function Avatar({ p, size, live }: { p: Pick<Profile, 'color'> & Partial<Pick<Profile, 'id' | 'display_name'>>; size?: 'sm' | 'lg' | 'xl'; live?: boolean | null }) {
  const { faces } = useApp();
  const url = p.id ? faces[p.id] : undefined;
  return (
    <span className={`avatar ${size ?? ''}`} style={{ '--c': p.color } as CSSProperties}>
      {url ? <img src={url} alt="" /> : <b className="ini">{initials(p.display_name)}</b>}
      {live !== undefined && live !== null && <i className={`dot ${live ? 'live' : ''}`} />}
    </span>
  );
}

/** Foto do rosto: câmera frontal ou galeria, com prévia redonda */
export function FacePicker({ value, onPick, color = '#E4572E', busy }: { value?: string | null; onPick: (blob: Blob, preview: string) => void; color?: string; busy?: boolean }) {
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  async function onFile(f?: File) {
    if (!f) return;
    setErr(null);
    try {
      const blob = await cropFace(f);
      onPick(blob, URL.createObjectURL(blob));
    } catch (e: any) {
      setErr(e.message);
    }
  }
  return (
    <div className="face-picker">
      <div className="face-preview" style={{ '--c': color } as CSSProperties}>
        {value ? <img src={value} alt="Sua foto" /> : <UserRound size={52} strokeWidth={1.5} color="var(--ink-3)" />}
        {busy && <div className="spinner" />}
      </div>
      <div className="face-actions">
        <button type="button" className="btn sm" onClick={() => cam.current?.click()}>📷 Tirar foto</button>
        <button type="button" className="btn sm light" onClick={() => gal.current?.click()}>🖼️ Galeria</button>
        <input ref={cam} type="file" accept="image/*" capture="user" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {err && <div className="error" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  );
}

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  // portal: fica acima da navegação mesmo quando aberto dentro do mapa (que tem seu próprio empilhamento)
  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="grab" />
        {children}
      </div>
    </>,
    document.body,
  );
}

let toastFn: ((m: string) => void) | null = null;
export const toast = (m: string) => toastFn?.(m);

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: number;
    toastFn = (m) => {
      setMsg(m);
      clearTimeout(t);
      t = window.setTimeout(() => setMsg(null), 2600);
    };
    return () => {
      toastFn = null;
    };
  }, []);
  return msg ? <div className="toast">{msg}</div> : null;
}

export function Confetti({ colors }: { colors: string[] }) {
  const pieces = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    const r = 140 + Math.random() * 160;
    return {
      '--x': `${Math.cos(a) * r}px`,
      '--y': `${Math.sin(a) * r - 80}px`,
      '--rot': `${Math.random() * 720}deg`,
      background: colors[i % colors.length],
      animationDelay: `${Math.random() * 0.1}s`,
    } as CSSProperties;
  });
  return (
    <div className="confetti">
      {pieces.map((s, i) => (
        <i key={i} style={s} />
      ))}
    </div>
  );
}

export function Segs({ segs }: { segs: { t: string; b?: number; h?: string }[] }) {
  return (
    <>
      {segs.map((s, i) =>
        s.h ? (
          <a key={i} href={s.h} target="_blank" rel="noreferrer">
            {s.t}
          </a>
        ) : s.b ? (
          <b key={i}>{s.t}</b>
        ) : (
          <span key={i}>{s.t}</span>
        ),
      )}
    </>
  );
}
