/**
 * JWT Utility Functions
 * Handles JWT token operations
 */

class JWTHelper {
    /**
     * Parse JWT token to extract payload
     * @param {string} token - JWT token
     * @returns {Object|null} Parsed payload or null if invalid
     */
    static parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    }

    /**
     * Get JWT token from localStorage
     * @returns {string|null} JWT token or null if not found
     */
    static getToken() {
        return localStorage.getItem('jwtToken');
    }

    /**
     * Set JWT token in localStorage
     * @param {string} token - JWT token to store
     */
    static setToken(token) {
        localStorage.setItem('jwtToken', token);
    }

    /**
     * Remove JWT token from localStorage
     */
    static removeToken() {
        localStorage.removeItem('jwtToken');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user has a token
     */
    static isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Get user info from JWT token
     * @returns {Object|null} User info or null if token invalid
     */
    static getUserInfo() {
        const token = this.getToken();
        return token ? this.parseJwt(token) : null;
    }

    /**
     * Check if token is expired
     * @param {string} token - JWT token (optional, uses stored token if not provided)
     * @returns {boolean} True if token is expired
     */
    static isTokenExpired(token = null) {
        const jwtToken = token || this.getToken();
        if (!jwtToken) return true;

        const payload = this.parseJwt(jwtToken);
        if (!payload || !payload.exp) return true;

        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    }

    /**
     * Redirect to login if not authenticated
     */
    static requireAuth() {
        if (!this.isAuthenticated() || this.isTokenExpired()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }
}
