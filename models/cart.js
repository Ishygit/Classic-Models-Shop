const { pool } = require('../config/database');

class Cart {
    constructor() {
        this.pool = pool;
    }

    /**
     * Get or create a cart for a user
     * @param {number} userId - The user ID
     * @returns {Promise<number>} - The cart ID
     */
    async getOrCreateCart(userId) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if user already has a cart
            const [carts] = await connection.query(
                'SELECT id FROM carts WHERE user_id = ?',
                [userId]
            );

            let cartId;
            if (carts.length === 0) {
                // Create new cart if none exists
                const [result] = await connection.query(
                    'INSERT INTO carts (user_id) VALUES (?)',
                    [userId]
                );
                cartId = result.insertId;
            } else {
                cartId = carts[0].id;
            }

            await connection.commit();
            return cartId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get all items in a user's cart with product details
     * @param {number} userId - The user ID
     * @returns {Promise<Array>} - Array of cart items with product details
     */
    async getCartItems(userId) {
        const [rows] = await this.pool.query(`
            SELECT 
                ci.id,
                ci.quantity,
                p.productCode,
                p.productName as name,
                p.productScale as scale,
                p.buyPrice as price,
                p.quantityInStock as stockQuantity,
                CONCAT('/images/products/', p.productCode, '.jpg') as image
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.productCode
            WHERE c.user_id = ?
        `, [userId]);

        return rows;
    }

    /**
     * Add an item to the cart
     * @param {number} userId - The user ID
     * @param {string} productId - The product ID
     * @param {number} quantity - The quantity to add
     */
    async addItem(userId, productId, quantity) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get or create cart
            const cartId = await this.getOrCreateCart(userId);

            // Check if product exists and has enough stock
            const [products] = await connection.query(
                'SELECT quantityInStock FROM products WHERE productCode = ?',
                [productId]
            );

            if (products.length === 0) {
                throw new Error('Product not found');
            }

            if (products[0].quantityInStock < quantity) {
                throw new Error('Not enough stock available');
            }

            // Check if item already exists in cart
            const [existingItems] = await connection.query(
                'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cartId, productId]
            );

            if (existingItems.length > 0) {
                // Update quantity if item exists
                const newQuantity = existingItems[0].quantity + quantity;
                await connection.query(
                    'UPDATE cart_items SET quantity = ? WHERE id = ?',
                    [newQuantity, existingItems[0].id]
                );
            } else {
                // Add new item
                await connection.query(
                    'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
                    [cartId, productId, quantity]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update cart item quantity
     * @param {number} userId - The user ID
     * @param {number} itemId - The cart item ID
     * @param {number} quantity - The new quantity
     */
    async updateItem(userId, itemId, quantity) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verify the item belongs to the user's cart
            const [items] = await connection.query(`
                SELECT ci.id, p.quantityInStock
                FROM cart_items ci
                JOIN carts c ON ci.cart_id = c.id
                JOIN products p ON ci.product_id = p.productCode
                WHERE c.user_id = ? AND ci.id = ?
            `, [userId, itemId]);

            if (items.length === 0) {
                throw new Error('Item not found in cart');
            }

            if (items[0].quantityInStock < quantity) {
                throw new Error('Not enough stock available');
            }

            // Update quantity
            await connection.query(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [quantity, itemId]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Remove an item from the cart
     * @param {number} userId - The user ID
     * @param {number} itemId - The cart item ID
     */
    async removeItem(userId, itemId) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verify the item belongs to the user's cart
            const [items] = await connection.query(`
                SELECT ci.id
                FROM cart_items ci
                JOIN carts c ON ci.cart_id = c.id
                WHERE c.user_id = ? AND ci.id = ?
            `, [userId, itemId]);

            if (items.length === 0) {
                throw new Error('Item not found in cart');
            }

            // Remove item
            await connection.query(
                'DELETE FROM cart_items WHERE id = ?',
                [itemId]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Clear all items from a user's cart
     * @param {number} userId - The user ID
     */
    async clearCart(userId) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get the user's cart
            const [carts] = await connection.query(
                'SELECT id FROM carts WHERE user_id = ?',
                [userId]
            );

            if (carts.length === 0) {
                return; // No cart to clear
            }

            // Remove all items
            await connection.query(
                'DELETE FROM cart_items WHERE cart_id = ?',
                [carts[0].id]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get cart summary (subtotal, tax, shipping, total)
     * @param {number} userId - The user ID
     * @returns {Promise<Object>} - Cart summary
     */
    async getCartSummary(userId) {
        const [rows] = await this.pool.query(`
            SELECT 
                SUM(ci.quantity * p.buyPrice) as subtotal
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.productCode
            WHERE c.user_id = ?
        `, [userId]);

        const subtotal = rows[0].subtotal || 0;
        const tax = subtotal * 0.1; // 10% tax
        const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
        const total = subtotal + tax + shipping;

        return {
            subtotal,
            tax,
            shipping,
            total
        };
    }
}

module.exports = Cart; 