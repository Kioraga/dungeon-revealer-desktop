import styled from "@emotion/styled/macro";

type ButtonBaseProps = {
  disabled?: boolean;
  big?: boolean;
  small?: boolean;
  iconOnly?: boolean;
  fullWidth?: boolean;
};

const ButtonBase = styled.button<ButtonBaseProps>`
  cursor: pointer;
  border: none;
  align-items: center;
  border-radius: 4px;
  display: inline-flex;
  font-size: ${(p) => (p.big ? `24px` : `18px`)};
  font-weight: 700;
  line-height: 1.25;
  padding: ${(p) =>
    p.big ? `1rem 2rem` : p.small ? `0.5rem .75rem` : `1rem 1.5rem`};
  width: ${(p) => (p.fullWidth ? "100%" : null)};
  height: ${(p) => (p.big ? `60px` : p.small ? `32px` : `54px`)};
  font-size: ${(p) => (p.small ? `12px` : undefined)};

  > svg:first-of-type:not(:last-child) {
    margin-left: ${(p) => (p.iconOnly ? null : p.small ? `-4px` : `-8px`)};
  }

  > svg + span {
    margin-left: ${(p) => (p.iconOnly ? null : p.small ? `6px` : `12px`)};
  }
  > span + svg {
    margin-left: ${(p) => (p.iconOnly ? null : p.small ? `6px` : `12px`)};
  }
`;

export const Primary = styled(ButtonBase)`
  border: none;
  background-color: var(--color-accent);
  color: var(--color-accent-contrast);

  &:focus,
  &:hover {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
    background-color: var(--color-accent-hover);
  }
`;

export const Secondary = styled(ButtonBase)`
  background-color: var(--color-surface-hover);
  color: var(--color-text);

  &:hover {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  }
`;

export const Tertiary = styled(ButtonBase)<
  ButtonBaseProps & {
    danger?: boolean;
  }
>`
  background-color: transparent;
  color: ${(p) =>
    p.disabled
      ? "var(--color-text-muted)"
      : p.danger
      ? "var(--color-danger)"
      : "var(--color-text)"};
  cursor: ${(p) => (p.disabled ? "inherit" : null)};

  &:hover {
    background-color: ${(p) =>
      p.disabled ? null : "var(--color-surface-hover)"};
  }
`;
