import { Outlet, createRootRoute } from '@tanstack/react-router'

import { AppShell } from '@/components/layout/app-shell'
import { NotFoundScreen, RouteErrorScreen } from '@/components/common/route-states'

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: NotFoundScreen,
  errorComponent: ({ error }) => <RouteErrorScreen error={error} />,
})
