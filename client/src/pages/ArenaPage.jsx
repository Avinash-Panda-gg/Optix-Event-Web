import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TimerWidget from '../components/TimerWidget';
import Modal from '../components/Modal';
import { getQuestions, submitRound, getStatus } from '../api/game';
import toast from 'react-hot-toast';

export default function ArenaPage() {
  const { roundId } = useParams();
  const navigate = useNavigate();

  const [roundData, setRoundData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qId]: 'A' }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    async function loadArena() {
      try {
        const [qRes, statusRes] = await Promise.all([
          getQuestions(roundId),
          getStatus(),
        ]);

        setRoundData(qRes.data.round);
        setQuestions(qRes.data.questions || []);
        setTimeRemaining(statusRes.data.timeRemaining);

        if (statusRes.data.status === 'COMPLETED' || statusRes.data.status === 'EXPIRED') {
          navigate('/completed');
        }
      } catch (err) {
        const code = err.response?.data?.code;
        if (code === 'GAME_EXPIRED' || code === 'GAME_COMPLETED') {
          navigate('/completed');
        } else {
          toast.error(err.response?.data?.message || 'Failed to load round questions.');
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    }

    loadArena();
  }, [roundId, navigate]);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (letter) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: letter,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSubmitRound = async () => {
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    const answersPayload = questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: selectedAnswers[q._id] || null,
    }));

    try {
      const res = await submitRound(roundId, {
        answers: answersPayload,
        timeTaken,
      });

      setResultModal(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit round.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseResultModal = () => {
    if (resultModal?.isGameComplete) {
      navigate('/completed');
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner" />
        <p className="font-mono text-sm">Decrypting Round Security Clearance...</p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="page-wrapper flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted">No questions available for this round.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedLetter = selectedAnswers[currentQuestion?._id];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="page-wrapper pb-16">
      <div className="grid-bg" />

      {/* Quiz Navbar matching Screenshot 6 */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="flex items-center gap-3">
            <span className="badge badge-cyan font-mono text-xs">
              R{roundData?.roundNumber} · {roundData?.title}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <TimerWidget initialSeconds={timeRemaining} status="IN_PROGRESS" />
            <button onClick={() => setShowQuitModal(true)} className="btn btn-outline btn-sm text-danger border-danger/30">
              Quit Arena
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl pt-8 relative z-10">
        {/* Question Counter & Points Header matching Screenshot 6 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-xs font-mono text-cyan tracking-widest uppercase">
              QUESTION {currentIndex + 1} OF {questions.length}
            </div>
            <div className="text-xs text-muted mt-0.5">
              Answered {answeredCount} / {questions.length} questions
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge badge-violet font-mono">
              +{currentQuestion?.points || 100} pts
            </span>
          </div>
        </div>

        {/* Question Progress Dots */}
        <div className="flex gap-2 mb-8">
          {questions.map((q, idx) => {
            const isAnswered = !!selectedAnswers[q._id];
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q._id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 flex-1 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-cyan shadow-[0_0_10px_#00E5FF]'
                    : isAnswered
                    ? 'bg-violet'
                    : 'bg-white/10'
                }`}
              />
            );
          })}
        </div>

        {/* Main Question Card matching Screenshot 6 */}
        <div className="glass-card p-8 border-cyan/20 mb-8 animate-fade-in">
          <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-8">
            {currentQuestion?.questionText}
          </h2>

          {/* Multiple Choice Options List matching Screenshot 6 */}
          <div className="flex flex-col gap-4">
            {currentQuestion?.options.map((opt) => {
              // Extract prefix letter e.g., 'A. Symmetric' -> letter 'A'
              const letterMatch = opt.match(/^([A-D])\.\s*(.*)/);
              const letter = letterMatch ? letterMatch[1] : opt.charAt(0);
              const text = letterMatch ? letterMatch[2] : opt;

              const isSelected = selectedLetter === letter;

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(letter)}
                  className={`option-btn ${isSelected ? 'selected' : ''}`}
                >
                  <span className="option-letter">{letter}</span>
                  <span className="flex-1">{text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions Bar matching Screenshot 6 */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn btn-outline btn-sm"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-3">
            {!isLastQuestion ? (
              <button onClick={handleNext} className="btn btn-primary">
                Next Question ➜
              </button>
            ) : (
              <button
                onClick={handleSubmitRound}
                disabled={submitting}
                className="btn btn-cyan btn-lg animate-pulse-glow"
              >
                {submitting ? <span className="spinner" /> : 'Submit Round ✓'}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Quit Arena Confirmation Modal */}
      <Modal
        isOpen={showQuitModal}
        onClose={() => setShowQuitModal(false)}
        title="⚠️ Confirm Quit Arena"
      >
        <div className="flex flex-col gap-3 text-sm text-secondary">
          <p>Are you sure you want to exit this round?</p>
          <div className="p-3 glass-card border-danger/30 text-danger text-xs">
            <strong>Note:</strong> Your 30-minute global timer will continue running in the background.
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowQuitModal(false)} className="btn btn-outline btn-sm">
            Resume Quiz
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-danger btn-sm">
            Quit to Dashboard
          </button>
        </div>
      </Modal>

      {/* Round Complete Result Modal */}
      {resultModal && (
        <Modal
          isOpen={true}
          onClose={handleCloseResultModal}
          title={resultModal.isGameComplete ? '🏆 Tournament Completed!' : `🎉 Round ${roundData?.roundNumber} Complete!`}
        >
          <div className="flex flex-col gap-4 text-center py-4">
            <div className="text-4xl mb-1">
              {resultModal.isGameComplete ? '👑' : '✨'}
            </div>

            <p className="text-secondary text-sm">{resultModal.message}</p>

            <div className="grid grid-cols-2 gap-4 my-2">
              <div className="glass-card p-4">
                <div className="text-xs text-muted">Score Earned</div>
                <div className="text-2xl font-bold font-mono text-cyan">
                  +{resultModal.scoreAwarded}
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="text-xs text-muted">XP Awarded</div>
                <div className="text-2xl font-bold font-mono text-violet">
                  +{resultModal.xpAwarded} XP
                </div>
              </div>
            </div>

            <button onClick={handleCloseResultModal} className="btn btn-primary btn-full py-3 mt-2">
              {resultModal.isGameComplete ? 'View Final Results ➜' : 'Continue to Dashboard ➜'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
