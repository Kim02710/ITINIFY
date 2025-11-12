const db = require('../db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  const checkUserStmt = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?');
  const existingUser = checkUserStmt.get(username, email);

  if (existingUser) {
    return res.status(400).json({ message: 'Username or email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const insertUserStmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
  const result = insertUserStmt.run(username, email, hashedPassword);

  const token = jwt.sign({ id: result.lastInsertRowid }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  res.status(201).json({ token });
};

const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  const checkUserStmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = checkUserStmt.get(username);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  res.status(200).json({ token });
};

module.exports = { register, login };
