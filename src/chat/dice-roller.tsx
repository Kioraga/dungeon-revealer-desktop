import * as React from "react";
import styled from "@emotion/styled/macro";
import { Input, FormControl, HStack } from "@chakra-ui/react";
import { useMessageAddMutation } from "./message-add-mutation";
import * as Button from "../button";
import * as Icon from "../feather-icons";
import { useI18n } from "../i18n";

// Dice-only log: no plain text messages, only dice rolls.
const DICE = [4, 6, 8, 10, 12, 20];
const NOTATION = /^\d*d\d+([+-]\d+)?$/;

const DieButton = styled.button`
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 0;
  cursor: pointer;
  &:hover {
    background: var(--color-accent);
    color: var(--color-accent-contrast);
  }
`;

export const DiceRoller: React.FC<{}> = () => {
  const { t } = useI18n();
  const [notation, setNotation] = React.useState("");
  const messageAdd = useMessageAddMutation();

  const roll = React.useCallback(
    (rawContent: string) => {
      messageAdd({ rawContent });
    },
    [messageAdd]
  );

  const onSubmit = () => {
    const trimmed = notation.trim().toLowerCase();
    if (trimmed === "" || !NOTATION.test(trimmed)) {
      setNotation("");
      return;
    }
    roll(`[${trimmed}]`);
    setNotation("");
  };

  return (
    <FormControl onSubmit={onSubmit}>
      <HStack spacing="1" marginBottom="2">
        {DICE.map((die) => (
          <DieButton key={die} type="button" onClick={() => roll(`[1d${die}]`)}>
            d{die}
          </DieButton>
        ))}
      </HStack>
      <HStack spacing="2">
        <Input
          placeholder="2d6+1"
          value={notation}
          onChange={(ev) => setNotation(ev.currentTarget.value)}
          onKeyPress={(ev) => {
            if (ev.key === "Enter") {
              onSubmit();
              ev.preventDefault();
            }
          }}
          fontSize="sm"
          variant="filled"
        />
        <Button.Primary
          small
          onClick={onSubmit}
          style={{ whiteSpace: "nowrap" }}
        >
          <Icon.Dice boxSize="16px" />
          <span>{t("Roll")}</span>
        </Button.Primary>
      </HStack>
    </FormControl>
  );
};
