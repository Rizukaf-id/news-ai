import './styles/globals.css'

export const metadata = {
  title: 'Learning Assistant',
  description: 'Asisten pembelajaran interaktif',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}