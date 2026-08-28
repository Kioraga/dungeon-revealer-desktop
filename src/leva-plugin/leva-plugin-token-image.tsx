import * as React from "react";
import {
  createPlugin,
  useInputContext,
  Components as LevaComponents,
} from "leva/plugin";
import {
  Button,
  HStack,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Box,
  Input,
  InputLeftElement,
  InputGroup,
  InputRightElement,
  SimpleGrid,
  Image,
  Center,
  Text,
  VStack,
} from "@chakra-ui/react";
import graphql from "babel-plugin-relay/macro";
import * as Icon from "../feather-icons";
import { usePagination, useQuery } from "relay-hooks";
import { levaPluginTokenImage_TokenImagesFragment$key } from "./__generated__/levaPluginTokenImage_TokenImagesFragment.graphql";
import { levaPluginTokenImage_TokenImagesQuery } from "./__generated__/levaPluginTokenImage_TokenImagesQuery.graphql";
import { useTokenImageUpload } from "../dm-area/token-image-upload";
import { useCurrent } from "../hooks/use-current";
import { useI18n } from "../i18n";

const { Row, Label } = LevaComponents;

const TokenImageReference = () => {
  const { t } = useI18n();
  const { displayValue, setValue } = useInputContext<any>();
  const [node, selectFile] = useTokenImageUpload();

  return (
    <>
      <Portal>{node}</Portal>
      <Row input>
        <Label>{t("Image")}</Label>
        <HStack alignItems="center" spacing={1}>
          {displayValue ? (
            <>
              <Box>
                <Popover
                  isLazy
                  placement="top-start"
                  closeOnBlur={node === null}
                >
                  <PopoverTrigger>
                    <Button size="xs">{t("Change")}</Button>
                  </PopoverTrigger>
                  <Portal>
                    <PopoverContent width="400px">
                      <TokenImagePopoverContent
                        onSelect={(value) => setValue(value)}
                        onSelectFile={(file, connection) =>
                          selectFile(file, [connection])
                        }
                      />
                    </PopoverContent>
                  </Portal>
                </Popover>
              </Box>
              <Box>
                <Button
                  size="xs"
                  onClick={() => {
                    setValue(null);
                  }}
                >
                  Remove
                </Button>
              </Box>
            </>
          ) : (
            <Box>
              <Popover isLazy placement="top-start" closeOnBlur={node === null}>
                <PopoverTrigger>
                  <Button size="xs">{t("Add")}</Button>
                </PopoverTrigger>
                <Portal>
                  <PopoverContent width="400px">
                    <TokenImagePopoverContent
                      onSelect={(value) => setValue(value)}
                      onSelectFile={(file, connection) =>
                        selectFile(file, [connection])
                      }
                    />
                  </PopoverContent>
                </Portal>
              </Popover>
            </Box>
          )}
        </HStack>
      </Row>
    </>
  );
};

const TokenImagesFragment = graphql`
  fragment levaPluginTokenImage_TokenImagesFragment on Query
  @argumentDefinitions(
    count: { type: "Int", defaultValue: 12 }
    cursor: { type: "String" }
    titleFilter: { type: "String" }
  )
  @refetchable(queryName: "levaPluginTokenImage_MoreTokenImagesQuery") {
    tokenImages(first: $count, after: $cursor, titleFilter: $titleFilter)
      @connection(key: "levaPluginTokenImage_tokenImages") {
      __id
      edges {
        node {
          id
          title
          url
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const TokenImagesQuery = graphql`
  query levaPluginTokenImage_TokenImagesQuery(
    $count: Int
    $titleFilter: String
  ) {
    ...levaPluginTokenImage_TokenImagesFragment
      @arguments(count: $count, titleFilter: $titleFilter)
  }
`;

const TokenImageList = (props: {
  data: levaPluginTokenImage_TokenImagesFragment$key;
  onSelect: (tokenImageId: string) => void;
  onSelectFile: (file: File, connection: string) => void;
  titleFilter: string;
  setTitleFilter: (title: string) => void;
}) => {
  const { t } = useI18n();
  const pagination = usePagination(TokenImagesFragment, props.data);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const elementRef = React.useRef<HTMLDivElement>(null);
  return (
    <>
      <PopoverHeader>{t("Select Token Image")}</PopoverHeader>
      <PopoverCloseButton />
      <PopoverBody
        height="200px"
        overflowY="scroll"
        ref={elementRef}
        onScroll={() => {
          if (elementRef.current) {
            const htmlElement = elementRef.current;
            if (
              htmlElement.offsetHeight + htmlElement.scrollTop >=
              0.95 * htmlElement.scrollHeight
            ) {
              pagination.loadNext(16);
            }
          }
        }}
      >
        <SimpleGrid columns={4} spacing={2}>
          {pagination.data.tokenImages?.edges.map((edge) => (
            <Center key={edge.node.id}>
              <VStack
                as="button"
                spacing={0}
                onClick={() => props.onSelect(edge.node.id)}
              >
                <Image
                  borderRadius="full"
                  boxSize="50px"
                  src={edge.node.url}
                  alt={edge.node.title}
                />
                <Text fontSize="xs" noOfLines={1}>
                  {edge.node.title}
                </Text>
              </VStack>
            </Center>
          ))}
        </SimpleGrid>
      </PopoverBody>
      <PopoverFooter>
        <HStack alignItems="center" justifyContent="flex-end" spacing={1}>
          <Box marginRight="auto" marginLeft={0}>
            <InputGroup size="xs">
              <InputLeftElement
                pointerEvents="none"
                children={<Icon.Filter color="gray.300" />}
              />
              <Input
                variant="flushed"
                placeholder={t("Filter")}
                value={props.titleFilter}
                onChange={(ev) => {
                  props.setTitleFilter(ev.target.value);
                }}
              />
              <InputRightElement width="1rem">
                {props.titleFilter !== "" ? (
                  <Button
                    size="xs"
                    onClick={() => props.setTitleFilter("")}
                    variant="unstyled"
                  >
                    <Icon.X color="var(--color-text)" />
                  </Button>
                ) : null}
              </InputRightElement>
            </InputGroup>
          </Box>
          <input
            style={{ display: "none" }}
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(ev) => {
              if (!ev.target.files) {
                return;
              }
              const file = ev.target.files[0]!;
              // GTK's "Custom Files" fallback can bypass accept="image/*".
              if (!file.type.startsWith("image/")) {
                return;
              }
              props.onSelectFile(file, pagination.data.tokenImages?.__id!);
            }}
          />
          {props.titleFilter === "" ? (
            <Button
              size="xs"
              onClick={() => {
                inputRef.current?.click();
              }}
            >
              Upload new Image
            </Button>
          ) : null}
        </HStack>
      </PopoverFooter>
    </>
  );
};

const TokenImagePopoverContent = (props: {
  onSelect: (tokenImageId: string) => void;
  onSelectFile: (file: File, connection: string) => void;
}) => {
  const [titleFilter, setTitleFilter] = React.useState("");

  const query = useQuery<levaPluginTokenImage_TokenImagesQuery>(
    TokenImagesQuery,
    React.useMemo(
      () => ({
        count: 12,
        titleFilter: titleFilter === "" ? null : titleFilter,
      }),
      [titleFilter]
    )
  );

  const [, latestData] = useCurrent(query.data, !query.error && !query.data, 0);

  return latestData ? (
    <TokenImageList
      data={latestData}
      onSelect={props.onSelect}
      onSelectFile={props.onSelectFile}
      titleFilter={titleFilter}
      setTitleFilter={setTitleFilter}
    />
  ) : null;
};

const normalize = (input: { value: string | null }) => ({ value: input.value });

export const levaPluginTokenImage = createPlugin({
  normalize,
  component: TokenImageReference,
});
