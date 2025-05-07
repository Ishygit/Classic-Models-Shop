const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    res.render('index', { 
        title: 'Welcome',
        user: req.session.user
    });
});

/* GET products page. */
router.get('/products', (req, res) => {
    // Redirect to the shop page with any query parameters
    const queryString = new URLSearchParams(req.query).toString();
    const redirectUrl = queryString ? `/shop?${queryString}` : '/shop';
    res.redirect(redirectUrl);
});

/* GET about page. */
router.get('/about', (req, res) => {
    res.render('about', { 
        title: 'About Us',
        user: req.session.user
    });
});

/* GET contact page. */
router.get('/contact', (req, res) => {
    res.render('contact', { 
        title: 'Contact Us',
        user: req.session.user
    });
});

module.exports = router; 