import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Download, X } from 'lucide-react'

import { mergePdfs } from '@/lib/pdf'
import { downloadBytes, readFileBytes } from '@/lib/file-bytes'
import { formatBytes } from '@/lib/download'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/common/dropzone'

export default function PdfMergeTool() {
  const { t } = useTranslation('tools')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)

  function move(i: number, delta: number) {
    setFiles((prev) => {
      const next = [...prev]
      const j = i + delta
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j]!, next[i]!]
      return next
    })
  }

  async function download() {
    setBusy(true)
    try {
      const buffers = await Promise.all(files.map(readFileBytes))
      downloadBytes(await mergePdfs(buffers), 'merged.pdf', 'application/pdf')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        multiple
        accept="application/pdf,.pdf"
        prompt={t('pdf-merge.prompt')}
        onFiles={(fs) => setFiles((prev) => [...prev, ...fs])}
      />

      {files.length > 0 ? (
        <>
          <ul className="divide-y overflow-hidden rounded-xl border">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-2 px-4 py-2 text-sm">
                <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-mono">{f.name}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {formatBytes(f.size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('pdf-merge.moveUp')}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('pdf-merge.moveDown')}
                  disabled={i === files.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('pdf-merge.remove')}
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button onClick={download} disabled={busy || files.length < 1}>
              <Download />
              {t('pdf-merge.download')}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}
