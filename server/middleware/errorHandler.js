/**
 * Error Handler Utility
 * Handles common error scenarios in API requests
 */

class ErrorHandler {
    /**
     * Handle proxy request errors
     * @param {Error} error - Error object
     * @param {Object} res - Express response object
     * @param {string} operation - Operation description
     */
    static handleProxyError(error, res, operation = 'request') {
        console.error(`${operation} proxy error:`, error);
        
        // Check if it's a connection error (server offline)
        if (error.code === 'ECONNREFUSED' || 
            error.code === 'ETIMEDOUT' || 
            error.message.includes('fetch failed')) {
            res.status(503).json({ 
                message: 'Server is currently offline. Please try again later.',
                serverOffline: true
            });
        } else {
            res.status(500).json({ 
                message: 'Connection failed. Please try again later.' 
            });
        }
    }

    /**
     * Handle successful proxy response
     * @param {Object} response - Fetch response object
     * @param {Object} res - Express response object
     * @param {string} operation - Operation description
     */
    static async handleProxyResponse(response, res, operation = 'request') {
        try {
            if (response.status === 204) {
                // No content response (usually for DELETE)
                return res.status(204).send();
            }

            const data = await response.json();
            
            if (!response.ok) {
                console.log(`Backend ${operation} failed:`, response.status, data);
                return res.status(response.status).json(data);
            }

            // Handle different success status codes
            if (response.status === 201) {
                res.status(201).json(data);
            } else {
                res.json(data);
            }
        } catch (parseError) {
            console.error(`Error parsing ${operation} response:`, parseError);
            res.status(500).json({ 
                message: 'Invalid response from server' 
            });
        }
    }
}

module.exports = ErrorHandler;
