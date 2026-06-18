import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, X } from 'lucide-react'

import { downloadBytes, readFileBytes } from '@/lib/file-bytes'
import { formatBytes } from '@/lib/download'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/common/dropzone'
import { createZip } from './zip'

export default function ZipTool() {
  const { t } = useTranslation('tools')
  const [files, setFiles] = useState<File[]>([])

  const total = files.reduce((sum, f) => sum + f.size, 0)

  async function download() {
    const inputs = await Promise.all(
      files.map(async (f) => ({ name: f.name, data: await readFileBytes(f) })),
    )
    downloadBytes(createZip(inputs), 'archive.zip', 'application/zip')
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        multiple
        accept="*/*"
        prompt={t('zip.prompt')}
        onFiles={(fs) => setFiles((prev) => [...prev, ...fs])}
      />

      {files.length > 0 ? (
        <>
          <ul className="overflow-hidden rounded-xl border divide-y">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-mono">{f.name}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {formatBytes(f.size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('zip.remove')}
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {t('zip.summary', { count: files.length, size: formatBytes(total) })}
            </span>
            <Button onClick={download}>
              <Download />
              {t('zip.download')}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}
