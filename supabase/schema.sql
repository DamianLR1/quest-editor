-- Corré esto una sola vez en Supabase: Dashboard -> SQL Editor -> New query -> pegar y RUN

create table if not exists questforge_project (
  id int primary key default 1,
  data jsonb not null default '{"quests":[],"actions":[],"conditions":[],"npcs":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into questforge_project (id, data)
values (1, '{"quests":[],"actions":[],"conditions":[],"npcs":[]}'::jsonb)
on conflict (id) do nothing;

-- RLS: como pediste "cualquiera con el link edita libremente", habilitamos
-- lectura y escritura pública sin login. Ojo: esto significa que cualquiera
-- que abra tu sitio de GitHub Pages puede leer y modificar el proyecto entero.
alter table questforge_project enable row level security;

create policy "public read" on questforge_project
  for select using (true);

create policy "public update" on questforge_project
  for update using (true) with check (true);

-- Habilitar Realtime para esta tabla (para que los cambios de un usuario
-- aparezcan en vivo en las pestañas de los demás sin refrescar)
alter publication supabase_realtime add table questforge_project;
