'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle, Loader } from 'lucide-react'

interface Props {
  bucket: string
  folder: string
  accept: string
  label: string
  onUrl: (url: string) => void
  currentUrl?: string
}

export default function UploadButton({ bucket, folder, accept, label, onUrl, currentUrl }: Props) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setDone(false)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
    const path = `${folder}/${name}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) {
      alert('Erro no upload: ' + error.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    onUrl(data.publicUrl)
    setDone(true)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} style={{ display: 'none' }} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.35rem 0.8rem', borderRadius: '6px',
          background: done ? 'rgba(37,211,102,0.1)' : 'var(--card-2)',
          border: `1px solid ${done ? 'rgba(37,211,102,0.3)' : 'var(--border-2)'}`,
          color: done ? 'var(--green)' : 'var(--muted)',
          fontSize: '0.72rem', fontWeight: 700, cursor: uploading ? 'wait' : 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          transition: 'all 180ms', flexShrink: 0,
        }}
      >
        {uploading
          ? <Loader size={11} className="spin" />
          : done
          ? <CheckCircle size={11} />
          : <Upload size={11} />
        }
        {uploading ? 'Enviando…' : done ? 'Enviado' : label}
      </button>
      {currentUrl && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.68rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}
          title={currentUrl}
        >
          {currentUrl.split('/').pop()?.split('?')[0] ?? 'ver arquivo'}
        </a>
      )}
    </div>
  )
}
