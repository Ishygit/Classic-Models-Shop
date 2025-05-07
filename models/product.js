const db = require('../config/database');

class Product {
    constructor() {
        this.db = db;
    }

    /**
     * Find all products with pagination and sorting
     * @param {Object} options - Pagination and sorting options
     * @returns {Promise<Object>} - Products and pagination info
     */
    async findAll(options = {}) {
        const { page = 1, limit = 10, sort = 'productName', order = 'asc' } = options;
        const offset = (page - 1) * limit;

        try {
            const [products] = await this.db.query(
                `SELECT * FROM products 
                 ORDER BY ${sort} ${order}
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            const [total] = await this.db.query('SELECT COUNT(*) as count FROM products');

            return {
                products,
                pagination: {
                    total: total[0].count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total[0].count / limit)
                }
            };
        } catch (error) {
            console.error('Error in findAll:', error);
            throw error;
        }
    }

    /**
     * Find a product by productCode
     * @param {string} productCode - Product code
     * @returns {Promise<Object>} - Product object
     */
    async findById(productCode) {
        try {
            const [rows] = await this.db.query('SELECT * FROM products WHERE productCode = ?', [productCode]);
            return rows[0];
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    /**
     * Search products by various criteria
     * @param {Object} criteria - Search criteria
     * @param {Object} options - Pagination and sorting options
     * @returns {Promise<Object>} - Products and total count
     */
    async search(criteria = {}, options = {}) {
        const { 
            query, 
            productLine, 
            minPrice, 
            maxPrice,
            productScale,
            searchTerm 
        } = criteria;
        
        const { 
            page = 1, 
            limit = 10, 
            sort = 'productName_asc' 
        } = options;
        
        const offset = (page - 1) * limit;
        
        // Parse sort parameter
        let sortField = 'productName';
        let sortOrder = 'ASC';
        
        if (sort) {
            const [field, order] = sort.split('_');
            if (field) sortField = field;
            if (order) sortOrder = order.toUpperCase();
        }
        
        // Map frontend field names to database column names
        const fieldMap = {
            'name': 'productName',
            'price': 'buyPrice',
            'category': 'productLine',
            'scale': 'productScale'
        };
        
        // Use mapped field name if it exists
        if (fieldMap[sortField]) {
            sortField = fieldMap[sortField];
        }
        
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (searchTerm) {
            sql += ' AND (productName LIKE ? OR productDescription LIKE ?)';
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (productLine) {
            sql += ' AND productLine = ?';
            params.push(productLine);
        }

        if (minPrice !== undefined) {
            sql += ' AND buyPrice >= ?';
            params.push(minPrice);
        }

        if (maxPrice !== undefined) {
            sql += ' AND buyPrice <= ?';
            params.push(maxPrice);
        }
        
        if (productScale) {
            sql += ' AND productScale = ?';
            params.push(productScale);
        }

        // Get total count for pagination
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
        const [countResult] = await this.db.query(countSql, params);
        const total = countResult[0].count;

        // Add sorting and pagination
        sql += ` ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        try {
            const [products] = await this.db.query(sql, params);
            return {
                products,
                total
            };
        } catch (error) {
            console.error('Error in search:', error);
            throw error;
        }
    }

    /**
     * Find products by product line
     * @param {string} productLine - Product line
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} - Products and pagination info
     */
    async findByCategory(productLine, options = {}) {
        const { page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;

        try {
            const [products] = await this.db.query(
                'SELECT * FROM products WHERE productLine = ? LIMIT ? OFFSET ?',
                [productLine, limit, offset]
            );

            const [total] = await this.db.query(
                'SELECT COUNT(*) as count FROM products WHERE productLine = ?',
                [productLine]
            );

            return {
                products,
                pagination: {
                    total: total[0].count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total[0].count / limit)
                }
            };
        } catch (error) {
            console.error('Error in findByCategory:', error);
            throw error;
        }
    }

    /**
     * Create a new product
     * @param {Object} productData - Product data
     * @returns {Promise<Object>} - Created product
     */
    async create(productData) {
        try {
            const [result] = await this.db.query(
                `INSERT INTO products (
                    productCode, productName, productLine, productScale, 
                    productVendor, productDescription, quantityInStock, 
                    buyPrice, MSRP
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    productData.productCode,
                    productData.productName,
                    productData.productLine,
                    productData.productScale,
                    productData.productVendor,
                    productData.productDescription,
                    productData.quantityInStock,
                    productData.buyPrice,
                    productData.MSRP
                ]
            );

            return this.findById(productData.productCode);
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    /**
     * Update a product
     * @param {string} productCode - Product code
     * @param {Object} productData - Updated product data
     * @returns {Promise<Object>} - Updated product
     */
    async update(productCode, productData) {
        try {
            const updateFields = [];
            const values = [];

            Object.entries(productData).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateFields.push(`${key} = ?`);
                    values.push(value);
                }
            });

            if (updateFields.length === 0) {
                return null;
            }

            values.push(productCode);

            await this.db.query(
                `UPDATE products SET ${updateFields.join(', ')} WHERE productCode = ?`,
                values
            );

            return this.findById(productCode);
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    /**
     * Delete a product
     * @param {string} productCode - Product code
     * @returns {Promise<boolean>} - Success status
     */
    async delete(productCode) {
        try {
            const [result] = await this.db.query('DELETE FROM products WHERE productCode = ?', [productCode]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    /**
     * Get all unique product categories
     * @returns {Promise<Array>} - Array of category names
     */
    async getCategories() {
        try {
            const [rows] = await this.db.query(
                'SELECT DISTINCT productLine FROM products ORDER BY productLine'
            );
            return rows.map(row => row.productLine);
        } catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    }

    /**
     * Get all unique product scales
     * @returns {Promise<Array>} - Array of scale values
     */
    async getScales() {
        try {
            const [rows] = await this.db.query(
                'SELECT DISTINCT productScale FROM products ORDER BY productScale'
            );
            return rows.map(row => row.productScale);
        } catch (error) {
            console.error('Error getting scales:', error);
            throw error;
        }
    }
}

module.exports = Product; 