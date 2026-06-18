// Type augmentation that makes t() keys type-safe and autocompletable, inferred
// from the English catalogs (the source of truth). A typo or stale key fails the
// typecheck. Adding a key to en/<ns>.json immediately makes it available to t().
import 'i18next'

import type { defaultNS, enResources } from './resources'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: typeof enResources
  }
}
