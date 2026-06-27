const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');

const apiUrl = process.env.API_URL || 'https://localhost:3443';
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

// GET all questions
router.get('/', async (req, res, next) => {
  try {
    const response = await axiosInstance.get(`${apiUrl}/question`);
    res.renderPage('questions/list', { title: 'Danh sách Câu hỏi', questions: response.data });
  } catch (err) {
    next(err);
  }
});

// GET create page
router.get('/create', (req, res) => {
  res.renderPage('questions/create', { title: 'Tạo Câu hỏi mới' });
});

// POST create question
router.post('/', async (req, res, next) => {
  try {
    const { text, options, keywords, correctAnswerIndex } = req.body;
    const optionsArray = Array.isArray(options) ? options : [options];
    const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
    
    await axiosInstance.post(`${apiUrl}/question`, {
      text,
      options: optionsArray,
      keywords: keywordsArray,
      correctAnswerIndex: parseInt(correctAnswerIndex, 10)
    });
    res.redirect('/questions');
  } catch (err) {
    next(err);
  }
});

// GET details page
router.get('/:id', async (req, res, next) => {
  try {
    const response = await axiosInstance.get(`${apiUrl}/question/${req.params.id}`);
    res.renderPage('questions/details', { title: 'Chi tiết Câu hỏi', question: response.data });
  } catch (err) {
    next(err);
  }
});

// GET edit page
router.get('/:id/edit', async (req, res, next) => {
  try {
    const response = await axiosInstance.get(`${apiUrl}/question/${req.params.id}`);
    res.renderPage('questions/edit', { title: 'Chỉnh sửa Câu hỏi', question: response.data });
  } catch (err) {
    next(err);
  }
});

// PUT update question
router.put('/:id', async (req, res, next) => {
  try {
    const { text, options, keywords, correctAnswerIndex } = req.body;
    const optionsArray = Array.isArray(options) ? options : [options];
    const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
    
    await axiosInstance.put(`${apiUrl}/question/${req.params.id}`, {
      text,
      options: optionsArray,
      keywords: keywordsArray,
      correctAnswerIndex: parseInt(correctAnswerIndex, 10)
    });
    res.redirect('/questions');
  } catch (err) {
    next(err);
  }
});

// DELETE question
router.delete('/:id', async (req, res, next) => {
  try {
    await axiosInstance.delete(`${apiUrl}/question/${req.params.id}`);
    res.redirect('/questions');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
