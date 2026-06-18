import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { SidebarContent } from '@/components/layout/sidebar'

// Sticky app bar: mobile nav drawer + a search trigger that opens the command
// palette, the theme switch, and a source link.
export function Topbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-surface-1 px-2.5 py-2">
      {/* Mobile-only nav drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label={t('nav.openMenu')}
          >
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[17rem] p-0">
          <SheetTitle className="sr-only">{t('nav.categories')}</SheetTitle>
          <SheetDescription className="sr-only">{t('app.tagline')}</SheetDescription>
          <SidebarContent onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Search trigger — looks like an input, opens the ⌘K palette */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex h-9 flex-1 items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-border-strong cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">{t('search.trigger')}</span>
        <kbd className="hidden rounded border bg-surface-1 px-1.5 py-0.5 font-mono text-2xs sm:inline-block">
          {t('search.shortcut')}
        </kbd>
      </button>

      <ThemeToggle />

      <Button asChild variant="ghost" size="icon-sm" aria-label={t('nav.github')}>
        <a href="https://github.com/vojir/vat" target="_blank" rel="noreferrer noopener">
          <GithubIcon />
        </a>
      </Button>
    </div>
  )
}

// lucide-react dropped brand marks in v1, so the GitHub logo is inlined here.
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.57 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.36-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.21a11.6 11.6 0 0 1 3-.4c1.02 0 2.05.13 3 .4 2.28-1.53 3.29-1.21 3.29-1.21.66 1.66.24 2.88.12 3.18.77.83 1.23 1.88 1.23 3.17 0 4.53-2.8 5.53-5.48 5.82.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.69.83.57A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5z" />
    </svg>
  )
}
