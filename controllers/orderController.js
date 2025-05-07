const Order = require('../models/order');
const OrderTracking = require('../models/orderTracking');

const orderModel = new Order();
const orderTrackingModel = new OrderTracking();

/**
 * Update order details
 * @route PUT /api/orders/:orderId
 * @access Private
 */
const updateOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user.id;
        const updates = req.body;
        const modificationReason = req.body.modificationReason || 'No reason provided';

        // Verify user has permission to modify order
        const order = await orderModel.findById(orderId);
        if (!order || order.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to modify this order' });
        }

        // Check if order can be modified
        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ 
                message: 'Order cannot be modified in its current state' 
            });
        }

        const updatedOrder = await orderModel.update(
            orderId,
            updates,
            userId,
            modificationReason
        );

        res.json({
            message: 'Order updated successfully',
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Error updating order' });
    }
};

/**
 * Cancel order
 * @route POST /api/orders/:orderId/cancel
 * @access Private
 */
const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user.id;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Cancellation reason is required' });
        }

        // Verify user has permission to cancel order
        const order = await orderModel.findById(orderId);
        if (!order || order.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        // Check if order can be cancelled
        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ 
                message: 'Order cannot be cancelled in its current state' 
            });
        }

        const cancelledOrder = await orderModel.cancel(orderId, reason, userId);

        res.json({
            message: 'Order cancelled successfully',
            order: cancelledOrder
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Error cancelling order' });
    }
};

/**
 * Update delivery status
 * @route POST /api/orders/:orderId/tracking
 * @access Private
 */
const updateDeliveryStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user.id;
        const { status, location, description } = req.body;

        // Verify user has permission to update status
        const order = await orderModel.findById(orderId);
        if (!order || order.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        // Add tracking entry
        const tracking = await orderTrackingModel.addTrackingStatus({
            order_id: orderId,
            status,
            location,
            description,
            modified_by: userId
        });

        // Update order status if needed
        if (['shipped', 'delivered'].includes(status)) {
            await orderModel.updateStatus(orderId, status);
        }

        res.json({
            message: 'Delivery status updated successfully',
            tracking
        });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ message: 'Error updating delivery status' });
    }
};

/**
 * Get order tracking history
 * @route GET /api/orders/:orderId/tracking
 * @access Private
 */
const getOrderTracking = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user.id;

        // Verify user has permission to view tracking
        const order = await orderModel.findById(orderId);
        if (!order || order.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        const tracking = await orderTrackingModel.getTrackingHistory(orderId);

        res.json({
            order,
            tracking
        });
    } catch (error) {
        console.error('Error getting order tracking:', error);
        res.status(500).json({ message: 'Error getting order tracking' });
    }
};

module.exports = {
    updateOrder,
    cancelOrder,
    updateDeliveryStatus,
    getOrderTracking
}; 