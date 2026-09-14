-- Editing task fields still uses the existing ownership RLS policies.
grant update (title, description, project, priority, "dueDate") on public.tasks to authenticated;
