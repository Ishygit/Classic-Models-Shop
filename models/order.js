const db = require('../config/database');

class Order {
    constructor() {
        this.db = db;
    }

    /**
     * Create a new order
     * @param {Object} orderData - Order data
     * @returns {Promise<Object>} - Created order
     */
    async create(orderData) {
        try {
            const { 
                user_id, 
                items, 
                subtotal, 
                tax, 
                shipping, 
                total, 
                shipping_address, 
                payment_method,
                expected_delivery_date,
                notes 
            } = orderData;

            // Start transaction
            await this.db.query('START TRANSACTION');

            try {
                // Create order
                const [orderResult] = await this.db.query(
                    `INSERT INTO orders (
                        user_id, subtotal, tax, shipping, total, status, 
                        shipping_address, payment_method, expected_delivery_date, notes
                    ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
                    [
                        user_id, subtotal, tax, shipping, total,
                        JSON.stringify(shipping_address),
                        JSON.stringify(payment_method),
                        expected_delivery_date,
                        notes
                    ]
                );

                const orderId = orderResult.insertId;

                // Create order items
                for (const item of items) {
                    await this.db.query(
                        `INSERT INTO order_items (order_id, product_code, quantity, price)
                         VALUES (?, ?, ?, ?)`,
                        [orderId, item.productCode, item.quantity, item.price]
                    );
                }

                // Commit transaction
                await this.db.query('COMMIT');

                return this.findById(orderId);
            } catch (error) {
                // Rollback transaction on error
                await this.db.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    /**
     * Find order by ID
     * @param {number} id - Order ID
     * @returns {Promise<Object>} - Order with items
     */
    async findById(id) {
        try {
            // Get order
            const [orders] = await this.db.query(
                'SELECT * FROM orders WHERE id = ?',
                [id]
            );

            if (!orders.length) {
                return null;
            }

            const order = orders[0];

            // Get order items
            const [items] = await this.db.query(
                `SELECT 
                    oi.*,
                    p.productName as name,
                    CONCAT('/images/products/', p.productCode, '.jpg') as image
                FROM order_items oi
                JOIN products p ON oi.product_code = p.productCode
                WHERE oi.order_id = ?`,
                [id]
            );

            // Parse JSON fields
            order.shipping_address = typeof order.shipping_address === 'string' 
                ? JSON.parse(order.shipping_address)
                : order.shipping_address;
            
            order.payment_method = typeof order.payment_method === 'string'
                ? JSON.parse(order.payment_method)
                : order.payment_method;

            // Convert price strings to numbers
            items.forEach(item => {
                item.price = Number(item.price);
                item.quantity = Number(item.quantity);
            });

            // Convert order totals to numbers
            order.subtotal = Number(order.subtotal);
            order.tax = Number(order.tax);
            order.shipping = Number(order.shipping);
            order.total = Number(order.total);

            return {
                ...order,
                items
            };
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    /**
     * Get user's orders
     * @param {number} userId - User ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} - Orders and pagination info
     */
    async findByUser(userId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;

        try {
            // Get orders
            const [orders] = await this.db.query(
                `SELECT * FROM orders 
                 WHERE user_id = ?
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            // Get total count
            const [total] = await this.db.query(
                'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
                [userId]
            );

            // Get items for each order
            for (const order of orders) {
                const [items] = await this.db.query(
                    `SELECT 
                        oi.*,
                        p.productName as name,
                        CONCAT('/images/products/', p.productCode, '.jpg') as image
                    FROM order_items oi
                    JOIN products p ON oi.product_code = p.productCode
                    WHERE oi.order_id = ?`,
                    [order.id]
                );
                
                // Parse JSON fields
                order.shipping_address = typeof order.shipping_address === 'string' 
                    ? JSON.parse(order.shipping_address)
                    : order.shipping_address;
                
                order.payment_method = typeof order.payment_method === 'string'
                    ? JSON.parse(order.payment_method)
                    : order.payment_method;
                order.items = items;
            }

            return {
                orders,
                pagination: {
                    total: total[0].count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total[0].count / limit)
                }
            };
        } catch (error) {
            console.error('Error in findByUser:', error);
            throw error;
        }
    }

    /**
     * Update order status
     * @param {number} id - Order ID
     * @param {string} status - New status
     * @returns {Promise<Object>} - Updated order
     */
    async updateStatus(id, status) {
        try {
            await this.db.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                [status, id]
            );

            return this.findById(id);
        } catch (error) {
            console.error('Error in updateStatus:', error);
            throw error;
        }
    }

    /**
     * Update order details
     * @param {number} id - Order ID
     * @param {Object} updates - Fields to update
     * @param {number} modifiedBy - User ID making the modification
     * @param {string} modificationReason - Reason for modification
     * @returns {Promise<Object>} - Updated order
     */
    async update(id, updates, modifiedBy, modificationReason) {
        try {
            const allowedUpdates = [
                'expected_delivery_date',
                'notes',
                'shipping_address',
                'status'
            ];

            const updateFields = Object.keys(updates)
                .filter(key => allowedUpdates.includes(key))
                .map(key => `${key} = ?`)
                .join(', ');

            if (!updateFields) {
                throw new Error('No valid fields to update');
            }

            const values = Object.entries(updates)
                .filter(([key]) => allowedUpdates.includes(key))
                .map(([_, value]) => typeof value === 'object' ? JSON.stringify(value) : value);

            values.push(id);

            await this.db.query(
                `UPDATE orders SET ${updateFields} WHERE id = ?`,
                values
            );

            // Add tracking entry for modification
            if (modifiedBy) {
                await this.db.query(
                    `INSERT INTO order_tracking (
                        order_id, status, description, modified_by, modification_reason
                    ) VALUES (?, 'modified', ?, ?, ?)`,
                    [id, 'Order details were modified', modifiedBy, modificationReason]
                );
            }

            return this.findById(id);
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    /**
     * Cancel an order
     * @param {number} id - Order ID
     * @param {string} reason - Cancellation reason
     * @param {number} cancelledBy - User ID cancelling the order
     * @returns {Promise<Object>} - Cancelled order
     */
    async cancel(id, reason, cancelledBy) {
        try {
            await this.db.query('START TRANSACTION');

            try {
                // Update order status
                await this.db.query(
                    `UPDATE orders 
                     SET status = 'cancelled', 
                         cancellation_reason = ?,
                         cancelled_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [reason, id]
                );

                // Add tracking entry
                await this.db.query(
                    `INSERT INTO order_tracking (
                        order_id, status, description, modified_by, modification_reason
                    ) VALUES (?, 'cancelled', ?, ?, ?)`,
                    [id, 'Order was cancelled', cancelledBy, reason]
                );

                await this.db.query('COMMIT');
                return this.findById(id);
            } catch (error) {
                await this.db.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error in cancel:', error);
            throw error;
        }
    }
}

module.exports = Order; 