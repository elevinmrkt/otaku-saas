'use client'

import { useRef, useEffect, useState } from 'react'
import { Bold, Italic, Heading2, Heading3, List, Link2, Eye, EyeOff, AlignLeft } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
}

const TB: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '0.35rem 0.5rem', borderRadius: '5px',
  color: 'var(--muted)', transition: 'background 150ms, color 150ms',
  fontSize: '0.72rem', fontWeight: 600,
}

export default function ArticleEditor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value || ''
      initialized.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val ?? '')
    sync()
  }

  function sync() {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function handleLink() {
    const url = prompt('URL do link (ex: https://...):')
    if (url) exec('createLink', url)
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', background: 'var(--card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', padding: '0.5rem 0.75rem', background: 'var(--card-2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {!preview && (
          <>
            <button type="button" onMouseDown={e => { e.preventDefault(); exec('bold') }} style={TB} title="Negrito (Ctrl+B)"><Bold size={13} /></button>
            <button type="button" onMouseDown={e => { e.preventDefault(); exec('italic') }} style={TB} title="Itálico (Ctrl+I)"><Italic size={13} /></button>
            <span style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 0.2rem', display: 'inline-block' }} />
            <button type="button" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h2') }} style={TB} title="Título H2"><Heading2 size={13} /></button>
            <button type="button" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h3') }} style={TB} title="Subtítulo H3"><Heading3 size={13} /></button>
            <button type="button" onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'p') }} style={TB} title="Parágrafo"><AlignLeft size={13} /></button>
            <span style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 0.2rem', display: 'inline-block' }} />
            <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList') }} style={TB} title="Lista com marcadores"><List size={13} /></button>
            <button type="button" onMouseDown={e => { e.preventDefault(); handleLink() }} style={TB} title="Inserir link"><Link2 size={13} /></button>
          </>
        )}
        <button
          type="button"
          onClick={() => setPreview(p => !p)}
          style={{ ...TB, marginLeft: 'auto', color: preview ? 'var(--gold)' : 'var(--muted)' }}
        >
          {preview ? <EyeOff size={13} /> : <Eye size={13} />}
          {preview ? 'Editar' : 'Preview'}
        </button>
      </div>

      {preview ? (
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: value || '<p style="color:var(--muted);font-style:italic">Sem conteúdo ainda.</p>' }}
          style={{ minHeight: '360px', padding: '1.5rem' }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          style={{
            minHeight: '360px', padding: '1.5rem',
            fontSize: '0.92rem', lineHeight: 1.85, color: 'var(--text)',
            outline: 'none',
          }}
        />
      )}
    </div>
  )
}
