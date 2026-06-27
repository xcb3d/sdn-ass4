import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  createQuiz,
  deleteQuiz,
  fetchQuizzes,
  populateQuiz,
} from '../features/quizzes/quizzesSlice';

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { list: quizzes, loading, error } = useAppSelector((state) => state.quizzes);
  const { user } = useAppSelector((state) => state.auth);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');

  useEffect(() => {
    dispatch(fetchQuizzes());
  }, [dispatch]);

  const totalQuestions = useMemo(
    () => quizzes.reduce((sum, quiz) => sum + (quiz.questions?.length || 0), 0),
    [quizzes]
  );

  const resetCreateForm = () => {
    setQuizTitle('');
    setQuizDescription('');
    setShowCreateForm(false);
  };

  const handleCreateQuiz = (event: React.FormEvent) => {
    event.preventDefault();
    if (!quizTitle.trim() || !quizDescription.trim()) return;

    dispatch(
      createQuiz({
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        questions: [],
      })
    )
      .unwrap()
      .then(() => {
        resetCreateForm();
        dispatch(fetchQuizzes());
      })
      .catch((err) => alert('Failed to create quiz: ' + err));
  };

  const handleDeleteQuiz = (id: string) => {
    if (window.confirm('Delete this quiz and its questions?')) {
      dispatch(deleteQuiz(id))
        .unwrap()
        .then(() => dispatch(fetchQuizzes()))
        .catch((err) => alert('Failed to delete quiz: ' + err));
    }
  };

  const handlePopulateCapital = (id: string) => {
    dispatch(populateQuiz(id))
      .unwrap()
      .then(() => {
        alert('Successfully populated quiz with "capital" keyword questions!');
        dispatch(fetchQuizzes());
      })
      .catch((err) => alert('Failed to populate: ' + err));
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-4 pb-3 border-bottom">
        <div>
          <h1 className="fw-bold text-dark mb-1">Dashboard</h1>
          <p className="text-muted mb-0">Start a quiz or manage quiz content from one place.</p>
        </div>
        {user?.admin && (
          <button
            onClick={() => setShowCreateForm((visible) => !visible)}
            className="btn btn-primary d-flex align-items-center gap-1 shadow-sm"
          >
            <i className={`bi ${showCreateForm ? 'bi-x-circle' : 'bi-plus-circle'}`}></i>
            {showCreateForm ? 'Close' : 'Create Quiz'}
          </button>
        )}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body">
              <div className="text-muted small">Quizzes</div>
              <div className="fs-3 fw-bold text-dark">{quizzes.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body">
              <div className="text-muted small">Questions</div>
              <div className="fs-3 fw-bold text-dark">{totalQuestions}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body">
              <div className="text-muted small">Role</div>
              <div className="fs-3 fw-bold text-dark">{user?.admin ? 'Admin' : 'User'}</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {user?.admin && showCreateForm && (
        <div className="card shadow-sm border-0 mb-4 rounded-3">
          <div className="card-header bg-white">
            <h5 className="fw-bold mb-0">Create Quiz</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateQuiz}>
              <div className="row g-3">
                <div className="col-lg-4">
                  <label className="form-label fw-semibold text-muted small">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={quizTitle}
                    onChange={(event) => setQuizTitle(event.target.value)}
                    required
                  />
                </div>
                <div className="col-lg-6">
                  <label className="form-label fw-semibold text-muted small">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={quizDescription}
                    onChange={(event) => setQuizDescription(event.target.value)}
                    required
                  />
                </div>
                <div className="col-lg-2 d-flex align-items-end gap-2">
                  <button type="button" onClick={resetCreateForm} className="btn btn-outline-secondary flex-fill">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-fill">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && quizzes.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Fetching quizzes...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-5 border rounded-3 bg-light">
          <i className="bi bi-journal-x fs-1 text-muted"></i>
          <h3 className="fw-bold mt-3 text-dark">No Quizzes Available</h3>
          <p className="text-muted">Create a quiz first.</p>
          {user?.admin && (
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary mt-2">
              Create First Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {quizzes.map((quiz) => {
            const questionCount = quiz.questions?.length || 0;
            return (
              <div key={quiz._id} className="col-md-6 col-xl-4">
                <div className="card h-100 shadow-sm border-0 rounded-3 hover-shadow transition">
                  <div className="card-body d-flex flex-column p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                        <i className="bi bi-list-task text-primary"></i>
                        {questionCount} Question{questionCount !== 1 ? 's' : ''}
                      </span>
                      {user?.admin && (
                        <button
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="btn btn-outline-danger btn-sm"
                          title="Delete Quiz"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                    <h4 className="card-title fw-bold text-dark mb-2">{quiz.title}</h4>
                    <p className="card-text text-muted flex-grow-1 small">{quiz.description}</p>

                    <div className="mt-3 pt-3 border-top d-flex flex-column gap-2">
                      <button
                        onClick={() => navigate(`/quiz/${quiz._id}`)}
                        className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                        disabled={questionCount === 0}
                      >
                        <i className="bi bi-play-fill fs-5"></i> Start Quiz
                      </button>

                      {user?.admin && (
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/quiz/${quiz._id}/edit`)}
                            className="btn btn-outline-secondary btn-sm flex-fill"
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </button>
                          <button
                            onClick={() => handlePopulateCapital(quiz._id)}
                            className="btn btn-outline-info btn-sm flex-fill"
                            title="Populate with questions containing keyword capital"
                          >
                            <i className="bi bi-shuffle"></i> Auto Pop
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
