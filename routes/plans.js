const express = require('express');
const router = express.Router();
const { getPlans, createPlan, deletePlan } = require('../controllers/plansController');
const auth = require('../middleware/auth');

router.get('/', auth, getPlans);
router.post('/', auth, createPlan);
router.delete('/:id', auth, deletePlan);

module.exports = router;
