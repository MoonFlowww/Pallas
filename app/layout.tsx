import './globals.css'
import { TradeDataProvider } from '@/lib/cache/TradeDataProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Pallas',
  icons: {
    icon: '/PallasInc.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TradeDataProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </TradeDataProvider>
      </body>
    </html>
  )
}
