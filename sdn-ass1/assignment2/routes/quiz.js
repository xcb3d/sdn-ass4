const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');

const apiUrl = process.env.API_URL || 'https://localhost:3443';
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

// GET all quizzes
router.get('/', async (req, res, next) => {
  try {
    const response = await axiosInstance.get(`${apiUrl}/quizzes`);
    res.renderPage('quiz/list', { title: 'Danh sách bộ đề Quiz', quizzes: response.data });
  } catch (err) {
    next(err);
  }
});

// GET create page
router.get('/create', async (req, res, next) => {
  try {
    const questionsResponse = await axiosInstance.get(`${apiUrl}/question`);
    res.renderPage('quiz/create', { title: 'Tạo Quiz Mới', questions: questionsResponse.data });
  } catch (err) {
    next(err);
  }
});

// POST create quiz
router.post('/', async (req, res, next) => {
  try {
    const { title, description, questions } = req.body;
    const questionsArray = Array.isArray(questions) ? questions : (questions ? [questions] : []);
    await axiosInstance.post(`${apiUrl}/quizzes`, { title, description, questions: questionsArray });
    res.redirect('/quizzes');
  } catch (err) {
    next(err);
  }
});

// GET details page
router.get('/:id', async (req, res, next) => {
  try {
    const quizResponse = await axiosInstance.get(`${apiUrl}/quizzes/${req.params.id}`);
    const questionsResponse = await axiosInstance.get(`${apiUrl}/question`);
    res.renderPage('quiz/details', { 
      title: 'Chi tiết Quiz', 
      quiz: quizResponse.data, 
      allQuestions: questionsResponse.data 
    });
  } catch (err) {
    next(err);
  }
});

// GET edit page
router.get('/:id/edit', async (req, res, next) => {
  try {
    const quizResponse = await axiosInstance.get(`${apiUrl}/quizzes/${req.params.id}`);
    const questionsResponse = await axiosInstance.get(`${apiUrl}/question`);
    
    // Map current quiz questions to array of IDs for check state
    const currentQuestionIds = quizResponse.data.questions.map(q => q._id);
    
    res.renderPage('quiz/edit', { 
      title: 'Chỉnh sửa Quiz', 
      quiz: quizResponse.data, 
      questions: questionsResponse.data,
      currentQuestionIds: currentQuestionIds
    });
  } catch (err) {
    next(err);
  }
});

// PUT update quiz
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, questions } = req.body;
    const questionsArray = Array.isArray(questions) ? questions : (questions ? [questions] : []);
    await axiosInstance.put(`${apiUrl}/quizzes/${req.params.id}`, { title, description, questions: questionsArray });
    res.redirect(`/quizzes/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

// DELETE quiz
router.delete('/:id', async (req, res, next) => {
  try {
    await axiosInstance.delete(`${apiUrl}/quizzes/${req.params.id}`);
    res.redirect('/quizzes');
  } catch (err) {
    next(err);
  }
});

// GET populate questions
router.get('/:id/populate', async (req, res, next) => {
  try {
    await axiosInstance.get(`${apiUrl}/quizzes/${req.params.id}/populate`);
    res.redirect(`/quizzes/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

// POST add single question directly to quiz
router.post('/:id/question', async (req, res, next) => {
  try {
    const { text, options, keywords, correctAnswerIndex } = req.body;
    
    // options are dynamic fields, text and options array
    const optionsArray = Array.isArray(options) ? options : [options];
    const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
    
    await axiosInstance.post(`${apiUrl}/quizzes/${req.params.id}/question`, {
      text,
      options: optionsArray,
      keywords: keywordsArray,
      correctAnswerIndex: parseInt(correctAnswerIndex, 10)
    });
    res.redirect(`/quizzes/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

// POST add existing questions to quiz
router.post('/:id/add-questions', async (req, res, next) => {
  try {
    const { questions } = req.body;
    const questionsToAdd = Array.isArray(questions) ? questions : (questions ? [questions] : []);
    
    const quizResponse = await axiosInstance.get(`${apiUrl}/quizzes/${req.params.id}`);
    const currentIds = quizResponse.data.questions.map(q => q._id);
    const merged = Array.from(new Set([...currentIds, ...questionsToAdd]));
    
    await axiosInstance.put(`${apiUrl}/quizzes/${req.params.id}`, {
      title: quizResponse.data.title,
      description: quizResponse.data.description,
      questions: merged
    });
    res.redirect(`/quizzes/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
