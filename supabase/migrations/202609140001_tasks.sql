begin;
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  description text check (length(description) <= 5000),
  project text not null check (project in ('Личное', 'Студия', 'Маркетинг', 'Дизайн')),
  priority text not null check (priority in ('Высокий', 'Обычный')),
  status text not null default 'open' check (status in ('open', 'done')),
  "dueDate" timestamptz,
  "createdAt" timestamptz not null default now()
);
create index tasks_user_created on public.tasks(user_id, "createdAt" desc);
alter table public.tasks enable row level security;
revoke all on public.tasks from anon, authenticated;
grant select, delete on public.tasks to authenticated;
grant insert (id, title, description, project, priority, "dueDate") on public.tasks to authenticated;
grant update (status) on public.tasks to authenticated;
create policy own_select on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);
commit;
