/**
 * Turn a small subset of LaTeX into a mathjs-friendly expression string.
 */
export function latexToMathjsExpression(raw: string): string {
  let expr = raw.trim();
  expr = expr.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)");
  expr = expr.replace(/\\sqrt\{([^}]*)\}/g, "sqrt($1)");
  expr = expr.replace(/\\pi/g, "pi");
  expr = expr.replace(/\\sin/g, "sin");
  expr = expr.replace(/\\cos/g, "cos");
  expr = expr.replace(/\\tan/g, "tan");
  expr = expr.replace(/^y\s*=\s*/i, "");
  return expr;
}
