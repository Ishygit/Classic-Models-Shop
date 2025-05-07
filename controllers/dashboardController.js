const User = require('../models/user');
const Order = require('../models/order');
const Cart = require('../models/cart');
const { pool } = require('../config/database');

// Initialize models with database connection
const userModel = new User(pool);
const orderModel = new Order(pool);
const cartModel = new Cart(pool);

/**
 * Get dashboard data
 * @route GET /dashboard
 * @access Private
 */
const getDashboard = async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Get user profile
        const user = await userModel.findById(userId);
        if (!user) {
            req.session.messages = [{
                type: 'error',
                text: 'User not found'
            }];
            return res.redirect('/logout');
        }

        // Get recent orders (limit to 5)
        const ordersResult = await orderModel.findByUser(userId, {
            page: 1,
            limit: 5
        });

        // Convert string numbers to actual numbers for orders
        const orders = ordersResult.orders.map(order => ({
            ...order,
            total: Number(order.total),
            subtotal: Number(order.subtotal),
            tax: Number(order.tax),
            shipping: Number(order.shipping)
        }));

        // Get cart summary
        const cartSummary = await cartModel.getCartSummary(userId);
        const cartItems = await cartModel.getCartItems(userId);

        // Calculate some statistics
        const totalOrders = ordersResult.pagination.total;
        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        res.render('dashboard/index', {
            title: 'Dashboard',
            user,
            orders,
            cartSummary: {
                ...cartSummary,
                total: Number(cartSummary?.total || 0),
                subtotal: Number(cartSummary?.subtotal || 0),
                tax: Number(cartSummary?.tax || 0),
                shipping: Number(cartSummary?.shipping || 0)
            },
            cartItems,
            stats: {
                totalOrders,
                totalSpent,
                averageOrderValue,
                cartItemCount: cartItems?.length || 0
            },
            messages: req.session.messages || []
        });

        // Clear messages after displaying them
        req.session.messages = [];
    } catch (error) {
        console.error('Dashboard error:', error);
        req.session.messages = [{
            type: 'error',
            text: 'Error loading dashboard'
        }];
        res.redirect('/');
    }
};

module.exports = {
    getDashboard
}; 