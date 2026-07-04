import { useEffect, useState } from 'react';
import { useSession } from '../hooks/useSession.js';
import { useTopics } from '../context/TopicsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { getLevelConfig } from '../config/levels.js';
import QuestionCard from '../components/QuestionCard.jsx';
import OptionButton from '../components/OptionButton.jsx';
import HintPanel from '../components/HintPanel.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import MasteryGauge from '../components/MasteryGauge.jsx';
import LevelBadge from '../components/LevelBadge.jsx';
import LevelUpModal from '../components/LevelUpModal.jsx';

function optionStatus(i, feedback) {
  if (!feedback) return null;
  const { selectedOptionIndex: s, correctOptionIndex: c } = feedback;
  if (i === s && i === c) return 'selected-correct';
  if (i === s && i !== c) return 'selected-wrong';
  if (i !== s && i === c) return 'revealed-correct';
  return 'disabled';
}

function LoadingCard({ message }) {
  return (
    <div className="glass rounded-xl flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-7 h-7 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-xs font-mono text-slate-500">{message}</p>
    </div>
  );
}

export default function LearnPage() {
  const { status, question, feedback, error, fetchNext, submitAnswer } = useSession();
  const { refresh: refreshTopics } = useTopics();
  const { user, setUserLevel } = useAuth();

  const [showLevelUp, setShowLevelUp] = useState(false);

  const isAnswered   = status === 'answered';
  const isSubmitting = status === 'submitting';
  const isLoading    = status === 'idle' || status === 'loading';

  const currentLevel = user?.currentLevel ?? 1;
  const levelCfg     = getLevelConfig(currentLevel);

  // Load first question on mount
  useEffect(() => { fetchNext(); }, []);

  // After answering: refresh sidebar + check for level-up
  useEffect(() => {
    if (!isAnswered || !feedback) return;
    refreshTopics();
    if (feedback.levelUpAvailable) setShowLevelUp(true);
  }, [isAnswered]);

  const handleAdvance = async () => {
    try {
      await api.session.advanceLevel(true);
      setUserLevel(currentLevel + 1);
    } catch (_) {}
    setShowLevelUp(false);
  };

  const handleStay = async () => {
    try {
      await api.session.advanceLevel(false);
    } catch (_) {}
    setShowLevelUp(false);
  };

  return (
    <>
      {/* Level-up modal — shown over everything when streak threshold hit */}
      {showLevelUp && feedback?.nextLevel && (
        <LevelUpModal
          currentLevel={currentLevel}
          nextLevel={feedback.nextLevel.level}
          streakCount={feedback.levelCorrectStreak}
          onAdvance={handleAdvance}
          onStay={handleStay}
        />
      )}

      <div className="h-full flex flex-col lg:flex-row gap-5 p-5 overflow-y-auto lg:overflow-hidden">

        {/* ── Left column: question + options ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 lg:overflow-y-auto">
          {isLoading && <LoadingCard message="Generating question…" />}

          {status === 'error' && (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-sm font-mono text-red-400 mb-4">{error}</p>
              <button onClick={fetchNext}
                className="text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors">
                Try again
              </button>
            </div>
          )}

          {question && !isLoading && status !== 'error' && (
            <>
              <QuestionCard question={question} />
              <div className="space-y-2">
                {question.options.map((opt, i) => (
                  <OptionButton key={i} index={i} label={opt}
                    status={isAnswered ? optionStatus(i, feedback) : isSubmitting ? 'disabled' : null}
                    onClick={() => submitAnswer(question.topicId, i)} />
                ))}
              </div>
              {isSubmitting && <LoadingCard message="Checking answer…" />}
              {isAnswered && feedback && (
                <FeedbackPanel feedback={feedback} onNext={fetchNext} />
              )}
            </>
          )}
        </div>

        {/* ── Right column: context panel ── */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">

          {/* Level indicator */}
          <div className={`glass rounded-xl p-4 border ${levelCfg.border}`}>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">
              Difficulty Level
            </p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{levelCfg.emoji}</span>
              <div>
                <p className={`font-mono font-semibold text-sm ${levelCfg.text}`}>
                  {levelCfg.label}
                </p>
                <p className="text-[10px] font-mono text-slate-600">Level {currentLevel} of 5</p>
              </div>
            </div>
            {/* Level progress pips */}
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(n => (
                <div key={n}
                  className={`flex-1 h-1 rounded-full transition-all duration-500
                    ${n <= currentLevel ? levelCfg.bg.replace('bg-', 'bg-').replace('/10', '/80') : 'bg-white/[0.06]'}`}
                  style={n <= currentLevel ? { backgroundColor: n === currentLevel ? undefined : 'rgba(99,102,241,0.3)' } : {}}
                />
              ))}
            </div>
            {/* Streak indicator */}
            {isAnswered && feedback && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-[10px] font-mono text-slate-600 mb-1.5">Streak</p>
                <div className="flex gap-1">
                  {[1,2,3].map(n => (
                    <div key={n}
                      className={`flex-1 h-1.5 rounded-full transition-all duration-300
                        ${n <= feedback.levelCorrectStreak ? 'bg-emerald-500' : 'bg-white/[0.06]'}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono text-slate-600 mt-1">
                  {feedback.levelCorrectStreak}/3 to level up
                </p>
              </div>
            )}
          </div>

          {/* Mastery gauge */}
          {question && (
            <div className="glass rounded-xl p-5 flex flex-col items-center animate-scale-in">
              <MasteryGauge mastery={
                isAnswered && feedback ? feedback.masteryAfter : question.mastery
              } size={130} />
              <p className="font-mono font-medium text-slate-100 text-sm mt-3 text-center">
                {question.topicName}
              </p>
            </div>
          )}

          {/* Hint */}
          {question && !isAnswered && !isSubmitting && (
            <HintPanel hint={question.hint} />
          )}

          {/* BKT info card */}
          <div className="glass rounded-xl p-4">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">
              How it works
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              BKT tracks mastery per topic. Your level controls question difficulty.
              Get 3 correct in a row to unlock the next level.
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {['p(init)', 'p(transit)', 'p(guess)', 'p(slip)'].map(p => (
                <span key={p} className="text-[10px] font-mono text-indigo-400/70
                  bg-indigo-500/10 border border-indigo-500/15 px-1.5 py-0.5 rounded">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
