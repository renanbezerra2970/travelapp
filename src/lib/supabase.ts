import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_KEY as string,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

export type Profile = {
  id: string;
  display_name: string;
  avatar: string;
  color: string;
  is_admin?: boolean;
  username?: string | null;
};

export type MemberLocation = {
  trip_id: string;
  user_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  is_simulated: boolean;
  updated_at: string;
};

export type Doc = { label: string; url: string };

export type PrivateData = {
  flights?: { date: string; route: string; info: string; docs?: Doc[] }[];
  stays?: { city: string; dates: string; nights: string; name: string; addr: string; info: string; phone?: string; tel?: string; docs?: Doc[] }[];
  docGroups?: { group: string; items: Doc[] }[];
  dayDocs?: Record<string, Doc[]>;
};
