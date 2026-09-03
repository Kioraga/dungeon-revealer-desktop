// Pointy-top hex lattice math, domain-agnostic (2D coordinates with the same
// linear basis as the caller: canvas px, image px or three-space all work as
// long as origin + size are expressed in that domain).
// ponytail: squares degenerate (columnHeight ignored, size = circumradius).

export type Axial = { readonly q: number; readonly r: number };
export type Point2 = [number, number];

const SQRT3 = Math.sqrt(3);

export const axialToPoint = (
  { q, r }: Axial,
  origin: Point2,
  size: number
): Point2 => [
  origin[0] + size * (SQRT3 * q + (SQRT3 / 2) * r),
  origin[1] + size * ((3 / 2) * r),
];

const cubeRound = (q: number, r: number): Axial => {
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(-q - r);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - (-q - r));
  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
};

export const nearestCell = (
  point: Point2,
  origin: Point2,
  size: number
): Axial => {
  const x = (point[0] - origin[0]) / size;
  const y = (point[1] - origin[1]) / size;
  return cubeRound((SQRT3 / 3) * x - (1 / 3) * y, (2 / 3) * y);
};

export const hexagonPoints = (center: Point2, size: number): Array<Point2> => {
  const [cx, cy] = center;
  return [
    [cx, cy - size],
    [cx + (SQRT3 / 2) * size, cy - size / 2],
    [cx + (SQRT3 / 2) * size, cy + size / 2],
    [cx, cy + size],
    [cx - (SQRT3 / 2) * size, cy + size / 2],
    [cx - (SQRT3 / 2) * size, cy - size / 2],
  ];
};

export const axialRectBetween = (a: Axial, b: Axial) => ({
  qMin: Math.min(a.q, b.q),
  qMax: Math.max(a.q, b.q),
  rMin: Math.min(a.r, b.r),
  rMax: Math.max(a.r, b.r),
});

// A grid as mirrored from map data (image-px coordinates). ColumnWidth is the
// hex circumradius for type "hex".
export type GridParams = {
  type: "square" | "hex" | string;
  offsetX: number;
  offsetY: number;
  columnWidth: number;
  columnHeight: number;
};

/**
 * Snap an image-px point to the center of the grid cell that contains it
 * (square cells or hexagons).
 */
export const snapPointToCellCenter = (
  point: Point2,
  grid: GridParams
): Point2 => {
  if (grid.type === "hex") {
    const origin: Point2 = [grid.offsetX, grid.offsetY];
    return axialToPoint(
      nearestCell(point, origin, grid.columnWidth),
      origin,
      grid.columnWidth
    );
  }
  const col = Math.round((point[0] - grid.offsetX) / grid.columnWidth - 0.5);
  const row = Math.round((point[1] - grid.offsetY) / grid.columnHeight - 0.5);
  return [
    grid.offsetX + (col + 0.5) * grid.columnWidth,
    grid.offsetY + (row + 0.5) * grid.columnHeight,
  ];
};
