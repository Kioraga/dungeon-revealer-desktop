// Typings for the Electron preload bridge. Undefined when running in a plain browser (dev).
export type DesktopDisplay = {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  isPrimary: boolean;
};

declare global {
  interface Window {
    desktopApi?: {
      listDisplays: () => Promise<DesktopDisplay[]>;
      openPlayerWindow: (displayId?: number | string) => Promise<void>;
      closePlayerWindow: () => Promise<void>;
    };
  }
}

export {};
