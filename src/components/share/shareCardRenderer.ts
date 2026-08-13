import type { Course, OutcomeTier } from '../../content/types'
import { formatRelativeScore } from '../../game/simulation/formatTier'
import type { SimulationResult } from '../../game/simulation/types'

export const SHARE_CARD_WIDTH = 1080
export const SHARE_CARD_HEIGHT = 1350

// Fixed hex colors (not CSS variables) so the exported image looks the same
// regardless of the viewer's device theme.
const TIER_COLOR: Record<OutcomeTier, string> = {
  hole_in_one: '#d4a017',
  eagle: '#d4a017',
  birdie: '#2e8b57',
  par: '#b8b8bd',
  bogey_plus: '#d1483f',
}

const GRID_COLUMNS = 6

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function renderShareCard(
  ctx: CanvasRenderingContext2D,
  course: Course,
  result: SimulationResult,
): void {
  const width = SHARE_CARD_WIDTH
  const height = SHARE_CARD_HEIGHT

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = '#1a1a1a'
  ctx.font = '600 48px system-ui, sans-serif'
  ctx.fillText(course.name, width / 2, 140)

  ctx.font = '700 60px system-ui, sans-serif'
  const headline = result.isBogeyFreeRound
    ? 'Bogey-free 18!'
    : `Bogey-free through hole ${result.bogeyFreeThroughHole}`
  ctx.fillText(headline, width / 2, 230)

  ctx.fillStyle = '#555555'
  ctx.font = '400 40px system-ui, sans-serif'
  ctx.fillText(`Total: ${formatRelativeScore(result.totalStrokesToPar)}`, width / 2, 290)

  const rows = Math.ceil(result.holeResults.length / GRID_COLUMNS)
  const gridWidth = 880
  const cellGap = 16
  const cellSize = (gridWidth - cellGap * (GRID_COLUMNS - 1)) / GRID_COLUMNS
  const gridHeight = rows * cellSize + (rows - 1) * cellGap
  const gridLeft = (width - gridWidth) / 2
  const gridTop = 400

  ctx.textBaseline = 'middle'
  result.holeResults.forEach((hole, i) => {
    const col = i % GRID_COLUMNS
    const row = Math.floor(i / GRID_COLUMNS)
    const x = gridLeft + col * (cellSize + cellGap)
    const y = gridTop + row * (cellSize + cellGap)

    ctx.fillStyle = TIER_COLOR[hole.outcomeTier]
    roundRect(ctx, x, y, cellSize, cellSize, 16)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 40px system-ui, sans-serif'
    ctx.fillText(String(hole.holeNumber), x + cellSize / 2, y + cellSize / 2 + 4)
  })
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = '#999999'
  ctx.font = '400 32px system-ui, sans-serif'
  ctx.fillText('Beating Bogey', width / 2, gridTop + gridHeight + 80)
}
