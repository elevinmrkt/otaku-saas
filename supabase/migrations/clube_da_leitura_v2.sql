-- =====================================================
-- Clube da Leitura v2 — rodar no Supabase SQL Editor
-- =====================================================

-- 1. Novas colunas em book_club_cycles
ALTER TABLE book_club_cycles
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS week_question TEXT,
  ADD COLUMN IF NOT EXISTS meeting_recording_url TEXT,
  ADD COLUMN IF NOT EXISTS meeting_description TEXT,
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS badge_id UUID REFERENCES badges(id);

-- 2. Metas semanais de leitura
CREATE TABLE IF NOT EXISTS club_weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES book_club_cycles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT,
  page_start INTEGER NOT NULL DEFAULT 0,
  page_end INTEGER NOT NULL DEFAULT 0,
  theme TEXT,
  description TEXT,
  guide_question TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Materiais do ciclo
CREATE TABLE IF NOT EXISTS club_cycle_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES book_club_cycles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type TEXT NOT NULL DEFAULT 'pdf',
  description TEXT,
  url TEXT,
  thumbnail_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'membros',
  order_index INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requires_reflection BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Progresso individual do membro
CREATE TABLE IF NOT EXISTS user_club_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES book_club_cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_page INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'lendo',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cycle_id, user_id)
);

-- 5. RLS
ALTER TABLE club_weekly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users read weekly goals" ON club_weekly_goals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admins write weekly goals" ON club_weekly_goals FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','editor','mentor'))
);

ALTER TABLE club_cycle_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users read materials" ON club_cycle_materials FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admins write materials" ON club_cycle_materials FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','editor','mentor'))
);

ALTER TABLE user_club_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own club progress" ON user_club_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users write own club progress" ON user_club_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own club progress" ON user_club_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admins read all club progress" ON user_club_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','editor'))
);
