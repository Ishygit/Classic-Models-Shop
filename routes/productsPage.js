const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const productModel = new Product();

/**
 * Render the products page
 * @route GET /
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        // Get query parameters with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const sort = req.query.sort || 'name_asc';
        const view = req.query.view || 'grid';

        // Build search criteria
        const criteria = {};
        if (req.query.category) criteria.productLine = req.query.category;
        if (req.query.maxPrice) criteria.maxPrice = parseFloat(req.query.maxPrice);
        if (req.query.scale) criteria.productScale = req.query.scale;
        if (req.query.search) criteria.searchTerm = req.query.search;

        // Get products with pagination and sorting
        let products = [];
        let total = 0;
        
        try {
            const result = await productModel.search(criteria, {
                page,
                limit,
                sort
            });
            
            // Check if result has the expected structure
            if (result && typeof result === 'object') {
                if (Array.isArray(result.products)) {
                    products = result.products;
                } else if (Array.isArray(result)) {
                    products = result;
                }
                
                total = result.total || products.length;
            }
        } catch (searchError) {
            console.error('Error searching products:', searchError);
            // Continue with empty products array
        }

        // Get unique categories and scales for filters
        let categories = [];
        let scales = [];
        
        try {
            categories = await productModel.getCategories() || [];
            scales = await productModel.getScales() || [];
        } catch (filterError) {
            console.error('Error getting categories/scales:', filterError);
            // Continue with empty arrays
        }

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        // Prepare filters object for the view
        const filters = {
            category: req.query.category || '',
            maxPrice: req.query.maxPrice || '',
            scale: req.query.scale || '',
            search: req.query.search || ''
        };

        // Prepare query object for maintaining state in pagination
        const query = { ...req.query };
        delete query.page; // Remove page from query to avoid duplicate

        res.render('products', {
            title: 'Shop',
            products: products || [],
            categories: categories || [],
            scales: scales || [],
            filters,
            query,
            pagination: {
                page,
                limit,
                totalPages,
                total
            },
            sort,
            view
        });
    } catch (error) {
        console.error('Error in products page:', error);
        res.status(500).render('error', {
            message: 'Error loading products',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router; 