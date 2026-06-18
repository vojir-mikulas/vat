import { useEffect, useMemo } from 'react'

// Create an object URL for a file and revoke it when the file changes or the
// component unmounts. Computed in useMemo (not effect+setState) so there's no
// synchronous state update on file change.
export function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  return url
}
