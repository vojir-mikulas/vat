import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'

import { downloadBlob } from '@/lib/download'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CodePane } from '@/components/common/code-pane'

type Level = 'L' | 'M' | 'Q' | 'H'
const LEVELS: Level[] = ['L', 'M', 'Q', 'H']

export default function QrGenerateTool() {
  const { t } = useTranslation('tools')
  const [text, setText] = useState('')
  const [level, setLevel] = useState<Level>('M')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  function downloadPng() {
    canvasRef.current?.toBlob((blob) => blob && downloadBlob(blob, 'qrcode.png'))
  }
  function downloadSvg() {
    if (!svgRef.current) return
    const svg = new XMLSerializer().serializeToString(svgRef.current)
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'qrcode.svg')
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <CodePane
          label={t('qr-generate.inputLabel')}
          value={text}
          onChange={setText}
          placeholder={t('qr-generate.inputPlaceholder')}
          rows="md"
          autoFocus
        />
        <div className="flex flex-col gap-2">
          <span className="text-2xs uppercase tracking-wide text-muted-foreground">
            {t('qr-generate.ecc')}
          </span>
          <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {t(`qr-generate.level.${l}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="grid size-64 place-items-center rounded-xl border bg-white p-4">
          {text ? (
            <QRCodeCanvas ref={canvasRef} value={text} size={224} level={level} marginSize={2} />
          ) : (
            <span className="px-6 text-center text-sm text-neutral-400">
              {t('qr-generate.empty')}
            </span>
          )}
        </div>
        {text ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadPng}>
              <Download />
              {t('qr-generate.png')}
            </Button>
            <Button variant="outline" onClick={downloadSvg}>
              <Download />
              {t('qr-generate.svg')}
            </Button>
            {/* Hidden SVG used only as the source for the SVG download. */}
            <div className="hidden">
              <QRCodeSVG ref={svgRef} value={text} size={224} level={level} marginSize={2} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
