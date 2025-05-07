const User = require('../models/user');
const Order = require('../models/order');
const Cart = require('../models/cart');
const { pool } = require('../config/database');
const OrderTracking = require('../models/orderTracking');

// Initialize models
const userModel = new User(pool);
const orderModel = new Order(pool);
const cartModel = new Cart(pool);
const orderTrackingModel = new OrderTracking();

/**
 * Get dashboard data
 * @route GET /account/dashboard
 * @access Private
 */
const getDashboard = async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Get user profile
        const user = await userModel.findById(userId);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/logout');
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
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/');
    }
};

/**
 * Get user profile
 * @route GET /api/account/profile
 * @access Private
 */
const getProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.session.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove sensitive information
        delete user.password;
        res.json(user);
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ message: 'Error getting profile' });
    }
};

/**
 * Update user profile
 * @route PUT /api/account/profile
 * @access Private
 */
const updateProfile = async (req, res) => {
    try {
        const user = await userModel.updateProfile(req.session.user.id, req.body);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove sensitive information
        delete user.password;
        res.json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

/**
 * Get user's order history
 * @route GET /api/account/orders
 * @access Private
 */
const getOrderHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await orderModel.findByUser(req.session.user.id, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        // Convert string numbers to actual numbers
        result.orders = result.orders.map(order => ({
            ...order,
            total: Number(order.total),
            subtotal: Number(order.subtotal),
            tax: Number(order.tax),
            shipping: Number(order.shipping),
            items: order.items.map(item => ({
                ...item,
                price: Number(item.price),
                quantity: Number(item.quantity)
            }))
        }));

        res.render('account/orders', {
            title: 'Order History',
            orders: result.orders,
            currentPage: result.pagination.page,
            totalPages: result.pagination.pages,
            messages: req.session.messages || []
        });

        // Clear messages after displaying them
        req.session.messages = [];
    } catch (error) {
        console.error('Error getting order history:', error);
        req.session.messages = [{
            type: 'error',
            text: 'Error loading order history'
        }];
        res.redirect('/account/dashboard');
    }
};

/**
 * Get order invoice
 * @route GET /account/orders/:orderId/invoice
 * @access Private
 */
const getInvoice = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const orderId = req.params.orderId;

        // Get order details
        const order = await orderModel.findById(orderId);

        // Verify order belongs to user
        if (!order || order.user_id !== userId) {
            req.flash('error', 'Order not found');
            return res.redirect('/account/orders');
        }

        // Process the order data for the invoice
        const processedOrder = {
            orderId: order.id,
            orderDate: order.created_at,
            status: order.status,
            items: order.items.map(item => ({
                productName: item.name,
                scale: item.scale,
                quantity: item.quantity,
                price: item.price
            })),
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            total: order.total,
            shippingAddress: order.shipping_address
        };

        res.render('account/invoice', {
            title: `Invoice #${order.id}`,
            order: processedOrder
        });
    } catch (error) {
        console.error('Error getting invoice:', error);
        req.flash('error', 'Error loading invoice');
        res.redirect('/account/orders');
    }
};

/**
 * Get order tracking
 * @route GET /account/orders/:orderId/tracking
 * @access Private
 */
const getOrderTracking = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const orderId = req.params.orderId;

        // Get order details
        const order = await orderModel.findById(orderId);

        // Verify order belongs to user
        if (!order || order.user_id !== userId) {
            req.flash('error', 'Order not found');
            return res.redirect('/account/orders');
        }

        // Get tracking history
        const tracking = await orderTrackingModel.getTrackingHistory(orderId);

        res.render('account/tracking', {
            title: `Tracking Order #${orderId}`,
            order,
            tracking
        });
    } catch (error) {
        console.error('Error getting tracking:', error);
        req.flash('error', 'Error loading tracking information');
        res.redirect('/account/orders');
    }
};

/**
 * Change user's password
 * @route PUT /api/account/password
 * @access Private
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, password } = req.body;
        const userId = req.session.user.id;

        // Verify current password
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isValidPassword = await userModel.verifyPassword(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password
        await userModel.updateProfile(userId, { password });
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Error changing password' });
    }
};

/**
 * Delete user account
 * @route DELETE /api/account/delete
 * @access Private
 */
const deleteAccount = async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Delete user
        const success = await userModel.delete(userId);
        if (!success) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Destroy session
        req.session.destroy();

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Error deleting account' });
    }
};

/**
 * Get order details
 * @route GET /account/orders/:id
 * @access Private
 */
const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.session.user.id;

        const orderDetails = await orderModel.findById(orderId);
        
        if (!orderDetails || orderDetails.user_id !== userId) {
            req.session.messages = [{
                type: 'error',
                text: 'Order not found'
            }];
            return res.redirect('/account/orders');
        }

        res.render('account/order-details', {
            title: `Order #${orderId}`,
            order: orderDetails,
            messages: req.session.messages || []
        });

        // Clear messages after displaying them
        req.session.messages = [];
    } catch (error) {
        console.error('Error getting order details:', error);
        req.session.messages = [{
            type: 'error',
            text: 'Error loading order details'
        }];
        res.redirect('/account/orders');
    }
};

module.exports = {
    getDashboard,
    getProfile,
    updateProfile,
    getOrderHistory,
    getInvoice,
    getOrderTracking,
    changePassword,
    deleteAccount,
    getOrderDetails
}; 