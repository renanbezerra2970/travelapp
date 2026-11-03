import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, type MemberLocation, type PrivateData, type Profile } from '../lib/supabase';
import { distance, type LatLng } from '../lib/geo';
import { faceUrls } from '../lib/faces';
import { BackgroundGeolocation, isNative } from '../lib/native';

export const DEMO = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');

export type CheckinKind = 'seen' | 'learned';
export type Checkin = { user_id: string; poi_id: string; kind: CheckinKind; created_at: string };
type PosSource = 'gps' | 'sim' | null;

type Ctx = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  tripId: string | null;
  tripName: string;
  role: 'owner' | 'member' | null;
  isAdmin: boolean;
  canManage: boolean;
  privateData: PrivateData;
  members: Profile[];
  /** URL assinada da foto do rosto, por usuário */
  faces: Record<string, string>;
  locations: Record<string, MemberLocation>;
  checkins: Checkin[];
  myPos: LatLng | null;
  myAccuracy: number | null;
  posSource: PosSource;
  gpsError: string | null;
  sharing: boolean;
  setSharing: (v: boolean) => void;
  startGps: () => void;
  simulate: (p: LatLng | null) => void;
  capture: (poiId: string, kind?: CheckinKind, xp?: number) => Promise<void>;
  updateProfile: (p: Partial<Profile>) => Promise<void>;
  refreshTrip: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

const LS = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
    } catch {
      /* armazenamento indisponível */
    }
  },
};

const DEMO_ME: Profile = { id: 'demo-me', display_name: 'Você', avatar: '😎', color: '#E4572E', is_admin: false, username: 'voce' };
const DEMO_FRIENDS: (Profile & { lat: number; lng: number; mins: number })[] = [
  { id: 'demo-1', display_name: 'Lucyana', avatar: '🌻', color: '#8B4FD8', lat: 41.90247, lng: 12.4561, mins: 1 },
  { id: 'demo-2', display_name: 'Cesar', avatar: '🦁', color: '#2C7BE5', lat: 41.9031, lng: 12.4549, mins: 4 },
  { id: 'demo-3', display_name: 'David', avatar: '🎸', color: '#2E9E6A', lat: 41.9012, lng: 12.4642, mins: 12 },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripName, setTripName] = useState('Eurotrip 2026');
  const [role, setRole] = useState<'owner' | 'member' | null>(null);
  const [privateData, setPrivateData] = useState<PrivateData>({});
  const [members, setMembers] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Record<string, MemberLocation>>({});
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  const [gpsPos, setGpsPos] = useState<{ p: LatLng; acc: number; heading: number | null } | null>(null);
  const [simPos, setSimPos] = useState<LatLng | null>(() => {
    const s = LS.get('simPos');
    return s ? JSON.parse(s) : null;
  });
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [sharing, setSharingState] = useState(() => LS.get('sharing') !== 'off');
  const watchId = useRef<number | null>(null);

  const userId = session?.user.id ?? null;

  // ── Sessão ──
  useEffect(() => {
    if (DEMO) {
      setSession({ user: { id: DEMO_ME.id } } as Session);
      setProfile(DEMO_ME);
      setTripId('demo');
      setRole('owner');
      const now = Date.now();
      setMembers([DEMO_ME, ...DEMO_FRIENDS]);
      setLocations(
        Object.fromEntries(
          DEMO_FRIENDS.map((f) => [
            f.id,
            { trip_id: 'demo', user_id: f.id, lat: f.lat, lng: f.lng, accuracy: 15, heading: null, is_simulated: false, updated_at: new Date(now - f.mins * 60000).toISOString() },
          ]),
        ),
      );
      setCheckins([
        { user_id: 'demo-1', poi_id: 'roma-obelisco-vaticano', kind: 'seen', created_at: new Date().toISOString() },
        { user_id: 'demo-1', poi_id: 'roma-pieta', kind: 'learned', created_at: new Date().toISOString() },
        { user_id: 'demo-2', poi_id: 'roma-coliseu', kind: 'seen', created_at: new Date().toISOString() },
        { user_id: 'demo-2', poi_id: 'roma-coliseu', kind: 'learned', created_at: new Date().toISOString() },
        { user_id: 'demo-3', poi_id: 'roma-castel-sant-angelo', kind: 'seen', created_at: new Date().toISOString() },
      ]);
      if (!LS.get('simPos')) setSimPos({ lat: 41.90215, lng: 12.4572 });
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setTripId(null);
        setRole(null);
        setReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Perfil + viagem ──
  const refreshTrip = useCallback(async () => {
    if (DEMO || !userId) return;
    const [{ data: prof }, { data: mem }] = await Promise.all([
      supabase.from('profiles').select('id,display_name,avatar,avatar_path,color,is_admin,username').eq('id', userId).maybeSingle(),
      supabase.from('trip_members').select('trip_id,role').eq('user_id', userId).limit(1),
    ]);
    setProfile(prof ?? null);
    let tid = mem?.[0]?.trip_id ?? null;
    setRole((mem?.[0]?.role as 'owner' | 'member') ?? null);
    // admin master: acompanha uma viagem sem ser viajante
    if (!tid && prof?.is_admin) {
      const { data: trips } = await supabase.from('trips').select('id').order('created_at');
      const saved = LS.get('adminTrip');
      tid = trips?.find((t) => t.id === saved)?.id ?? trips?.[0]?.id ?? null;
    }
    setTripId(tid);
    if (tid) {
      const [{ data: t }, { data: ms }, { data: locs }, { data: cks }] = await Promise.all([
        supabase.from('trips').select('name,private_data').eq('id', tid).single(),
        supabase.from('trip_members').select('user_id').eq('trip_id', tid),
        supabase.from('member_locations').select('*').eq('trip_id', tid),
        supabase.from('poi_checkins').select('user_id,poi_id,kind,created_at').eq('trip_id', tid),
      ]);
      if (t) {
        setTripName(t.name);
        setPrivateData(t.private_data ?? {});
      }
      const ids = (ms ?? []).map((m) => m.user_id);
      const { data: profs } = ids.length
        ? await supabase.from('profiles').select('id,display_name,avatar,avatar_path,color,is_admin,username').in('id', ids)
        : { data: [] as Profile[] };
      setMembers(profs ?? []);
      setLocations(Object.fromEntries((locs ?? []).map((l: MemberLocation) => [l.user_id, l])));
      setCheckins(cks ?? []);
    }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    if (userId) refreshTrip();
  }, [userId, refreshTrip]);

  // fotos de rosto: recarrega o perfil quando alguém troca a própria foto
  useEffect(() => {
    const h = () => refreshTrip();
    window.addEventListener('profile-updated', h);
    return () => window.removeEventListener('profile-updated', h);
  }, [refreshTrip]);

  const [faces, setFaces] = useState<Record<string, string>>({});
  // modo demo: rostos de teste injetados via evento (não há upload sem conta)
  useEffect(() => {
    if (!DEMO) return;
    const h = (e: Event) => {
      const { id, url } = (e as CustomEvent<{ id: string; url: string }>).detail;
      setFaces((f) => ({ ...f, [id]: url }));
      if (id === DEMO_ME.id) setProfile((p) => (p ? { ...p, avatar_path: 'demo' } : p));
    };
    window.addEventListener('demo-face', h);
    return () => window.removeEventListener('demo-face', h);
  }, []);
  useEffect(() => {
    const people = [...members, ...(profile ? [profile] : [])].filter((p) => p.avatar_path);
    if (DEMO || !people.length) return;
    faceUrls(people.map((p) => p.avatar_path!)).then((u) => setFaces(Object.fromEntries(people.map((p) => [p.id, u[p.avatar_path!]]))));
  }, [members, profile]);

  // ── Tempo real: localizações, capturas e novos membros ──
  useEffect(() => {
    if (DEMO || !tripId) return;
    const ch = supabase
      .channel(`trip-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_locations', filter: `trip_id=eq.${tripId}` }, (p) => {
        if (p.eventType === 'DELETE') {
          const old = p.old as MemberLocation;
          setLocations((s) => {
            const n = { ...s };
            delete n[old.user_id];
            return n;
          });
        } else {
          const l = p.new as MemberLocation;
          setLocations((s) => ({ ...s, [l.user_id]: l }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poi_checkins', filter: `trip_id=eq.${tripId}` }, (p) => {
        const c = p.new as Checkin;
        setCheckins((s) => (s.some((x) => x.user_id === c.user_id && x.poi_id === c.poi_id && x.kind === c.kind) ? s : [...s, c]));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` }, () => refreshTrip())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [tripId, refreshTrip]);

  // ── GPS ──
  // App Android: GPS nativo que continua em segundo plano (com notificação fixa) enquanto o compartilhamento estiver ligado
  const nativeWatch = useRef<string | null>(null);
  const sharingRef = useRef(sharing);
  sharingRef.current = sharing;
  const startNative = useCallback(async () => {
    if (nativeWatch.current) return;
    nativeWatch.current = 'starting';
    try {
      const bg = sharingRef.current;
      nativeWatch.current = await BackgroundGeolocation.addWatcher(
        {
          ...(bg ? { backgroundTitle: 'Eurotrip · compartilhando localização', backgroundMessage: 'O grupo vê onde você está. Desligue em Grupo › Compartilhar.' } : {}),
          requestPermissions: true,
          stale: false,
          distanceFilter: 15,
        },
        (loc, err) => {
          if (err) {
            setGpsError(err.code === 'NOT_AUTHORIZED' ? 'Permissão de localização negada. Toque em "Usar GPS" e permita em Configurações › Localização.' : 'Não foi possível obter sua localização.');
            if (err.code === 'NOT_AUTHORIZED' && confirm('O app precisa da sua localização para o mapa e o grupo. Abrir as configurações?')) BackgroundGeolocation.openSettings();
            return;
          }
          if (!loc) return;
          setGpsError(null);
          setGpsPos({ p: { lat: loc.latitude, lng: loc.longitude }, acc: loc.accuracy, heading: loc.bearing ?? null });
        },
      );
      LS.set('gpsOn', '1');
    } catch {
      nativeWatch.current = null;
      setGpsError('Não foi possível ligar o GPS.');
    }
  }, []);

  // ligar/desligar o compartilhamento troca o modo (com ou sem segundo plano)
  useEffect(() => {
    if (!isNative || !nativeWatch.current || nativeWatch.current === 'starting') return;
    const id = nativeWatch.current;
    nativeWatch.current = null;
    BackgroundGeolocation.removeWatcher({ id }).then(() => startNative());
  }, [sharing, startNative]);

  const startGps = useCallback(() => {
    if (isNative) {
      startNative();
      return;
    }
    if (watchId.current !== null || !('geolocation' in navigator)) {
      if (!('geolocation' in navigator)) setGpsError('Este aparelho não oferece localização.');
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null);
        setGpsPos({ p: { lat: pos.coords.latitude, lng: pos.coords.longitude }, acc: pos.coords.accuracy, heading: pos.coords.heading });
      },
      (err) => setGpsError(err.code === err.PERMISSION_DENIED ? 'Permissão de localização negada. Ative nas configurações do navegador.' : 'Não foi possível obter sua localização.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, []);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    if (nativeWatch.current && nativeWatch.current !== 'starting') BackgroundGeolocation.removeWatcher({ id: nativeWatch.current });
  }, []);

  // Se já houver permissão, liga o GPS sem perguntar
  useEffect(() => {
    if (isNative) {
      if (LS.get('gpsOn')) startGps();
      return;
    }
    navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then((r) => r.state === 'granted' && startGps()).catch(() => {});
  }, [startGps]);

  const simulate = useCallback((p: LatLng | null) => {
    setSimPos(p);
    LS.set('simPos', p ? JSON.stringify(p) : null);
  }, []);

  const myPos = simPos ?? gpsPos?.p ?? null;
  const posSource: PosSource = simPos ? 'sim' : gpsPos ? 'gps' : null;

  // ── Envio da minha posição (com limite de frequência) ──
  const lastSent = useRef<{ p: LatLng; t: number } | null>(null);
  const [heartbeat, setHeartbeat] = useState(0);
  useEffect(() => {
    if (DEMO || !tripId || !userId || !sharing || !myPos || !role) return;
    const last = lastSent.current;
    const now = Date.now();
    if (last && now - last.t < 15000 && distance(last.p, myPos) < 25) return;
    lastSent.current = { p: myPos, t: now };
    supabase
      .from('member_locations')
      .upsert({
        trip_id: tripId,
        user_id: userId,
        lat: myPos.lat,
        lng: myPos.lng,
        accuracy: posSource === 'gps' ? gpsPos?.acc ?? null : null,
        heading: posSource === 'gps' ? gpsPos?.heading ?? null : null,
        is_simulated: posSource === 'sim',
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => error && console.warn('location upsert', error.message));
  }, [myPos, sharing, tripId, userId, posSource, gpsPos, heartbeat, role]);

  // Mesmo parado, renova a posição a cada 60 s para o grupo saber que você está online
  useEffect(() => {
    if (DEMO || !sharing) return;
    const id = setInterval(() => {
      if (lastSent.current) lastSent.current.t = 0;
      setHeartbeat((n) => n + 1);
    }, 60000);
    return () => clearInterval(id);
  }, [sharing]);

  const setSharing = useCallback(
    (v: boolean) => {
      setSharingState(v);
      LS.set('sharing', v ? 'on' : 'off');
      if (!v && !DEMO && tripId && userId) {
        supabase.from('member_locations').delete().eq('trip_id', tripId).eq('user_id', userId).then(() => {});
        lastSent.current = null;
      }
    },
    [tripId, userId],
  );

  const capture = useCallback(
    async (poiId: string, kind: CheckinKind = 'seen', xp = 0) => {
      if (!userId || !tripId) return;
      const c: Checkin = { user_id: userId, poi_id: poiId, kind, created_at: new Date().toISOString() };
      setCheckins((s) => (s.some((x) => x.user_id === userId && x.poi_id === poiId && x.kind === kind) ? s : [...s, c]));
      if (!DEMO) await supabase.from('poi_checkins').upsert({ trip_id: tripId, user_id: userId, poi_id: poiId, kind, xp });
    },
    [userId, tripId],
  );

  const updateProfile = useCallback(
    async (p: Partial<Profile>) => {
      if (!userId) return;
      setProfile((s) => (s ? { ...s, ...p } : s));
      setMembers((ms) => ms.map((m) => (m.id === userId ? { ...m, ...p } : m)));
      if (!DEMO) await supabase.from('profiles').update(p).eq('id', userId);
    },
    [userId],
  );

  const signOut = useCallback(async () => {
    if (DEMO) return;
    if (tripId && userId) await supabase.from('member_locations').delete().eq('trip_id', tripId).eq('user_id', userId);
    await supabase.auth.signOut();
  }, [tripId, userId]);

  const value = useMemo<Ctx>(
    () => ({
      ready, session, profile, tripId, tripName, privateData, members, faces, locations, checkins,
      myPos, myAccuracy: posSource === 'gps' ? gpsPos?.acc ?? null : null, posSource, gpsError,
      sharing, setSharing, startGps, simulate, capture, updateProfile, refreshTrip, signOut,
      role, isAdmin: !!profile?.is_admin, canManage: role === 'owner' || !!profile?.is_admin,
    }),
    [ready, session, profile, tripId, tripName, role, privateData, members, faces, locations, checkins, myPos, posSource, gpsPos, gpsError, sharing, setSharing, startGps, simulate, capture, updateProfile, refreshTrip, signOut],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const storage = LS;
