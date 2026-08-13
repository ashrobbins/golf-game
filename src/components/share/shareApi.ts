export type ShareOutcome = 'shared' | 'copied' | 'downloaded' | 'cancelled' | 'failed'

interface ShareOptions {
  title: string
  text: string
  fileName: string
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Tries the native share sheet first, then clipboard-image copy, then falls
// back to a plain download — every browser gets a working share action even
// without Web Share API support.
export async function shareCanvasImage(
  canvas: HTMLCanvasElement,
  { title, text, fileName }: ShareOptions,
): Promise<ShareOutcome> {
  const blob = await canvasToBlob(canvas)
  if (!blob) return 'failed'

  const file = new File([blob], fileName, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
      // Fall through to the next fallback on any other share failure.
    }
  }

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      return 'copied'
    } catch {
      // Fall through to download.
    }
  }

  downloadBlob(blob, fileName)
  return 'downloaded'
}
