/**
 * Page Routes
 * Handles serving of HTML pages
 */

const path = require('path');

/**
 * Setup page routes
 * @param {Object} app - Express app instance
 */
function setupPageRoutes(app) {
    // Route for main page (landing)
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/index.html'));
    });

    // Route for login page
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/login.html'));
    });

    // Route for register page
    app.get('/register', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/register.html'));
    });

    // Route for app page
    app.get('/app', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/app.html'));
    });

    // Route for user management page (admin only)
    app.get('/admin/users', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/user-management.html'));
    });

    // Route for product management page (admin only)
    app.get('/admin/products', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/product-management.html'));
    });

    // Route for order management page (admin only)
    app.get('/admin/orders', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/order-management.html'));
    });

    // Route for order reports page (admin only)
    app.get('/admin/reports', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/order-reports.html'));
    });

    // Route for create order page (customer)
    app.get('/create-order', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/create-order.html'));
    });

    // Route for shop page (alternative to create-order)
    app.get('/shop', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/create-order.html'));
    });

    // Alternative route names for convenience
    app.get('/order-management', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/order-management.html'));
    });

    app.get('/order-reports', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/order-reports.html'));
    });

    app.get('/reports', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/order-reports.html'));
    });

    // Handle 404 errors - redirect unknown routes to index
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/index.html'));
    });
}

module.exports = setupPageRoutes;
