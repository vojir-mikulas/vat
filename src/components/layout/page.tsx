// Shared page scaffolding — centers content at the app's max width and gives
// every page a consistent header (title + description + optional actions).

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-content px-4 pb-20 pt-7 sm:px-6 md:px-8">{children}</div>
}

export function PageHeader({
  title,
  description,
  actions,
  icon,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 basis-72 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border bg-surface-1 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
