import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'

import { downloadBytes } from '@/lib/file-bytes'
import { formatBytes } from '@/lib/download'
import { Button } from '@/components/ui/button'

export interface FileEntry {
  name: string
  data: Uint8Array
}

const basename = (path: string) => path.split('/').pop() || path

// Lists archive entries (name + size) with a per-entry download button. Shared by
// the Unzip and TAR Extract tools.
export function FileList({ entries }: { entries: FileEntry[] }) {
  const { t } = useTranslation()
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-surface-1 px-4 py-2 text-2xs uppercase tracking-wide text-muted-foreground">
        {t('fileList.entries', { count: entries.length })}
      </div>
      <ul className="divide-y">
        {entries.map((e) => (
          <li key={e.name} className="flex items-center gap-3 px-4 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate font-mono">{e.name}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {formatBytes(e.data.length)}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('actions.download')}
              onClick={() => downloadBytes(e.data, basename(e.name))}
            >
              <Download />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
