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
    // Get all products (admin only)
    app.get('/api/products', async (req, res) => {
        try {
            console.log('Proxying get all products (admin) request to backend:', `${BACKEND_URL}/api/products`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get products (admin)');
        } catch (error) {
            console.error('Backend products API failed:', error.message);
            ErrorHandler.handleProxyError(error, res, 'Get products (admin)');
        }
    });

    // Get all products for public view (users and admin)
    app.get('/api/products/public', async (req, res) => {
        try {
            console.log('Proxying get all products (public) request to backend:', `${BACKEND_URL}/api/products/public`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products/public`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get products (public)');
        } catch (error) {
            console.error('Backend products public API failed, serving fallback data:', error.message);
            
            // Serve fallback mock data when backend is unavailable
            const mockProducts = [
                {
                    id: 1,
                    name: "Sample Product 1",
                    description: "This is a sample product for demonstration",
                    price: 29.99,
                    category: "Electronics",
                    stock: 50
                },
                {
                    id: 2,
                    name: "Sample Product 2", 
                    description: "Another sample product",
                    price: 19.99,
                    category: "Accessories",
                    stock: 25
                },
                {
                    id: 3,
                    name: "Sample Product 3",
                    description: "Third sample product",
                    price: 49.99,
                    category: "Electronics", 
                    stock: 0
                }
            ];
            
            res.json(mockProducts);
        }
    });

    // Get product by ID (admin only)
    app.get('/api/products/:id', async (req, res) => {
        try {
            const productId = req.params.id;
            console.log('Proxying get product by ID request to backend:', `${BACKEND_URL}/api/products/${productId}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
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

    // Get product by name (admin only)
    app.get('/api/products/name/:name', async (req, res) => {
        try {
            const name = req.params.name;
            console.log('Proxying get product by name request to backend:', `${BACKEND_URL}/api/products/name/${name}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products/name/${encodeURIComponent(name)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get product by name');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Get product by name');
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

    // Update product by ID (admin only)
    app.put('/api/products/:id', async (req, res) => {
        try {
            const productId = req.params.id;
            console.log('Proxying update product request to backend:', `${BACKEND_URL}/api/products/${productId}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
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

    // Delete product by ID (admin only)
    app.delete('/api/products/:id', async (req, res) => {
        try {
            const productId = req.params.id;
            console.log('Proxying delete product request to backend:', `${BACKEND_URL}/api/products/${productId}`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
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
