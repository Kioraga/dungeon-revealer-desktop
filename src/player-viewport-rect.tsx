import * as React from "react";
import type { MapControlInterface } from "./map-view";

export type PlayerView = {
  cx: number;
  cy: number;
  scale: number;
  rotation: number;
};

const MIN_SCALE = 1;
const MAX_SCALE = 20;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Viewport rectangle shown over the mirror's map overview. It represents the
 * player window's frame: drag moves the image center, corner handles resize
 * the zoom, the rotate toolbar button spins it. Its shape follows the player
 * window's own aspect ratio (reported over the socket), updating live on
 * resize, and it is free to grow and move beyond the map edges.
 */
export const PlayerViewportRect = ({
  mapId,
  controlRef,
  view,
  cap,
  onChange,
}: {
  mapId: string | null;
  controlRef: React.MutableRefObject<MapControlInterface | null>;
  view: PlayerView;
  cap: null | { capW: number; capH: number };
  onChange: (updates: Partial<PlayerView>) => void;
}): React.ReactElement => {
  const rectRef = React.useRef<HTMLDivElement | null>(null);
  const viewRef = React.useRef(view);
  viewRef.current = view;
  const capRef = React.useRef(cap);
  capRef.current = cap;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  // One-time centering of the player view once the map image is available.
  const initializedRef = React.useRef(false);
  React.useEffect(() => {
    initializedRef.current = false;
  }, [mapId]);

  // Keep the rectangle glued to the map while the mirror camera moves.
  React.useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = rectRef.current;
      const ctx = controlRef.current?.getContext();
      if (el && ctx) {
        const v = viewRef.current;
        if (initializedRef.current === false && v.cx === 0 && v.cy === 0) {
          initializedRef.current = true;
          onChangeRef.current({
            cx: ctx.mapImage.naturalWidth / 2,
            cy: ctx.mapImage.naturalHeight / 2,
          });
        }
        if (v.cx === 0 && v.cy === 0) {
          // Wait one frame for the centered view to propagate.
          el.style.visibility = "hidden";
          raf = requestAnimationFrame(update);
          return;
        }
        el.style.visibility = "visible";
        const [posX, posY] = ctx.mapState.position.get();
        const [scale] = ctx.mapState.scale.get();
        const factor = ctx.viewport.factor;
        const k = ctx.helper.size.fromImageToThree(1);
        // Window frame in image px (the player reports it; fall back to the
        // mirror's own viewport before the first report). Never clamped to the
        // map so the frame can extend beyond it.
        const capW = capRef.current?.capW ?? ctx.viewport.width / k;
        const capH = capRef.current?.capH ?? ctx.viewport.height / k;
        const hw = capW / (2 * v.scale);
        const hh = capH / (2 * v.scale);
        const [ux, uy] = ctx.helper.imageCoordinatesToThreePoint([v.cx, v.cy]);
        const wx = posX + scale * ux;
        const wy = posY + scale * uy;
        const sx = (wx + ctx.viewport.width / 2) * factor;
        const sy = (ctx.viewport.height / 2 - wy) * factor;
        const pxPerImage = k * scale * factor;
        el.style.width = `${2 * hw * pxPerImage}px`;
        el.style.height = `${2 * hh * pxPerImage}px`;
        // rotate(-rotation): the map rotates clockwise in the player window,
        // so the window frame's top on the mirror points the other way.
        el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%) rotate(${-v.rotation}deg)`;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [controlRef]);

  const dragStateRef = React.useRef<null | {
    mode: "pan" | "resize";
    startX: number;
    startY: number;
    startView: PlayerView;
    centerX: number;
    centerY: number;
  }>(null);

  const onPointerDown =
    (mode: "pan" | "resize") => (ev: React.PointerEvent) => {
      if (ev.button === 1) {
        // Middle button: let the map's window-level middle-pan handle it (same
        // as the wheel). Without stopPropagation/preventDefault the event
        // bubbles to the map surface handler, which pan the mirror instead of
        // moving this rectangle.
        return;
      }
      ev.stopPropagation();
      ev.preventDefault();
      const ctx = controlRef.current?.getContext();
      let centerX = 0;
      let centerY = 0;
      if (ctx) {
        const [posX, posY] = ctx.mapState.position.get();
        const [scale] = ctx.mapState.scale.get();
        const [ux, uy] = ctx.helper.imageCoordinatesToThreePoint([
          viewRef.current.cx,
          viewRef.current.cy,
        ]);
        centerX =
          (posX + scale * ux + ctx.viewport.width / 2) * ctx.viewport.factor;
        centerY =
          (ctx.viewport.height / 2 - (posY + scale * uy)) * ctx.viewport.factor;
      }
      dragStateRef.current = {
        mode,
        startX: ev.clientX,
        startY: ev.clientY,
        startView: { ...viewRef.current },
        centerX,
        centerY,
      };
      ev.currentTarget.setPointerCapture(ev.pointerId);
    };

  const onPointerMove = (ev: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const ctx = controlRef.current?.getContext();
    if (!ctx) return;
    const [scale] = ctx.mapState.scale.get();
    const pxPerImage =
      ctx.helper.size.fromImageToThree(1) * scale * ctx.viewport.factor;
    const dx = (ev.clientX - drag.startX) / pxPerImage;
    const dy = (ev.clientY - drag.startY) / pxPerImage;

    if (drag.mode === "pan") {
      // The rect center maps to screen without any rotation (the mirror map is
      // north-up; the CSS rotation is purely visual), so panning follows the
      // mouse 1:1 regardless of rotation. Unclamped: the frame may move beyond
      // the map edges.
      onChangeRef.current({
        cx: drag.startView.cx + dx,
        cy: drag.startView.cy + dy,
      });
    } else {
      const startDist = Math.max(
        1,
        Math.hypot(drag.startX - drag.centerX, drag.startY - drag.centerY)
      );
      const dist = Math.max(
        1,
        Math.hypot(ev.clientX - drag.centerX, ev.clientY - drag.centerY)
      );
      onChangeRef.current({
        scale: clamp(
          drag.startView.scale * (startDist / dist),
          MIN_SCALE,
          MAX_SCALE
        ),
      });
    }
  };

  const onPointerUp = () => {
    dragStateRef.current = null;
  };

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        ref={rectRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          pointerEvents: "auto",
          border: "2px solid rgba(255, 255, 255, 0.95)",
          boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.4)",
          cursor: "move",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown("pan")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          style={{
            position: "absolute",
            top: -16,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderBottom: "11px solid var(--color-accent)",
            pointerEvents: "none",
          }}
        />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              background: "#ffffff",
              border: "2px solid #044e54",
              borderRadius: 3,
              cursor: i % 2 === 0 ? "nwse-resize" : "nesw-resize",
              ...(i === 0
                ? { top: -7, left: -7 }
                : i === 1
                ? { top: -7, right: -7 }
                : i === 2
                ? { bottom: -7, left: -7 }
                : { bottom: -7, right: -7 }),
            }}
            onPointerDown={onPointerDown("resize")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ))}
      </div>
    </div>
  );
};
