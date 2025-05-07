const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(isAuthenticated);

router.get('/', getDashboard);

module.exports = router; 