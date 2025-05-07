const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');

// Import account controller
const {
    getDashboard,
    getProfile,
    updateProfile,
    getOrderHistory,
    changePassword,
    deleteAccount,
    getOrderDetails,
    getInvoice,
    getOrderTracking
} = require('../controllers/accountController');

// Account routes (all require authentication)
router.use(isAuthenticated);

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', validate(schemas.updateProfile), updateProfile);
router.get('/orders', getOrderHistory);
router.get('/orders/:id', getOrderDetails);
router.get('/orders/:orderId/invoice', getInvoice);
router.get('/orders/:orderId/tracking', getOrderTracking);
router.put('/password', validate(schemas.changePassword), changePassword);
router.delete('/delete', deleteAccount);

module.exports = router; 