import { useTranslation } from 'react-i18next'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { CommandMenu, useCommandMenu } from '@/components/layout/command-menu'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useCommandMenu()

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <SkipToContent />
      <Sidebar />
      {/* tabIndex={-1} lets the skip link move focus here programmatically
          without adding <main> to the normal tab order. */}
      <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
        {/* Sticky frosted bar — mirrors the sidebar's floating-card inset. */}
        <div className="sticky top-0 z-20 bg-background/70 px-3 pt-3 pb-2.5 backdrop-blur-md md:pl-0">
          <Topbar onOpenSearch={() => setCmdOpen(true)} />
        </div>
        <div className="flex-1">{children}</div>
      </main>
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  )
}

// First focusable element: visually hidden until focused, then jumps keyboard/SR
// users past the sidebar straight to <main>.
function SkipToContent() {
  const { t } = useTranslation()
  return (
    <a
      href="#main"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:border focus-visible:bg-surface-1 focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {t('nav.skipToContent')}
    </a>
  )
}
