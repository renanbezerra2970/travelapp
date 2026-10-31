import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { invites, loginEmail, type InviteInfo } from '../lib/auth';
import { uploadFace } from '../lib/faces';
import { FacePicker } from '../components/ui';

export const COLORS = ['#E4572E', '#8B4FD8', '#2C7BE5', '#2E9E6A', '#E0A100', '#D63A7B', '#1F2A44'];

export function AuthHero() {
  return (
    <div className="auth-hero">
      <svg className="dots" viewBox="0 0 200 200" aria-hidden>
        <path d="M30 60 L150 40 L40 150 L160 140" stroke="#fff" strokeWidth="5" fill="none" strokeDasharray="1 14" strokeLinecap="round" />
        <circle cx="30" cy="60" r="16" fill="#3A6EA5" /><circle cx="150" cy="40" r="16" fill="#D9643A" />
        <circle cx="40" cy="150" r="16" fill="#1F8A84" /><circle cx="160" cy="140" r="16" fill="#8A4F9E" />
      </svg>
      <div className="eyebrow" style={{ color: 'rgba(255,255,255,.75)' }}>29 out – 10 nov 2026</div>
      <h1>Eurotrip</h1>
      <div className="route">
        <span>🚋 Lisboa</span><span>🏛️ Roma</span><span>🛶 Veneza</span><span>🗼 Paris</span>
      </div>
    </div>
  );
}

export default function AuthScreen() {
  const token = new URLSearchParams(location.search).get('convite');
  return <div className="auth app">{token ? <Claim token={token} /> : <Login />}</div>;
}

function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail(name), password });
    setBusy(false);
    if (error) setErr(error.message === 'Invalid login credentials' ? 'Nome ou senha incorretos.' : error.message);
  }

  return (
    <>
      <AuthHero />
      <form onSubmit={submit} className="stack" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 24 }}>Entrar</h2>
        <label className="field">
          <span>Seu nome</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: David" autoComplete="username" autoCapitalize="words" required />
        </label>
        <label className="field">
          <span>Senha</span>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {err && <div className="error">{err}</div>}
        <button className="btn block" disabled={busy} style={{ marginTop: 18 }}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <p className="small muted" style={{ textAlign: 'center', marginTop: 8 }}>
          Primeiro acesso? Abra o link de convite que o líder da viagem te mandou. Esqueceu a senha? Peça a ele um link novo.
        </p>
      </form>
    </>
  );
}

function Claim({ token }: { token: string }) {
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [face, setFace] = useState<{ blob: Blob; url: string } | null>(null);
  const [later, setLater] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    invites<InviteInfo>('peek', { token }).then(setInfo, (e) => setLoadErr(e.message));
  }, [token]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) return setErr('A senha precisa de pelo menos 6 caracteres.');
    if (password !== password2) return setErr('As senhas não conferem.');
    if (!info?.reset && !face && !later) return setErr('Tire ou escolha uma foto do seu rosto — é como o grupo te encontra no mapa.');
    setBusy(true);
    try {
      const r = await invites<{ email: string }>('claim', { token, password, avatar: '🙂', color });
      history.replaceState(null, '', location.pathname);
      const { data, error } = await supabase.auth.signInWithPassword({ email: r.email, password });
      if (error) throw error;
      if (face && data.user) await uploadFace(data.user.id, face.blob).catch(() => {});
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  if (loadErr)
    return (
      <>
        <AuthHero />
        <div className="card" style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🎟️</div>
          <h2 style={{ fontSize: 21, marginTop: 6 }}>{loadErr}</h2>
          <p className="muted small" style={{ marginTop: 6 }}>Se você já criou sua senha, é só entrar. Se não, peça um novo link ao líder da viagem.</p>
          <button className="btn block" style={{ marginTop: 14 }} onClick={() => { history.replaceState(null, '', location.pathname); location.reload(); }}>Ir para o login</button>
        </div>
      </>
    );
  if (!info) return <div className="center-fill"><div className="spinner" /></div>;

  const roleText = info.role === 'admin' ? 'Você é o administrador do app.' : info.role === 'owner' ? `Você é o líder da viagem ${info.trip}.` : `Você foi convidado para a viagem ${info.trip}.`;

  return (
    <>
      <AuthHero />
      <form onSubmit={submit} className="stack" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 26 }}>Olá, {info.display_name}! 👋</h2>
        <p className="muted">{info.reset ? 'Crie uma nova senha para sua conta.' : `${roleText} Tire uma foto do rosto e crie uma senha — é só isso.`}</p>
        <div className="pill" style={{ alignSelf: 'flex-start' }}>Seu login: <b>{info.display_name}</b></div>
        {!info.reset && (
          <>
            <div className="field">
              <span>Sua foto (rosto)</span>
              <FacePicker value={face?.url} color={color} onPick={(blob, url) => setFace({ blob, url })} />
              {!face && (
                <label className="row tiny muted" style={{ gap: 6, marginTop: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={later} onChange={(e) => setLater(e.target.checked)} /> Adicionar a foto depois
                </label>
              )}
            </div>
            <div className="field">
              <span>Sua cor</span>
              <div className="color-row">
                {COLORS.map((c) => <button type="button" key={c} className={c === color ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />)}
              </div>
            </div>
          </>
        )}
        <label className="field">
          <span>Crie uma senha</span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
        </label>
        <label className="field">
          <span>Repita a senha</span>
          <input className="input" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" minLength={6} required />
        </label>
        {err && <div className="error">{err}</div>}
        <button className="btn block" disabled={busy} style={{ marginTop: 18 }}>{busy ? 'Criando…' : info.reset ? 'Salvar nova senha' : 'Criar senha e entrar'}</button>
      </form>
    </>
  );
}
