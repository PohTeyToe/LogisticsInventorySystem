// Shim for react-grid-layout with verbatimModuleSyntax
// The library uses CJS exports that don't map cleanly to ESM
import ReactGridLayout from 'react-grid-layout';

// In CJS, the module exports an object with Responsive and WidthProvider as properties
// but TypeScript sees the default export as the class component
const RGL = ReactGridLayout as unknown as {
  Responsive: typeof ReactGridLayout;
  WidthProvider: <P>(component: React.ComponentType<P>) => React.ComponentType<Omit<P, 'width'>>;
};

export const ResponsiveGridLayout = RGL.WidthProvider(RGL.Responsive);

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export type GridLayouts = Record<string, GridLayoutItem[]>;
