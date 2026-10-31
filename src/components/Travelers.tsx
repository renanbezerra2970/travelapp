import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { UserPlus, Send, KeyRound, Trash2, Crown } from 'lucide-react';
import { DEMO, useApp } from '../state/AppContext';
import { supabase } from '../lib/supabase';
import { invites, shareInvite, type NewInvite } from '../lib/auth';
import { Avatar, toast } from './ui';

type Pending = { token: string; display_name: string; role: string; user_id: string | null; created_at: string };

/** Painel do líder (e do admin): criar viajantes, enviar convites, redefinir senha, remover */
export default function Travelers() {
  const { tripId, members, session, refreshTrip } = useApp();
  const me = session?.user.id;
  const [pending, setPending] = useState<Pending[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [leader, setLeader] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (DEMO || !tripId) return;
    const [{ data: inv }, { data: mem }] = await Promise.all([
      supabase.from('invites').select('token,display_name,role,user_id,created_at').eq('trip_id', tripId).is('claimed_at', null).order('created_at'),
      supabase.from('trip_members').select('user_id,role').eq('trip_id', tripId),
    ]);
    setPending(inv ?? []);
    setRoles(Object.fromEntries((mem ?? []).map((m) => [m.user_id, m.role])));
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load, members.length]);

  async function send(inv: { token: string; display_name: string }, reset = false) {
    const r = await shareInvite(inv, reset);
    if (r === 'copied') toast('Convite copiado — cole no WhatsApp');
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const inv = await invites<NewInvite>('create', { trip_id: tripId, display_name: name.trim(), role: leader ? 'owner' : 'member' });
      setName('');
      setLeader(false);
      await load();
      await send(inv);
    } catch (e: any) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function reset(userId: string, display: string) {
    try {
      const inv = await invites<NewInvite>('reset', { user_id: userId });
      await load();
      await send({ token: inv.token, display_name: display }, true);
    } catch (e: any) {
      toast(e.message);
    }
  }

  async function remove(userId: string, display: string) {
    if (!confirm(`Remover ${display} da viagem? A pessoa deixa de ver o roteiro e o grupo.`)) return;
    try {
      await invites('remove', { trip_id: tripId, user_id: userId });
      await refreshTrip();
    } catch (e: any) {
      toast(e.message);
    }
  }

  async function revoke(token: string) {
    await invites('revoke', { token }).catch((e) => toast(e.message));
    await load();
  }

  return (
    <div className="stack">
      <form className="card stack" onSubmit={create}>
        <b className="row" style={{ gap: 8 }}><UserPlus size={18} /> Adicionar viajante</b>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (é o login dele)" maxLength={40} />
        <label className="row small" style={{ gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={leader} onChange={(e) => setLeader(e.target.checked)} /> Também é líder (pode convidar e gerenciar)
        </label>
        <button className="btn block" disabled={busy || !name.trim()}><Send size={17} /> Criar e enviar convite</button>
        <div className="tiny muted">A pessoa abre o link, escolhe o avatar e cria a senha. Sem e-mail, sem cadastro.</div>
      </form>

      {pending.length > 0 && (
        <>
          <div className="eyebrow">Convites pendentes</div>
          <div className="list">
            {pending.map((p) => (
              <div key={p.token} className="member-row">
                <span className="avatar" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>{p.user_id ? '🔑' : '✉️'}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <b>{p.display_name}</b>{p.role === 'owner' && <Crown size={13} color="#E0A100" style={{ marginLeft: 4 }} />}
                  <div className="tiny muted">{p.user_id ? 'Redefinição de senha' : 'Ainda não criou a senha'}</div>
                </div>
                <button className="btn sm light" onClick={() => send(p, !!p.user_id)}><Send size={14} /> Enviar</button>
                <button className="icon-btn" style={{ width: 36, height: 36, boxShadow: 'none' }} onClick={() => revoke(p.token)} aria-label="Cancelar convite"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="eyebrow">Na viagem</div>
      <div className="list">
        {members.map((m) => (
          <div key={m.id} className="member-row">
            <Avatar p={m} />
            <div className="grow" style={{ minWidth: 0 }}>
              <b>{m.display_name}{m.id === me ? ' (você)' : ''}</b>
              {roles[m.id] === 'owner' && <Crown size={13} color="#E0A100" style={{ marginLeft: 4 }} />}
              <div className="tiny muted">login: {m.username ?? m.display_name}</div>
            </div>
            {m.id !== me && (
              <>
                <button className="btn sm light" onClick={() => reset(m.id, m.display_name)} title="Gerar link para nova senha"><KeyRound size={14} /> Senha</button>
                <button className="icon-btn" style={{ width: 36, height: 36, boxShadow: 'none' }} onClick={() => remove(m.id, m.display_name)} aria-label={`Remover ${m.display_name}`}><Trash2 size={15} /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
