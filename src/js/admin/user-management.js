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
            UIHelper.showAlert(error.message, 'danger');
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
            const users = await this.api.get(`/api/users/username/${username}`);
            UIHelper.hideLoading();
            this.displayUsers(users);
            UIHelper.updateText('userCount', `${users.length} user(s) found`);
        } catch (error) {
            UIHelper.hideLoading();
            UIHelper.showAlert(error.message, 'danger');
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
                                onclick="editUser(${user.id}, '${user.username}', '${user.email}', '${user.role}')"
                                title="Edit User">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="deleteUser(${user.id}, '${user.username}')"
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
        const userData = {
            username: document.getElementById('createUsername')?.value.trim(),
            email: document.getElementById('createEmail')?.value.trim(),
            password: document.getElementById('createPassword')?.value,
            role: document.getElementById('createRole')?.value
        };

        // Validation
        if (!userData.username || !userData.email || !userData.password || !userData.role) {
            UIHelper.showAlert('Please fill in all required fields', 'warning');
            return;
        }

        try {
            await authService.register(userData);
            
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
            UIHelper.showAlert(error.message, 'danger');
        }
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

        try {
            await this.api.delete(`/api/users/${userId}`);
            
            UIHelper.showAlert('User deleted successfully!', 'success');
            
            // Close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
            modal?.hide();
            
            // Refresh current view
            this.refreshCurrentView();
        } catch (error) {
            UIHelper.showAlert(error.message, 'danger');
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
