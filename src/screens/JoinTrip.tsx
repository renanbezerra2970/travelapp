import { useApp } from '../state/AppContext';
import { AuthHero } from './Auth';

/** Conta sem viagem (ex.: removida pelo líder) */
export default function JoinTrip() {
  const { signOut, profile } = useApp();
  return (
    <div className="auth app">
      <AuthHero />
      <div className="card" style={{ marginTop: 22, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>{profile?.avatar ?? '🧳'}</div>
        <h2 style={{ fontSize: 22, marginTop: 6 }}>Olá{profile ? `, ${profile.display_name}` : ''}</h2>
        <p className="muted" style={{ marginTop: 6 }}>Sua conta ainda não está em nenhuma viagem. Peça ao líder para te adicionar.</p>
        <button className="btn light block" style={{ marginTop: 16 }} onClick={signOut}>Sair</button>
      </div>
    </div>
  );
}
