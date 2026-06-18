import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import exifr from 'exifr'

import { loadImageFromFile } from '@/lib/image'
import { formatBytes } from '@/lib/download'
import { Dropzone } from '@/components/common/dropzone'
import { flattenMetadata, type MetaEntry } from './metadata'

interface BasicInfo {
  name: string
  type: string
  size: number
  width: number
  height: number
}

export default function ImageMetadataTool() {
  const { t } = useTranslation('tools')
  const [file, setFile] = useState<File | null>(null)
  const [meta, setMeta] = useState<MetaEntry[]>([])
  const [info, setInfo] = useState<BasicInfo | null>(null)

  useEffect(() => {
    if (!file) return
    let active = true
    void Promise.all([
      exifr.parse(file).catch(() => undefined),
      loadImageFromFile(file).catch(() => null),
    ]).then(([exif, img]) => {
      if (!active) return
      setMeta(flattenMetadata(exif as Record<string, unknown> | undefined))
      setInfo({
        name: file.name,
        type: file.type || 'unknown',
        size: file.size,
        width: img?.naturalWidth ?? 0,
        height: img?.naturalHeight ?? 0,
      })
    })
    return () => {
      active = false
    }
  }, [file])

  return (
    <div className="flex flex-col gap-5">
      <Dropzone onFile={setFile} file={file} />

      {info ? (
        <div className="flex flex-col gap-4">
          <MetaTable
            title={t('image-metadata.file')}
            entries={[
              { key: t('image-metadata.name'), value: info.name },
              { key: t('image-metadata.type'), value: info.type },
              { key: t('image-metadata.size'), value: formatBytes(info.size) },
              {
                key: t('image-metadata.dimensions'),
                value: info.width ? `${info.width} × ${info.height}` : '—',
              },
            ]}
          />
          {meta.length > 0 ? (
            <MetaTable title={t('image-metadata.exif')} entries={meta} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('image-metadata.noExif')}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

function MetaTable({ title, entries }: { title: string; entries: MetaEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-surface-1 px-4 py-2 text-2xs uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <dl className="divide-y">
        {entries.map((e) => (
          <div key={e.key} className="flex gap-4 px-4 py-2 text-sm">
            <dt className="w-40 shrink-0 truncate text-muted-foreground">{e.key}</dt>
            <dd className="min-w-0 break-words font-mono">{e.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
