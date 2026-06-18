import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { ChevronRight, Loader2 } from 'lucide-react'

import type { Tool } from '@/lib/registry'
import { TOOLS, getCategory } from '@/lib/registry'
import { useToolText } from '@/lib/use-tool-text'
import { Badge } from '@/components/ui/badge'
import { PageContainer, PageHeader } from '@/components/layout/page'

// One lazy wrapper per tool, built once at module load (not during render) so
// navigating away and back reuses the same component instead of re-triggering
// the dynamic import + Suspense fallback. lazy() only wraps — the chunk isn't
// fetched until the component actually renders.
const LAZY_TOOLS = new Map(TOOLS.map((tool) => [tool.id, lazy(tool.load)]))

// Renders a tool's page: shared header chrome (breadcrumb, title, description,
// WIP badge) + the lazily-loaded tool component below it.
export function ToolHost({ tool }: { tool: Tool }) {
  const { t } = useTranslation()
  const text = useToolText()
  const Component = LAZY_TOOLS.get(tool.id)
  const category = getCategory(tool.category)

  return (
    <PageContainer>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <Link to="/" className="hover:text-foreground">
          {t('nav.home')}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          to="/$categoryId"
          params={{ categoryId: tool.category }}
          className="hover:text-foreground"
        >
          {text.category(tool.category)}
        </Link>
      </nav>

      <PageHeader
        icon={category ? <category.icon className="size-5" /> : <tool.icon className="size-5" />}
        title={text.title(tool.id)}
        description={text.description(tool.id)}
        actions={
          tool.status === 'wip' ? (
            <Badge variant="outline" className="text-warn-foreground">
              {t('status.wip')}
            </Badge>
          ) : undefined
        }
      />

      <Suspense
        fallback={
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t('loading')}
          </div>
        }
      >
        {/* Component is a stable, module-level lazy() instance keyed by tool id
            (see LAZY_TOOLS) — not created during render, so its state is never
            reset. The rule can't see through the Map lookup. */}
        {/* eslint-disable-next-line react-hooks/static-components */}
        {Component ? <Component /> : null}
      </Suspense>
    </PageContainer>
  )
}
