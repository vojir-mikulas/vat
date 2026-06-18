interface QualitySliderProps {
  value: number
  onChange: (value: number) => void
  label: string
}

// Range input (10–100%) for lossy encode quality. Lives in common/ (outside the
// i18n guard), so the literal "%" suffix is fine here.
export function QualitySlider({ value, onChange, label }: QualitySliderProps) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex flex-col gap-2">
      <span className="text-2xs uppercase tracking-wide text-muted-foreground">
        {label} — {pct}%
      </span>
      <input
        type="range"
        min={10}
        max={100}
        value={pct}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-9 w-48 cursor-pointer accent-brand"
      />
    </div>
  )
}
