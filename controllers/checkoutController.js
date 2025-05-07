const Cart = require('../models/cart');
const Order = require('../models/order');
const Product = require('../models/product');

// Initialize models
const cartModel = new Cart();
const orderModel = new Order();
const productModel = new Product();

/**
 * Initiate checkout process
 * @route POST /api/checkout/initiate
 * @access Private
 */
const initiateCheckout = async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Get user's cart
        const cart = await cartModel.getCart(userId);
        if (!cart.items.length) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Check stock availability
        for (const item of cart.items) {
            const product = await productModel.findById(item.productId);
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Not enough stock for ${product.name}`,
                    productId: product.id
                });
            }
        }

        // Create order summary
        const orderSummary = {
            items: cart.items,
            total: cart.total,
            itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        };

        res.json(orderSummary);
    } catch (error) {
        console.error('Error initiating checkout:', error);
        res.status(500).json({ message: 'Error initiating checkout' });
    }
};

/**
 * Process payment and create order
 * @route POST /api/checkout/payment
 * @access Private
 */
const processPayment = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { shippingAddress, paymentMethod } = req.body;

        // Get cart
        const cart = await cartModel.getCart(userId);
        if (!cart.items.length) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Process payment (integrate with payment gateway)
        const paymentResult = await processPaymentWithGateway(paymentMethod, cart.total);
        if (!paymentResult.success) {
            return res.status(400).json({ message: 'Payment failed' });
        }

        // Create order
        const order = await orderModel.create({
            userId,
            items: cart.items,
            total: cart.total,
            shippingAddress,
            paymentMethod: {
                type: paymentMethod.type,
                transactionId: paymentResult.transactionId
            }
        });

        // Update product stock
        for (const item of cart.items) {
            await productModel.updateStock(item.productId, -item.quantity);
        }

        // Clear cart
        await cartModel.clearCart(userId);

        res.status(201).json({
            message: 'Order created successfully',
            orderId: order.id
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ message: 'Error processing payment' });
    }
};

/**
 * Confirm order completion
 * @route POST /api/checkout/confirm
 * @access Private
 */
const confirmOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.session.user.id;

        const order = await orderModel.findById(orderId);
        if (!order || order.userId !== userId) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await orderModel.updateStatus(orderId, 'confirmed');
        res.json({ message: 'Order confirmed successfully' });
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).json({ message: 'Error confirming order' });
    }
};

/**
 * Process payment with payment gateway
 * @param {Object} paymentMethod - Payment method details
 * @param {number} amount - Amount to charge
 * @returns {Promise<Object>} - Payment result
 */
const processPaymentWithGateway = async (paymentMethod, amount) => {
    // TODO: Integrate with actual payment gateway
    // This is a mock implementation
    return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
};

/**
 * Get checkout page
 * @route GET /checkout
 * @access Private
 */
const getCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cartItems = await cartModel.getCartItems(userId);
        
        if (!cartItems || cartItems.length === 0) {
            req.session.messages = req.session.messages || [];
            req.session.messages.push({ type: 'error', text: 'Your cart is empty' });
            return res.redirect('/cart');
        }

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1; // 10% tax
        const shipping = 10; // Fixed shipping cost
        const total = subtotal + tax + shipping;

        res.render('checkout/index', {
            cartItems,
            subtotal,
            tax,
            shipping,
            total,
            messages: req.session.messages || []
        });
        
        // Clear messages after displaying them
        req.session.messages = [];
    } catch (error) {
        console.error('Error in getCheckoutPage:', error);
        req.session.messages = req.session.messages || [];
        req.session.messages.push({ type: 'error', text: 'An error occurred while loading the checkout page' });
        res.redirect('/cart');
    }
};

/**
 * Process checkout
 * @route POST /checkout
 * @access Private
 */
const processCheckout = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { shippingAddress, paymentMethod } = req.body;

        // Validate required shipping address fields
        const requiredShippingFields = [
            'firstName', 'lastName', 'email', 'street',
            'city', 'state', 'zip', 'country'
        ];

        const missingFields = requiredShippingFields.filter(
            field => !shippingAddress || !shippingAddress[field]
        );

        if (missingFields.length > 0) {
            req.session.messages = [{
                type: 'error',
                text: `Please fill in all required fields: ${missingFields.map(field => 
                    field.charAt(0).toUpperCase() + field.slice(1)
                ).join(', ')}`
            }];
            return res.redirect('/checkout');
        }

        // Validate payment method fields
        const requiredPaymentFields = ['type', 'cardName', 'cardNumber', 'expiryDate', 'cvv'];
        const missingPaymentFields = requiredPaymentFields.filter(
            field => !paymentMethod || !paymentMethod[field]
        );

        if (missingPaymentFields.length > 0) {
            req.session.messages = [{
                type: 'error',
                text: `Please fill in all payment fields: ${missingPaymentFields.map(field => 
                    field.charAt(0).toUpperCase() + field.slice(1)
                ).join(', ')}`
            }];
            return res.redirect('/checkout');
        }

        // Get cart items
        const cartItems = await cartModel.getCartItems(userId);
        if (!cartItems || cartItems.length === 0) {
            req.session.messages = [{
                type: 'error',
                text: 'Your cart is empty'
            }];
            return res.redirect('/cart');
        }

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1; // 10% tax
        const shipping = 10; // Fixed shipping cost
        const total = subtotal + tax + shipping;

        // Create order
        const orderData = {
            user_id: userId,
            subtotal,
            tax,
            shipping,
            total,
            shipping_address: shippingAddress,
            payment_method: {
                type: paymentMethod.type,
                cardName: paymentMethod.cardName,
                lastFourDigits: paymentMethod.cardNumber.slice(-4),
                expiryDate: paymentMethod.expiryDate
            },
            items: cartItems.map(item => ({
                productCode: item.productCode,
                quantity: item.quantity,
                price: item.price
            }))
        };

        const newOrder = await orderModel.create(orderData);

        // Clear the cart
        await cartModel.clearCart(userId);

        // Redirect to order confirmation
        req.session.messages = [{
            type: 'success',
            text: 'Order placed successfully!'
        }];
        res.redirect(`/checkout/confirmation/${newOrder.id}`);
    } catch (error) {
        console.error('Error in processCheckout:', error);
        req.session.messages = [{
            type: 'error',
            text: 'An error occurred while processing your order'
        }];
        res.redirect('/cart');
    }
};

/**
 * Get order confirmation
 * @route GET /checkout/confirmation/:orderId
 * @access Private
 */
const getOrderConfirmation = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const orderId = req.params.orderId;

        const orderDetails = await orderModel.findById(orderId);
        
        if (!orderDetails || orderDetails.user_id !== userId) {
            req.session.messages = req.session.messages || [];
            req.session.messages.push({ type: 'error', text: 'Order not found' });
            return res.redirect('/account/orders');
        }

        res.render('checkout/confirmation', { 
            order: orderDetails,
            messages: req.session.messages || []
        });
        
        // Clear messages after displaying them
        req.session.messages = [];
    } catch (error) {
        console.error('Error in getOrderConfirmation:', error);
        req.session.messages = req.session.messages || [];
        req.session.messages.push({ type: 'error', text: 'An error occurred while loading the order confirmation' });
        res.redirect('/account/orders');
    }
};

module.exports = {
    initiateCheckout,
    processPayment,
    confirmOrder,
    getCheckoutPage,
    processCheckout,
    getOrderConfirmation
}; 