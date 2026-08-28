import React from "react";
import { Modal } from "./modal";
import styled from "@emotion/styled/macro";

const LightBoxImage = styled.img`
  max-width: 90vw;
  max-height: 90vh;
  overflow: scroll;
`;

const LightBoxVideo = styled.video`
  max-width: 90vw;
  max-height: 90vh;
`;

const ButtonBackground = styled.button`
  all: unset;
  display: block;
`;

export const ImageLightBoxModal: React.FC<{
  src: string;
  close: () => void;
  isVideo?: boolean;
}> = ({ src, close, isVideo = false }) => {
  return (
    <Modal onClickOutside={close} onPressEscape={close}>
      <ButtonBackground onClick={(ev) => ev.stopPropagation()}>
        {isVideo ? (
          <LightBoxVideo src={src} controls autoPlay />
        ) : (
          <LightBoxImage src={src} />
        )}
      </ButtonBackground>
    </Modal>
  );
};
