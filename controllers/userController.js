const db = require('../db.js');
const bcrypt = require('bcryptjs');

const getProfile = (req, res) => {
  const stmt = db.prepare('SELECT id, username, email, profile_image FROM users WHERE id = ?');
  const user = stmt.get(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.status(200).json(user);
};

const updateProfile = (req, res) => {
  const { username, email, password } = req.body;
  const profileImage = req.file ? req.file.filename : null;

  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  let newPassword = user.password;
  if (password) {
    const salt = bcrypt.genSaltSync(10);
    newPassword = bcrypt.hashSync(password, salt);
  }

  const updateStmt = db.prepare(
    'UPDATE users SET username = ?, email = ?, password = ?, profile_image = ? WHERE id = ?'
  );

  const newUsername = username || user.username;
  const newEmail = email || user.email;
  const newProfileImage = profileImage || user.profile_image;

  updateStmt.run(newUsername, newEmail, newPassword, newProfileImage, req.user.id);

  res.status(200).json({ message: 'Profile updated successfully.' });
};

module.exports = { getProfile, updateProfile };
