import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'

import { CATEGORIES, TOOLS, toolPath } from '@/lib/registry'
import { useToolText } from '@/lib/use-tool-text'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

// Global ⌘K / Ctrl-K open state. Returned tuple mirrors useState so the shell
// can also open the palette from the topbar search button.
export function useCommandMenu() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return [open, setOpen] as const
}

export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const text = useToolText()
  const navigate = useNavigate()

  function go(to: string) {
    onOpenChange(false)
    void navigate({ to })
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('search.placeholder')}
      description={t('search.placeholder')}
    >
      <CommandInput placeholder={t('search.placeholder')} />
      <CommandList>
        <CommandEmpty>{t('search.empty')}</CommandEmpty>

        <CommandGroup heading={t('search.toolsHeading')}>
          {TOOLS.map((tool) => (
            <CommandItem
              key={`${tool.category}/${tool.id}`}
              value={`${text.title(tool.id)} ${tool.keywords.join(' ')}`}
              onSelect={() => go(toolPath(tool))}
            >
              <tool.icon />
              <span>{text.title(tool.id)}</span>
              <span className="ml-auto text-2xs text-muted-foreground">
                {text.category(tool.category)}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading={t('search.categoriesHeading')}>
          {CATEGORIES.map((cat) => (
            <CommandItem
              key={cat.id}
              value={`category ${text.category(cat.id)}`}
              onSelect={() => go(`/${cat.id}`)}
            >
              <cat.icon />
              <span>{text.category(cat.id)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
