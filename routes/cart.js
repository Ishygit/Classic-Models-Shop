const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Get cart contents
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/update/:itemId', cartController.updateQuantity);

// Remove item from cart
router.delete('/remove/:itemId', cartController.removeItem);

// Clear cart
router.delete('/clear', cartController.clearCart);

module.exports = router; 