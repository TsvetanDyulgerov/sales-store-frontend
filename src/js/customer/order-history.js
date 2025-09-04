/**
 * Order History Controller
 * Handles customer order history functionality
 */

class OrderHistoryController {
    constructor() {
        this.api = apiClient;
        this.allOrders = [];
        this.filteredOrders = [];
        this.currentUser = null;
    }

    /**
     * Initialize the order history system
     */
    async init() {
        try {
            // Check authentication
            if (!JWTHelper.requireAuth()) {
                return;
            }

            console.log('Initializing Order History System...');
            
            // Get current user data
            this.currentUser = await authService.getCurrentUser();
            if (this.currentUser && this.currentUser.username) {
                UIHelper.updateText('userWelcome', this.currentUser.username);
            }

            // Setup event listeners
            this.setupEventListeners();

            // Load user orders
            await this.loadUserOrders();

            console.log('Order History System initialized successfully');
        } catch (error) {
            console.error('Error during Order History System initialization:', error);
            UIHelper.showAlert('Failed to initialize order history. Please refresh the page.', 'danger');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Status filter change
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        // Global functions for buttons
        window.orderHistoryController = this;
    }

    /**
     * Load user orders from API
     */
    async loadUserOrders() {
        try {
            console.log('Loading user orders...');
            console.log('Current user:', this.currentUser);
            console.log('API token present:', !!this.api.token);
            
            UIHelper.toggleElement('loadingSpinner', true);
            UIHelper.toggleElement('ordersSection', false);
            UIHelper.toggleElement('noOrdersMessage', false);

            const orders = await this.api.get('/api/orders/me');
            console.log('Orders API response:', orders);
            console.log('Orders type:', typeof orders);
            console.log('Orders array check:', Array.isArray(orders));
            
            if (orders && Array.isArray(orders) && orders.length > 0) {
                console.log('Processing', orders.length, 'orders');
                console.log('First order sample:', orders[0]);
                this.allOrders = orders;
                this.filteredOrders = [...orders];
                
                // Display orders
                this.displayOrders();
                
                UIHelper.updateText('orderCount', `${orders.length} order(s)`);
                UIHelper.toggleElement('ordersSection', true);
            } else if (orders && Array.isArray(orders) && orders.length === 0) {
                console.log('Empty orders array received');
                this.allOrders = [];
                this.filteredOrders = [];
                UIHelper.updateText('orderCount', '0 orders');
                UIHelper.toggleElement('noOrdersMessage', true);
            } else {
                console.log('Unexpected response format:', orders);
                this.allOrders = [];
                this.filteredOrders = [];
                UIHelper.updateText('orderCount', '0 orders');
                UIHelper.toggleElement('noOrdersMessage', true);
            }

            UIHelper.toggleElement('loadingSpinner', false);
        } catch (error) {
            console.error('Error loading orders:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                stack: error.stack
            });
            UIHelper.toggleElement('loadingSpinner', false);
            
            // Check if it's an authentication error
            if (error.status === 401 || error.status === 403) {
                UIHelper.showAlert('Please log in to view your order history.', 'warning');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                UIHelper.toggleElement('noOrdersMessage', true);
                UIHelper.showAlert('Failed to load order history. Please try again.', 'danger');
            }
        }
    }

    /**
     * Display orders in the table
     */
    displayOrders() {
        const tableBody = document.getElementById('ordersTableBody');
        if (!tableBody) return;

        if (this.filteredOrders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="bi bi-inbox display-6"></i>
                        <p class="mt-2">No orders found matching your criteria</p>
                    </td>
                </tr>
            `;
            return;
        }

        const ordersHtml = this.filteredOrders.map(order => {
            console.log('Processing order:', order);
            
            // Try different date field names
            const orderDate = order.orderDate || order.createdAt || order.date || order.created_at;
            const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : 'N/A';
            
            // Use the correct field names based on admin implementation
            const orderProducts = order.orderProducts || order.items || order.products || order.orderItems || [];
            const itemCount = orderProducts.length || 0;
            
            // Try different total field names (same as admin)
            let total = 0;
            const possibleTotalFields = [
                'totalAmount', 'totalamount', 'total_amount', 'amount', 'total', 'orderTotal', 'totalPrice'
            ];
            
            for (const field of possibleTotalFields) {
                if (order[field] !== undefined && order[field] !== null) {
                    const value = parseFloat(order[field]);
                    if (!isNaN(value) && value > 0) {
                        total = value;
                        break;
                    }
                }
            }
            
            // If no total field found, calculate from products
            if (total === 0 && orderProducts.length > 0) {
                total = orderProducts.reduce((sum, item) => {
                    const unitPrice = parseFloat(item.unitPrice || item.price || item.productPrice || item.cost || 0);
                    const quantity = parseInt(item.orderedQuantity || item.quantity || item.productQuantity || item.amount || 0);
                    return sum + (unitPrice * quantity);
                }, 0);
            }
            
            // Status with fallback
            const status = order.status || 'UNKNOWN';
            
            // ID with fallback (same as admin)
            const orderId = order.uuid || order.id || order.orderId || 'N/A';

            return `
                <tr>
                    <td>
                        <span class="text-primary fw-bold">#${orderId}</span>
                    </td>
                    <td>${formattedDate}</td>
                    <td>
                        <span class="badge bg-light text-dark">${itemCount} item(s)</span>
                    </td>
                    <td>
                        <span class="fw-bold">$${Number(total).toFixed(2)}</span>
                    </td>
                    <td>
                        <span class="badge ${this.getStatusBadgeClass(status)}">${status}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="orderHistoryController.showOrderDetails('${orderId}')">
                            <i class="bi bi-eye me-1"></i>View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = ordersHtml;
    }

    /**
     * Get CSS class for status badge
     */
    getStatusBadgeClass(status) {
        switch (status.toUpperCase()) {
            case 'PENDING':
                return 'bg-warning text-dark';
            case 'CONFIRMED':
                return 'bg-info text-white';
            case 'PROCESSING':
                return 'bg-primary text-white';
            case 'SHIPPED':
                return 'bg-secondary text-white';
            case 'DELIVERED':
                return 'bg-success text-white';
            case 'CANCELLED':
                return 'bg-danger text-white';
            default:
                return 'bg-light text-dark';
        }
    }

    /**
     * Apply filters to orders (simplified - only status filter)
     */
    applyFilters() {
        const statusFilter = document.getElementById('statusFilter')?.value;

        console.log('Applying status filter:', statusFilter);

        this.filteredOrders = this.allOrders.filter(order => {
            // Status filter
            if (statusFilter && order.status !== statusFilter) {
                return false;
            }
            return true;
        });

        this.displayOrders();
        UIHelper.updateText('orderCount', `${this.filteredOrders.length} order(s) found`);

        if (this.filteredOrders.length === 0 && this.allOrders.length > 0) {
            UIHelper.showAlert('No orders match your filter criteria', 'info');
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('statusFilter').value = '';
        
        this.filteredOrders = [...this.allOrders];
        this.displayOrders();
        UIHelper.updateText('orderCount', `${this.allOrders.length} order(s)`);
    }

    /**
     * Show order details in modal
     */
    async showOrderDetails(orderId) {
        try {
            console.log('Showing details for order:', orderId);
            
            // Find order in current data first (use same ID matching as admin)
            const order = this.allOrders.find(o => (o.uuid || o.id || o.orderId) == orderId);
            
            if (!order) {
                UIHelper.showAlert('Order not found', 'danger');
                return;
            }

            // Build order details HTML
            const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A';
            const orderTime = order.orderDate ? new Date(order.orderDate).toLocaleTimeString() : 'N/A';
            const status = order.status || 'UNKNOWN';
            
            // Calculate total using the same logic as displayOrders
            let total = 0;
            const possibleTotalFields = [
                'totalAmount', 'totalamount', 'total_amount', 'amount', 'total', 'orderTotal', 'totalPrice'
            ];
            
            for (const field of possibleTotalFields) {
                if (order[field] !== undefined && order[field] !== null) {
                    const value = parseFloat(order[field]);
                    if (!isNaN(value) && value > 0) {
                        total = value;
                        break;
                    }
                }
            }

            // Get order products using correct field names
            const orderProducts = order.orderProducts || order.items || order.products || order.orderItems || [];
            
            let itemsHtml = '';
            if (orderProducts.length > 0) {
                itemsHtml = orderProducts.map(item => {
                    // Use correct field names from admin implementation
                    const unitPrice = parseFloat(item.unitPrice || item.price || item.productPrice || item.cost || 0);
                    const quantity = parseInt(item.orderedQuantity || item.quantity || item.productQuantity || item.amount || 0);
                    const itemTotal = unitPrice * quantity;
                    
                    return `
                        <tr>
                            <td>${item.productName || item.name || 'Unknown Product'}</td>
                            <td class="text-center">${quantity}</td>
                            <td class="text-end">$${unitPrice.toFixed(2)}</td>
                            <td class="text-end fw-bold">$${itemTotal.toFixed(2)}</td>
                        </tr>
                    `;
                }).join('');
                
                // Calculate total from items if not found in order fields
                if (total === 0) {
                    total = orderProducts.reduce((sum, item) => {
                        const unitPrice = parseFloat(item.unitPrice || item.price || item.productPrice || item.cost || 0);
                        const quantity = parseInt(item.orderedQuantity || item.quantity || item.productQuantity || item.amount || 0);
                        return sum + (unitPrice * quantity);
                    }, 0);
                }
            } else {
                itemsHtml = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">No items found</td>
                    </tr>
                `;
            }

            const modalContent = `
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="fw-bold">Order Information</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Order ID:</strong></td>
                                <td>#${orderId}</td>
                            </tr>
                            <tr>
                                <td><strong>Date:</strong></td>
                                <td>${orderDate}</td>
                            </tr>
                            <tr>
                                <td><strong>Time:</strong></td>
                                <td>${orderTime}</td>
                            </tr>
                            <tr>
                                <td><strong>Status:</strong></td>
                                <td><span class="badge ${this.getStatusBadgeClass(status)}">${status}</span></td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold">Order Summary</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Items:</strong></td>
                                <td>${orderProducts.length}</td>
                            </tr>
                            <tr>
                                <td><strong>Total Amount:</strong></td>
                                <td class="fw-bold text-primary">$${Number(total).toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <hr>
                
                <h6 class="fw-bold">Order Items</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead class="table-light">
                            <tr>
                                <th>Product</th>
                                <th class="text-center">Quantity</th>
                                <th class="text-end">Unit Price</th>
                                <th class="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('orderDetailsContent').innerHTML = modalContent;
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
            modal.show();

        } catch (error) {
            console.error('Error showing order details:', error);
            UIHelper.showAlert('Failed to load order details', 'danger');
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const orderHistoryController = new OrderHistoryController();
    await orderHistoryController.init();
});
