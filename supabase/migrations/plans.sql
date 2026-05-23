-- Sistema de planos: Mensal e Protagonista
-- Execute no Supabase SQL Editor

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'nenhum'
  CHECK (plan IN ('nenhum', 'mensal', 'protagonista'));

ALTER TABLE public.trails
  ADD COLUMN IF NOT EXISTS required_plan TEXT NOT NULL DEFAULT 'mensal'
  CHECK (required_plan IN ('mensal', 'protagonista'));

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS required_plan TEXT NOT NULL DEFAULT 'mensal'
  CHECK (required_plan IN ('mensal', 'protagonista'));

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS required_plan TEXT NOT NULL DEFAULT 'mensal'
  CHECK (required_plan IN ('mensal', 'protagonista'));

ALTER TABLE public.book_club_cycles
  ADD COLUMN IF NOT EXISTS required_plan TEXT NOT NULL DEFAULT 'mensal'
  CHECK (required_plan IN ('mensal', 'protagonista'));
