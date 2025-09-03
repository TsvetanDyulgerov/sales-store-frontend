/**
 * Reports Routes
 * Handles proxy requests to the backend reports API
 */

const ErrorHandler = require('../middleware/errorHandler');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/**
 * Setup reports routes
 * @param {Object} app - Express app instance
 */
function setupReportsRoutes(app) {
    // Get filtered order reports
    app.get('/api/reports/', async (req, res) => {
        try {
            console.log('Proxying order reports request to backend:', `${BACKEND_URL}/api/reports/`);
            console.log('Query parameters:', req.query);
            
            // Build query string from request parameters
            const queryParams = new URLSearchParams();
            Object.keys(req.query).forEach(key => {
                if (req.query[key]) {
                    queryParams.append(key, req.query[key]);
                }
            });
            
            const queryString = queryParams.toString();
            const url = `${BACKEND_URL}/api/reports/${queryString ? '?' + queryString : ''}`;
            
            console.log('Full backend URL:', url);
            
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization || ''
                }
            });

            await ErrorHandler.handleProxyResponse(response, res, 'get reports');
        } catch (error) {
            console.error('Error proxying reports request:', error);
            ErrorHandler.handleProxyError(error, res, 'Get reports');
        }
    });
}

module.exports = setupReportsRoutes;
