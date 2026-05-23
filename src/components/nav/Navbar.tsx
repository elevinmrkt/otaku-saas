'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, UserXpSummary } from '@/types/database'
import { getLevelFromXP } from '@/types/database'
import { Bell, Search, LogOut, User as UserIcon, ChevronDown, Settings, Menu, X } from 'lucide-react'

interface NavbarProps {
  profile: User | null
  xpSummary: UserXpSummary | null
  unreadCount: number
}

export default function Navbar({ profile, xpSummary, unreadCount }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [scrolled, setScrolled] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')

  const displayName = profile?.nickname || profile?.name || 'Recruta'
  const avatarChar = profile?.avatar_char || displayName.charAt(0).toUpperCase()
  const isAdmin = ['admin', 'editor', 'mentor', 'suporte'].includes(profile?.role ?? '')
  const levelInfo = getLevelFromXP(xpSummary?.total_xp ?? 0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/home', label: 'Início' },
    { href: '/trilhas', label: 'Trilhas' },
    { href: '/clube-da-leitura', label: 'Clube' },
    { href: '/desafio-mensal', label: 'Desafio' },
    { href: '/agenda', label: 'Agenda' },
    { href: '/comunidade', label: 'Comunidade' },
  ]

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: '68px',
        background: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 250ms ease',
        display: 'flex', alignItems: 'center',
        padding: '0 var(--pad)',
        gap: '2rem',
      }}
    >
      {/* Brand */}
      <Link
        href="/home"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          textDecoration: 'none', flexShrink: 0,
        }}
      >
        <span
          style={{
            width: '32px', height: '32px',
            background: 'var(--red)',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: '0.95rem', color: 'white',
            boxShadow: '0 2px 8px var(--red-glow)',
            flexShrink: 0,
          }}
        >OE</span>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.05em', color: 'var(--text)' }}>
          Otaku Estóico
        </strong>
      </Link>

      {/* Nav links — desktop only */}
      <div className="nav-links-desktop" style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.85rem', fontWeight: 600,
              color: pathname.startsWith(link.href) ? 'var(--text)' : 'var(--muted)',
              borderRadius: '6px',
              background: pathname.startsWith(link.href) ? 'rgba(255,255,255,0.07)' : 'transparent',
              transition: 'all 150ms',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: 'auto' }}>
        {/* Hamburger — mobile only */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          style={{
            display: 'none', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--muted)', padding: '0.4rem', borderRadius: '6px',
          }}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Search */}
        <div style={{ position: 'relative' }} className="nav-search-btn">
          <button
            onClick={() => setSearchOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', padding: '0.4rem',
              borderRadius: '6px', display: 'flex',
              transition: 'color 150ms',
            }}
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>
          {searchOpen && (
            <div
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: '320px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '0.75rem',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                zIndex: 200,
              }}
            >
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar aulas, trilhas, temas..."
                style={{
                  width: '100%', background: 'var(--card-2)',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  color: 'var(--text)', padding: '0.6rem 0.9rem',
                  fontSize: '0.9rem', outline: 'none',
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setSearchOpen(false); setQuery('') }
                  if (e.key === 'Enter' && query.trim()) {
                    router.push(`/trilhas?q=${encodeURIComponent(query)}`)
                    setSearchOpen(false); setQuery('')
                  }
                }}
              />
              {query.length >= 2 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.5rem', padding: '0 0.25rem' }}>
                  Pressione Enter para buscar
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <Link
          href="/notificacoes"
          style={{
            position: 'relative',
            color: 'var(--muted)', padding: '0.4rem',
            borderRadius: '6px', display: 'flex',
            transition: 'color 150ms',
          }}
          aria-label="Notificações"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute', top: '2px', right: '2px',
                width: '8px', height: '8px',
                background: 'var(--red)', borderRadius: '50%',
                border: '2px solid var(--bg)',
              }}
            />
          )}
        </Link>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'none', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.3rem 0.6rem 0.3rem 0.3rem',
              cursor: 'pointer', color: 'var(--text)', transition: 'border-color 150ms',
            }}
          >
            <div
              style={{
                width: '28px', height: '28px',
                background: 'var(--red)', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                color: 'white', fontWeight: 700,
              }}
            >
              {avatarChar}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{displayName}</span>
            <ChevronDown size={12} color="var(--muted)" />
          </button>

          {profileOpen && (
            <div
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: '240px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                zIndex: 200,
              }}
            >
              {/* Profile header */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px', height: '40px',
                      background: 'var(--red)', borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'white',
                    }}
                  >{avatarChar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{displayName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {levelInfo.current.name} · {xpSummary?.total_xp ?? 0} XP
                    </div>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div style={{ padding: '0.5rem' }}>
                <Link
                  href="/perfil"
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 0.75rem', borderRadius: '8px',
                    fontSize: '0.88rem', color: 'var(--text)',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <UserIcon size={15} color="var(--muted)" />
                  Meu perfil
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setProfileOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.6rem 0.75rem', borderRadius: '8px',
                      fontSize: '0.88rem', color: 'var(--gold)',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Settings size={15} />
                    Painel Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                    fontSize: '0.88rem', color: '#ff6b6b',
                    background: 'none', border: 'none', cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,107,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.6)' }}
          />
          <div
            style={{
              position: 'fixed', top: '68px', left: 0, right: 0, zIndex: 999,
              background: 'var(--card)', borderBottom: '1px solid var(--border)',
              padding: '1rem var(--pad)',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
            }}
          >
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '0.75rem 1rem', borderRadius: '8px',
                  fontSize: '0.95rem', fontWeight: 600,
                  color: pathname.startsWith(link.href) ? 'var(--text)' : 'var(--muted)',
                  background: pathname.startsWith(link.href) ? 'rgba(255,255,255,0.07)' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: pathname.startsWith(link.href) ? '3px solid var(--red)' : '3px solid transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.75rem' }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
                  fontSize: '0.88rem', color: '#ff6b6b',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
