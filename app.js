const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');

// Load environment variables
dotenv.config();

// Import database connection
const { pool, testConnection } = require('./config/database');

// Import middleware
const setViewVariables = require('./middleware/viewVariables');

const app = express();

// Session store configuration
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Flash messages middleware
app.use(flash());

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Set default layout
app.set('layout', 'layouts/main');

// Make user and other variables available to all views
app.use(setViewVariables);

// Routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const cartRouter = require('./routes/cart');
const accountRouter = require('./routes/account');
const checkoutRouter = require('./routes/checkout');
const productsApiRouter = require('./routes/products');
const productsPageRouter = require('./routes/productsPage');

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/cart', cartRouter);
app.use('/account', accountRouter);
app.use('/checkout', checkoutRouter);
app.use('/api/products', productsApiRouter);
app.use('/shop', productsPageRouter);

// 404 handler - must be after all valid routes
app.use((req, res) => {
    res.status(404).render('404', { 
        title: 'Page Not Found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Function to start server
const startServer = async (port) => {
    try {
        // Test database connection first
        const isConnected = await testConnection();
        if (!isConnected) {
            console.error('WARNING: Database connection failed. The application may not function correctly.');
        }

        // Validate port number
        port = parseInt(port);
        if (isNaN(port) || port < 1024 || port > 65535) {
            port = 3000; // Default to 3000 if port is invalid
        }

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
const PORT = process.env.PORT || 3000;
startServer(PORT);

module.exports = app; 