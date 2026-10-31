import { Fragment, useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight, ExternalLink, Check, LogOut } from 'lucide-react';
import { useApp, storage } from '../state/AppContext';
import { brl, trip, type Block } from '../lib/trip';
import { Avatar, FacePicker, Segs, toast } from '../components/ui';
import Album from '../components/Album';
import PoiSheet from '../components/PoiSheet';
import { poiById } from '../data/pois';
import { COLORS } from './Auth';
import { uploadFace } from '../lib/faces';
import type { Nav } from '../App';

type Page = 'perfil' | 'album' | 'transporte' | 'gastos' | 'checklist' | 'dicas' | 'docs';

const MENU: { id: Page; emoji: string; title: string; sub: string }[] = [
  { id: 'album', emoji: '🏆', title: 'Álbum de capturas', sub: 'Seu progresso no Explorar' },
  { id: 'transporte', emoji: '🚇', title: 'Transporte', sub: 'Bilhetes, apps e greves por cidade' },
  { id: 'docs', emoji: '🎟️', title: 'Ingressos e documentos', sub: 'Vaticano, Coliseu, Louvre, PSG…' },
  { id: 'gastos', emoji: '💶', title: 'Gastos', sub: 'Custos da viagem para 4 pessoas' },
  { id: 'checklist', emoji: '✅', title: 'Checklist', sub: 'Celular, cartões e apps' },
  { id: 'dicas', emoji: '💡', title: 'Regras de ouro', sub: 'Dicas para aproveitar cada parada' },
];

export default function More({ nav }: { nav: Nav }) {
  const { profile } = useApp();
  const [page, setPage] = useState<Page | null>(null);

  if (page) {
    const title = page === 'perfil' ? 'Perfil' : MENU.find((m) => m.id === page)!.title;
    return (
      <div className="screen">
        <button className="icon-btn" onClick={() => setPage(null)} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 30, margin: '14px 0 16px' }}>{title}</h1>
        {page === 'perfil' && <ProfilePage />}
        {page === 'album' && <AlbumPage />}
        {page === 'transporte' && <Transport />}
        {page === 'gastos' && <Costs />}
        {page === 'checklist' && <Checklist />}
        {page === 'dicas' && <Tips />}
        {page === 'docs' && <Docs />}
      </div>
    );
  }

  return (
    <div className="screen">
      <h1 style={{ fontSize: 34 }}>Mais</h1>
      <button className="card tap row" style={{ width: '100%', textAlign: 'left', marginTop: 16 }} onClick={() => setPage('perfil')}>
        {profile && <Avatar p={profile} size="lg" />}
        <span className="grow">
          <b style={{ fontSize: 17 }}>{profile?.display_name}</b>
          <div className="small muted">Editar nome, foto e cor</div>
        </span>
        <ChevronRight size={18} color="var(--ink-3)" />
      </button>
      <div className="list" style={{ marginTop: 16 }}>
        <button className="list-item" onClick={() => nav.album()}>
          <span style={{ fontSize: 24, width: 32, textAlign: 'center' }}>🖼️</span>
          <span className="grow"><b>Álbum de fotos</b><div className="small muted">Coletivo e pessoal, num mural infinito</div></span>
          <ChevronRight size={18} color="var(--ink-3)" />
        </button>
        <button className="list-item" onClick={nav.story}>
          <span style={{ fontSize: 24, width: 32, textAlign: 'center' }}>🎬</span>
          <span className="grow"><b>A história da viagem</b><div className="small muted">Colagem das fotos e descobertas · material para o vídeo</div></span>
          <ChevronRight size={18} color="var(--ink-3)" />
        </button>
        {MENU.map((m) => (
          <button key={m.id} className="list-item" onClick={() => setPage(m.id)}>
            <span style={{ fontSize: 24, width: 32, textAlign: 'center' }}>{m.emoji}</span>
            <span className="grow">
              <b>{m.title}</b>
              <div className="small muted">{m.sub}</div>
            </span>
            <ChevronRight size={18} color="var(--ink-3)" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { profile, updateProfile, signOut, session, faces } = useApp();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [busy, setBusy] = useState(false);
  if (!profile) return null;
  async function pick(blob: Blob) {
    setBusy(true);
    try {
      await uploadFace(profile!.id, blob, profile!.avatar_path);
      toast('Foto atualizada');
    } catch (e: any) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <div className="field">
        <span>Sua foto</span>
        <FacePicker value={faces[profile.id]} color={profile.color} busy={busy} onPick={(b) => pick(b)} />
      </div>
      <label className="field">
        <span>Nome</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== profile.display_name && updateProfile({ display_name: name.trim() }).then(() => toast('Nome atualizado'))} />
      </label>
      <div className="field">
        <span>Cor no mapa</span>
        <div className="color-row">
          {COLORS.map((c) => <button key={c} className={c === profile.color ? 'on' : ''} style={{ background: c }} onClick={() => updateProfile({ color: c })} aria-label={c} />)}
        </div>
      </div>
      <div className="small muted">{session?.user.email}</div>
      <button className="btn light block" style={{ marginTop: 20, color: 'var(--danger)' }} onClick={signOut}><LogOut size={18} /> Sair</button>
    </div>
  );
}

function AlbumPage() {
  const [open, setOpen] = useState<string | null>(null);
  const p = open ? poiById.get(open) : null;
  return (
    <>
      <Album onOpen={setOpen} />
      {p && <PoiSheet target={{ kind: 'poi', poi: p }} onClose={() => setOpen(null)} onOpenPoi={setOpen} />}
    </>
  );
}

function BlockView({ b }: { b: Block }): ReactNode {
  switch (b.k) {
    case 'h3': return <h3>{(b as any).text}</h3>;
    case 'h4': return <h3 style={{ fontSize: 14.5 }}>{(b as any).text}</h3>;
    case 'p': return <p><Segs segs={(b as any).segs} /></p>;
    case 'alert': return <div className="alert" style={{ margin: '10px 0' }}><span>⚠️</span><span><Segs segs={(b as any).segs} /></span></div>;
    case 'ol':
    case 'ul': {
      const items = (b as any).items as any[][];
      const L = b.k === 'ol' ? 'ol' : 'ul';
      return <L style={{ paddingLeft: 20, margin: '8px 0' }}>{items.map((segs, i) => <li key={i} style={{ marginTop: 6 }}><Segs segs={segs} /></li>)}</L>;
    }
    case 'table':
      return (
        <div className="stack" style={{ margin: '10px 0' }}>
          {(b as any).rows.map((r: any, i: number) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <b><Segs segs={r.title} /></b>
              <dl className="kv" style={{ marginTop: 8 }}>
                {r.fields.map((f: any, j: number) => (
                  <Fragment key={j}><dt>{f.k}</dt><dd><Segs segs={f.segs} /></dd></Fragment>
                ))}
              </dl>
            </div>
          ))}
        </div>
      );
    default: return null;
  }
}

function Transport() {
  const [i, setI] = useState(0);
  const sec = trip.transport[i];
  return (
    <>
      <div className="chips">
        {trip.transport.map((t, j) => <button key={t.label} className={`chip ${i === j ? 'on' : ''}`} onClick={() => setI(j)}>{t.label}</button>)}
      </div>
      <h2 style={{ fontSize: 21, margin: '18px 0 6px' }}>{sec.title}</h2>
      <div className="prose">{sec.blocks.map((b, j) => <BlockView key={j} b={b} />)}</div>
    </>
  );
}

function Costs() {
  const { costs } = trip;
  const total = costs.items.reduce((s, [, v]) => s + v, 0);
  const pending = costs.items.filter(([, , paid]) => !paid);
  return (
    <>
      <div className="stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="stat"><b>{costs.total}</b><span>total · 4 pessoas</span></div>
        <div className="stat"><b>{costs.perPax}</b><span>por pessoa</span></div>
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>Câmbio {costs.fx} · {pending.length} itens pendentes ou estimados</p>
      <div className="list" style={{ marginTop: 14 }}>
        {[...costs.items].sort((a, b) => b[1] - a[1]).map(([label, v, paid]) => (
          <div key={label} className="cost-row">
            <span className="grow">
              {label}
              <div style={{ marginTop: 4 }}><span className="pill" style={paid ? { background: '#e3f4ea', color: 'var(--ok)' } : undefined}>{paid ? 'Pago' : 'Estimado'}</span></div>
            </span>
            <span style={{ textAlign: 'right' }}>
              <b>{brl(v)}</b>
              <div className="progress" style={{ width: 80, height: 5, marginTop: 6 }}><i style={{ width: `${(v / total) * 100 * 3}%`, maxWidth: '100%' }} /></div>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Checklist() {
  const { session } = useApp();
  const key = `checklist:${session?.user.id}`;
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    const s = storage.get(key);
    if (s) return JSON.parse(s);
    return Object.fromEntries(trip.checklist.flatMap((g) => g.items.map(([t, d]) => [t, d])));
  });
  const toggle = (t: string) => {
    const n = { ...done, [t]: !done[t] };
    setDone(n);
    storage.set(key, JSON.stringify(n));
  };
  return (
    <>
      {trip.checklist.map((g) => (
        <div key={g.group} className="section" style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{g.group}</div>
          <div className="list">
            {g.items.map(([t]) => (
              <button key={t} className={`check-row ${done[t] ? 'done' : ''}`} onClick={() => toggle(t)}>
                <span className="check-box">{done[t] && <Check size={14} strokeWidth={3} />}</span>
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function Tips() {
  return (
    <div className="stack">
      {trip.info.rules.map((r, i) => (
        <div key={i} className="card row" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 26, color: 'var(--city)', lineHeight: 1 }}>{i + 1}</span>
          <span>{r}</span>
        </div>
      ))}
      <div className="card small muted">{trip.info.sunset}</div>
    </div>
  );
}

function Docs() {
  const { privateData } = useApp();
  if (!privateData.docGroups) return <div className="empty">🔒 Os documentos aparecem para quem está na viagem.</div>;
  return (
    <>
      {privateData.docGroups.map((g) => (
        <div key={g.group} className="section" style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{g.group}</div>
          <div className="list">
            {g.items.map((d) => (
              <a key={d.url} className="list-item" href={d.url} target="_blank" rel="noreferrer">
                <span style={{ fontSize: 20 }}>📄</span>
                <span className="grow" style={{ fontWeight: 600 }}>{d.label}</span>
                <ExternalLink size={16} color="var(--ink-3)" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
