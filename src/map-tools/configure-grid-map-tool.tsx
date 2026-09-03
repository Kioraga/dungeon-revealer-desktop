import * as React from "react";
import * as THREE from "three";
import { usePinchWheelZoom } from "./drag-pan-zoom-map-tool";
import type { MapTool, SharedMapToolState } from "./map-tool";
import { ThreeLine } from "../three-line";
import { Rectangle } from "./area-select-map-tool";
import { drawGridToContext } from "../grid-draw";
import type { GridType } from "../map-typings";

export type ConfigureMapToolState = {
  type: GridType;
  snapTokensToGrid: boolean;
  offsetY: number;
  offsetX: number;
  columnWidth: number;
  columnHeight: number;
};

type ConfigureGridMapToolContextValue = {
  state: ConfigureMapToolState;
  setState: React.Dispatch<React.SetStateAction<ConfigureMapToolState>>;
};

export const ConfigureGridMapToolContext =
  React.createContext<ConfigureGridMapToolContextValue>(undefined as any);

const HexGridOverlay = (props: {
  mapContext: SharedMapToolState;
  state: ConfigureMapToolState;
}): React.ReactElement => {
  const [canvas] = React.useState(() =>
    window.document.createElement("canvas")
  );
  const [texture] = React.useState(() => new THREE.CanvasTexture(canvas));

  React.useEffect(() => {
    canvas.width = props.mapContext.mapCanvas.width;
    canvas.height = props.mapContext.mapCanvas.height;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGridToContext(
      {
        type: "hex",
        color: "red",
        offsetX: props.state.offsetX,
        offsetY: props.state.offsetY,
        columnWidth: props.state.columnWidth,
        columnHeight: props.state.columnHeight,
      },
      props.mapContext.ratio,
      canvas
    );
    texture.needsUpdate = true;
  }, [
    canvas,
    texture,
    props.state.offsetX,
    props.state.offsetY,
    props.state.columnWidth,
    props.mapContext,
  ]);

  return (
    <mesh position={[0, 0, 0.1]}>
      <planeBufferGeometry
        attach="geometry"
        args={[
          props.mapContext.dimensions.width,
          props.mapContext.dimensions.height,
        ]}
      />
      <meshBasicMaterial
        attach="material"
        map={texture}
        transparent={true}
        depthTest={false}
      />
    </mesh>
  );
};

export const ConfigureGridMapTool: MapTool = {
  id: "configure-grid-map-tool",
  Component: (props) => {
    const configureGridContext = React.useContext(ConfigureGridMapToolContext);
    usePinchWheelZoom(props.mapContext);
    props.useMapGesture({
      onDrag: ({ delta, movement, memo, event }) => {
        event.stopPropagation();

        if (props.mapContext.isAltPressed) {
          configureGridContext.setState((state) => ({
            ...state,
            offsetX: state.offsetX + delta[0],
            offsetY: state.offsetY + delta[1],
          }));
        } else {
          memo = memo ?? props.mapContext.mapState.position.get();
          props.mapContext.setMapState({
            position: [
              memo[0] + movement[0] / props.mapContext.viewport.factor,
              memo[1] - movement[1] / props.mapContext.viewport.factor,
              0,
            ],
            immediate: true,
          });
          return memo;
        }
      },
    });

    const [offsetX, offsetY] =
      props.mapContext.helper.coordinates.canvasToThree(
        props.mapContext.helper.coordinates.imageToCanvas([
          configureGridContext.state.offsetX,
          configureGridContext.state.offsetY,
        ])
      );

    const [columnWidth, columnHeight] =
      props.mapContext.helper.vector.canvasToThree(
        props.mapContext.helper.vector.imageToCanvas([
          configureGridContext.state.columnWidth,
          configureGridContext.state.columnHeight,
        ])
      );

    if (configureGridContext.state.type === "hex") {
      return (
        <HexGridOverlay
          mapContext={props.mapContext}
          state={configureGridContext.state}
        />
      );
    }

    return (
      <>
        <CompleteGrid
          position={[offsetX + columnWidth, offsetY - columnHeight, 0]}
          columnWidth={columnWidth}
          columnHeight={columnHeight}
          dimensions={props.mapContext.dimensions}
        />
        <Rectangle
          p1={[offsetX, offsetY, 0]}
          p2={[offsetX + columnWidth, offsetY - columnHeight, 0]}
          borderColor="red"
        />
      </>
    );
  },
};

const CompleteGrid = (props: {
  position: [number, number, number];
  columnHeight: number;
  columnWidth: number;
  dimensions: {
    width: number;
    height: number;
  };
}): React.ReactElement => {
  return React.useMemo(() => {
    const elements: React.ReactElement[] = [];
    let currentY = props.position[1] - props.columnHeight;

    const lineWidth = 0.1;
    const gridColor = "red";
    let i = 0;

    do {
      i++;
      elements.push(
        <ThreeLine
          key={String(i)}
          points={[
            [(-1 * props.dimensions.width) / 2, currentY, 0],
            [props.dimensions.width / 2, currentY, 0],
          ]}
          lineWidth={lineWidth}
          color={gridColor}
        />
      );
      currentY = currentY - props.columnHeight;
    } while (currentY > (-1 * props.dimensions.height) / 2);

    currentY = props.position[1] - props.columnHeight;

    do {
      i++;
      elements.push(
        <ThreeLine
          key={String(i)}
          points={[
            [(-1 * props.dimensions.width) / 2, currentY, 0],
            [props.dimensions.width / 2, currentY, 0],
          ]}
          lineWidth={lineWidth}
          color={gridColor}
        />
      );
      currentY = currentY + props.columnHeight;
    } while (currentY < props.dimensions.height / 2);

    let currentX = props.position[0] - props.columnWidth;
    do {
      i++;
      elements.push(
        <ThreeLine
          key={String(i)}
          points={[
            [currentX, (-1 * props.dimensions.height) / 2, 0],
            [currentX, props.dimensions.height / 2, 0],
          ]}
          lineWidth={lineWidth}
          color={gridColor}
        />
      );
      currentX = currentX - props.columnWidth;
    } while (currentX > (-1 * props.dimensions.width) / 2);

    currentX = props.position[0] - props.columnWidth;

    do {
      i++;
      elements.push(
        <ThreeLine
          key={String(i)}
          points={[
            [currentX, (-1 * props.dimensions.height) / 2, 0],
            [currentX, props.dimensions.height / 2, 0],
          ]}
          lineWidth={lineWidth}
          color={gridColor}
        />
      );
      currentX = currentX + props.columnWidth;
    } while (currentX < props.dimensions.width / 2);

    return <>{elements}</>;
  }, [props.columnWidth, props.columnHeight, props.dimensions, props.position]);
};
