export type LabColor = {
  L: number
  a: number
  b: number
}

export type PhotoMeta = {
  id: string
  filename: string
  src?: string
  width: number
  height: number
  dominantColor: string
  lab: LabColor
  uploadedAt: string
}

export type GridConfig = {
  cols: number
  rows: number
}

export type Cell = {
  photoId: string
  x: number
  y: number
  spanX: number
  spanY: number
}

export type LayoutData = {
  grid: GridConfig
  cells: Cell[]
  version: number
  updatedAt: string
}
