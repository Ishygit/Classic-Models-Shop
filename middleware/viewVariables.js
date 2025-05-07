/**
 * Middleware to set default variables for all views
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const setViewVariables = (req, res, next) => {
    // Set default title if not already set
    res.locals.title = res.locals.title || 'Classic Models Shop';
    
    // Set user information if available
    res.locals.user = req.session.user || null;
    
    // Set cart count if user is logged in
    if (req.session.user) {
        // This would ideally be fetched from the database
        // For now, we'll just set a placeholder
        res.locals.cartCount = 0;
    }
    
    next();
};

module.exports = setViewVariables; 