/**
 * Prompt templates and tool definition for Groq's OpenAI-compatible API.
 */

export const QUESTION_TOOL = {
  type: "function",
  function: {
    name: "generate_question",
    description: "Generate a single multiple-choice programming question for a student practice session.",
    parameters: {
      type: "object",
      required: ["question", "options", "correctOptionIndex", "hint", "explanation"],
      properties: {
        question: {
          type: "string",
          description:
            "The question text. " +
            "NEVER use triple backticks (```) — they break the JSON parser. " +
            "For inline code use single backticks: `x = 5`. " +
            "For multi-line code blocks, write the code directly in the string using \\n for newlines " +
            "and spaces for indentation. Preserve ALL indentation — Python requires it for correctness. " +
            "Example: 'What is the output?\\n\\ndef greet(name):\\n    return f\\'Hello {name}\\'\\n\\nprint(greet(\\'World\\'))'",
        },
        options: {
          type: "array",
          items: { type: "string" },
          minItems: 4,
          maxItems: 4,
          description: "Exactly 4 answer options as strings.",
        },
        correctOptionIndex: {
          type: "integer",
          minimum: 0,
          maximum: 3,
          description:
            "0-based index of the correct option. " +
            "EXAMPLE: options=['4','5','6','7'], correct=5 → correctOptionIndex=1. " +
            "ALWAYS verify options[correctOptionIndex] equals the correct answer before returning.",
        },
        hint: {
          type: "string",
          description: "A nudge that guides without revealing the answer.",
        },
        explanation: {
          type: "string",
          description: "Shown after answering. Explain why the correct option is right and why common wrong answers are wrong.",
        },
      },
    },
  },
};

/**
 * Concrete spec for each difficulty level.
 * These are passed verbatim into the user prompt so the LLM knows
 * exactly what is expected — vague adjectives like "hard" produce
 * vague questions; concrete specs produce distinct questions.
 */
const DIFFICULTY_SPECS = {
  easy: {
    summary:     "Basic recall. Single concept. No tricks.",
    codeLines:   "0–2 lines (or no code at all).",
    questionType:"Directly ask what a keyword/operator/built-in does, or what simple one-liner returns.",
    wrongOptions:"Plausible alternatives a beginner might confuse (e.g. similar keyword names, neighbouring values).",
    example:     'e.g. "What does `typeof null` return?", "Which loop runs at least once?"',
  },
  medium: {
    summary:     "Concept application. Trace 2–4 lines. One non-obvious step.",
    codeLines:   "2–4 lines.",
    questionType:"Short code trace or 'what does this function return when called with X?'",
    wrongOptions:"Values you'd get by making one common mistake (wrong operator precedence, off-by-one, forgetting return).",
    example:     'e.g. "What does f(-3) return if f returns x > 0 ? x : -x?"',
  },
  intermediate: {
    summary:     "Gotchas and scope. 4–7 line trace with a non-obvious twist.",
    codeLines:   "4–7 lines.",
    questionType:"Closures, variable capture in loops, mutable defaults, array-method return values, or scope surprises.",
    wrongOptions:"What you'd output if you missed the gotcha. Include the 'obvious wrong' answer as one option.",
    example:     'e.g. classic loop-closure gotcha, Python mutable default argument, `this` in a callback.',
  },
  hard: {
    summary:     "Subtle edge cases. 5–10 lines. Requires careful reasoning.",
    codeLines:   "5–10 lines.",
    questionType:"Type coercion surprises, prototype chain lookups, complex destructuring, or multi-step algorithm trace with a twist.",
    wrongOptions:"Values from plausible but incorrect reasoning paths. At least two options should feel 'almost right'.",
    example:     'e.g. `[] + {}` vs `{} + []`, Python int identity at boundary, hoisting + TDZ interaction.',
  },
  expert: {
    summary:     "Deep language internals. 8–15 lines. Trips up experienced developers.",
    codeLines:   "8–15 lines (can be shorter if the concept itself is deep).",
    questionType:"Event loop / microtask queue order, generator protocol, Promise resolution order, complex closure over mutating state, or prototype manipulation.",
    wrongOptions:"Values from subtle misunderstandings of language spec behavior. All four options should seem plausible to a senior developer.",
    example:     'e.g. `async/await` execution order, generator `.next()` value passing, `Object.create` prototype chain.',
  },
};

export function buildSystemPrompt() {
  return `You are an expert programming tutor generating a single multiple-choice question.

MANDATORY PROCESS — follow these steps in order:
1. TRACE FIRST: If the question involves code execution, a return value, or recursive calls — execute every line step by step and write out ALL intermediate values before deciding the answer. For recursive functions, expand EVERY call until base cases. Never guess.
   Example: fib(8) → fib(7)+fib(6) → expand each → ... → 21. Never assume fib(8)=34.
2. Determine the correct answer FROM your trace, not from memory.
3. Place the correct answer in the options array at a position of your choice (0–3).
4. Set correctOptionIndex to that position.
5. SELF-CHECK: Read options[correctOptionIndex]. If it does not equal your traced answer, fix correctOptionIndex.

INDEXING EXAMPLE: options = ["None","Error","5","True"], correct answer = 5 → correctOptionIndex = 2.

DIFFICULTY CONTRACT:
The difficulty level in the request is a strict specification, not a suggestion.
easy        → basic recall, 0–2 lines, no tricks
medium      → 2–4 line trace, one non-obvious step
intermediate → 4–7 lines, classic gotchas, scope/closure surprises
hard        → 5–10 lines, subtle edge cases, type coercion, careful multi-step reasoning required
expert      → 8–15 lines, deep language internals (event loop, generators, prototype chain), trips up senior devs

CONTENT RULES:
- CRITICAL: NEVER use triple backticks (\`\`\`) anywhere — they break the JSON parser. For inline code use single backticks. For multi-line code, embed it directly in the question string using \\n for each new line.
- CODE FORMATTING — THIS IS MANDATORY:
  * Every statement must be on its own line. NEVER compress multiple statements onto one line with semicolons or colons (e.g. "for i in range(3): def func(): return x" is WRONG).
  * Use correct indentation: Python = 4 spaces, JavaScript/TypeScript/Java/C/C++/Go/Rust = 4 spaces per level.
  * Format: write the question/description first (ending with a colon), then \\n\\n, then the properly indented code. Each level of nesting must be indented.
  * CORRECT Python example: "What is the output?\\n\\nfuncs = []\\nfor i in range(3):\\n    def func(x=i):\\n        return x\\n    funcs.append(func)\\nprint(funcs[0]())"
  * WRONG: "Consider this code: for i in range(3): def func(x=i): return x funcs.append(func)"
- Code must be syntactically correct and executable in the specified language.
- Wrong options must be plausible — values from common mistakes, NOT obviously absurd.
- At intermediate/hard/expert, include a twist requiring more than surface reading.
- Hint nudges without revealing.
- Explanation: explain the "why" behind the correct answer and why wrong options are wrong.`;
}

/**
 * Human-readable display names + special instructions per language.
 * DSA gets its own prompt context since it's a subject, not a language.
 */
const LANGUAGE_CONTEXT = {
  javascript: { label: 'JavaScript (ES2022+)',  note: null },
  typescript: { label: 'TypeScript',            note: null },
  python:     { label: 'Python 3',              note: null },
  java:       { label: 'Java 17+',              note: null },
  cpp:        { label: 'C++17',                 note: null },
  c:          { label: 'C (C11)',               note: null },
  go:         { label: 'Go (Golang)',           note: null },
  rust:       { label: 'Rust',                  note: null },
  ruby:       { label: 'Ruby',                  note: null },
  php:        { label: 'PHP 8',                 note: null },
  swift:      { label: 'Swift',                 note: null },
  kotlin:     { label: 'Kotlin',                note: null },
  dsa: {
    label: 'Data Structures & Algorithms',
    note:
      'This is a DSA question — NOT language-specific. Use pseudo-code or Python-like notation only when showing code. ' +
      'Focus on: time/space complexity, algorithm correctness, data structure selection, step-by-step trace of an algorithm. ' +
      'Do NOT write language-specific syntax. Questions should test algorithmic thinking.',
  },
};

export function buildUserPrompt({ topicName, topicDescription, difficulty, language }) {
  const spec    = DIFFICULTY_SPECS[difficulty] ?? DIFFICULTY_SPECS.easy;
  const langCtx = LANGUAGE_CONTEXT[language] ?? { label: language, note: null };

  const languageLine = langCtx.note
    ? `Subject: ${langCtx.label}\nSpecial instruction: ${langCtx.note}`
    : `Language: ${langCtx.label}`;

  return `Topic: ${topicName}
Description: ${topicDescription}
${languageLine}
Difficulty: ${difficulty.toUpperCase()}

Difficulty specification for this question:
- Goal: ${spec.summary}
- Code length: ${spec.codeLines}
- Question type: ${spec.questionType}
- Wrong options: ${spec.wrongOptions}
- Example style: ${spec.example}

CRITICAL RULE: If the question asks about what a function, method, or code snippet returns or does, you MUST include the actual function/code in the question text. Never say "the function" or "this code" without showing it. Use \\n for line breaks to embed the code directly in the question.

Generate exactly one question at ${difficulty.toUpperCase()} difficulty. Follow the specification above precisely — the difficulty must be clearly distinct from easier levels.

If your question involves code execution: trace every step manually before setting the answer. Do not guess return values from memory.

Final check: options[correctOptionIndex] must equal your traced correct answer.`;
}
