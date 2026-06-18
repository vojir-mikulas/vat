import { useEffect, useState } from 'react'

import { readFileBytes } from '@/lib/file-bytes'

interface FileResultState<T> {
  result: T | null
  error: string | null
}

// Reads a file's bytes and runs an async transform, exposing the result (or
// error). `fn` must be stable (a module-level function), since the effect keys on
// the file alone. State only updates after the async work resolves — no
// synchronous setState in the effect body.
export function useFileResult<T>(
  file: File | null,
  fn: (bytes: Uint8Array) => Promise<T>,
): FileResultState<T> {
  const [state, setState] = useState<FileResultState<T>>({ result: null, error: null })

  useEffect(() => {
    if (!file) return
    let active = true
    readFileBytes(file)
      .then(fn)
      .then((result) => {
        if (active) setState({ result, error: null })
      })
      .catch((e: unknown) => {
        if (active) setState({ result: null, error: e instanceof Error ? e.message : 'Failed' })
      })
    return () => {
      active = false
    }
    // `fn` is expected to be a stable module-level function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  return state
}
