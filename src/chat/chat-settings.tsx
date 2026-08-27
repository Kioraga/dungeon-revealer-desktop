import * as React from "react";
import { FormControl, FormLabel, Switch } from "@chakra-ui/react";
import styled from "@emotion/styled/macro";
import { useSoundSettings } from "../sound-settings";

const LabelText = styled.div`
  font-weight: bold;
  color: rgb(62, 76, 88);
  letter-spacing: 1px;
  padding-bottom: 8px;
`;

// Local desktop app: the DM nickname is fixed. Only the dice sound is configurable.
export const ChatSettings: React.FC<{}> = () => {
  const soundSettings = useSoundSettings();
  const diceSoundEnabled = soundSettings.value !== "none";

  return (
    <>
      <FormControl
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <FormLabel htmlFor="dice-sound-toggle" mb="0">
          <LabelText>Dice Sound</LabelText>
        </FormLabel>
        <Switch
          id="dice-sound-toggle"
          size="lg"
          isChecked={diceSoundEnabled}
          onChange={(ev) =>
            soundSettings.setValue(ev.target.checked ? "dice-only" : "none")
          }
        />
      </FormControl>
    </>
  );
};
