const { pool } = require('../config/database');

class OrderTracking {
    constructor() {
        this.pool = pool;
    }

    /**
     * Get tracking history for an order
     * @param {number} orderId - Order ID
     * @returns {Promise<Array>} Tracking history
     */
    async getTrackingHistory(orderId) {
        try {
            const [history] = await this.pool.query(
                `SELECT * FROM order_tracking 
                 WHERE order_id = ? 
                 ORDER BY created_at ASC`,
                [orderId]
            );
            return history;
        } catch (error) {
            console.error('Error in getTrackingHistory:', error);
            throw error;
        }
    }

    /**
     * Add tracking status
     * @param {Object} data - Tracking data
     * @returns {Promise<Object>} Created tracking entry
     */
    async addTrackingStatus(data) {
        try {
            const { order_id, status, location, description } = data;
            
            const [result] = await this.pool.query(
                `INSERT INTO order_tracking (order_id, status, location, description)
                 VALUES (?, ?, ?, ?)`,
                [order_id, status, location, description]
            );

            const [tracking] = await this.pool.query(
                'SELECT * FROM order_tracking WHERE id = ?',
                [result.insertId]
            );

            return tracking[0];
        } catch (error) {
            console.error('Error in addTrackingStatus:', error);
            throw error;
        }
    }

    /**
     * Get latest tracking status
     * @param {number} orderId - Order ID
     * @returns {Promise<Object>} Latest tracking status
     */
    async getLatestStatus(orderId) {
        try {
            const [status] = await this.pool.query(
                `SELECT * FROM order_tracking 
                 WHERE order_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 1`,
                [orderId]
            );
            return status[0] || null;
        } catch (error) {
            console.error('Error in getLatestStatus:', error);
            throw error;
        }
    }

    /**
     * Update order status in both orders and tracking tables
     * @param {number} orderId - Order ID
     * @param {string} status - New status
     * @param {string} location - Current location
     * @param {string} description - Status description
     * @returns {Promise<Object>} Updated tracking entry
     */
    async updateOrderStatus(orderId, status, location, description) {
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Update order status
            await connection.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                [status, orderId]
            );

            // Add tracking entry
            const [result] = await connection.query(
                `INSERT INTO order_tracking (order_id, status, location, description)
                 VALUES (?, ?, ?, ?)`,
                [orderId, status, location, description]
            );

            await connection.commit();

            const [tracking] = await connection.query(
                'SELECT * FROM order_tracking WHERE id = ?',
                [result.insertId]
            );

            return tracking[0];
        } catch (error) {
            await connection.rollback();
            console.error('Error in updateOrderStatus:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = OrderTracking; 