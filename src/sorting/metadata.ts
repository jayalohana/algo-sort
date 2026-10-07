import type { AlgorithmId } from "./algorithms";

export interface AlgorithmMeta {
  id: AlgorithmId;
  name: string;
  blurb: string;
  best: string;
  average: string;
  worst: string;
  space: string;
  /** 1-indexed pseudocode lines; op.line must point into this array. */
  pseudo: string[];
}

export const METADATA: Record<AlgorithmId, AlgorithmMeta> = {
  bubble: {
    id: "bubble",
    name: "Bubble Sort",
    blurb:
      "Spidey compares each neighboring pair and web-swaps them if the left block is bigger. The biggest unsorted block bubbles to the right end each pass.",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    pseudo: [
      "for each pass i:",
      "  for each neighbor pair j:",
      "    compare a[j] and a[j+1]",
      "    swap if left > right",
      "  lock the last unsorted block",
    ],
  },
  selection: {
    id: "selection",
    name: "Selection Sort",
    blurb:
      "Spidey lifts each position's candidate, scans the rest for the true minimum, then web-swaps it into place. Sorted blocks grow from the left.",
    best: "O(n²)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    pseudo: [
      "for each position i:",
      "  lift candidate, min = i",
      "    scan j for a smaller block",
      "    track the new minimum",
      "  swap the minimum into i",
      "  lock position i",
    ],
  },
  insertion: {
    id: "insertion",
    name: "Insertion Sort",
    blurb:
      "Spidey lifts one block out of the row, shifts bigger neighbors right to open a gap, then drops the lifted block into its slot.",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    pseudo: [
      "for each block i:",
      "  lift key = a[i]",
      "  shift bigger neighbors right",
      "  drop key into the gap",
    ],
  },
  merge: {
    id: "merge",
    name: "Merge Sort",
    blurb:
      "The row splits into small groups, and Spidey weaves pairs of sorted groups back together in the glowing merge area above the platform.",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    space: "O(n)",
    pseudo: [
      "split group [lo..hi] in half",
      "  base case: single block",
      "  sort both halves",
      "  merge-compare group heads",
      "  copy winner back to the row",
    ],
  },
  quick: {
    id: "quick",
    name: "Quick Sort",
    blurb:
      "Spidey marks a pivot (red), flings smaller blocks to its left, then drops the pivot into its locked slot and partitions each side.",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    space: "O(log n)",
    pseudo: [
      "partition section [lo..hi]",
      "  base case: 0-1 blocks",
      "  mark pivot = a[hi]",
      "  compare each block vs pivot",
      "  move smaller blocks left",
      "  drop pivot, lock it, recurse",
    ],
  },
  heap: {
    id: "heap",
    name: "Heap Sort",
    blurb:
      "Blocks are woven into a heap pyramid (parents above children). Spidey lifts the heap top to the sorted end, shrinks the heap, and sifts the new top down.",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    space: "O(1)",
    pseudo: [
      "build a max-heap",
      "  sift parents/children down",
      "  lift heap top to the end",
      "  shrink heap, sift, lock slot",
    ],
  },
  shell: {
    id: "shell",
    name: "Shell Sort",
    blurb:
      "Insertion sort with long leaps: Spidey compares blocks a gap apart, shrinking the gap each pass until neighbors are compared (gap 1).",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    space: "O(1)",
    pseudo: [
      "for gap = n/2 … 1:",
      "  for each block i:",
      "    lift a[i]",
      "    shift by gap while bigger",
      "    drop into its gap slot",
    ],
  },
  cocktail: {
    id: "cocktail",
    name: "Cocktail Sort",
    blurb:
      "Bubble sort that shuttles both ways: Spidey sweeps left-to-right settling the big end, then right-to-left settling the small end.",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    pseudo: [
      "sweep forward, then backward",
      "  forward compare + swap",
      "  backward compare + swap",
    ],
  },
  counting: {
    id: "counting",
    name: "Counting Sort",
    blurb:
      "Spidey tallies each value into glowing count boxes, turns them into positions, then writes blocks back stably from the boxes.",
    best: "O(n + k)",
    average: "O(n + k)",
    worst: "O(n + k)",
    space: "O(k)",
    pseudo: [
      "count each value into boxes",
      "  prefix-sum into positions",
      "  write blocks back, stably",
    ],
  },
  radix: {
    id: "radix",
    name: "Radix Sort",
    blurb:
      "Digit by digit: Spidey drops every block into one of 10 buckets by the current digit (ones, then tens), then collects them back in bucket order.",
    best: "O(nk)",
    average: "O(nk)",
    worst: "O(nk)",
    space: "O(n + k)",
    pseudo: [
      "for each digit place:",
      "  distribute into 10 buckets",
      "  collect buckets back in order",
    ],
  },
  bucket: {
    id: "bucket",
    name: "Bucket Sort",
    blurb:
      "Spidey floats each block into a value bucket, web-sorts inside each bucket, then tips the buckets back onto the platform in order.",
    best: "O(n + k)",
    average: "O(n + k)",
    worst: "O(n²)",
    space: "O(n)",
    pseudo: [
      "distribute blocks into k buckets",
      "  insertion-sort each bucket",
      "  tip buckets back in order",
    ],
  },
};

export function metaFor(id: AlgorithmId): AlgorithmMeta {
  return METADATA[id];
}
