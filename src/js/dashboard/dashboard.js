/**
 * Dashboard Controller
 * Handles main dashboard functionality and navigation
 */

class DashboardController {
    constructor() {
        this.userData = null;
        this.isAdmin = false;
        this.api = apiClient; // Use the same API client as other pages
    }

    /**
     * Initialize dashboard
     */
    async init() {
        // Check authentication
        if (!JWTHelper.requireAuth()) {
            return;
        }

        try {
            await this.initializeUserInterface();
            this.setupEventListeners();
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            UIHelper.showError('Failed to initialize dashboard');
        }
    }

    /**
     * Initialize user interface based on user data
     */
    async initializeUserInterface() {
        const userWelcome = document.getElementById('userWelcome');
        const roleDescription = document.getElementById('roleDescription');
        
        this.userData = await authService.getCurrentUser();
        
        if (this.userData && this.userData.username) {
            const username = this.userData.username;
            const userRole = this.userData.role;
            
            UIHelper.updateText('userWelcome', `Welcome, ${username}!`);
            
            this.isAdmin = authService.isAdmin(this.userData);
            
            if (this.isAdmin) {
                UIHelper.toggleElement('adminMenu', true);
                UIHelper.updateHTML('roleDescription', 
                    `<i class="bi bi-shield-check text-warning me-2"></i>Welcome, <strong>${username}</strong>! You have administrator access to manage the entire system.`);
                this.loadAdminStats();
            } else {
                UIHelper.toggleElement('userMenu', true);
                UIHelper.updateHTML('roleDescription', 
                    `<i class="bi bi-person-circle text-primary me-2"></i>Welcome, <strong>${username}</strong>! Create orders and manage your purchase history.`);
                this.loadUserStats();
            }
        } else {
            // Fallback to JWT parsing
            const jwtUserInfo = JWTHelper.getUserInfo();
            const username = jwtUserInfo?.sub || 'User';
            
            UIHelper.updateText('userWelcome', `Welcome, ${username}!`);
            UIHelper.toggleElement('userMenu', true);
            UIHelper.updateHTML('roleDescription', 
                `<i class="bi bi-person-circle text-primary me-2"></i>Welcome, <strong>${username}</strong>! Create orders and manage your purchase history.`);
            this.loadUserStats();
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

        // Make navigation functions globally available
        window.navigateToSection = this.navigateToSection.bind(this);
        window.showDashboard = this.showDashboard.bind(this);
    }

    /**
     * Navigate to specific section
     * @param {string} section - Section identifier
     */
    navigateToSection(section) {
        UIHelper.toggleElement('userMenu', false);
        UIHelper.toggleElement('adminMenu', false);
        UIHelper.toggleElement('contentArea', true);
        
        const contentTitle = document.getElementById('contentTitle');
        const contentBody = document.getElementById('contentBody');
        
        switch(section) {
            // User sections
            case 'products':
                this.renderProductsSection(contentTitle, contentBody);
                break;
            case 'create-order':
                // Redirect to the dedicated create order page
                window.location.href = '/create-order';
                break;
            case 'my-orders':
                // Redirect to the dedicated order history page
                window.location.href = '/order-history';
                break;
            
            // Admin sections
            case 'admin-products':
                // Redirect to the dedicated product management page
                window.location.href = '/admin/products';
                break;
            case 'admin-users':
                // Redirect to dedicated user management page
                window.location.href = '/admin/users';
                break;
            case 'admin-orders':
                // Redirect to the dedicated order management page
                window.location.href = '/admin/orders';
                break;
            case 'admin-analytics':
                this.renderAdminAnalyticsSection(contentTitle, contentBody);
                break;
            case 'admin-reports':
                this.renderAdminReportsSection(contentTitle, contentBody);
                break;
            default:
                contentTitle.textContent = 'Unknown Section';
                contentBody.innerHTML = '<div class="text-center text-danger"><p>Section not found.</p></div>';
        }
    }

    /**
     * Show main dashboard
     */
    async showDashboard() {
        UIHelper.toggleElement('contentArea', false);
        
        const userData = await authService.getCurrentUser();
        const isAdmin = authService.isAdmin(userData);
        
        if (isAdmin) {
            UIHelper.toggleElement('adminMenu', true);
            UIHelper.toggleElement('userMenu', false);
            this.loadAdminStats();
        } else {
            UIHelper.toggleElement('userMenu', true);
            UIHelper.toggleElement('adminMenu', false);
            this.loadUserStats();
        }
    }

    /**
     * Load admin statistics
     */
    async loadAdminStats() {
        try {
            // Make sure we have authentication before making API calls
            if (!this.api.token) {
                console.error('No authentication token available');
                UIHelper.showError('Authentication required to load statistics');
                return;
            }
            
            // Load statistics from APIs with individual error handling
            const products = await this.fetchProducts();
            const users = await this.fetchUsers();
            const orders = await this.fetchOrders();

            // Update product count
            const productCount = products ? products.length : 0;
            UIHelper.updateText('totalProducts', productCount.toString());

            // Update user count
            const userCount = users ? users.length : 0;
            UIHelper.updateText('totalUsers', userCount.toString());

            // Update order count and calculate revenue
            if (orders && orders.length > 0) {
                const orderCount = orders.length;
                UIHelper.updateText('totalOrders', orderCount.toString());
                
                // Calculate total revenue
                const totalRevenue = orders.reduce((sum, order) => {
                    const orderTotal = this.calculateOrderTotal(order);
                    return sum + orderTotal;
                }, 0);
                
                UIHelper.updateText('totalRevenue', `$${totalRevenue.toFixed(2)}`);
            } else {
                UIHelper.updateText('totalOrders', '0');
                UIHelper.updateText('totalRevenue', '$0.00');
            }
        } catch (error) {
            console.error('Failed to load admin statistics:', error);
            UIHelper.updateText('totalProducts', '--');
            UIHelper.updateText('totalUsers', '--');
            UIHelper.updateText('totalOrders', '--');
            UIHelper.updateText('totalRevenue', '$--');
            UIHelper.showError('Failed to load statistics');
        }
    }

    /**
     * Load user statistics
     */
    async loadUserStats() {
        try {
            // Get current user's orders
            const orders = await this.fetchUserOrders();
            
            if (orders && orders.length > 0) {
                UIHelper.updateText('userTotalOrders', orders.length.toString());
                
                // Count pending orders
                const pendingOrders = orders.filter(order => 
                    order.status && order.status.toLowerCase() === 'pending'
                ).length;
                UIHelper.updateText('userPendingOrders', pendingOrders.toString());
                
                // Find most recent order
                const sortedOrders = orders.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.orderDate || a.created_at);
                    const dateB = new Date(b.createdAt || b.orderDate || b.created_at);
                    return dateB - dateA;
                });
                
                if (sortedOrders.length > 0) {
                    const recentOrder = sortedOrders[0];
                    const orderDate = new Date(recentOrder.createdAt || recentOrder.orderDate || recentOrder.created_at);
                    const daysAgo = Math.floor((new Date() - orderDate) / (1000 * 60 * 60 * 24));
                    
                    let recentOrderText = 'Today';
                    if (daysAgo === 1) {
                        recentOrderText = '1 day ago';
                    } else if (daysAgo > 1) {
                        recentOrderText = `${daysAgo} days ago`;
                    }
                    
                    UIHelper.updateText('userRecentOrder', recentOrderText);
                } else {
                    UIHelper.updateText('userRecentOrder', 'No orders');
                }
            } else {
                UIHelper.updateText('userTotalOrders', '0');
                UIHelper.updateText('userPendingOrders', '0');
                UIHelper.updateText('userRecentOrder', 'No orders');
            }
        } catch (error) {
            console.error('Failed to load user statistics:', error);
            UIHelper.updateText('userTotalOrders', '--');
            UIHelper.updateText('userPendingOrders', '--');
            UIHelper.updateText('userRecentOrder', '--');
        }
    }

    // Section rendering methods
    renderProductsSection(title, body) {
        title.innerHTML = '<i class="bi bi-shop me-2"></i>Browse Products';
        body.innerHTML = `
            <div class="text-center">
                <i class="bi bi-shop display-1 text-muted mb-3"></i>
                <h4>Product Catalog</h4>
                <p class="text-muted">Product browsing functionality will be implemented here.</p>
                <p>Features will include:</p>
                <ul class="list-unstyled">
                    <li><i class="bi bi-check-circle text-success me-2"></i>Product search and filtering</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Product details and images</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Add to cart functionality</li>
                </ul>
            </div>`;
    }

    renderCreateOrderSection(title, body) {
        title.innerHTML = '<i class="bi bi-cart-plus me-2"></i>Create Order';
        body.innerHTML = `
            <div class="text-center">
                <i class="bi bi-cart-plus display-1 text-muted mb-3"></i>
                <h4>Order Creation</h4>
                <p class="text-muted">Order creation functionality will be implemented here.</p>
                <p>Features will include:</p>
                <ul class="list-unstyled">
                    <li><i class="bi bi-check-circle text-success me-2"></i>Shopping cart management</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Order summary and checkout</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Payment processing</li>
                </ul>
            </div>`;
    }

    renderMyOrdersSection(title, body) {
        title.innerHTML = '<i class="bi bi-receipt me-2"></i>My Orders';
        body.innerHTML = `
            <div class="text-center">
                <i class="bi bi-receipt display-1 text-muted mb-3"></i>
                <h4>Order History</h4>
                <p class="text-muted">User order history will be displayed here.</p>
                <p>Features will include:</p>
                <ul class="list-unstyled">
                    <li><i class="bi bi-check-circle text-success me-2"></i>Order status tracking</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Order details and receipts</li>
                    <li><i class="bi bi-check-circle text-success me-2"></i>Reorder functionality</li>
                </ul>
            </div>`;
    }

    renderAdminProductsSection(title, body) {
        title.innerHTML = '<i class="bi bi-box-seam me-2"></i>Product Management';
        body.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card border-primary">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0"><i class="bi bi-plus-circle me-2"></i>Product Operations</h6>
                        </div>
                        <div class="card-body">
                            <p>Comprehensive product management tools:</p>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Add new products</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Edit product details</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Manage inventory levels</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Set pricing and discounts</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Upload product images</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="bi bi-graph-up me-2"></i>Product Analytics</h6>
                        </div>
                        <div class="card-body">
                            <p>Product performance insights:</p>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Sales performance</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Inventory turnover</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Popular products</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Stock alerts</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    renderAdminOrdersSection(title, body) {
        title.innerHTML = '<i class="bi bi-clipboard-data me-2"></i>Order Management';
        body.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card border-success">
                        <div class="card-header bg-success text-white">
                            <h6 class="mb-0"><i class="bi bi-list-check me-2"></i>Order Processing</h6>
                        </div>
                        <div class="card-body">
                            <p>Complete order management system:</p>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>View all orders</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Update order status</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Process refunds</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Manage shipping</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Customer communications</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="bi bi-graph-up-arrow me-2"></i>Order Analytics</h6>
                        </div>
                        <div class="card-body">
                            <p>Order performance insights:</p>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Sales trends</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Order fulfillment metrics</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Customer satisfaction</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Revenue reports</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    renderAdminAnalyticsSection(title, body) {
        title.innerHTML = '<i class="bi bi-bar-chart me-2"></i>Sales Analytics';
        body.innerHTML = `
            <div class="row">
                <div class="col-12 mb-4">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <h6 class="mb-0"><i class="bi bi-graph-up me-2"></i>Sales Dashboard</h6>
                        </div>
                        <div class="card-body text-center">
                            <i class="bi bi-bar-chart display-1 text-muted mb-3"></i>
                            <h4>Advanced Sales Analytics</h4>
                            <p class="text-muted">Comprehensive sales analysis and reporting tools.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6><i class="bi bi-calendar-week me-2"></i>Time-based Reports</h6>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Daily sales trends</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Monthly comparisons</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Seasonal analysis</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6><i class="bi bi-people me-2"></i>Customer Analytics</h6>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i>Customer demographics</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Purchase behavior</li>
                                <li><i class="bi bi-check-circle text-success me-2"></i>Lifetime value</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    renderAdminReportsSection(title, body) {
        title.innerHTML = '<i class="bi bi-file-earmark-text me-2"></i>System Reports';
        body.innerHTML = `
            <div class="row">
                <div class="col-12 mb-4">
                    <div class="card border-secondary">
                        <div class="card-header bg-secondary text-white">
                            <h6 class="mb-0"><i class="bi bi-download me-2"></i>Report Generation</h6>
                        </div>
                        <div class="card-body text-center">
                            <i class="bi bi-file-earmark-text display-1 text-muted mb-3"></i>
                            <h4>System Reports</h4>
                            <p class="text-muted">Generate and download comprehensive system reports.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-file-earmark-spreadsheet text-success display-4 mb-2"></i>
                            <h6>Financial Reports</h6>
                            <p class="small text-muted">Revenue, profit margins, tax reports</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-file-earmark-bar-graph text-primary display-4 mb-2"></i>
                            <h6>Inventory Reports</h6>
                            <p class="small text-muted">Stock levels, movement, reorder points</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-file-earmark-person text-warning display-4 mb-2"></i>
                            <h6>Customer Reports</h6>
                            <p class="small text-muted">Customer activity, preferences, demographics</p>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    /**
     * Fetch products from API
     */
    async fetchProducts() {
        try {
            // Use admin endpoint for dashboard statistics
            return await this.api.get('/api/products');
        } catch (error) {
            console.error('Error fetching products:', error);
            return null;
        }
    }

    /**
     * Fetch users from API
     */
    async fetchUsers() {
        try {
            return await this.api.get('/api/users');
        } catch (error) {
            console.error('Error fetching users:', error);
            return null;
        }
    }

    /**
     * Fetch all orders from API
     */
    async fetchOrders() {
        try {
            return await this.api.get('/api/orders');
        } catch (error) {
            console.error('Error fetching orders:', error);
            return null;
        }
    }

    /**
     * Fetch user-specific orders from API
     */
    async fetchUserOrders() {
        try {
            const allOrders = await this.api.get('/api/orders/me');
            // Filter orders for current user
            if (this.userData && this.userData.id && allOrders) {
                return allOrders.filter(order => 
                    order.userId === this.userData.id || 
                    order.user_id === this.userData.id ||
                    order.customerId === this.userData.id ||
                    order.customer_id === this.userData.id
                );
            }
            return allOrders || [];
        } catch (error) {
            console.error('Error fetching user orders:', error);
            return null;
        }
    }

    /**
     * Calculate total for an order
     */
    calculateOrderTotal(order) {
        if (!order) {
            return 0;
        }

        // Try different property names for total
        if (order.totalCost !== undefined && order.totalCost !== null) {
            return parseFloat(order.totalCost) || 0;
        }
        if (order.total !== undefined && order.total !== null) {
            return parseFloat(order.total) || 0;
        }
        if (order.totalAmount !== undefined && order.totalAmount !== null) {
            return parseFloat(order.totalAmount) || 0;
        }
        if (order.amount !== undefined && order.amount !== null) {
            return parseFloat(order.amount) || 0;
        }

        // Calculate from orderProducts if available
        if (order.orderProducts && Array.isArray(order.orderProducts)) {
            return order.orderProducts.reduce((sum, item) => {
                const price = parseFloat(item.productPrice || item.price || item.unitPrice || 0);
                const quantity = parseInt(item.productQuantity || item.quantity || 1);
                return sum + (price * quantity);
            }, 0);
        }

        // Calculate from items if available
        if (order.items && Array.isArray(order.items)) {
            return order.items.reduce((sum, item) => {
                const price = parseFloat(item.price || item.unitPrice || 0);
                const quantity = parseInt(item.quantity || 1);
                return sum + (price * quantity);
            }, 0);
        }

        // Calculate from products if available
        if (order.products && Array.isArray(order.products)) {
            return order.products.reduce((sum, product) => {
                const price = parseFloat(product.price || product.unitPrice || 0);
                const quantity = parseInt(product.quantity || 1);
                return sum + (price * quantity);
            }, 0);
        }

        return 0;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const dashboardController = new DashboardController();
    dashboardController.init();
});
