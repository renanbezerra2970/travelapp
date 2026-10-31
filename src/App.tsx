import { useEffect, useState, type CSSProperties } from 'react';
import { Compass, Home, CalendarDays, Users, LayoutGrid } from 'lucide-react';
import { useApp } from './state/AppContext';
import { cityTheme, currentCity } from './lib/trip';
import type { LatLng } from './lib/geo';
import { ToastHost } from './components/ui';
import AuthScreen from './screens/Auth';
import JoinTrip from './screens/JoinTrip';
import HomeScreen from './screens/Home';
import Itinerary from './screens/Itinerary';
import DayView from './screens/DayView';
import Explore from './screens/Explore';
import Group from './screens/Group';
import More from './screens/More';
import Story from './screens/Story';

export type Tab = 'home' | 'roteiro' | 'explorar' | 'grupo' | 'mais';
export type Nav = {
  go: (t: Tab) => void;
  openDay: (i: number) => void;
  explore: (focus?: { poi?: string; at?: LatLng }) => void;
  story: () => void;
};

const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Hoje', Icon: Home },
  { id: 'roteiro', label: 'Roteiro', Icon: CalendarDays },
  { id: 'explorar', label: 'Explorar', Icon: Compass },
  { id: 'grupo', label: 'Grupo', Icon: Users },
  { id: 'mais', label: 'Mais', Icon: LayoutGrid },
];

export default function App() {
  const { ready, session, tripId } = useApp();
  const [tab, setTab] = useState<Tab>(() => (location.hash.slice(1) as Tab) || 'home');
  const [day, setDay] = useState<number | null>(null);
  const [story, setStory] = useState(false);
  const [focus, setFocus] = useState<{ poi?: string; at?: LatLng } | undefined>();

  const theme = cityTheme(currentCity());
  useEffect(() => {
    history.replaceState(null, '', `#${tab}`);
    window.scrollTo(0, 0);
  }, [tab]);

  if (!ready) return <div className="center-fill"><div className="spinner" /></div>;
  if (!session) return <AuthScreen />;
  if (!tripId) return <JoinTrip />;

  const nav: Nav = {
    go: (t) => {
      setDay(null);
      setStory(false);
      setTab(t);
    },
    openDay: (i) => {
      setDay(i);
      window.scrollTo(0, 0);
    },
    explore: (f) => {
      setFocus(f);
      setDay(null);
      setStory(false);
      setTab('explorar');
    },
    story: () => {
      setDay(null);
      setStory(true);
      window.scrollTo(0, 0);
    },
  };

  return (
    <div className="app" style={{ '--city': theme.color, '--city-soft': theme.soft } as CSSProperties}>
      {story ? (
        <Story onBack={() => setStory(false)} />
      ) : day !== null ? (
        <DayView index={day} nav={nav} onBack={() => setDay(null)} />
      ) : tab === 'home' ? (
        <HomeScreen nav={nav} />
      ) : tab === 'roteiro' ? (
        <Itinerary nav={nav} />
      ) : tab === 'explorar' ? (
        <Explore nav={nav} focus={focus} clearFocus={() => setFocus(undefined)} />
      ) : tab === 'grupo' ? (
        <Group nav={nav} />
      ) : (
        <More nav={nav} />
      )}

      <nav className="nav">
        {TABS.map(({ id, label, Icon }) =>
          id === 'explorar' ? (
            <button key={id} className={`fab ${tab === id && day === null && !story ? 'on' : ''}`} onClick={() => nav.go(id)} aria-label={label}>
              <span className="fab-ball"><Icon size={28} strokeWidth={2.2} /></span>
              <span style={{ marginTop: 2 }}>{label}</span>
            </button>
          ) : (
            <button key={id} className={tab === id && day === null && !story ? 'on' : ''} onClick={() => nav.go(id)}>
              <Icon size={23} strokeWidth={1.9} />
              {label}
            </button>
          ),
        )}
      </nav>
      <ToastHost />
    </div>
  );
}
