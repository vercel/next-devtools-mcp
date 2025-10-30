export const metadata = {
  title: 'Next.js 16 Test Fixture',
  description: 'Minimal Next.js 16 app for testing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
