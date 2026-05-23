'use client'

import { useState } from 'react'
import { CheckCircle, BookOpen, Target } from 'lucide-react'
import { joinClubAction, updateMyPageAction, markConcludedAction } from '@/app/(protected)/clube-da-leitura/actions'

interface Props {
  cycleId: string
  totalPages: number | null
  myProgress: { current_page: number; status: string } | null
  hasJoined: boolean
  isConcluded: boolean
  xpReward: number
  compact?: boolean
}

export default function ProgressWidget({ cycleId, totalPages, myProgress, hasJoined, isConcluded, xpReward, compact = false }: Props) {
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(String(myProgress?.current_page ?? 0))
  const [done, setDone] = useState(false)

  async function handleJoin() {
    setLoading(true)
    await joinClubAction(cycleId)
    setDone(true)
    setLoading(false)
  }

  async function handleUpdatePage() {
    const p = Math.max(0, Math.min(Number(page), totalPages ?? 999999))
    setLoading(true)
    await updateMyPageAction(cycleId, p)
    setLoading(false)
  }

  async function handleConclude() {
    if (!window.confirm('Marcar a obra como concluída? Você receberá o XP de recompensa.')) return
    setLoading(true)
    await markConcludedAction(cycleId)
    setLoading(false)
  }

  if (!hasJoined || done) {
    if (compact) {
      return (
        <button
          onClick={handleJoin}
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Target size={14} />
          {loading ? 'Entrando...' : done ? 'Participando!' : 'Participar do ciclo'}
        </button>
      )
    }
    return (
      <div style={{ background: 'rgba(200,144,26,0.05)', border: '1px solid rgba(200,144,26,0.2)', borderRadius: 'var(--r)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
        <BookOpen size={28} color="var(--gold)" />
        <div>
          <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Registre sua participação</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            Acompanhe seu progresso e ganhe {xpReward} XP ao concluir.
          </span>
        </div>
        <button
          onClick={handleJoin}
          disabled={loading}
          className="btn-primary"
        >
          <Target size={14} />
          {loading ? 'Entrando...' : done ? 'Participando!' : 'Participar deste ciclo'}
        </button>
      </div>
    )
  }

  if (isConcluded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
        <CheckCircle size={20} color="var(--green)" />
        <div>
          <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--green)' }}>Leitura concluída!</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>+{xpReward} XP conquistados neste ciclo.</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
      <span className="label" style={{ marginBottom: '1rem', display: 'block' }}>Atualizar meu progresso</span>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <input
          type="number"
          min={0}
          max={totalPages ?? undefined}
          value={page}
          onChange={e => setPage(e.target.value)}
          style={{ width: '90px', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-2)', color: 'var(--text)', fontSize: '0.9rem' }}
          placeholder="Página"
        />
        {totalPages && (
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>de {totalPages}</span>
        )}
        <button
          onClick={handleUpdatePage}
          disabled={loading}
          className="btn-primary"
          style={{ marginLeft: 'auto' }}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
      {totalPages && Number(page) >= totalPages && (
        <button
          onClick={handleConclude}
          disabled={loading}
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', color: 'var(--green)', borderColor: 'rgba(74,222,128,0.3)' }}
        >
          <CheckCircle size={14} />
          Marcar obra como concluída (+{xpReward} XP)
        </button>
      )}
    </div>
  )
}
