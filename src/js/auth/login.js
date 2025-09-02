/**
 * Login Page Controller
 * Handles login form functionality
 */

class LoginController {
    constructor() {
        this.form = null;
        this.errorMsg = null;
        this.submitButton = null;
    }

    /**
     * Initialize login page
     */
    init() {
        // Check if already authenticated
        if (authService.isAuthenticated()) {
            window.location.href = '/app';
            return;
        }

        this.form = document.getElementById('loginForm');
        this.errorMsg = document.getElementById('errorMsg');
        this.submitButton = this.form?.querySelector('button[type="submit"]');

        if (this.form) {
            this.form.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    /**
     * Handle login form submission
     * @param {Event} e - Form submit event
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        this.setLoading(true);
        this.clearError();
        
        try {
            await authService.login(username, password);
            
            this.showSuccess('Login successful! Redirecting...');
            
            setTimeout(() => {
                window.location.href = '/app';
            }, 1000);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        if (this.submitButton) {
            this.submitButton.disabled = loading;
            this.submitButton.textContent = loading ? 'Logging in...' : 'Login';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.errorMsg) {
            this.errorMsg.className = 'mt-3 text-danger';
            this.errorMsg.textContent = message;
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        if (this.errorMsg) {
            this.errorMsg.className = 'mt-3 text-success';
            this.errorMsg.textContent = message;
        }
    }

    /**
     * Clear error message
     */
    clearError() {
        if (this.errorMsg) {
            this.errorMsg.textContent = '';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const loginController = new LoginController();
    loginController.init();
});
