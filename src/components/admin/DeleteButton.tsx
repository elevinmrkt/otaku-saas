'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function DeleteButton({
  action,
  confirmMsg,
}: {
  action: () => Promise<void>
  confirmMsg: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!window.confirm(confirmMsg)) return
    setLoading(true)
    await action()
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-ghost sm"
      style={{ color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }}
    >
      <Trash2 size={13} />
      {loading ? '...' : 'Apagar'}
    </button>
  )
}
