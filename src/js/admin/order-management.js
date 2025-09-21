/**
 * Order Management Controller
 * Handles admin order management functionality
 */

class OrderManagementController {
    constructor() {
        this.api = apiClient;
        this.currentOrders = [];
        this.availableProducts = [];
        this.orderItemCount = 0;
    }

    /**
     * Extract error message from different error structures
     */
    getErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }

        if (error.message) {
            if (typeof error.message === 'object') {
                if (error.message.error && error.message.error.message) {
                    return error.message.error.message;
                }
                if (error.message.message) {
                    return error.message.message;
                }
                return JSON.stringify(error.message);
            }
            return error.message;
        }

        if (error.error && error.error.message) {
            return error.error.message;
        }

        return error.toString();
    }

    /**
     * Check if error indicates a 404 (not found)
     */
    isNotFoundError(error) {
        const message = this.getErrorMessage(error);
        return (
            error.status === 404 ||
            (error.error && error.error.status === 404) ||
            message.includes('404') ||
            message.toLowerCase().includes('not found') ||
            message.toLowerCase().includes('user not found')
        );
    }

    /**
     * Check if error indicates a 403 (forbidden)
     */
    isForbiddenError(error) {
        const message = this.getErrorMessage(error);
        return (
            error.status === 403 ||
            message.includes('403') ||
            message.toLowerCase().includes('forbidden') ||
            message.toLowerCase().includes('access denied')
        );
    }

    /**
     * Check if error indicates a 401 (unauthorized)
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
     * Initialize the order management system
     */
    async init() {
        try {
            console.log('Initializing Order Management System...');
            
            // Set user welcome message
            const userInfo = authService.getCurrentUser();
            if (userInfo && userInfo.username) {
                UIHelper.updateText('adminWelcome', `Welcome, ${userInfo.username}`);
            }

            // Setup event listeners
            this.setupEventListeners();

            // Load initial data
            await this.loadAvailableProducts();
            await this.loadAllOrders();

            console.log('Order Management System initialized successfully');
        } catch (error) {
            console.error('Error during Order Management System initialization:', error);
            UIHelper.showAlert('Failed to initialize order management system. Please refresh the page.', 'danger');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search event listeners
        UIHelper.addEventListener('searchByUuid', 'keypress', (e) => {
            if (e.key === 'Enter') this.searchOrderByUuid();
        });

        // Bind global functions
        window.searchOrderByUuid = this.searchOrderByUuid.bind(this);
        window.filterOrdersByStatus = this.filterOrdersByStatus.bind(this);
        window.clearSearch = this.clearSearch.bind(this);
        window.loadAllOrders = this.loadAllOrders.bind(this);
        window.viewOrderDetails = this.viewOrderDetails.bind(this);
        window.showUpdateStatusModal = this.showUpdateStatusModal.bind(this);
        window.updateOrderStatus = this.updateOrderStatus.bind(this);
        window.createOrder = this.createOrder.bind(this);
        window.addOrderItem = this.addOrderItem.bind(this);
        window.removeOrderItem = this.removeOrderItem.bind(this);
        window.updateOrderTotal = this.updateOrderTotal.bind(this);
        window.filterProducts = this.filterProducts.bind(this);
        window.refreshProducts = this.refreshProducts.bind(this);
    }

    /**
     * Search order by UUID
     */
    async searchOrderByUuid() {
        const uuid = document.getElementById('searchByUuid')?.value.trim();
        
        if (!uuid) {
            UIHelper.showAlert('Please enter an order UUID', 'warning');
            return;
        }

        UIHelper.showLoading();
        
        try {
            const order = await this.api.get(`/api/orders/${uuid}`);
            UIHelper.hideLoading();
            
            // Backend returns a single order object, not an array
            const orders = Array.isArray(order) ? order : [order];
            
            this.displayOrders(orders);
            UIHelper.updateText('orderCount', `${orders.length} order(s) found`);
        } catch (error) {
            UIHelper.hideLoading();
            
            if (this.isNotFoundError(error)) {
                UIHelper.showAlert(`No order found with UUID: "${uuid}"`, 'info');
                this.displayOrders([]);
                UIHelper.updateText('orderCount', '0 orders found');
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to search for orders.', 'warning');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Error searching for order: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Filter orders by status (client-side filtering)
     */
    filterOrdersByStatus() {
        const status = document.getElementById('filterByStatus')?.value;
        
        if (!status) {
            // Show all orders if no status is selected
            this.displayOrders(this.currentOrders);
            UIHelper.updateText('orderCount', `${this.currentOrders.length} order(s) loaded`);
            return;
        }

        // Filter orders by status on the client side
        const filteredOrders = this.currentOrders.filter(order => 
            order.status && order.status.toLowerCase() === status.toLowerCase()
        );
        
        this.displayOrders(filteredOrders);
        UIHelper.updateText('orderCount', `${filteredOrders.length} order(s) found with status: ${status}`);
        
        if (filteredOrders.length === 0) {
            UIHelper.showAlert(`No orders found with status: "${status}"`, 'info');
        }
    }

    /**
     * Load all orders
     */
    async loadAllOrders() {
        UIHelper.showLoading();
        
        try {
            const orders = await this.api.get('/api/orders');
            UIHelper.hideLoading();
            
            // Debug: Log the first order to see its structure
            if (orders && orders.length > 0) {
                console.log('Sample order structure:', JSON.stringify(orders[0], null, 2));
            }
            
            this.currentOrders = orders;
            this.displayOrders(orders);
            UIHelper.updateText('orderCount', `${orders.length} order(s) loaded`);
        } catch (error) {
            UIHelper.hideLoading();
            
            if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to view orders.', 'warning');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Error loading orders: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Load available products for order creation
     */
    async loadAvailableProducts() {
        try {
            console.log('Loading available products...');
            this.availableProducts = await this.api.get('/api/products');
            console.log(`Loaded ${this.availableProducts.length} products for order creation`);
        } catch (error) {
            console.error('Error loading products:', error);
            this.availableProducts = [];
            UIHelper.showAlert('Failed to load product list. Order creation may not work properly.', 'warning');
        }
    }

    /**
     * Clear search and show all orders
     */
    async clearSearch() {
        document.getElementById('searchByUuid').value = '';
        document.getElementById('filterByStatus').value = '';
        await this.loadAllOrders();
    }

    /**
     * Display orders in table format
     */
    displayOrders(orders) {
        const container = document.getElementById('ordersContainer');
        
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-receipt-x display-1 opacity-25"></i>
                    <h5 class="mt-3">No Orders Found</h5>
                    <p>No orders match your search criteria.</p>
                </div>
            `;
            return;
        }

        const orderRows = orders.map(order => {
            // Get the correct UUID field - try different field names
            const orderUuid = order.uuid || order.id || order.orderId;
            const displayId = order.id || order.uuid || order.orderId;
            
            // Get product list for display
            const orderProducts = order.orderProducts || order.items || order.products || order.orderItems || [];
            const productNames = orderProducts.map(item => 
                item.productName || item.name || 'Unknown Product'
            );
            
            // Limit to 3 products and add "..." if there are more
            let productDisplay = '';
            if (productNames.length === 0) {
                productDisplay = 'No items';
            } else if (productNames.length <= 3) {
                productDisplay = productNames.join(', ');
            } else {
                productDisplay = productNames.slice(0, 3).join(', ') + '...';
            }
            
            return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-receipt me-2 text-primary fs-5"></i>
                        <div>
                            <div class="fw-semibold">${orderUuid || 'N/A'}</div>
                            <small class="text-muted">${productDisplay}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>
                        <div class="fw-semibold">${this.getCustomerDisplayName(order)}</div>
                        <small class="text-muted">${this.getCustomerDisplayEmail(order)}</small>
                    </div>
                </td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(order.status)}">
                        <i class="bi ${this.getStatusIcon(order.status)} me-1"></i>
                        ${order.status || 'UNKNOWN'}
                    </span>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="text-success fw-semibold">$${this.calculateOrderTotal(order).toFixed(2)}</span>
                        <small class="text-muted">${order.orderProducts?.length || order.items?.length || 0} item(s)</small>
                    </div>
                </td>
                <td>
                    <small class="text-muted">
                        ${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                    </small>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails('${orderUuid}')" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="showUpdateStatusModal('${orderUuid}', '${order.status}')" title="Update Status">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        container.innerHTML = `
            <table class="table table-hover">
                <thead class="table-light">
                    <tr>
                        <th>Order UUID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderRows}
                </tbody>
            </table>
        `;
    }

    /**
     * Get CSS class for order status badge
     */
    getStatusBadgeClass(status) {
        switch (status) {
            case 'PENDING':
                return 'bg-warning text-dark';
            case 'IN_PROGRESS':
                return 'bg-info text-dark';
            case 'DONE':
                return 'bg-success';
            default:
                return 'bg-secondary';
        }
    }

    /**
     * Get icon for order status
     */
    getStatusIcon(status) {
        switch (status) {
            case 'PENDING':
                return 'bi-clock';
            case 'IN_PROGRESS':
                return 'bi-arrow-clockwise';
            case 'DONE':
                return 'bi-check-circle';
            default:
                return 'bi-question-circle';
        }
    }

    /**
     * View order details
     */
    async viewOrderDetails(uuid) {
        console.log('Viewing order details for UUID:', uuid);
        
        if (!uuid) {
            UIHelper.showAlert('Error: Order UUID is missing', 'danger');
            return;
        }
        
        try {
            UIHelper.showLoading();
            const order = await this.api.get(`/api/orders/${uuid}`);
            UIHelper.hideLoading();

            const detailsContent = document.getElementById('orderDetailsContent');
            
            // Get the correct UUID field
            const orderUuid = order.uuid || order.id || order.orderId;
            const orderProducts = order.orderProducts || order.items || order.products || order.orderItems || [];
            
            detailsContent.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3">Order Information</h6>
                        <table class="table table-sm">
                            <tr><td><strong>UUID:</strong></td><td>${orderUuid || 'N/A'}</td></tr>
                            <tr><td><strong>ID:</strong></td><td>${order.id || order.uuid || 'N/A'}</td></tr>
                            <tr><td><strong>Status:</strong></td><td><span class="badge ${this.getStatusBadgeClass(order.status)}">${order.status}</span></td></tr>
                            <tr><td><strong>Date:</strong></td><td>${order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}</td></tr>
                            <tr><td><strong>Total:</strong></td><td class="text-success fw-semibold">$${this.calculateOrderTotal(order).toFixed(2)}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3">${this.getCustomerSectionTitle(order)}</h6>
                        <table class="table table-sm">
                            ${this.getCustomerDetailsTable(order)}
                        </table>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-12">
                        <h6 class="text-primary mb-3">Order Items</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead class="table-light">
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${orderProducts.map(item => {
                                        const unitPrice = parseFloat(item.unitPrice || item.price || item.productPrice || 0);
                                        const quantity = parseInt(item.orderedQuantity || item.quantity || item.productQuantity || 0);
                                        const subtotal = unitPrice * quantity;
                                        
                                        return `
                                        <tr>
                                            <td>
                                                <div class="fw-semibold">${item.productName || item.name || 'N/A'}</div>
                                                <small class="text-muted">ID: ${item.productId || item.id || 'N/A'}</small>
                                            </td>
                                            <td>${quantity}</td>
                                            <td>$${unitPrice.toFixed(2)}</td>
                                            <td class="text-success">$${subtotal.toFixed(2)}</td>
                                        </tr>
                                        `;
                                    }).join('') || '<tr><td colspan="4" class="text-muted text-center">No items found</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
            modal.show();
        } catch (error) {
            UIHelper.hideLoading();
            const errorMessage = this.getErrorMessage(error);
            UIHelper.showAlert(`Error loading order details: ${errorMessage}`, 'danger');
        }
    }

    /**
     * Show update status modal
     */
    showUpdateStatusModal(uuid, currentStatus) {
        console.log('Showing update status modal for UUID:', uuid, 'Current status:', currentStatus);
        
        const uuidElement = document.getElementById('statusOrderUuid');
        const currentStatusElement = document.getElementById('currentOrderStatus');
        const newStatusElement = document.getElementById('newOrderStatus');
        
        if (!uuidElement || !currentStatusElement || !newStatusElement) {
            UIHelper.showAlert('Error: Modal elements not found', 'danger');
            return;
        }
        
        if (!uuid || !currentStatus) {
            UIHelper.showAlert('Error: Missing order UUID or status', 'danger');
            return;
        }
        
        uuidElement.textContent = uuid;
        currentStatusElement.textContent = currentStatus;
        currentStatusElement.className = `badge ${this.getStatusBadgeClass(currentStatus)}`;
        newStatusElement.value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
        modal.show();
    }

    /**
     * Update order status
     */
    async updateOrderStatus() {
        const uuidElement = document.getElementById('statusOrderUuid');
        const statusElement = document.getElementById('newOrderStatus');
        
        if (!uuidElement) {
            UIHelper.showAlert('Error: Order UUID element not found', 'danger');
            return;
        }
        
        if (!statusElement) {
            UIHelper.showAlert('Error: Status selection element not found', 'danger');
            return;
        }
        
        const uuid = uuidElement.textContent?.trim();
        const newStatus = statusElement.value?.trim();
        
        console.log('Update order status - UUID:', uuid, 'New Status:', newStatus);
        
        if (!uuid) {
            UIHelper.showAlert('Error: Order UUID is missing', 'danger');
            return;
        }
        
        if (!newStatus) {
            UIHelper.showAlert('Please select a new status', 'warning');
            return;
        }

        try {
            UIHelper.showLoading();
            await this.api.put(`/api/orders/${uuid}/status`, { status: newStatus });
            UIHelper.hideLoading();

            UIHelper.showAlert('Order status updated successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateStatusModal'));
            modal.hide();
            
            // Refresh orders
            await this.loadAllOrders();
        } catch (error) {
            UIHelper.hideLoading();
            const errorMessage = this.getErrorMessage(error);
            UIHelper.showAlert(`Error updating order status: ${errorMessage}`, 'danger');
        }
    }

    /**
     * Add order item to the create order form
     */
    addOrderItem() {
        this.orderItemCount++;
        const container = document.getElementById('orderItemsContainer');
        
        if (!container) {
            console.error('orderItemsContainer element not found!');
            UIHelper.showAlert('Error: Order items container not found', 'danger');
            return;
        }
        
        // Ensure products are available
        if (!this.availableProducts || this.availableProducts.length === 0) {
            UIHelper.showAlert('Loading products... Please try again in a moment.', 'warning');
            this.loadAvailableProducts();
            return;
        }
        
        const productOptions = this.availableProducts.map(product => 
            `<option value="${product.id}" data-price="${product.sellingPrice}" data-name="${product.name.toLowerCase()}">${product.name} ($${parseFloat(product.sellingPrice || 0).toFixed(2)}) - Stock: ${product.availableQuantity || 0}</option>`
        ).join('');

        const itemHtml = `
            <div class="order-item mb-3 p-3 border rounded" id="orderItem_${this.orderItemCount}">
                <div class="row">
                    <div class="col-md-5">
                        <label class="form-label">Product Search</label>
                        <input type="text" class="form-control mb-2" id="productSearch_${this.orderItemCount}" 
                               placeholder="Search by product ID or name..." 
                               onkeyup="filterProducts(${this.orderItemCount})">
                    </div>
                    <div class="col-md-5">
                        <label class="form-label">Product *</label>
                        <select class="form-select" name="productId" id="productSelect_${this.orderItemCount}" onchange="updateOrderTotal()" required>
                            <option value="">Select a product...</option>
                            ${productOptions}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Quantity *</label>
                        <input type="number" class="form-control" name="orderedQuantity" min="1" value="1" onchange="updateOrderTotal()" required>
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-12">
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeOrderItem(${this.orderItemCount})">
                            <i class="bi bi-trash me-1"></i>Remove Item
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHtml);
        this.updateOrderTotal();
    }

    /**
     * Remove order item
     */
    removeOrderItem(itemId) {
        const item = document.getElementById(`orderItem_${itemId}`);
        if (item) {
            item.remove();
            this.updateOrderTotal();
        }
    }

    /**
     * Update order total
     */
    updateOrderTotal() {
        const orderItems = document.querySelectorAll('.order-item');
        let total = 0;

        orderItems.forEach(item => {
            const productSelect = item.querySelector('select[name="productId"]');
            const quantityInput = item.querySelector('input[name="orderedQuantity"]');
            
            if (productSelect.value && quantityInput.value) {
                const selectedOption = productSelect.querySelector(`option[value="${productSelect.value}"]`);
                const price = parseFloat(selectedOption?.getAttribute('data-price') || 0);
                const quantity = parseInt(quantityInput.value || 0);
                total += price * quantity;
            }
        });

        document.getElementById('orderTotal').textContent = `$${total.toFixed(2)}`;
    }

    /**
     * Filter products in dropdown based on search input
     */
    filterProducts(itemId) {
        const searchInput = document.getElementById(`productSearch_${itemId}`);
        const productSelect = document.getElementById(`productSelect_${itemId}`);
        
        if (!searchInput || !productSelect) return;
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        const options = productSelect.querySelectorAll('option');
        
        // Show all options if search is empty
        if (!searchTerm) {
            options.forEach(option => {
                option.style.display = '';
            });
            return;
        }
        
        // Filter options based on search term
        options.forEach(option => {
            if (option.value === '') {
                // Keep the default "Select a product..." option
                option.style.display = '';
                return;
            }
            
            const productId = option.value;
            const productName = option.getAttribute('data-name') || '';
            const optionText = option.textContent.toLowerCase();
            
            // Search by ID or name
            if (productId.includes(searchTerm) || 
                productName.includes(searchTerm) || 
                optionText.includes(searchTerm)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
        
        // Reset selection if current selection is now hidden
        const currentOption = productSelect.querySelector(`option[value="${productSelect.value}"]`);
        if (currentOption && currentOption.style.display === 'none') {
            productSelect.value = '';
            this.updateOrderTotal();
        }
    }

    /**
     * Refresh products list and update all existing order item dropdowns
     */
    async refreshProducts() {
        UIHelper.showAlert('Refreshing product list...', 'info');
        
        try {
            await this.loadAvailableProducts();
            
            // Update all existing order item dropdowns
            const orderItems = document.querySelectorAll('.order-item');
            orderItems.forEach((item, index) => {
                const productSelect = item.querySelector('select[name="productId"]');
                if (productSelect) {
                    const currentValue = productSelect.value;
                    
                    // Rebuild options
                    const productOptions = this.availableProducts.map(product => 
                        `<option value="${product.id}" data-price="${product.sellingPrice}" data-name="${product.name.toLowerCase()}">${product.name} ($${parseFloat(product.sellingPrice || 0).toFixed(2)}) - Stock: ${product.availableQuantity || 0}</option>`
                    ).join('');
                    
                    productSelect.innerHTML = `
                        <option value="">Select a product...</option>
                        ${productOptions}
                    `;
                    
                    // Restore previous selection if still available
                    if (currentValue && productSelect.querySelector(`option[value="${currentValue}"]`)) {
                        productSelect.value = currentValue;
                    }
                }
            });
            
            this.updateOrderTotal();
            UIHelper.showAlert(`Product list refreshed! ${this.availableProducts.length} products available.`, 'success');
        } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            UIHelper.showAlert(`Error refreshing products: ${errorMessage}`, 'danger');
        }
    }

    /**
     * Create new order
     */
    async createOrder() {
        const form = document.getElementById('createOrderForm');
        const formData = new FormData(form);
        
        // Validate username
        const assignedUsername = document.getElementById('assignedUsername').value.trim();

        if (!assignedUsername) {
            UIHelper.showAlert('Please enter a username to assign the order to', 'warning');
            return;
        }

        // Collect order items
        const orderItems = [];
        const orderItemElements = document.querySelectorAll('.order-item');
        
        for (const item of orderItemElements) {
            const productId = item.querySelector('select[name="productId"]').value;
            const orderedQuantity = item.querySelector('input[name="orderedQuantity"]').value;
            
            if (!productId || !orderedQuantity) {
                UIHelper.showAlert('Please complete all order items', 'warning');
                return;
            }
            
            orderItems.push({
                productId: parseInt(productId),
                productQuantity: parseInt(orderedQuantity)
            });
        }

        if (orderItems.length === 0) {
            UIHelper.showAlert('Please add at least one item to the order', 'warning');
            return;
        }

        // Prepare order data with username
        const orderData = {
            orderProducts: orderItems
        };

        // Debug: Log the order data being sent
        console.log('Sending order data:', JSON.stringify(orderData, null, 2));

        try {
            UIHelper.showLoading();
            const newOrder = await this.api.post(`/api/orders/admin/${assignedUsername}`, orderData);
            UIHelper.hideLoading();

            UIHelper.showAlert(`Order created successfully and assigned to user: ${assignedUsername}`, 'success');
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('createOrderModal'));
            modal.hide();
            form.reset();
            document.getElementById('orderItemsContainer').innerHTML = '';
            this.orderItemCount = 0;
            document.getElementById('orderTotal').textContent = '$0.00';
            
            // Refresh orders
            await this.loadAllOrders();
        } catch (error) {
            UIHelper.hideLoading();
            
            
            const errorMessage = this.getErrorMessage(error);
            
            // Handle 404 specifically for user not found
            if (this.isNotFoundError(error)) {
                UIHelper.showAlert(`User '${assignedUsername}' not found. Please check the username and try again.`, 'warning');
            } else {
                UIHelper.showAlert(`Error creating order: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Calculate order total from order products
     */
    calculateOrderTotal(order) {
        // Get the correct UUID for logging
        const orderUuid = order.uuid || order.id || order.orderId || 'unknown';
        
        // Debug logging
        console.log('Calculating total for order:', orderUuid);
        console.log('Full order object:', JSON.stringify(order, null, 2));
        
        // Try different possible field names for total amount
        const possibleTotalFields = [
            'totalAmount', 'totalamount', 'total_amount', 'amount', 'total', 'orderTotal', 'totalPrice'
        ];
        
        for (const field of possibleTotalFields) {
            if (order[field] !== undefined && order[field] !== null) {
                const value = parseFloat(order[field]);
                if (!isNaN(value) && value > 0) {
                    console.log(`Using field ${field} with value:`, value);
                    return value;
                }
            }
        }
        
        console.log('No valid total field found, calculating from products...');
        
        // Try different field names for order products
        const orderProducts = order.orderProducts || order.items || order.products || order.orderItems;
        
        if (!orderProducts || !Array.isArray(orderProducts)) {
            console.log('No order products found');
            return 0;
        }
        
        const calculatedTotal = orderProducts.reduce((total, item) => {
            // Try different field names for price and quantity
            const unitPrice = parseFloat(
                item.unitPrice || item.price || item.productPrice || item.cost || 0
            );
            const quantity = parseInt(
                item.orderedQuantity || item.quantity || item.productQuantity || item.amount || 0
            );
            const subtotal = unitPrice * quantity;
            console.log(`Item: price=${unitPrice}, quantity=${quantity}, subtotal=${subtotal}`);
            return total + subtotal;
        }, 0);
        
        console.log('Calculated total:', calculatedTotal);
        return calculatedTotal;
    }

    /**
     * Get customer display name for order (handles both old and new formats)
     */
    getCustomerDisplayName(order) {
        // For admin-created orders, show assigned user info
        if (order.user && order.user.username) {
            return `@${order.user.username}`;
        }
        
        // For old customer-based orders
        if (order.customerFirstName || order.customerLastName) {
            return `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim();
        }
        
        // Fallback - check if there's any user info in different structure
        if (order.username) {
            return `@${order.username}`;
        }
        
        return 'N/A';
    }

    /**
     * Get customer display email for order (handles both old and new formats)
     */
    getCustomerDisplayEmail(order) {
        // For admin-created orders, show assigned user email if available
        if (order.user && order.user.email) {
            return order.user.email;
        }
        
        // For old customer-based orders
        if (order.customerEmail) {
            return order.customerEmail;
        }
        
        // Fallback - check if there's any user info in different structure
        if (order.userEmail) {
            return order.userEmail;
        }
        
        return 'Assigned User';
    }

    /**
     * Get customer section title for order details
     */
    getCustomerSectionTitle(order) {
        if (order.user && order.user.username) {
            return 'Assigned User Information';
        }
        if (order.customerFirstName || order.customerLastName || order.customerEmail) {
            return 'Customer Information';
        }
        return 'User Information';
    }

    /**
     * Get customer details table HTML for order details
     */
    getCustomerDetailsTable(order) {
        // For admin-created orders with user info
        if (order.user && order.user.username) {
            return `
                <tr><td><strong>Username:</strong></td><td>@${order.user.username}</td></tr>
                <tr><td><strong>Email:</strong></td><td>${order.user.email || 'N/A'}</td></tr>
                <tr><td><strong>Full Name:</strong></td><td>${order.user.firstName || ''} ${order.user.lastName || ''}</td></tr>
            `;
        }
        
        // For old customer-based orders
        if (order.customerFirstName || order.customerLastName || order.customerEmail) {
            return `
                <tr><td><strong>Name:</strong></td><td>${order.customerFirstName || ''} ${order.customerLastName || ''}</td></tr>
                <tr><td><strong>Email:</strong></td><td>${order.customerEmail || 'N/A'}</td></tr>
                <tr><td><strong>Phone:</strong></td><td>${order.customerPhone || 'N/A'}</td></tr>
            `;
        }
        
        // Fallback for unknown structure
        return `
            <tr><td><strong>Info:</strong></td><td>Order assigned to user</td></tr>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize the order controller
    try {
        window.orderController = new OrderManagementController();
        await window.orderController.init();
        console.log('Order Management System initialized successfully');
    } catch (error) {
        console.error('Error initializing Order Management System:', error);
        UIHelper.showAlert('Failed to initialize order management system. Please refresh the page.', 'danger');
    }

    // Add initial order item when modal is opened
    document.getElementById('createOrderModal').addEventListener('show.bs.modal', async function() {
        const container = document.getElementById('orderItemsContainer');
        
        // Ensure products are loaded before adding items
        if (window.orderController) {
            // Refresh products if not already loaded
            if (!window.orderController.availableProducts || window.orderController.availableProducts.length === 0) {
                await window.orderController.loadAvailableProducts();
            }
            
            // Add initial item if container is empty
            if (container.children.length === 0) {
                window.orderController.addOrderItem();
            }
        }
    });
    
    // Clear modal content when it's hidden
    document.getElementById('createOrderModal').addEventListener('hidden.bs.modal', function() {
        // Reset form
        document.getElementById('createOrderForm').reset();
        document.getElementById('orderItemsContainer').innerHTML = '';
        document.getElementById('orderTotal').textContent = '$0.00';
        
        // Reset item counter
        if (window.orderController) {
            window.orderController.orderItemCount = 0;
        }
    });
});
