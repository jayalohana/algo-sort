// Stable item identity: each input element gets a unique id.
// Generators must move ids around (never duplicate/lose them) so that
// blocks keep stable identities when values are equal.

export interface Item {
  id: number;
  value: number;
}

export function toItems(values: number[]): Item[] {
  return values.map((value, i) => ({ id: i, value }));
}

// Typed operation sequence. Every algorithm emits these; the playback
// controller replays them to drive the 3D scene. Each op is one
// pause/next-step boundary.
export type SortOp =
  | { kind: "compare"; a: number; b: number; line: number; message: string }
  | { kind: "swap"; a: number; b: number; line: number; message: string }
  | { kind: "lift"; index: number; line: number; message: string }
  | { kind: "shift"; from: number; to: number; line: number; message: string }
  | { kind: "place"; from: number; to: number; line: number; message: string }
  | {
      kind: "overwrite";
      index: number;
      value: number;
      id: number;
      line: number;
      message: string;
    }
  | { kind: "pivot"; index: number; line: number; message: string }
  | { kind: "range"; low: number; high: number; line: number; message: string }
  | { kind: "sorted"; index: number; line: number; message: string }
  | {
      kind: "countSet";
      value: number;
      count: number;
      line: number;
      message: string;
    }
  | {
      kind: "distribute";
      from: number;
      bucket: number;
      value: number;
      id: number;
      line: number;
      message: string;
    }
  | {
      kind: "collect";
      bucket: number;
      to: number;
      value: number;
      id: number;
      line: number;
      message: string;
    }
  | { kind: "digit"; place: number; line: number; message: string }
  | { kind: "gap"; gap: number; line: number; message: string }
  | { kind: "heapSize"; size: number; line: number; message: string }
  | { kind: "note"; line: number; message: string };

export interface VizSnapshot {
  array: Item[];
  sorted: boolean[];
  activeA: number | null;
  activeB: number | null;
  lifted: number | null;
  pivot: number | null;
  range: { low: number; high: number } | null;
  heapSize: number | null;
  gap: number | null;
  digit: number | null;
  counts: Map<number, number>;
  maxCountValue: number;
  buckets: Item[][] | null;
  lastOp: SortOp | null;
  message: string;
  line: number | null;
  comparisons: number;
  writes: number;
  /** Item held aside by lift (insertion/shell key). Written back on place. */
  held: Item | null;
}

export function emptySnapshot(initial: Item[]): VizSnapshot {
  return {
    array: initial.map((it) => ({ ...it })),
    sorted: initial.map(() => false),
    activeA: null,
    activeB: null,
    lifted: null,
    pivot: null,
    range: null,
    heapSize: null,
    gap: null,
    digit: null,
    counts: new Map(),
    maxCountValue: 0,
    buckets: null,
    lastOp: null,
    message: "Ready. Press Play to start.",
    line: null,
    comparisons: 0,
    writes: 0,
    held: null,
  };
}

/** Pure replay: apply ops[0..upto) to initial. Used by playback + tests. */
export function replay(
  initial: Item[],
  ops: SortOp[],
  upto: number,
): VizSnapshot {
  const snap = emptySnapshot(initial);
  const end = Math.max(0, Math.min(upto, ops.length));

  const ensureBuckets = (n: number) => {
    if (!snap.buckets) {
      snap.buckets = Array.from({ length: n }, () => []);
    } else if (snap.buckets.length < n) {
      const extra = Array.from(
        { length: n - snap.buckets.length },
        () => [] as Item[],
      );
      snap.buckets = [...snap.buckets, ...extra];
    }
  };

  for (let k = 0; k < end; k++) {
    const op = ops[k];
    snap.lastOp = op;
    snap.message = op.message;
    snap.line = op.line;
    switch (op.kind) {
      case "compare":
        snap.activeA = op.a;
        snap.activeB = op.b;
        snap.comparisons += 1;
        break;
      case "swap": {
        snap.activeA = op.a;
        snap.activeB = op.b;
        const t = snap.array[op.a];
        snap.array[op.a] = snap.array[op.b];
        snap.array[op.b] = t;
        if (snap.lifted === op.a) snap.lifted = op.b;
        else if (snap.lifted === op.b) snap.lifted = op.a;
        snap.writes += 2;
        break;
      }
      case "lift":
        snap.lifted = op.index;
        snap.activeA = op.index;
        snap.activeB = null;
        snap.held = { ...snap.array[op.index] };
        break;
      case "shift": {
        snap.activeA = op.from;
        snap.activeB = op.to;
        const moving = snap.array[op.from];
        snap.array[op.to] = moving;
        if (snap.lifted === op.from) snap.lifted = op.to;
        snap.writes += 1;
        break;
      }
      case "place": {
        snap.activeA = op.to;
        snap.activeB = null;
        snap.lifted = null;
        if (snap.held) {
          snap.array[op.to] = snap.held;
          snap.held = null;
        }
        snap.writes += 1;
        break;
      }
      case "overwrite": {
        snap.activeA = op.index;
        snap.activeB = null;
        snap.array[op.index] = { id: op.id, value: op.value };
        snap.writes += 1;
        break;
      }
      case "pivot":
        snap.pivot = op.index;
        snap.activeA = op.index;
        break;
      case "range":
        snap.range = { low: op.low, high: op.high };
        break;
      case "sorted":
        snap.sorted[op.index] = true;
        break;
      case "countSet":
        snap.counts.set(op.value, op.count);
        snap.maxCountValue = Math.max(snap.maxCountValue, op.value);
        snap.activeA = null;
        snap.activeB = null;
        break;
      case "distribute":
        ensureBuckets(op.bucket + 1);
        snap.buckets![op.bucket].push({ id: op.id, value: op.value });
        snap.activeA = op.from;
        snap.activeB = null;
        break;
      case "collect":
        ensureBuckets(op.bucket + 1);
        snap.array[op.to] = { id: op.id, value: op.value };
        snap.activeA = op.to;
        snap.writes += 1;
        break;
      case "digit":
        snap.digit = op.place;
        snap.buckets = Array.from({ length: 10 }, () => []);
        break;
      case "gap":
        snap.gap = op.gap;
        break;
      case "heapSize":
        snap.heapSize = op.size;
        break;
      case "note":
        break;
    }
  }
  return snap;
}

export function finalValues(initial: Item[], ops: SortOp[]): number[] {
  return replay(initial, ops, ops.length).array.map((it) => it.value);
}
