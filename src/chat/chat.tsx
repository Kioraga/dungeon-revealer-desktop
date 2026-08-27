import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useQuery, useSubscription } from "relay-hooks";
import { ConnectionHandler } from "relay-runtime";
import { Stack } from "@chakra-ui/react";
import { ChatMessages } from "./chat-messages";
import { ChatSettings } from "./chat-settings";
import { chatSubscription } from "./__generated__/chatSubscription.graphql";
import { chatQuery } from "./__generated__/chatQuery.graphql";
import * as Button from "../button";

import * as Icon from "../feather-icons";
import useSound from "use-sound";
import diceRollSound from "./dice-roll.mp3";
import notificationSound from "./notification.mp3";

import styled from "@emotion/styled/macro";
import { DiceRoller } from "./dice-roller";
import { chatMessageSoundSubscription } from "./__generated__/chatMessageSoundSubscription.graphql";
import { useSoundSettings } from "../sound-settings";
import { useStaticRef } from "../hooks/use-static-ref";

const AppSubscription = graphql`
  subscription chatSubscription {
    chatMessagesAdded {
      messages {
        id
        ...chatMessage_message
      }
    }
  }
`;

const ChatMessageSoundSubscription = graphql`
  subscription chatMessageSoundSubscription {
    chatMessagesAdded {
      messages {
        __typename
        ... on TextChatMessage {
          containsDiceRoll
        }
      }
    }
  }
`;

const ChatQuery = graphql`
  query chatQuery {
    ...chatMessages_chat
  }
`;

const ChatWindow = styled.div`
  padding: 12px;
  background-color: #fff;
  font-size: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 8px;
`;

const ChatTitle = styled.span`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 13px;
  color: rgb(62, 76, 88);
  letter-spacing: 0.5px;
`;

const SettingsButton = styled.button<{ isActive: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid ${(p) => (p.isActive ? "#044e54" : "rgb(203, 210, 217)")};
  background-color: ${(p) => (p.isActive ? "#044e54" : "#fff")};
  color: ${(p) => (p.isActive ? "#fff" : "rgb(62, 76, 88)")};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  &:hover {
    background-color: ${(p) => (p.isActive ? "#044e54" : "#f0f4f8")};
  }
`;

export const useChatSoundsAndUnreadCount = (
  chatState: "hidden" | "show",
  isLoggedIn: boolean
) => {
  const [hasUnreadMessages, setHasUnreadMessages] = React.useState(false);
  const [playDiceRollSound] = useSound(diceRollSound, {
    volume: 0.5,
  });
  const [playNotificationSound] = useSound(notificationSound, {
    volume: 0.5,
  });
  const soundSettings = useSoundSettings();

  const refs = React.useRef({
    playDiceRollSound,
    playNotificationSound,
    chatState,
    soundSettings,
  });

  React.useEffect(() => {
    refs.current = {
      playDiceRollSound,
      playNotificationSound,
      chatState,
      soundSettings,
    };
  });

  useSubscription<chatMessageSoundSubscription>(
    useStaticRef(() => ({
      subscription: ChatMessageSoundSubscription,
      variables: {},
      onNext: (data) => {
        if (data) {
          let mode: "dice-roll-message" | "text-message" = "text-message";

          if (
            data.chatMessagesAdded.messages.some(
              (message) => message.containsDiceRoll === true
            )
          ) {
            mode = "dice-roll-message";
          }

          if (
            mode === "text-message" &&
            refs.current.soundSettings.value === "all"
          ) {
            refs.current.playNotificationSound();
          } else if (
            mode === "dice-roll-message" &&
            refs.current.soundSettings.value !== "none"
          ) {
            refs.current.playDiceRollSound();
          }

          if (refs.current.chatState === "hidden") {
            setHasUnreadMessages(true);
          }
        }
      },
    })),
    { skip: isLoggedIn === false }
  );

  return [hasUnreadMessages, () => setHasUnreadMessages(false)] as [
    boolean,
    () => void
  ];
};

export const Chat: React.FC<{
  toggleShowDiceRollNotes: () => void;
}> = React.memo(({ toggleShowDiceRollNotes }) => {
  const [mode, setMode] = React.useState<"chat" | "settings">("chat");

  useSubscription<chatSubscription>(
    useStaticRef(() => ({
      subscription: AppSubscription,
      variables: {},
      updater: (store) => {
        const chat = ConnectionHandler.getConnection(
          store.getRoot(),
          "chatMessages_chat"
        );

        const records = store
          .getRootField("chatMessagesAdded")
          ?.getLinkedRecords("messages");
        if (!chat || !records) return;

        for (const chatMessage of records) {
          const edge = ConnectionHandler.createEdge(
            store,
            chat,
            chatMessage,
            "ChatMessage"
          );
          ConnectionHandler.insertEdgeAfter(chat, edge);
        }
      },
    }))
  );

  const retryRef = React.useRef<null | (() => void)>(null);
  const { error, data, retry } = useQuery<chatQuery>(ChatQuery);

  if (error) {
    return null;
  }
  if (!data) {
    return null;
  }

  retryRef.current = retry;

  return (
    <ChatWindow
      onContextMenu={(ev) => {
        ev.stopPropagation();
      }}
    >
      <ChatHeader>
        <ChatTitle>Logs</ChatTitle>
        <SettingsButton
          isActive={mode === "settings"}
          onClick={() => setMode(mode === "settings" ? "chat" : "settings")}
        >
          <Icon.Settings boxSize="16px" />
        </SettingsButton>
      </ChatHeader>
      {mode === "chat" ? (
        <Stack height="100%">
          <ChatMessages chat={data} />
          <DiceRoller />
          <Button.Tertiary
            small
            onClick={toggleShowDiceRollNotes}
            style={{ marginTop: 8 }}
          >
            <Icon.Dice boxSize="16px" /> <span> Dice Roll Notes</span>
          </Button.Tertiary>
        </Stack>
      ) : mode === "settings" ? (
        <div style={{ marginTop: 16 }}>
          <ChatSettings />
        </div>
      ) : null}
    </ChatWindow>
  );
});
