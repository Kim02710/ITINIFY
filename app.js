require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 2910;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API Routes
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/user', require('./routes/users.js'));
app.use('/api/plans', require('./routes/plans.js'));
app.use('/api/weather', require('./routes/weather.js'));

// View Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/home', (req, res) => {
  res.render('home');
});

app.get('/profile', (req, res) => {
  res.render('profile');
});

app.get('/schedule', (req, res) => {
  res.render('schedule');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

// Static folders - Move this after the view routes
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});