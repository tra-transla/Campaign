-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

-- Thêm tài khoản mặc định (bỏ qua nếu đã tồn tại username)
INSERT INTO users (username, password, role) VALUES 
('icetea', '2026SonLa', 'Quản trị'),
('operator', 'operator123', 'Điều hành')
ON CONFLICT (username) DO NOTHING;

-- Tạo bảng teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Thêm các team mặc định
INSERT INTO teams (name) VALUES 
('Cá Kiếm'), 
('Minato'), 
('Team đấu giá'), 
('Team vá lốp')
ON CONFLICT (name) DO NOTHING;

-- Tạo bảng registrations
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team TEXT NOT NULL,
  in_game_name TEXT NOT NULL,
  tanks TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Thiết lập Row Level Security (RLS) để cho phép API truy cập
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
