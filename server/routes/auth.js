/**
 * Authentication Routes
 * Handles login, register, and user verification
 */

const ErrorHandler = require('../middleware/errorHandler');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * Setup authentication routes
 * @param {Object} app - Express app instance
 */
function setupAuthRoutes(app) {
    // Proxy login requests to backend
    app.post('/api/auth/login', async (req, res) => {
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body)
            });

            console.log('Login request processed');
            await ErrorHandler.handleProxyResponse(response, res, 'login');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Login');
        }
    });

    // Proxy register requests to backend
    app.post('/api/auth/register', async (req, res) => {
        try {
            console.log('Proxying registration request to backend:', `${BACKEND_URL}/api/auth/register`);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body)
            });

            console.log('Registration request processed');
            await ErrorHandler.handleProxyResponse(response, res, 'registration');
        } catch (error) {
            ErrorHandler.handleProxyError(error, res, 'Register');
        }
    });

    // User verification endpoint
    app.get('/api/auth/me', async (req, res) => {
        try {
            console.log('Checking user access with backend:', `${BACKEND_URL}/api/auth/me`);

            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            // Forward the exact response status from backend
            if (response.ok) {
                const data = await response.json();
                res.status(200).json(data);
            } else {
                const data = await response.json().catch(() => ({}));
                res.status(response.status).json(data);
            }
        } catch (error) {
            console.error('User verification proxy error:', error);
            // If backend is offline or unreachable, deny access
            res.status(503).json({ 
                message: 'Server is currently offline. Cannot verify user access.',
                serverOffline: true
            });
        }
    });
}

module.exports = setupAuthRoutes;
