export enum FogMode {
  clear = "clear",
  shroud = "shroud",
}

export enum BrushShape {
  square = "square",
  circle = "circle",
}

type Vector2D = [number, number];

const setCompositeMode = (
  fogMode: FogMode,
  context: CanvasRenderingContext2D
): void => {
  switch (fogMode) {
    case FogMode.clear: {
      context.globalCompositeOperation = "destination-out";
      break;
    }
    case FogMode.shroud: {
      context.globalCompositeOperation = "source-over";
      break;
    }
  }
};

export const applyInitialFog = (
  fogMode: FogMode,
  brushShape: BrushShape,
  brushSize: number,
  coordinates: Vector2D,
  context: CanvasRenderingContext2D
) => {
  context.lineWidth = 2;
  setCompositeMode(fogMode, context);

  context.beginPath();
  switch (brushShape) {
    case BrushShape.circle: {
      context.arc(
        coordinates[0],
        coordinates[1],
        brushSize / 2,
        0,
        Math.PI * 2,
        true
      );
      break;
    }
    case BrushShape.square: {
      context.rect(
        coordinates[0] - brushSize / 2,
        coordinates[1] - brushSize / 2,
        brushSize,
        brushSize
      );
      break;
    }
  }
  context.fill();
};

export const applyFogRectangle = (
  fogMode: FogMode,
  p1: Vector2D,
  p2: Vector2D,
  context: CanvasRenderingContext2D
) => {
  setCompositeMode(fogMode, context);
  context.beginPath();
  context.rect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
  context.fill();
};

/**
 * Reveal/shroud an arbitrary set of polygons (one fill call, so a whole hex
 * region costs about the same as one rectangle).
 */
export const applyFogPolygons = (
  fogMode: FogMode,
  polygons: Array<Array<Vector2D>>,
  context: CanvasRenderingContext2D
) => {
  if (polygons.length === 0) {
    return;
  }
  setCompositeMode(fogMode, context);
  context.beginPath();
  for (const points of polygons) {
    context.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i][0], points[i][1]);
    }
    context.closePath();
  }
  context.fill();
};

export const midBetweenPoints = (
  point1: Vector2D,
  point2: Vector2D
): Vector2D => [
  point1[0] + (point2[0] - point1[0]) / 2,
  point1[1] + (point2[1] - point1[1]) / 2,
];

export const applyFog = (
  fogMode: FogMode,
  brushShape: BrushShape,
  brushSize: number,
  from: Vector2D,
  to: Vector2D,
  context: CanvasRenderingContext2D
) => {
  setCompositeMode(fogMode, context);
  switch (brushShape) {
    case BrushShape.circle: {
      // A capsule per segment: straight 'butt' line plus a filled circle at
      // each end. Individual wide round-cap strokes flatten degenerate
      // quadratics in a way that leaves 1px transparent seams on some
      // Chromium/Skia Linux rasterizers (vertical stripes in the player
      // view); plain lines and circle fills do not have that problem.
      context.lineWidth = brushSize;
      context.lineCap = "butt";
      context.beginPath();
      context.moveTo(from[0], from[1]);
      context.lineTo(to[0], to[1]);
      context.stroke();
      const radius = brushSize / 2;
      for (const [cx, cy] of [from, to]) {
        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.fill();
      }
      break;
    }
    case BrushShape.square: {
      // Stamp overlapping squares along the segment (half-brush spacing) so
      // fast pointer moves cannot leave uncovered columns between samples.
      // Overlapping rect fills are deterministic on every rasterizer, unlike
      // the rhombus-bridging geometry that left 1px transparent seams
      // (vertical stripes in the player view) on some Linux Chromium builds.
      context.beginPath();
      const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
      const stepCount = Math.max(1, Math.ceil(distance / (brushSize / 2)));
      for (let step = 0; step <= stepCount; step++) {
        const t = step / stepCount;
        const x = from[0] + (to[0] - from[0]) * t;
        const y = from[1] + (to[1] - from[1]) * t;
        context.fillRect(
          x - brushSize / 2,
          y - brushSize / 2,
          brushSize,
          brushSize
        );
      }
    }
  }
};

type SquareCoordinates2D = [Vector2D, Vector2D, Vector2D, Vector2D];

export const calculateSquareCoordinates = (
  center: Vector2D,
  width: number
): SquareCoordinates2D => {
  // Corners
  // 1 - bottom left
  // 2 - top left
  // 3 - top right
  // 4 - bottom right

  // Note: 0,0 starts in top left. Remember this when doing calculations for corners, the y axis calculations
  // need to be flipped vs bottom left orientation

  const r = width / 2;
  return [
    [center[0] - r, center[1] + r],
    [center[0] - r, center[1] - r],
    [center[0] + r, center[1] - r],
    [center[0] + r, center[1] + r],
  ];
};
