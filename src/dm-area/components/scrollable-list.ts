import styled from "@emotion/styled/macro";

export const List = styled.ul`
  padding: 0;
  list-style: none;
  flex: 1;
  overflow-y: scroll;
  margin-bottom: 0;
`;

export const ListItem = styled.li``;

export const ListItemButton = styled.button<{ isActive?: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  font-weight: bold;
  display: block;
  width: 100%;
  border: none;
  text-align: left;
  padding: 20px;
  cursor: pointer;
  text-decoration: none;
  padding-left: 13px;
  padding-right: 20px;
  background-color: ${(p) =>
    p.isActive ? "var(--color-surface-hover)" : "var(--color-surface)"};
  color: ${(p) =>
    p.isActive ? "var(--color-accent)" : "var(--color-text-muted)"};

  &:focus,
  &:hover {
    background-color: var(--color-surface-hover);
    color: var(--color-accent);
  }

  border-left: ${(p) =>
    p.isActive ? "7px solid var(--color-accent)" : "7px solid transparent"};

  outline: none;
`;
