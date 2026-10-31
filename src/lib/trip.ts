import raw from '../data/trip.json';

export type Stop = {
  t: string;
  type: 'hotel' | 'transit' | 'food' | 'photo' | 'walk' | 'fixed' | 'sunset' | 'boat' | 'flight' | string;
  name: string;
  desc: string;
  stay: number;
  walk: number;
  km: number;
  addr: string;
  cost: string;
  tip?: string;
  ll: [number, number] | null;
};

export type Turno = {
  id: string;
  date: string;
  dow: string;
  period: string;
  title: string;
  start: string;
  end: string;
  walkMin: number;
  km: number;
  cost: number;
  stops: Stop[];
};

export type City = { name: string; country: string; dates: string; sunset: string; transport: string; turnos: Turno[] };

export type DayEvent = { t: string; kind: string; text: string; sub?: string };
export type Day = { date: string; dow: string; city: string; title: string; turnos: string[]; events: DayEvent[]; alerts?: string[] };

export type Seg = { t: string; b?: number; h?: string };
export type Block =
  | { k: 'h3'; text: string }
  | { k: 'p' | 'alert' | 'li'; segs: Seg[] }
  | { k: 'table'; rows: { title: Seg[]; fields: { k: string; segs: Seg[] }[] }[] }
  | { k: string; [x: string]: any };

export type Trip = {
  info: { sunset: string; rules: string[] };
  cities: City[];
  days: Day[];
  flights: { date: string; route: string }[];
  stays: { city: string; dates: string; nights: string; name: string; addr: string }[];
  costs: { total: string; perPax: string; fx: string; items: [string, number, boolean][] };
  checklist: { group: string; items: [string, boolean][] }[];
  transport: { label: string; title: string; city: string | null; blocks: Block[] }[];
};

export const trip = raw as unknown as Trip;

export const CITY_THEME: Record<string, { color: string; soft: string; emoji: string; center: [number, number] }> = {
  Lisboa: { color: '#2F6DB5', soft: '#E3EDF8', emoji: '🚋', center: [38.7107, -9.1393] },
  Roma: { color: '#C4502A', soft: '#F8E6DE', emoji: '🏛️', center: [41.8986, 12.4769] },
  Veneza: { color: '#16867F', soft: '#DDF1EF', emoji: '🛶', center: [45.4371, 12.3326] },
  Paris: { color: '#7B4A9E', soft: '#EDE3F4', emoji: '🗼', center: [48.8584, 2.3376] },
};

export const cityTheme = (name: string) => CITY_THEME[name] ?? CITY_THEME.Roma;

export const STOP_META: Record<string, { label: string; emoji: string }> = {
  hotel: { label: 'Hotel', emoji: '🛏️' },
  transit: { label: 'Transporte', emoji: '🚇' },
  food: { label: 'Comer', emoji: '🍝' },
  photo: { label: 'Foto', emoji: '📸' },
  walk: { label: 'Caminhada', emoji: '🚶' },
  fixed: { label: 'Horário fixo', emoji: '🎟️' },
  sunset: { label: 'Pôr do sol', emoji: '🌅' },
  boat: { label: 'Barco', emoji: '⛴️' },
  flight: { label: 'Voo', emoji: '✈️' },
};

export const stopMeta = (t: string) => STOP_META[t] ?? { label: 'Parada', emoji: '📍' };

export const turnoById = new Map<string, { turno: Turno; city: City }>();
for (const c of trip.cities) for (const t of c.turnos) turnoById.set(t.id, { turno: t, city: c });

/** "31/10" → Date (ano da viagem) */
export function dayDate(ddmm: string): Date {
  const [d, m] = ddmm.split('/').map(Number);
  return new Date(2026, m - 1, d);
}

export function todayIndex(now = new Date()): number {
  const key = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const i = trip.days.findIndex((d) => d.date === key);
  if (i >= 0) return i;
  const first = dayDate(trip.days[0].date);
  return now < first ? -1 : trip.days.length; // antes ou depois da viagem
}

/** Cidade onde o grupo está (ou estará) agora */
export function currentCity(now = new Date()): string {
  const i = todayIndex(now);
  const d = trip.days[Math.min(Math.max(i, 0), trip.days.length - 1)];
  return d.city.split(' ')[0].replace('→', '').trim() || 'Roma';
}

/** Cidades onde o dia acontece, pelos turnos (ex.: 05/11 → "Veneza → Paris") */
export function dayCityLabel(d: Day): string {
  const cs = [...new Set(d.turnos.map((id) => turnoById.get(id)?.city.name).filter(Boolean))] as string[];
  return cs.length ? cs.join(' → ') : d.city.split('→')[0].trim().split(' ')[0];
}

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
