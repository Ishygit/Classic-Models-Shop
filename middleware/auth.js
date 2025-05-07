/**
 * Middleware to check if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        // Store the requested URL to redirect back after login
        const redirectUrl = req.originalUrl;
        res.redirect(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
};

/**
 * Middleware to check if user is not authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isNotAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        next();
    } else {
        // Check if there's a redirect URL in the query parameters
        const redirectUrl = req.query.redirect || '/dashboard';
        res.redirect(redirectUrl);
    }
};

module.exports = {
    isAuthenticated,
    isNotAuthenticated
}; 