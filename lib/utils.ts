import { clsx, type ClassValue } from "clsx"
import getStroke from "perfect-freehand"
import { twMerge } from "tailwind-merge"

import {
  Camera,
  Color,
  Layer,
  LayerType,
  PathLayer,
  Point,
  Side,
  XYWH,
} from "@/types/canvas"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function colorToCss(color: Color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}

const COLORS = [
  "#DC2626",
  "#D97706",
  "#059669",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#0891B2",
  "#65A30D",
]

export function connectionIdToColor(connectionId: number) {
  return COLORS[connectionId % COLORS.length]
}

export function pointerEventToCanvasPoint(
  e: React.PointerEvent,
  camera: Camera,
) {
  return {
    x: Math.round(e.clientX) - camera.x,
    y: Math.round(e.clientY) - camera.y,
  }
}

export function resizeBounds(
  bounds: XYWH,
  corner: Side,
  point: Point,
): XYWH {
  const result = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  }

  if ((corner & Side.Left) === Side.Left) {
    result.x = Math.min(point.x, bounds.x + bounds.width)
    result.width = Math.abs(bounds.x + bounds.width - point.x)
  }

  if ((corner & Side.Right) === Side.Right) {
    result.x = Math.min(point.x, bounds.x)
    result.width = Math.abs(point.x - bounds.x)
  }

  if ((corner & Side.Top) === Side.Top) {
    result.y = Math.min(point.y, bounds.y + bounds.height)
    result.height = Math.abs(bounds.y + bounds.height - point.y)
  }

  if ((corner & Side.Bottom) === Side.Bottom) {
    result.y = Math.min(point.y, bounds.y)
    result.height = Math.abs(point.y - bounds.y)
  }

  return result
}

export function findIntersectingLayersWithRectangle(
  layerIds: readonly string[],
  layers: {
    get: (key: string) => Layer | { toJSON: () => Layer } | undefined
  },
  a: Point,
  b: Point,
) {
  const rect = {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }

  const ids: string[] = []

  for (const layerId of layerIds) {
    const layer = layers.get(layerId)

    if (!layer) {
      continue
    }

    const liveLayer = "toJSON" in layer ? layer.toJSON() : layer
    const { x, y, width, height } = liveLayer

    if (
      rect.x + rect.width > x &&
      rect.x < x + width &&
      rect.y + rect.height > y &&
      rect.y < y + height
    ) {
      ids.push(layerId)
    }
  }

  return ids
}

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) {
    return ""
  }

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ["M", ...stroke[0], "Q"] as (string | number)[],
  )

  d.push("Z")
  return d.join(" ")
}

export function getStrokePath(points: number[][]) {
  return getSvgPathFromStroke(
    getStroke(points, {
      size: 16,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    }),
  )
}

export function penPointsToPathLayer(
  points: [x: number, y: number, pressure: number][],
  color: Color,
): PathLayer {
  const x = Math.min(...points.map(([pointX]) => pointX))
  const y = Math.min(...points.map(([, pointY]) => pointY))
  const width = Math.max(...points.map(([pointX]) => pointX)) - x
  const height = Math.max(...points.map(([, pointY]) => pointY)) - y

  return {
    type: LayerType.Path,
    x,
    y,
    width,
    height,
    fill: color,
    points: points.map(([pointX, pointY, pressure]) => [
      pointX - x,
      pointY - y,
      pressure,
    ]),
  }
}

export function getContrastingTextColor(color: Color) {
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000
  return brightness > 125 ? "black" : "white"
}
