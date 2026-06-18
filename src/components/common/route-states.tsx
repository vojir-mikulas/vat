import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, Loader2, SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/page'

// Centered status screens reused by the router for not-found / error / pending.

function CenteredState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <span className="grid size-14 place-items-center rounded-2xl border bg-surface-1 text-muted-foreground">
          {icon}
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
    </PageContainer>
  )
}

export function NotFoundScreen() {
  const { t } = useTranslation()
  return (
    <CenteredState
      icon={<SearchX className="size-6" />}
      title={t('notFound.title')}
      description={t('notFound.description')}
      action={
        <Button asChild variant="outline">
          <Link to="/">{t('notFound.back')}</Link>
        </Button>
      }
    />
  )
}

export function RouteErrorScreen({ error }: { error?: Error }) {
  const { t } = useTranslation()
  return (
    <CenteredState
      icon={<AlertTriangle className="size-6 text-err" />}
      title={t('error.title')}
      description={error?.message || t('error.description')}
      action={
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('error.retry')}
        </Button>
      }
    />
  )
}

export function RoutePendingScreen() {
  const { t } = useTranslation()
  return <CenteredState icon={<Loader2 className="size-6 animate-spin" />} title={t('loading')} />
}
