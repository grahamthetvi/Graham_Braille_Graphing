import { describe, expect, it } from "vitest";
import { latexToMathjsExpression } from "./latexNormalize";

describe("latexToMathjsExpression", () => {
  it("strips leading y=", () => {
    expect(latexToMathjsExpression("y = x^2")).toBe("x^2");
  });

  it("rewrites frac and sqrt", () => {
    expect(latexToMathjsExpression(String.raw`\frac{1}{2}`)).toBe("(1)/(2)");
    expect(latexToMathjsExpression(String.raw`\sqrt{x}`)).toBe("sqrt(x)");
  });
});
