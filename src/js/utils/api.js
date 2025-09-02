/**
 * API Utility Functions
 * Handles HTTP requests and server communication
 */

class APIClient {
    constructor() {
        this.baseURL = '';
        this.token = localStorage.getItem('jwtToken');
    }

    /**
     * Make HTTP request with error handling
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise<Response|null>} Response object or null on error
     */
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token ? `Bearer ${this.token}` : '',
                    ...options.headers
                }
            });
            
            if (response.status === 503) {
                const data = await response.json();
                if (data.serverOffline) {
                    throw new Error('Server is currently offline. Please try again later.');
                }
            }
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Request failed');
            }
            
            return response;
        } catch (error) {
            if (error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your connection and try again.');
            }
            throw error;
        }
    }

    /**
     * GET request
     * @param {string} url - Request URL
     * @returns {Promise<any>} Response data
     */
    async get(url) {
        const response = await this.makeRequest(url, { method: 'GET' });
        return response ? await response.json() : null;
    }

    /**
     * POST request
     * @param {string} url - Request URL
     * @param {Object} data - Request body data
     * @returns {Promise<any>} Response data
     */
    async post(url, data) {
        const response = await this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response ? await response.json() : null;
    }

    /**
     * PUT request
     * @param {string} url - Request URL
     * @param {Object} data - Request body data
     * @returns {Promise<any>} Response data
     */
    async put(url, data) {
        const response = await this.makeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response ? await response.json() : null;
    }

    /**
     * DELETE request
     * @param {string} url - Request URL
     * @returns {Promise<any>} Response data or true for 204 responses
     */
    async delete(url) {
        const response = await this.makeRequest(url, { method: 'DELETE' });
        if (response) {
            if (response.status === 204) {
                return true;
            }
            return await response.json();
        }
        return null;
    }

    /**
     * Update authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('jwtToken', token);
        } else {
            localStorage.removeItem('jwtToken');
        }
    }
}

// Export singleton instance
const apiClient = new APIClient();
