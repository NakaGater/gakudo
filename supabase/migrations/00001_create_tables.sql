-- profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null check (role in ('teacher', 'parent')),
  created_at timestamptz not null default now()
);

-- students
create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_name text,
  qr_token text not null unique default gen_random_uuid()::text,
  created_at timestamptz not null default now()
);
create index idx_students_qr_token on public.students(qr_token);

-- parent_students (many-to-many)
create table public.parent_students (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (parent_id, student_id)
);

-- attendance_records
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id),
  date date not null,
  check_in_at timestamptz not null,
  check_out_at timestamptz,
  unique (student_id, date)
);
create index idx_attendance_student_date on public.attendance_records(student_id, date);

-- announcements
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_announcements_created_at on public.announcements(created_at desc);

-- photos
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  thumbnail_path text not null,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_photos_created_at on public.photos(created_at desc);

-- public_notices (HP用お知らせ)
create table public.public_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published_at timestamptz not null default now(),
  author_id uuid not null references public.profiles(id)
);
create index idx_public_notices_published_at on public.public_notices(published_at desc);
