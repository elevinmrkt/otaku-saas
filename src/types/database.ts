export type UserRole = 'membro' | 'admin' | 'editor' | 'mentor' | 'suporte'
export type UserStatus = 'ativo' | 'inativo' | 'bloqueado'
export type ContentType = 'video' | 'pdf' | 'audio' | 'podcast' | 'pagina' | 'gravacao'
export type ContentStatus = 'rascunho' | 'publicado' | 'arquivado'
export type GroupType = 'whatsapp' | 'telegram' | 'discord' | 'outro'
export type EventType = 'aula' | 'clube' | 'desafio' | 'live' | 'encontro' | 'publicacao'
export type NotificationType = 'conteudo' | 'desafio' | 'clube' | 'selo' | 'sistema'
export type BadgeRuleType = 'manual' | 'automatico'

// Standalone Row types — no circular references
type UsersRow = {
  id: string; name: string | null; nickname: string | null; email: string; phone: string | null
  avatar_url: string | null; avatar_char: string | null; role: UserRole; status: UserStatus
  created_at: string; updated_at: string; last_login_at: string | null
  onboarding_completed_at: string | null; welcome_video_completed_at: string | null
  anamnesis_completed_at: string | null; accepted_terms_at: string | null
}
type OnboardingRow = {
  id: string; user_id: string; name_answer: string | null; nickname_answer: string | null
  phone_answer: string | null; main_intent: string | null; selected_path: string | null
  favorite_work: string | null; mirror_character: string | null; completed_at: string | null
}
type AnamnesisRow = {
  id: string; user_id: string; main_goal: string | null; main_difficulty: string | null
  preferred_format: string | null; weekly_availability: string | null; initial_trail: string | null
  reference_work_or_character: string | null; extra_notes: string | null
  created_at: string; updated_at: string
}
type CategoryRow = { id: string; title: string; slug: string; description: string | null; created_at: string }
type TagRow = { id: string; title: string; slug: string; created_at: string }
type TrailRow = {
  id: string; title: string; slug: string; description: string | null; poster_url: string | null
  thumbnail_url: string | null; status: ContentStatus; order_index: number
  created_at: string; updated_at: string
}
type TrailModuleRow = {
  id: string; trail_id: string; title: string; description: string | null
  order_index: number; created_at: string; updated_at: string
}
type ContentItemRow = {
  id: string; title: string; slug: string; description: string | null; content_type: ContentType
  thumbnail_url: string | null; poster_url: string | null; category_id: string | null
  trail_id: string | null; status: ContentStatus; visibility: 'publico' | 'privado'
  is_featured: boolean; is_new: boolean; requires_reflection: boolean; xp_reward: number
  published_at: string | null; scheduled_at: string | null; created_by: string | null
  created_at: string; updated_at: string
}
type MediaAssetRow = {
  id: string; content_item_id: string; asset_type: 'video' | 'pdf' | 'audio' | 'image' | 'outro' | 'page_content'
  url: string | null; youtube_video_id: string | null; file_name: string | null
  file_size: number | null; duration_seconds: number | null; mime_type: string | null; created_at: string
}
type TrailModuleContentRow = {
  id: string; trail_module_id: string; content_item_id: string; order_index: number; created_at: string
}
type ContentProgressRow = {
  id: string; user_id: string; content_item_id: string
  status: 'nao_iniciado' | 'em_andamento' | 'concluido'; progress_percent: number
  watched_seconds: number | null; last_position_seconds: number | null
  started_at: string | null; completed_at: string | null; updated_at: string
}
type CommentRow = {
  id: string; user_id: string; content_item_id: string; body: string
  comment_type: 'reflexao' | 'comentario' | 'duvida'; status: 'ativo' | 'moderado' | 'removido'
  created_at: string; updated_at: string
}
type BookClubRow = {
  id: string; title: string; work_title: string; work_author: string | null
  mockup_url: string | null; cover_url: string | null; banner_url: string | null; summary: string | null
  headline: string | null; objective: string | null; theme: string | null
  total_pages: number | null; current_page: number | null
  start_date: string | null; end_date: string | null
  meeting_date: string | null; meeting_link: string | null
  meeting_description: string | null; meeting_recording_url: string | null
  whatsapp_group_url: string | null; status: 'ativo' | 'encerrado' | 'previsto'
  current_week: number | null; week_question: string | null
  xp_reward: number; badge_id: string | null
  created_at: string; updated_at: string
}
type ClubWeeklyGoalRow = {
  id: string; cycle_id: string; week_number: number
  title: string | null; page_start: number; page_end: number
  theme: string | null; description: string | null; guide_question: string | null
  created_at: string; updated_at: string
}
type ClubCycleMaterialRow = {
  id: string; cycle_id: string; title: string
  material_type: string; description: string | null; url: string | null
  thumbnail_url: string | null; visibility: string
  order_index: number; xp_reward: number; requires_reflection: boolean
  created_at: string
}
type UserClubProgressRow = {
  id: string; cycle_id: string; user_id: string
  current_page: number; status: 'lendo' | 'concluido' | 'pausado'
  joined_at: string; updated_at: string
}
type ChallengeRow = {
  id: string; title: string; slug: string; poster_url: string | null; headline: string | null
  description: string | null; objective: string | null; duration_days: number
  start_date: string | null; end_date: string | null; meeting_date: string | null
  meeting_link: string | null; whatsapp_group_url: string | null
  status: 'ativo' | 'encerrado' | 'previsto'; xp_reward: number; badge_id: string | null
  created_at: string; updated_at: string
}
type ChallengeTaskRow = {
  id: string; challenge_id: string; day_number: number; title: string
  description: string | null; reflection_prompt: string | null; xp_reward: number
  created_at: string; updated_at: string
}
type UserChallengeProgressRow = {
  id: string; user_id: string; challenge_id: string; task_id: string
  status: 'pendente' | 'concluido'; reflection: string | null
  completed_at: string | null; created_at: string; updated_at: string
}
type CommunityGroupRow = {
  id: string; title: string; description: string | null; group_type: GroupType
  poster_url: string | null; whatsapp_url: string | null; rules: string | null
  status: 'ativo' | 'inativo'; visibility: 'publico' | 'privado'; created_at: string; updated_at: string
}
type EventRow = {
  id: string; title: string; description: string | null; event_type: EventType
  start_datetime: string; end_datetime: string | null; meeting_url: string | null
  related_content_id: string | null; status: 'agendado' | 'ao_vivo' | 'encerrado' | 'cancelado'
  created_at: string; updated_at: string
}
type GamificationEventRow = {
  id: string; user_id: string; event_type: string; xp_amount: number
  reference_type: string | null; reference_id: string | null; created_at: string
}
type UserXpSummaryRow = {
  user_id: string; total_xp: number; level: number; current_streak: number
  last_activity_at: string | null; updated_at: string
}
type BadgeRow = {
  id: string; title: string; description: string | null; icon_url: string | null
  rule_type: BadgeRuleType; xp_reward: number; created_at: string; updated_at: string
}
type UserBadgeRow = { id: string; user_id: string; badge_id: string; earned_at: string }
type NotificationRow = {
  id: string; user_id: string | null; title: string; body: string
  notification_type: NotificationType; target_segment: string | null
  is_read: boolean; send_at: string | null; sent_at: string | null
  status: 'pendente' | 'enviada' | 'falhou'; created_at: string; updated_at: string
}
type AdminActivityLogRow = {
  id: string; admin_user_id: string; action: string; entity_type: string | null
  entity_id: string | null; metadata: Record<string, unknown> | null; created_at: string
}
type WelcomeVideoConfigRow = {
  id: string; youtube_video_id: string | null; title: string | null; description: string | null
  min_completion_percent: number; requires_comment: boolean; comment_min_length: number; updated_at: string
}

type OptionalNulls<T> =
  { [K in keyof T as null extends T[K] ? K : never]?: T[K] } &
  { [K in keyof T as null extends T[K] ? never : K]: T[K] }

type InsertOf<T extends Record<string, unknown>> = Omit<OptionalNulls<T>, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type Database = {
  public: {
    Tables: {
      users: { Row: UsersRow; Insert: InsertOf<UsersRow> & { email: string }; Update: Partial<UsersRow>; Relationships: [] }
      onboarding_responses: { Row: OnboardingRow; Insert: InsertOf<OnboardingRow> & { user_id: string }; Update: Partial<OnboardingRow>; Relationships: [] }
      anamnesis_responses: { Row: AnamnesisRow; Insert: InsertOf<AnamnesisRow> & { user_id: string }; Update: Partial<AnamnesisRow>; Relationships: [] }
      categories: { Row: CategoryRow; Insert: InsertOf<CategoryRow> & { title: string; slug: string }; Update: Partial<CategoryRow>; Relationships: [] }
      tags: { Row: TagRow; Insert: InsertOf<TagRow> & { title: string; slug: string }; Update: Partial<TagRow>; Relationships: [] }
      trails: { Row: TrailRow; Insert: InsertOf<TrailRow> & { title: string; slug: string }; Update: Partial<TrailRow>; Relationships: [] }
      trail_modules: { Row: TrailModuleRow; Insert: InsertOf<TrailModuleRow> & { trail_id: string; title: string }; Update: Partial<TrailModuleRow>; Relationships: [] }
      trail_module_contents: { Row: TrailModuleContentRow; Insert: InsertOf<TrailModuleContentRow> & { trail_module_id: string; content_item_id: string }; Update: Partial<TrailModuleContentRow>; Relationships: [] }
      content_items: { Row: ContentItemRow; Insert: InsertOf<ContentItemRow> & { title: string; slug: string }; Update: Partial<ContentItemRow>; Relationships: [] }
      media_assets: { Row: MediaAssetRow; Insert: InsertOf<MediaAssetRow> & { content_item_id: string }; Update: Partial<MediaAssetRow>; Relationships: [] }
      content_progress: { Row: ContentProgressRow; Insert: InsertOf<ContentProgressRow> & { user_id: string; content_item_id: string }; Update: Partial<ContentProgressRow>; Relationships: [] }
      comments: { Row: CommentRow; Insert: InsertOf<CommentRow> & { user_id: string; content_item_id: string; body: string }; Update: Partial<CommentRow>; Relationships: [] }
      book_club_cycles: { Row: BookClubRow; Insert: InsertOf<BookClubRow> & { title: string; work_title: string }; Update: Partial<BookClubRow>; Relationships: [] }
      club_weekly_goals: { Row: ClubWeeklyGoalRow; Insert: InsertOf<ClubWeeklyGoalRow> & { cycle_id: string; week_number: number }; Update: Partial<ClubWeeklyGoalRow>; Relationships: [] }
      club_cycle_materials: { Row: ClubCycleMaterialRow; Insert: InsertOf<ClubCycleMaterialRow> & { cycle_id: string; title: string }; Update: Partial<ClubCycleMaterialRow>; Relationships: [] }
      user_club_progress: { Row: UserClubProgressRow; Insert: InsertOf<UserClubProgressRow> & { cycle_id: string; user_id: string }; Update: Partial<UserClubProgressRow>; Relationships: [] }
      challenges: { Row: ChallengeRow; Insert: InsertOf<ChallengeRow> & { title: string; slug: string }; Update: Partial<ChallengeRow>; Relationships: [] }
      challenge_tasks: { Row: ChallengeTaskRow; Insert: InsertOf<ChallengeTaskRow> & { challenge_id: string; title: string }; Update: Partial<ChallengeTaskRow>; Relationships: [] }
      user_challenge_progress: { Row: UserChallengeProgressRow; Insert: InsertOf<UserChallengeProgressRow> & { user_id: string; challenge_id: string; task_id: string }; Update: Partial<UserChallengeProgressRow>; Relationships: [] }
      community_groups: { Row: CommunityGroupRow; Insert: InsertOf<CommunityGroupRow> & { title: string }; Update: Partial<CommunityGroupRow>; Relationships: [] }
      events: { Row: EventRow; Insert: InsertOf<EventRow> & { title: string; start_datetime: string }; Update: Partial<EventRow>; Relationships: [] }
      gamification_events: { Row: GamificationEventRow; Insert: InsertOf<GamificationEventRow> & { user_id: string; event_type: string; xp_amount: number }; Update: Partial<GamificationEventRow>; Relationships: [] }
      user_xp_summary: { Row: UserXpSummaryRow; Insert: InsertOf<UserXpSummaryRow> & { user_id: string }; Update: Partial<UserXpSummaryRow>; Relationships: [] }
      badges: { Row: BadgeRow; Insert: InsertOf<BadgeRow> & { title: string }; Update: Partial<BadgeRow>; Relationships: [] }
      user_badges: { Row: UserBadgeRow; Insert: InsertOf<UserBadgeRow> & { user_id: string; badge_id: string }; Update: Partial<UserBadgeRow>; Relationships: [] }
      notifications: { Row: NotificationRow; Insert: InsertOf<NotificationRow> & { title: string; body: string }; Update: Partial<NotificationRow>; Relationships: [] }
      admin_activity_log: { Row: AdminActivityLogRow; Insert: InsertOf<AdminActivityLogRow> & { admin_user_id: string; action: string }; Update: Partial<AdminActivityLogRow>; Relationships: [] }
      welcome_video_config: { Row: WelcomeVideoConfigRow; Insert: InsertOf<WelcomeVideoConfigRow>; Update: Partial<WelcomeVideoConfigRow>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type User = UsersRow
export type ContentItem = ContentItemRow
export type Trail = TrailRow
export type Challenge = ChallengeRow
export type BookClubCycle = BookClubRow
export type CommunityGroup = CommunityGroupRow
export type Event = EventRow
export type Badge = BadgeRow
export type ContentProgress = ContentProgressRow
export type UserXpSummary = UserXpSummaryRow
export type Comment = CommentRow
export type MediaAsset = MediaAssetRow
export type Notification = NotificationRow

export interface ContentItemWithAssets extends ContentItemRow {
  media_assets?: MediaAssetRow[]
  categories?: { title: string; slug: string } | null
  progress?: ContentProgressRow | null
}

export interface TrailWithProgress extends TrailRow {
  trail_modules?: Array<{
    id: string
    title: string
    order_index: number
    trail_module_contents?: Array<{
      content_item_id: string
      order_index: number
      content_items?: ContentItemWithAssets
    }>
  }>
  user_progress?: number
  total_contents?: number
  completed_contents?: number
}

export const XP_REWARDS = {
  watch_video: 20,
  complete_lesson: 30,
  read_pdf: 15,
  listen_audio: 15,
  send_reflection: 25,
  answer_question: 20,
  complete_daily_task: 10,
  complete_challenge: 100,
  participate_book_club: 80,
  book_club_reflection: 40,
  streak_3_days: 30,
  streak_7_days: 70,
} as const

export const LEVELS = [
  { level: 1, name: 'Recruta', min_xp: 0 },
  { level: 2, name: 'Aprendiz', min_xp: 100 },
  { level: 3, name: 'Prokopton', min_xp: 300 },
  { level: 4, name: 'Guardião', min_xp: 600 },
  { level: 5, name: 'Estrategista', min_xp: 1000 },
  { level: 6, name: 'Veterano', min_xp: 1500 },
  { level: 7, name: 'Mestre da Guilda', min_xp: 2500 },
] as const

export function getLevelFromXP(xp: number) {
  let current: typeof LEVELS[number] = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.min_xp) current = lvl
  }
  const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1
  const next = nextIdx < LEVELS.length ? LEVELS[nextIdx] : null
  return { current, next }
}
