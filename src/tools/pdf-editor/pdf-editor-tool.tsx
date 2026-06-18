import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileText, Loader2, Plus, RotateCw, Trash2 } from 'lucide-react'

import type { PDFDocumentProxy } from 'pdfjs-dist'

import { composePdf } from '@/lib/pdf'
import { loadRenderDoc, renderPageThumb, type RenderedPage } from '@/lib/pdf-render'
import { downloadBytes, readFileBytes } from '@/lib/file-bytes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dropzone } from '@/components/common/dropzone'

interface Source {
  name: string
  bytes: Uint8Array
}

// One page tile in the editor. `id` is stable across reorders (for React keys and
// drag tracking); srcIndex/pageIndex point back into `sources`; rotation is the
// extra turn applied on top of the page's own rotation.
interface EditorPage {
  id: string
  srcIndex: number
  pageIndex: number
  rotation: number
}

const thumbKey = (srcIndex: number, pageIndex: number) => `${srcIndex}:${pageIndex}`
const THUMB_SIZE = 240
const PREVIEW_SIZE = 1400

// A cohesive, iLovePDF-style PDF editor: a left side panel holds the page grid
// (drag to reorder, hover to rotate/delete, drop more PDFs to merge), and the
// right pane shows a large live preview of the selected page. Export composes the
// result with pdf-lib; pdf.js renders the previews. Everything runs in the
// browser — merge / reorder / extract / rotate are all edits to the same page
// list (see composePdf()).
export default function PdfEditorTool() {
  const { t } = useTranslation('tools')
  const [sources, setSources] = useState<Source[]>([])
  const [pages, setPages] = useState<EditorPage[]>([])
  const [thumbs, setThumbs] = useState<Map<string, RenderedPage>>(new Map())
  const [previews, setPreviews] = useState<Map<string, RenderedPage>>(new Map())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [pane, setPane] = useState({ w: 0, h: 0 })

  // Monotonic counters that don't depend on React state, so indices/ids stay
  // correct even when files are added in quick succession.
  const nextSrc = useRef(0)
  const nextId = useRef(0)
  // pdf.js documents kept alive for rendering; destroyed on unmount.
  const renderDocs = useRef<PDFDocumentProxy[]>([])
  const dragFrom = useRef<number | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const docs = renderDocs.current
    return () => void docs.forEach((d) => d.loadingTask.destroy())
  }, [])

  // Selection is derived, not stored as a guaranteed-valid id: if the selected
  // page was removed (or none picked yet), fall back to the first page. Below this
  // point `pages` is always non-empty (the empty state returns early).
  const selected = pages.find((p) => p.id === selectedId) ?? pages[0] ?? null

  // Render a high-res preview for the selected page on demand, cached by source
  // page so reselecting is instant. Rotation isn't baked in — it's applied as a
  // CSS transform below, so turning a page never triggers a re-render.
  useEffect(() => {
    if (!selected) return
    const key = thumbKey(selected.srcIndex, selected.pageIndex)
    if (previews.has(key)) return
    const doc = renderDocs.current[selected.srcIndex]
    if (!doc) return
    let cancelled = false
    void renderPageThumb(doc, selected.pageIndex + 1, PREVIEW_SIZE).then((rendered) => {
      if (!cancelled) setPreviews((prev) => new Map(prev).set(key, rendered))
    })
    return () => void (cancelled = true)
  }, [selected, previews])

  // Measure the preview pane so the page image can be fitted exactly, including
  // when rotated 90/270° (where width and height swap).
  const observePane = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setPane({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  async function addFiles(files: File[]) {
    setBusy(true)
    try {
      for (const file of files) {
        const bytes = await readFileBytes(file)
        const srcIndex = nextSrc.current++
        const doc = await loadRenderDoc(bytes)
        renderDocs.current[srcIndex] = doc

        setSources((prev) => [...prev, { name: file.name, bytes }])
        setPages((prev) => [
          ...prev,
          ...Array.from({ length: doc.numPages }, (_, i) => ({
            id: `p${nextId.current++}`,
            srcIndex,
            pageIndex: i,
            rotation: 0,
          })),
        ])

        // Rasterize thumbnails progressively so tiles fill in as they're ready.
        for (let p = 1; p <= doc.numPages; p++) {
          const rendered = await renderPageThumb(doc, p, THUMB_SIZE)
          setThumbs((prev) => new Map(prev).set(thumbKey(srcIndex, p - 1), rendered))
        }
      }
    } finally {
      setBusy(false)
    }
  }

  function rotatePage(id: string) {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p)),
    )
  }

  function removePage(id: string) {
    setPages((prev) => prev.filter((p) => p.id !== id))
  }

  function rotateAll() {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })))
  }

  function reorder(from: number | null, to: number) {
    setPages((prev) => {
      if (from === null || from === to) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved!)
      return next
    })
  }

  async function exportPdf() {
    setExporting(true)
    try {
      const ops = pages.map((p) => ({
        srcIndex: p.srcIndex,
        pageIndex: p.pageIndex,
        rotation: p.rotation,
      }))
      const out = await composePdf(
        sources.map((s) => s.bytes),
        ops,
      )
      downloadBytes(out, 'edited.pdf', 'application/pdf')
    } finally {
      setExporting(false)
    }
  }

  // Empty state: a full dropzone, same as the other file tools.
  if (pages.length === 0) {
    return (
      <Dropzone
        multiple
        accept="application/pdf,.pdf"
        prompt={t('pdf-editor.prompt')}
        onFiles={addFiles}
      />
    )
  }

  const selectedPreview = selected
    ? previews.get(thumbKey(selected.srcIndex, selected.pageIndex))
    : null
  const previewStyle = fitStyle(selectedPreview, selected?.rotation ?? 0, pane)

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[30rem] flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('pdf-editor.pageCount', { count: pages.length })}</span>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={rotateAll}>
            <RotateCw />
            {t('pdf-editor.rotateAll')}
          </Button>
          <Button size="sm" disabled={exporting} onClick={exportPdf}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />}
            {t('pdf-editor.export')}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Side panel: page grid */}
        <aside className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border bg-surface-1">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('pdf-editor.pagesHeading')}
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => addInputRef.current?.click()}
              disabled={busy}
            >
              <Plus />
              {t('pdf-editor.add')}
            </Button>
            <input
              ref={addInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) void addFiles(Array.from(e.target.files))
                e.target.value = ''
              }}
            />
          </div>

          <div
            className="grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto p-3"
            onDragOver={(e) => e.preventDefault()}
          >
            {pages.map((page, i) => {
              const thumb = thumbs.get(thumbKey(page.srcIndex, page.pageIndex))
              const rotated = page.rotation % 180 !== 0
              const isSelected = page.id === selectedId
              return (
                <div
                  key={page.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  draggable
                  onClick={() => setSelectedId(page.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedId(page.id)
                    }
                  }}
                  onDragStart={(e) => {
                    dragFrom.current = i
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setOverIndex(i)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    reorder(dragFrom.current, i)
                    dragFrom.current = null
                    setOverIndex(null)
                  }}
                  onDragEnd={() => {
                    dragFrom.current = null
                    setOverIndex(null)
                  }}
                  className={cn(
                    'group relative flex cursor-grab flex-col overflow-hidden rounded-lg border bg-background transition active:cursor-grabbing',
                    isSelected ? 'border-brand ring-2 ring-brand/40' : 'hover:border-border-strong',
                    overIndex === i && 'border-brand ring-2 ring-brand/40',
                  )}
                >
                  <div className="flex h-28 items-center justify-center overflow-hidden p-1.5">
                    {thumb ? (
                      <img
                        src={thumb.url}
                        alt=""
                        draggable={false}
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                        className={cn(
                          'rounded-sm shadow-sm transition-transform',
                          rotated ? 'max-h-20 max-w-20' : 'max-h-full max-w-full',
                        )}
                      />
                    ) : (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t px-1.5 py-0.5">
                    <span className="text-2xs text-muted-foreground tabular-nums">{i + 1}</span>
                    <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t('pdf-editor.rotate')}
                        onClick={(e) => {
                          e.stopPropagation()
                          rotatePage(page.id)
                        }}
                      >
                        <RotateCw />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t('pdf-editor.remove')}
                        onClick={(e) => {
                          e.stopPropagation()
                          removePage(page.id)
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="border-t px-3 py-2 text-2xs leading-snug text-muted-foreground">
            {t('pdf-editor.dragHint')}
          </p>
        </aside>

        {/* Preview pane: large render of the selected page */}
        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-surface-2">
          <div ref={observePane} className="flex min-h-0 flex-1 items-center justify-center p-6">
            {selected ? (
              selectedPreview ? (
                <img
                  src={selectedPreview.url}
                  alt=""
                  style={{
                    ...previewStyle,
                    transform: `rotate(${selected.rotation}deg)`,
                  }}
                  className="rounded-sm bg-white shadow-lg transition-transform"
                />
              ) : (
                <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-8" aria-hidden />
                {t('pdf-editor.previewEmpty')}
              </div>
            )}
          </div>
          {selected ? (
            <div className="border-t bg-surface-1 px-4 py-2 text-center text-xs text-muted-foreground">
              {t('pdf-editor.pageOf', {
                n: pages.indexOf(selected) + 1,
                total: pages.length,
              })}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

// Compute an explicit width/height that fits `page` (at its rotation) inside the
// measured pane. The image is sized in its *unrotated* orientation, then the CSS
// rotation swaps its on-screen dimensions — so for 90/270° we pre-swap here. Falls
// back to letting CSS contain the image until the pane has been measured.
function fitStyle(
  page: RenderedPage | null | undefined,
  rotation: number,
  pane: { w: number; h: number },
): React.CSSProperties {
  if (!page || pane.w === 0 || pane.h === 0) return { maxWidth: '100%', maxHeight: '100%' }
  const rotated = rotation % 180 !== 0
  // Effective (on-screen) page dimensions after rotation.
  const effW = rotated ? page.height : page.width
  const effH = rotated ? page.width : page.height
  const scale = Math.min(pane.w / effW, pane.h / effH)
  const dispW = effW * scale
  const dispH = effH * scale
  // Image element is unrotated, so swap back for 90/270°.
  return rotated ? { width: dispH, height: dispW } : { width: dispW, height: dispH }
}
