import * as React from "react";
import useAsyncEffect from "@n1ru4l/use-async-effect";
import { ReactRelayContext, useMutation, useQuery } from "relay-hooks";
import graphql from "babel-plugin-relay/macro";
import styled from "@emotion/styled/macro";
import { Toolbar } from "./toolbar";
import * as Icon from "./feather-icons";
import { SplashScreen } from "./splash-screen";
import { AuthenticationScreen } from "./authentication-screen";
import { buildApiUrl } from "./public-url";
import { AuthenticatedAppShell } from "./authenticated-app-shell";
import { useSocket } from "./socket";
import { animated, useSpring, to } from "react-spring";
import { MapControlInterface } from "./map-view";
import { useGesture } from "react-use-gesture";
import { randomHash } from "./utilities/random-hash";
import { useWindowDimensions } from "./hooks/use-window-dimensions";
import { usePersistedState } from "./hooks/use-persisted-state";
import { PlayerMapTool } from "./map-tools/player-map-tool";
import {
  ComponentWithPropsTuple,
  FlatContextProvider,
} from "./flat-context-provider";
import { MarkAreaToolContext } from "./map-tools/mark-area-map-tool";
import { NoteWindowActionsContext } from "./dm-area/token-info-aside";
import { playerArea_PlayerMap_ActiveMapQuery } from "./__generated__/playerArea_PlayerMap_ActiveMapQuery.graphql";
import { playerArea_MapPingMutation } from "./__generated__/playerArea_MapPingMutation.graphql";
import { UpdateTokenContext } from "./update-token-context";
import { LazyLoadedMapView } from "./lazy-loaded-map-view";
import { IsDungeonMasterContext } from "./is-dungeon-master-context";
import type { mapView_MapFragment$key } from "./__generated__/mapView_MapFragment.graphql";
import { PlayerViewportRect } from "./player-viewport-rect";
import type { PlayerView } from "./player-viewport-rect";
import { useI18n, I18nContext } from "./i18n";

const ToolbarContainer = styled(animated.div)`
  position: absolute;
  display: flex;
  justify-content: center;
  pointer-events: none;
  user-select: none;
  top: 0;
  left: 0;
`;

const AbsoluteFullscreenContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const createCacheBusterString = () =>
  encodeURIComponent(`${Date.now()}_${randomHash()}`);

const PlayerMap_ActiveMapQuery = graphql`
  query playerArea_PlayerMap_ActiveMapQuery @live {
    activeMap {
      id
      ...mapView_MapFragment
    }
  }
`;

const MapPingMutation = graphql`
  mutation playerArea_MapPingMutation($input: MapPingInput!) {
    mapPing(input: $input)
  }
`;

export const PlayerMapView = ({
  map,
  mapId,
  fetch,
  socket,
  isMapOnly,
}: {
  map: mapView_MapFragment$key | null;
  mapId: string | null;
  fetch: typeof window.fetch;
  socket: ReturnType<typeof useSocket>;
  isMapOnly: boolean;
}) => {
  const { t } = useI18n();
  const [mapPing] = useMutation<playerArea_MapPingMutation>(MapPingMutation);

  const showSplashScreen = map === null;

  const controlRef = React.useRef<MapControlInterface | null>(null);

  // Player-window view (image center + zoom + rotation), independent of the
  // mirror camera: the DM drives the player window via the viewport rectangle.
  const [playerView, setPlayerView] = React.useState<PlayerView>({
    cx: 0,
    cy: 0,
    scale: 1,
    rotation: 0,
  });

  // Reset to full-map fit when the map changes (the rectangle re-initializes cx/cy).
  React.useEffect(() => {
    setPlayerView({ cx: 0, cy: 0, scale: 1, rotation: 0 });
  }, [mapId]);

  // Player window (mirror): apply camera state broadcast by the DM window.
  React.useEffect(() => {
    if (!isMapOnly) return;
    const listener = (payload: {
      cx?: number;
      cy?: number;
      scale?: number;
      rotation?: number;
    }) => {
      if (
        payload?.cx == null ||
        payload?.cy == null ||
        payload?.scale == null
      ) {
        return;
      }
      const ctx = controlRef.current?.getContext();
      if (!ctx) return;
      const [tx, ty] = ctx.helper.imageCoordinatesToThreePoint([
        payload.cx,
        payload.cy,
      ]);
      // Rotate the center offset with the same transform the plane applies, so
      // the player window shows the map rotated exactly like the DM rectangle.
      const rotation = payload.rotation ?? 0;
      const radians = (rotation * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      const rx = cos * tx + sin * ty;
      const ry = -sin * tx + cos * ty;
      ctx.setMapState({
        position: [-rx * payload.scale, -ry * payload.scale, 0],
        scale: [payload.scale, payload.scale, 1],
        rotation: [0, 0, -radians] as [number, number, number],
        immediate: true,
      });
    };
    socket.on("viewState", listener);
    return () => {
      socket.off("viewState", listener);
    };
  }, [socket, isMapOnly, mapId]);

  // DM window (Player tab, mirror): publish the player-window view so the
  // player window follows the viewport rectangle.
  React.useEffect(() => {
    if (isMapOnly) return;
    if (playerView.cx === 0 && playerView.cy === 0) {
      return; // not initialized yet (waiting for the map image)
    }
    socket.emit("viewState", playerView);
  }, [socket, isMapOnly, playerView]);

  // Periodic resync so a player window that connects after the view changed
  // still catches up.
  const playerViewRef = React.useRef(playerView);
  playerViewRef.current = playerView;
  React.useEffect(() => {
    if (isMapOnly) return;
    if (playerView.cx === 0 && playerView.cy === 0) {
      return;
    }
    const interval = setInterval(() => {
      socket.emit("viewState", playerViewRef.current);
    }, 250);
    return () => clearInterval(interval);
  }, [socket, isMapOnly, playerView]);

  // DM mirror: remember the player window's viewport (image px) so the
  // viewport rectangle keeps the window's shape, updating on window resize.
  const [playerCap, setPlayerCap] = React.useState<null | {
    capW: number;
    capH: number;
  }>(null);
  React.useEffect(() => {
    if (isMapOnly) return;
    const listener = (payload: { capW?: number; capH?: number }) => {
      if (payload?.capW && payload?.capH) {
        setPlayerCap({ capW: payload.capW, capH: payload.capH });
      }
    };
    socket.on("playerViewport", listener);
    return () => {
      socket.off("playerViewport", listener);
    };
  }, [socket, isMapOnly]);

  // Player window: report the viewport size (image px) so the DM mirror can
  // draw the viewport rectangle with the window's shape.
  React.useEffect(() => {
    if (!isMapOnly) return;
    let lastKey = "";
    const report = () => {
      const ctx = controlRef.current?.getContext();
      if (!ctx) return;
      const k = ctx.helper.size.fromImageToThree(1);
      if (!k) return;
      const capW = ctx.viewport.width / k;
      const capH = ctx.viewport.height / k;
      const key = `${capW.toFixed(2)},${capH.toFixed(2)}`;
      if (key === lastKey) return;
      lastKey = key;
      socket.emit("playerViewport", { capW, capH });
    };
    const interval = setInterval(report, 250);
    window.addEventListener("resize", report);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", report);
    };
  }, [socket, isMapOnly]);

  React.useEffect(() => {
    const contextmenuListener = (ev: Event) => {
      ev.preventDefault();
    };
    return () => {
      window.addEventListener("contextmenu", contextmenuListener);
      window.removeEventListener("contextmenu", contextmenuListener);
    };
  }, []);

  const updateToken = React.useCallback(
    ({ id, ...updates }) => {
      // The player window is view-only; the DM drives all token movement.
      if (isMapOnly || !map || !mapId) {
        return;
      }
      fetch(`/map/${mapId}/token/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updates,
          socketId: socket.id,
        }),
      });
    },
    [map, fetch, isMapOnly, socket.id]
  );

  const [toolbarPosition, setToolbarPosition] = useSpring(() => ({
    position: [12, window.innerHeight - 50 - 12] as [number, number],
    snapped: true,
  }));

  const [showItems, setShowItems] = React.useState(true);

  const isDraggingRef = React.useRef(false);

  const windowDimensions = useWindowDimensions();

  React.useEffect(() => {
    const position = toolbarPosition.position.get();
    const snapped = toolbarPosition.snapped.get();
    const y = position[1] + 50 + 12;
    if (y > windowDimensions.height || snapped) {
      setToolbarPosition({
        position: [position[0], windowDimensions.height - 50 - 12],
        snapped: true,
      });
    }
  }, [windowDimensions]);

  const handler = useGesture(
    {
      onDrag: (state) => {
        setToolbarPosition({
          position: state.movement,
          snapped: state.movement[1] === windowDimensions.height - 50 - 10,
          immediate: true,
        });
      },
      onClick: () => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          return;
        }
        setShowItems((showItems) => !showItems);
      },
    },
    {
      drag: {
        initial: () => toolbarPosition.position.get(),
        bounds: {
          left: 10,
          right: windowDimensions.width - 70 - 10,
          top: 10,
          bottom: windowDimensions.height - 50 - 10,
        },
        threshold: 5,
      },
    }
  );
  return (
    <>
      <div
        style={{
          cursor: isMapOnly ? "default" : "grab",
          background: "black",
          height: "100vh",
          position: "relative",
        }}
      >
        <FlatContextProvider
          value={[
            [
              IsDungeonMasterContext.Provider,
              { value: false },
            ] as ComponentWithPropsTuple<
              React.ComponentProps<typeof IsDungeonMasterContext.Provider>
            >,
            [
              MarkAreaToolContext.Provider,
              {
                value: {
                  onMarkArea: ([x, y]) => {
                    if (isMapOnly) {
                      return;
                    }
                    if (map && mapId) {
                      mapPing({
                        variables: {
                          input: {
                            mapId,
                            x,
                            y,
                          },
                        },
                      });
                    }
                  },
                },
              },
            ] as ComponentWithPropsTuple<
              React.ComponentProps<typeof MarkAreaToolContext.Provider>
            >,
            [
              UpdateTokenContext.Provider,
              {
                value: (id, { x, y }) => updateToken({ id, x, y }),
              },
            ] as ComponentWithPropsTuple<
              React.ComponentProps<typeof UpdateTokenContext.Provider>
            >,
          ]}
        >
          {map ? (
            <React.Suspense fallback={null}>
              <LazyLoadedMapView
                map={map}
                activeTool={isMapOnly ? null : PlayerMapTool}
                controlRef={controlRef}
                sharedContexts={[
                  IsDungeonMasterContext,
                  MarkAreaToolContext,
                  NoteWindowActionsContext,
                  ReactRelayContext,
                  UpdateTokenContext,
                  I18nContext,
                ]}
                fogOpacity={1}
              />
            </React.Suspense>
          ) : null}
        </FlatContextProvider>
        {map && !isMapOnly ? (
          <PlayerViewportRect
            mapId={mapId}
            controlRef={controlRef}
            view={playerView}
            cap={playerCap}
            onChange={(updates) => setPlayerView((v) => ({ ...v, ...updates }))}
          />
        ) : null}
      </div>
      {!showSplashScreen ? (
        isMapOnly ? null : (
          <>
            <ToolbarContainer
              style={{
                transform: to(
                  [toolbarPosition.position],
                  ([x, y]) => `translate(${x}px, ${y}px)`
                ),
              }}
            >
              <Toolbar horizontal>
                <Toolbar.Logo {...handler()} cursor="grab" />
                {showItems ? (
                  <React.Fragment>
                    <Toolbar.Group>
                      <Toolbar.Item isActive>
                        <Toolbar.Button
                          onClick={() => {
                            controlRef.current?.controls.center();
                          }}
                          onTouchStart={(ev) => {
                            ev.preventDefault();
                            controlRef.current?.controls.center();
                          }}
                        >
                          <Icon.Compass boxSize="20px" />
                          <Icon.Label>{t("Center Map")}</Icon.Label>
                        </Toolbar.Button>
                      </Toolbar.Item>
                      <Toolbar.Item isActive>
                        <Toolbar.LongPressButton
                          onClick={() => {
                            controlRef.current?.controls.zoomIn();
                          }}
                          onLongPress={() => {
                            const interval = setInterval(() => {
                              controlRef.current?.controls.zoomIn();
                            }, 100);

                            return () => clearInterval(interval);
                          }}
                        >
                          <Icon.ZoomIn boxSize="20px" />
                          <Icon.Label>{t("Zoom In")}</Icon.Label>
                        </Toolbar.LongPressButton>
                      </Toolbar.Item>
                      <Toolbar.Item isActive>
                        <Toolbar.LongPressButton
                          onClick={() => {
                            controlRef.current?.controls.zoomOut();
                          }}
                          onLongPress={() => {
                            const interval = setInterval(() => {
                              controlRef.current?.controls.zoomOut();
                            }, 100);

                            return () => clearInterval(interval);
                          }}
                        >
                          <Icon.ZoomOut boxSize="20px" />
                          <Icon.Label>{t("Zoom Out")}</Icon.Label>
                        </Toolbar.LongPressButton>
                      </Toolbar.Item>
                      <Toolbar.Item isActive>
                        <Toolbar.Button
                          onClick={() => {
                            setPlayerView((v) => ({
                              ...v,
                              rotation: (v.rotation + 90) % 360,
                            }));
                          }}
                          onTouchStart={(ev) => {
                            ev.preventDefault();
                            setPlayerView((v) => ({
                              ...v,
                              rotation: (v.rotation + 90) % 360,
                            }));
                          }}
                        >
                          <Icon.RotateCW boxSize="20px" />
                          <Icon.Label>{t("Rotate")}</Icon.Label>
                        </Toolbar.Button>
                      </Toolbar.Item>
                    </Toolbar.Group>
                  </React.Fragment>
                ) : null}
              </Toolbar>
            </ToolbarContainer>
          </>
        )
      ) : (
        <AbsoluteFullscreenContainer>
          <SplashScreen text={t("Ready.")} />
        </AbsoluteFullscreenContainer>
      )}
    </>
  );
};

const usePcPassword = () =>
  usePersistedState<string>("pcPassword", {
    encode: (value) => JSON.stringify(value),
    decode: (rawValue) => {
      if (typeof rawValue === "string") {
        try {
          const parsedValue = JSON.parse(rawValue);
          if (typeof parsedValue === "string") {
            return parsedValue;
          }
        } catch (e) {}
      }
      return "";
    },
  });

const AuthenticatedContent: React.FC<{
  pcPassword: string;
  localFetch: typeof fetch;
  isMapOnly: boolean;
}> = (props) => {
  const socket = useSocket();

  return (
    <AuthenticatedAppShell
      password={props.pcPassword}
      socket={socket}
      isMapOnly={props.isMapOnly}
      role="Player"
    >
      <ActiveMapPlayer
        fetch={props.localFetch}
        socket={socket}
        isMapOnly={props.isMapOnly}
      />
    </AuthenticatedAppShell>
  );
};

const ActiveMapPlayer: React.FC<{
  fetch: typeof window.fetch;
  socket: ReturnType<typeof useSocket>;
  isMapOnly: boolean;
}> = ({ fetch, socket, isMapOnly }) => {
  const currentMap = useQuery<playerArea_PlayerMap_ActiveMapQuery>(
    PlayerMap_ActiveMapQuery
  );

  React.useEffect(() => {
    const listener = () => {
      if (document.hidden === false) {
        currentMap.retry();
      }
    };

    window.document.addEventListener("visibilitychange", listener, false);

    return () =>
      window.document.removeEventListener("visibilitychange", listener, false);
  }, []);

  return (
    <PlayerMapView
      map={currentMap.data?.activeMap ?? null}
      mapId={currentMap.data?.activeMap?.id ?? null}
      fetch={fetch}
      socket={socket}
      isMapOnly={isMapOnly}
    />
  );
};

export const PlayerArea: React.FC<{
  password: string | null;
  isMapOnly: boolean;
}> = (props) => {
  const { t } = useI18n();
  const [pcPassword, setPcPassword] = usePcPassword();
  const initialPcPassword = React.useRef(pcPassword);
  let usedPassword = pcPassword;
  // the password in the query parameters has priority.
  if (pcPassword === initialPcPassword.current && props.password) {
    usedPassword = props.password;
  }

  const [mode, setMode] = React.useState("LOADING");

  const localFetch = React.useCallback(
    (input, init = {}) => {
      return fetch(buildApiUrl(input), {
        ...init,
        headers: {
          Authorization: usedPassword ? `Bearer ${usedPassword}` : undefined,
          ...init.headers,
        },
      }).then((res) => {
        if (res.status === 401) {
          console.error("Unauthenticated access.");
          setMode("AUTHENTICATE");
        }
        return res;
      });
    },
    [usedPassword]
  );

  useAsyncEffect(
    function* () {
      const result: any = yield localFetch("/auth").then((res) => res.json());
      if (!result.data.role) {
        setMode("AUTHENTICATE");
        return;
      }
      setMode("READY");
    },
    [localFetch]
  );

  if (mode === "LOADING") {
    return <SplashScreen text={t("Loading...")} />;
  }

  if (mode === "AUTHENTICATE") {
    return (
      <AuthenticationScreen
        requiredRole="PC"
        fetch={localFetch}
        onAuthenticate={(password) => {
          setPcPassword(password);
        }}
      />
    );
  }

  if (mode === "READY") {
    return (
      <AuthenticatedContent
        localFetch={localFetch}
        pcPassword={usedPassword}
        isMapOnly={props.isMapOnly}
      />
    );
  }

  throw new Error("Invalid mode.");
};
