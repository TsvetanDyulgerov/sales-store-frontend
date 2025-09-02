/**
 * UI Utility Functions
 * Handles common UI operations like alerts, loading, etc.
 */

class UIHelper {
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    static showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorAlert && errorMessage) {
            errorMessage.textContent = message;
            errorAlert.style.display = 'block';
            errorAlert.classList.add('show');
        } else {
            // Fallback to console if error elements not found
            console.error('Error:', message);
        }
    }

    /**
     * Hide error message
     */
    static hideError() {
        const errorAlert = document.getElementById('errorAlert');
        if (errorAlert) {
            errorAlert.classList.remove('show');
            setTimeout(() => {
                errorAlert.style.display = 'none';
            }, 150);
        }
    }

    /**
     * Show alert message (for user management page)
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, danger, warning, info)
     */
    static showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const alertBox = document.getElementById('alertBox');
        const alertIcon = document.getElementById('alertIcon');
        const alertMessage = document.getElementById('alertMessage');

        if (!alertContainer || !alertBox || !alertIcon || !alertMessage) {
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }

        const icons = {
            success: 'bi-check-circle',
            danger: 'bi-exclamation-circle',
            warning: 'bi-exclamation-triangle',
            info: 'bi-info-circle'
        };

        alertBox.className = `alert alert-${type} alert-dismissible fade show`;
        alertIcon.className = `${icons[type] || icons.info} me-2`;
        alertMessage.textContent = message;
        
        alertContainer.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => UIHelper.hideAlert(), 5000);
    }

    /**
     * Hide alert message
     */
    static hideAlert() {
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            alertContainer.style.display = 'none';
        }
    }

    /**
     * Show loading spinner
     */
    static showLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const usersContainer = document.getElementById('usersContainer');
        
        if (loadingSpinner) {
            loadingSpinner.style.display = 'block';
        }
        if (usersContainer) {
            usersContainer.innerHTML = '';
        }
    }

    /**
     * Hide loading spinner
     */
    static hideLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    }

    /**
     * Update element text content safely
     * @param {string} elementId - Element ID
     * @param {string} content - Content to set
     */
    static updateText(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Update element HTML content safely
     * @param {string} elementId - Element ID
     * @param {string} content - HTML content to set
     */
    static updateHTML(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = content;
        }
    }

    /**
     * Show/hide element
     * @param {string} elementId - Element ID
     * @param {boolean} show - Whether to show the element
     */
    static toggleElement(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Add event listener safely
     * @param {string} elementId - Element ID
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    static addEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    /**
     * Get form data as object
     * @param {string} formId - Form element ID
     * @returns {Object} Form data as key-value pairs
     */
    static getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    /**
     * Clear form
     * @param {string} formId - Form element ID
     */
    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }
}
