import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { readFileBytes } from '@/lib/file-bytes'
import { Dropzone } from '@/components/common/dropzone'
import { FileList, type FileEntry } from '@/components/common/file-list'
import { extractTar } from './tar'

export default function TarTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [entries, setEntries] = useState<FileEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    let active = true
    void readFileBytes(file)
      .then((bytes) => {
        const result = extractTar(bytes)
        if (active) {
          setEntries(result)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setEntries(null)
          setError(e instanceof Error ? e.message : t('tar.invalid'))
        }
      })
    return () => {
      active = false
    }
  }, [file, t])

  return (
    <div className="flex flex-col gap-5">
      <Dropzone
        accept=".tar,.tar.gz,.tgz,application/x-tar,application/gzip"
        prompt={t('tar.prompt')}
        onFile={setFile}
        file={file}
      />
      {error ? <p className="text-sm text-err-foreground">{error}</p> : null}
      {entries ? <FileList entries={entries} /> : null}
    </div>
  )
}
