'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, Film, FileText, Headphones,
  Map, BookMarked, Flame, Users2, Calendar, Trophy, Bell, BarChart2, Tag, Settings
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} />, roles: ['admin', 'editor', 'mentor', 'suporte'] },
  { href: '/admin/membros', label: 'Membros', icon: <Users size={16} />, roles: ['admin', 'suporte'] },
  { href: '/admin/conteudos', label: 'Conteúdos', icon: <BookOpen size={16} />, roles: ['admin', 'editor'] },
  { href: '/admin/categorias', label: 'Categorias', icon: <Tag size={16} />, roles: ['admin', 'editor'] },
  { href: '/admin/trilhas', label: 'Trilhas', icon: <Map size={16} />, roles: ['admin', 'editor'] },
  { href: '/admin/clube', label: 'Clube da Leitura', icon: <BookMarked size={16} />, roles: ['admin', 'editor', 'mentor'] },
  { href: '/admin/desafio', label: 'Desafio Mensal', icon: <Flame size={16} />, roles: ['admin', 'editor', 'mentor'] },
  { href: '/admin/grupos', label: 'Grupos', icon: <Users2 size={16} />, roles: ['admin', 'editor'] },
  { href: '/admin/agenda', label: 'Agenda', icon: <Calendar size={16} />, roles: ['admin', 'editor', 'mentor'] },
  { href: '/admin/gamificacao', label: 'Gamificação', icon: <Trophy size={16} />, roles: ['admin'] },
  { href: '/admin/notificacoes', label: 'Notificações', icon: <Bell size={16} />, roles: ['admin', 'editor'] },
  { href: '/admin/metricas', label: 'Métricas', icon: <BarChart2 size={16} />, roles: ['admin'] },
  { href: '/admin/configuracoes', label: 'Configurações', icon: <Settings size={16} />, roles: ['admin'] },
]

export default function AdminSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))

  return (
    <aside
      style={{
        width: '220px', flexShrink: 0,
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        padding: '1.5rem 0.75rem',
        display: 'flex', flexDirection: 'column', gap: '0.25rem',
      }}
    >
      <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
        <span className="label">Painel Admin</span>
      </div>
      {visibleItems.map(item => {
        const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.6rem 0.75rem', borderRadius: '8px',
              fontSize: '0.85rem', fontWeight: 600,
              color: isActive ? 'var(--text)' : 'var(--muted)',
              background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 150ms',
              borderLeft: isActive ? '2px solid var(--red)' : '2px solid transparent',
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <span style={{ color: isActive ? 'var(--red)' : 'var(--muted)' }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </aside>
  )
}
