/**
 * Order Routes
 * Handles order-related API operations
 */

const ErrorHandler = require('../middleware/errorHandler');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * Setup order routes
 * @param {Object} app - Express app instance
 */
function setupOrderRoutes(app) {
    // Get all orders
    app.get('/api/orders', async (req, res) => {
        try {
            console.log('Proxying get all orders request to backend:', `${BACKEND_URL}/api/orders`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/orders`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get orders');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Get orders');
        }
    });

    // Get orders for current user
    app.get('/api/orders/me', async (req, res) => {
        try {
            console.log('Proxying get orders for current user request to backend:', `${BACKEND_URL}/api/orders/me`);

            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/orders/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get orders for current user');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Get orders for current user');
        }
    });

    // Get order by UUID
    app.get('/api/orders/:uuid', async (req, res) => {
        try {
            console.log('Proxying get order by UUID request to backend:', `${BACKEND_URL}/api/orders/${req.params.uuid}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/orders/${req.params.uuid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get order by UUID');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Get order by UUID');
        }
    });

    // Create new order (admin and user)
    app.post('/api/orders', async (req, res) => {
        try {
            console.log('Proxying create order request to backend:', `${BACKEND_URL}/api/orders`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                },
                body: JSON.stringify(req.body)
            });

            await ErrorHandler.handleProxyResponse(response, res, 'create order');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Create order');
        }
    });

    // Create new order for specific user (admin only)
    app.post('/api/orders/admin/:username', async (req, res) => {
        try {
            const username = req.params.username;
            console.log('Proxying create admin order request to backend:', `${BACKEND_URL}/api/orders/admin/${username}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/orders/admin/${username}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                },
                body: JSON.stringify(req.body)
            });

            await ErrorHandler.handleProxyResponse(response, res, 'create admin order');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Create admin order');
        }
    });

    // Update order status (admin only)
    app.put('/api/orders/:uuid/status', async (req, res) => {
        try {
            console.log('Proxying update order status request to backend:', `${BACKEND_URL}/api/orders/${req.params.uuid}/status`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/orders/${req.params.uuid}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                },
                body: JSON.stringify(req.body)
            });

            await ErrorHandler.handleProxyResponse(response, res, 'update order status');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Update order status');
        }
    });

    // Delete order (admin only)
    app.delete('/api/orders/:uuid', async (req, res) => {
        try {
            console.log('Proxying delete order request to backend:', `${BACKEND_URL}/api/orders/${req.params.uuid}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/orders/${req.params.uuid}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'delete order');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Delete order');
        }
    });
}

module.exports = setupOrderRoutes;
