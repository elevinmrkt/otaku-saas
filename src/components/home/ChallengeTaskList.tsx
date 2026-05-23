'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Task {
  id: string
  day_number: number
  title: string
  description: string | null
  reflection_prompt: string | null
  xp_reward: number
}

interface Progress {
  task_id: string
  status: string
  reflection: string | null
}

interface Props {
  challengeId: string
  tasks: Task[]
  userProgress: Progress[]
  currentDay: number
}

export default function ChallengeTaskList({ challengeId, tasks, userProgress, currentDay }: Props) {
  const supabase = createClient()
  const [progresses, setProgresses] = useState<Record<string, string>>(
    Object.fromEntries(userProgress.map(p => [p.task_id, p.status]))
  )
  const [reflections, setReflections] = useState<Record<string, string>>(
    Object.fromEntries(userProgress.map(p => [p.task_id, p.reflection ?? '']))
  )
  const [loading, setLoading] = useState<string | null>(null)

  const todayTasks = tasks.filter(t => t.day_number === currentDay)
  const allTasks = tasks.filter(t => t.day_number <= currentDay)

  async function completeTask(task: Task) {
    setLoading(task.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date().toISOString()
    await supabase.from('user_challenge_progress').upsert({
      user_id: user.id,
      challenge_id: challengeId,
      task_id: task.id,
      status: 'concluido',
      reflection: reflections[task.id] ?? null,
      completed_at: now,
      created_at: now,
      updated_at: now,
    }, { onConflict: 'user_id,task_id' })

    if (task.xp_reward > 0) {
      await supabase.from('gamification_events').insert({
        user_id: user.id,
        event_type: 'complete_challenge_task',
        xp_amount: task.xp_reward,
        reference_type: 'challenge_task',
        reference_id: task.id,
      })
      const { error: rpcErr } = await (supabase as any).rpc('increment_user_xp', { p_user_id: user.id, p_xp: task.xp_reward })
      if (rpcErr) {
        const { data: existing } = await supabase.from('user_xp_summary').select('total_xp').eq('user_id', user.id).single()
        await supabase.from('user_xp_summary').upsert({
          user_id: user.id,
          total_xp: (existing?.total_xp ?? 0) + task.xp_reward,
          level: 1,
          current_streak: 0,
          last_activity_at: now,
          updated_at: now,
        }, { onConflict: 'user_id' })
      }
    }

    setProgresses(p => ({ ...p, [task.id]: 'concluido' }))
    setLoading(null)
  }

  if (todayTasks.length === 0) {
    return <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Nenhuma missão definida para hoje.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {todayTasks.map(task => {
        const done = progresses[task.id] === 'concluido'
        return (
          <div
            key={task.id}
            className={`mission-item${done ? ' is-done' : ''}`}
          >
            <div className="mission-num">{String(task.day_number).padStart(2, '0')}</div>
            <div className="mission-body" style={{ flex: 1 }}>
              <strong>{task.title}</strong>
              {task.description && <p>{task.description}</p>}
              {!done && task.reflection_prompt && (
                <textarea
                  placeholder={task.reflection_prompt}
                  value={reflections[task.id] ?? ''}
                  onChange={e => setReflections(r => ({ ...r, [task.id]: e.target.value }))}
                  style={{
                    marginTop: '0.5rem', width: '100%', background: 'var(--card-2)',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    color: 'var(--text)', padding: '0.5rem 0.75rem',
                    fontSize: '0.82rem', resize: 'vertical', minHeight: '60px', outline: 'none',
                  }}
                />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
              <span className="xp-badge">+{task.xp_reward} XP</span>
              {!done ? (
                <button
                  className="btn-primary sm"
                  onClick={() => completeTask(task)}
                  disabled={loading === task.id}
                  style={{ fontSize: '0.7rem' }}
                >
                  {loading === task.id ? '...' : '✓ Feito'}
                </button>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>✓ Concluído</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
