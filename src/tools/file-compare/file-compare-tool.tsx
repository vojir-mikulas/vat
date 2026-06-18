import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle } from 'lucide-react'

import { readFileBytes } from '@/lib/file-bytes'
import { formatBytes } from '@/lib/download'
import { hashBytes } from '@/tools/checksum/checksum'
import { Dropzone } from '@/components/common/dropzone'
import { ResultField } from '@/components/common/result-field'
import { bytesEqual } from './compare'

interface CompareResult {
  equal: boolean
  aHash: string
  bHash: string
}

export default function FileCompareTool() {
  const { t } = useTranslation('tools')
  const [a, setA] = useState<File | null>(null)
  const [b, setB] = useState<File | null>(null)
  const [result, setResult] = useState<CompareResult | null>(null)

  useEffect(() => {
    if (!a || !b) return
    let active = true
    void Promise.all([readFileBytes(a), readFileBytes(b)]).then(async ([ba, bb]) => {
      const equal = bytesEqual(ba, bb)
      const [aHash, bHash] = await Promise.all([hashBytes(ba, 'sha256'), hashBytes(bb, 'sha256')])
      if (active) setResult({ equal, aHash, bHash })
    })
    return () => {
      active = false
    }
  }, [a, b])

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Dropzone accept="*/*" prompt={t('file-compare.fileA')} onFile={setA} file={a} />
        <Dropzone accept="*/*" prompt={t('file-compare.fileB')} onFile={setB} file={b} />
      </div>

      {result && a && b ? (
        <>
          <div
            className={
              result.equal
                ? 'flex items-center gap-2 rounded-xl border border-ok-border bg-ok-bg px-4 py-3 text-ok-foreground'
                : 'flex items-center gap-2 rounded-xl border border-err-border bg-err-bg px-4 py-3 text-err-foreground'
            }
          >
            {result.equal ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
            <span className="font-medium">
              {result.equal ? t('file-compare.identical') : t('file-compare.different')}
            </span>
            <span className="text-sm opacity-80">
              {formatBytes(a.size)} · {formatBytes(b.size)}
            </span>
          </div>
          <ResultField label={t('file-compare.hashA')} value={result.aHash} />
          <ResultField label={t('file-compare.hashB')} value={result.bHash} />
        </>
      ) : null}
    </div>
  )
}
