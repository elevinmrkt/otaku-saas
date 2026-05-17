-- ════════════════════════════════════════════════
--  SETUP SEGURO — executa sem apagar dados
--  Cole no SQL Editor do Supabase e rode tudo
-- ════════════════════════════════════════════════

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABELAS ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.welcome_video_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_video_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  motivation TEXT,
  biggest_challenge TEXT,
  current_moment TEXT,
  expectations TEXT,
  mirror_character TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.anamnesis_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  current_routine TEXT,
  health_goals TEXT,
  main_obstacles TEXT,
  support_needed TEXT,
  additional_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trails (
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

CREATE TABLE IF NOT EXISTS public.trail_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_items (
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

CREATE TABLE IF NOT EXISTS public.trail_module_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_module_id UUID NOT NULL REFERENCES public.trail_modules(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_assets (
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

CREATE TABLE IF NOT EXISTS public.content_progress (
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

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'comentario' CHECK (comment_type IN ('reflexao', 'comentario', 'duvida')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'moderado', 'removido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.book_club_cycles (
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

CREATE TABLE IF NOT EXISTS public.challenges (
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

CREATE TABLE IF NOT EXISTS public.challenge_tasks (
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

CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
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

CREATE TABLE IF NOT EXISTS public.community_groups (
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

CREATE TABLE IF NOT EXISTS public.events (
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

CREATE TABLE IF NOT EXISTS public.gamification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  xp_amount INTEGER NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_xp_summary (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  rule_type TEXT DEFAULT 'manual' CHECK (rule_type IN ('manual', 'automatico')),
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
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

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_tags (
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_item_id, tag_id)
);

-- ── INDEXES ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_items_status ON public.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_trail ON public.content_items(trail_id);
CREATE INDEX IF NOT EXISTS idx_content_progress_user ON public.content_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_content_progress_content ON public.content_progress(content_item_id);
CREATE INDEX IF NOT EXISTS idx_gamification_user ON public.gamification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_content ON public.comments(content_item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ── RLS ──────────────────────────────────────────
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
ALTER TABLE public.trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_club_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ── POLICIES (seguras — pula se já existir) ───────
DO $$ BEGIN

  -- content_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='content_items' AND policyname='Anyone can read published content') THEN
    CREATE POLICY "Anyone can read published content" ON public.content_items FOR SELECT USING (status = 'publicado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='content_items' AND policyname='Admins can manage content') THEN
    CREATE POLICY "Admins can manage content" ON public.content_items FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor','mentor','suporte'))
    );
  END IF;

  -- content_progress
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='content_progress' AND policyname='Users manage own progress') THEN
    CREATE POLICY "Users manage own progress" ON public.content_progress FOR ALL USING (user_id = auth.uid());
  END IF;

  -- comments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Read active comments') THEN
    CREATE POLICY "Read active comments" ON public.comments FOR SELECT USING (status = 'ativo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Users write own comments') THEN
    CREATE POLICY "Users write own comments" ON public.comments FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='comments' AND policyname='Users update own comments') THEN
    CREATE POLICY "Users update own comments" ON public.comments FOR UPDATE USING (user_id = auth.uid());
  END IF;

  -- onboarding / anamnesis
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='onboarding_responses' AND policyname='Own onboarding') THEN
    CREATE POLICY "Own onboarding" ON public.onboarding_responses FOR ALL USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='anamnesis_responses' AND policyname='Own anamnesis') THEN
    CREATE POLICY "Own anamnesis" ON public.anamnesis_responses FOR ALL USING (user_id = auth.uid());
  END IF;

  -- xp / gamification
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_xp_summary' AND policyname='Own XP summary') THEN
    CREATE POLICY "Own XP summary" ON public.user_xp_summary FOR ALL USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gamification_events' AND policyname='Own gamification') THEN
    CREATE POLICY "Own gamification" ON public.gamification_events FOR ALL USING (user_id = auth.uid());
  END IF;

  -- badges
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_badges' AND policyname='Own badges') THEN
    CREATE POLICY "Own badges" ON public.user_badges FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- challenge progress
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_challenge_progress' AND policyname='Own challenge progress') THEN
    CREATE POLICY "Own challenge progress" ON public.user_challenge_progress FOR ALL USING (user_id = auth.uid());
  END IF;

  -- notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Own notifications') THEN
    CREATE POLICY "Own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Mark read') THEN
    CREATE POLICY "Mark read" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
  END IF;

  -- welcome_video_config
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='welcome_video_config' AND policyname='Anyone can read video config') THEN
    CREATE POLICY "Anyone can read video config" ON public.welcome_video_config FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='welcome_video_config' AND policyname='Admins can update video config') THEN
    CREATE POLICY "Admins can update video config" ON public.welcome_video_config FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;

  -- public read policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trails' AND policyname='Public read trails') THEN
    CREATE POLICY "Public read trails" ON public.trails FOR SELECT USING (status = 'publicado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trails' AND policyname='Admins full access trails') THEN
    CREATE POLICY "Admins full access trails" ON public.trails FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='book_club_cycles' AND policyname='Public read book club') THEN
    CREATE POLICY "Public read book club" ON public.book_club_cycles FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='book_club_cycles' AND policyname='Admins manage book club') THEN
    CREATE POLICY "Admins manage book club" ON public.book_club_cycles FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='challenges' AND policyname='Public read challenges') THEN
    CREATE POLICY "Public read challenges" ON public.challenges FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='challenges' AND policyname='Admins manage challenges') THEN
    CREATE POLICY "Admins manage challenges" ON public.challenges FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_groups' AND policyname='Public read groups') THEN
    CREATE POLICY "Public read groups" ON public.community_groups FOR SELECT USING (status = 'ativo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_groups' AND policyname='Admins manage groups') THEN
    CREATE POLICY "Admins manage groups" ON public.community_groups FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='Public read events') THEN
    CREATE POLICY "Public read events" ON public.events FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='Admins manage events') THEN
    CREATE POLICY "Admins manage events" ON public.events FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;

  -- media_assets (sem RLS, leitura pública)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='media_assets' AND policyname='Public read media') THEN
    CREATE POLICY "Public read media" ON public.media_assets FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='media_assets' AND policyname='Admins full access media_assets') THEN
    CREATE POLICY "Admins full access media_assets" ON public.media_assets FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor','mentor','suporte'))
    );
  END IF;

  -- admin write on challenge_tasks, badges, trail_modules, trail_module_contents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='challenge_tasks' AND policyname='Public read challenge tasks') THEN
    CREATE POLICY "Public read challenge tasks" ON public.challenge_tasks FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='challenge_tasks' AND policyname='Admins manage challenge tasks') THEN
    CREATE POLICY "Admins manage challenge tasks" ON public.challenge_tasks FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='badges' AND policyname='Public read badges') THEN
    CREATE POLICY "Public read badges" ON public.badges FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='badges' AND policyname='Admins manage badges') THEN
    CREATE POLICY "Admins manage badges" ON public.badges FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trail_modules' AND policyname='Public read trail modules') THEN
    CREATE POLICY "Public read trail modules" ON public.trail_modules FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trail_modules' AND policyname='Admins manage trail modules') THEN
    CREATE POLICY "Admins manage trail modules" ON public.trail_modules FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trail_module_contents' AND policyname='Public read trail contents') THEN
    CREATE POLICY "Public read trail contents" ON public.trail_module_contents FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trail_module_contents' AND policyname='Admins manage trail contents') THEN
    CREATE POLICY "Admins manage trail contents" ON public.trail_module_contents FOR ALL USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','editor'))
    );
  END IF;

  -- notifications insert para admins
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Admins send notifications') THEN
    CREATE POLICY "Admins send notifications" ON public.notifications FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','suporte'))
    );
  END IF;

END $$;

-- ── XP FUNCTION ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_user_xp(p_user_id UUID, p_xp INT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO user_xp_summary(user_id, total_xp, level, current_streak, last_activity_at, updated_at)
  VALUES(p_user_id, p_xp, 1, 0, NOW(), NOW())
  ON CONFLICT(user_id) DO UPDATE
  SET total_xp = user_xp_summary.total_xp + p_xp,
      last_activity_at = NOW(),
      updated_at = NOW();
END;
$$;

-- ── TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
