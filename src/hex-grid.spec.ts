import {
  axialToPoint,
  nearestCell,
  axialRectBetween,
  hexagonPoints,
  snapPointToCellCenter,
} from "./hex-grid";

describe("hex-grid", () => {
  const origin: [number, number] = [123, 456];
  const size = 34;

  it("round-trips pixel -> axial -> pixel", () => {
    const cells = [
      { q: 0, r: 0 },
      { q: 5, r: -3 },
      { q: -4, r: 7 },
      { q: 100, r: -200 },
    ];
    for (const cell of cells) {
      const point = axialToPoint(cell, origin, size);
      expect(nearestCell(point, origin, size)).toEqual(cell);
    }
  });

  it("snaps an arbitrary point inside a cell to that cell", () => {
    // point slightly offset from the center of cell (1,1)
    const [x, y] = axialToPoint({ q: 1, r: 1 }, origin, size);
    expect(nearestCell([x + size * 0.2, y - size * 0.1], origin, size)).toEqual(
      { q: 1, r: 1 }
    );
  });

  it("axial rect contains the expected count", () => {
    const rect = axialRectBetween({ q: 0, r: 0 }, { q: 2, r: 1 });
    // cells with q in [0..2], r in [0..1] → 3 * 2
    expect((rect.qMax - rect.qMin + 1) * (rect.rMax - rect.rMin + 1)).toEqual(
      6
    );
  });

  it("hexagon points form a pointy-top hexagon", () => {
    const points = hexagonPoints([0, 0], 2);
    expect(points).toEqual([
      [0, -2],
      [Math.sqrt(3), -1],
      [Math.sqrt(3), 1],
      [0, 2],
      [-Math.sqrt(3), 1],
      [-Math.sqrt(3), -1],
    ]);
  });

  it("snaps a point to the center of a square cell", () => {
    const grid = {
      type: "square",
      offsetX: 100,
      offsetY: 200,
      columnWidth: 50,
      columnHeight: 40,
    };
    expect(snapPointToCellCenter([128, 218], grid)).toEqual([125, 220]);
    // negative cell indexes work too
    expect(snapPointToCellCenter([84, 182], grid)).toEqual([75, 180]);
  });

  it("snaps a point to the center of a hex cell", () => {
    const grid = {
      type: "hex",
      offsetX: 100,
      offsetY: 100,
      columnWidth: 30,
      columnHeight: 0,
    };
    const center = axialToPoint({ q: 3, r: -2 }, [100, 100], 30);
    expect(snapPointToCellCenter([center[0] + 5, center[1] - 3], grid)).toEqual(
      center
    );
  });
});
