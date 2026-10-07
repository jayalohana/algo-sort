import type { Item, SortOp } from "./types";
import { toItems } from "./types";

export type AlgorithmId =
  | "bubble"
  | "selection"
  | "insertion"
  | "merge"
  | "quick"
  | "heap"
  | "shell"
  | "cocktail"
  | "counting"
  | "radix"
  | "bucket";

export const ALGORITHM_IDS: AlgorithmId[] = [
  "bubble",
  "selection",
  "insertion",
  "merge",
  "quick",
  "heap",
  "shell",
  "cocktail",
  "counting",
  "radix",
  "bucket",
];

function clone(items: Item[]): Item[] {
  return items.map((it) => ({ ...it }));
}

// ---------------------------------------------------------------- bubble
function bubble(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      ops.push({
        kind: "compare",
        a: j,
        b: j + 1,
        line: 3,
        message: `Comparing blocks ${a[j].value} and ${a[j + 1].value}.`,
      });
      if (a[j].value > a[j + 1].value) {
        ops.push({
          kind: "swap",
          a: j,
          b: j + 1,
          line: 4,
          message: `${a[j].value} > ${a[j + 1].value}: web-swap the two blocks.`,
        });
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
    }
    ops.push({
      kind: "sorted",
      index: n - 1 - i,
      line: 5,
      message: `Block ${a[n - 1 - i].value} bubbled into place.`,
    });
  }
  return ops;
}

// ------------------------------------------------------------- selection
function selection(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    let min = i;
    ops.push({
      kind: "lift",
      index: i,
      line: 2,
      message: `Lifting candidate block ${a[i].value} at position ${i}.`,
    });
    for (let j = i + 1; j < n; j++) {
      ops.push({
        kind: "compare",
        a: min,
        b: j,
        line: 4,
        message: `Is ${a[j].value} smaller than current minimum ${a[min].value}?`,
      });
      if (a[j].value < a[min].value) {
        min = j;
        ops.push({
          kind: "note",
          line: 4,
          message: `New minimum found: ${a[min].value}.`,
        });
      }
    }
    if (min !== i) {
      ops.push({
        kind: "swap",
        a: i,
        b: min,
        line: 5,
        message: `Web-swap minimum ${a[min].value} into position ${i}.`,
      });
      [a[i], a[min]] = [a[min], a[i]];
    } else {
      ops.push({
        kind: "note",
        line: 5,
        message: `Position ${i} already holds the minimum.`,
      });
    }
    ops.push({
      kind: "sorted",
      index: i,
      line: 6,
      message: `Position ${i} is sorted.`,
    });
  }
  return ops;
}

// ------------------------------------------------------------- insertion
function insertion(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;
  for (let i = 1; i < n; i++) {
    const key = { ...a[i] };
    ops.push({
      kind: "lift",
      index: i,
      line: 2,
      message: `Lifting block ${key.value} out of the row.`,
    });
    let j = i - 1;
    while (j >= 0) {
      ops.push({
        kind: "compare",
        a: j,
        b: j + 1,
        line: 3,
        message: `Comparing ${a[j].value} with lifted ${key.value}.`,
      });
      if (a[j].value <= key.value) break;
      ops.push({
        kind: "shift",
        from: j,
        to: j + 1,
        line: 3,
        message: `Shifting ${a[j].value} one slot right to open a gap.`,
      });
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
    ops.push({
      kind: "place",
      from: i,
      to: j + 1,
      line: 4,
      message: `Dropping ${key.value} into slot ${j + 1}.`,
    });
  }
  for (let i = 0; i < n; i++) {
    ops.push({
      kind: "sorted",
      index: i,
      line: 4,
      message: `Block ${a[i].value} is in order.`,
    });
  }
  return ops;
}

// ----------------------------------------------------------------- merge
function merge(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;

  function sort(lo: number, hi: number) {
    ops.push({
      kind: "range",
      low: lo,
      high: hi,
      line: 1,
      message: `Splitting off group [${lo}..${hi}].`,
    });
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    sort(lo, mid);
    sort(mid + 1, hi);
    // merge halves into temp (stable: left wins ties)
    const left = clone(a.slice(lo, mid + 1));
    const right = clone(a.slice(mid + 1, hi + 1));
    ops.push({
      kind: "note",
      line: 4,
      message: `Merging [${lo}..${mid}] and [${mid + 1}..${hi}] in the merge area.`,
    });
    let i = 0;
    let j = 0;
    let k = lo;
    while (i < left.length && j < right.length) {
      ops.push({
        kind: "compare",
        a: lo + i,
        b: mid + 1 + j,
        line: 4,
        message: `Merge-compare ${left[i].value} vs ${right[j].value}.`,
      });
      if (left[i].value <= right[j].value) {
        const it = left[i++];
        a[k] = it;
        ops.push({
          kind: "overwrite",
          index: k,
          value: it.value,
          id: it.id,
          line: 5,
          message: `Placing ${it.value} from the left group into slot ${k}.`,
        });
      } else {
        const it = right[j++];
        a[k] = it;
        ops.push({
          kind: "overwrite",
          index: k,
          value: it.value,
          id: it.id,
          line: 5,
          message: `Placing ${it.value} from the right group into slot ${k}.`,
        });
      }
      k++;
    }
    while (i < left.length) {
      const it = left[i++];
      a[k] = it;
      ops.push({
        kind: "overwrite",
        index: k,
        value: it.value,
        id: it.id,
        line: 5,
        message: `Copying leftover ${it.value} into slot ${k}.`,
      });
      k++;
    }
    while (j < right.length) {
      const it = right[j++];
      a[k] = it;
      ops.push({
        kind: "overwrite",
        index: k,
        value: it.value,
        id: it.id,
        line: 5,
        message: `Copying leftover ${it.value} into slot ${k}.`,
      });
      k++;
    }
  }

  if (n > 0) sort(0, n - 1);
  for (let i = 0; i < n; i++) {
    ops.push({
      kind: "sorted",
      index: i,
      line: 5,
      message: `Slot ${i} merged into final order.`,
    });
  }
  return ops;
}

// ----------------------------------------------------------------- quick
function quick(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];

  function sort(lo: number, hi: number) {
    if (lo > hi) return;
    ops.push({
      kind: "range",
      low: lo,
      high: hi,
      line: 1,
      message: `Partitioning section [${lo}..${hi}].`,
    });
    if (lo >= hi) {
      ops.push({
        kind: "sorted",
        index: lo,
        line: 2,
        message: `Single block ${a[lo].value} is partitioned.`,
      });
      return;
    }
    const pivot = { ...a[hi] };
    ops.push({
      kind: "pivot",
      index: hi,
      line: 3,
      message: `Marking pivot ${pivot.value}.`,
    });
    let i = lo;
    for (let j = lo; j < hi; j++) {
      ops.push({
        kind: "compare",
        a: j,
        b: hi,
        line: 4,
        message: `Comparing ${a[j].value} against pivot ${pivot.value}.`,
      });
      if (a[j].value < pivot.value) {
        if (i !== j) {
          ops.push({
            kind: "swap",
            a: i,
            b: j,
            line: 5,
            message: `Moving ${a[j].value} to the small side (slot ${i}).`,
          });
          [a[i], a[j]] = [a[j], a[i]];
        }
        i++;
      }
    }
    if (i !== hi && a[i].value !== pivot.value) {
      ops.push({
        kind: "swap",
        a: i,
        b: hi,
        line: 6,
        message: `Dropping pivot ${pivot.value} into slot ${i}.`,
      });
      [a[i], a[hi]] = [a[hi], a[i]];
    } else if (i === hi) {
      ops.push({
        kind: "note",
        line: 6,
        message: `Pivot ${pivot.value} already sits in slot ${i}.`,
      });
    } else {
      ops.push({
        kind: "note",
        line: 6,
        message: `Pivot ${pivot.value} matches slot ${i} — locking without a swap.`,
      });
    }
    ops.push({
      kind: "sorted",
      index: i,
      line: 6,
      message: `Pivot ${pivot.value} locked at slot ${i}.`,
    });
    sort(lo, i - 1);
    sort(i + 1, hi);
  }

  if (a.length > 0) sort(0, a.length - 1);
  return ops;
}

// ------------------------------------------------------------------ heap
function heap(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;

  function siftDown(root: number, size: number) {
    let r = root;
    for (;;) {
      const left = 2 * r + 1;
      const right = 2 * r + 2;
      let largest = r;
      if (left < size) {
        ops.push({
          kind: "compare",
          a: largest,
          b: left,
          line: 2,
          message: `Heap-compare parent ${a[largest].value} with child ${a[left].value}.`,
        });
        if (a[left].value > a[largest].value) largest = left;
      }
      if (right < size) {
        ops.push({
          kind: "compare",
          a: largest,
          b: right,
          line: 2,
          message: `Heap-compare ${a[largest].value} with child ${a[right].value}.`,
        });
        if (a[right].value > a[largest].value) largest = right;
      }
      if (largest === r) return;
      ops.push({
        kind: "swap",
        a: r,
        b: largest,
        line: 2,
        message: `Sifting ${a[r].value} down the heap, ${a[largest].value} rises.`,
      });
      [a[r], a[largest]] = [a[largest], a[r]];
      r = largest;
    }
  }

  ops.push({
    kind: "heapSize",
    size: n,
    line: 1,
    message: `Building the heap out of ${n} blocks.`,
  });
  for (let r = Math.floor(n / 2) - 1; r >= 0; r--) siftDown(r, n);
  ops.push({
    kind: "note",
    line: 1,
    message: "Max-heap built: every parent is >= its children.",
  });
  for (let end = n - 1; end > 0; end--) {
    if (a[0].value !== a[end].value) {
      ops.push({
        kind: "swap",
        a: 0,
        b: end,
        line: 3,
        message: `Lifting heap top ${a[0].value} to sorted slot ${end}.`,
      });
      [a[0], a[end]] = [a[end], a[0]];
    } else {
      ops.push({
        kind: "note",
        line: 3,
        message: `Heap top ${a[0].value} matches slot ${end} — locking without a swap.`,
      });
    }
    ops.push({ kind: "sorted", index: end, line: 3, message: `Slot ${end} is sorted.` });
    ops.push({
      kind: "heapSize",
      size: end,
      line: 3,
      message: `Heap shrinks to ${end} blocks.`,
    });
    siftDown(0, end);
  }
  if (n > 0) {
    ops.push({ kind: "heapSize", size: 0, line: 4, message: "Heap drained." });
    ops.push({ kind: "sorted", index: 0, line: 4, message: "All blocks sorted." });
  }
  return ops;
}

// ----------------------------------------------------------------- shell
function shell(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    ops.push({
      kind: "gap",
      gap,
      line: 1,
      message: `Shell pass with gap ${gap}: comparing blocks ${gap} apart.`,
    });
    for (let i = gap; i < n; i++) {
      const key = { ...a[i] };
      ops.push({
        kind: "lift",
        index: i,
        line: 3,
        message: `Lifting ${key.value} for gap-${gap} insertion.`,
      });
      let j = i;
      let first = true;
      while (j >= gap) {
        ops.push({
          kind: "compare",
          a: j - gap,
          b: j,
          line: 4,
          message: first
            ? `Comparing ${a[j - gap].value} with lifted ${key.value} (gap ${gap}).`
            : `Comparing ${a[j - gap].value} with ${key.value} (gap ${gap}).`,
        });
        first = false;
        if (a[j - gap].value <= key.value) break;
        ops.push({
          kind: "shift",
          from: j - gap,
          to: j,
          line: 4,
          message: `Leaping ${a[j - gap].value} forward by gap ${gap}.`,
        });
        a[j] = a[j - gap];
        j -= gap;
      }
      a[j] = key;
      ops.push({
        kind: "place",
        from: i,
        to: j,
        line: 5,
        message: `Dropping ${key.value} into slot ${j}.`,
      });
    }
  }
  for (let i = 0; i < n; i++) {
    ops.push({
      kind: "sorted",
      index: i,
      line: 5,
      message: `Slot ${i} is in order.`,
    });
  }
  return ops;
}

// --------------------------------------------------------------- cocktail
function cocktail(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;
  let left = 0;
  let right = n - 1;
  let pass = 0;
  while (left < right) {
    ops.push({
      kind: "note",
      line: 1,
      message: `Forward sweep ${++pass}: left to right.`,
    });
    for (let j = left; j < right; j++) {
      ops.push({
        kind: "compare",
        a: j,
        b: j + 1,
        line: 2,
        message: `Comparing ${a[j].value} and ${a[j + 1].value} (forward).`,
      });
      if (a[j].value > a[j + 1].value) {
        ops.push({
          kind: "swap",
          a: j,
          b: j + 1,
          line: 2,
          message: `Forward swap: ${a[j].value} and ${a[j + 1].value}.`,
        });
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
    }
    ops.push({
      kind: "sorted",
      index: right,
      line: 2,
      message: `Right edge ${a[right].value} settled.`,
    });
    right--;
    if (left >= right) break;
    ops.push({
      kind: "note",
      line: 3,
      message: `Backward sweep ${pass}: right to left.`,
    });
    for (let j = right; j > left; j--) {
      ops.push({
        kind: "compare",
        a: j - 1,
        b: j,
        line: 3,
        message: `Comparing ${a[j - 1].value} and ${a[j].value} (backward).`,
      });
      if (a[j - 1].value > a[j].value) {
        ops.push({
          kind: "swap",
          a: j - 1,
          b: j,
          line: 3,
          message: `Backward swap: ${a[j - 1].value} and ${a[j].value}.`,
        });
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
      }
    }
    ops.push({
      kind: "sorted",
      index: left,
      line: 3,
      message: `Left edge ${a[left].value} settled.`,
    });
    left++;
  }
  for (let i = 0; i < n; i++) {
    if (!ops.some((o) => o.kind === "sorted" && o.index === i)) {
      ops.push({
        kind: "sorted",
        index: i,
        line: 3,
        message: `Slot ${i} is in order.`,
      });
    }
  }
  return ops;
}

// --------------------------------------------------------------- counting
function counting(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;
  if (n === 0) return ops;
  const max = Math.max(...a.map((it) => it.value));
  const counts = new Array<number>(max + 1).fill(0);
  ops.push({
    kind: "note",
    line: 1,
    message: `Counting occurrences of each value 0..${max}.`,
  });
  for (let i = 0; i < n; i++) {
    counts[a[i].value]++;
    ops.push({
      kind: "countSet",
      value: a[i].value,
      count: counts[a[i].value],
      line: 1,
      message: `Counted block ${a[i].value}: now seen ${counts[a[i].value]} time(s).`,
    });
    ops.push({
      kind: "compare",
      a: i,
      b: i,
      line: 1,
      message: `Scanning block ${a[i].value} into its count box.`,
    });
  }
  // stable output: iterate from the end
  const out = new Array<Item>(n);
  for (let v = 1; v <= max; v++) counts[v] += counts[v - 1];
  ops.push({
    kind: "note",
    line: 2,
    message: "Turning counts into running positions (prefix sums).",
  });
  for (let i = n - 1; i >= 0; i--) {
    const it = a[i];
    counts[it.value]--;
    out[counts[it.value]] = it;
  }
  for (let i = 0; i < n; i++) {
    a[i] = out[i];
    ops.push({
      kind: "overwrite",
      index: i,
      value: out[i].value,
      id: out[i].id,
      line: 3,
      message: `Writing ${out[i].value} from its count box into slot ${i}.`,
    });
  }
  for (let i = 0; i < n; i++) {
    ops.push({
      kind: "sorted",
      index: i,
      line: 3,
      message: `Slot ${i} filled from counts.`,
    });
  }
  return ops;
}

// ----------------------------------------------------------------- radix
function radix(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;
  if (n === 0) return ops;
  const max = Math.max(...a.map((it) => it.value));
  let place = 1;
  let pass = 0;
  const digitOf = (v: number, p: number) => Math.floor(v / p) % 10;
  let cur = clone(a);
  while (Math.floor(max / place) > 0) {
    pass++;
    ops.push({
      kind: "digit",
      place,
      line: 1,
      message:
        place === 1
          ? `Pass ${pass}: sorting by the ones digit.`
          : `Pass ${pass}: sorting by the ${place}s digit.`,
    });
    const buckets: Item[][] = Array.from({ length: 10 }, () => []);
    for (let i = 0; i < n; i++) {
      const d = digitOf(cur[i].value, place);
      buckets[d].push(cur[i]);
      ops.push({
        kind: "distribute",
        from: i,
        bucket: d,
        value: cur[i].value,
        id: cur[i].id,
        line: 2,
        message: `Dropping ${cur[i].value} into bucket ${d} (digit ${d}).`,
      });
    }
    let k = 0;
    for (let b = 0; b < 10; b++) {
      for (const it of buckets[b]) {
        cur[k] = it;
        ops.push({
          kind: "collect",
          bucket: b,
          to: k,
          value: it.value,
          id: it.id,
          line: 3,
          message: `Collecting ${it.value} back from bucket ${b} into slot ${k}.`,
        });
        k++;
      }
    }
    place *= 10;
  }
  for (const [i, it] of cur.entries()) a[i] = it;
  for (let i = 0; i < n; i++) {
    ops.push({
      kind: "sorted",
      index: i,
      line: 3,
      message: `Slot ${i} ordered by digits.`,
    });
  }
  return ops;
}

// ---------------------------------------------------------------- bucket
export function bucketCount(n: number): number {
  return Math.max(2, Math.min(5, n));
}

function bucket(values: number[]): SortOp[] {
  const a = toItems(values);
  const ops: SortOp[] = [];
  const n = a.length;
  if (n === 0) return ops;
  const k = bucketCount(n);
  const max = Math.max(...a.map((it) => it.value));
  const span = max + 1;
  const buckets: Item[][] = Array.from({ length: k }, () => []);
  ops.push({
    kind: "note",
    line: 1,
    message: `Spreading ${n} blocks across ${k} buckets by value.`,
  });
  for (let i = 0; i < n; i++) {
    const b = Math.min(k - 1, Math.floor((a[i].value / span) * k));
    buckets[b].push(a[i]);
    ops.push({
      kind: "distribute",
      from: i,
      bucket: b,
      value: a[i].value,
      id: a[i].id,
      line: 1,
      message: `Floating ${a[i].value} into bucket ${b}.`,
    });
  }
  // insertion-sort each bucket (stable), narrated per bucket
  for (let b = 0; b < k; b++) {
    const bk = buckets[b];
    ops.push({
      kind: "note",
      line: 2,
      message:
        bk.length <= 1
          ? `Bucket ${b} holds ${bk.length} block — nothing to sort.`
          : `Web-sorting ${bk.length} blocks inside bucket ${b} (insertion).`,
    });
    for (let i = 1; i < bk.length; i++) {
      const key = { ...bk[i] };
      let j = i - 1;
      while (j >= 0 && bk[j].value > key.value) {
        bk[j + 1] = bk[j];
        j--;
      }
      bk[j + 1] = key;
    }
  }
  let t = 0;
  for (let b = 0; b < k; b++) {
    for (const it of buckets[b]) {
      a[t] = it;
      ops.push({
        kind: "collect",
        bucket: b,
        to: t,
        value: it.value,
        id: it.id,
        line: 3,
        message: `Tipping bucket ${b}: ${it.value} lands in slot ${t}.`,
      });
      t++;
    }
  }
  for (let i = 0; i < n; i++) {
    ops.push({
      kind: "sorted",
      index: i,
      line: 3,
      message: `Slot ${i} collected in order.`,
    });
  }
  return ops;
}

export const GENERATORS: Record<AlgorithmId, (v: number[]) => SortOp[]> = {
  bubble,
  selection,
  insertion,
  merge,
  quick,
  heap,
  shell,
  cocktail,
  counting,
  radix,
  bucket,
};

export function generateOps(id: AlgorithmId, values: number[]): SortOp[] {
  return GENERATORS[id](values);
}
