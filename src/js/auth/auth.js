/**
 * Authentication Module
 * Handles login, logout, and user authentication
 */

class AuthService {
    constructor() {
        this.api = apiClient;
    }

    /**
     * Login user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} Login response
     */
    async login(username, password) {
        try {
            const response = await this.api.post('/api/auth/login', {
                username,
                password
            });

            if (response && response.token) {
                this.api.setToken(response.token);
                return response;
            }
            throw new Error('Invalid response from server');
        } catch (error) {
            throw error;
        }
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration response
     */
    async register(userData) {
        try {
            const response = await this.api.post('/api/auth/register', userData);
            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get current user information from backend
     * @returns {Promise<Object|null>} User data or null
     */
    async getCurrentUser() {
        try {
            const response = await this.api.get('/api/auth/me');
            return response;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.api.setToken(null);
        window.location.href = '/';
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return JWTHelper.isAuthenticated() && !JWTHelper.isTokenExpired();
    }

    /**
     * Check if user has admin role
     * @param {Object} userData - User data from backend
     * @returns {boolean} True if user is admin
     */
    isAdmin(userData) {
        if (!userData || !userData.role) return false;
        const role = userData.role.toLowerCase();
        return role === 'admin' || role === 'administrator';
    }

    /**
     * Initialize authentication check
     * @returns {Promise<boolean>} True if authenticated
     */
    async init() {
        if (!this.isAuthenticated()) {
            return false;
        }

        // Verify token with backend
        const userData = await this.getCurrentUser();
        if (!userData) {
            // Token is invalid, remove it
            this.logout();
            return false;
        }

        return true;
    }
}

// Export singleton instance
const authService = new AuthService();
