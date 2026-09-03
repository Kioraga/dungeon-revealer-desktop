import { axialToPoint, hexagonPoints, nearestCell } from "./hex-grid";

// Structural on purpose: relay fragment objects carry the generated GridType
// enum (which includes "%future added value"), while MapGridEntity uses the
// literal union. Only the string fields below are needed to draw.
export type DrawableGrid = {
  type: string;
  color: string | null | undefined;
  offsetX: number;
  offsetY: number;
  columnWidth: number;
  columnHeight: number;
};

const reduceOffsetToMinimum = (offset: number, sideLength: number): number => {
  const newOffset = offset - sideLength;
  if (newOffset > 0) {
    return reduceOffsetToMinimum(newOffset, sideLength);
  }
  return offset;
};

const drawSquareGridToContext = (
  grid: DrawableGrid,
  ratio: number,
  canvas: HTMLCanvasElement
) => {
  const context = canvas.getContext("2d");
  if (!context) {
    console.error("Could not create canvas context.");
    return;
  }
  context.strokeStyle = grid.color || "rgba(0, 0, 0, .5)";
  context.lineWidth = 2;

  const gridX = grid.offsetX * ratio;
  const gridY = grid.offsetY * ratio;
  const sideWidth = grid.columnWidth * ratio;
  const sideHeight = grid.columnHeight * ratio;

  const offsetX = reduceOffsetToMinimum(gridX, sideWidth);
  const offsetY = reduceOffsetToMinimum(gridY, sideHeight);

  for (let i = 0; i < canvas.width / sideWidth; i++) {
    context.beginPath();
    context.moveTo(offsetX + i * sideWidth, 0);
    context.lineTo(offsetX + i * sideWidth, canvas.height);
    context.stroke();
  }
  for (let i = 0; i < canvas.height / sideHeight; i++) {
    context.beginPath();
    context.moveTo(0, offsetY + i * sideHeight);
    context.lineTo(canvas.width, offsetY + i * sideHeight);
    context.stroke();
  }
};

const drawHexGridToContext = (
  grid: DrawableGrid,
  ratio: number,
  canvas: HTMLCanvasElement
) => {
  const context = canvas.getContext("2d");
  if (!context) {
    console.error("Could not create canvas context.");
    return;
  }
  const origin: [number, number] = [grid.offsetX * ratio, grid.offsetY * ratio];
  const size = grid.columnWidth * ratio;
  if (!Number.isFinite(size) || size <= 0) {
    return;
  }

  // q(x,y) and r(x,y) are linear; over the canvas rectangle their extremes
  // are reached at corners — all four, not just one diagonal pair (q min/max
  // sit on the opposite diagonal to r min/max). Sampling only two opposite
  // corners leaves a diagonal band.
  const corners: Array<[number, number]> = [
    [0, 0],
    [canvas.width, 0],
    [canvas.width, canvas.height],
    [0, canvas.height],
  ];
  const cells = corners.map((corner) => nearestCell(corner, origin, size));
  const qMin = Math.min(...cells.map((c) => c.q)) - 2;
  const qMax = Math.max(...cells.map((c) => c.q)) + 2;
  const rMin = Math.min(...cells.map((c) => c.r)) - 2;
  const rMax = Math.max(...cells.map((c) => c.r)) + 2;

  context.strokeStyle = grid.color || "rgba(0, 0, 0, .5)";
  context.lineWidth = 2;
  context.beginPath();
  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      const points = hexagonPoints(axialToPoint({ q, r }, origin, size), size);
      context.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        context.lineTo(points[i][0], points[i][1]);
      }
      context.closePath();
    }
  }
  context.stroke();
};

export const drawGridToContext = (
  grid: DrawableGrid,
  ratio: number,
  canvas: HTMLCanvasElement
) => {
  if (grid.type === "hex") {
    // shared edges stroked twice per hexagon → slightly stronger
    // alpha on inner seams; acceptable at the usual low grid alpha.
    drawHexGridToContext(grid, ratio, canvas);
    return;
  }
  drawSquareGridToContext(grid, ratio, canvas);
};
