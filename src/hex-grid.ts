// Pointy-top hex lattice math, domain-agnostic (2D coordinates with the same
// linear basis as the caller: canvas px, image px or three-space all work as
// long as origin + size are expressed in that domain).
// squares degenerate (columnHeight ignored, size = circumradius).

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

type AxisRect = { x: number; y: number; width: number; height: number };

const cross = (a: Point2, b: Point2, c: Point2): number =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

// Convex polygon (CW or CCW), boundary counts as inside.
const pointInConvexPolygon = (p: Point2, polygon: Point2[]): boolean => {
  let hasPos = false;
  let hasNeg = false;
  for (let i = 0; i < polygon.length; i++) {
    const c = cross(polygon[i], polygon[(i + 1) % polygon.length], p);
    if (c > 0) hasPos = true;
    if (c < 0) hasNeg = true;
  }
  return !(hasPos && hasNeg);
};

// Strict crossing (vertex-on-edge overlaps are caught by the containment
// tests in polygonOverlapsRect).
const segmentsCross = (a: Point2, b: Point2, c: Point2, d: Point2): boolean =>
  cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;

const polygonOverlapsRect = (polygon: Point2[], rect: AxisRect): boolean => {
  const x1 = rect.x;
  const x2 = rect.x + rect.width;
  const y1 = rect.y;
  const y2 = rect.y + rect.height;
  const inRect = (p: Point2): boolean =>
    p[0] >= x1 && p[0] <= x2 && p[1] >= y1 && p[1] <= y2;
  if (polygon.some(inRect)) {
    return true;
  }
  const corners: Point2[] = [
    [x1, y1],
    [x2, y1],
    [x2, y2],
    [x1, y2],
  ];
  if (corners.some((corner) => pointInConvexPolygon(corner, polygon))) {
    return true;
  }
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    for (let j = 0; j < 4; j++) {
      if (segmentsCross(a, b, corners[j], corners[(j + 1) % 4])) {
        return true;
      }
    }
  }
  return false;
};

/**
 * All axial cells whose hexagon overlaps the axis-aligned rectangle spanned
 * by the two image-space points. Unlike axialRectBetween (which yields the
 * axial parallelogram between two corner cells) this tracks the actual drag
 * rectangle, so the selected region mirrors the visible selection box.
 * candidates = axial bounds of the 4 rect corners; every point of
 * the rect maps inside those bounds because axial coords are affine, so no
 * intersecting cell is missed.
 */
export const axialCellsOverlappingRect = (
  from: Point2,
  to: Point2,
  origin: Point2,
  size: number,
  maxCells = 4000
): Axial[] => {
  const xMin = Math.min(from[0], to[0]);
  const xMax = Math.max(from[0], to[0]);
  const yMin = Math.min(from[1], to[1]);
  const yMax = Math.max(from[1], to[1]);
  if (xMin === xMax && yMin === yMax) {
    return [nearestCell(from, origin, size)];
  }
  const corners: Point2[] = [
    [xMin, yMin],
    [xMax, yMin],
    [xMax, yMax],
    [xMin, yMax],
  ];
  const cornerCells = corners.map((corner) =>
    nearestCell(corner, origin, size)
  );
  const qMin = Math.min(...cornerCells.map((cell) => cell.q));
  const qMax = Math.max(...cornerCells.map((cell) => cell.q));
  const rMin = Math.min(...cornerCells.map((cell) => cell.r));
  const rMax = Math.max(...cornerCells.map((cell) => cell.r));
  if ((qMax - qMin + 1) * (rMax - rMin + 1) > maxCells) {
    return [];
  }
  const rect: AxisRect = {
    x: xMin,
    y: yMin,
    width: xMax - xMin,
    height: yMax - yMin,
  };
  const result: Axial[] = [];
  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      const polygon = hexagonPoints(axialToPoint({ q, r }, origin, size), size);
      if (polygonOverlapsRect(polygon, rect)) {
        result.push({ q, r });
      }
    }
  }
  return result;
};

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
