import * as React from "react";
import {
  createPlugin,
  useInputContext,
  Components as LevaComponents,
} from "leva/plugin";
import { Box, Button, HStack } from "@chakra-ui/react";
import { useNoteWindowActions } from "../dm-area/token-info-aside";
import { useShowSelectNoteModal } from "../dm-area/select-note-modal";
import { useI18n } from "../i18n";

const { Row, Label } = LevaComponents;

const NoteReference = () => {
  const { t } = useI18n();
  const { displayValue, setValue } = useInputContext<any>();
  const noteWindowActions = useNoteWindowActions();

  const [reactNode, showSelectNoteModal] = useShowSelectNoteModal();
  return (
    <>
      {reactNode}
      <Row input>
        <Label>{t("Reference")}</Label>

        <HStack alignItems="center" spacing={1}>
          {displayValue ? (
            <>
              <Box justifySelf="flexStart">{t("Note")}</Box>
              <Button
                size="xs"
                onClick={() => {
                  setValue(null);
                }}
              >
                {t("Remove")}
              </Button>
              <Button
                size="xs"
                onClick={() => {
                  noteWindowActions.focusOrShowNoteInNewWindow(displayValue);
                }}
              >
                {t("Edit")}
              </Button>
            </>
          ) : (
            <Button
              size="xs"
              onClick={() => {
                showSelectNoteModal((noteId) => {
                  setValue(noteId);
                });
              }}
            >
              {t("Link")}
            </Button>
          )}
        </HStack>
      </Row>
    </>
  );
};

type NoteReferenceIdValue = string | null;

const normalize = (input: { value: NoteReferenceIdValue }) => ({
  value: input.value,
});

export const levaPluginNoteReference = createPlugin({
  normalize,
  component: NoteReference,
});
