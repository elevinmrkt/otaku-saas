'use client'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import type { ContentType, ContentStatus } from '@/types/database'

type Category = { id: string; title: string }
type Trail = { id: string; title: string }

type Filters = {
  q: string
  tipo: string
  categoria: string
  trilha: string
  status: string
  ordenar: string
}

const TIPOS: { value: ContentType | ''; label: string }[] = [
  { value: '', label: 'Todos os tipos' },
  { value: 'video', label: 'Vídeo' },
  { value: 'pdf', label: 'PDF' },
  { value: 'audio', label: 'Áudio' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'pagina', label: 'Página' },
  { value: 'gravacao', label: 'Gravação' },
]

const STATUS_OPTS: { value: ContentStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'arquivado', label: 'Arquivado' },
]

const ORDENAR_OPTS = [
  { value: 'criado', label: 'Criado em (recente)' },
  { value: 'publicado', label: 'Publicado em (recente)' },
  { value: 'titulo', label: 'Título (A–Z)' },
]

export function ContentFilters({
  categories,
  trails,
  current,
}: {
  categories: Category[]
  trails: Trail[]
  current: Filters
}) {
  const router = useRouter()
  const hasFilters = !!(current.q || current.tipo || current.categoria || current.trilha || current.status || (current.ordenar && current.ordenar !== 'criado'))

  function submit(form: HTMLFormElement) {
    const params = new URLSearchParams()
    const data = new FormData(form)
    data.forEach((value, key) => {
      if (value && value.toString().trim() !== '' && !(key === 'ordenar' && value === 'criado')) {
        params.set(key, value.toString())
      }
    })
    const qs = params.toString()
    router.push(`/admin/conteudos${qs ? `?${qs}` : ''}`)
  }

  const selectStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    padding: '0.4rem 0.7rem',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r)',
    color: 'var(--text)',
    cursor: 'pointer',
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); submit(e.currentTarget) }}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}
    >
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
        <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
        <input
          name="q"
          defaultValue={current.q}
          placeholder="Buscar por título ou descrição..."
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(e.currentTarget.form!) } }}
          onBlur={e => submit(e.currentTarget.form!)}
          style={{ ...selectStyle, width: '100%', paddingLeft: '2rem', boxSizing: 'border-box' }}
        />
      </div>

      {/* Tipo */}
      <select
        name="tipo"
        defaultValue={current.tipo}
        onChange={e => submit(e.currentTarget.form!)}
        style={selectStyle}
      >
        {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {/* Categoria */}
      <select
        name="categoria"
        defaultValue={current.categoria}
        onChange={e => submit(e.currentTarget.form!)}
        style={selectStyle}
      >
        <option value="">Todas as categorias</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>

      {/* Trilha */}
      <select
        name="trilha"
        defaultValue={current.trilha}
        onChange={e => submit(e.currentTarget.form!)}
        style={selectStyle}
      >
        <option value="">Todas as trilhas</option>
        {trails.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
      </select>

      {/* Status */}
      <select
        name="status"
        defaultValue={current.status}
        onChange={e => submit(e.currentTarget.form!)}
        style={selectStyle}
      >
        {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {/* Ordenar */}
      <select
        name="ordenar"
        defaultValue={current.ordenar || 'criado'}
        onChange={e => submit(e.currentTarget.form!)}
        style={selectStyle}
      >
        {ORDENAR_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Limpar filtros */}
      {hasFilters && (
        <a
          href="/admin/conteudos"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--muted)', textDecoration: 'none' }}
        >
          <X size={12} /> Limpar
        </a>
      )}
    </form>
  )
}
