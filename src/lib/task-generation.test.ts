import { describe, expect, it } from "vitest";
import { buildTaskCombinations } from "./task-generation";

describe("buildTaskCombinations", () => {
  it("produces the cartesian product of questions x platforms x brands", () => {
    const result = buildTaskCombinations(["q1", "q2"], ["p1", "p2", "p3"], ["b1"]);
    expect(result).toHaveLength(6);
  });

  it("excludes combinations that already exist", () => {
    const result = buildTaskCombinations(
      ["q1", "q2"],
      ["p1"],
      ["b1"],
      [{ questionId: "q1", platformId: "p1", brandId: "b1" }],
    );
    expect(result).toEqual([{ questionId: "q2", platformId: "p1", brandId: "b1" }]);
  });

  it("returns an empty array when any dimension is empty", () => {
    expect(buildTaskCombinations([], ["p1"], ["b1"])).toEqual([]);
  });
});
