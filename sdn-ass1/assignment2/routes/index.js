const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.renderPage('index', { title: 'Trang chủ' });
});

module.exports = router;
