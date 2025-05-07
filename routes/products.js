const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validator');
const { isAuthenticated } = require('../middleware/auth');

// Import controllers (we'll create these next)
const {
    getAllProducts,
    getProductById,
    searchProducts,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// Public routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

// Protected routes (admin only)
router.post('/', isAuthenticated, validate(schemas.product), createProduct);
router.put('/:id', isAuthenticated, validate(schemas.product), updateProduct);
router.delete('/:id', isAuthenticated, deleteProduct);

module.exports = router; 