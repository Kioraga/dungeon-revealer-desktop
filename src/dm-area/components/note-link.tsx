import * as React from "react";
import { useNoteWindowActions } from "../token-info-aside";
import { useWindowContext } from "../token-info-aside/token-info-aside";
import styled from "@emotion/styled/macro";

const LINK_COLOR = "var(--color-accent)";
const LINK_COLOR_HOVER = "var(--color-accent-hover)";

const StyledNoteLink = styled.button`
  all: unset;
  cursor: pointer;
  color: var(--color-accent);
  text-decoration: underline;
  &:hover {
    color: ${LINK_COLOR_HOVER};
  }
`;

export const NoteLink: React.FC<{ id?: string }> = (props) => {
  const windowId = useWindowContext();
  const noteWindowActions = useNoteWindowActions();
  const id = props.id ?? null;

  if (id === null) {
    return <>{props.children ?? null}</>;
  }

  return (
    <StyledNoteLink
      onClick={(ev) => {
        if (ev.ctrlKey || ev.metaKey) {
          noteWindowActions.showNoteInNewWindow(id);
        } else {
          noteWindowActions.showNoteInWindow(id, windowId);
        }
      }}
    >
      {props.children ?? id}
    </StyledNoteLink>
  );
};
