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
    // Get all products
    app.get('/api/products', async (req, res) => {
        try {
            console.log('Proxying get all products request to backend:', `${BACKEND_URL}/api/products`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get products');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Get products');
        }
    });

    // Search products by name
    app.get('/api/products/search', async (req, res) => {
        try {
            const name = req.query.name;
            console.log('Proxying search products request to backend:', `${BACKEND_URL}/api/products/search?name=${name}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products/search?name=${encodeURIComponent(name)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'search products');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Search products');
        }
    });

    // Get product by ID
    app.get('/api/products/:id', async (req, res) => {
        try {
            console.log('Proxying get product by ID request to backend:', `${BACKEND_URL}/api/products/${req.params.id}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products/${req.params.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get product by ID');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Get product by ID');
        }
    });

    // Create new product (admin only)
    app.post('/api/products', async (req, res) => {
        try {
            console.log('Proxying create product request to backend:', `${BACKEND_URL}/api/products`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                },
                body: JSON.stringify(req.body)
            });

            await ErrorHandler.handleProxyResponse(response, res, 'create product');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Create product');
        }
    });

    // Update product (admin only)
    app.put('/api/products/:id', async (req, res) => {
        try {
            console.log('Proxying update product request to backend:', `${BACKEND_URL}/api/products/${req.params.id}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products/${req.params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                },
                body: JSON.stringify(req.body)
            });

            await ErrorHandler.handleProxyResponse(response, res, 'update product');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Update product');
        }
    });

    // Delete product (admin only)
    app.delete('/api/products/:id', async (req, res) => {
        try {
            console.log('Proxying delete product request to backend:', `${BACKEND_URL}/api/products/${req.params.id}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products/${req.params.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'delete product');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Delete product');
        }
    });
}

module.exports = setupProductRoutes;
