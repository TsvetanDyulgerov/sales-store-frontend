/**
 * User Management Controller
 * Handles admin user management functionality
 */

class UserManagementController {
    constructor() {
        this.api = apiClient;
        this.currentUsers = [];
    }

    /**
     * Extract error message from different error structures
     * @param {Error|Object} error - Error object
     * @returns {string} - Formatted error message
     */
    getErrorMessage(error) {
        // If it's a simple string
        if (typeof error === 'string') {
            return error;
        }

        // If error has a message property (standard Error object)
        if (error.message) {
            // Check if the message is an object (from our API)
            if (typeof error.message === 'object') {
                // Handle nested error structure: { error: { message: "..." } }
                if (error.message.error && error.message.error.message) {
                    return error.message.error.message;
                }
                // Handle direct error structure: { message: "..." }
                if (error.message.message) {
                    return error.message.message;
                }
                // Fallback to JSON string
                return JSON.stringify(error.message);
            }
            // Standard string message
            return error.message;
        }

        // Handle direct error structure: { error: { message: "..." } }
        if (error.error && error.error.message) {
            return error.error.message;
        }

        // Fallback
        return error.toString();
    }

    /**
     * Check if error indicates a 404 (not found)
     * @param {Error|Object} error - Error object
     * @returns {boolean} - True if it's a 404 error
     */
    isNotFoundError(error) {
        const message = this.getErrorMessage(error);
        return (
            error.status === 404 ||
            message.includes('404') ||
            message.toLowerCase().includes('not found') ||
            message.toLowerCase().includes('user not found')
        );
    }

    /**
     * Check if error indicates a 401 (unauthorized)
     * @param {Error|Object} error - Error object
     * @returns {boolean} - True if it's a 401 error
     */
    isUnauthorizedError(error) {
        const message = this.getErrorMessage(error);
        return (
            error.status === 401 ||
            message.includes('401') ||
            message.toLowerCase().includes('unauthorized')
        );
    }

    /**
     * Check if error indicates a 403 (forbidden)
     * @param {Error|Object} error - Error object
     * @returns {boolean} - True if it's a 403 error
     */
    isForbiddenError(error) {
        const message = this.getErrorMessage(error);
        return (
            error.status === 403 ||
            message.includes('403') ||
            message.toLowerCase().includes('forbidden')
        );
    }

    /**
     * Check if error indicates a 409 (conflict) - username or email already exists
     * @param {Error|Object} error - Error object
     * @returns {boolean} - True if it's a 409 conflict error
     */
    isConflictError(error) {
        const message = this.getErrorMessage(error);
        return (
            error.status === 409 ||
            message.includes('409') ||
            message.toLowerCase().includes('already exists') ||
            message.toLowerCase().includes('conflict')
        );
    }

    /**
     * Parse conflict error message to extract specific field that conflicts
     * @param {Error|Object} error - Error object
     * @returns {Object} - Object with conflictType and conflictValue
     */
    parseConflictError(error) {
        const message = this.getErrorMessage(error);
        
        // Check for username conflict - pattern: "[USERNAME] Username already exists"
        if (message.includes('Username already exists')) {
            const usernameMatch = message.match(/^\[(.*?)\]\s*Username already exists/i);
            if (usernameMatch) {
                return {
                    type: 'username',
                    value: usernameMatch[1],
                    message: `Username "${usernameMatch[1]}" is already taken. Please choose a different username.`
                };
            }
        }
        
        // Check for email conflict - pattern: "[EMAIL] Email already exists"
        if (message.includes('Email already exists')) {
            const emailMatch = message.match(/^\[(.*?)\]\s*Email already exists/i);
            if (emailMatch) {
                return {
                    type: 'email',
                    value: emailMatch[1],
                    message: `Email "${emailMatch[1]}" is already registered. Please use a different email address.`
                };
            }
        }
        
        // Generic conflict message
        return {
            type: 'general',
            value: null,
            message: 'The provided information conflicts with existing data. Please check your input and try again.'
        };
    }

    /**
     * Initialize user management page
     */
    async init() {
        // Check authentication and admin access
        if (!JWTHelper.requireAuth()) {
            return;
        }

        try {
            const userData = await authService.getCurrentUser();
            
            if (!userData) {
                UIHelper.showAlert('Unable to verify user credentials. Please log in again.', 'danger');
                setTimeout(() => window.location.href = '/login', 2000);
                return;
            }

            if (!authService.isAdmin(userData)) {
                UIHelper.showAlert('Access denied. Administrator privileges required.', 'danger');
                setTimeout(() => window.location.href = '/app', 2000);
                return;
            }

            // Set welcome message
            UIHelper.updateText('adminWelcome', `Welcome, ${userData.username}!`);
            
            // Setup event listeners
            this.setupEventListeners();
            
        } catch (error) {
            UIHelper.showAlert('Error verifying access permissions.', 'danger');
            setTimeout(() => window.location.href = '/app', 2000);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Logout button
        UIHelper.addEventListener('logoutBtn', 'click', () => {
            authService.logout();
        });

        // Search event listeners
        UIHelper.addEventListener('searchById', 'keypress', (e) => {
            if (e.key === 'Enter') this.searchUserById();
        });
        
        UIHelper.addEventListener('searchByUsername', 'keypress', (e) => {
            if (e.key === 'Enter') this.searchUserByUsername();
        });

        // Make functions globally available for onclick handlers
        window.searchUserById = this.searchUserById.bind(this);
        window.searchUserByUsername = this.searchUserByUsername.bind(this);
        window.loadAllUsers = this.loadAllUsers.bind(this);
        window.createUser = this.createUser.bind(this);
        window.editUser = this.editUser.bind(this);
        window.updateUser = this.updateUser.bind(this);
        window.deleteUser = this.deleteUser.bind(this);
        window.confirmDeleteUser = this.confirmDeleteUser.bind(this);
        window.hideAlert = UIHelper.hideAlert;
    }

    /**
     * Search users by ID
     */
    async searchUserById() {
        const userId = document.getElementById('searchById')?.value.trim();
        
        if (!userId) {
            UIHelper.showAlert('Please enter a user ID', 'warning');
            return;
        }

        UIHelper.showLoading();
        
        try {
            const user = await this.api.get(`/api/users/${userId}`);
            UIHelper.hideLoading();
            this.displayUsers([user]);
            UIHelper.updateText('userCount', '1 user found');
        } catch (error) {
            UIHelper.hideLoading();
            
            // Handle specific error cases
            if (this.isNotFoundError(error)) {
                UIHelper.showAlert(`No user found with ID: ${userId}`, 'info');
                this.displayUsers([]); // Clear any existing results
                UIHelper.updateText('userCount', '0 users found');
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to view this user.', 'warning');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Error searching for user: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Search users by username
     */
    async searchUserByUsername() {
        const username = document.getElementById('searchByUsername')?.value.trim();
        
        if (!username) {
            UIHelper.showAlert('Please enter a username', 'warning');
            return;
        }

        UIHelper.showLoading();
        
        try {
            const user = await this.api.get(`/api/users/username/${encodeURIComponent(username)}`);
            UIHelper.hideLoading();
            // Your backend returns a single user, not an array
            this.displayUsers([user]);
            UIHelper.updateText('userCount', '1 user found');
        } catch (error) {
            UIHelper.hideLoading();
            
            // Handle specific error cases
            if (this.isNotFoundError(error)) {
                UIHelper.showAlert(`No user found with username: "${username}"`, 'info');
                this.displayUsers([]); // Clear any existing results
                UIHelper.updateText('userCount', '0 users found');
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to search for users.', 'warning');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Error searching for user: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Load all users
     */
    async loadAllUsers() {
        UIHelper.showLoading();
        
        try {
            const users = await this.api.get('/api/users');
            UIHelper.hideLoading();
            this.displayUsers(users);
            UIHelper.updateText('userCount', `${users.length} total users`);
        } catch (error) {
            UIHelper.hideLoading();
            UIHelper.showAlert(error.message, 'danger');
        }
    }

    /**
     * Display users in table format
     * @param {Array} users - Array of user objects
     */
    displayUsers(users) {
        const container = document.getElementById('usersContainer');
        
        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-person-x display-1 opacity-25"></i>
                    <h5 class="mt-3">No Users Found</h5>
                    <p>No users match your search criteria.</p>
                </div>
            `;
            return;
        }

        const userRows = users.map(user => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-circle me-2 text-primary fs-5"></i>
                        <div>
                            <div class="fw-semibold">${user.username || 'N/A'}</div>
                            <small class="text-muted">ID: ${user.id || 'N/A'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <i class="bi bi-envelope me-2 text-secondary"></i>
                    ${user.email || 'N/A'}
                </td>
                <td>
                    <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'} px-3 py-2">
                        <i class="bi bi-${user.role === 'admin' ? 'shield-check' : 'person'} me-1"></i>
                        ${user.role || 'user'}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-warning" 
                                onclick="editUser('${user.id}', '${this.escapeHtml(user.username)}', '${this.escapeHtml(user.email)}', '${user.role}')"
                                title="Edit User">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="deleteUser('${user.id}', '${this.escapeHtml(user.username)}')"
                                title="Delete User">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th scope="col">
                                <i class="bi bi-person me-2"></i>User
                            </th>
                            <th scope="col">
                                <i class="bi bi-envelope me-2"></i>Email
                            </th>
                            <th scope="col">
                                <i class="bi bi-shield me-2"></i>Role
                            </th>
                            <th scope="col" class="text-center">
                                <i class="bi bi-gear me-2"></i>Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userRows}
                    </tbody>
                </table>
            </div>
        `;

        this.currentUsers = users;
    }

    /**
     * Create new user
     */
    async createUser() {
        // Get form values
        const username = document.getElementById('createUsername')?.value.trim();
        const firstName = document.getElementById('createFirstName')?.value.trim();
        const lastName = document.getElementById('createLastName')?.value.trim();
        const email = document.getElementById('createEmail')?.value.trim();
        const password = document.getElementById('createPassword')?.value;

        // Client-side validation
        const validationErrors = this.validateCreateUserData({
            username, firstName, lastName, email, password
        });

        if (validationErrors.length > 0) {
            UIHelper.showAlert(validationErrors.join('<br>'), 'warning');
            return;
        }

        // Prepare data according to CreateUserDTO
        const userData = {
            username,
            firstName,
            lastName,
            email,
            password
        };

        UIHelper.showLoading();

        try {
            const newUser = await this.api.post('/api/users', userData);
            UIHelper.hideLoading();
            
            UIHelper.showAlert('User created successfully!', 'success');
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('createUserModal'));
            modal?.hide();
            UIHelper.clearForm('createUserForm');
            
            // Refresh user list if showing all users
            const userCount = document.getElementById('userCount')?.textContent;
            if (userCount?.includes('total')) {
                this.loadAllUsers();
            }
        } catch (error) {
            UIHelper.hideLoading();
            
            // Handle specific error cases
            if (this.isConflictError(error)) {
                const conflict = this.parseConflictError(error);
                
                // Show specific conflict message
                UIHelper.showAlert(conflict.message, 'warning');
                
                // Highlight the conflicting field
                if (conflict.type === 'username') {
                    const usernameField = document.getElementById('createUsername');
                    const usernameError = document.getElementById('usernameError');
                    if (usernameField && usernameError) {
                        usernameField.classList.add('is-invalid');
                        usernameError.textContent = `Username "${conflict.value}" is already taken`;
                        usernameError.style.display = 'block';
                        
                        // Clear error when user starts typing
                        usernameField.addEventListener('input', function clearError() {
                            usernameField.classList.remove('is-invalid');
                            usernameError.style.display = 'none';
                            usernameField.removeEventListener('input', clearError);
                        });
                    }
                } else if (conflict.type === 'email') {
                    const emailField = document.getElementById('createEmail');
                    const emailError = document.getElementById('emailError');
                    if (emailField && emailError) {
                        emailField.classList.add('is-invalid');
                        emailError.textContent = `Email "${conflict.value}" is already registered`;
                        emailError.style.display = 'block';
                        
                        // Clear error when user starts typing
                        emailField.addEventListener('input', function clearError() {
                            emailField.classList.remove('is-invalid');
                            emailError.style.display = 'none';
                            emailField.removeEventListener('input', clearError);
                        });
                    }
                }
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to create users.', 'warning');
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Failed to create user: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Validate create user data according to DTO constraints
     * @param {Object} userData - User data to validate
     * @returns {Array} - Array of validation error messages
     */
    validateCreateUserData({ username, firstName, lastName, email, password }) {
        const errors = [];

        // Username validation
        if (!username) {
            errors.push('Username is required');
        } else if (username.length < 3 || username.length > 50) {
            errors.push('Username must be between 3 and 50 characters');
        }

        // First name validation
        if (!firstName) {
            errors.push('First name is required');
        } else if (firstName.length > 30) {
            errors.push('First name must not exceed 30 characters');
        }

        // Last name validation
        if (!lastName) {
            errors.push('Last name is required');
        } else if (lastName.length > 30) {
            errors.push('Last name must not exceed 30 characters');
        }

        // Email validation
        if (!email) {
            errors.push('Email is required');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push('Invalid email format');
            }
        }

        // Password validation
        if (!password) {
            errors.push('Password is required');
        } else {
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
            if (!passwordRegex.test(password)) {
                errors.push('Password must be at least 8 characters long, contain at least 1 letter and 1 number');
            }
        }

        return errors;
    }

    /**
     * Escape HTML to prevent XSS in onclick handlers
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    /**
     * Edit user (show modal)
     * @param {number} id - User ID
     * @param {string} username - Username
     * @param {string} email - Email
     * @param {string} role - User role
     */
    editUser(id, username, email, role) {
        document.getElementById('editUserId').value = id;
        document.getElementById('editUsername').value = '';
        document.getElementById('editEmail').value = '';
        document.getElementById('editPassword').value = '';
        document.getElementById('editRole').value = '';
        
        // Show current values as placeholders
        document.getElementById('editUsername').placeholder = `Current: ${username}`;
        document.getElementById('editEmail').placeholder = `Current: ${email}`;
        
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    }

    /**
     * Update user
     */
    async updateUser() {
        const userId = document.getElementById('editUserId')?.value;
        const updateData = {};
        
        const username = document.getElementById('editUsername')?.value.trim();
        const email = document.getElementById('editEmail')?.value.trim();
        const password = document.getElementById('editPassword')?.value;
        const role = document.getElementById('editRole')?.value;

        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (role) updateData.role = role;

        if (Object.keys(updateData).length === 0) {
            UIHelper.showAlert('Please enter at least one field to update', 'warning');
            return;
        }

        try {
            await this.api.put(`/api/users/${userId}`, updateData);
            
            UIHelper.showAlert('User updated successfully!', 'success');
            
            // Close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal?.hide();
            
            // Refresh current view
            this.refreshCurrentView();
        } catch (error) {
            UIHelper.showAlert(error.message, 'danger');
        }
    }

    /**
     * Delete user (show confirmation)
     * @param {number} id - User ID
     * @param {string} username - Username
     */
    deleteUser(id, username) {
        document.getElementById('deleteUserId').value = id;
        UIHelper.updateText('deleteUserName', username);
        
        const modal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
        modal.show();
    }

    /**
     * Confirm delete user
     */
    async confirmDeleteUser() {
        const userId = document.getElementById('deleteUserId')?.value;

        if (!userId) {
            UIHelper.showAlert('No user selected for deletion', 'warning');
            return;
        }

        UIHelper.showLoading();

        try {
            await this.api.delete(`/api/users/${userId}`);
            UIHelper.hideLoading();
            
            UIHelper.showAlert('User deleted successfully!', 'success');
            
            // Close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
            modal?.hide();
            
            // Refresh current view
            this.refreshCurrentView();
        } catch (error) {
            UIHelper.hideLoading();
            
            // Handle specific error cases
            if (this.isNotFoundError(error)) {
                UIHelper.showAlert('User not found. They may have already been deleted.', 'info');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to delete users.', 'warning');
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Failed to delete user: ${errorMessage}`, 'danger');
            }
            
            // Close modal even on error
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
            modal?.hide();
        }
    }

    /**
     * Refresh current view based on what was last displayed
     */
    refreshCurrentView() {
        const userCount = document.getElementById('userCount')?.textContent;
        
        if (userCount?.includes('total')) {
            this.loadAllUsers();
        } else if (userCount?.includes('found')) {
            const searchId = document.getElementById('searchById')?.value;
            const searchUsername = document.getElementById('searchByUsername')?.value;
            
            if (searchId) {
                this.searchUserById();
            } else if (searchUsername) {
                this.searchUserByUsername();
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const userManagementController = new UserManagementController();
    userManagementController.init();
});
