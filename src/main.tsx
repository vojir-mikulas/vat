import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'

import './index.css'
// Initialize the i18n singleton before anything renders. English is bundled, so
// this resolves synchronously today; the <Suspense> below covers lazy locale
// loads once additional languages ship.
import './i18n'
import { routeTree } from './routeTree.gen'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { RoutePendingScreen } from '@/components/common/route-states'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  // If a route's lazy component loads slowly, show a spinner instead of leaving
  // the user on the prior page with the URL already changed.
  defaultPendingComponent: RoutePendingScreen,
  defaultPendingMs: 150,
  defaultPendingMinMs: 300,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element not found')

createRoot(rootEl).render(
  <StrictMode>
    {/* LazyMotion + domAnimation: load only DOM animation features (~5kb) and use
        `m.*` components instead of the full `motion.*` bundle. MotionConfig
        reducedMotion="user" disables motion under the OS reduce-motion setting. */}
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <Suspense fallback={null}>
              <RouterProvider router={router} />
            </Suspense>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
)
