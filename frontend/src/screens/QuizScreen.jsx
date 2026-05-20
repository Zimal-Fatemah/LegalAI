import { useMemo, useState } from 'react';
import { ArrowLeft, Trophy, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';

const getTokens = (darkMode) => ({
  BG: darkMode ? '#151515' : '#fbf7ef',
  GLASS: darkMode ? 'rgba(32,32,32,0.62)' : 'rgba(255,255,255,0.42)',
  GLASS_BORDER: darkMode ? 'rgba(102,102,102,0.32)' : 'rgba(255,255,255,0.58)',
  CARD_BG: darkMode ? 'rgba(26,26,26,0.82)' : 'rgba(255,255,255,0.85)',
  CARD_BORDER: darkMode ? 'rgba(86,86,86,0.44)' : 'rgba(220,205,181,0.75)',
  FG: darkMode ? '#f5f2ea' : '#24252d',
  FG_MUTED: darkMode ? '#b6aea0' : '#6b6b6b',
  GOLD: '#b0823a',
  GOLD_SOFT: darkMode ? 'rgba(176,130,58,0.28)' : 'rgba(176,130,58,0.16)',
  TEAL_SOFT: darkMode ? 'rgba(42,153,132,0.2)' : 'rgba(42,153,132,0.1)',
  SUCCESS: '#2b9a62',
  ERROR: '#c05656',
});

function parseQuizPayload(payload) {
  const direct = payload?.questions || payload?.quiz || payload?.data;
  if (Array.isArray(direct)) return direct;

  const text = payload?.answer;
  if (typeof text !== 'string') return null;

  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf('[');
    const last = text.lastIndexOf(']');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1));
      } catch {
        return null;
      }
    }
  }

  return null;
}

function toFriendlyQuizError(err) {
  const raw = err?.message || 'Unable to generate quiz.';

  if (raw.includes('Unable to parse model output') || raw.includes('Expecting') || raw.includes('delimiter')) {
    return 'AI returned a malformed quiz format. Please click Retry to regenerate.';
  }

  if (raw.includes('Failed to fetch')) {
    return 'Cannot reach backend API. Start backend on port 8000 and try again.';
  }

  if (raw.includes('404')) {
    return 'Quiz endpoint not found. Make sure backend is running with the latest code.';
  }

  if (raw.includes('503')) {
    return 'RAG system is not ready yet. Upload/index PDFs first, then retry.';
  }

  return raw;
}

function normalizeQuestion(item, index) {
  const options = Array.isArray(item?.options) ? item.options : [];
  const answerText = item?.answer;
  let answerIndex = options.findIndex((opt) => opt === answerText);

  if (answerIndex < 0) {
    if (typeof item?.answerIndex === 'number' && item.answerIndex >= 0 && item.answerIndex < options.length) {
      answerIndex = item.answerIndex;
    } else {
      answerIndex = 0;
    }
  }

  return {
    id: item?.id || `q-${index + 1}`,
    question: item?.question || `Question ${index + 1}`,
    options: options.length >= 2 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
    answerIndex,
    explanation: item?.explanation || 'Review your source excerpts to validate this legal point.',
    source: item?.source || item?.citation || 'Uploaded legal sources',
  };
}

export default function QuizScreen({ darkMode, mode, onBackToChat }) {
  const tokens = getTokens(darkMode);
  const [topic, setTopic] = useState('Constitutional remedies');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [lastPayload, setLastPayload] = useState(null);

  const currentQuestion = quiz[currentIndex];

  const score = useMemo(() => {
    return quiz.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.answerIndex ? 1 : 0);
    }, 0);
  }, [quiz, selectedAnswers]);

  const runGenerateQuiz = async (payload) => {
    setLastPayload(payload);

    if (!payload.topic?.trim()) {
      setNotice('Please enter a topic before generating quiz.');
      return;
    }

    setIsLoading(true);
    setRevealedAnswers({});
    setIsQuizFinished(false);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setNotice('');
    setQuiz([]);

    try {
      let response;
      try {
        response = await api.generateQuiz(payload);
      } catch {
        // One immediate retry handles intermittent model JSON generation failures.
        response = await api.generateQuiz(payload);
      }
      const parsed = parseQuizPayload(response);

      if (!parsed || !parsed.length) {
        throw new Error('Received an empty quiz from backend');
      }

      const normalized = parsed.slice(0, Number(payload.num_questions)).map(normalizeQuestion);
      setQuiz(normalized);
    } catch (err) {
      setQuiz([]);
      setNotice(toFriendlyQuizError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    const payload = {
      topic,
      difficulty,
      num_questions: Number(questionCount),
      mode,
    };

    await runGenerateQuiz(payload);
  };

  const handleRetryLastGenerate = async () => {
    if (!lastPayload) return;
    await runGenerateQuiz(lastPayload);
  };

  const handleSelectOption = (optionIndex) => {
    if (revealedAnswers[currentIndex]) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleCheckCurrentAnswer = () => {
    if (selectedAnswers[currentIndex] === undefined) {
      setNotice('Select an option first, then check the answer.');
      return;
    }

    setNotice('');
    setRevealedAnswers((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const handleFinishQuiz = () => {
    setIsQuizFinished(true);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const checkedCount = Object.keys(revealedAnswers).length;
  const isCurrentRevealed = Boolean(revealedAnswers[currentIndex]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: `radial-gradient(circle at 20% 10%, ${tokens.GOLD_SOFT} 0%, transparent 35%), radial-gradient(circle at 80% 90%, ${tokens.TEAL_SOFT} 0%, transparent 40%), ${tokens.BG}`,
        color: tokens.FG,
        overflow: 'auto',
      }}
    >
      <div style={{ padding: '18px 28px', borderBottom: `1px solid ${tokens.CARD_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBackToChat}
          style={{
            border: `1px solid ${tokens.CARD_BORDER}`,
            background: tokens.CARD_BG,
            color: tokens.FG,
            borderRadius: '10px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Back to Chat
        </button>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '25px', letterSpacing: '-0.4px' }}>Generate Quiz</span>
        </div>

        <div style={{ minWidth: '130px', textAlign: 'right', color: tokens.FG_MUTED, fontSize: '13px' }}>
          Mode: {mode}
        </div>
      </div>

      <div style={{ padding: '26px', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 'min(980px, 100%)',
            borderRadius: '22px',
            border: `1px solid ${tokens.GLASS_BORDER}`,
            background: tokens.GLASS,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 26px 60px rgba(0,0,0,0.14)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic for quiz"
              style={{
                background: tokens.CARD_BG,
                border: `1px solid ${tokens.CARD_BORDER}`,
                color: tokens.FG,
                borderRadius: '12px',
                padding: '12px 14px',
                outline: 'none',
              }}
            />

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                background: tokens.CARD_BG,
                border: `1px solid ${tokens.CARD_BORDER}`,
                color: tokens.FG,
                borderRadius: '12px',
                padding: '12px 14px',
                outline: 'none',
              }}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>

            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              style={{
                background: tokens.CARD_BG,
                border: `1px solid ${tokens.CARD_BORDER}`,
                color: tokens.FG,
                borderRadius: '12px',
                padding: '12px 14px',
                outline: 'none',
              }}
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>

            <button
              onClick={handleGenerateQuiz}
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #c89b4a 0%, #9d7031 100%)',
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#fff',
                borderRadius: '12px',
                padding: '0 16px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.65 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {notice && (
            <div
              style={{
                marginBottom: '14px',
                color: tokens.FG_MUTED,
                fontSize: '13px',
                border: `1px solid ${tokens.CARD_BORDER}`,
                background: tokens.CARD_BG,
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <span>{notice}</span>
              <button
                onClick={handleRetryLastGenerate}
                disabled={isLoading || !lastPayload}
                style={{
                  borderRadius: '8px',
                  border: `1px solid ${tokens.CARD_BORDER}`,
                  background: tokens.BG,
                  color: tokens.FG,
                  padding: '6px 10px',
                  cursor: isLoading || !lastPayload ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !lastPayload ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!quiz.length && !isLoading && (
            <div
              style={{
                borderRadius: '16px',
                border: `1px dashed ${tokens.CARD_BORDER}`,
                padding: '40px 24px',
                textAlign: 'center',
                color: tokens.FG_MUTED,
                background: tokens.CARD_BG,
              }}
            >
              Set a topic and press Generate to create your quiz.
            </div>
          )}

          {quiz.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ color: tokens.FG_MUTED, fontSize: '13px' }}>Question {currentIndex + 1} of {quiz.length}</div>
                <div style={{ color: tokens.FG_MUTED, fontSize: '13px' }}>
                  Answered: {answeredCount}/{quiz.length} | Checked: {checkedCount}/{quiz.length}
                </div>
              </div>

              <div style={{ marginBottom: '12px', fontSize: '12px', color: tokens.FG_MUTED }}>
                Flow: select an option, check answer, then move to next.
              </div>

              <div style={{ width: '100%', height: '7px', borderRadius: '999px', background: tokens.CARD_BG, marginBottom: '18px', border: `1px solid ${tokens.CARD_BORDER}` }}>
                <div style={{ width: `${((currentIndex + 1) / quiz.length) * 100}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #d7b067 0%, #b0823a 100%)' }} />
              </div>

              <div style={{ borderRadius: '16px', border: `1px solid ${tokens.CARD_BORDER}`, background: tokens.CARD_BG, padding: '20px', marginBottom: '14px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '14px', fontSize: '23px', fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
                  {currentQuestion.question}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {currentQuestion.options.map((option, optionIndex) => {
                    const selected = selectedAnswers[currentIndex] === optionIndex;
                    const isCorrect = currentQuestion.answerIndex === optionIndex;

                    let borderColor = tokens.CARD_BORDER;
                    let bg = darkMode ? 'rgba(20,20,20,0.72)' : 'rgba(255,255,255,0.95)';

                    if (selected) {
                      borderColor = tokens.GOLD;
                      bg = tokens.GOLD_SOFT;
                    }

                    if (isCurrentRevealed && isCorrect) {
                      borderColor = tokens.SUCCESS;
                      bg = darkMode ? 'rgba(43,154,98,0.16)' : 'rgba(43,154,98,0.10)';
                    }

                    if (isCurrentRevealed && selected && !isCorrect) {
                      borderColor = tokens.ERROR;
                      bg = darkMode ? 'rgba(192,86,86,0.16)' : 'rgba(192,86,86,0.10)';
                    }

                    return (
                      <button
                        key={`${currentQuestion.id}-opt-${optionIndex}`}
                        onClick={() => handleSelectOption(optionIndex)}
                        style={{
                          textAlign: 'left',
                          borderRadius: '12px',
                          border: `1px solid ${borderColor}`,
                          background: bg,
                          color: tokens.FG,
                          padding: '14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          cursor: isCurrentRevealed ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: selected ? '0 8px 20px rgba(176,130,58,0.12)' : 'none',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: tokens.GOLD }}>{String.fromCharCode(65 + optionIndex)}</span>
                        <span style={{ lineHeight: 1.45 }}>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {isCurrentRevealed && (
                <div style={{ borderRadius: '14px', border: `1px solid ${tokens.CARD_BORDER}`, background: tokens.CARD_BG, padding: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    {selectedAnswers[currentIndex] === currentQuestion.answerIndex ? (
                      <CheckCircle2 size={18} color={tokens.SUCCESS} />
                    ) : (
                      <XCircle size={18} color={tokens.ERROR} />
                    )}
                    <span style={{ fontWeight: 600 }}>Correct answer: {String.fromCharCode(65 + currentQuestion.answerIndex)}</span>
                  </div>
                  <p style={{ margin: 0, color: tokens.FG_MUTED, fontSize: '14px', lineHeight: 1.45 }}>{currentQuestion.explanation}</p>
                  <p style={{ margin: '8px 0 0', color: tokens.FG_MUTED, fontSize: '12px' }}>Source: {currentQuestion.source}</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  style={{
                    borderRadius: '10px',
                    border: `1px solid ${tokens.CARD_BORDER}`,
                    background: tokens.CARD_BG,
                    color: tokens.FG,
                    padding: '10px 14px',
                    opacity: currentIndex === 0 ? 0.45 : 1,
                    cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {!isCurrentRevealed && (
                    <button
                      onClick={handleCheckCurrentAnswer}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.35)',
                        background: 'linear-gradient(135deg, #2ba084 0%, #1f7f68 100%)',
                        color: '#fff',
                        padding: '10px 14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Check Answer
                    </button>
                  )}

                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(quiz.length - 1, prev + 1))}
                    disabled={currentIndex >= quiz.length - 1}
                    style={{
                      borderRadius: '10px',
                      border: `1px solid ${tokens.CARD_BORDER}`,
                      background: tokens.CARD_BG,
                      color: tokens.FG,
                      padding: '10px 14px',
                      opacity: currentIndex >= quiz.length - 1 ? 0.45 : 1,
                      cursor: currentIndex >= quiz.length - 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>

                  {checkedCount === quiz.length && !isQuizFinished && (
                    <button
                      onClick={handleFinishQuiz}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.35)',
                        background: 'linear-gradient(135deg, #c89b4a 0%, #9d7031 100%)',
                        color: '#fff',
                        padding: '10px 14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Finish Quiz
                    </button>
                  )}
                </div>
              </div>

              {isQuizFinished && (
                <div style={{ marginTop: '16px', borderRadius: '16px', border: `1px solid ${tokens.CARD_BORDER}`, background: tokens.CARD_BG, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Trophy size={18} color={tokens.GOLD} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>Score: {score}/{quiz.length}</p>
                      <p style={{ margin: 0, color: tokens.FG_MUTED, fontSize: '13px' }}>
                        Accuracy: {Math.round((score / quiz.length) * 100)}%
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setRevealedAnswers({});
                      setIsQuizFinished(false);
                      setCurrentIndex(0);
                      setSelectedAnswers({});
                      setNotice('');
                    }}
                    style={{
                      borderRadius: '10px',
                      border: `1px solid ${tokens.CARD_BORDER}`,
                      background: tokens.CARD_BG,
                      color: tokens.FG,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={14} /> Retry
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
