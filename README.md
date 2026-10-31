# Eurotrip 2026

App da viagem Lisboa → Roma → Veneza → Paris (29/10 – 10/11/2026), baseado no roteiro original do grupo.

- **Hoje / Roteiro**: dia a dia, turnos, paradas com dicas, mapa do turno.
- **Explorar**: mapa 3D (Mapbox Standard) estilo Pokémon Go. Ao redor de você aparecem monumentos, igrejas, museus, obras de arte, parques e vistas, curiosidades e restaurantes. Afastando o mapa, as concentrações viram círculos com contagem. Cada item tem história; marque **Vi** (precisa estar perto) e **Aprendi** (leu a história) para somar XP.
- **Grupo**: localização ao vivo dos viajantes, ranking da viagem e, para o líder, criação de viajantes e convites.
- **Login sem e-mail**: o líder cria o viajante e envia um link pessoal; no primeiro acesso a pessoa cria a senha. Depois entra com nome + senha.

## Stack
Vite + React + TypeScript · Mapbox GL v3 · Supabase (Auth, Postgres com RLS, Realtime, Edge Function `invites`).

## Rodar
```bash
cp .env.example .env   # URL/chave publicável do Supabase e token público do Mapbox
npm install
npm run dev            # http://localhost:5173  (?demo = dados fictícios, só em dev)
```

## Dados
- `src/data/trip.json` — roteiro público. Códigos de reserva, PINs e links do Drive ficam só no Supabase (`trips.private_data`, visível apenas a membros).
- `src/data/pois.ts` (curados) · `obras.ts` (obras de arte) · `restaurants.ts` (100 restaurantes) · `pois-wiki.json` (gerado por `node scripts/build-pois.mjs`).
- `supabase/migrations` — schema e políticas. `supabase/functions/invites` — convites/contas.
