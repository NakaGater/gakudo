-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.parent_students enable row level security;
alter table public.attendance_records enable row level security;
alter table public.announcements enable row level security;
alter table public.photos enable row level security;
alter table public.public_notices enable row level security;

-- Helper function to get user role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- profiles policies
create policy "Users can read own profile" on public.profiles
  for select using (id = auth.uid());
create policy "Teachers can read all profiles" on public.profiles
  for select using (public.get_user_role() = 'teacher');
create policy "Teachers can insert profiles" on public.profiles
  for insert with check (public.get_user_role() = 'teacher');
create policy "Teachers can update profiles" on public.profiles
  for update using (public.get_user_role() = 'teacher');

-- students policies
create policy "Teachers can do everything with students" on public.students
  for all using (public.get_user_role() = 'teacher');
create policy "Parents can read students linked to them" on public.students
  for select using (
    id in (select student_id from public.parent_students where parent_id = auth.uid())
  );

-- parent_students policies
create policy "Teachers can manage parent_students" on public.parent_students
  for all using (public.get_user_role() = 'teacher');
create policy "Parents can read own links" on public.parent_students
  for select using (parent_id = auth.uid());

-- attendance_records policies
create policy "Teachers can do everything with attendance" on public.attendance_records
  for all using (public.get_user_role() = 'teacher');
create policy "Parents can read own children attendance" on public.attendance_records
  for select using (
    student_id in (select student_id from public.parent_students where parent_id = auth.uid())
  );

-- announcements policies
create policy "Teachers can manage announcements" on public.announcements
  for all using (public.get_user_role() = 'teacher');
create policy "Authenticated users can read announcements" on public.announcements
  for select using (auth.uid() is not null);

-- photos policies
create policy "Teachers can manage photos" on public.photos
  for all using (public.get_user_role() = 'teacher');
create policy "Authenticated users can read photos" on public.photos
  for select using (auth.uid() is not null);

-- public_notices policies (readable by everyone, manageable by teachers)
create policy "Anyone can read public notices" on public.public_notices
  for select using (true);
create policy "Teachers can manage public notices" on public.public_notices
  for all using (public.get_user_role() = 'teacher');
