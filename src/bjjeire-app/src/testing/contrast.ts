/** WCAG contrast helpers for browser tests, which read real computed colours. */
export type Rgba = [number, number, number, number]

export function parseColour(value: string): Rgba {
  // The canvas normalises oklch, color-mix and rgb() into one readable form.
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('no canvas')
  }
  context.fillStyle = value
  context.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data
  return [r, g, b, a / 255]
}

export function over(top: Rgba, under: Rgba): Rgba {
  const a = top[3]
  return [
    top[0] * a + under[0] * (1 - a),
    top[1] * a + under[1] * (1 - a),
    top[2] * a + under[2] * (1 - a),
    1,
  ]
}

function luminance([r, g, b]: Rgba): number {
  const [lr = 0, lg = 0, lb = 0] = [r, g, b].map(channel => {
    const s = channel / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

export function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (hi + 0.05) / (lo + 0.05)
}
