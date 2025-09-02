/**
 * Product Routes
 * Handles product-related API operations
 */

const ErrorHandler = require('../middleware/errorHandler');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * Setup product routes
 * @param {Object} app - Express app instance
 */
function setupProductRoutes(app) {
    // Get products
    app.get('/api/products', async (req, res) => {
        try {
            console.log('Proxying products request to backend:', `${BACKEND_URL}/api/products`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'products');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Products');
        }
    });
}

module.exports = setupProductRoutes;
