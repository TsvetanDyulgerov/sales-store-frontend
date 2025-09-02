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

    // Handle 404 errors - redirect unknown routes to index
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../src/pages/index.html'));
    });
}

module.exports = setupPageRoutes;
