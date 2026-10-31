import { supabase } from './supabase';

/** Contas não usam e-mail de verdade: o login é o nome, convertido num endereço interno */
export const USER_DOMAIN = 'viajantes.eurotrip.app';

export const usernameFrom = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const loginEmail = (nameOrUser: string) => `${usernameFrom(nameOrUser)}@${USER_DOMAIN}`;

export type InviteInfo = { display_name: string; username: string; role: 'owner' | 'member' | 'admin'; trip: string | null; reset: boolean };
export type NewInvite = { token: string; display_name: string; username: string; role: string };

export async function invites<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('invites', { body: { action, ...body } });
  if (error) {
    let msg = 'Não foi possível concluir.';
    try {
      msg = (await (error as any).context.json()).error ?? msg;
    } catch {
      /* resposta sem corpo */
    }
    throw new Error(msg);
  }
  return data as T;
}

export const inviteLink = (token: string) => `${location.origin}/?convite=${token}`;

export async function shareInvite(inv: { token: string; display_name: string }, reset = false) {
  const url = inviteLink(inv.token);
  const text = reset
    ? `${inv.display_name}, use este link para criar uma nova senha no app da Eurotrip 2026: ${url}`
    : `${inv.display_name}, este é o seu convite para o app da Eurotrip 2026 ✈️ Abra o link, crie sua senha e pronto: ${url}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Eurotrip 2026', text });
      return 'shared';
    } catch {
      /* cancelado: cai para copiar */
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
