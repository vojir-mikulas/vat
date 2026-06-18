import { createFileRoute, notFound } from '@tanstack/react-router'

import { getTool } from '@/lib/registry'
import { ToolHost } from '@/components/common/tool-host'

export const Route = createFileRoute('/$categoryId/$toolId')({
  beforeLoad: ({ params }) => {
    if (!getTool(params.categoryId, params.toolId)) throw notFound()
  },
  component: ToolPage,
})

function ToolPage() {
  const { categoryId, toolId } = Route.useParams()
  // Guaranteed valid by beforeLoad.
  const tool = getTool(categoryId, toolId)!
  return <ToolHost tool={tool} />
}
