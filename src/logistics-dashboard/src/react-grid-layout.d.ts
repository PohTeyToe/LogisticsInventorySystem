/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'react-grid-layout' {
  import type { ComponentType, ReactElement } from 'react';

  export interface Layout {
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
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export interface Layouts {
    [key: string]: Layout[];
  }

  export interface ResponsiveGridLayoutProps {
    className?: string;
    layouts?: Layouts;
    breakpoints?: Record<string, number>;
    cols?: Record<string, number>;
    rowHeight?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
    onLayoutChange?: (layout: Layout[], allLayouts: Layouts) => void;
    draggableHandle?: string;
    compactType?: 'vertical' | 'horizontal' | null;
    margin?: [number, number];
    children?: React.ReactNode;
  }

  export const ResponsiveGridLayout: ComponentType<ResponsiveGridLayoutProps>;
  export default function GridLayout(props: any): ReactElement;
}
