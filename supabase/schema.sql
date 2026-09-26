-- Konstrukta · base de datos en Supabase (cuentas, partidas en la nube y ranking).
-- Se ejecuta una vez en el SQL Editor del proyecto (ver docs/CUENTAS.md).
-- Seguridad: cada jugador solo lee y escribe lo suyo; el ranking es público para
-- leer, pero solo el servidor (api/challenge.ts, con la clave de servicio) escribe
-- marcas, y solo después de volver a jugar el desafío para comprobarlas.

-- ---------- Perfiles: el «nombre de Capataz» ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null unique check (char_length(name) between 3 and 20 and name ~ '^[[:alnum:] _.-]+$'),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "perfiles visibles para todos" on public.profiles for select using (true);
create policy "cada uno crea su perfil" on public.profiles for insert with check (auth.uid() = id);
create policy "cada uno edita su perfil" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- Partidas en la nube ----------
create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data text not null check (octet_length(data) < 5000000),
  tick bigint not null default 0,
  lumen double precision not null default 0,
  layer int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
create policy "cada uno lee su partida" on public.saves for select using (auth.uid() = user_id);
create policy "cada uno guarda su partida" on public.saves for insert with check (auth.uid() = user_id);
create policy "cada uno actualiza su partida" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cada uno borra su partida" on public.saves for delete using (auth.uid() = user_id);

-- ---------- Ranking del Desafío Diario (una marca por jugador y día: la mejor) ----------
create table if not exists public.challenge_scores (
  day text not null check (day ~ '^\d{4}-\d{2}-\d{2}$'),
  user_id uuid not null references public.profiles (id) on delete cascade,
  ticks int not null check (ticks > 0),
  blocks int not null check (blocks >= 0),
  entry jsonb not null,
  created_at timestamptz not null default now(),
  primary key (day, user_id)
);
create index if not exists challenge_scores_rank on public.challenge_scores (day, ticks, blocks);
alter table public.challenge_scores enable row level security;
-- Solo lectura para todos: sin políticas de escritura, únicamente la clave de servicio puede escribir
create policy "ranking visible para todos" on public.challenge_scores for select using (true);
-- Los programas enviados no se enseñan: se ve la marca, no la solución
revoke select on public.challenge_scores from anon, authenticated;
grant select (day, user_id, ticks, blocks, created_at) on public.challenge_scores to anon, authenticated;
