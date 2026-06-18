import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle } from 'lucide-react'

import { readFileBytes } from '@/lib/file-bytes'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dropzone } from '@/components/common/dropzone'
import { ResultField } from '@/components/common/result-field'
import { ALGO_LABELS, CHECKSUM_ALGOS, hashAllBytes, type ChecksumAlgo } from './checksum'

export default function ChecksumTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [hashes, setHashes] = useState<Record<ChecksumAlgo, string> | null>(null)
  const [expected, setExpected] = useState('')

  useEffect(() => {
    if (!file) return
    let active = true
    void readFileBytes(file)
      .then((bytes) => hashAllBytes(bytes))
      .then((result) => {
        if (active) setHashes(result)
      })
    return () => {
      active = false
    }
  }, [file])

  const exp = expected.trim().toLowerCase()
  const matchedAlgo =
    hashes && exp ? CHECKSUM_ALGOS.find((a) => hashes[a].toLowerCase() === exp) : undefined

  return (
    <div className="flex flex-col gap-5">
      <Dropzone accept="*/*" prompt={t('checksum.prompt')} onFile={setFile} file={file} />

      {hashes ? (
        <>
          <div className="flex flex-col gap-4">
            {CHECKSUM_ALGOS.map((algo) => (
              <ResultField key={algo} label={ALGO_LABELS[algo]} value={hashes[algo]} />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="cs-expected"
              className="text-2xs uppercase tracking-wide text-muted-foreground"
            >
              {t('checksum.verify')}
            </Label>
            <Input
              id="cs-expected"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder={t('checksum.verifyPlaceholder')}
              className="font-mono text-sm"
            />
            {exp ? (
              matchedAlgo ? (
                <p className="flex items-center gap-1.5 text-sm text-ok-foreground">
                  <CheckCircle2 className="size-4" />
                  {t('checksum.match', { algo: ALGO_LABELS[matchedAlgo] })}
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-err-foreground">
                  <XCircle className="size-4" />
                  {t('checksum.noMatch')}
                </p>
              )
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
