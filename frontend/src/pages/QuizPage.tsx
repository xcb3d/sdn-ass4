import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchQuizById, clearCurrentQuiz } from '../features/quizzes/quizzesSlice';
import type { QuestionInfo } from '../features/quizzes/quizzesSlice';

export const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentQuiz, loading, error } = useAppSelector((state) => state.quizzes);

  // Quiz-taking states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // maps question index -> selected option index
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (quizId) {
      dispatch(fetchQuizById(quizId));
    }
    return () => {
      dispatch(clearCurrentQuiz());
    };
  }, [dispatch, quizId]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading quiz details...</p>
      </div>
    );
  }

  if (error || !currentQuiz) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center" role="alert">
          <i className="bi bi-exclamation-octagon fs-1 d-block mb-3"></i>
          <h4 className="fw-bold">Quiz Not Found</h4>
          <p className="mb-3">{error || 'The requested quiz could not be loaded.'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const questions = (currentQuiz.questions || []) as QuestionInfo[];
  const totalQuestions = questions.length;

  if (totalQuestions === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-circle fs-1 d-block mb-3"></i>
          <h4 className="fw-bold">Empty Quiz</h4>
          <p className="mb-3">This quiz does not have any questions yet.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];
  const progressPercentage = Math.round(((currentIdx + 1) / totalQuestions) * 100);

  const handleSelectOption = (optIdx: number) => {
    setAnswers({
      ...answers,
      [currentIdx]: optIdx,
    });
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < totalQuestions) {
      if (!window.confirm(`You answered ${answeredCount}/${totalQuestions} questions. Are you sure you want to submit?`)) {
        return;
      }
    }
    setIsSubmitted(true);
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    return {
      correctCount,
      percentage: Math.round((correctCount / totalQuestions) * 100),
    };
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentIdx(0);
    setIsSubmitted(false);
  };

  // Render Results Dashboard
  if (isSubmitted) {
    const { correctCount, percentage } = calculateScore();
    const scoreColor = percentage >= 70 ? 'success' : percentage >= 40 ? 'warning' : 'danger';
    const scoreIcon = percentage >= 70 ? 'bi-emoji-laughing' : percentage >= 40 ? 'bi-emoji-neutral' : 'bi-emoji-frown';

    return (
      <div className="container py-4" style={{ maxWidth: '800px' }}>
        {/* Score Card */}
        <div className={`card shadow-lg border-0 rounded-4 overflow-hidden mb-4 text-center text-white bg-${scoreColor}`}>
          <div className="card-body p-5">
            <i className={`bi ${scoreIcon}`} style={{ fontSize: '4.5rem' }}></i>
            <h1 className="fw-bold display-4 mt-2 mb-1">{percentage}%</h1>
            <h3 className="fw-semibold">
              You scored {correctCount} / {totalQuestions}
            </h3>
            <p className="opacity-75 mb-0 mt-3 small">
              {percentage >= 70
                ? 'Excellent job! You have mastered this topic.'
                : percentage >= 40
                ? 'Good effort! Study up and try again to improve.'
                : 'Keep practicing! You can do better next time.'}
            </p>
          </div>
        </div>

        {/* Detailed Question Review */}
        <h3 className="fw-bold text-dark mb-3">Review Answers</h3>
        <div className="d-flex flex-column gap-3 mb-4">
          {questions.map((q, idx) => {
            const userAnswerIdx = answers[idx];
            const isCorrect = userAnswerIdx === q.correctAnswerIndex;
            return (
              <div key={q._id} className="card shadow-sm border-0 rounded-3 p-4">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <h5 className="fw-bold text-dark mb-0">
                    Question {idx + 1}: <span className="fw-normal">{q.text}</span>
                  </h5>
                  <span className={`badge bg-${isCorrect ? 'success' : 'danger'} p-2 d-flex align-items-center gap-1`}>
                    <i className={`bi ${isCorrect ? 'bi-check-circle' : 'bi-x-circle'}`}></i>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="row g-2 mt-2">
                  {q.options.map((opt, optIdx) => {
                    let borderClass = 'border';
                    let bgClass = 'bg-light';
                    let icon = null;

                    if (optIdx === q.correctAnswerIndex) {
                      borderClass = 'border-2 border-success';
                      bgClass = 'bg-success bg-opacity-10 text-success';
                      icon = <i className="bi bi-check-circle-fill me-2"></i>;
                    } else if (optIdx === userAnswerIdx) {
                      borderClass = 'border-2 border-danger';
                      bgClass = 'bg-danger bg-opacity-10 text-danger';
                      icon = <i className="bi bi-x-circle-fill me-2"></i>;
                    }

                    return (
                      <div key={optIdx} className="col-12">
                        <div className={`p-3 rounded-3 d-flex align-items-center ${borderClass} ${bgClass}`}>
                          {icon}
                          <span className={optIdx === q.correctAnswerIndex || optIdx === userAnswerIdx ? 'fw-bold' : ''}>
                            {opt}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {q.keywords && q.keywords.length > 0 && (
                  <div className="mt-3">
                    <span className="text-muted small me-2">Keywords:</span>
                    {q.keywords.map((k) => (
                      <span key={k} className="badge bg-secondary me-1 text-light">
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="d-flex gap-3 justify-content-center">
          <button onClick={handleRetake} className="btn btn-outline-primary px-4 py-2 fw-semibold">
            <i className="bi bi-arrow-counterclockwise"></i> Retake Quiz
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary px-5 py-2 fw-semibold">
            <i className="bi bi-house-door-fill"></i> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render Active Question
  return (
    <div className="container py-4" style={{ maxWidth: '700px' }}>
      {/* Quiz Progress & Details */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-end mb-2">
          <div>
            <span className="text-muted small text-uppercase fw-bold tracking-wider">Taking Quiz</span>
            <h2 className="fw-bold text-dark mb-0">{currentQuiz.title}</h2>
          </div>
          <span className="fw-bold text-primary">
            {currentIdx + 1} of {totalQuestions}
          </span>
        </div>
        <div className="progress" style={{ height: '8px' }}>
          <div
            className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
            role="progressbar"
            style={{ width: `${progressPercentage}%` }}
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="card shadow border-0 rounded-4 p-4 mb-4">
        <div className="card-body p-0">
          <h4 className="fw-bold text-dark mb-4">{activeQuestion.text}</h4>

          <div className="d-flex flex-column gap-3">
            {activeQuestion.options.map((opt, optIdx) => {
              const isSelected = answers[currentIdx] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`btn text-start p-3 border rounded-3 w-100 transition d-flex align-items-center justify-content-between ${
                    isSelected ? 'border-primary bg-primary bg-opacity-10 border-2' : 'btn-light border-secondary-subtle'
                  }`}
                >
                  <span className={isSelected ? 'fw-bold text-primary' : 'text-dark'}>
                    {opt}
                  </span>
                  <div
                    className={`rounded-circle border d-flex align-items-center justify-content-center`}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderColor: isSelected ? '#0d6efd' : '#dee2e6',
                      backgroundColor: isSelected ? '#0d6efd' : 'transparent',
                    }}
                  >
                    {isSelected && <i className="bi bi-check text-white fw-bold"></i>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex justify-content-between align-items-center">
        <button
          onClick={handlePrev}
          className="btn btn-outline-secondary px-3 py-2 fw-semibold d-flex align-items-center gap-1"
          disabled={currentIdx === 0}
        >
          <i className="bi bi-arrow-left"></i> Previous
        </button>

        {currentIdx === totalQuestions - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            className="btn btn-success px-4 py-2 fw-bold d-flex align-items-center gap-1 shadow"
          >
            <i className="bi bi-send-fill"></i> Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn btn-primary px-4 py-2 fw-semibold d-flex align-items-center gap-1"
          >
            Next <i className="bi bi-arrow-right"></i>
          </button>
        )}
      </div>
    </div>
  );
};
