import { useTranslation } from 'react-i18next'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { m } from 'motion/react'

import { getCategory, toolsInCategory } from '@/lib/registry'
import { useToolText } from '@/lib/use-tool-text'
import { listContainer, listItem } from '@/lib/motion'
import { PageContainer, PageHeader } from '@/components/layout/page'

export const Route = createFileRoute('/$categoryId/')({
  beforeLoad: ({ params }) => {
    if (!getCategory(params.categoryId)) throw notFound()
  },
  component: CategoryPage,
})

function CategoryPage() {
  const { t } = useTranslation()
  const text = useToolText()
  const { categoryId } = Route.useParams()
  // Guaranteed valid by beforeLoad.
  const category = getCategory(categoryId)!
  const tools = toolsInCategory(category.id)

  return (
    <PageContainer>
      <PageHeader
        icon={<category.icon className="size-5" />}
        title={text.category(category.id)}
        description={text.categoryDescription(category.id)}
      />

      {tools.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-surface-1 px-5 py-10 text-center text-sm text-muted-foreground">
          {t('home.emptyCategory')}
        </p>
      ) : (
        <m.div
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {tools.map((tool, i) => (
            <m.div key={tool.id} variants={listItem} custom={i}>
              <Link
                to="/$categoryId/$toolId"
                params={{ categoryId: tool.category, toolId: tool.id }}
                className="group flex h-full flex-col rounded-xl border bg-surface-1 p-5 transition-colors hover:border-border-strong hover:bg-surface-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className="mb-3 grid size-10 place-items-center rounded-xl border bg-background text-foreground">
                  <tool.icon className="size-5" />
                </span>
                <h2 className="text-base font-semibold">{text.title(tool.id)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{text.description(tool.id)}</p>
              </Link>
            </m.div>
          ))}
        </m.div>
      )}
    </PageContainer>
  )
}
