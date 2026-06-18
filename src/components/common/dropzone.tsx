import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageUp, UploadCloud } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/download'

interface DropzoneProps {
  /** Called with the first file (single-file mode). */
  onFile?: (file: File) => void
  /** Called with all selected files when `multiple` is set. */
  onFiles?: (files: File[]) => void
  multiple?: boolean
  /** File-input accept string, e.g. "image/*". */
  accept?: string
  /** The currently-loaded file (shows its name/size when present). */
  file?: File | null
  prompt?: string
}

// Drag-and-drop + click-to-browse file picker. Generic over file type; tools pass
// an `accept` and the active file for display. Keyboard-accessible (Enter/Space).
export function Dropzone({
  onFile,
  onFiles,
  multiple = false,
  accept = 'image/*',
  file,
  prompt,
}: DropzoneProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (multiple) onFiles?.(Array.from(files))
    else onFile?.(files[0]!)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-surface-1 px-6 py-10 text-center transition-colors outline-none hover:border-border-strong focus-visible:ring-[3px] focus-visible:ring-ring/50',
        dragging && 'border-brand bg-surface-2',
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl border bg-background text-muted-foreground">
        {file ? <ImageUp className="size-5" /> : <UploadCloud className="size-5" />}
      </span>
      {file ? (
        <div className="text-sm">
          <p className="font-medium">{file.name}</p>
          <p className="text-muted-foreground">
            {formatBytes(file.size)} · {t('dropzone.change')}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{prompt ?? t('dropzone.imagePrompt')}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
