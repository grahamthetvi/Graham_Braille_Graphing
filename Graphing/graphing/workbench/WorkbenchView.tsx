"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import JXG from "jsxgraph";
import { Button } from "@/graphing/ui/button";
import * as math from "mathjs";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import dynamic from "next/dynamic";
import { Sheet, SheetContent, SheetTitle } from "@/graphing/ui/sheet";
import {
  Dot,
  Minus,
  Circle as CircleIcon,
  FunctionSquare,
  Waves,
  Infinity as InfinityIcon,
  CircleDashed,
  CircleDot,
  ArrowRight,
  Slash,
  Pentagon,
  Tangent,
  Type as TypeIcon,
  Trash2,
  Plus,
  Minus as MinusIcon,
  Plus as PlusIcon,
  Circle as ZeroIcon,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Square as SquareIcon,
  RectangleHorizontal,
  PieChart,
  Send,
  Triangle,
  Star,
  Flower,
  Heart,
  RefreshCw,
  TrendingUp,
  Activity,
  BarChart3,
  Zap,
  Play,
  Pause,
  RotateCw,
  Move,
  ZoomIn,
} from "lucide-react";
import { Card, CardContent } from "@/graphing/ui/card";
import { nanoid } from "nanoid";
import SineEditor from "@/graphing/SineEditor";
import EllipseEditor from "@/graphing/EllipseEditor";
import StatChart from "@/graphing/StatChart";
import BarChartEditor from "@/graphing/BarChartEditor";
import DraggableBarChart from "@/graphing/DraggableBarChart";
import DraggablePieChart from "@/graphing/DraggablePieChart";
import { boardsAreTangent } from "./tangency";
import { latexToMathjsExpression } from "./latexNormalize";
import {
  sampleGradePieSlices,
  sampleScatterCloud,
  sampleSubjectBarRows,
} from "./sampleDatasets";
import type {
  FloatingBarCluster,
  FloatingPieCluster,
  SheetDescriptor,
  SketchEntry,
  UndoFrame,
} from "./types";
import { DepthToggleButton } from "./Button3D";
import { RadialToolMenu } from "./RadialToolMenu";
import { WorkbenchSheetMenu } from "./WorkbenchSheetMenu";
import { WorkbenchToolbar } from "./WorkbenchToolbar";
import { buildWorkbenchToolList } from "./tools/buildWorkbenchToolList";
import {
  applyBoardBackground,
  attachPinchZoomWheel,
  buildClearAllBoardOptions,
  buildResetBoardOptions,
  freeBoardSafe,
  mountWorkbenchPrimaryBoard,
} from "./board/mountWorkbenchBoard";
import { useStatsOverlay } from "./hooks/useStatsOverlay";
import { useWorkbenchSheets } from "./hooks/useWorkbenchSheets";
import { SonificationPanel } from "./SonificationPanel";

// MathLive editor dynamic import
const MathLiveEditor = dynamic(() => import("@/graphing/MathLiveEditor"), { ssr: false });

/**
 * Plot surface with a tool rail for primitives and a JSXGraph-driven canvas.
 */
export default function PlotWorkbench() {
  const plotAreaRef = useRef<HTMLDivElement>(null);
  const jsxBoardRef = useRef<any>(null);

  const {
    sheetList,
    setSheetList,
    focusedSheetId,
    setFocusedSheetId,
    createBoard,
    switchBoard,
  } = useWorkbenchSheets();

  const {
    statsOverlayOpen,
    setStatsOverlayOpen,
    statsViewKind,
    setStatsViewKind,
    statsPayload,
    setStatsPayload,
    showPieChart,
    showScatterChart,
  } = useStatsOverlay();

  const [sketchEntries, setSketchEntries] = useState<SketchEntry[]>([]);
  const [sonifyTargetId, setSonifyTargetId] = useState<string | null>(null);
  const [inlineLatexDraft, setInlineLatexDraft] = useState<string | undefined>(undefined);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [axisGuidesVisible, setAxisGuidesVisible] = useState(true);
  const bgChoices = ["#ffffff", "#f8fafc", "#f0f9ff", "#fefce8", "#faf5ff"];
  const [boardFill, setBoardFill] = useState<string>(bgChoices[0]);

  // track selected toolbar tool (default to ellipse)
  const [activeInstrument, setActiveInstrument] = useState<string>("ellipse");
  
  // bar chart editor state
  const [columnChartDraft, setColumnChartDraft] = useState<{
    data: Array<{label: string; value: number}>;
    elements: any[];
    chartId?: string;
  } | null>(null);

  const [floatingBarClusters, setFloatingBarClusters] = useState<FloatingBarCluster[]>([]);
  const [floatingPieClusters, setFloatingPieClusters] = useState<FloatingPieCluster[]>([]);

  // undoStack management
  const [undoStack, setUndoStack] = useState<UndoFrame[]>([]);
  const [undoPosition, setUndoPosition] = useState(-1);
  
  // circular menu state
  const [radialMenuOpen, setRadialMenuOpen] = useState(false);
  const radialMenuRef = useRef<HTMLDivElement>(null);

  // close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (radialMenuOpen && radialMenuRef.current && !radialMenuRef.current.contains(event.target as Node)) {
        setRadialMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [radialMenuOpen]);

  // save current state to undoStack
  const pushUndoSnapshot = () => {
    const currentState: UndoFrame = {
      sketchEntries: [...sketchEntries],
      floatingBarClusters: [...floatingBarClusters],
      floatingPieClusters: [...floatingPieClusters],
      boardFill,
      axisGuidesVisible
    };

    const prunedStack = undoStack.slice(0, undoPosition + 1);
    prunedStack.push(currentState);
    
    // Keep only last 50 states to prevent memory issues
    if (prunedStack.length > 50) {
      prunedStack.shift();
    } else {
      setUndoPosition(prev => prev + 1);
    }
    
    setUndoStack(prunedStack);
  };

  // restore state from undoStack
  const applyUndoFrame = (state: UndoFrame) => {
    setSketchEntries(state.sketchEntries);
    setFloatingBarClusters(state.floatingBarClusters);
    setFloatingPieClusters(state.floatingPieClusters);
    setBoardFill(state.boardFill);
    setAxisGuidesVisible(state.axisGuidesVisible);
    
    // Clear and redraw board
    if (jsxBoardRef.current) {
      resetBoard();
      state.sketchEntries.forEach(item => {
        addFormulaFromLatex(item.latex);
      });
    }
  };

  // undo operation
  const undo = () => {
    if (undoPosition > 0) {
      const newIndex = undoPosition - 1;
      setUndoPosition(newIndex);
      applyUndoFrame(undoStack[newIndex]);
    }
  };

  // redo operation
  const redo = () => {
    if (undoPosition < undoStack.length - 1) {
      const newIndex = undoPosition + 1;
      setUndoPosition(newIndex);
      applyUndoFrame(undoStack[newIndex]);
    }
  };

  // clear all content
  const clearAll = () => {
    pushUndoSnapshot(); // Save current state before clearing
    setSketchEntries([]);
    setFloatingBarClusters([]);
    setFloatingPieClusters([]);
    
    // Reset board completely
    if (jsxBoardRef.current && plotAreaRef.current) {
      const divId = plotAreaRef.current.id;
      freeBoardSafe(jsxBoardRef.current);
      jsxBoardRef.current = JXG.JSXGraph.initBoard(
        divId,
        buildClearAllBoardOptions(axisGuidesVisible) as never,
      );
      applyBoardBackground(plotAreaRef.current, boardFill);
    }
  };

  const palette = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#14b8a6",
    "#0ea5e9",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
  ];

  // ---- tangency detection ----
  const [hint, setHint] = useState<string | null>(null);
  const lastTangentRef = useRef<string | null>(null);

  // ---- object selection (used by board mount patch; declared early for stable getters) ----
  const selectedObjRef = useRef<any | null>(null);
  const prevStyleRef = useRef<any | null>(null);

  function clearSelection() {
    if (selectedObjRef.current && prevStyleRef.current) {
      selectedObjRef.current.setAttribute(prevStyleRef.current);
    }
    selectedObjRef.current = null;
    prevStyleRef.current = null;
  }

  function selectObject(obj: any) {
    if (!obj || obj === jsxBoardRef.current) return;
    clearSelection();
    prevStyleRef.current = {
      strokeColor: obj.getAttribute("strokeColor"),
      strokeWidth: obj.getAttribute("strokeWidth"),
    };
    obj.setAttribute({ strokeColor: "#9254de", strokeWidth: 3 });
    selectedObjRef.current = obj;
  }

  const updateViewportFnRef = useRef<() => void>(() => {});

  // helper: show temporary hint
  const showHint = (msg: string) => {
    setHint(msg);
    setTimeout(() => setHint(null), 1500);
  };

  // sync sheetList formula state
  useEffect(() => {
    setSheetList(prev => prev.map(b => (b.id === focusedSheetId ? { ...b, items: sketchEntries } : b)));
  }, [sketchEntries]);

  // When the focused sheet changes: sync sketch list and redraw formulas on the board.
  useEffect(() => {
    const boardData = sheetList.find((b) => b.id === focusedSheetId);
    if (!boardData) return;
    setSketchEntries(boardData.items);
    if (jsxBoardRef.current) {
      resetBoard();
      boardData.items.forEach((item) => {
        addFormulaFromLatex(item.latex);
      });
    }
  }, [focusedSheetId]);

  const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);

  // ------- helper actions -------
  const addPoint = () => {
    if (!jsxBoardRef.current) return;
    pushUndoSnapshot(); // Save state before adding point
    jsxBoardRef.current.create("point", [Math.random() * 4 - 2, Math.random() * 4 - 2], {
      name: "",
      size: 3,
      face: "o",
      strokeColor: "#2563eb",
      fillColor: "#3b82f6",
    });
    jsxBoardRef.current.update();
  };

  const addLine = () => {
    if (!jsxBoardRef.current) return;
    pushUndoSnapshot(); // Save state before adding line
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    const p1 = jsxBoardRef.current.create("point", [-2, Math.random() * 4 - 2], { visible: false });
    const p2 = jsxBoardRef.current.create("point", [2, Math.random() * 4 - 2], { visible: false });
    jsxBoardRef.current.create("line", [p1, p2], { 
      strokeColor: "#14b8a6", 
      strokeWidth: 2,
      straightFirst: true,
      straightLast: true 
    });
    jsxBoardRef.current.update();
  };

  const addCircle = () => {
    if (!jsxBoardRef.current) return;
    pushUndoSnapshot(); // Save state before adding circle
    const center = jsxBoardRef.current.create("point", [0, 0], { visible: false });
    jsxBoardRef.current.create("circle", [center, 2], { strokeColor: "#f97316", strokeWidth: 2 });
    jsxBoardRef.current.update();
  };

  const addParabola = () => {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    jsxBoardRef.current.create(
      "functiongraph",
      [function (x: number) {
        return 0.25 * x * x; // y = (1/4) x^2 so it fits bounding box
      }, left, right],
      { strokeColor: "#9333ea", strokeWidth: 2 }
    );
    jsxBoardRef.current.update();
  };

  const addSine = () => {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    const A = 1;
    const k = 1;
    const fn = (x: number) => A * Math.sin(k * x);
    const curve = jsxBoardRef.current.create("functiongraph", [fn, left, right], {
      strokeColor: "#2563eb",
      strokeWidth: 2,
    });
    (curve as any)._sineParams = { A, k };
    curve.on("dblclick", () => {
      const params = (curve as any)._sineParams;
      setSineEdit({ curve, A: params.A, k: params.k });
    });
    jsxBoardRef.current.update();
  };

  const addHyperbola = () => {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    // Two branches y = 1/x
    const f = (x: number) => 1 / x;
    jsxBoardRef.current.create("functiongraph", [f, left, -0.2], { strokeColor: "#16a34a", strokeWidth: 2 });
    jsxBoardRef.current.create("functiongraph", [f, 0.2, right], { strokeColor: "#16a34a", strokeWidth: 2 });
    jsxBoardRef.current.update();
  };

  const addEllipse = () => {
    if (!jsxBoardRef.current) return;
    const a = 3;
    const b = 2;
    jsxBoardRef.current.create(
      "curve",
      [
        function (t: number) {
          return a * Math.cos(t);
        },
        function (t: number) {
          return b * Math.sin(t);
        },
        0,
        2 * Math.PI,
      ],
      { strokeColor: "#e11d48", strokeWidth: 2 }
    );
    jsxBoardRef.current.update();
  };

  const addEllipseDialog = () => {
    // open custom modal instead of browser prompt
    setEllipseEdit({ a: 3, b: 2 });
  };

  const addVector = () => {
    if (!jsxBoardRef.current) return;
    const p1 = jsxBoardRef.current.create("point", [Math.random() * 4 - 2, Math.random() * 4 - 2], { visible: false });
    const p2 = jsxBoardRef.current.create("point", [Math.random() * 4 - 2, Math.random() * 4 - 2], { visible: false });
    jsxBoardRef.current.create("arrow", [p1, p2], { strokeColor: "#0ea5e9", strokeWidth: 2 });
    jsxBoardRef.current.update();
  };

  const addSegment = () => {
    if (!jsxBoardRef.current) return;
    const p1 = jsxBoardRef.current.create("point", [Math.random() * 4 - 2, Math.random() * 4 - 2], { visible: false });
    const p2 = jsxBoardRef.current.create("point", [Math.random() * 4 - 2, Math.random() * 4 - 2], { visible: false });
    jsxBoardRef.current.create("segment", [p1, p2], { strokeColor: "#38bdf8", strokeWidth: 2 });
    jsxBoardRef.current.update();
  };

  const addPolygon = () => {
    if (!jsxBoardRef.current) return;
    const p1 = jsxBoardRef.current.create("point", [-1, 1], { visible: false });
    const p2 = jsxBoardRef.current.create("point", [1, 1], { visible: false });
    const p3 = jsxBoardRef.current.create("point", [0, -1], { visible: false });
    jsxBoardRef.current.create("polygon", [p1, p2, p3], { strokeColor: "#facc15", fillColor: "#fef08a", fillOpacity: 0.3 });
    jsxBoardRef.current.update();
  };

  const addTangent = () => {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    const x0 = Math.random() * 4 - 2;
    const slope = 0.5 * x0; // derivative of (1/4)x^2
    jsxBoardRef.current.create(
      "functiongraph",
      [function (x: number) {
        return slope * (x - x0) + 0.25 * x0 * x0;
      }, left, right],
      { strokeColor: "#f43f5e", dash: 2, strokeWidth: 2 }
    );
    jsxBoardRef.current.update();
  };

  const addText = () => {
    if (!jsxBoardRef.current) return;
    const x = Math.random() * 4 - 2;
    const y = Math.random() * 4 - 2;
    jsxBoardRef.current.create("text", [x, y, "Hello"], { anchorX: "left", anchorY: "middle", fontSize: 14, strokeColor: "#000" });
    jsxBoardRef.current.update();
  };

  const resetBoard = () => {
    if (!jsxBoardRef.current || !plotAreaRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox
      ? jsxBoardRef.current.getBoundingBox()
      : [-12, 12, 12, -12];
    const divId = plotAreaRef.current.id;
    freeBoardSafe(jsxBoardRef.current);
    jsxBoardRef.current = JXG.JSXGraph.initBoard(
      divId,
      buildResetBoardOptions(bb) as never,
    );
  };

  const addFormulaFromLatex = (latex: string) => {
    if (!jsxBoardRef.current) return;
    const normalized = latexToMathjsExpression(latex);
    try {
      const compiled = math.compile(normalized as string);
      const fn = (x: number) => compiled.evaluate({ x }) as number;
      addCompiled(latex, normalized, compiled, fn);
    } catch {
      // fallback: use math.parseLatex if available
      try {
        const parseFn = (math as any)['parseLatex'];
        const node = parseFn ? parseFn(latex) : null;
        if (node) {
          const compiled = node.compile();
          const fn = (x: number) => compiled.evaluate({ x }) as number;
          addCompiled(latex, latex, compiled, fn);
          return;
        }
        throw new Error();
      } catch (err) {
        showHint("Could not parse the formula. Check the syntax.");
      }
    }
  };

  const addCompiled = (latex: string, expr: string, compiled: any, fn: (x:number)=>number) => {
    if (!jsxBoardRef.current) return;
    pushUndoSnapshot(); // Save state before adding formula
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    const color = palette[sketchEntries.length % palette.length];
    const curve = jsxBoardRef.current.create("functiongraph", [fn, left, right], {
      strokeColor: color,
      strokeWidth: 2,
    });
    jsxBoardRef.current.update();

    const newItem: SketchEntry = {
      id: Math.random().toString(36).slice(2),
      latex,
      expr,
      compiled,
      curve,
      color,
      visible: true,
    };
    setSketchEntries((prev) => [...prev, newItem]);
  };

  const toggleVisible = (id: string) => {
    setSketchEntries((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          item.visible = !item.visible;
          item.curve.setAttribute({ visible: item.visible });
          if (jsxBoardRef.current) jsxBoardRef.current.update();
        }
        return { ...item };
      })
    );
  };

  const removeFormula = (id: string) => {
    pushUndoSnapshot(); // Save state before removing formula
    setSketchEntries((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.curve && jsxBoardRef.current) {
        jsxBoardRef.current.removeObject(item.curve);
        jsxBoardRef.current.update();
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  // auto scroll chat
  useEffect(() => {
    const el = document.getElementById("plot-assistant-scroll");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    // resize board to account for chat panel width changes
    if (jsxBoardRef.current && plotAreaRef.current) {
      const w = plotAreaRef.current.clientWidth;
      const h = plotAreaRef.current.clientHeight;
      if (typeof jsxBoardRef.current.resizeContainer === "function") {
        jsxBoardRef.current.resizeContainer(w, h);
        jsxBoardRef.current.update();
      }
    }
  }, [sketchEntries, assistantOpen]);

  // ===== Ellipse by foci interactive =====
  const ellipseModeRef = useRef(false);
  const ellipseHandlerRef = useRef<any>(null);

  const startEllipseFociMode = () => {
    if (!jsxBoardRef.current || ellipseModeRef.current) return;
    ellipseModeRef.current = true;
    const board = jsxBoardRef.current;
    const foci: any[] = [];
    showHint("Click the board twice to place the two foci");

    const clickHandler = (evt: PointerEvent) => {
      if (!ellipseModeRef.current) return;
      // get screen position then transform to user coords
      // @ts-ignore
      const mPos = board.getMousePosition ? board.getMousePosition(evt) : [evt.clientX, evt.clientY];
      const coordObj = new (JXG as any).Coords((JXG as any).COORDS_BY_SCREEN, mPos, board);
      const pt = board.create("point", [coordObj.usrCoords[1], coordObj.usrCoords[2]], {
        name: "F" + (foci.length + 1),
        size: 3,
        face: "x",
      });
      foci.push(pt);

      if (foci.length === 2) {
        const dx = foci[0].X() - foci[1].X();
        const dy = foci[0].Y() - foci[1].Y();
        const cDist = Math.sqrt(dx * dx + dy * dy) / 2;
        // use a default a value slightly larger than cDist
        const aVal = cDist + 1;
        const cx = (foci[0].X() + foci[1].X()) / 2;
        const cy = (foci[0].Y() + foci[1].Y()) / 2;
        const theta = Math.atan2(foci[1].Y() - foci[0].Y(), foci[1].X() - foci[0].X());
        const bVal = Math.sqrt(aVal * aVal - cDist * cDist);
        board.create(
          "curve",
          [
            function (t: number) {
              return cx + Math.cos(theta) * aVal * Math.cos(t) - Math.sin(theta) * bVal * Math.sin(t);
            },
            function (t: number) {
              return cy + Math.sin(theta) * aVal * Math.cos(t) + Math.cos(theta) * bVal * Math.sin(t);
            },
            0,
            2 * Math.PI,
          ],
          { strokeColor: "#06b6d4", strokeWidth: 2 }
        );
        board.update();
        showHint("Ellipse drawn");
        // exit mode
        ellipseModeRef.current = false;
        board.off("down", clickHandler);
      }
    };

    ellipseHandlerRef.current = clickHandler;
    board.on("down", clickHandler);
  };

  // ------- Animation control functions -------
  const stopAnimation = () => {
    console.log('Stopping animation');
    setIsAnimating(false);
    setAnimationType(null);
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const startSimpleAnimation = () => {
    if (!jsxBoardRef.current) {
      console.log('No board available for simple animation');
      return;
    }

    console.log('Starting simple animation test');
    
    // Create a simple moving point
    let x = -3;
    const point = jsxBoardRef.current.create("point", [x, 0], {
      size: 5,
      face: "o",
      strokeColor: "#ff0000",
      fillColor: "#ff0000",
      name: "Moving Point"
    });

    const movePoint = () => {
      x += 0.1;
      if (x > 3) x = -3; // Reset position
      
      point.moveTo([x, Math.sin(x)], 0);
      jsxBoardRef.current!.update();
      
      console.log('Point moved to:', x, Math.sin(x));
      
      setTimeout(movePoint, 50); // 20 FPS
    };

    movePoint();
  };

  const addBarChartToCanvas = (customData?: Array<{label: string; value: number}>) => {
    if (!jsxBoardRef.current) return;
    
    const data = customData || sampleSubjectBarRows();
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = 0.8;
    const barSpacing = 1.2;
    
    // Create bars and text labels
    const elements: any[] = [];
    
    data.forEach((d, i) => {
      const x = i * barSpacing - (data.length - 1) * barSpacing / 2;
      const height = (d.value / maxValue) * 3; // Scale to max height of 3 units
      
      // Create bar as a polygon (rectangle)
      const bar = jsxBoardRef.current!.create('polygon', [
        [x - barWidth/2, 0],
        [x + barWidth/2, 0],
        [x + barWidth/2, height],
        [x - barWidth/2, height]
      ], {
        fillColor: '#3b82f6',
        fillOpacity: 0.7,
        strokeColor: '#1d4ed8',
        strokeWidth: 2,
        vertices: { visible: false },
        borders: { visible: false },
        fixed: false // Allow dragging
      });
      
      // Create invisible draggable point at the top of the bar for height adjustment
      const dragPoint = jsxBoardRef.current!.create('point', [x, height], {
        visible: false,
        fixed: false,
        snapToGrid: false,
        attractors: []
      });
      
      // Add label below bar
      const label = jsxBoardRef.current!.create('text', [x, -0.5, d.label], {
        fontSize: 12,
        anchorX: 'middle',
        anchorY: 'top',
        color: '#333'
      });
      
      // Add value above bar
      const valueText = jsxBoardRef.current!.create('text', [x, height + 0.2, d.value.toString()], {
        fontSize: 12,
        anchorX: 'middle',
        anchorY: 'bottom',
        color: '#333'
      });
      
      // Add drag functionality to update bar height
      dragPoint.on('drag', function() {
        const newHeight = Math.max(0.1, Math.min(5, dragPoint.Y())); // Constrain height between 0.1 and 5
        const newValue = Math.round((newHeight / 3) * maxValue); // Convert height back to value
        
        // Update drag point position
        dragPoint.moveTo([x, newHeight], 0);
        
        // Update polygon vertices (top two points)
        const vertices = bar.vertices;
        if (vertices && vertices.length >= 4) {
          vertices[2].moveTo([x + barWidth/2, newHeight], 0); // Top right
          vertices[3].moveTo([x - barWidth/2, newHeight], 0); // Top left
        }
        
        // Update value text position and content
        valueText.setText(newValue.toString());
        valueText.moveTo([x, newHeight + 0.2], 0);
        
        // Update the data reference
        d.value = newValue;
        
        jsxBoardRef.current!.update();
      });
      
      // Create a visible drag handle at the top center of the bar
      const dragHandle = jsxBoardRef.current!.create('point', [x, height], {
        size: 4,
        face: 'diamond',
        fillColor: '#059669',
        strokeColor: '#047857',
        strokeWidth: 2,
        name: '',
        fixed: false,
        snapToGrid: false,
        showInfobox: false,
        highlight: true,
        highlightFillColor: '#10b981',
        highlightStrokeColor: '#065f46'
      });
      
      // Sync drag handle with invisible drag point
      dragHandle.on('drag', function() {
        const newHeight = Math.max(0.1, Math.min(5, dragHandle.Y()));
        const newValue = Math.round((newHeight / 3) * maxValue);
        
        // Update positions
        dragPoint.moveTo([x, newHeight], 0);
        dragHandle.moveTo([x, newHeight], 0);
        
        // Update polygon vertices
        const vertices = bar.vertices;
        if (vertices && vertices.length >= 4) {
          vertices[2].moveTo([x + barWidth/2, newHeight], 0);
          vertices[3].moveTo([x - barWidth/2, newHeight], 0);
        }
        
        // Update value text
        valueText.setText(newValue.toString());
        valueText.moveTo([x, newHeight + 0.2], 0);
        
        // Update data
        d.value = newValue;
        
        jsxBoardRef.current!.update();
      });

      // Store chart reference for editing
      const chartRef = {
        bar, label, valueText, dragPoint, dragHandle, data: d,
        openEditor: () => {
          setColumnChartDraft({
            data: [...data],
            elements: elements
          });
        }
      };
      
      elements.push(chartRef);
    });
    
    // Add chart title
    const title = jsxBoardRef.current.create('text', [0, 4, 'Subject scores (bar chart)'], {
      fontSize: 16,
      anchorX: 'middle',
      anchorY: 'bottom',
      color: '#333',
      fontWeight: 'bold'
    });
    
    // Add usage instructions
    const instructions = jsxBoardRef.current.create('text', [0, 3.5, 'Drag the diamond handle to adjust values | Double-click handle to open editor'], {
      fontSize: 10,
      anchorX: 'middle',
      anchorY: 'bottom',
      color: '#666',
      fontStyle: 'italic'
    });
    
    elements.push({ title, instructions });
    
    // Add click handler to open editor - multiple elements
    elements.forEach((element, index) => {
      const openEditor = () => {
        console.log(`Opening editor for bar ${index}...`);
        setColumnChartDraft({
          data: [...data], // Create a copy
          elements: elements
        });
      };
      
      // Make bar clickable
      if (element.bar) {
        element.bar.setAttribute({
          highlight: true,
          highlightStrokeColor: '#059669',
          highlightFillColor: '#10b981',
          fixed: false
        });
        
        element.bar.on('up', openEditor);
      }
      
      // Make label clickable too
      if (element.label) {
        element.label.setAttribute({
          highlight: true,
          highlightStrokeColor: '#059669'
        });
        element.label.on('up', openEditor);
      }
      
      // Make value text clickable
      if (element.valueText) {
        element.valueText.setAttribute({
          highlight: true,
          highlightStrokeColor: '#059669'
        });
        element.valueText.on('up', openEditor);
      }
      
      // Make drag handle double-clickable to open editor
      if (element.dragHandle) {
        let clickCount = 0;
        element.dragHandle.on('up', function() {
          clickCount++;
          setTimeout(() => {
            if (clickCount === 2) {
              console.log(`Drag handle double-clicked for bar ${index}...`);
              openEditor();
            }
            clickCount = 0;
          }, 300);
        });
      }
    });
    
    jsxBoardRef.current.update();
    return elements;
  };

  const showBarChart = () => {
    addBarChartToCanvas();
  };

  const addDraggableBarChart = () => {
    pushUndoSnapshot(); // Save state before adding chart
    const newChart = {
      id: nanoid(),
      data: sampleSubjectBarRows(),
      position: { x: 0, y: 0 },
      title: "Subject scores (bar chart)"
    };
    setFloatingBarClusters(prev => [...prev, newChart]);
  };

  const editDraggableChart = (chartId: string) => {
    const chart = floatingBarClusters.find(c => c.id === chartId);
    if (chart) {
      setColumnChartDraft({
        data: [...chart.data],
        elements: [],
        chartId: chartId // identify draggable bar chart being edited
      });
    }
  };

  const removeDraggableChart = (chartId: string) => {
    pushUndoSnapshot(); // Save state before removing chart
    setFloatingBarClusters(prev => prev.filter(c => c.id !== chartId));
  };

  const updateDraggableChart = (chartId: string, newData: Array<{label: string; value: number}>) => {
    setFloatingBarClusters(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, data: newData } : chart
    ));
  };

  // draggable pie chart functions
  const addDraggablePieChart = () => {
    pushUndoSnapshot(); // Save state before adding chart
    const newChart = {
      id: nanoid(),
      data: sampleGradePieSlices(),
      position: { x: 2, y: 2 },
      title: "Grade distribution (pie chart)"
    };
    setFloatingPieClusters(prev => [...prev, newChart]);
  };

  const editDraggablePieChart = (chartId: string) => {
    const chart = floatingPieClusters.find(c => c.id === chartId);
    if (chart) {
      setColumnChartDraft({
        data: [...chart.data],
        elements: [],
        chartId: chartId // same editor; used for pie chart path
      });
    }
  };

  const removeDraggablePieChart = (chartId: string) => {
    pushUndoSnapshot(); // Save state before removing pie chart
    setFloatingPieClusters(prev => prev.filter(c => c.id !== chartId));
  };

  const updateDraggablePieChart = (chartId: string, newData: Array<{label: string; value: number}>) => {
    setFloatingPieClusters(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, data: newData } : chart
    ));
  };

  const toggleAxes = () => {
    if (!jsxBoardRef.current) return;
    const next = !axisGuidesVisible;
    setAxisGuidesVisible(next);
    const b: any = jsxBoardRef.current;
    if (b.defaultAxes) {
      Object.values(b.defaultAxes).forEach((axis: any) => axis.setAttribute({ visible: next }));
    }
    // toggle grid visibility
    b.objectsList?.forEach((obj: any) => {
      if (obj.elType === "grid") obj.setAttribute({ visible: next });
    });
    b.update();
  };

  // nav control handlers
  const zoomFactor = 1.25;
  const zoomIn = () => {
    if (!jsxBoardRef.current) return;
    jsxBoardRef.current.zoomIn();
    updateFunctionGraphRanges();
  };
  const zoomOut = () => {
    if (!jsxBoardRef.current) return;
    jsxBoardRef.current.zoomOut();
    updateFunctionGraphRanges();
  };
  const resetOrigin = () => {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    jsxBoardRef.current.setOrigin(0,0);
    jsxBoardRef.current.setBoundingBox(bb, false);
  };

  const pan = (dx:number,dy:number)=>{
    if(!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const newBB = [bb[0]-dx,bb[1]-dy,bb[2]-dx,bb[3]-dy];
    jsxBoardRef.current.setBoundingBox(newBB,false);
    updateFunctionGraphRanges();
  };

  // Update all function graphs to extend to current viewport
  const updateFunctionGraphRanges = () => {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    
    console.log('Updating function ranges to:', { left, right, top, bottom });
    console.log('Total objects:', jsxBoardRef.current.objectsList?.length || 0);
    
    // Get a copy of all objects to avoid modification during iteration
    const allObjects = [...(jsxBoardRef.current.objectsList || [])];
    
    allObjects.forEach((obj: any) => {
      if (obj.elType === 'functiongraph') {
        try {
          const color = obj.getAttribute('strokeColor');
          const width = obj.getAttribute('strokeWidth');
          const dash = obj.getAttribute('dash');
          
          // Store function metadata if it exists
          const sineParams = obj._sineParams;
          
          // Remove the old object
          jsxBoardRef.current!.removeObject(obj);
          
          // Recreate based on stored metadata or function signature
          if (sineParams) {
            // Sine function
            const { A, k } = sineParams;
            const fn = (x: number) => A * Math.sin(k * x);
            const newCurve = jsxBoardRef.current!.create("functiongraph", [fn, left, right], {
              strokeColor: color,
              strokeWidth: width,
            });
            (newCurve as any)._sineParams = { A, k };
            newCurve.on("dblclick", () => {
              setSineEdit({ curve: newCurve, A, k });
            });
          } else if (obj.Y && obj.Y.toString().includes('0.25')) {
            // Parabola
            jsxBoardRef.current!.create("functiongraph", [
              function (x: number) { return 0.25 * x * x; }, 
              left, right
            ], { strokeColor: color, strokeWidth: width });
          } else if (obj.Y && obj.Y.toString().includes('1/')) {
            // Hyperbola
            const f = (x: number) => 1 / x;
            jsxBoardRef.current!.create("functiongraph", [f, left, -0.2], { strokeColor: color, strokeWidth: width });
            jsxBoardRef.current!.create("functiongraph", [f, 0.2, right], { strokeColor: color, strokeWidth: width });
          } else if (dash === 2) {
            // Tangent line - recreate with random parameters for now
            const x0 = Math.random() * 4 - 2;
            const slope = 0.5 * x0;
            jsxBoardRef.current!.create("functiongraph", [
              function (x: number) { return slope * (x - x0) + 0.25 * x0 * x0; }, 
              left, right
            ], { strokeColor: color, dash: 2, strokeWidth: width });
          } else if (color === '#3b82f6') {
            // Normal distribution
            const mu = 0;
            const sigma = 1;
            const normalPDF = (x: number) => {
              return (1 / (sigma * Math.sqrt(2 * Math.PI))) * 
                     Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
            };
            jsxBoardRef.current!.create("functiongraph", [normalPDF, left, right], {
              strokeColor: color, strokeWidth: width
            });
          } else if (color === '#f59e0b') {
            // Exponential distribution
            const lambda = 1;
            const exponentialPDF = (x: number) => {
              return x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
            };
            const startX = Math.max(0, left);
            jsxBoardRef.current!.create("functiongraph", [exponentialPDF, startX, right], {
              strokeColor: color, strokeWidth: width
            });
          } else if (color === '#06b6d4') {
            // Gamma distribution
            const alpha = 2;
            const beta = 2;
            const gamma = (z: number): number => {
              if (z === 1) return 1;
              if (z === 2) return 1;
              if (z === 3) return 2;
              if (z === 4) return 6;
              return Math.sqrt(2 * Math.PI / z) * Math.pow(z / Math.E, z);
            };
            const gammaPDF = (x: number) => {
              if (x <= 0) return 0;
              return (Math.pow(beta, alpha) / gamma(alpha)) * 
                     Math.pow(x, alpha - 1) * 
                     Math.exp(-beta * x);
            };
            const startX = Math.max(0.01, left);
            jsxBoardRef.current!.create("functiongraph", [gammaPDF, startX, right], {
              strokeColor: color, strokeWidth: width
            });
          }
        } catch (e) {
          console.warn('Failed to update function graph:', e);
        }
      }
    });

    // Update formula items
    sketchEntries.forEach(item => {
      if (item.curve && item.curve.elType === 'functiongraph') {
        try {
          const fn = (x: number) => item.compiled.evaluate({ x }) as number;
          jsxBoardRef.current!.removeObject(item.curve);
          const newCurve = jsxBoardRef.current!.create("functiongraph", [fn, left, right], {
            strokeColor: item.color,
            strokeWidth: 2,
          });
          item.curve = newCurve;
        } catch (e) {
          console.warn('Failed to update formula graph:', e);
        }
      }
    });
    
    jsxBoardRef.current.update();
  };

  updateViewportFnRef.current = updateFunctionGraphRanges;

  useEffect(() => {
    if (!plotAreaRef.current) return;
    return mountWorkbenchPrimaryBoard({
      plotArea: plotAreaRef.current,
      boardRef: jsxBoardRef,
      getSelectObject: () => selectObject,
      getScheduleViewportUpdate: () => updateViewportFnRef.current,
    });
  }, [focusedSheetId]);

  useEffect(() => {
    if (!plotAreaRef.current || !jsxBoardRef.current) return;
    return attachPinchZoomWheel({
      plotArea: plotAreaRef.current,
      boardRef: jsxBoardRef,
      getScheduleViewportUpdate: () => updateViewportFnRef.current,
      wheelHandlerRef,
    });
  }, []);

  // attach event listener once board ready
  useEffect(() => {
    if (!jsxBoardRef.current) return;
    const board = jsxBoardRef.current as any;

    // keydown delete
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedObjRef.current) {
        try {
          board.removeObject(selectedObjRef.current);
        } catch {}
        board.update();
        clearSelection();
      }
      // Add 'U' key to manually trigger function range update
      if (e.key === 'u' || e.key === 'U') {
        console.log('Manual update triggered by U key');
        updateFunctionGraphRanges();
      }
    };
    window.addEventListener("keydown", keyHandler);

    const checkTangency = () => {
      const objs = board.objectsList || [];
      for (let i = 0; i < objs.length; i++) {
        for (let j = i + 1; j < objs.length; j++) {
          if (boardsAreTangent(objs[i], objs[j])) {
            const idStr = [objs[i].id, objs[j].id].sort().join("-");
            if (lastTangentRef.current !== idStr) {
              lastTangentRef.current = idStr;
              showHint("Tangent");
            }
            return;
          }
        }
      }
    };
    board.on("up", checkTangency);
    return () => {
      board.off("up", checkTangency);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [focusedSheetId]);

  // ---- additional shapes for "more" menu ----
  function randomPoint() {
    return [Math.random() * 4 - 2, Math.random() * 4 - 2] as [number, number];
  }

  function addArc() {
    if (!jsxBoardRef.current) return;
    const center = jsxBoardRef.current.create("point", randomPoint(), { visible: false });
    const p1 = jsxBoardRef.current.create("point", [center.X() + 2, center.Y()], { visible: false });
    const p2 = jsxBoardRef.current.create("point", [center.X(), center.Y() + 2], { visible: false });
    jsxBoardRef.current.create("arc", [center, p1, p2], {
      strokeColor: "#fb923c",
      strokeWidth: 2,
    });
    jsxBoardRef.current.update();
  }

  function addSector() {
    if (!jsxBoardRef.current) return;
    const center = jsxBoardRef.current.create("point", randomPoint(), { visible: false });
    const p1 = jsxBoardRef.current.create("point", [center.X() + 2, center.Y()], { visible: false });
    const p2 = jsxBoardRef.current.create("point", [center.X(), center.Y() + 2], { visible: false });
    jsxBoardRef.current.create("sector", [center, p1, p2], {
      strokeColor: "#ec4899",
      fillColor: "#f472b6",
      fillOpacity: 0.2,
      strokeWidth: 2,
    });
    jsxBoardRef.current.update();
  }

  function addAngle() {
    if (!jsxBoardRef.current) return;
    const vertex = jsxBoardRef.current.create("point", randomPoint(), { visible: false });
    const p1 = jsxBoardRef.current.create("point", [vertex.X() - 2, vertex.Y()], { visible: false });
    const p2 = jsxBoardRef.current.create("point", [vertex.X(), vertex.Y() + 2], { visible: false });
    jsxBoardRef.current.create("angle", [p1, vertex, p2], {
      strokeColor: "#8b5cf6",
      radius: 1.5,
    });
    jsxBoardRef.current.update();
  }

  function addRay() {
    if (!jsxBoardRef.current) return;
    const p1 = jsxBoardRef.current.create("point", randomPoint(), { visible: false });
    const p2 = jsxBoardRef.current.create("point", [p1.X() + 2, p1.Y() + 1], { visible: false });
    jsxBoardRef.current.create("arrow", [p1, p2], { strokeColor: "#16a34a", strokeWidth: 2 });
    jsxBoardRef.current.update();
  }

  // Utility to enable width/height editing on double-click for rectangular polygons
  function enableRectEdit(p1: any, p2: any, p3: any, p4: any) {
    const rectWidth = () => Math.abs(p2.X() - p1.X());
    const rectHeight = () => Math.abs(p1.Y() - p4.Y());

    // Attach on polygon later (created after points)
    const poly = jsxBoardRef.current?.createElement && jsxBoardRef.current.objectsList.find((o: any) => {
      return o.vertices && o.vertices.includes && o.vertices.includes(p1) && o.vertices.includes(p3);
    });
    if (!poly) return;

    poly.on("dblclick", () => {
      const wVal = rectWidth();
      const hVal = rectHeight();
      setRectW(wVal.toFixed(2));
      setRectH(hVal.toFixed(2));
      setRectEdit({ p1, p2, p3, p4, w: wVal, h: hVal });
    });
  }

  // Modify addRectangle and addSquare to call enableRectEdit
  function addRectangle() {
    if (!jsxBoardRef.current) return;
    const [x, y] = randomPoint();
    const w = 3;
    const h = 2;
    const p1 = jsxBoardRef.current.create("point", [x, y], { visible: false });
    const p2 = jsxBoardRef.current.create("point", [x + w, y], { visible: false });
    const p3 = jsxBoardRef.current.create("point", [x + w, y - h], { visible: false });
    const p4 = jsxBoardRef.current.create("point", [x, y - h], { visible: false });
    jsxBoardRef.current.create("polygon", [p1, p2, p3, p4], { strokeColor: "#0ea5e9", strokeWidth: 2 });
    enableRectEdit(p1, p2, p3, p4);
    jsxBoardRef.current.update();
  }

  function addSquare() {
    if (!jsxBoardRef.current) return;
    const [x, y] = randomPoint();
    const s = 2.5;
    const p1 = jsxBoardRef.current.create("point", [x, y], { visible: false });
    const p2 = jsxBoardRef.current.create("point", [x + s, y], { visible: false });
    const p3 = jsxBoardRef.current.create("point", [x + s, y - s], { visible: false });
    const p4 = jsxBoardRef.current.create("point", [x, y - s], { visible: false });
    jsxBoardRef.current.create("polygon", [p1, p2, p3, p4], { strokeColor: "#eab308", strokeWidth: 2 });
    enableRectEdit(p1, p2, p3, p4);
    jsxBoardRef.current.update();
  }

  // ---- six additional tools ----
  function addHexagon() {
    if (!jsxBoardRef.current) return;
    const [cx, cy] = randomPoint();
    const r = 2.5;
    const pts = [] as any[];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      pts.push(jsxBoardRef.current.create("point", [cx + r * Math.cos(angle), cy + r * Math.sin(angle)], { visible: false }));
    }
    jsxBoardRef.current.create("polygon", pts, { strokeColor: "#f43f5e", strokeWidth: 2 });
    jsxBoardRef.current.update();
  }

  function addStar() {
    if (!jsxBoardRef.current) return;
    const [cx, cy] = randomPoint();
    const rOuter = 3;
    const rInner = 1.2;
    const pts = [] as any[];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(jsxBoardRef.current.create("point", [cx + r * Math.cos(angle), cy + r * Math.sin(angle)], { visible: false }));
    }
    jsxBoardRef.current.create("polygon", pts, { strokeColor: "#f59e0b", strokeWidth: 2 });
    jsxBoardRef.current.update();
  }

  function addRose() {
    if (!jsxBoardRef.current) return;
    jsxBoardRef.current.create(
      "curve",
      [
        function (t: number) {
          return 2 * Math.cos(4 * t) * Math.cos(t);
        },
        function (t: number) {
          return 2 * Math.cos(4 * t) * Math.sin(t);
        },
        0,
        2 * Math.PI,
      ],
      { strokeColor: "#10b981", strokeWidth: 2 }
    );
    jsxBoardRef.current.update();
  }

  function addSpiral() {
    if (!jsxBoardRef.current) return;
    jsxBoardRef.current.create(
      "curve",
      [
        function (t: number) {
          return 0.2 * Math.exp(0.2 * t) * Math.cos(t);
        },
        function (t: number) {
          return 0.2 * Math.exp(0.2 * t) * Math.sin(t);
        },
        0,
        10,
      ],
      { strokeColor: "#0ea5e9", strokeWidth: 2 }
    );
    jsxBoardRef.current.update();
  }

  function addHeart() {
    if (!jsxBoardRef.current) return;
    jsxBoardRef.current.create(
      "curve",
      [
        function (t: number) {
          return 2 * Math.sin(t) ** 3;
        },
        function (t: number) {
          return 2 * Math.cos(t) - Math.cos(2 * t) - 0.5 * Math.cos(3 * t) - 0.2 * Math.cos(4 * t);
        },
        0,
        2 * Math.PI,
      ],
      { strokeColor: "#ec4899", strokeWidth: 2 }
    );
    jsxBoardRef.current.update();
  }

  // Statistical distribution functions
  function addNormalDistribution() {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    
    // Standard normal distribution: μ=0, σ=1
    const mu = 0;
    const sigma = 1;
    const normalPDF = (x: number) => {
      return (1 / (sigma * Math.sqrt(2 * Math.PI))) * 
             Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    };
    
    jsxBoardRef.current.create("functiongraph", [normalPDF, left, right], {
      strokeColor: "#3b82f6",
      strokeWidth: 2,
    });
    
    // Add mean line
    jsxBoardRef.current.create("line", [[mu, bottom], [mu, top]], {
      strokeColor: "#1d4ed8",
      strokeWidth: 1,
      dash: 2,
    });
    
    jsxBoardRef.current.update();
  }

  function addExponentialDistribution() {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    
    // Exponential distribution: λ=1
    const lambda = 1;
    const exponentialPDF = (x: number) => {
      return x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
    };
    
    // Only draw for x >= 0
    const startX = Math.max(0, left);
    jsxBoardRef.current.create("functiongraph", [exponentialPDF, startX, right], {
      strokeColor: "#f59e0b",
      strokeWidth: 2,
    });
    
    jsxBoardRef.current.update();
  }

  function addUniformDistribution() {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    
    // Uniform distribution on [a, b]
    const a = -2;
    const b = 2;
    const height = 1 / (b - a); // 1/4 = 0.25
    
    // Create rectangular distribution using lines
    jsxBoardRef.current.create("line", [[left, 0], [a, 0]], {
      strokeColor: "#10b981",
      strokeWidth: 2,
    });
    jsxBoardRef.current.create("line", [[a, 0], [a, height]], {
      strokeColor: "#10b981",
      strokeWidth: 2,
    });
    jsxBoardRef.current.create("line", [[a, height], [b, height]], {
      strokeColor: "#10b981",
      strokeWidth: 2,
    });
    jsxBoardRef.current.create("line", [[b, height], [b, 0]], {
      strokeColor: "#10b981",
      strokeWidth: 2,
    });
    jsxBoardRef.current.create("line", [[b, 0], [right, 0]], {
      strokeColor: "#10b981",
      strokeWidth: 2,
    });
    
    jsxBoardRef.current.update();
  }

  function addPoissonDistribution() {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    
    // Poisson distribution: λ=3
    const lambda = 3;
    const factorial = (n: number): number => {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    };
    
    const poissonPMF = (k: number) => {
      if (k < 0 || k !== Math.floor(k)) return 0;
      return Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
    };
    
    // Draw as discrete bars
    const startK = Math.max(0, Math.floor(left));
    const endK = Math.min(15, Math.floor(right)); // Limit to reasonable range
    
    for (let k = startK; k <= endK; k++) {
      const prob = poissonPMF(k);
      if (prob > 0.001) { // Only draw if probability is significant
        // Create a vertical line for each value
        jsxBoardRef.current.create("line", [[k, 0], [k, prob]], {
          strokeColor: "#8b5cf6",
          strokeWidth: 4,
        });
        
        // Add a point at the top
        jsxBoardRef.current.create("point", [k, prob], {
          size: 3,
          face: "o",
          strokeColor: "#8b5cf6",
          fillColor: "#c4b5fd",
        });
      }
    }
    
    jsxBoardRef.current.update();
  }

  function addBinomialDistribution() {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    
    // Binomial distribution: n=10, p=0.3
    const n = 10;
    const p = 0.3;
    
    const binomialCoeff = (n: number, k: number): number => {
      if (k > n) return 0;
      if (k === 0 || k === n) return 1;
      let result = 1;
      for (let i = 1; i <= k; i++) {
        result = result * (n - i + 1) / i;
      }
      return result;
    };
    
    const binomialPMF = (k: number) => {
      if (k < 0 || k > n || k !== Math.floor(k)) return 0;
      return binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    };
    
    // Draw as discrete bars
    const startK = Math.max(0, Math.floor(left));
    const endK = Math.min(n, Math.floor(right));
    
    for (let k = startK; k <= endK; k++) {
      const prob = binomialPMF(k);
      if (prob > 0.001) {
        // Create a vertical line for each value
        jsxBoardRef.current.create("line", [[k, 0], [k, prob]], {
          strokeColor: "#ef4444",
          strokeWidth: 4,
        });
        
        // Add a point at the top
        jsxBoardRef.current.create("point", [k, prob], {
          size: 3,
          face: "o",
          strokeColor: "#ef4444",
          fillColor: "#fecaca",
        });
      }
    }
    
    jsxBoardRef.current.update();
  }

  function addGammaDistribution() {
    if (!jsxBoardRef.current) return;
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    
    // Gamma distribution: α=2, β=2
    const alpha = 2;
    const beta = 2;
    
    // Gamma function approximation for integer values
    const gamma = (z: number): number => {
      if (z === 1) return 1;
      if (z === 2) return 1;
      if (z === 3) return 2;
      if (z === 4) return 6;
      // For non-integer values, use Stirling's approximation
      return Math.sqrt(2 * Math.PI / z) * Math.pow(z / Math.E, z);
    };
    
    const gammaPDF = (x: number) => {
      if (x <= 0) return 0;
      return (Math.pow(beta, alpha) / gamma(alpha)) * 
             Math.pow(x, alpha - 1) * 
             Math.exp(-beta * x);
    };
    
    // Only draw for x > 0
    const startX = Math.max(0.01, left);
    jsxBoardRef.current.create("functiongraph", [gammaPDF, startX, right], {
      strokeColor: "#06b6d4",
      strokeWidth: 2,
    });
    
    jsxBoardRef.current.update();
  }

  // Stepwise demonstration functions
  const startTriangleConstruction = () => {
    if (!jsxBoardRef.current) return;
    
    // Clear board first
    resetBoard();
    
    const steps = [
      {
        description: "Step 1: Place vertex A",
        action: () => {
          jsxBoardRef.current!.create("point", [-2, -1], {
            name: "A",
            size: 4,
            face: "o",
            strokeColor: "#e74c3c",
            fillColor: "#e74c3c",
          });
          jsxBoardRef.current!.update();
        }
      },
      {
        description: "Step 2: Place vertex B",
        action: () => {
          jsxBoardRef.current!.create("point", [2, -1], {
            name: "B",
            size: 4,
            face: "o",
            strokeColor: "#e74c3c",
            fillColor: "#e74c3c",
          });
          jsxBoardRef.current!.update();
        }
      },
      {
        description: "Step 3: Draw side AB (base)",
        action: () => {
          const pointA = jsxBoardRef.current!.objectsList.find((obj: any) => obj.name === "A");
          const pointB = jsxBoardRef.current!.objectsList.find((obj: any) => obj.name === "B");
          if (pointA && pointB) {
            jsxBoardRef.current!.create("line", [pointA, pointB], {
              strokeColor: "#3498db",
              strokeWidth: 2,
            });
          }
          jsxBoardRef.current!.update();
        }
      },
      {
        description: "Step 4: Place vertex C",
        action: () => {
          jsxBoardRef.current!.create("point", [0, 2], {
            name: "C",
            size: 4,
            face: "o",
            strokeColor: "#e74c3c",
            fillColor: "#e74c3c",
          });
          jsxBoardRef.current!.update();
        }
      },
      {
        description: "Step 5: Draw side AC",
        action: () => {
          const pointA = jsxBoardRef.current!.objectsList.find((obj: any) => obj.name === "A");
          const pointC = jsxBoardRef.current!.objectsList.find((obj: any) => obj.name === "C");
          if (pointA && pointC) {
            jsxBoardRef.current!.create("line", [pointA, pointC], {
              strokeColor: "#3498db",
              strokeWidth: 2,
            });
          }
          jsxBoardRef.current!.update();
        }
      },
      {
        description: "Step 6: Draw side BC to complete the triangle",
        action: () => {
          const pointB = jsxBoardRef.current!.objectsList.find((obj: any) => obj.name === "B");
          const pointC = jsxBoardRef.current!.objectsList.find((obj: any) => obj.name === "C");
          if (pointB && pointC) {
            jsxBoardRef.current!.create("line", [pointB, pointC], {
              strokeColor: "#3498db",
              strokeWidth: 2,
            });
          }
          jsxBoardRef.current!.update();
        }
      },
      {
        description: "Step 7: Add triangle fill",
        action: () => {
          const pointA = jsxBoardRef.current!.objectsList.find((obj: any) => obj.name === "A");
          const pointB = jsxBoardRef.current!.objectsList.find((obj: any) => obj.name === "B");
          const pointC = jsxBoardRef.current!.objectsList.find((obj: any) => obj.name === "C");
          if (pointA && pointB && pointC) {
            jsxBoardRef.current!.create("polygon", [pointA, pointB, pointC], {
              fillColor: "#3498db",
              fillOpacity: 0.3,
              strokeWidth: 0,
            });
          }
          jsxBoardRef.current!.update();
        }
      }
    ];
    
    setStepwiseDemo({
      steps,
      currentStep: -1,
      isPlaying: false,
    });
  };

  const nextStep = () => {
    if (!stepwiseDemo || stepwiseDemo.currentStep >= stepwiseDemo.steps.length - 1) return;
    
    const nextStepIndex = stepwiseDemo.currentStep + 1;
    stepwiseDemo.steps[nextStepIndex].action();
    
    setStepwiseDemo(prev => prev ? {
      ...prev,
      currentStep: nextStepIndex
    } : null);
  };

  const prevStep = () => {
    if (!stepwiseDemo || stepwiseDemo.currentStep <= 0) return;
    
    // Reset board and replay steps up to previous step
    resetBoard();
    const targetStep = stepwiseDemo.currentStep - 1;
    
    for (let i = 0; i <= targetStep; i++) {
      stepwiseDemo.steps[i].action();
    }
    
    setStepwiseDemo(prev => prev ? {
      ...prev,
      currentStep: targetStep
    } : null);
  };

  const playStepwise = () => {
    if (!stepwiseDemo) return;
    
    setStepwiseDemo(prev => prev ? { ...prev, isPlaying: true } : null);
    
    const playNextStep = () => {
      if (!stepwiseDemo || stepwiseDemo.currentStep >= stepwiseDemo.steps.length - 1) {
        setStepwiseDemo(prev => prev ? { ...prev, isPlaying: false } : null);
        return;
      }
      
      nextStep();
      
      if (stepwiseDemo.isPlaying) {
        setTimeout(playNextStep, 1500); // 1.5s between steps
      }
    };
    
    setTimeout(playNextStep, 1000);
  };

  const stopStepwise = () => {
    setStepwiseDemo(prev => prev ? { ...prev, isPlaying: false } : null);
  };

  const resetStepwise = () => {
    resetBoard();
    setStepwiseDemo(prev => prev ? { ...prev, currentStep: -1, isPlaying: false } : null);
  };

  // Animation functions
  const startAnimation = (type: 'sine' | 'parabola' | 'rotation' | 'translation' | 'stepwise') => {
    if (type === 'stepwise') {
      startTriangleConstruction();
      return;
    }
    if (isAnimating) {
      stopAnimation();
      return;
    }
    
    console.log('Starting animation:', type);
    setIsAnimating(true);
    setAnimationType(type);
    animationTimeRef.current = 0;
    
    const animate = () => {
      if (!jsxBoardRef.current) {
        console.log('No board reference');
        return;
      }
      
      animationTimeRef.current += 0.05;
      const t = animationTimeRef.current;
      
      console.log('Animation frame:', t, 'type:', type);
      
      switch (type) {
        case 'sine':
          animateSineWave(t);
          break;
        case 'parabola':
          animateParabola(t);
          break;
        case 'rotation':
          animateRotation(t);
          break;
        case 'translation':
          animateTranslation(t);
          break;
      }
      
      // Use a ref to check if animation should continue
      if (animationRef.current !== null) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const allTools = buildWorkbenchToolList({
    addPoint,
    addLine,
    addCircle,
    addParabola,
    addSine,
    addHyperbola,
    addEllipse,
    addEllipseDialog,
    startEllipseFociMode,
    addVector,
    addSegment,
    addPolygon,
    addTangent,
    addText,
    addArc,
    addSector,
    addAngle,
    addRay,
    addRectangle,
    addSquare,
    addHexagon,
    addStar,
    addRose,
    addSpiral,
    addHeart,
    addNormalDistribution,
    addExponentialDistribution,
    addUniformDistribution,
    addPoissonDistribution,
    addBinomialDistribution,
    addGammaDistribution,
    startAnimation,
    startSimpleAnimation,
    stopAnimation,
    addDraggableBarChart,
    addDraggablePieChart,
  });

  const visibleTools = allTools.slice(0, 11);
  const extraTools = allTools.slice(11);

  const animateSineWave = (t: number) => {
    if (!jsxBoardRef.current) return;
    
    console.log('Animating sine wave at time:', t);
    
    // Clear previous animated sine waves
    const objects = [...(jsxBoardRef.current.objectsList || [])];
    objects.forEach((obj: any) => {
      if (obj._isAnimatedSine) {
        try {
          jsxBoardRef.current!.removeObject(obj);
        } catch (e) {
          console.warn('Error removing animated sine object:', e);
        }
      }
    });
    
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    
    // Create animated sine wave with changing amplitude and frequency
    const A = 1 + 0.5 * Math.sin(t);
    const k = 1 + 0.3 * Math.cos(t * 0.7);
    const phase = t * 2;
    
    const animatedSine = (x: number) => A * Math.sin(k * x + phase);
    
    try {
      const curve = jsxBoardRef.current.create("functiongraph", [animatedSine, left, right], {
        strokeColor: "#ff6b6b",
        strokeWidth: 3,
        strokeOpacity: 0.8,
      });
      
      (curve as any)._isAnimatedSine = true;
      jsxBoardRef.current.update();
    } catch (e) {
      console.error('Error creating animated sine curve:', e);
    }
  };

  const animateParabola = (t: number) => {
    if (!jsxBoardRef.current) return;
    
    console.log('Animating parabola at time:', t);
    
    // Clear previous animated parabolas
    const objects = [...(jsxBoardRef.current.objectsList || [])];
    objects.forEach((obj: any) => {
      if (obj._isAnimatedParabola) {
        try {
          jsxBoardRef.current!.removeObject(obj);
        } catch (e) {
          console.warn('Error removing animated parabola object:', e);
        }
      }
    });
    
    const bb = jsxBoardRef.current.getBoundingBox();
    const [left, top, right, bottom] = bb;
    
    // Create animated parabola with changing coefficient
    const a = 0.1 + 0.3 * Math.sin(t);
    const h = Math.sin(t * 0.5) * 2; // horizontal shift
    const k = Math.cos(t * 0.3) * 1; // vertical shift
    
    const animatedParabola = (x: number) => a * (x - h) * (x - h) + k;
    
    try {
      const curve = jsxBoardRef.current.create("functiongraph", [animatedParabola, left, right], {
        strokeColor: "#4ecdc4",
        strokeWidth: 3,
        strokeOpacity: 0.8,
      });
      
      (curve as any)._isAnimatedParabola = true;
      jsxBoardRef.current.update();
    } catch (e) {
      console.error('Error creating animated parabola curve:', e);
    }
  };

  const animateRotation = (t: number) => {
    if (!jsxBoardRef.current) return;
    
    // Clear previous animated shapes
    const objects = [...(jsxBoardRef.current.objectsList || [])];
    objects.forEach((obj: any) => {
      if (obj._isAnimatedRotation) {
        jsxBoardRef.current!.removeObject(obj);
      }
    });
    
    // Create rotating triangle
    const centerX = 0;
    const centerY = 0;
    const radius = 2;
    const angle = t;
    
    const points = [];
    for (let i = 0; i < 3; i++) {
      const pointAngle = angle + (i * 2 * Math.PI / 3);
      const x = centerX + radius * Math.cos(pointAngle);
      const y = centerY + radius * Math.sin(pointAngle);
      const point = jsxBoardRef.current.create("point", [x, y], { 
        visible: false 
      });
      points.push(point);
      (point as any)._isAnimatedRotation = true;
    }
    
    const triangle = jsxBoardRef.current.create("polygon", points, {
      strokeColor: "#45b7d1",
      fillColor: "#45b7d1",
      fillOpacity: 0.3,
      strokeWidth: 2,
    });
    
    (triangle as any)._isAnimatedRotation = true;
    jsxBoardRef.current.update();
  };

  const animateTranslation = (t: number) => {
    if (!jsxBoardRef.current) return;
    
    // Clear previous animated shapes
    const objects = [...(jsxBoardRef.current.objectsList || [])];
    objects.forEach((obj: any) => {
      if (obj._isAnimatedTranslation) {
        jsxBoardRef.current!.removeObject(obj);
      }
    });
    
    // Create translating circle
    const centerX = 3 * Math.sin(t);
    const centerY = 2 * Math.cos(t * 0.7);
    const radius = 1;
    
    const center = jsxBoardRef.current.create("point", [centerX, centerY], { 
      visible: false 
    });
    
    const circle = jsxBoardRef.current.create("circle", [center, radius], {
      strokeColor: "#f39c12",
      fillColor: "#f39c12",
      fillOpacity: 0.2,
      strokeWidth: 2,
    });
    
    (center as any)._isAnimatedTranslation = true;
    (circle as any)._isAnimatedTranslation = true;
    jsxBoardRef.current.update();
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // rectangle edit modal state
  const [rectEdit, setRectEdit] = useState<{
    p1: any;
    p2: any;
    p3: any;
    p4: any;
    w: number;
    h: number;
  } | null>(null);

  // input states for modal
  const [rectW, setRectW] = useState<string>("");
  const [rectH, setRectH] = useState<string>("");

  // Generic object edit modal state
  const [objEdit, setObjEdit] = useState<{
    type: string;
    fields: {
      x?: number;
      y?: number;
      cx?: number;
      cy?: number;
      r?: number;
      x1?: number;
      y1?: number;
      x2?: number;
      y2?: number;
    };
    obj: any;
  } | null>(null);

  // ellipse (a,b) editor state
  const [ellipseEdit, setEllipseEdit] = useState<{ a: number; b: number } | null>(null);

  // sine edit state
  const [sineEdit, setSineEdit] = useState<{ curve: any; A: number; k: number } | null>(null);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<'sine' | 'parabola' | 'rotation' | 'translation' | 'stepwise' | null>(null);
  const animationRef = useRef<number | null>(null);
  const animationTimeRef = useRef<number>(0);
  
  // Stepwise construction state
  const [stepwiseDemo, setStepwiseDemo] = useState<{
    steps: Array<{ description: string; action: () => void }>;
    currentStep: number;
    isPlaying: boolean;
  } | null>(null);

  // small reusable input row component for edit modal
  function LabelInput({ label, value, onChange }: { label: string; value: string | number | undefined; onChange: (v: string) => void }) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-20 text-xs shrink-0">{label}</span>
        <input
          type="number"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border px-2 py-1 bg-muted"
        />
      </div>
    );
  }

  // ------- UI -------
  return (
    <div className="relative min-h-screen" data-testid="plot-workbench">
      <WorkbenchSheetMenu
        sheetList={sheetList}
        focusedSheetId={focusedSheetId}
        onCreateBoard={createBoard}
        onSwitchBoard={switchBoard}
        axisGuidesVisible={axisGuidesVisible}
        onToggleAxes={toggleAxes}
        bgChoices={bgChoices}
        boardFill={boardFill}
        onBoardFillChange={setBoardFill}
      />

      <WorkbenchToolbar
        visibleTools={visibleTools}
        extraTools={extraTools}
        activeInstrument={activeInstrument}
        onSelectTool={(t) => {
          setActiveInstrument(t.id);
          t.action();
        }}
      />

      {/* Drawing area */}
      <main className="relative h-screen" data-testid="workbench-main">
        <div
          ref={plotAreaRef}
          data-testid="jxg-board-host"
          className="absolute inset-0 w-full h-full"
          style={{ backgroundColor: boardFill }}
        />

        <SonificationPanel
          boardRef={jsxBoardRef}
          sketchEntries={sketchEntries}
          focusedSheetId={focusedSheetId}
          sonifyTargetId={sonifyTargetId}
          onSonifyTargetIdChange={setSonifyTargetId}
        />

        {/* collapsed chat toggle button */}
        {!assistantOpen && (
          <div className="fixed right-2 top-2 z-50">
            <DepthToggleButton title="Open formula panel" onClick={() => setAssistantOpen(true)}>
              <span className="text-sm font-bold">←</span>
            </DepthToggleButton>
          </div>
        )}

        {/* Animation control panel */}
        {isAnimating && animationType !== 'stepwise' && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur rounded-lg shadow-lg p-3 flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Playing: {
                animationType === 'sine' ? 'Sine wave' :
                animationType === 'parabola' ? 'Parabola' :
                animationType === 'rotation' ? 'Rotation' :
                animationType === 'translation' ? 'Translation' : ''
              }</span>
            </div>
            <DepthToggleButton title="Stop animation" size="small" onClick={stopAnimation}>
              <Pause className="w-4 h-4" />
            </DepthToggleButton>
          </div>
        )}

        {/* Stepwise demonstration control panel */}
        {stepwiseDemo && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur rounded-lg shadow-lg p-4 min-w-[400px]">
            <div className="text-center mb-3">
              <h3 className="font-medium text-sm mb-1">Triangle construction demo</h3>
              <div className="text-xs text-muted-foreground">
                Step {stepwiseDemo.currentStep + 1} of {stepwiseDemo.steps.length}
              </div>
            </div>
            
            {stepwiseDemo.currentStep >= 0 && (
              <div className="text-sm text-center mb-3 p-2 bg-muted rounded">
                {stepwiseDemo.steps[stepwiseDemo.currentStep].description}
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2">
              <DepthToggleButton 
                title="Previous step" 
                size="small" 
                onClick={prevStep}
              >
                <ArrowLeft className="w-4 h-4" />
              </DepthToggleButton>
              
              <DepthToggleButton 
                title={stepwiseDemo.isPlaying ? "Pause" : "Play automatically"} 
                size="small" 
                onClick={stepwiseDemo.isPlaying ? stopStepwise : playStepwise}
              >
                {stepwiseDemo.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </DepthToggleButton>
              
              <DepthToggleButton 
                title="Next step" 
                size="small" 
                onClick={nextStep}
              >
                <ArrowRight className="w-4 h-4" />
              </DepthToggleButton>
              
              <DepthToggleButton 
                title="Reset" 
                size="small" 
                onClick={resetStepwise}
              >
                <RefreshCw className="w-4 h-4" />
              </DepthToggleButton>
              
              <DepthToggleButton 
                title="Close demo" 
                size="small" 
                onClick={() => setStepwiseDemo(null)}
              >
                ✕
              </DepthToggleButton>
            </div>
          </div>
        )}
      </main>

      {/* Right chat panel using Sheet */}
      <Sheet open={assistantOpen} onOpenChange={setAssistantOpen}>
        <SheetContent side="right" className="bg-muted" data-testid="formula-assistant-panel">
          {/* Close button at top-right */}
          <div className="absolute right-2 top-2 z-10">
            <DepthToggleButton title="Close formula panel" size="small" onClick={() => setAssistantOpen(false)}>
              <span className="text-sm font-bold">→</span>
            </DepthToggleButton>
          </div>
          
          <div className="p-4 border-b">
            <SheetTitle asChild>
              <h2 className="text-lg font-semibold">Formulas</h2>
            </SheetTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the radio control to pick which visible curve drives graph sonification.
            </p>
          </div>

          {/* undoStack list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2" id="plot-assistant-scroll">
            {sketchEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">No formulas yet. Plotted curves will appear here.</p>
            )}
            {sketchEntries.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <input
                  type="radio"
                  name="sonify-solo-curve"
                  className="mt-1.5 size-3 shrink-0 accent-primary"
                  checked={
                    item.visible &&
                    (sonifyTargetId === item.id ||
                      (sonifyTargetId === null &&
                        item.id === sketchEntries.find((e) => e.visible)?.id))
                  }
                  disabled={!item.visible}
                  onChange={() => setSonifyTargetId(item.id)}
                  aria-label={`Solo this curve for graph sonification: ${item.latex}`}
                />
                <span
                  className="inline-block w-3 h-3 rounded-full mt-1"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 text-sm flex items-center gap-2">
                  <span onClick={() => setInlineLatexDraft(item.latex)} className="cursor-pointer hover:underline">
                    <InlineMath math={item.latex} />
                  </span>
                  <DepthToggleButton
                    size="small"
                    onClick={() => toggleVisible(item.id)}
                    title={item.visible ? "Hide curve" : "Show curve"}
                  >
                    <span className="text-xs">{item.visible ? "👁" : "🚫"}</span>
                  </DepthToggleButton>
                  <DepthToggleButton
                    size="small"
                    onClick={() => removeFormula(item.id)}
                    title="Remove"
                  >
                    <span className="text-xs">✖</span>
                  </DepthToggleButton>
                </div>
              </div>
            ))}
          </div>

          {/* input area */}
          <div className="p-4 border-t">
            <MathLiveEditor onSubmit={addFormulaFromLatex} value={inlineLatexDraft} />
          </div>
        </SheetContent>
      </Sheet>

      {/* tangent hint overlay */}
      {hint && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-md shadow-lg z-50 text-sm">
          {hint}
        </div>
      )}

      {/* Rectangle edit popover (modal) */}
      {rectEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-background rounded-md shadow-lg p-4 w-72 space-y-4">
            <h3 className="text-sm font-medium">Edit rectangle size</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs w-12">Width</span>
                <input
                  type="number"
                  value={rectW}
                  onChange={(e) => setRectW(e.target.value)}
                  className="flex-1 rounded-md border px-2 py-1 text-sm bg-muted"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-12">Height</span>
                <input
                  type="number"
                  value={rectH}
                  onChange={(e) => setRectH(e.target.value)}
                  className="flex-1 rounded-md border px-2 py-1 text-sm bg-muted"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setRectEdit(null)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                const wNum = parseFloat(rectW);
                const hNum = parseFloat(rectH);
                if (isNaN(wNum) || isNaN(hNum) || wNum <= 0 || hNum <= 0) return;
                const { p1, p2, p3, p4 } = rectEdit;
                const x0 = p1.X();
                const y0 = p1.Y();
                p2.moveTo([x0 + wNum, y0], 0);
                p3.moveTo([x0 + wNum, y0 - hNum], 0);
                p4.moveTo([x0, y0 - hNum], 0);
                jsxBoardRef.current.update();
                setRectEdit(null);
              }}>Apply</Button>
            </div>
          </div>
        </div>
      )}

      {/* Generic object edit modal */}
      {objEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-background rounded-md shadow-lg p-4 w-80 space-y-4">
            <h3 className="text-sm font-medium">Edit {objEdit.type}</h3>
            <div className="flex flex-col gap-3 text-sm">
              {objEdit.type === "point" && (
                <>
                  <LabelInput label="X" value={String(objEdit.fields.x ?? "")} onChange={(v)=>setObjEdit(p=>({...p!, fields:{...p!.fields,x:Number(v)}}))}/>
                  <LabelInput label="Y" value={String(objEdit.fields.y ?? "")} onChange={(v)=>setObjEdit(p=>({...p!, fields:{...p!.fields,y:Number(v)}}))}/>
                </>
              )}
              {objEdit.type === "circle" && (
                <>
                  <LabelInput label="Center X" value={String(objEdit.fields.cx ?? "")} onChange={(v)=>setObjEdit(p=>({...p!, fields:{...p!.fields,cx:Number(v)}}))}/>
                  <LabelInput label="Center Y" value={String(objEdit.fields.cy ?? "")} onChange={(v)=>setObjEdit(p=>({...p!, fields:{...p!.fields,cy:Number(v)}}))}/>
                  <LabelInput label="Radius" value={String(objEdit.fields.r ?? "")} onChange={(v)=>setObjEdit(p=>({...p!, fields:{...p!.fields,r:Number(v)}}))}/>
                </>
              )}
              {objEdit.type === "line" && (
                <>
                  <LabelInput label="P1 X" value={String(objEdit.fields.x1 ?? "")} onChange={(v)=>setObjEdit(p=>({...p!, fields:{...p!.fields,x1:Number(v)}}))}/>
                  <LabelInput label="P1 Y" value={String(objEdit.fields.y1 ?? "")} onChange={(v)=>setObjEdit(p=>({...p!, fields:{...p!.fields,y1:Number(v)}}))}/>
                  <LabelInput label="P2 X" value={String(objEdit.fields.x2 ?? "")} onChange={(v)=>setObjEdit(p=>({...p!, fields:{...p!.fields,x2:Number(v)}}))}/>
                  <LabelInput label="P2 Y" value={String(objEdit.fields.y2 ?? "")} onChange={(v)=>setObjEdit(p=>({...p!, fields:{...p!.fields,y2:Number(v)}}))}/>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={()=>setObjEdit(null)}>Cancel</Button>
              <Button size="sm" onClick={()=>{
                const {obj,type,fields}=objEdit;
                if(type==="point"){
                  const x=Number(fields.x);const y=Number(fields.y);
                  if(!isNaN(x)&&!isNaN(y)) obj.moveTo([x,y],0);
                } else if(type==="circle"){
                  const cx=Number(fields.cx);const cy=Number(fields.cy);const r=Number(fields.r);
                  if(!isNaN(cx)&&!isNaN(cy)) obj.center.moveTo([cx,cy],0);
                  if(!isNaN(r)&&r>0 && obj.setRadius) obj.setRadius(r);
                } else if(type==="line"){
                  const x1=Number(fields.x1);const y1=Number(fields.y1);const x2=Number(fields.x2);const y2=Number(fields.y2);
                  if(!isNaN(x1)&&!isNaN(y1)) obj.point1.moveTo([x1,y1],0);
                  if(!isNaN(x2)&&!isNaN(y2)) obj.point2.moveTo([x2,y2],0);
                }
                jsxBoardRef.current.update();
                setObjEdit(null);
              }}>Apply</Button>
            </div>
          </div>
        </div>
      )}

      <SineEditor
        open={!!sineEdit}
        initialA={sineEdit?.A || 1}
        initialK={sineEdit?.k || 1}
        onClose={() => setSineEdit(null)}
        onApply={(A, k) => {
          if (!sineEdit || !jsxBoardRef.current) return;
          const { curve } = sineEdit;
          const bb = jsxBoardRef.current.getBoundingBox();
          const [left, top, right, bottom] = bb;
          try {
            jsxBoardRef.current.removeObject(curve);
          } catch {}
          const newCurve = jsxBoardRef.current.create("functiongraph", [ (x: number)=> A * Math.sin(k * x), left, right ], {
            strokeColor: "#2563eb",
            strokeWidth: 2,
          });
          (newCurve as any)._sineParams = { A, k };
          newCurve.on("dblclick", () => {
            const params = (newCurve as any)._sineParams;
            setSineEdit({ curve: newCurve, A: params.A, k: params.k });
          });
          jsxBoardRef.current.update();
          setSineEdit(null);
        }}
      />

      {/* Ellipse (a,b) editor */}
      <EllipseEditor
        open={!!ellipseEdit}
        initialA={ellipseEdit?.a || 3}
        initialB={ellipseEdit?.b || 2}
        onClose={() => setEllipseEdit(null)}
        onApply={(a, b) => {
          if (!jsxBoardRef.current) return;
          jsxBoardRef.current.create(
            "curve",
            [
              (t: number) => a * Math.cos(t),
              (t: number) => b * Math.sin(t),
              0,
              2 * Math.PI,
            ],
            { strokeColor: "#10b981", strokeWidth: 2 }
          );
          jsxBoardRef.current.update();
          setEllipseEdit(null);
        }}
      />

      {/* Bar Chart Editor */}
      <BarChartEditor
        open={!!columnChartDraft}
        initialData={columnChartDraft?.data || []}
        onClose={() => setColumnChartDraft(null)}
        onApply={(newData) => {
          if (!columnChartDraft || !jsxBoardRef.current) return;
          
          // Check if this is editing a draggable chart
          if (columnChartDraft.chartId) {
            // Check if it's a pie chart or bar chart
            const isPieChart = floatingPieClusters.some(c => c.id === columnChartDraft.chartId);
            if (isPieChart) {
              updateDraggablePieChart(columnChartDraft.chartId, newData);
            } else {
              updateDraggableChart(columnChartDraft.chartId, newData);
            }
          } else {
            // Handle regular chart editing
            // Remove old elements
            columnChartDraft.elements.forEach(element => {
              try {
                if (element.bar) jsxBoardRef.current!.removeObject(element.bar);
                if (element.label) jsxBoardRef.current!.removeObject(element.label);
                if (element.valueText) jsxBoardRef.current!.removeObject(element.valueText);
                if (element.dragPoint) jsxBoardRef.current!.removeObject(element.dragPoint);
                if (element.dragHandle) jsxBoardRef.current!.removeObject(element.dragHandle);
                if (element.title) jsxBoardRef.current!.removeObject(element.title);
                if (element.instructions) jsxBoardRef.current!.removeObject(element.instructions);
              } catch (e) {
                console.warn('Failed to remove element:', e);
              }
            });
            
            // Add new chart with updated data
            addBarChartToCanvas(newData);
          }
          
          setColumnChartDraft(null);
        }}
      />

      {/* Statistical Chart Modal */}
      {statsOverlayOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <StatChart
            data={statsPayload}
            type={statsViewKind}
            width={500}
            height={400}
            title={
              statsViewKind === 'bar' ? 'Subject scores (bar chart)' :
              statsViewKind === 'pie' ? 'Grade distribution (pie chart)' :
              statsViewKind === 'scatter' ? 'Scatter plot' : 'Chart'
            }
            onClose={() => setStatsOverlayOpen(false)}
          />
        </div>
      )}

      {/* Draggable Bar Charts */}
      {floatingBarClusters.map(chart => (
        <DraggableBarChart
          key={chart.id}
          board={jsxBoardRef.current}
          data={chart.data}
          position={chart.position}
          title={chart.title}
          onEdit={() => editDraggableChart(chart.id)}
          onRemove={() => removeDraggableChart(chart.id)}
        />
      ))}

      {/* Draggable Pie Charts */}
      {floatingPieClusters.map(chart => (
        <DraggablePieChart
          key={chart.id}
          board={jsxBoardRef.current}
          data={chart.data}
          position={chart.position}
          title={chart.title}
          onEdit={() => editDraggablePieChart(chart.id)}
          onRemove={() => removeDraggablePieChart(chart.id)}
        />
      ))}

      <RadialToolMenu
        hostRef={radialMenuRef}
        open={radialMenuOpen}
        onOpenChange={setRadialMenuOpen}
        onClearBoard={clearAll}
        onUndo={undo}
        onRedo={redo}
      />
    </div>
  );
}
