import { useEffect, useRef, useState } from 'react'

import {
  loadImageFromFile,
  processImage,
  type ProcessOptions,
  type ProcessResult,
} from '@/lib/image'

interface ProcessState {
  result: ProcessResult | null
  error: string | null
}

// Runs processImage() whenever the file or options change, and manages the result
// object-URL lifecycle (revoking the previous one) so previews don't leak. Avoids
// any synchronous setState in the effect body — state only updates once the async
// encode resolves.
export function useImageProcess(file: File | null, opts: ProcessOptions): ProcessState {
  const [state, setState] = useState<ProcessState>({ result: null, error: null })
  const lastUrl = useRef<string | null>(null)
  const key = JSON.stringify(opts)

  useEffect(() => {
    if (!file) return
    let active = true
    processImage(file, opts)
      .then((result) => {
        if (!active) {
          URL.revokeObjectURL(result.url)
          return
        }
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current)
        lastUrl.current = result.url
        setState({ result, error: null })
      })
      .catch((e: unknown) => {
        if (active) setState({ result: null, error: e instanceof Error ? e.message : 'Failed' })
      })
    return () => {
      active = false
    }
    // `opts` is captured via its serialized `key`; depending on the object itself
    // would re-run every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, key])

  // Revoke the final preview URL when the tool unmounts.
  useEffect(() => () => void (lastUrl.current && URL.revokeObjectURL(lastUrl.current)), [])

  return state
}

interface ImageDimensions {
  naturalWidth: number
  naturalHeight: number
}

// Loads a file's intrinsic dimensions (needed before processing, e.g. to seed
// resize/crop inputs). Returns null until the image has decoded.
export function useImageInfo(file: File | null): ImageDimensions | null {
  const [info, setInfo] = useState<ImageDimensions | null>(null)

  useEffect(() => {
    if (!file) {
      return
    }
    let active = true
    void loadImageFromFile(file).then((img) => {
      if (active) setInfo({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight })
    })
    return () => {
      active = false
    }
  }, [file])

  return info
}
