import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Otaku Estóico | Ecossistema Protagonista',
  description: 'Plataforma de assinatura de desenvolvimento pessoal com trilhas, biblioteca, desafios e comunidade.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
