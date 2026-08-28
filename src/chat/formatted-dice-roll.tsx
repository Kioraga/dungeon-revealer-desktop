import * as React from "react";
import styled from "@emotion/styled/macro";
import { DiceRollResultContext, DiceRollType } from "./chat-message";

const StyledDiceRoll = styled.span`
  padding-right: 4px;
`;

const Wrapper = styled.span`
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 3px;
  border: 1px solid var(--color-border);
  padding-left: 4px;
  padding-top: 2px;
  padding-bottom: 2px;
  padding-right: 4px;
`;

const ResultWrapper = styled(Wrapper)`
  font-weight: bold;
`;

const EqualSign = styled.span`
  padding-left: 2px;
  padding-top: 2px;
  padding-bottom: 2px;
`;

const RollWrapper = styled.span<{ crossedOut: boolean }>`
  text-decoration: ${(p) => (p.crossedOut ? "line-through" : null)};
`;

const colors = {
  fail: "var(--color-danger)",
  crit: "var(--color-success)",
};

const RollResult = styled.span<{
  type: "DEFAULT" | "MIN" | "MAX" | unknown;
}>`
  color: ${(p) =>
    p.type === "MIN" ? colors.fail : p.type === "MAX" ? colors.crit : null};
  font-weight: ${(p) => (p.type !== "DEFAULT" ? "bold" : null)};
`;

export const FormattedDiceRoll = (props: {
  index: string;
  reference?: string;
}) => {
  const index = parseInt(props.index, 10);
  const isReference = !!props.reference;
  const diceRoll = React.useContext(DiceRollResultContext)[
    isReference ? "referencedDiceRolls" : "diceRolls"
  ][index];
  return <DiceRoll diceRoll={diceRoll} />;
};

export const DiceRoll = (props: { diceRoll: DiceRollType }) => {
  return (
    <StyledDiceRoll>
      <Wrapper>
        {props.diceRoll.detail.map((node) => {
          switch (node.__typename) {
            case "DiceRollDiceRollNode":
              return node.rollResults.map((result, index) => (
                <span key={index}>
                  <RollWrapper crossedOut={result.crossedOut}>
                    <RollResult type={result.category}>
                      {result.result}
                    </RollResult>{" "}
                    ({result.dice})
                  </RollWrapper>
                  {index + 1 === node.rollResults.length ? null : " + "}{" "}
                </span>
              ));
            case "%other":
              return null;
            default:
              return node.content + " ";
          }
        })}
      </Wrapper>
      <EqualSign>{" = "}</EqualSign>
      <ResultWrapper>{props.diceRoll.result}</ResultWrapper>
    </StyledDiceRoll>
  );
};
