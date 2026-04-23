-- entranceロール追加（入口端末用）
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('parent', 'teacher', 'admin', 'entrance'));
