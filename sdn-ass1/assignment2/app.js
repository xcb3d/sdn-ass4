require('dotenv').config();
const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure Handlebars as main engine
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register EJS engine
app.engine('ejs', require('ejs').renderFile);

// Middleware to render EJS page wrapped in HBS layout using wrapper.hbs
app.use((req, res, next) => {
  res.renderPage = (view, locals = {}) => {
    const viewPath = view.endsWith('.ejs') ? view : `${view}.ejs`;
    // Render the specific page using EJS
    res.render(viewPath, { ...locals, layout: false }, (err, html) => {
      if (err) {
        console.error('EJS Render Error:', err);
        return next(err);
      }
      // Render hbs wrapper which wraps the html in the main.hbs layout
      res.render('wrapper', {
        ...locals,
        body: html
      });
    });
  };
  next();
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const indexRoutes = require('./routes/index');
const quizRoutes = require('./routes/quiz');
const questionRoutes = require('./routes/question');

app.use('/', indexRoutes);
app.use('/quizzes', quizRoutes);
app.use('/questions', questionRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error: ' + err.message);
});

// Start Server
app.listen(PORT, () => {
  console.log(`UI Server running on http://localhost:${PORT}`);
});
