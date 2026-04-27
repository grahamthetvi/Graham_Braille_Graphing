declare module "mathjs" {
  export interface EvalFunction {
    evaluate: (scope: Record<string, number>) => number;
  }
  export function compile(expr: string): EvalFunction;
}

declare module "react-katex" {
  import type * as React from "react";
  export interface InlineMathProps {
    math: string;
  }
  export const InlineMath: React.FC<InlineMathProps>;
}

declare module "editorjs-math" {
  const MathTool: unknown;
  export default MathTool;
}

declare module "@editorjs/editorjs" {
  const EditorJS: unknown;
  export default EditorJS;
}

declare module "mathlive" {
  export class MathfieldElement extends HTMLElement {
    constructor(opts?: Record<string, unknown>);
    getValue: (format?: string) => string;
    setValue: (val: string) => void;
    setOptions?: (opts: Record<string, unknown>) => void;
  }
}
