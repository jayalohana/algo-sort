import { describe, expect, it } from "vitest";
import { ALGORITHM_IDS, generateOps } from "./algorithms";
import { parseCustomInput } from "../playback/usePlayback";
import { delayForSpeed } from "../playback/usePlayback";
import type { Item } from "./types";
import { finalValues, replay, toItems } from "./types";

const CASES: { name: string; values: number[] }[] = [
  { name: "sorted", values: [1, 5, 12, 23, 34, 45, 67, 89] },
  { name: "reversed", values: [89, 67, 45, 34, 23, 12, 5, 1] },
  { name: "random", values: [42, 7, 88, 15, 63, 29, 5, 71] },
  { name: "duplicates", values: [5, 3, 5, 1, 3, 99, 0, 5] },
  { name: "all equal", values: [7, 7, 7, 7, 7] },
  { name: "three items", values: [3, 1, 2] },
  { name: "sixteen", values: [55, 2, 91, 34, 77, 8, 63, 19, 40, 5, 84, 27, 70, 12, 48, 99] },
];

function isSorted(v: number[]): boolean {
  return v.every((x, i) => i === 0 || v[i - 1] <= x);
}

describe.each(ALGORITHM_IDS)("algorithm %s", (id) => {
  it.each(CASES)("$name sorts correctly", ({ values }) => {
    const items = toItems(values);
    const ops = generateOps(id, values);
    expect(ops.length).toBeGreaterThan(0);
    expect(finalValues(items, ops)).toEqual([...values].sort((a, b) => a - b));
  });

  it("preserves every block identity (stable ids, permutation)", () => {
    const values = [5, 3, 5, 1, 3, 99, 0, 5];
    const items = toItems(values);
    const ops = generateOps(id, values);
    const snap = replay(items, ops, ops.length);
    expect(snap.array.map((it) => it.id).sort((a, b) => a - b)).toEqual(
      values.map((_, i) => i),
    );
  });

  it("never swaps two equal-valued blocks", () => {
    const values = [5, 3, 5, 1, 3, 99, 0, 5, 42, 42, 1];
    const items = toItems(values);
    const ops = generateOps(id, values);
    // walk ops tracking values per slot to check swap operands
    const cur: Item[] = items.map((it) => ({ ...it }));
    let held: Item | null = null;
    for (const op of ops) {
      if (op.kind === "swap") {
        expect(cur[op.a].value).not.toBe(cur[op.b].value);
        [cur[op.a], cur[op.b]] = [cur[op.b], cur[op.a]];
      } else if (op.kind === "lift") {
        held = { ...cur[op.index] };
      } else if (op.kind === "shift") {
        cur[op.to] = cur[op.from];
      } else if (op.kind === "place") {
        if (held) {
          cur[op.to] = held;
          held = null;
        }
      } else if (op.kind === "overwrite" || op.kind === "collect") {
        const idx = op.kind === "overwrite" ? op.index : op.to;
        cur[idx] = { id: op.id, value: op.value };
      } else if (op.kind === "distribute") {
        // buckets hold copies; main array untouched
      }
    }
    expect(isSorted(cur.map((it) => it.value))).toBe(true);
  });

  it("replay is prefix-consistent (pause/next stop at op boundaries)", () => {
    const values = [42, 7, 88, 15, 63, 29, 5, 71];
    const items = toItems(values);
    const ops = generateOps(id, values);
    // every prefix must be a valid replay with matching message/line
    for (const upto of [0, 1, Math.floor(ops.length / 2), ops.length]) {
      const snap = replay(items, ops, upto);
      expect(snap.array).toHaveLength(values.length);
      if (upto === 0) {
        expect(snap.lastOp).toBeNull();
      } else {
        expect(snap.lastOp).toEqual(ops[upto - 1]);
        expect(snap.message).toBe(ops[upto - 1].message);
      }
    }
    // reset = replay at 0 restores the input order
    expect(replay(items, ops, 0).array.map((it) => it.value)).toEqual(values);
  });
});

describe("parseCustomInput", () => {
  it("accepts comma/space separated values", () => {
    expect(parseCustomInput("42, 7, 88")).toEqual({ values: [42, 7, 88] });
  });
  it("rejects too few / too many", () => {
    expect(parseCustomInput("1, 2").error).toMatch(/at least 3/);
    expect(parseCustomInput(Array(17).fill("1").join(",")).error).toMatch(
      /at most 16/,
    );
  });
  it("rejects non-numbers and out-of-range with clear messages", () => {
    expect(parseCustomInput("1, x, 3").error).toMatch(/"x"/);
    expect(parseCustomInput("1, 100, 3").error).toMatch(/100/);
  });
  it("rejects empty input", () => {
    expect(parseCustomInput("   ").error).toMatch(/3–16/);
  });
});

describe("delayForSpeed", () => {
  it("scales inversely with speed", () => {
    expect(delayForSpeed(2)).toBeLessThan(delayForSpeed(1));
    expect(delayForSpeed(0.5)).toBeGreaterThan(delayForSpeed(1));
  });
});
