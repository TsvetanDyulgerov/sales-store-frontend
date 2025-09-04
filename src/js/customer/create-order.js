/**
 * Create Order Controller
 * Handles customer order creation functionality
 */

class CreateOrderController {
    constructor() {
        this.api = apiClient;
        this.products = [];
        this.filteredProducts = [];
        this.cart = [];
        this.currentUser = null;
    }

    /**
     * Initialize the create order system
     */
    async init() {
        try {
            // Check authentication
            if (!JWTHelper.requireAuth()) {
                return;
            }

            console.log('Initializing Create Order System...');
            
            // Get current user data
            this.currentUser = await authService.getCurrentUser();
            if (this.currentUser && this.currentUser.username) {
                UIHelper.updateText('userWelcome', this.currentUser.username);
            }

            // Setup event listeners
            this.setupEventListeners();

            // Load initial data
            await this.loadProducts();

            console.log('Create Order System initialized successfully');
        } catch (error) {
            console.error('Error during Create Order System initialization:', error);
            UIHelper.showAlert('Failed to initialize order system. Please refresh the page.', 'danger');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        // Filter dropdowns
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }

        const priceRangeFilter = document.getElementById('priceRangeFilter');
        if (priceRangeFilter) {
            priceRangeFilter.addEventListener('change', () => this.applyFilters());
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // View cart button
        const viewCartBtn = document.getElementById('viewCartBtn');
        if (viewCartBtn) {
            viewCartBtn.addEventListener('click', () => this.showCart());
        }

        // Place order button
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => this.placeOrder());
        }
    }

    /**
     * Load products from API
     */
    async loadProducts() {
        try {
            UIHelper.showElement('loadingSpinner');
            UIHelper.hideElement('productsGrid');
            UIHelper.hideElement('noProductsMessage');

            const products = await this.api.get('/api/products/public');
            
            if (products && Array.isArray(products)) {
                this.products = products;
                this.filteredProducts = [...products];
                
                // Populate category filter
                this.populateCategoryFilter();
                
                // Display products
                this.displayProducts();
                
                UIHelper.updateText('productCount', `${products.length} product(s) found`);
            } else {
                this.products = [];
                this.filteredProducts = [];
                UIHelper.updateText('productCount', '0 products found');
                UIHelper.showElement('noProductsMessage');
            }

            UIHelper.hideElement('loadingSpinner');
        } catch (error) {
            console.error('Error loading products:', error);
            UIHelper.hideElement('loadingSpinner');
            UIHelper.showElement('noProductsMessage');
            UIHelper.showAlert('Failed to load products. Please try again.', 'danger');
        }
    }

    /**
     * Populate category filter dropdown
     */
    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        // Get unique categories
        const categories = [...new Set(this.products.map(product => 
            product.category || 'Uncategorized'
        ))].sort();

        // Clear existing options (except "All Categories")
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }

        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    /**
     * Apply filters to products
     */
    applyFilters() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const priceRangeFilter = document.getElementById('priceRangeFilter')?.value || '';

        this.filteredProducts = this.products.filter(product => {
            // Search filter
            const matchesSearch = !searchTerm || 
                (product.name && product.name.toLowerCase().includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm));

            // Category filter
            const productCategory = product.category || 'Uncategorized';
            const matchesCategory = !categoryFilter || productCategory === categoryFilter;

            // Price range filter
            let matchesPrice = true;
            if (priceRangeFilter) {
                const price = parseFloat(product.price) || 0;
                switch (priceRangeFilter) {
                    case '0-25':
                        matchesPrice = price <= 25;
                        break;
                    case '25-50':
                        matchesPrice = price > 25 && price <= 50;
                        break;
                    case '50-100':
                        matchesPrice = price > 50 && price <= 100;
                        break;
                    case '100+':
                        matchesPrice = price > 100;
                        break;
                }
            }

            return matchesSearch && matchesCategory && matchesPrice;
        });

        this.displayProducts();
        UIHelper.updateText('productCount', `${this.filteredProducts.length} product(s) found`);
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('priceRangeFilter').value = '';
        this.applyFilters();
    }

    /**
     * Display products in the grid
     */
    displayProducts() {
        const productsGrid = document.getElementById('productsGrid');
        const noProductsMessage = document.getElementById('noProductsMessage');

        if (!productsGrid) return;

        if (this.filteredProducts.length === 0) {
            UIHelper.hideElement('productsGrid');
            UIHelper.showElement('noProductsMessage');
            return;
        }

        UIHelper.showElement('productsGrid');
        UIHelper.hideElement('noProductsMessage');

        productsGrid.innerHTML = this.filteredProducts.map(product => this.createProductCard(product)).join('');

        // Add event listeners to "Add to Cart" buttons
        this.filteredProducts.forEach(product => {
            const addToCartBtn = document.getElementById(`addToCart-${product.id}`);
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => this.addToCart(product));
            }
        });
    }

    /**
     * Create HTML for a product card
     */
    createProductCard(product) {
        const price = parseFloat(product.price) || 0;
        const category = product.category || 'Uncategorized';
        const description = product.description || 'No description available';
        const stock = product.stock || product.quantity || 0;
        const inStock = stock > 0;

        return `
            <div class="col-lg-4 col-md-6">
                <div class="card h-100 ${!inStock ? 'border-secondary' : ''}">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-primary">${category}</span>
                            <span class="text-muted small">Stock: ${stock}</span>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.name || 'Unnamed Product'}</h5>
                        <p class="card-text text-muted flex-grow-1">${description}</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h4 class="text-success mb-0">$${price.toFixed(2)}</h4>
                                ${!inStock ? '<span class="badge bg-danger">Out of Stock</span>' : ''}
                            </div>
                            <div class="d-grid">
                                <button 
                                    type="button" 
                                    class="btn ${inStock ? 'btn-primary' : 'btn-secondary'}" 
                                    id="addToCart-${product.id}"
                                    ${!inStock ? 'disabled' : ''}
                                >
                                    <i class="bi bi-cart-plus me-2"></i>
                                    ${inStock ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Add product to cart
     */
    addToCart(product) {
        // Check if product is already in cart
        const existingItem = this.cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
            // Increase quantity
            existingItem.quantity += 1;
            UIHelper.showToast('Product quantity increased in cart', 'success');
        } else {
            // Add new item to cart
            this.cart.push({
                product: product,
                quantity: 1
            });
            UIHelper.showToast(`${product.name} added to cart`, 'success');
        }

        this.updateCartBadge();
    }

    /**
     * Remove product from cart
     */
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.product.id !== productId);
        this.updateCartBadge();
        this.renderCartItems();
    }

    /**
     * Update cart quantity
     */
    updateCartQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.product.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                this.updateCartBadge();
                this.renderCartItems();
            }
        }
    }

    /**
     * Update cart badge
     */
    updateCartBadge() {
        const cartBadge = document.getElementById('cartBadge');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = 'block';
        } else {
            cartBadge.style.display = 'none';
        }
    }

    /**
     * Show cart modal
     */
    showCart() {
        this.renderCartItems();
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        cartModal.show();
    }

    /**
     * Render cart items in modal
     */
    renderCartItems() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const placeOrderBtn = document.getElementById('placeOrderBtn');

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-cart-x display-1 text-muted"></i>
                    <h5 class="mt-3 text-muted">Your cart is empty</h5>
                    <p class="text-muted">Add some products to get started!</p>
                </div>
            `;
            cartTotal.textContent = '$0.00';
            placeOrderBtn.disabled = true;
            return;
        }

        // Calculate total
        const total = this.cart.reduce((sum, item) => {
            return sum + (parseFloat(item.product.price) * item.quantity);
        }, 0);

        cartItems.innerHTML = this.cart.map(item => this.createCartItemHTML(item)).join('');
        cartTotal.textContent = `$${total.toFixed(2)}`;
        placeOrderBtn.disabled = false;

        // Add event listeners to cart item controls
        this.cart.forEach(item => {
            const removeBtn = document.getElementById(`removeItem-${item.product.id}`);
            const quantityInput = document.getElementById(`quantity-${item.product.id}`);

            if (removeBtn) {
                removeBtn.addEventListener('click', () => this.removeFromCart(item.product.id));
            }

            if (quantityInput) {
                quantityInput.addEventListener('change', (e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    this.updateCartQuantity(item.product.id, newQuantity);
                });
            }
        });
    }

    /**
     * Create HTML for cart item
     */
    createCartItemHTML(item) {
        const price = parseFloat(item.product.price) || 0;
        const subtotal = price * item.quantity;

        return `
            <div class="d-flex align-items-center border-bottom py-3">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.product.name}</h6>
                    <small class="text-muted">$${price.toFixed(2)} each</small>
                </div>
                <div class="mx-3">
                    <input 
                        type="number" 
                        class="form-control form-control-sm" 
                        style="width: 70px;" 
                        min="1" 
                        value="${item.quantity}"
                        id="quantity-${item.product.id}"
                    >
                </div>
                <div class="text-end me-3">
                    <strong>$${subtotal.toFixed(2)}</strong>
                </div>
                <div>
                    <button 
                        type="button" 
                        class="btn btn-outline-danger btn-sm"
                        id="removeItem-${item.product.id}"
                        title="Remove from cart"
                    >
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Place the order
     */
    async placeOrder() {
        try {
            if (this.cart.length === 0) {
                UIHelper.showAlert('Your cart is empty', 'warning');
                return;
            }

            // Show loading state
            const placeOrderBtn = document.getElementById('placeOrderBtn');
            const originalText = placeOrderBtn.innerHTML;
            placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Placing Order...';
            placeOrderBtn.disabled = true;

            // Prepare order data
            const orderData = {
                orderProducts: this.cart.map(item => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    productPrice: parseFloat(item.product.price),
                    productQuantity: item.quantity
                }))
            };

            console.log('Placing order with data:', orderData);

            // Submit order to API
            const response = await this.api.post('/api/orders', orderData);

            // Reset button state
            placeOrderBtn.innerHTML = originalText;
            placeOrderBtn.disabled = false;

            if (response) {
                // Clear cart
                this.cart = [];
                this.updateCartBadge();

                // Hide cart modal
                const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
                cartModal.hide();

                // Show success modal
                document.getElementById('orderIdDisplay').textContent = response.id || 'Generated';
                const successModal = new bootstrap.Modal(document.getElementById('orderConfirmationModal'));
                successModal.show();

                UIHelper.showAlert('Order placed successfully!', 'success');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            
            // Reset button state
            const placeOrderBtn = document.getElementById('placeOrderBtn');
            placeOrderBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Place Order';
            placeOrderBtn.disabled = false;

            UIHelper.showAlert('Failed to place order. Please try again.', 'danger');
        }
    }
}

// Initialize create order controller when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const createOrderController = new CreateOrderController();
    createOrderController.init();
});
