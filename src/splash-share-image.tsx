import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useQuery } from "relay-hooks";
import { useSplashShareImageAction } from "./hooks/use-splash-share-image-action";
import type { splashShareImageSharedSplashImageQuery } from "./__generated__/splashShareImageSharedSplashImageQuery.graphql";
import { StyledModalBackdrop } from "./modal";
import styled from "@emotion/styled/macro";
import { buildApiUrl } from "./public-url";
import { useToast } from "@chakra-ui/react";
import { useViewerRole } from "./authenticated-app-shell";
import { useI18n } from "./i18n";

const SplashShareImage_SplashShareImageQuery = graphql`
  query splashShareImageSharedSplashImageQuery @live {
    sharedSplashImage {
      id
      url
    }
  }
`;
const LightBoxImage = styled.img`
  max-width: 90vw;
  max-height: 90vh;
  overflow: scroll;
`;

const LightBoxVideo = styled.video`
  max-width: 90vw;
  max-height: 90vh;
`;

export const SplashShareImage = (): React.ReactElement | null => {
  const { t } = useI18n();
  const data = useQuery<splashShareImageSharedSplashImageQuery>(
    SplashShareImage_SplashShareImageQuery
  );
  const splashShareImage = useSplashShareImageAction();
  const role = useViewerRole();
  const showToast = useToast();

  const url = data.data?.sharedSplashImage?.url ?? null;
  // ponytail: sniff Content-Type over HEAD instead of adding a mediaType field
  // to the GraphQL Image type (which would require write-schema + relay).
  // Ceiling: any future media kind needs the same sniff; upgrade to a real
  // mediaType field on Image once more than images/videos exist.
  const [isVideo, setIsVideo] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    if (!url) {
      setIsVideo(null);
      return;
    }
    let cancelled = false;
    fetch(buildApiUrl(url), { method: "HEAD" })
      .then((res) => {
        if (!cancelled) {
          setIsVideo(
            (res.headers.get("content-type") || "").startsWith("video/")
          );
        }
      })
      .catch(() => {
        if (!cancelled) setIsVideo(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (data.data?.sharedSplashImage) {
    return (
      <StyledModalBackdrop
        onClick={() => {
          if (role === "Player") {
            showToast({
              status: "info",
              title: t("Only a DM can dismiss this view."),
              isClosable: true,
              duration: 3000,
              position: "top",
            });
          } else if (role === "DM") {
            splashShareImage(null);
          }
        }}
      >
        {isVideo === null ? null : isVideo ? (
          <LightBoxVideo
            src={buildApiUrl(data.data.sharedSplashImage.url)}
            controls
            autoPlay
            onClick={(ev) => ev.stopPropagation()}
          />
        ) : (
          <LightBoxImage
            src={buildApiUrl(data.data.sharedSplashImage.url)}
            onClick={(ev) => ev.stopPropagation()}
          />
        )}
      </StyledModalBackdrop>
    );
  }

  return null;
};
