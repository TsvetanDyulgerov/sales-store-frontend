/**
 * User Management Routes
 * Handles admin user management operations
 */

const ErrorHandler = require('../middleware/errorHandler');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * Setup user management routes
 * @param {Object} app - Express app instance
 */
function setupUserRoutes(app) {
    // Get all users (admin only)
    app.get('/api/users', async (req, res) => {
        try {
            console.log('Proxying get all users request to backend:', `${BACKEND_URL}/api/users`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get users');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Get users');
        }
    });

    // Get user by ID (admin only)
    app.get('/api/users/:id', async (req, res) => {
        try {
            console.log('Proxying get user by ID request to backend:', `${BACKEND_URL}/api/users/${req.params.id}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/users/${req.params.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get user by ID');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Get user by ID');
        }
    });

    // Search users by username (admin only)
    app.get('/api/users/search', async (req, res) => {
        try {
            const username = req.query.username;
            console.log('Proxying search users request to backend:', `${BACKEND_URL}/api/users/search?username=${username}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/users/search?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'search users');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Search users');
        }
    });

    // Update user (admin only)
    app.put('/api/users/:id', async (req, res) => {
        try {
            console.log('Proxying update user request to backend:', `${BACKEND_URL}/api/users/${req.params.id}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/users/${req.params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                },
                body: JSON.stringify(req.body)
            });

            await ErrorHandler.handleProxyResponse(response, res, 'update user');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Update user');
        }
    });

    // Delete user (admin only)
    app.delete('/api/users/:id', async (req, res) => {
        try {
            console.log('Proxying delete user request to backend:', `${BACKEND_URL}/api/users/${req.params.id}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/users/${req.params.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'delete user');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Delete user');
        }
    });
}

module.exports = setupUserRoutes;
