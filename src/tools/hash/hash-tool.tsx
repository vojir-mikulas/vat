import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ResultField } from '@/components/common/result-field'
import { ALGO_LABELS, HASH_ALGOS, hashAll, type HashAlgo } from './hash'

type Hashes = Record<HashAlgo, string>
const EMPTY = { md5: '', sha1: '', sha256: '', sha512: '' } satisfies Hashes

export default function HashTool() {
  const { t } = useTranslation('tools')
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState<Hashes>(EMPTY)

  useEffect(() => {
    if (!input) return
    let active = true
    void hashAll(input).then((result) => {
      if (active) setHashes(result)
    })
    return () => {
      active = false
    }
  }, [input])

  // Derive the empty state during render rather than clearing via setState in the
  // effect (which would trigger a cascading render).
  const display = input ? hashes : EMPTY

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="hash-input"
          className="text-2xs uppercase tracking-wide text-muted-foreground"
        >
          {t('hash.inputLabel')}
        </Label>
        <Textarea
          id="hash-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('hash.inputPlaceholder')}
          spellCheck={false}
          className="min-h-32 resize-y font-mono text-sm"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-4">
        {HASH_ALGOS.map((algo) => (
          <ResultField key={algo} label={ALGO_LABELS[algo]} value={display[algo]} />
        ))}
      </div>
    </div>
  )
}
