import * as React from "react";
import { useToast } from "@chakra-ui/react";
import { useI18n } from "../i18n";

type ShowFileDialogFunction = () => void;
type OnSelectFileFunction = (file: File) => void;

// Matches a File's MIME type against an <input accept> value (e.g. "image/*").
const matchesAccept = (file: File, accept: string) => {
  const type = file.type || "";
  return accept
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .some((p) =>
      p === "*/*"
        ? true
        : p.endsWith("/*")
        ? type.startsWith(p.slice(0, -1))
        : type === p
    );
};

export const useSelectFileDialog = (
  onSelect: OnSelectFileFunction,
  accept = "image/*"
): [React.ReactNode, ShowFileDialogFunction] => {
  const { t } = useI18n();
  const showToast = useToast();
  const ref = React.useRef<HTMLInputElement>(null);

  const onChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      if (!ev.currentTarget.files) return;
      const file = ev.currentTarget.files[0] as File | undefined;
      ev.currentTarget.value = "";
      if (!file) return;
      // The OS file dialog's "Custom Files" fallback lets any file through;
      // enforce the supported set here too.
      if (!matchesAccept(file, accept)) {
        showToast({
          status: "warning",
          title: t("Unsupported file type."),
          isClosable: true,
          duration: 3000,
        });
        return;
      }
      onSelect(file);
    },
    [onSelect, accept, showToast, t]
  );

  const node = React.useMemo(
    () => (
      <input
        type="file"
        accept={accept}
        ref={ref}
        onChange={onChange}
        style={{ display: "none" }}
      />
    ),
    [onChange, accept]
  );

  const showFileDialog = React.useCallback(() => {
    ref.current?.click();
  }, []);

  return [node, showFileDialog];
};
