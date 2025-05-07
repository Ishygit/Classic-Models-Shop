const Cart = require('../models/cart');
const Product = require('../models/product');

class CartController {
    constructor() {
        this.cart = new Cart();
        this.product = new Product();
    }

    /**
     * Get user's cart
     * @route GET /cart
     * @access Private
     */
    getCart = async (req, res) => {
        try {
            // Check if user is authenticated
            if (!req.session.user) {
                return res.redirect('/auth/login?redirect=/cart');
            }

            const userId = req.session.user.id;
            const cartItems = await this.cart.getCartItems(userId);
            const cartSummary = await this.cart.getCartSummary(userId);
            
            res.render('cart/index', { 
                title: 'Shopping Cart',
                cartItems,
                cartSummary,
                messages: {
                    error: req.flash('error'),
                    success: req.flash('success')
                }
            });
        } catch (error) {
            console.error('Error getting cart:', error);
            req.flash('error', 'Error retrieving cart');
            res.redirect('/');
        }
    };

    /**
     * Add item to cart
     * @route POST /cart/add
     * @access Private
     */
    addToCart = async (req, res) => {
        try {
            // Check if user is authenticated
            if (!req.session.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const userId = req.session.user.id;
            const { productCode, quantity = 1 } = req.body;

            // Validate product exists
            const product = await this.product.findById(productCode);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Add to cart
            await this.cart.addItem(userId, productCode, quantity);

            res.json({ message: 'Item added to cart successfully' });
        } catch (error) {
            console.error('Error adding to cart:', error);
            res.status(500).json({ message: 'Error adding item to cart' });
        }
    };

    /**
     * Update cart item quantity
     * @route PUT /cart/update/:itemId
     * @access Private
     */
    updateQuantity = async (req, res) => {
        try {
            // Check if user is authenticated
            if (!req.session.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const userId = req.session.user.id;
            const itemId = req.params.itemId;
            const { quantity } = req.body;

            if (quantity < 1) {
                return res.status(400).json({ message: 'Quantity must be at least 1' });
            }

            await this.cart.updateItem(userId, itemId, quantity);
            res.json({ message: 'Quantity updated successfully' });
        } catch (error) {
            console.error('Error updating quantity:', error);
            res.status(500).json({ message: 'Error updating quantity' });
        }
    };

    /**
     * Remove item from cart
     * @route DELETE /cart/remove/:itemId
     * @access Private
     */
    removeItem = async (req, res) => {
        try {
            // Check if user is authenticated
            if (!req.session.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const userId = req.session.user.id;
            const itemId = req.params.itemId;

            await this.cart.removeItem(userId, itemId);
            res.json({ message: 'Item removed successfully' });
        } catch (error) {
            console.error('Error removing item:', error);
            res.status(500).json({ message: 'Error removing item' });
        }
    };

    /**
     * Clear cart
     * @route DELETE /cart/clear
     * @access Private
     */
    clearCart = async (req, res) => {
        try {
            // Check if user is authenticated
            if (!req.session.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const userId = req.session.user.id;
            await this.cart.clearCart(userId);
            res.json({ message: 'Cart cleared successfully' });
        } catch (error) {
            console.error('Error clearing cart:', error);
            res.status(500).json({ message: 'Error clearing cart' });
        }
    };
}

module.exports = new CartController(); 