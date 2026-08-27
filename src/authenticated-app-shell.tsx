import * as React from "react";
import { Socket as IOSocket } from "socket.io-client";
import { createEnvironment } from "./relay-environment";
import { RelayEnvironmentProvider } from "relay-hooks";
import { useStaticRef } from "./hooks/use-static-ref";
import { SplashScreen } from "./splash-screen";
import { ChatToggleButton, IconButton } from "./chat-toggle-button";
import { Chat } from "./chat";
import { useChatSoundsAndUnreadCount } from "./chat/chat";
import { useLogInMutation } from "./chat/log-in-mutation";
import styled from "@emotion/styled/macro";
import { NoteSearch } from "./note-search/note-search";
import {
  TokenInfoAside,
  NoteWindowContextProvider,
} from "./dm-area/token-info-aside";
import * as Icon from "./feather-icons";
import { SoundSettingsProvider } from "./sound-settings";
import { animated, useSpring } from "react-spring";
import type { SpringValue } from "react-spring";
import { useWindowDimensions } from "./hooks/use-window-dimensions";
import { SplashShareImage } from "./splash-share-image";
import { usePersistedState } from "./hooks/use-persisted-state";

// Logs panel always starts hidden; the DM opens it with the toggle button.
const useShowChatState = () => React.useState<"show" | "hidden">("hidden");

const useShowDiceRollNotesState = () =>
  usePersistedState<"show" | "hidden">("chat.showDiceRollNotes", {
    encode: (value) => value,
    decode: (value) => {
      if (
        typeof value !== "string" ||
        ["show", "hidden"].includes(value) === false
      ) {
        return "hidden";
      }
      return value as "show" | "hidden";
    },
  });

const Container = styled.div`
  display: flex;
  height: 100%;
  position: relative;
  overflow: hidden;
`;

const IconContainer = styled(animated.div)`
  margin-top: 10px;
  margin-right: 10px;
  display: flex;
`;

const Aside = styled.div<{ width: number }>`
  height: 100%;
  width: ${(p) => p.width}px;
  border-left: 1px solid lightgrey;
  pointer-events: all;
  background: #fff;
`;

const CHAT_WIDTH = 400;
const CHAT_BUTTONS_WIDTH = 85;

const useChatWidth = () => {
  const windowDimensions = useWindowDimensions();

  let chatWidth = CHAT_WIDTH;

  if (chatWidth + CHAT_BUTTONS_WIDTH > windowDimensions.width) {
    chatWidth = windowDimensions.width - CHAT_BUTTONS_WIDTH;
  }
  return chatWidth;
};

const AuthenticatedAppShellRenderer: React.FC<{
  isMapOnly: boolean;
  role: AuthenticatedRole;
}> = ({ isMapOnly, role, children }) => {
  const [chatState, setShowChatState] = useShowChatState();
  const [diceRollNotesState, setDiceRollNotesState] =
    useShowDiceRollNotesState();

  // DM window view mode: "dm" (editor) or "player" (mirror). The player view
  // hides the DM chrome (search + log aside).
  const [viewMode, setViewMode] = React.useState<"dm" | "player">("dm");

  const toggleShowDiceRollNotes = React.useCallback(() => {
    setDiceRollNotesState((state) => (state === "show" ? "hidden" : "show"));
  }, []);

  const [isLoggedIn, logIn] = useLogInMutation();

  const [hasUnreadMessages, resetUnreadMessages] = useChatSoundsAndUnreadCount(
    chatState,
    isLoggedIn
  );

  const isDm = role === "DM";

  // Only the DM window joins the chat; the player window stays silent (view-only).
  React.useEffect(() => {
    if (isDm) {
      logIn();
    }
  }, [logIn, isDm]);

  const [showSearch, setShowSearch] = React.useState(false);

  React.useEffect(() => {
    if (!isLoggedIn) return;

    const listener = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.keyCode === 70) {
        ev.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [isLoggedIn]);

  const chatWidth = useChatWidth();

  const chatPosition = useSpring({
    x: chatState === "hidden" ? chatWidth : 0,
  });

  const chatPositionContextValue = React.useMemo(() => {
    return {
      width: chatWidth,
      x: chatPosition.x,
    };
  }, [chatWidth, chatPosition.x]);

  if (isDm && isLoggedIn === false) {
    return null;
  }

  return (
    <ViewModeContext.Provider value={viewMode}>
      <SetViewModeContext.Provider value={setViewMode}>
        <ChatPositionContext.Provider value={chatPositionContextValue}>
          <NoteWindowContextProvider>
            <Container>
              <div
                style={{ flex: 1, position: "relative", overflow: "hidden" }}
              >
                {children}
              </div>
              <SplashShareImage />
              {isMapOnly === false && viewMode !== "player" ? (
                <React.Fragment>
                  <animated.div
                    style={{
                      display: "flex",
                      position: "absolute",
                      right: 0,
                      height: "100%",
                      transform: chatPosition.x.to(
                        (value) => `translateX(${value}px)`
                      ),
                      pointerEvents: "none",
                    }}
                  >
                    <IconContainer>
                      <IconButton
                        onClick={() => setShowSearch(true)}
                        style={{ marginRight: 8, pointerEvents: "all" }}
                      >
                        <Icon.Search boxSize="20px" />
                      </IconButton>
                      <ChatToggleButton
                        hasUnreadMessages={hasUnreadMessages}
                        onClick={() => {
                          resetUnreadMessages();
                          setShowChatState((showChat) =>
                            showChat === "show" ? "hidden" : "show"
                          );
                        }}
                      />
                    </IconContainer>
                    <Aside width={chatWidth}>
                      <Chat toggleShowDiceRollNotes={toggleShowDiceRollNotes} />
                    </Aside>
                  </animated.div>
                </React.Fragment>
              ) : null}
            </Container>
            {isMapOnly === false && viewMode !== "player" ? (
              <React.Fragment>
                <TokenInfoAside />
                {showSearch ? (
                  <NoteSearch close={() => setShowSearch(false)} />
                ) : null}
                {diceRollNotesState === "show" ? (
                  <React.Suspense fallback={null}>
                    <DiceRollNotes close={toggleShowDiceRollNotes} />
                  </React.Suspense>
                ) : null}
              </React.Fragment>
            ) : null}
          </NoteWindowContextProvider>
        </ChatPositionContext.Provider>
      </SetViewModeContext.Provider>
    </ViewModeContext.Provider>
  );
};

export const ViewModeContext = React.createContext<"dm" | "player">("dm");
export const SetViewModeContext = React.createContext<
  React.Dispatch<React.SetStateAction<"dm" | "player">>
>(() => {});

export const useViewMode = (): [
  "dm" | "player",
  React.Dispatch<React.SetStateAction<"dm" | "player">>
] => [React.useContext(ViewModeContext), React.useContext(SetViewModeContext)];

export const ChatPositionContext = React.createContext<{
  width: number;
  x: SpringValue<number>;
} | null>(null);

const DiceRollNotes = React.lazy(() =>
  import("./chat/dice-roll-notes").then((mod) => ({
    default: mod.DiceRollNotes,
  }))
);

type ConnectionMode =
  | "connected"
  | "authenticating"
  | "authenticated"
  | "connecting"
  | "disconnected";

export type AuthenticatedRole = "DM" | "Player";

const RoleContext = React.createContext<AuthenticatedRole>("Player");

export const useViewerRole = (): AuthenticatedRole =>
  React.useContext(RoleContext);

export const AuthenticatedAppShell: React.FC<{
  socket: IOSocket;
  password: string;
  isMapOnly: boolean;
  role: AuthenticatedRole;
}> = ({ socket, password, isMapOnly, role, children }) => {
  const relayEnvironment = useStaticRef(() => createEnvironment(socket));
  // WebSocket connection state
  const [connectionMode, setConnectionMode] =
    React.useState<ConnectionMode>("connecting");

  /**
   * Multi-window desktop app: DM window + player window stay connected at the same time.
   * (The upstream web version only allowed one active tab at a time; that is removed here.)
   */
  React.useEffect(() => {
    const authenticate = () => {
      socket.emit("authenticate", {
        password: password,
        desiredRole: role === "DM" ? "admin" : "user",
      });
    };

    socket.on("connect", () => {
      setConnectionMode("connected");
      authenticate();
    });

    socket.on("authenticated", () => {
      setConnectionMode("authenticated");
    });

    socket.on("reconnect", () => {
      setConnectionMode("authenticating");
      socket.emit("authenticate", { password: password });
    });

    socket.on("disconnect", () => {
      setConnectionMode("disconnected");
    });

    if (socket.connected) {
      authenticate();
    }

    return () => {
      socket.off("connect");
      socket.off("reconnecting");
      socket.off("reconnect");
      socket.off("reconnect_failed");
      socket.off("disconnect");
    };
  }, [socket, password, role]);

  if (connectionMode !== "authenticated") {
    return <SplashScreen text={connectionMode} />;
  }

  return (
    <RoleContext.Provider value={role}>
      <SoundSettingsProvider>
        <RelayEnvironmentProvider environment={relayEnvironment}>
          <AuthenticatedAppShellRenderer isMapOnly={isMapOnly} role={role}>
            {children}
          </AuthenticatedAppShellRenderer>
        </RelayEnvironmentProvider>
      </SoundSettingsProvider>
    </RoleContext.Provider>
  );
};
