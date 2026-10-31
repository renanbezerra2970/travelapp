// Convites sem e-mail.
//  peek   (público)  token → quem é, viagem, papel
//  claim  (público)  token + senha → cria a conta já confirmada (ou redefine a senha) e devolve o login
//  create (líder/admin) trip_id + nome + papel → novo convite
//  reset  (líder/admin) user_id → convite para definir nova senha
//  revoke (líder/admin) token → apaga convite pendente
//  remove (líder/admin) user_id + trip_id → tira o viajante da viagem
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const USER_DOMAIN = 'viajantes.eurotrip.app';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'viajante';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

async function caller(req: Request) {
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!jwt) return null;
  const { data } = await db.auth.getUser(jwt);
  if (!data.user) return null;
  const { data: prof } = await db.from('profiles').select('is_admin').eq('id', data.user.id).maybeSingle();
  return { id: data.user.id, isAdmin: !!prof?.is_admin };
}

async function canManage(who: { id: string; isAdmin: boolean } | null, tripId: string | null) {
  if (!who) return false;
  if (who.isAdmin) return true;
  if (!tripId) return false;
  const { data } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', who.id).maybeSingle();
  return data?.role === 'owner';
}

async function freeUsername(name: string) {
  const base = slug(name);
  for (let i = 1; i < 50; i++) {
    const u = i === 1 ? base : `${base}-${i}`;
    const [{ count: a }, { count: b }] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('username', u),
      db.from('invites').select('token', { count: 'exact', head: true }).eq('username', u).is('claimed_at', null),
    ]);
    if (!a && !b) return u;
  }
  throw new Error('username');
}

async function liveInvite(token: string) {
  const { data } = await db.from('invites').select('*').eq('token', token).maybeSingle();
  if (!data || data.claimed_at || new Date(data.expires_at) < new Date()) return null;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    switch (body.action) {
      case 'peek': {
        const inv = await liveInvite(String(body.token ?? ''));
        if (!inv) return json({ error: 'Convite inválido ou já usado.' }, 404);
        const { data: trip } = inv.trip_id ? await db.from('trips').select('name').eq('id', inv.trip_id).single() : { data: null };
        return json({ display_name: inv.display_name, username: inv.username, role: inv.role, trip: trip?.name ?? null, reset: !!inv.user_id });
      }

      case 'claim': {
        const inv = await liveInvite(String(body.token ?? ''));
        if (!inv) return json({ error: 'Convite inválido ou já usado.' }, 404);
        const password = String(body.password ?? '');
        if (password.length < 6) return json({ error: 'A senha precisa de pelo menos 6 caracteres.' }, 400);
        const email = `${inv.username}@${USER_DOMAIN}`;
        let userId = inv.user_id as string | null;
        if (userId) {
          const { error } = await db.auth.admin.updateUserById(userId, { password });
          if (error) throw error;
        } else {
          const { data, error } = await db.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { display_name: inv.display_name, avatar: body.avatar, color: body.color },
          });
          if (error) throw error;
          userId = data.user.id;
          await db.from('profiles').update({ username: inv.username, is_admin: inv.role === 'admin' }).eq('id', userId);
          if (inv.trip_id) {
            await db.from('trip_members').upsert({ trip_id: inv.trip_id, user_id: userId, role: inv.role === 'owner' ? 'owner' : 'member' });
          }
        }
        await db.from('invites').update({ claimed_at: new Date().toISOString(), user_id: userId }).eq('token', inv.token);
        return json({ email, username: inv.username });
      }

      case 'create': {
        const who = await caller(req);
        const tripId = body.trip_id ?? null;
        const role = ['owner', 'member', 'admin'].includes(body.role) ? body.role : 'member';
        if (role === 'admin' ? !who?.isAdmin : !(await canManage(who, tripId))) return json({ error: 'Sem permissão.' }, 403);
        const name = String(body.display_name ?? '').trim().slice(0, 40);
        if (!name) return json({ error: 'Informe o nome.' }, 400);
        const { data, error } = await db
          .from('invites')
          .insert({ trip_id: role === 'admin' ? null : tripId, display_name: name, username: await freeUsername(name), role, created_by: who!.id })
          .select('token, display_name, username, role')
          .single();
        if (error) throw error;
        return json(data);
      }

      case 'reset': {
        const who = await caller(req);
        const { data: prof } = await db.from('profiles').select('id, display_name, username').eq('id', body.user_id).maybeSingle();
        const { data: mem } = await db.from('trip_members').select('trip_id, role').eq('user_id', body.user_id).limit(1).maybeSingle();
        if (!prof || !(await canManage(who, mem?.trip_id ?? null))) return json({ error: 'Sem permissão.' }, 403);
        await db.from('invites').delete().eq('user_id', prof.id).is('claimed_at', null);
        const { data, error } = await db
          .from('invites')
          .insert({ trip_id: mem?.trip_id ?? null, display_name: prof.display_name, username: prof.username, role: mem?.role ?? 'member', user_id: prof.id, created_by: who!.id, expires_at: new Date(Date.now() + 7 * 864e5).toISOString() })
          .select('token, display_name, username, role')
          .single();
        if (error) throw error;
        return json(data);
      }

      case 'revoke': {
        const who = await caller(req);
        const { data: inv } = await db.from('invites').select('trip_id').eq('token', body.token).maybeSingle();
        if (!inv || !(await canManage(who, inv.trip_id))) return json({ error: 'Sem permissão.' }, 403);
        await db.from('invites').delete().eq('token', body.token);
        return json({ ok: true });
      }

      case 'remove': {
        const who = await caller(req);
        if (!(await canManage(who, body.trip_id)) || body.user_id === who?.id) return json({ error: 'Sem permissão.' }, 403);
        await db.from('trip_members').delete().eq('trip_id', body.trip_id).eq('user_id', body.user_id);
        await db.from('member_locations').delete().eq('trip_id', body.trip_id).eq('user_id', body.user_id);
        return json({ ok: true });
      }
    }
    return json({ error: 'Ação desconhecida.' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado.' }, 500);
  }
});
