import {
  Activity,
  ArrowRight,
  BarChart3,
  Circle as CircleIcon,
  CircleDashed,
  CircleDot,
  Dot,
  Flower,
  FunctionSquare,
  Heart,
  Infinity as InfinityIcon,
  Minus,
  Move,
  Pause,
  Pentagon,
  PieChart,
  Play,
  RectangleHorizontal,
  RotateCw,
  Send,
  Slash,
  Square as SquareIcon,
  Star,
  Tangent,
  TrendingUp,
  Triangle,
  Type as TypeIcon,
  Waves,
  Zap,
  ZoomIn,
} from "lucide-react";
import type { WorkbenchTool } from "../WorkbenchToolbar";

export type WorkbenchToolActions = {
  addPoint: () => void;
  addLine: () => void;
  addCircle: () => void;
  addParabola: () => void;
  addSine: () => void;
  addHyperbola: () => void;
  addEllipse: () => void;
  addEllipseDialog: () => void;
  startEllipseFociMode: () => void;
  addVector: () => void;
  addSegment: () => void;
  addPolygon: () => void;
  addTangent: () => void;
  addText: () => void;
  addArc: () => void;
  addSector: () => void;
  addAngle: () => void;
  addRay: () => void;
  addRectangle: () => void;
  addSquare: () => void;
  addHexagon: () => void;
  addStar: () => void;
  addRose: () => void;
  addSpiral: () => void;
  addHeart: () => void;
  addNormalDistribution: () => void;
  addExponentialDistribution: () => void;
  addUniformDistribution: () => void;
  addPoissonDistribution: () => void;
  addBinomialDistribution: () => void;
  addGammaDistribution: () => void;
  startAnimation: (t: "sine" | "parabola" | "rotation" | "translation" | "stepwise") => void;
  startSimpleAnimation: () => void;
  stopAnimation: () => void;
  addDraggableBarChart: () => void;
  addDraggablePieChart: () => void;
};

export function buildWorkbenchToolList(a: WorkbenchToolActions): WorkbenchTool[] {
  return [
    { id: "point", title: "Point", icon: <Dot className="w-5 h-5" />, action: a.addPoint },
    { id: "line", title: "Line", icon: <Minus className="w-5 h-5" />, action: a.addLine },
    { id: "circle", title: "Circle", icon: <CircleIcon className="w-5 h-5" />, action: a.addCircle },
    { id: "parabola", title: "Parabola", icon: <FunctionSquare className="w-5 h-5" />, action: a.addParabola },
    { id: "sine", title: "Sine", icon: <Waves className="w-5 h-5" />, action: a.addSine },
    { id: "hyperbola", title: "Hyperbola", icon: <InfinityIcon className="w-5 h-5" />, action: a.addHyperbola },
    { id: "ellipse", title: "Ellipse", icon: <CircleDashed className="w-5 h-5" />, action: a.addEllipse },
    { id: "ellipseAB", title: "Ellipse (a, b)", icon: <CircleDot className="w-5 h-5" />, action: a.addEllipseDialog },
    { id: "ellipseFoci", title: "Ellipse (foci)", icon: <CircleIcon className="w-5 h-5" />, action: a.startEllipseFociMode },
    { id: "vector", title: "Vector", icon: <ArrowRight className="w-5 h-5" />, action: a.addVector },
    { id: "segment", title: "Segment", icon: <Slash className="w-5 h-5" />, action: a.addSegment },
    { id: "polygon", title: "Polygon", icon: <Pentagon className="w-5 h-5" />, action: a.addPolygon },
    { id: "tangent", title: "Tangent", icon: <Tangent className="w-5 h-5" />, action: a.addTangent },
    { id: "text", title: "Text", icon: <TypeIcon className="w-5 h-5" />, action: a.addText },
    { id: "arc", title: "Arc", icon: <PieChart className="w-5 h-5" />, action: a.addArc },
    { id: "sector", title: "Sector", icon: <PieChart className="w-5 h-5" />, action: a.addSector },
    { id: "angle", title: "Angle", icon: <Triangle className="w-5 h-5" />, action: a.addAngle },
    { id: "ray", title: "Ray", icon: <Send className="w-5 h-5" />, action: a.addRay },
    { id: "rectangle", title: "Rectangle", icon: <RectangleHorizontal className="w-5 h-5" />, action: a.addRectangle },
    { id: "square", title: "Square", icon: <SquareIcon className="w-5 h-5" />, action: a.addSquare },
    { id: "hexagon", title: "Hexagon", icon: <Pentagon className="w-5 h-5" />, action: a.addHexagon },
    { id: "star", title: "Star", icon: <Star className="w-5 h-5" />, action: a.addStar },
    { id: "rose", title: "Rose curve", icon: <Flower className="w-5 h-5" />, action: a.addRose },
    { id: "spiral", title: "Spiral", icon: <InfinityIcon className="w-5 h-5" />, action: a.addSpiral },
    { id: "heart", title: "Heart", icon: <Heart className="w-5 h-5" />, action: a.addHeart },
    { id: "normal", title: "Normal distribution", icon: <TrendingUp className="w-5 h-5" />, action: a.addNormalDistribution },
    { id: "exponential", title: "Exponential distribution", icon: <Activity className="w-5 h-5" />, action: a.addExponentialDistribution },
    { id: "uniform", title: "Uniform distribution", icon: <BarChart3 className="w-5 h-5" />, action: a.addUniformDistribution },
    { id: "poisson", title: "Poisson distribution", icon: <Zap className="w-5 h-5" />, action: a.addPoissonDistribution },
    { id: "binomial", title: "Binomial distribution", icon: <BarChart3 className="w-5 h-5" />, action: a.addBinomialDistribution },
    { id: "gamma", title: "Gamma distribution", icon: <TrendingUp className="w-5 h-5" />, action: a.addGammaDistribution },
    { id: "animSine", title: "Animate sine", icon: <Play className="w-5 h-5" />, action: () => a.startAnimation("sine") },
    { id: "animParabola", title: "Animate parabola", icon: <Play className="w-5 h-5" />, action: () => a.startAnimation("parabola") },
    { id: "animRotation", title: "Animate rotation", icon: <RotateCw className="w-5 h-5" />, action: () => a.startAnimation("rotation") },
    { id: "animTranslation", title: "Animate translation", icon: <Move className="w-5 h-5" />, action: () => a.startAnimation("translation") },
    { id: "testAnim", title: "Test animation", icon: <Play className="w-5 h-5" />, action: a.startSimpleAnimation },
    { id: "stepwiseDemo", title: "Step-by-step demo", icon: <ZoomIn className="w-5 h-5" />, action: () => a.startAnimation("stepwise") },
    { id: "stopAnim", title: "Stop animation", icon: <Pause className="w-5 h-5" />, action: a.stopAnimation },
    { id: "draggableBarChart", title: "Bar chart", icon: <Move className="w-5 h-5" />, action: a.addDraggableBarChart },
    { id: "draggablePieChart", title: "Pie chart", icon: <PieChart className="w-5 h-5" />, action: a.addDraggablePieChart },
  ];
}
