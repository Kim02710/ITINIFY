const db = require('../db.js');

const getPlans = (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM plans WHERE user_id = ?');
    const plans = stmt.all(req.user.id);
    res.status(200).json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error, { userId: req.user && req.user.id });
    res.status(500).json({ message: error && error.message ? error.message : 'Failed to load plans.' });
  }
};

const createPlan = (req, res) => {
  const { date, notes, time, location } = req.body;

  // Ensure the request is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }

  if (!notes || !String(notes).trim()) {
    return res.status(400).json({ message: 'Notes are required.' });
  }

  // Normalize optional fields to NULL when empty
  const timeVal = time && String(time).trim() ? time : null;
  const locationVal = location && String(location).trim() ? location : null;

  try {
    // Log incoming request for debugging (dev only)
    console.log('Create plan request:', { userId: req.user.id, body: req.body });

    const stmt = db.prepare(
      'INSERT INTO plans (user_id, date, notes, time, location) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(req.user.id, date, notes, timeVal, locationVal);

    // better-sqlite3 returns { changes, lastInsertRowid }
    // but be tolerant and also check for lastID (sqlite3)
    const insertedId = (result && (result.lastInsertRowid || result.lastID)) || null;

    console.log('Plan inserted, id=', insertedId);

    res.status(201).json({ id: insertedId, date, notes, time: timeVal, location: locationVal });
  } catch (error) {
    console.error('Error creating plan:', error, { body: req.body, userId: req.user && req.user.id });
    // Return the error message to help debugging in development
    res.status(500).json({ message: error && error.message ? error.message : 'Failed to create plan.' });
  }
};

const deletePlan = (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM plans WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Plan not found or you do not have permission to delete it.' });
    }

    res.status(200).json({ message: 'Plan deleted successfully.' });
  } catch (error) {
    console.error('Error deleting plan:', error, { params: req.params, userId: req.user && req.user.id });
    res.status(500).json({ message: error && error.message ? error.message : 'Failed to delete plan.' });
  }
};

module.exports = { getPlans, createPlan, deletePlan };
