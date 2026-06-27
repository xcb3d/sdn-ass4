import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../features/questions/questionsSlice';

export const AdminQuestionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { list: questions, loading, error } = useAppSelector((state) => state.questions);
  const { user } = useAppSelector((state) => state.auth);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qKeywords, setQKeywords] = useState('');

  // Protect route
  useEffect(() => {
    if (!user?.admin) {
      navigate('/dashboard');
    } else {
      dispatch(fetchQuestions());
    }
  }, [user, navigate, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const filteredOptions = qOptions.map(o => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    const keywordsArray = qKeywords.split(',').map(k => k.trim()).filter(Boolean);

    const questionData = {
      text: qText,
      options: filteredOptions,
      keywords: keywordsArray,
      correctAnswerIndex: qCorrectIndex,
    };

    if (editingId) {
      dispatch(updateQuestion({ questionId: editingId, questionData }))
        .unwrap()
        .then(() => {
          alert('Question updated successfully!');
          resetForm();
          dispatch(fetchQuestions());
        })
        .catch((err) => alert('Failed to update question: ' + err));
    } else {
      dispatch(createQuestion(questionData))
        .unwrap()
        .then(() => {
          alert('Question created successfully!');
          resetForm();
          dispatch(fetchQuestions());
        })
        .catch((err) => alert('Failed to create question: ' + err));
    }
  };

  const handleEditClick = (q: any) => {
    setEditingId(q._id);
    setQText(q.text);
    // Pad options array to 4 items
    const opts = [...q.options];
    while (opts.length < 4) {
      opts.push('');
    }
    setQOptions(opts);
    setQCorrectIndex(q.correctAnswerIndex);
    setQKeywords(q.keywords?.join(', ') || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      dispatch(deleteQuestion(id))
        .unwrap()
        .then(() => {
          alert('Question deleted successfully!');
          dispatch(fetchQuestions());
        })
        .catch((err) => alert('Failed to delete question: ' + err));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrectIndex(0);
    setQKeywords('');
    setShowForm(false);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...qOptions];
    updated[index] = value;
    setQOptions(updated);
  };

  if (!user?.admin) return null;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h1 className="fw-bold text-dark mb-0">Manage Questions</h1>
          <p className="text-muted">Create, edit, and delete questions database.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary d-flex align-items-center gap-1 shadow-sm">
            <i className="bi bi-plus-circle"></i> Create Question
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* Slide-down Form */}
      {showForm && (
        <div className="card shadow-sm border-0 mb-4 rounded-3 p-4 bg-light">
          <h3 className="fw-bold mb-3">{editingId ? 'Edit Question' : 'Create New Question'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Question Text</label>
              <input
                type="text"
                className="form-control py-2"
                placeholder="e.g. What is the chemical symbol for Helium?"
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
                        name="correctAnswerIndex"
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
                placeholder="science, chemistry, element"
                value={qKeywords}
                onChange={(e) => setQKeywords(e.target.value)}
              />
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button type="button" onClick={resetForm} className="btn btn-outline-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Create Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions list */}
      {loading && questions.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading questions database...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-5 border rounded-3 bg-light">
          <i className="bi bi-folder2-open fs-1 text-muted"></i>
          <h3 className="fw-bold mt-3 text-dark">No Questions Found</h3>
          <p className="text-muted text-center max-w-md mx-auto">
            The question bank is empty. Get started by creating your first question.
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary mt-2">
            Create Question
          </button>
        </div>
      ) : (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th scope="col" style={{ width: '45%' }}>Question Text</th>
                  <th scope="col" style={{ width: '30%' }}>Options</th>
                  <th scope="col" style={{ width: '15%' }}>Keywords</th>
                  <th scope="col" style={{ width: '10%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id}>
                    <td>
                      <div className="fw-semibold text-dark">{q.text}</div>
                      <div className="text-muted small">
                        Author ID: <code className="text-secondary small">{q.author || 'system'}</code>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {q.options.map((opt, idx) => (
                          <span
                            key={idx}
                            className={`badge ${
                              idx === q.correctAnswerIndex
                                ? 'bg-success text-white'
                                : 'bg-light text-dark border'
                            } small`}
                          >
                            {idx === q.correctAnswerIndex && <i className="bi bi-check-lg me-1"></i>}
                            {opt}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {q.keywords?.map((k) => (
                          <span key={k} className="badge bg-secondary-subtle text-secondary-emphasis">
                            {k}
                          </span>
                        )) || <span className="text-muted small">None</span>}
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          onClick={() => handleEditClick(q)}
                          className="btn btn-sm btn-outline-primary"
                          title="Edit Question"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(q._id)}
                          className="btn btn-sm btn-outline-danger"
                          title="Delete Question"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
