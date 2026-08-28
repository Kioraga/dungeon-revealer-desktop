import styled from "@emotion/styled/macro";
import * as BButton from "./button";

type HorizontalNavigationButtonProps = React.ComponentProps<
  typeof BButton.Tertiary
> & { isActive: boolean };

export const Group = styled.div`
  display: flex;
`;

export const Button = styled(BButton.Tertiary)<HorizontalNavigationButtonProps>`
  border-right: none;
  border: 1px solid var(--color-border);
  white-space: nowrap;

  background-color: ${(p) => (p.isActive ? "var(--color-accent)" : null)};
  color: ${(p) => (p.isActive ? "var(--color-accent-contrast)" : null)};
  border-color: ${(p) => (p.isActive ? "var(--color-accent)" : null)};

  &:hover {
    background-color: ${(p) => (p.isActive ? "var(--color-accent)" : null)};
  }

  &:first-of-type {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: 0;
  }

  &:not(:last-child):not(:first-of-type) {
    border-radius: unset;
    border-right: none;
  }

  &:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-right: 1px solid var(--color-border);
  }
`;
