import { useState } from 'react';
import { api } from '../api/client.js';

/**
 * State machine for one tutoring session:
 *
 *   idle ──► loading ──► active ──► submitting ──► answered
 *                           ▲                          │
 *                           └──────────────────────────┘
 *                                  (next question)
 */
export function useSession() {
  const [status, setStatus]     = useState('idle');     // idle | loading | active | submitting | answered | error
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError]       = useState(null);

  const fetchNext = async () => {
    setStatus('loading');
    setFeedback(null);
    setError(null);
    try {
      const data = await api.session.next();
      setQuestion(data);
      setStatus('active');
    } catch (err) {
      setQuestion(null);
      setError(err.message);
      setStatus('error');
    }
  };

  const submitAnswer = async (topicId, selectedOptionIndex) => {
    setStatus('submitting');
    try {
      const data = await api.session.answer(topicId, selectedOptionIndex);
      setFeedback({ ...data, selectedOptionIndex });
      setStatus('answered');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return { status, question, feedback, error, fetchNext, submitAnswer };
}
