const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Update order details
router.put('/:orderId', orderController.updateOrder);

// Cancel order
router.post('/:orderId/cancel', orderController.cancelOrder);

// Update delivery status
router.post('/:orderId/tracking', orderController.updateDeliveryStatus);

// Get order tracking history
router.get('/:orderId/tracking', orderController.getOrderTracking);

module.exports = router; 