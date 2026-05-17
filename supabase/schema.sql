-- ════════════════════════════════════════════════
--  OTAKU ESTOICO — SCHEMA COMPLETO
--  Execute este script no Supabase SQL Editor
-- ════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── RESET (apaga tudo antes de recriar) ─────────
DROP TABLE IF EXISTS public.admin_activity_log CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.gamification_events CASCADE;
DROP TABLE IF EXISTS public.user_xp_summary CASCADE;
DROP TABLE IF EXISTS public.user_challenge_progress CASCADE;
DROP TABLE IF EXISTS public.challenge_tasks CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.community_groups CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.content_progress CASCADE;
DROP TABLE IF EXISTS public.content_tags CASCADE;
DROP TABLE IF EXISTS public.media_assets CASCADE;
DROP TABLE IF EXISTS public.trail_module_contents CASCADE;
DROP TABLE IF EXISTS public.trail_modules CASCADE;
DROP TABLE IF EXISTS public.content_items CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.trails CASCADE;
DROP TABLE IF EXISTS public.anamnesis_responses CASCADE;
DROP TABLE IF EXISTS public.onboarding_responses CASCADE;
DROP TABLE IF EXISTS public.book_club_cycles CASCADE;
DROP TABLE IF EXISTS public.welcome_video_config CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ── USERS ──────────────────────────────────────
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  nickname TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  avatar_char TEXT DEFAULT 'R',
  role TEXT NOT NULL DEFAULT 'membro' CHECK (role IN ('membro', 'admin', 'editor', 'mentor', 'suporte')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  welcome_video_completed_at TIMESTAMPTZ,
  anamnesis_completed_at TIMESTAMPTZ,
  accepted_terms_at TIMESTAMPTZ
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── WELCOME VIDEO CONFIG ────────────────────────
CREATE TABLE public.welcome_video_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_video_id TEXT,
  title TEXT,
  description TEXT,
  min_completion_percent INTEGER DEFAULT 80,
  requires_comment BOOLEAN DEFAULT TRUE,
  comment_min_length INTEGER DEFAULT 20,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.welcome_video_config (requires_comment, comment_min_length) VALUES (TRUE, 20);

-- ── ONBOARDING RESPONSES ───────────────────────
CREATE TABLE public.onboarding_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  name_answer TEXT,
  nickname_answer TEXT,
  phone_answer TEXT,
  main_intent TEXT,
  selected_path TEXT,
  favorite_work TEXT,
  mirror_character TEXT,
  completed_at TIMESTAMPTZ
);

-- ── ANAMNESIS RESPONSES ────────────────────────
CREATE TABLE public.anamnesis_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  main_goal TEXT,
  main_difficulty TEXT,
  preferred_format TEXT,
  weekly_availability TEXT,
  initial_trail TEXT,
  reference_work_or_character TEXT,
  extra_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CATEGORIES ─────────────────────────────────
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TAGS ───────────────────────────────────────
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRAILS ─────────────────────────────────────
CREATE TABLE public.trails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  poster_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRAIL MODULES ──────────────────────────────
CREATE TABLE public.trail_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTENT ITEMS ──────────────────────────────
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'audio', 'podcast', 'pagina', 'gravacao')),
  thumbnail_url TEXT,
  poster_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  trail_id UUID REFERENCES public.trails(id),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  visibility TEXT NOT NULL DEFAULT 'publico' CHECK (visibility IN ('publico', 'privado')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT TRUE,
  requires_reflection BOOLEAN DEFAULT FALSE,
  xp_reward INTEGER DEFAULT 20,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRAIL MODULE CONTENTS ──────────────────────
CREATE TABLE public.trail_module_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_module_id UUID NOT NULL REFERENCES public.trail_modules(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MEDIA ASSETS ───────────────────────────────
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('video', 'pdf', 'audio', 'image', 'outro', 'page_content')),
  url TEXT,
  youtube_video_id TEXT,
  file_name TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTENT PROGRESS ──────────────────────────
CREATE TABLE public.content_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido')),
  progress_percent INTEGER DEFAULT 0,
  watched_seconds INTEGER,
  last_position_seconds INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, content_item_id)
);

-- ── COMMENTS ──────────────────────────────────
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'comentario' CHECK (comment_type IN ('reflexao', 'comentario', 'duvida')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'moderado', 'removido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOOK CLUB CYCLES ──────────────────────────
CREATE TABLE public.book_club_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  work_title TEXT NOT NULL,
  work_author TEXT,
  mockup_url TEXT,
  cover_url TEXT,
  summary TEXT,
  theme TEXT,
  total_pages INTEGER,
  current_page INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  meeting_date TIMESTAMPTZ,
  meeting_link TEXT,
  whatsapp_group_url TEXT,
  status TEXT NOT NULL DEFAULT 'previsto' CHECK (status IN ('ativo', 'encerrado', 'previsto')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHALLENGES ────────────────────────────────
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  poster_url TEXT,
  headline TEXT,
  description TEXT,
  objective TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  meeting_date TIMESTAMPTZ,
  meeting_link TEXT,
  whatsapp_group_url TEXT,
  status TEXT NOT NULL DEFAULT 'previsto' CHECK (status IN ('ativo', 'encerrado', 'previsto')),
  xp_reward INTEGER DEFAULT 100,
  badge_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHALLENGE TASKS ───────────────────────────
CREATE TABLE public.challenge_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reflection_prompt TEXT,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER CHALLENGE PROGRESS ───────────────────
CREATE TABLE public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.challenge_tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  reflection TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, task_id)
);

-- ── COMMUNITY GROUPS ──────────────────────────
CREATE TABLE public.community_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  group_type TEXT NOT NULL DEFAULT 'whatsapp' CHECK (group_type IN ('whatsapp', 'telegram', 'discord', 'outro')),
  poster_url TEXT,
  whatsapp_url TEXT,
  rules TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  visibility TEXT NOT NULL DEFAULT 'publico' CHECK (visibility IN ('publico', 'privado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── EVENTS ────────────────────────────────────
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('aula', 'clube', 'desafio', 'live', 'encontro', 'publicacao')),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  meeting_url TEXT,
  related_content_id UUID REFERENCES public.content_items(id),
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'ao_vivo', 'encerrado', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── GAMIFICATION EVENTS ───────────────────────
CREATE TABLE public.gamification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  xp_amount INTEGER NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER XP SUMMARY ───────────────────────────
CREATE TABLE public.user_xp_summary (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BADGES ────────────────────────────────────
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  rule_type TEXT DEFAULT 'manual' CHECK (rule_type IN ('manual', 'automatico')),
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER BADGES ───────────────────────────────
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- ── NOTIFICATIONS ─────────────────────────────
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT DEFAULT 'sistema' CHECK (notification_type IN ('conteudo', 'desafio', 'clube', 'selo', 'sistema')),
  target_segment TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviada', 'falhou')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ADMIN ACTIVITY LOG ────────────────────────
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTENT TAGS ──────────────────────────────
CREATE TABLE public.content_tags (
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_item_id, tag_id)
);

-- ════════════════════════════════════════════════
--  INDEXES
-- ════════════════════════════════════════════════
CREATE INDEX idx_content_items_status ON public.content_items(status);
CREATE INDEX idx_content_items_trail ON public.content_items(trail_id);
CREATE INDEX idx_content_progress_user ON public.content_progress(user_id);
CREATE INDEX idx_content_progress_content ON public.content_progress(content_item_id);
CREATE INDEX idx_gamification_user ON public.gamification_events(user_id);
CREATE INDEX idx_comments_content ON public.comments(content_item_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- ════════════════════════════════════════════════
--  RLS POLICIES
-- ════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welcome_video_config ENABLE ROW LEVEL SECURITY;

-- Users: read own row, admin reads all
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor', 'mentor', 'suporte'))
);
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'suporte'))
);

-- Content: everyone can read published
CREATE POLICY "Anyone can read published content" ON public.content_items FOR SELECT USING (status = 'publicado');
CREATE POLICY "Admins can manage content" ON public.content_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Content progress: own rows only
CREATE POLICY "Users manage own progress" ON public.content_progress FOR ALL USING (user_id = auth.uid());

-- Comments: read active, write own
CREATE POLICY "Read active comments" ON public.comments FOR SELECT USING (status = 'ativo');
CREATE POLICY "Users write own comments" ON public.comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own comments" ON public.comments FOR UPDATE USING (user_id = auth.uid());

-- Onboarding/anamnesis: own data
CREATE POLICY "Own onboarding" ON public.onboarding_responses FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Own anamnesis" ON public.anamnesis_responses FOR ALL USING (user_id = auth.uid());

-- XP: own data
CREATE POLICY "Own XP summary" ON public.user_xp_summary FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Own gamification" ON public.gamification_events FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Own badges" ON public.user_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Own challenge progress" ON public.user_challenge_progress FOR ALL USING (user_id = auth.uid());

-- Notifications: own
CREATE POLICY "Own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Mark read" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Welcome video: everyone can read
CREATE POLICY "Anyone can read video config" ON public.welcome_video_config FOR SELECT USING (TRUE);
CREATE POLICY "Admins can update video config" ON public.welcome_video_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Public tables (no RLS needed for read)
CREATE POLICY "Public read trails" ON public.trails FOR SELECT USING (status = 'publicado');
CREATE POLICY "Public read book club" ON public.book_club_cycles FOR SELECT USING (TRUE);
CREATE POLICY "Public read challenges" ON public.challenges FOR SELECT USING (TRUE);
CREATE POLICY "Public read groups" ON public.community_groups FOR SELECT USING (status = 'ativo');
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (TRUE);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read trail modules" ON public.trail_modules FOR SELECT USING (TRUE);
CREATE POLICY "Public read trail contents" ON public.trail_module_contents FOR SELECT USING (TRUE);
CREATE POLICY "Public read media" ON public.media_assets FOR SELECT USING (TRUE);
CREATE POLICY "Public read badges" ON public.badges FOR SELECT USING (TRUE);
CREATE POLICY "Public read challenge tasks" ON public.challenge_tasks FOR SELECT USING (TRUE);

-- Enable RLS on public tables
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_module_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_tasks ENABLE ROW LEVEL SECURITY;

-- Admin full access to management tables
CREATE POLICY "Admins full access trails" ON public.trails FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Admins full access book_club" ON public.book_club_cycles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor', 'mentor'))
);
CREATE POLICY "Admins full access challenges" ON public.challenges FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor', 'mentor'))
);
CREATE POLICY "Admins full access groups" ON public.community_groups FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Admins full access events" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor', 'mentor'))
);
CREATE POLICY "Admins full access categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Admins full access trail_modules" ON public.trail_modules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Admins full access trail_module_contents" ON public.trail_module_contents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Admins full access media_assets" ON public.media_assets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Admins full access challenge_tasks" ON public.challenge_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor', 'mentor'))
);
CREATE POLICY "Admins full access badges" ON public.badges FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins read all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor', 'mentor', 'suporte'))
);
CREATE POLICY "Admins read all trails" ON public.trails FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Admins read all content" ON public.content_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Admins read all xp_summary" ON public.user_xp_summary FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin'))
);

-- ════════════════════════════════════════════════
--  RPC: incrementar XP do usuario
-- ════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.increment_user_xp(p_user_id UUID, p_xp INT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_xp_summary (user_id, total_xp, level, current_streak, updated_at)
  VALUES (p_user_id, p_xp, 1, 0, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp = user_xp_summary.total_xp + EXCLUDED.total_xp,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════
--  SEED: conquistas iniciais
-- ════════════════════════════════════════════════
INSERT INTO public.badges (title, description, rule_type) VALUES
  ('Primeiro Acesso', 'Completou o onboarding de entrada na Guilda.', 'automatico'),
  ('Primeira Aula', 'Concluiu seu primeiro conteúdo na plataforma.', 'automatico'),
  ('Primeira Reflexão', 'Enviou sua primeira reflexão.', 'automatico'),
  ('Primeiro PDF', 'Leu seu primeiro PDF na biblioteca.', 'automatico'),
  ('Primeiro Clube', 'Participou do primeiro Clube da Leitura.', 'automatico'),
  ('Primeiro Desafio', 'Completou o primeiro Desafio Mensal.', 'automatico'),
  ('Constância Semanal', 'Acessou a plataforma por 7 dias diferentes em um mês.', 'automatico'),
  ('Leitor do Círculo', 'Leu 5 obras no Clube da Leitura.', 'automatico'),
  ('Missão Cumprida', 'Concluiu todas as missões de um desafio.', 'automatico'),
  ('Voz da Ágora', 'Enviou 10 reflexões na comunidade.', 'automatico'),
  ('Protagonista do Mês', 'Destacado pelo time como protagonista do mês.', 'manual');
