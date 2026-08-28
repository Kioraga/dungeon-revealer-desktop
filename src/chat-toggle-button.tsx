import * as React from "react";
import styled from "@emotion/styled/macro";
import * as Icon from "./feather-icons";

export const IconButton = styled.button<{ colorVariant?: "white" | "green" }>`
  position: relative;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  height: 30px;
  width: 30px;
  background-color: ${(p) =>
    p.colorVariant === "green"
      ? "var(--color-accent)"
      : "var(--color-surface)"};
  z-index: 20;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  border: none;
  cursor: pointer;

  color: ${(p) =>
    p.colorVariant === "green"
      ? "var(--color-accent-contrast)"
      : "var(--color-text)"};

  &:hover {
    background-color: ${(p) =>
      p.colorVariant === "green"
        ? "var(--color-accent-hover)"
        : "var(--color-surface-hover)"};
  }
`;

export const ButtonBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background-color: red;
`;

export const ChatToggleButton: React.FC<{
  hasUnreadMessages: boolean;
  onClick: React.ComponentProps<"button">["onClick"];
}> = ({ hasUnreadMessages, onClick }) => {
  return (
    <IconButton onClick={onClick} style={{ pointerEvents: "all" }}>
      <Icon.List boxSize="20px" />
      {hasUnreadMessages ? <ButtonBadge /> : null}
    </IconButton>
  );
};
