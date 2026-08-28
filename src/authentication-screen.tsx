import * as React from "react";
import styled from "@emotion/styled/macro";
import { Input } from "@chakra-ui/react";
import * as Button from "./button";
import { BackgroundImageContainer } from "./background-image-container";
import { BrandLogoText } from "./brand-logo-text";
import { Modal, ModalDialogSize } from "./modal";
import { useI18n } from "./i18n";

const ButtonContainer = styled.div`
  margin-top: 16px;
  display: flex;
`;

const ButtonColumn = styled.div`
  margin-left: auto;
  margin-right: 0;
`;

const Link = styled.a`
  display: block;
  text-align: right;
  margin-top: 64px;
  color: white;
  font-family: folkard, cardinal, palitino, serif;
  font-size: 150%;
`;

export const AuthenticationScreen: React.FC<{
  onAuthenticate: (password: string) => void;
  requiredRole: "DM" | "PC";
  fetch: typeof fetch;
}> = ({ onAuthenticate, requiredRole = "DM", fetch }) => {
  const { t } = useI18n();
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  return (
    <BackgroundImageContainer>
      <BrandLogoText />
      <form
        onSubmit={async (ev) => {
          ev.preventDefault();
          setError(null);
          const result = await fetch("/auth", {
            headers: {
              Authorization: `Bearer ${password}`,
            },
          }).then((res) => res.json());
          if (result.data.role === requiredRole || result.data.role === "DM") {
            onAuthenticate(password);
          } else {
            setError(t("Invalid Password!"));
          }
        }}
      >
        <Input
          background="white"
          placeholder={
            requiredRole === "DM" ? t("DM Password") : t("Player Password")
          }
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
        />
        <ButtonContainer>
          <ButtonColumn>
            <Button.Primary type="submit">{t("Log In")}</Button.Primary>
          </ButtonColumn>
        </ButtonContainer>
        <div>
          {requiredRole === "DM" ? (
            <Link href="/">
              {t("Visit Player Section")}
              {" >"}
            </Link>
          ) : (
            <Link href="/dm">
              {t("Visit DM Section")}
              {" >"}
            </Link>
          )}
        </div>
      </form>

      {error ? (
        <Modal onPressEscape={() => undefined}>
          <Modal.Dialog size={ModalDialogSize.SMALL}>
            <Modal.Header>
              <h3>{t("Invalid Password")}</h3>
            </Modal.Header>
            <Modal.Body>
              {t("The password you entered is invalid. Please try again.")}{" "}
              <ButtonContainer>
                <ButtonColumn
                  onClick={() => {
                    setError(null);
                    setPassword("");
                  }}
                >
                  <Button.Primary>{t("Try again.")}</Button.Primary>
                </ButtonColumn>
              </ButtonContainer>
            </Modal.Body>
          </Modal.Dialog>
        </Modal>
      ) : null}
    </BackgroundImageContainer>
  );
};
