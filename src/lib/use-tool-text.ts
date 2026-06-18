import { useTranslation } from 'react-i18next'

import type { ToolCategoryId } from '@/lib/registry'

// Resolves the display strings for tools and categories from the `tools` i18n
// namespace. Tool title/description use dynamic keys (`<id>.title`), so they're
// cast to a representative valid key to satisfy the typed t() while allowing any
// runtime id — i18next does the actual lookup at runtime. Category keys come
// from a finite union and stay fully type-checked.
export function useToolText() {
  const { t } = useTranslation('tools')
  return {
    title: (id: string) => t(`${id}.title` as 'base64.title'),
    description: (id: string) => t(`${id}.description` as 'base64.description'),
    category: (id: ToolCategoryId) => t(`category.${id}`),
    categoryDescription: (id: ToolCategoryId) => t(`categoryDescription.${id}`),
  }
}
