import { css } from "@emotion/react";
import { buildUrl } from "./public-url";

export const globalStyles = css`
  /* Base palette: keeps the app styled before the active theme CSS loads (and
  in dev, where build/themes may not exist). MUST match public/themes/default.css. */
  :root {
    --color-accent: #044e54;
    --color-accent-hover: #03464b;
    --color-accent-contrast: #ffffff;
    --color-surface: #ffffff;
    --color-surface-hover: #f0f4f8;
    --color-border: #cbd2d9;
    --color-text: #3e4c58;
    --color-text-muted: #9eb2c7;
    --color-toolbar-active: #223c07;
    --color-danger: #ba2525;
    --color-success: #247305;
    --color-scrollbar: #d1d1d1;
    --color-scrollbar-hover: #b3b3b3;

    /* Remap Chakra's runtime gray ramp to the theme tokens so every Chakra
    component (buttons, inputs, headings, placeholders, steppers, menus)
    follows the active theme. Chakra reads these vars at render time. */
    --chakra-colors-gray-50: var(--color-surface);
    --chakra-colors-gray-100: var(--color-surface-hover);
    --chakra-colors-gray-200: var(--color-surface-hover);
    --chakra-colors-gray-300: var(--color-border);
    --chakra-colors-gray-400: var(--color-text-muted);
    --chakra-colors-gray-500: var(--color-text-muted);
    --chakra-colors-gray-600: var(--color-text);
    --chakra-colors-gray-700: var(--color-text);
    --chakra-colors-gray-800: var(--color-text);
    --chakra-colors-gray-900: var(--color-text);
  }

  @font-face {
    font-family: "folkard";
    src: url("${buildUrl("/fonts/folkard.woff")}") format("woff");
  }

  @font-face {
    font-family: "KnightsTemplar";
    src: url("${buildUrl("/fonts/KnightsTemplar.woff")}") format("woff");
  }

  * {
    box-sizing: border-box;
  }

  button {
    font: unset;
  }

  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
      "Segoe UI Symbol";
    /* user-select: none; */
    font-size: 16px;
    overflow: hidden;
  }

  html {
    touch-action: none;
  }

  .user-select-disabled {
    * {
      user-select: none !important;
    }
  }

  #root {
    height: 100%;
    overflow: hidden;
    /* Prevent content dragging on safari */
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  input[type="range"] {
    height: 38px;
    -webkit-appearance: none;
    margin: 10px 0;
    width: 100%;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 5px;
    cursor: pointer;
    background: var(--color-border);
    border-radius: 5px;
  }

  input[type="range"]::-webkit-slider-thumb {
    box-shadow: 0px 0px 1px #000000;
    height: 15px;
    width: 15px;
    border-radius: 15px;
    background: var(--color-surface);
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -5px;
  }

  .no-focus-outline *:focus {
    outline: none !important;
  }

  /* Custom scrollbar, themable via --color-scrollbar* */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--color-scrollbar);
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-scrollbar-hover);
  }
  ::-webkit-scrollbar-corner {
    background: transparent;
  }

  /* Chakra toggles follow the theme accent (default Chakra blue clashes). */
  .chakra-switch__track[data-checked] {
    background-color: var(--color-accent) !important;
  }
  .chakra-slider__filled-track {
    background-color: var(--color-accent) !important;
  }

  /* Chakra chrome follows theme tokens (focus rings, menus, tooltips). The
  gray ramp remap above covers text/background of the components themselves. */
  .chakra-tooltip {
    background-color: var(--color-surface-hover) !important;
    color: var(--color-text) !important;
  }
  .chakra-input:focus,
  .chakra-input:focus-visible,
  .chakra-select:focus,
  .chakra-textarea:focus {
    border-color: var(--color-accent) !important;
    box-shadow: 0 0 0 1px var(--color-accent) !important;
  }
  .chakra-menu__menu-list {
    background: var(--color-surface) !important;
    border: 1px solid var(--color-border) !important;
    color: var(--color-text) !important;
  }
  .chakra-menu__menuitem:hover,
  .chakra-menu__menuitem:focus {
    background: var(--color-surface-hover) !important;
  }

  .react-colorful__pointer {
    width: 20px;
    height: 20px;
  }
`;
