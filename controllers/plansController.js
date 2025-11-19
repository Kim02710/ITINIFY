const db = require('../db.js');

const getPlans = (req, res) => {
  const stmt = db.prepare('SELECT * FROM plans WHERE user_id = ?');
  const plans = stmt.all(req.user.id);
  res.status(200).json(plans);
};

const createPlan = (req, res) => {
  const { date, notes, time, location } = req.body;

  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }

  const stmt = db.prepare(
    'INSERT INTO plans (user_id, date, notes, time, location) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(req.user.id, date, notes, time, location);

  res.status(201).json({ id: result.lastInsertRowid, date, notes, time, location });
};

const deletePlan = (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM plans WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: 'Plan not found or you do not have permission to delete it.' });
  }

  res.status(200).json({ message: 'Plan deleted successfully.' });
};

module.exports = { getPlans, createPlan, deletePlan };
