import { useTranslation } from 'react-i18next'
import { createFileRoute, Link } from '@tanstack/react-router'
import { m } from 'motion/react'
import { ArrowRight } from 'lucide-react'

import { CATEGORIES, toolsInCategory } from '@/lib/registry'
import { useToolText } from '@/lib/use-tool-text'
import { listContainer, listItem } from '@/lib/motion'
import { PageContainer } from '@/components/layout/page'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { t } = useTranslation()
  const text = useToolText()

  return (
    <PageContainer>
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('app.fullName')}</h1>
        <p className="mt-3 text-base text-muted-foreground">{t('app.tagline')}</p>
        <p className="mt-1 text-sm font-medium text-brand">{t('home.heroPrivacy')}</p>
      </header>

      <m.div
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {CATEGORIES.map((cat, i) => {
          const count = toolsInCategory(cat.id).length
          return (
            <m.div key={cat.id} variants={listItem} custom={i}>
              <Link
                to="/$categoryId"
                params={{ categoryId: cat.id }}
                className="group flex h-full flex-col rounded-xl border bg-surface-1 p-5 transition-colors hover:border-border-strong hover:bg-surface-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl border bg-background text-foreground">
                    <cat.icon className="size-5" />
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h2 className="text-base font-semibold">{text.category(cat.id)}</h2>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">
                  {text.categoryDescription(cat.id)}
                </p>
                <p className="mt-3 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  {count > 0 ? t('home.toolCount', { count }) : t('home.comingSoon')}
                </p>
              </Link>
            </m.div>
          )
        })}
      </m.div>
    </PageContainer>
  )
}
