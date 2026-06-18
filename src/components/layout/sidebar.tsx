import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { Link, useRouterState } from '@tanstack/react-router'

import { CATEGORIES, toolsInCategory } from '@/lib/registry'
import { useToolText } from '@/lib/use-tool-text'
import { transition } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function Sidebar() {
  return (
    <aside className="sticky top-3 m-3 hidden h-[calc(100svh-1.5rem)] w-sidebar shrink-0 flex-col rounded-xl border bg-surface-1 md:flex">
      <SidebarContent />
    </aside>
  )
}

// Inner layout, shared by the desktop rail and the mobile drawer. `onNavigate`
// lets the mobile drawer close itself when a link is tapped.
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const text = useToolText()

  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // A category is active when the path is exactly /<id> or nested under it.
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`)
  // Namespace the shared layoutId per mounted sidebar (rail vs drawer) so their
  // active pills don't fight over one layoutId.
  const pillId = `sidebar-active-${useId()}`

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <Link
        to="/"
        onClick={onNavigate}
        className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
          V
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">{t('app.name')}</span>
          <span className="truncate text-2xs text-muted-foreground">{t('app.fullName')}</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {CATEGORIES.map((cat) => {
          const to = `/${cat.id}`
          const active = isActive(to)
          const count = toolsInCategory(cat.id).length
          return (
            <Link
              key={cat.id}
              to={to}
              onClick={onNavigate}
              className={cn(
                'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active ? (
                <m.span
                  layoutId={pillId}
                  transition={transition.layout}
                  className="absolute inset-0 -z-10 rounded-lg bg-surface-2"
                />
              ) : null}
              <cat.icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{text.category(cat.id)}</span>
              <span className="text-2xs tabular-nums text-muted-foreground">{count}</span>
            </Link>
          )
        })}
      </nav>

      <p className="mt-auto px-2.5 pt-3 text-2xs leading-snug text-muted-foreground">
        {t('app.privacy')}
      </p>
    </div>
  )
}
