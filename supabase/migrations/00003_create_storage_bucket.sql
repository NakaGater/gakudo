-- Create photos storage bucket (private)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false);

-- Storage policies: teachers can upload/delete
create policy "Teachers can upload photos" on storage.objects
  for insert with check (
    bucket_id = 'photos' and
    (select role from public.profiles where id = auth.uid()) = 'teacher'
  );

create policy "Teachers can delete photos" on storage.objects
  for delete using (
    bucket_id = 'photos' and
    (select role from public.profiles where id = auth.uid()) = 'teacher'
  );

-- Authenticated users can read photos
create policy "Authenticated users can read photos" on storage.objects
  for select using (
    bucket_id = 'photos' and
    auth.uid() is not null
  );
