'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { updatePasswordAction } from './actions'

const SUPABASE_URL = 'https://mdamossubweuqntwsblp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYW1vc3N1YndldXFudHdzYmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mjg0NTAsImV4cCI6MjA5NDUwNDQ1MH0.js_2G6--GTLQb72sLjuN2Ypu6nLwUEEGhPc5CVRofVc'

export default function AtualizarSenhaPage() {
  // Use implicit flow so Supabase sends tokens in hash — no PKCE verifier needed
  const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'implicit', detectSessionInUrl: true },
  })
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null

    async function initSession() {
      const query = new URLSearchParams(window.location.search)
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)

      const code = query.get('code')
      const tokenHash = query.get('token_hash')
      const type = query.get('type') || 'recovery'
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      console.log('[senha] URL params:', { code: !!code, tokenHash: !!tokenHash, type, hasHash: hash.length > 0, accessToken: !!accessToken })

      // Case 1: tokens in URL hash (implicit flow)
      if (accessToken && refreshToken) {
        const { error: e } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        console.log('[senha] setSession:', e?.message ?? 'ok')
        window.history.replaceState({}, '', window.location.pathname)
        if (!e) { setSessionReady(true); return }
      }

      // Case 2: OTP token_hash
      if (tokenHash) {
        const { error: e } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any })
        console.log('[senha] verifyOtp:', e?.message ?? 'ok')
        window.history.replaceState({}, '', window.location.pathname)
        if (!e) { setSessionReady(true); return }
      }

      // Case 3: PKCE code
      if (code) {
        const { error: e } = await supabase.auth.exchangeCodeForSession(code)
        console.log('[senha] exchangeCode:', e?.message ?? 'ok')
        window.history.replaceState({}, '', window.location.pathname)
        if (!e) { setSessionReady(true); return }
      }

      // Case 4: session already in cookies
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[senha] getSession:', !!session)
      if (session) { setSessionReady(true); return }

      // Case 5: wait for detectSessionInUrl to fire
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
        console.log('[senha] authChange:', event, !!sess)
        if (sess && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
          setSessionReady(true)
          subscription.unsubscribe()
        }
      })
      sub = subscription
    }

    initSession()
    return () => { sub?.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return }
    setError('')
    setLoading(true)
    const err = await updatePasswordAction(password)
    if (err) { setError(err); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '2rem', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(229,9,20,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '2.5rem', position: 'relative',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
      }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ width: '36px', height: '36px', background: 'var(--red)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'white' }}>OE</span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.05em' }}>Otaku Estóico</strong>
          </div>
          <span className="label">Nova senha</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)' }}>
            Criar nova senha
          </h1>
        </div>

        {done ? (
          <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
            <strong style={{ color: 'var(--green)', display: 'block', marginBottom: '0.4rem' }}>Senha criada!</strong>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Redirecionando para o login...</p>
          </div>
        ) : !sessionReady ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Verificando seu acesso...</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
              Se demorar, o link pode ter expirado.{' '}
              <a href="/recuperar-senha" style={{ color: 'var(--red)', textDecoration: 'none' }}>
                Solicitar novo link
              </a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label className="field">
              Nova senha
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password" />
            </label>
            <label className="field">
              Confirmar senha
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a nova senha" required autoComplete="new-password" />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
