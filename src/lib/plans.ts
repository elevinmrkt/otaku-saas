export type UserPlan = 'nenhum' | 'mensal' | 'protagonista'
export type RequiredPlan = 'mensal' | 'protagonista'

export const PLAN_LABELS: Record<string, string> = {
  nenhum: 'Sem plano',
  mensal: 'Mensal',
  protagonista: 'Protagonista',
}

export const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  nenhum:      { bg: 'var(--card-2)',           color: 'var(--muted)' },
  mensal:      { bg: 'rgba(200,144,26,0.12)',   color: 'var(--gold)' },
  protagonista:{ bg: 'rgba(229,9,20,0.10)',     color: 'var(--red)' },
}

export function canAccess(userPlan: UserPlan, requiredPlan: RequiredPlan): boolean {
  if (userPlan === 'protagonista') return true
  if (userPlan === 'mensal' && requiredPlan === 'mensal') return true
  return false
}
