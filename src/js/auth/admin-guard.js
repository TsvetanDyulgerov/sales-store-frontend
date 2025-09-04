/**
 * Admin Authentication Guard
 * Prevents content flash and handles unauthorized access
 */

class AdminGuard {
    constructor() {
        this.isChecking = true;
    }

    /**
     * Initialize admin authentication check
     */
    async init() {
        try {
            // Hide page content initially
            this.hidePageContent();
            
            // Check authentication
            if (!authService.isAuthenticated()) {
                window.location.href = '/login';
                return false;
            }

            // Check admin role
            const hasAdminRole = await authService.hasRole('ADMIN');
            if (!hasAdminRole) {
                window.location.href = '/access-denied';
                return false;
            }

            // User is authenticated and has admin role
            this.showPageContent();
            this.isChecking = false;
            return true;
        } catch (error) {
            console.error('Error during admin authentication check:', error);
            window.location.href = '/access-denied';
            return false;
        }
    }

    /**
     * Hide page content during authentication check
     */
    hidePageContent() {
        const style = document.createElement('style');
        style.id = 'admin-guard-style';
        style.textContent = `
            body > nav,
            body > .container,
            body > .container-fluid {
                visibility: hidden !important;
            }
            .admin-loading {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #f8f9fa;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
        `;
        document.head.appendChild(style);

        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'admin-loading';
        loadingDiv.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Checking access...</span>
                </div>
                <p class="text-muted">Verifying access permissions...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }

    /**
     * Show page content after successful authentication
     */
    showPageContent() {
        // Remove loading overlay
        const loadingDiv = document.querySelector('.admin-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }

        // Remove hiding styles
        const style = document.getElementById('admin-guard-style');
        if (style) {
            style.remove();
        }
    }

    /**
     * Setup user welcome message
     */
    async setupUserWelcome() {
        try {
            const userData = await authService.getCurrentUser();
            if (userData && userData.username) {
                const welcomeElement = document.getElementById('userWelcome');
                if (welcomeElement) {
                    welcomeElement.textContent = userData.username;
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
}

// Export singleton instance
const adminGuard = new AdminGuard();
