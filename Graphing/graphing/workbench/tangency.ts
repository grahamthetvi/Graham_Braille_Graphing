/** JSXGraph circle vs infinite line distance check */
export function circleLineSeparation(
  circle: { center: { X: () => number; Y: () => number }; R?: () => number; radius?: number },
  line: { point1?: { X: () => number; Y: () => number }; point2?: { X: () => number; Y: () => number } },
  tolerance: number
): boolean {
  if (!line.point1 || !line.point2) return false;
  const cx = circle.center.X();
  const cy = circle.center.Y();
  const x1 = line.point1.X();
  const y1 = line.point1.Y();
  const x2 = line.point2.X();
  const y2 = line.point2.Y();
  const dist =
    Math.abs((y2 - y1) * cx - (x2 - x1) * cy + x2 * y1 - y2 * x1) /
    Math.hypot(y2 - y1, x2 - x1);
  const r = typeof circle.R === "function" ? circle.R() : (circle.radius as number);
  return Math.abs(dist - r) < tolerance;
}

export function boardsAreTangent(a: unknown, b: unknown, eps = 0.1): boolean {
  const isCircle = (o: { elType?: string }) => o.elType === "circle";
  const isLine = (o: { elType?: string }) => o.elType === "line";

  const A = a as {
    elType?: string;
    center?: { X: () => number; Y: () => number };
    R?: () => number;
    radius?: number;
    point1?: { X: () => number; Y: () => number };
    point2?: { X: () => number; Y: () => number };
  };
  const B = b as typeof A;

  if (isCircle(A) && isCircle(B) && A.center && B.center) {
    const r1 = typeof A.R === "function" ? A.R() : (A.radius as number);
    const r2 = typeof B.R === "function" ? B.R() : (B.radius as number);
    const d = Math.hypot(A.center.X() - B.center!.X(), A.center.Y() - B.center!.Y());
    return Math.abs(d - (r1 + r2)) < eps || Math.abs(d - Math.abs(r1 - r2)) < eps;
  }

  if (isCircle(A) && isLine(B)) {
    return circleLineSeparation(A as Parameters<typeof circleLineSeparation>[0], B, eps);
  }
  if (isLine(A) && isCircle(B)) {
    return circleLineSeparation(B as Parameters<typeof circleLineSeparation>[0], A, eps);
  }

  return false;
}
