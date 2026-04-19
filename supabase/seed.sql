-- Seed data for development
-- After running `supabase start`, create the initial admin teacher account:
-- 1. Go to http://localhost:54323 (Supabase Studio)
-- 2. Or use the SQL below after auth schema is set up (see migration 00001)

-- ============================================================
-- Initial Admin Teacher Account (Template)
-- ============================================================
-- Supabase auth.users cannot be seeded directly via SQL insert
-- in a portable way. Use one of these approaches:
--
-- Option A: Supabase Dashboard
--   1. Open http://localhost:54323/auth/users
--   2. Click "Add user" -> "Create new user"
--   3. Email: admin@gakudo.local
--   4. Password: admin123456
--   5. Auto-confirm: ON
--   6. Then insert the profile below using the user's UUID
--
-- Option B: Supabase CLI (after `supabase start`)
--   Run in psql or Supabase SQL editor:
--
--   -- Create auth user (replace UUID as needed)
--   INSERT INTO auth.users (
--     id, instance_id, email, encrypted_password,
--     email_confirmed_at, created_at, updated_at,
--     raw_app_meta_data, raw_user_meta_data, aud, role
--   ) VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     '00000000-0000-0000-0000-000000000000',
--     'admin@gakudo.local',
--     crypt('admin123456', gen_salt('bf')),
--     now(), now(), now(),
--     '{"provider":"email","providers":["email"]}',
--     '{"name":"管理者"}',
--     'authenticated',
--     'authenticated'
--   );
--
--   -- Create profile for admin
--   INSERT INTO public.profiles (id, email, name, role)
--   VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     'admin@gakudo.local',
--     '管理者',
--     'teacher'
--   );
--
-- Option C: Application signup flow
--   Use the app's signup form or Supabase client:
--   supabase.auth.signUp({ email: 'admin@gakudo.local', password: 'admin123456' })
--   Then update the profile role to 'teacher' in the database.
--
-- IMPORTANT: Change the password immediately after first login!
-- ============================================================

-- Sample students (for development)
INSERT INTO public.students (id, name, class_name, qr_token)
VALUES
  ('11111111-1111-1111-1111-111111111101', '田中 太郎', '1年A組', 'qr_tanaka_taro'),
  ('11111111-1111-1111-1111-111111111102', '鈴木 花子', '1年B組', 'qr_suzuki_hanako'),
  ('11111111-1111-1111-1111-111111111103', '佐藤 一郎', '2年A組', 'qr_sato_ichiro')
ON CONFLICT DO NOTHING;

-- Sample public notices (for development)
-- Note: author_id references profiles.id; use the admin UUID from above
-- INSERT INTO public.public_notices (title, body, author_id)
-- VALUES
--   ('2026年度の入会申し込みを開始しました', '詳細はお問い合わせください。', '00000000-0000-0000-0000-000000000001'),
--   ('春休み期間中の開所時間について', '春休み中は 8:00〜18:00 の開所となります。', '00000000-0000-0000-0000-000000000001');
