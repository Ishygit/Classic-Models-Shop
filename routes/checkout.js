const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { validateCheckout } = require('../middleware/validator');
const checkoutController = require('../controllers/checkoutController');

// All checkout routes require authentication
router.use(isAuthenticated);

// Get checkout page
router.get('/', checkoutController.getCheckoutPage);

// Process checkout
router.post('/', validateCheckout, checkoutController.processCheckout);

// Get order confirmation
router.get('/confirmation/:orderId', checkoutController.getOrderConfirmation);

module.exports = router; 