import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind conflicts toward the last wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("filters falsy fragments", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
