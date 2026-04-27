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
    { id: "point", title: "点", icon: <Dot className="w-5 h-5" />, action: a.addPoint },
    { id: "line", title: "直线", icon: <Minus className="w-5 h-5" />, action: a.addLine },
    { id: "circle", title: "圆", icon: <CircleIcon className="w-5 h-5" />, action: a.addCircle },
    { id: "parabola", title: "抛物线", icon: <FunctionSquare className="w-5 h-5" />, action: a.addParabola },
    { id: "sine", title: "正弦", icon: <Waves className="w-5 h-5" />, action: a.addSine },
    { id: "hyperbola", title: "双曲线", icon: <InfinityIcon className="w-5 h-5" />, action: a.addHyperbola },
    { id: "ellipse", title: "椭圆", icon: <CircleDashed className="w-5 h-5" />, action: a.addEllipse },
    { id: "ellipseAB", title: "椭圆(a,b)", icon: <CircleDot className="w-5 h-5" />, action: a.addEllipseDialog },
    { id: "ellipseFoci", title: "椭圆(焦点)", icon: <CircleIcon className="w-5 h-5" />, action: a.startEllipseFociMode },
    { id: "vector", title: "向量", icon: <ArrowRight className="w-5 h-5" />, action: a.addVector },
    { id: "segment", title: "线段", icon: <Slash className="w-5 h-5" />, action: a.addSegment },
    { id: "polygon", title: "多边形", icon: <Pentagon className="w-5 h-5" />, action: a.addPolygon },
    { id: "tangent", title: "切线", icon: <Tangent className="w-5 h-5" />, action: a.addTangent },
    { id: "text", title: "文本", icon: <TypeIcon className="w-5 h-5" />, action: a.addText },
    { id: "arc", title: "圆弧", icon: <PieChart className="w-5 h-5" />, action: a.addArc },
    { id: "sector", title: "扇形", icon: <PieChart className="w-5 h-5" />, action: a.addSector },
    { id: "angle", title: "角", icon: <Triangle className="w-5 h-5" />, action: a.addAngle },
    { id: "ray", title: "射线", icon: <Send className="w-5 h-5" />, action: a.addRay },
    { id: "rectangle", title: "矩形", icon: <RectangleHorizontal className="w-5 h-5" />, action: a.addRectangle },
    { id: "square", title: "正方形", icon: <SquareIcon className="w-5 h-5" />, action: a.addSquare },
    { id: "hexagon", title: "六边形", icon: <Pentagon className="w-5 h-5" />, action: a.addHexagon },
    { id: "star", title: "星形", icon: <Star className="w-5 h-5" />, action: a.addStar },
    { id: "rose", title: "玫瑰线", icon: <Flower className="w-5 h-5" />, action: a.addRose },
    { id: "spiral", title: "螺线", icon: <InfinityIcon className="w-5 h-5" />, action: a.addSpiral },
    { id: "heart", title: "心形", icon: <Heart className="w-5 h-5" />, action: a.addHeart },
    { id: "normal", title: "正态分布", icon: <TrendingUp className="w-5 h-5" />, action: a.addNormalDistribution },
    { id: "exponential", title: "指数分布", icon: <Activity className="w-5 h-5" />, action: a.addExponentialDistribution },
    { id: "uniform", title: "均匀分布", icon: <BarChart3 className="w-5 h-5" />, action: a.addUniformDistribution },
    { id: "poisson", title: "泊松分布", icon: <Zap className="w-5 h-5" />, action: a.addPoissonDistribution },
    { id: "binomial", title: "二项分布", icon: <BarChart3 className="w-5 h-5" />, action: a.addBinomialDistribution },
    { id: "gamma", title: "伽马分布", icon: <TrendingUp className="w-5 h-5" />, action: a.addGammaDistribution },
    { id: "animSine", title: "正弦波动画", icon: <Play className="w-5 h-5" />, action: () => a.startAnimation("sine") },
    { id: "animParabola", title: "抛物线动画", icon: <Play className="w-5 h-5" />, action: () => a.startAnimation("parabola") },
    { id: "animRotation", title: "旋转动画", icon: <RotateCw className="w-5 h-5" />, action: () => a.startAnimation("rotation") },
    { id: "animTranslation", title: "平移动画", icon: <Move className="w-5 h-5" />, action: () => a.startAnimation("translation") },
    { id: "testAnim", title: "测试动画", icon: <Play className="w-5 h-5" />, action: a.startSimpleAnimation },
    { id: "stepwiseDemo", title: "步骤演示", icon: <ZoomIn className="w-5 h-5" />, action: () => a.startAnimation("stepwise") },
    { id: "stopAnim", title: "停止动画", icon: <Pause className="w-5 h-5" />, action: a.stopAnimation },
    { id: "draggableBarChart", title: "柱状图", icon: <Move className="w-5 h-5" />, action: a.addDraggableBarChart },
    { id: "draggablePieChart", title: "饼图", icon: <PieChart className="w-5 h-5" />, action: a.addDraggablePieChart },
  ];
}
