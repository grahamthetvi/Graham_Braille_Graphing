import type * as math from "mathjs";

/** One saved formula row shown in the assistant and on the board */
export type SketchEntry = {
  id: string;
  latex: string;
  expr: string;
  compiled: math.EvalFunction;
  curve: any;
  color: string;
  visible: boolean;
};

export type SheetDescriptor = {
  id: string;
  title: string;
  items: SketchEntry[];
};

export type FloatingBarCluster = {
  id: string;
  data: Array<{ label: string; value: number }>;
  position: { x: number; y: number };
  title: string;
};

export type FloatingPieCluster = FloatingBarCluster;

export type UndoFrame = {
  sketchEntries: SketchEntry[];
  floatingBarClusters: FloatingBarCluster[];
  floatingPieClusters: FloatingPieCluster[];
  boardFill: string;
  axisGuidesVisible: boolean;
};
