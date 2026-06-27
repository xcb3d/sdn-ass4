import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  addQuestionToQuiz,
  deleteQuiz,
  fetchQuizById,
  updateQuiz,
} from '../features/quizzes/quizzesSlice';
import type { QuestionInfo } from '../features/quizzes/quizzesSlice';
import {
  deleteQuestion,
  fetchQuestions,
  updateQuestion,
} from '../features/questions/questionsSlice';

type QuestionDraft = {
  text: string;
  options: string[];
  keywords: string;
  correctAnswerIndex: number;
};

const emptyQuestionDraft = (): QuestionDraft => ({
  text: '',
  options: ['', '', '', ''],
  keywords: '',
  correctAnswerIndex: 0,
});

const isQuestionInfo = (question: QuestionInfo | string): question is QuestionInfo =>
  typeof question !== 'string';

const getQuestionId = (question: QuestionInfo | string) =>
  typeof question === 'string' ? question : question._id;

const toQuestionDraft = (question: QuestionInfo): QuestionDraft => ({
  text: question.text,
  options: question.options.length >= 2 ? [...question.options] : [...question.options, '', ''].slice(0, 2),
  keywords: question.keywords?.join(', ') || '',
  correctAnswerIndex: question.correctAnswerIndex,
});

const normalizeQuestionDraft = (draft: QuestionDraft) => {
  const options = draft.options.map((option) => option.trim()).filter(Boolean);
  if (!draft.text.trim()) {
    throw new Error('Question text is required');
  }
  if (options.length < 2) {
    throw new Error('Please provide at least 2 options');
  }
  if (draft.correctAnswerIndex >= options.length) {
    throw new Error('Correct answer must point to a filled option');
  }

  return {
    text: draft.text.trim(),
    options,
    keywords: draft.keywords
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    correctAnswerIndex: draft.correctAnswerIndex,
  };
};

export const EditQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentQuiz, loading, error } = useAppSelector((state) => state.quizzes);
  const { list: questions, loading: questionsLoading } = useAppSelector((state) => state.questions);

  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft>(emptyQuestionDraft);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [selectedExistingIds, setSelectedExistingIds] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const currentQuestionIds = useMemo(
    () => currentQuiz?.questions?.map(getQuestionId) || [],
    [currentQuiz]
  );

  const populatedQuestions = useMemo(
    () => currentQuiz?.questions?.filter(isQuestionInfo) || [],
    [currentQuiz]
  );

  const availableQuestions = useMemo(() => {
    const search = questionSearch.trim().toLowerCase();
    return questions
      .filter((question) => !currentQuestionIds.includes(question._id))
      .filter((question) => {
        if (!search) return true;
        return (
          question.text.toLowerCase().includes(search) ||
          question.keywords?.some((keyword) => keyword.toLowerCase().includes(search))
        );
      });
  }, [currentQuestionIds, questionSearch, questions]);

  useEffect(() => {
    if (quizId) {
      dispatch(fetchQuizById(quizId));
      dispatch(fetchQuestions());
    }
  }, [dispatch, quizId]);

  useEffect(() => {
    if (currentQuiz && currentQuiz._id === quizId) {
      setQuizTitle(currentQuiz.title);
      setQuizDescription(currentQuiz.description);
    }
  }, [currentQuiz, quizId]);

  const refreshQuiz = async () => {
    if (!quizId) return;
    await dispatch(fetchQuizById(quizId)).unwrap();
    await dispatch(fetchQuestions()).unwrap();
  };

  const saveQuizDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quizId || !currentQuiz) return;

    setSavingQuiz(true);
    try {
      await dispatch(
        updateQuiz({
          quizId,
          quizData: {
            title: quizTitle.trim(),
            description: quizDescription.trim(),
            questions: currentQuestionIds,
          },
        })
      ).unwrap();
      await refreshQuiz();
      alert('Quiz updated successfully!');
    } catch (err: any) {
      alert('Failed to update quiz: ' + err);
    } finally {
      setSavingQuiz(false);
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionDraft(emptyQuestionDraft());
  };

  const setQuestionOption = (index: number, value: string) => {
    setQuestionDraft((draft) => {
      const options = [...draft.options];
      options[index] = value;
      return { ...draft, options };
    });
  };

  const addOption = () => {
    setQuestionDraft((draft) => ({
      ...draft,
      options: [...draft.options, ''],
    }));
  };

  const removeOption = (index: number) => {
    setQuestionDraft((draft) => {
      if (draft.options.length <= 2) return draft;
      const options = draft.options.filter((_, optionIndex) => optionIndex !== index);
      const correctAnswerIndex = Math.min(draft.correctAnswerIndex, options.length - 1);
      return { ...draft, options, correctAnswerIndex };
    });
  };

  const saveQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quizId) return;

    setSavingQuestion(true);
    try {
      const questionData = normalizeQuestionDraft(questionDraft);
      const wasEditing = Boolean(editingQuestionId);
      if (editingQuestionId) {
        await dispatch(updateQuestion({ questionId: editingQuestionId, questionData })).unwrap();
      } else {
        await dispatch(addQuestionToQuiz({ quizId, questionData })).unwrap();
      }
      resetQuestionForm();
      await refreshQuiz();
      alert(wasEditing ? 'Question updated successfully!' : 'Question added successfully!');
    } catch (err: any) {
      alert('Failed to save question: ' + err);
    } finally {
      setSavingQuestion(false);
    }
  };

  const editQuestion = (question: QuestionInfo) => {
    setEditingQuestionId(question._id);
    setQuestionDraft(toQuestionDraft(question));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateQuizQuestionIds = async (questionIds: string[]) => {
    if (!quizId || !currentQuiz) return;
    await dispatch(
      updateQuiz({
        quizId,
        quizData: {
          title: currentQuiz.title,
          description: currentQuiz.description,
          questions: questionIds,
        },
      })
    ).unwrap();
    await refreshQuiz();
  };

  const linkExistingQuestions = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedExistingIds.length === 0) return;

    try {
      await updateQuizQuestionIds([...currentQuestionIds, ...selectedExistingIds]);
      setSelectedExistingIds([]);
      setQuestionSearch('');
      alert('Questions linked successfully!');
    } catch (err: any) {
      alert('Failed to link questions: ' + err);
    }
  };

  const removeQuestionFromQuiz = async (questionId: string) => {
    if (!window.confirm('Remove this question from this quiz?')) return;

    try {
      await updateQuizQuestionIds(currentQuestionIds.filter((id) => id !== questionId));
      if (editingQuestionId === questionId) {
        resetQuestionForm();
      }
    } catch (err: any) {
      alert('Failed to remove question: ' + err);
    }
  };

  const deleteQuestionFromBank = async (questionId: string) => {
    if (!window.confirm('Delete this question from question bank? This may affect other quizzes.')) return;

    try {
      await updateQuizQuestionIds(currentQuestionIds.filter((id) => id !== questionId));
      await dispatch(deleteQuestion(questionId)).unwrap();
      if (editingQuestionId === questionId) {
        resetQuestionForm();
      }
      await refreshQuiz();
      alert('Question deleted successfully!');
    } catch (err: any) {
      alert('Failed to delete question: ' + err);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizId || !window.confirm('Delete this quiz and its questions?')) return;

    try {
      await dispatch(deleteQuiz(quizId)).unwrap();
      navigate('/dashboard');
    } catch (err: any) {
      alert('Failed to delete quiz: ' + err);
    }
  };

  if (loading && !currentQuiz) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading quiz...</p>
      </div>
    );
  }

  if (!quizId || !currentQuiz || currentQuiz._id !== quizId) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
        <span>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Quiz not found.
        </span>
        <button onClick={() => navigate('/dashboard')} className="btn btn-outline-danger btn-sm">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-4 pb-3 border-bottom">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline-secondary btn-sm mb-2 d-inline-flex align-items-center gap-1"
          >
            <i className="bi bi-arrow-left"></i> Back to Dashboard
          </button>
          <h1 className="fw-bold text-dark mb-1">Edit Quiz</h1>
          <p className="text-muted mb-0">Update quiz details and manage every question in this quiz.</p>
        </div>
        <button onClick={handleDeleteQuiz} className="btn btn-outline-danger d-inline-flex align-items-center gap-1">
          <i className="bi bi-trash"></i> Delete Quiz
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0 fw-bold">Quiz Details</h5>
            </div>
            <div className="card-body">
              <form onSubmit={saveQuizDetails}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Title</label>
                  <input
                    className="form-control"
                    value={quizTitle}
                    onChange={(event) => setQuizTitle(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={quizDescription}
                    onChange={(event) => setQuizDescription(event.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary w-100" disabled={savingQuiz}>
                  <i className="bi bi-save me-1"></i>
                  {savingQuiz ? 'Saving...' : 'Save Quiz'}
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0 fw-bold">{editingQuestionId ? 'Edit Question' : 'Add New Question'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={saveQuestion}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Question Text</label>
                  <input
                    className="form-control"
                    value={questionDraft.text}
                    onChange={(event) => setQuestionDraft((draft) => ({ ...draft, text: event.target.value }))}
                    required
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-semibold text-muted small mb-0">Options</label>
                    <button type="button" onClick={addOption} className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {questionDraft.options.map((option, index) => (
                      <div key={index} className="input-group">
                        <span className="input-group-text">
                          <input
                            type="radio"
                            name="correctAnswerIndex"
                            className="form-check-input"
                            checked={questionDraft.correctAnswerIndex === index}
                            onChange={() =>
                              setQuestionDraft((draft) => ({ ...draft, correctAnswerIndex: index }))
                            }
                          />
                        </span>
                        <input
                          className="form-control"
                          value={option}
                          onChange={(event) => setQuestionOption(index, event.target.value)}
                          placeholder={`Option ${index + 1}`}
                          required={index < 2}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeOption(index)}
                          disabled={questionDraft.options.length <= 2}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Keywords</label>
                  <input
                    className="form-control"
                    value={questionDraft.keywords}
                    onChange={(event) => setQuestionDraft((draft) => ({ ...draft, keywords: event.target.value }))}
                    placeholder="capital, geography, asia"
                  />
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  {editingQuestionId && (
                    <button type="button" onClick={resetQuestionForm} className="btn btn-outline-secondary">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn btn-success" disabled={savingQuestion}>
                    <i className="bi bi-check-lg me-1"></i>
                    {savingQuestion ? 'Saving...' : editingQuestionId ? 'Save Question' : 'Create & Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Quiz Questions</h5>
              <span className="badge bg-secondary">{currentQuestionIds.length}</span>
            </div>
            <div className="card-body bg-light">
              {populatedQuestions.length === 0 ? (
                <div className="text-center py-5 bg-white rounded border">
                  <i className="bi bi-journal-x fs-1 text-muted"></i>
                  <p className="mt-3 mb-0 text-muted">No questions in this quiz.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {populatedQuestions.map((question, index) => (
                    <div key={question._id} className="card border-0 shadow-sm rounded-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start gap-3">
                          <div>
                            <span className="badge bg-dark mb-2">Q{index + 1}</span>
                            <h6 className="fw-bold mb-2">{question.text}</h6>
                          </div>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => editQuestion(question)}
                              title="Edit question"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => removeQuestionFromQuiz(question._id)}
                              title="Remove from quiz"
                            >
                              <i className="bi bi-link-45deg"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => deleteQuestionFromBank(question._id)}
                              title="Delete from bank"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {question.options.map((option, optionIndex) => (
                            <span
                              key={optionIndex}
                              className={`badge ${
                                optionIndex === question.correctAnswerIndex
                                  ? 'bg-success text-white'
                                  : 'bg-white text-dark border'
                              }`}
                            >
                              {optionIndex === question.correctAnswerIndex && <i className="bi bi-check-lg me-1"></i>}
                              {option}
                            </span>
                          ))}
                        </div>
                        {question.keywords?.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mt-3">
                            {question.keywords.map((keyword) => (
                              <span key={keyword} className="badge bg-secondary-subtle text-secondary-emphasis">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white">
              <h5 className="mb-0 fw-bold">Link Existing Questions</h5>
            </div>
            <div className="card-body">
              <form onSubmit={linkExistingQuestions}>
                <input
                  className="form-control mb-3"
                  value={questionSearch}
                  onChange={(event) => setQuestionSearch(event.target.value)}
                  placeholder="Search question bank..."
                />
                <div className="border rounded bg-light p-2 mb-3" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {questionsLoading ? (
                    <div className="text-center py-4 text-muted">Loading questions...</div>
                  ) : availableQuestions.length === 0 ? (
                    <div className="text-center py-4 text-muted">No available questions.</div>
                  ) : (
                    availableQuestions.map((question) => (
                      <label key={question._id} className="d-flex gap-3 align-items-start bg-white rounded border p-3 mb-2">
                        <input
                          className="form-check-input mt-1"
                          type="checkbox"
                          checked={selectedExistingIds.includes(question._id)}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setSelectedExistingIds((ids) => [...ids, question._id]);
                            } else {
                              setSelectedExistingIds((ids) => ids.filter((id) => id !== question._id));
                            }
                          }}
                        />
                        <span>
                          <span className="fw-semibold d-block">{question.text}</span>
                          <span className="text-muted small">{question.options.length} options</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedExistingIds([])}
                    className="btn btn-outline-secondary"
                    disabled={selectedExistingIds.length === 0}
                  >
                    Clear
                  </button>
                  <button className="btn btn-warning" disabled={selectedExistingIds.length === 0}>
                    Link Selected ({selectedExistingIds.length})
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuizPage;
