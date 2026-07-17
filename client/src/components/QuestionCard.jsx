/** Renders inline backtick code as styled <code> elements. */
function renderInlineCode(text) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`')
      ? <code key={i} className="bg-indigo-500/15 border border-indigo-500/20
          px-1.5 py-0.5 rounded text-indigo-300 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      : part
  );
}

/**
 * Renders the question text.
 *
 * If the text contains a newline the LLM is signalling a code block:
 *   "What is the output?\n\nfor i in range(3):\n    print(i)"
 * Everything before the first \n is treated as prose, everything after
 * is rendered in a <pre> block so indentation is preserved exactly.
 */
function renderQuestion(text) {
  const firstNL = text.indexOf('\n');

  if (firstNL === -1) {
    // No code block — prose with optional inline code
    return (
      <p className="font-mono text-slate-100 text-[0.92rem] leading-relaxed">
        {renderInlineCode(text)}
      </p>
    );
  }

  const prose = text.slice(0, firstNL).trim();
  const code  = text.slice(firstNL).trim();   // preserve internal \n indentation

  return (
    <div>
      {prose && (
        <p className="font-mono text-slate-100 text-[0.92rem] leading-relaxed mb-4">
          {renderInlineCode(prose)}
        </p>
      )}
      <pre className="bg-black/40 border border-white/[0.08] rounded-xl p-4
        overflow-x-auto text-sm font-code leading-relaxed whitespace-pre">
        <code className="text-emerald-300">{code}</code>
      </pre>
    </div>
  );
}

const LANG_LABELS = {
  javascript: 'JavaScript', python: 'Python',     java: 'Java',
  cpp: 'C++',               c: 'C',               typescript: 'TypeScript',
  go: 'Go',                 rust: 'Rust',          ruby: 'Ruby',
  php: 'PHP',               swift: 'Swift',        kotlin: 'Kotlin',
};

const DIFF = {
  easy:         'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  medium:       'text-amber-400   bg-amber-500/10   border-amber-500/25',
  intermediate: 'text-orange-400  bg-orange-500/10  border-orange-500/25',
  hard:         'text-rose-400    bg-rose-500/10    border-rose-500/25',
  expert:       'text-purple-400  bg-purple-500/10  border-purple-500/25',
};

export default function QuestionCard({ question }) {
  const { topicName, difficulty, language, question: qText } = question;
  return (
    <div className="glass rounded-xl p-6 animate-scale-in">
      {/* Header: topic + difficulty only */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-mono text-slate-400">{topicName}</span>
        <span className="text-slate-700">·</span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${DIFF[difficulty] || DIFF.easy}`}>
          {difficulty}
        </span>
      </div>

      {/* Question text with language badge inline */}
      <div className="flex items-start gap-3">
        {language && (
          <span className="shrink-0 mt-0.5 text-[10px] font-mono px-2 py-1 rounded-lg border
            text-sky-400 bg-sky-500/10 border-sky-500/25 leading-none">
            {LANG_LABELS[language] || language}
          </span>
        )}
        <div className="flex-1 min-w-0">
          {renderQuestion(qText)}
        </div>
      </div>
    </div>
  );
}
