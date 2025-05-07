const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { isNotAuthenticated } = require('../middleware/auth');
const { pool } = require('../config/database');

// Initialize User model with database connection
const userModel = new User(pool);

/**
 * @route GET /auth/login
 * @desc Display login form
 * @access Public
 */
router.get('/login', isNotAuthenticated, (req, res) => {
    res.render('auth/login', {
        title: 'Login - Classic Models Shop',
        redirect: req.query.redirect || null
    });
});

/**
 * @route GET /auth/register
 * @desc Display registration form
 * @access Public
 */
router.get('/register', isNotAuthenticated, (req, res) => {
    res.render('auth/register', {
        title: 'Register - Classic Models Shop'
    });
});

/**
 * @route GET /auth/forgot-password
 * @desc Display forgot password form
 * @access Public
 */
router.get('/forgot-password', isNotAuthenticated, (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Forgot Password - Classic Models Shop'
    });
});

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', isNotAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, terms } = req.body;
        
        // Validate password match
        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Register - Classic Models Shop',
                error: 'Passwords do not match'
            });
        }

        // Check if user already exists
        const existingUser = await userModel.findByEmail(email);
        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register - Classic Models Shop',
                error: 'Email already registered'
            });
        }

        // Create new user
        const user = await userModel.create({ email, password, firstName, lastName });

        // Set user session
        req.session.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        };

        // Redirect to dashboard
        res.redirect('/account/dashboard');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', {
            title: 'Register - Classic Models Shop',
            error: 'An error occurred during registration'
        });
    }
});

/**
 * @route POST /auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', isNotAuthenticated, async (req, res) => {
    try {
        const { email, password, remember, redirect } = req.body;
        
        // Find user by email
        const user = await userModel.findByEmail(email);
        if (!user) {
            return res.render('auth/login', {
                title: 'Login - Classic Models Shop',
                error: 'Invalid email or password',
                redirect: redirect || null
            });
        }

        // Verify password
        const isValidPassword = await userModel.verifyPassword(password, user.password);
        if (!isValidPassword) {
            return res.render('auth/login', {
                title: 'Login - Classic Models Shop',
                error: 'Invalid email or password',
                redirect: redirect || null
            });
        }

        // Set user session
        req.session.user = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
        };

        // Set remember me cookie
        if (remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        // Redirect to the requested page or account dashboard
        const redirectUrl = redirect || '/account/dashboard';
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login - Classic Models Shop',
            error: 'An error occurred during login',
            redirect: req.body.redirect || null
        });
    }
});

/**
 * @route GET /auth/logout
 * @desc Logout user (GET request)
 * @access Private
 */
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

/**
 * @route POST /auth/logout
 * @desc Logout user (POST request)
 * @access Private
 */
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

/**
 * @route GET /auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
});

module.exports = router; 