import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import {
  fetchQuizzes,
  updateQuiz,
  addQuestionToQuiz,
} from '../features/quizzes/quizzesSlice';
import { fetchQuestions } from '../features/questions/questionsSlice';

export const ManageQuizQuestionsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { list: quizzes, loading: quizzesLoading } = useAppSelector((state) => state.quizzes);
  const { list: questions } = useAppSelector((state) => state.questions);

  // Current quiz object
  const currentQuizObj = quizzes.find((q) => q._id === quizId);

  // Form & selection states
  const [activeQuestionTab, setActiveQuestionTab] = useState<'new' | 'exist'>('new');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qKeywords, setQKeywords] = useState('');
  const [selectedExistIds, setSelectedExistIds] = useState<string[]>([]);
  const [existQuestionSearch, setExistQuestionSearch] = useState('');

  useEffect(() => {
    dispatch(fetchQuizzes());
    dispatch(fetchQuestions());
  }, [dispatch]);

  if (quizzesLoading && quizzes.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading quiz details...</p>
      </div>
    );
  }

  if (!currentQuizObj) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        Quiz not found or unauthorized access.
        <button onClick={() => navigate('/dashboard')} className="btn btn-outline-danger btn-sm ms-3">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Get current questions linked to the quiz
  const currentQuestions = currentQuizObj.questions || [];
  const currentQuestionIds = currentQuestions.map((q: any) => (typeof q === 'string' ? q : q._id));

  // Filter available questions (not in quiz yet)
  const availableQuestions = questions.filter((q) => !currentQuestionIds.includes(q._id));
  const filteredAvailableQuestions = availableQuestions.filter((q) =>
    q.text.toLowerCase().includes(existQuestionSearch.toLowerCase()) ||
    (q.keywords && q.keywords.some((k: string) => k.toLowerCase().includes(existQuestionSearch.toLowerCase())))
  );

  const resetQuestionForm = () => {
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrectIndex(0);
    setQKeywords('');
    setSelectedExistIds([]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...qOptions];
    updated[index] = value;
    setQOptions(updated);
  };

  // Submit handlers
  const handleCreateNewQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId || !qText.trim()) return;

    const filteredOptions = qOptions.filter((opt) => opt.trim() !== '');
    const keywordsArray = qKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k !== '');

    dispatch(
      addQuestionToQuiz({
        quizId,
        questionData: {
          text: qText,
          options: filteredOptions,
          keywords: keywordsArray,
          correctAnswerIndex: qCorrectIndex,
        },
      })
    )
      .unwrap()
      .then(() => {
        alert('Question created and added to quiz successfully!');
        resetQuestionForm();
        dispatch(fetchQuizzes());
      })
      .catch((err) => alert('Failed to add question: ' + err));
  };

  const handleAddExistingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId || selectedExistIds.length === 0) return;

    const updatedQuestionIds = [...currentQuestionIds, ...selectedExistIds];
    dispatch(
      updateQuiz({
        quizId,
        quizData: {
          title: currentQuizObj.title,
          description: currentQuizObj.description,
          questions: updatedQuestionIds,
        },
      })
    )
      .unwrap()
      .then(() => {
        alert('Questions linked successfully!');
        resetQuestionForm();
        dispatch(fetchQuizzes());
      })
      .catch((err) => alert('Failed to update quiz: ' + err));
  };

  const handleRemoveQuestion = (questionId: string) => {
    if (!quizId) return;

    const updatedQuestionIds = currentQuestionIds.filter((id) => id !== questionId);
    if (window.confirm('Are you sure you want to remove this question from the quiz?')) {
      dispatch(
        updateQuiz({
          quizId,
          quizData: {
            title: currentQuizObj.title,
            description: currentQuizObj.description,
            questions: updatedQuestionIds,
          },
        })
      )
        .unwrap()
        .then(() => {
          alert('Question removed successfully!');
          dispatch(fetchQuizzes());
        })
        .catch((err) => alert('Failed to update quiz: ' + err));
    }
  };

  return (
    <div className="container py-4">
      {/* Top Header Navigation */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline-secondary btn-sm mb-2 d-inline-flex align-items-center gap-1"
          >
            <i className="bi bi-arrow-left"></i> Back to Dashboard
          </button>
          <h1 className="fw-bold text-dark mb-0">Manage Questions</h1>
          <p className="text-muted mb-0">
            Quiz: <span className="fw-semibold text-primary">{currentQuizObj.title}</span>
          </p>
        </div>
        <div className="bg-light px-3 py-2 rounded border small text-muted">
          Total Questions: <span className="fw-bold text-dark">{currentQuestions.length}</span>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Current Questions */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3 overflow-hidden h-100">
            <div className="card-header bg-dark text-white py-3 px-4">
              <h5 className="fw-bold mb-0">Current Quiz Questions ({currentQuestions.length})</h5>
            </div>
            <div className="card-body p-3 bg-light" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {currentQuestions.length === 0 ? (
                <div className="text-center py-5 bg-white rounded border border-dashed">
                  <i className="bi bi-file-earmark-text text-muted fs-1"></i>
                  <p className="mt-3 mb-0 text-muted">No questions assigned to this quiz yet.</p>
                  <small className="text-muted d-block mt-1">Use the panel on the right to add some.</small>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {currentQuestions.map((q: any, idx: number) => {
                    const qItem = typeof q === 'string' ? null : q;
                    if (!qItem) return null;

                    return (
                      <div key={qItem._id} className="card shadow-xs border rounded-3 p-3 bg-white">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <span className="badge bg-secondary small mb-2">Q{idx + 1}</span>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-xs p-1"
                            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                            onClick={() => handleRemoveQuestion(qItem._id)}
                            title="Remove question from this quiz"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <div className="fw-semibold text-dark mb-2">{qItem.text}</div>
                        <div className="d-flex flex-column gap-1">
                          {qItem.options?.map((opt: string, oIdx: number) => (
                            <div
                              key={oIdx}
                              className={`p-2 rounded border small ${
                                oIdx === qItem.correctAnswerIndex
                                  ? 'bg-success-subtle border-success text-success fw-semibold'
                                  : 'bg-light border-light text-dark'
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Add Questions Panel */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
            <div className="card-header bg-primary text-white py-3 px-4">
              <h5 className="fw-bold mb-0">Add Questions Panel</h5>
            </div>
            {/* Tab Navigation */}
            <div className="bg-light border-bottom p-0">
              <ul className="nav nav-tabs border-0 px-4 pt-3">
                <li className="nav-item">
                  <button
                    className={`nav-link fw-bold px-3 py-2 border-0 rounded-top-3 ${
                      activeQuestionTab === 'new'
                        ? 'active bg-white text-primary border-bottom border-primary border-3'
                        : 'text-secondary'
                    }`}
                    onClick={() => setActiveQuestionTab('new')}
                    type="button"
                  >
                    <i className="bi bi-plus-square-fill me-1"></i> Create New
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link fw-bold px-3 py-2 border-0 rounded-top-3 ${
                      activeQuestionTab === 'exist'
                        ? 'active bg-white text-primary border-bottom border-primary border-3'
                        : 'text-secondary'
                    }`}
                    onClick={() => setActiveQuestionTab('exist')}
                    type="button"
                  >
                    <i className="bi bi-folder-symlink-fill me-1"></i> Link Existing
                  </button>
                </li>
              </ul>
            </div>

            {/* Tab Contents */}
            <div className="card-body p-4 bg-white">
              {activeQuestionTab === 'new' && (
                /* Tab 1: Create New */
                <form onSubmit={handleCreateNewQuestionSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted small">Question Text</label>
                    <input
                      type="text"
                      className="form-control py-2"
                      placeholder="e.g. What is the capital of Canada?"
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row mb-3">
                    <label className="form-label fw-semibold text-muted small">Options</label>
                    {qOptions.map((opt, idx) => (
                      <div key={idx} className="col-md-6 mb-2">
                        <div className="input-group">
                          <span className="input-group-text">
                            <input
                              type="radio"
                              name="correctAnswer"
                              className="form-check-input"
                              checked={qCorrectIndex === idx}
                              onChange={() => setQCorrectIndex(idx)}
                            />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            required={idx < 2}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="form-text text-muted">Select the radio button next to the correct answer.</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted small">Keywords (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control py-2"
                      placeholder="capital, geography, north america"
                      value={qKeywords}
                      onChange={(e) => setQKeywords(e.target.value)}
                    />
                  </div>

                  <div className="d-flex gap-2 justify-content-end pt-2 border-top">
                    <button type="button" onClick={resetQuestionForm} className="btn btn-outline-secondary">
                      Reset Form
                    </button>
                    <button type="submit" className="btn btn-success px-4">
                      Create & Add
                    </button>
                  </div>
                </form>
              )}

              {activeQuestionTab === 'exist' && (
                /* Tab 2: Link Existing */
                <div>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search questions by text or keywords..."
                      value={existQuestionSearch}
                      onChange={(e) => setExistQuestionSearch(e.target.value)}
                    />
                  </div>

                  {filteredAvailableQuestions.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-info-circle fs-2 text-muted"></i>
                      <p className="mt-3 text-muted mb-0">
                        {availableQuestions.length === 0
                          ? 'No new questions in database to add. All are already in this quiz!'
                          : 'No questions matched your search criteria.'}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleAddExistingSubmit}>
                      <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <div className="list-group">
                          {filteredAvailableQuestions.map((q) => {
                            const isChecked = selectedExistIds.includes(q._id);
                            return (
                              <label
                                key={q._id}
                                className="list-group-item d-flex gap-3 align-items-start py-3 cursor-pointer"
                              >
                                <input
                                  className="form-check-input flex-shrink-0 mt-1"
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      setSelectedExistIds([...selectedExistIds, q._id]);
                                    } else {
                                      setSelectedExistIds(selectedExistIds.filter((id) => id !== q._id));
                                    }
                                  }}
                                />
                                <div className="w-100">
                                  <div className="fw-semibold text-dark">{q.text}</div>
                                  <div className="d-flex flex-wrap gap-1 mt-1">
                                    {q.options.map((opt, idx) => (
                                      <span
                                        key={idx}
                                        className={`badge ${
                                          idx === q.correctAnswerIndex
                                            ? 'bg-success text-white'
                                            : 'bg-light text-dark border'
                                        } small`}
                                      >
                                        {opt}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="d-flex gap-2 justify-content-end pt-2 border-top">
                        <button
                          type="button"
                          onClick={() => setSelectedExistIds([])}
                          className="btn btn-outline-secondary"
                        >
                          Clear Selection
                        </button>
                        <button
                          type="submit"
                          className="btn btn-warning text-dark fw-bold px-4"
                          disabled={selectedExistIds.length === 0}
                        >
                          Link Selected ({selectedExistIds.length})
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ManageQuizQuestionsPage;
