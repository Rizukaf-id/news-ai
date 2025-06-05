import './styles/globals.css'

export const metadata = {
  title: 'News AI',
  description: 'Asisten berita interaktif',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}