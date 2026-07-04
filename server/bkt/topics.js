/**
 * Topic definitions for both subject areas.
 *
 * PROGRAMMING: 8 language-agnostic fundamentals — same questions
 * work for any programming language; the language is passed to the
 * LLM separately at question-generation time.
 *
 * DSA: 8 data-structures-and-algorithms topics — questions focus on
 * algorithmic correctness, complexity analysis, and problem-solving
 * patterns. Code examples use Python by default (most interview-common).
 */

export const PROGRAMMING_TOPICS = [
  {
    slug: "variables-data-types",
    name: "Variables & Data Types",
    description: "Declaring variables, primitive types, type coercion.",
    pInit: 0.4, pTransit: 0.15, pGuess: 0.25, pSlip: 0.10,
  },
  {
    slug: "conditionals",
    name: "Conditionals",
    description: "if/else, comparison and logical operators, truthiness.",
    pInit: 0.35, pTransit: 0.12, pGuess: 0.20, pSlip: 0.10,
  },
  {
    slug: "loops",
    name: "Loops",
    description: "for/while loops, iteration, break/continue.",
    pInit: 0.30, pTransit: 0.10, pGuess: 0.15, pSlip: 0.12,
  },
  {
    slug: "functions",
    name: "Functions",
    description: "Defining/calling functions, parameters, return values, scope.",
    pInit: 0.30, pTransit: 0.10, pGuess: 0.15, pSlip: 0.12,
  },
  {
    slug: "arrays-lists",
    name: "Arrays / Lists",
    description: "Indexing, common methods (map/filter/etc. or list comprehensions).",
    pInit: 0.25, pTransit: 0.10, pGuess: 0.15, pSlip: 0.12,
  },
  {
    slug: "objects-dicts",
    name: "Objects / Dictionaries",
    description: "Key-value structures, accessing/updating fields.",
    pInit: 0.25, pTransit: 0.10, pGuess: 0.15, pSlip: 0.12,
  },
  {
    slug: "string-manipulation",
    name: "String Manipulation",
    description: "Concatenation, slicing, common string methods.",
    pInit: 0.30, pTransit: 0.12, pGuess: 0.20, pSlip: 0.10,
  },
  {
    slug: "recursion",
    name: "Recursion",
    description: "Base cases, recursive calls, call stack intuition.",
    pInit: 0.15, pTransit: 0.08, pGuess: 0.10, pSlip: 0.15,
  },
];

export const DSA_TOPICS = [
  {
    slug: "arrays-strings-dsa",
    name: "Arrays & Strings",
    description: "Array manipulation, string operations, two-pointer, sliding window.",
    pInit: 0.20, pTransit: 0.09, pGuess: 0.15, pSlip: 0.12,
  },
  {
    slug: "linked-lists-dsa",
    name: "Linked Lists",
    description: "Singly/doubly linked lists, traversal, reversal, cycle detection.",
    pInit: 0.15, pTransit: 0.08, pGuess: 0.12, pSlip: 0.13,
  },
  {
    slug: "stacks-queues-dsa",
    name: "Stacks & Queues",
    description: "LIFO/FIFO structures, monotonic stack, deque, expression evaluation.",
    pInit: 0.20, pTransit: 0.09, pGuess: 0.15, pSlip: 0.12,
  },
  {
    slug: "trees-bst-dsa",
    name: "Trees & Binary Search Trees",
    description: "Binary trees, BST operations, DFS/BFS traversal, height, balance.",
    pInit: 0.15, pTransit: 0.08, pGuess: 0.12, pSlip: 0.13,
  },
  {
    slug: "graphs-dsa",
    name: "Graphs",
    description: "Adjacency list/matrix, BFS, DFS, shortest paths, cycle detection.",
    pInit: 0.10, pTransit: 0.07, pGuess: 0.10, pSlip: 0.15,
  },
  {
    slug: "sorting-searching-dsa",
    name: "Sorting & Searching",
    description: "Merge sort, quicksort, binary search; time/space complexity analysis.",
    pInit: 0.20, pTransit: 0.09, pGuess: 0.20, pSlip: 0.12,
  },
  {
    slug: "dynamic-programming-dsa",
    name: "Dynamic Programming",
    description: "Memoization, tabulation, overlapping subproblems, 1D/2D DP patterns.",
    pInit: 0.10, pTransit: 0.07, pGuess: 0.10, pSlip: 0.15,
  },
  {
    slug: "hash-tables-dsa",
    name: "Hash Tables & Sets",
    description: "Hashing fundamentals, collision handling, frequency counting, set operations.",
    pInit: 0.20, pTransit: 0.09, pGuess: 0.15, pSlip: 0.12,
  },
];

// Backward-compat alias
export const TOPIC_DEFINITIONS = PROGRAMMING_TOPICS;
