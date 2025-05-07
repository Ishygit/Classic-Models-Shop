const Product = require('../models/product');

// Initialize Product model with database connection
const productModel = new Product();

/**
 * Get all products with optional pagination and filtering
 * @route GET /api/products
 * @access Public
 */
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'name', order = 'asc' } = req.query;
        const products = await productModel.findAll({
            page: parseInt(page),
            limit: parseInt(limit),
            sort,
            order
        });

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
};

/**
 * Get a single product by ID
 * @route GET /api/products/:id
 * @access Public
 */
const getProductById = async (req, res) => {
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
};

/**
 * Search products by name, description, or category
 * @route GET /api/products/search
 * @access Public
 */
const searchProducts = async (req, res) => {
    try {
        const { query, category, minPrice, maxPrice } = req.query;
        const products = await productModel.search({
            query,
            category,
            minPrice: parseFloat(minPrice),
            maxPrice: parseFloat(maxPrice)
        });
        res.json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ message: 'Error searching products' });
    }
};

/**
 * Get products by category
 * @route GET /api/products/category/:category
 * @access Public
 */
const getProductsByCategory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const products = await productModel.findByCategory(req.params.category, {
            page: parseInt(page),
            limit: parseInt(limit)
        });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Error fetching products by category' });
    }
};

/**
 * Create a new product
 * @route POST /api/products
 * @access Private (Admin)
 */
const createProduct = async (req, res) => {
    try {
        const product = await productModel.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
};

/**
 * Update a product
 * @route PUT /api/products/:id
 * @access Private (Admin)
 */
const updateProduct = async (req, res) => {
    try {
        const product = await productModel.update(req.params.id, req.body);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
};

/**
 * Delete a product
 * @route DELETE /api/products/:id
 * @access Private (Admin)
 */
const deleteProduct = async (req, res) => {
    try {
        const success = await productModel.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    searchProducts,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct
}; 