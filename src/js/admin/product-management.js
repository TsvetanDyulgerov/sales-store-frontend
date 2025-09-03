/**
 * Product Management Controller
 * Handles admin product management functionality
 */

class ProductManagementController {
    constructor() {
        this.api = apiClient;
        this.currentProducts = [];
    }

    /**
     * Extract error message from different error structures
     * @param {Error|Object} error - Error object
     * @returns {string} - Formatted error message
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
            message.includes('404') ||
            message.toLowerCase().includes('not found') ||
            message.toLowerCase().includes('product not found')
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
     * Check if error indicates a 403 (forbidden)
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
     * Check if error indicates a 409 (conflict)
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
     * Initialize product management page
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
            if (e.key === 'Enter') this.searchProductById();
        });
        
        UIHelper.addEventListener('searchByName', 'keypress', (e) => {
            if (e.key === 'Enter') this.searchProductByName();
        });

        // Make functions globally available for onclick handlers
        window.searchProductById = this.searchProductById.bind(this);
        window.searchProductByName = this.searchProductByName.bind(this);
        window.loadAllProducts = this.loadAllProducts.bind(this);
        window.createProduct = this.createProduct.bind(this);
        window.editProduct = this.editProduct.bind(this);
        window.updateProduct = this.updateProduct.bind(this);
        window.deleteProduct = this.deleteProduct.bind(this);
        window.confirmDeleteProduct = this.confirmDeleteProduct.bind(this);
        window.hideAlert = UIHelper.hideAlert;
    }

    /**
     * Search products by ID
     */
    async searchProductById() {
        const productId = document.getElementById('searchById')?.value.trim();
        
        if (!productId) {
            UIHelper.showAlert('Please enter a product ID', 'warning');
            return;
        }

        UIHelper.showLoading();
        
        try {
            const product = await this.api.get(`/api/products/${productId}`);
            UIHelper.hideLoading();
            this.displayProducts([product]);
            UIHelper.updateText('productCount', '1 product found');
        } catch (error) {
            UIHelper.hideLoading();
            
            if (this.isNotFoundError(error)) {
                UIHelper.showAlert(`No product found with ID: ${productId}`, 'info');
                this.displayProducts([]);
                UIHelper.updateText('productCount', '0 products found');
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to view this product.', 'warning');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Error searching for product: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Search products by name
     */
    async searchProductByName() {
        const name = document.getElementById('searchByName')?.value.trim();
        
        if (!name) {
            UIHelper.showAlert('Please enter a product name', 'warning');
            return;
        }

        UIHelper.showLoading();
        
        try {
            const response = await this.api.get(`/api/products/name/${encodeURIComponent(name)}`);
            UIHelper.hideLoading();
            
            // Backend returns a single product object, not an array
            const products = Array.isArray(response) ? response : [response];
            
            this.displayProducts(products);
            UIHelper.updateText('productCount', `${products.length} product(s) found`);
        } catch (error) {
            UIHelper.hideLoading();
            
            if (this.isNotFoundError(error)) {
                UIHelper.showAlert(`No products found with name containing: "${name}"`, 'info');
                this.displayProducts([]);
                UIHelper.updateText('productCount', '0 products found');
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to search for products.', 'warning');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Error searching for products: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Load all products
     */
    async loadAllProducts() {
        UIHelper.showLoading();
        
        try {
            const products = await this.api.get('/api/products');
            UIHelper.hideLoading();
            this.displayProducts(products);
            UIHelper.updateText('productCount', `${products.length} total products`);
        } catch (error) {
            UIHelper.hideLoading();
            const errorMessage = this.getErrorMessage(error);
            UIHelper.showAlert(`Error loading products: ${errorMessage}`, 'danger');
        }
    }

    /**
     * Display products in table format
     * @param {Array} products - Array of product objects
     */
    displayProducts(products) {
        const container = document.getElementById('productsContainer');
        
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-box-x display-1 opacity-25"></i>
                    <h5 class="mt-3">No Products Found</h5>
                    <p>No products match your search criteria.</p>
                </div>
            `;
            return;
        }

        const productRows = products.map(product => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-box me-2 text-primary fs-5"></i>
                        <div>
                            <div class="fw-semibold">${product.name || 'N/A'}</div>
                            <small class="text-muted">ID: ${product.id || 'N/A'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="description-cell">
                        ${product.description ? 
                            (product.description.length > 50 ? 
                                `<span title="${this.escapeHtml(product.description)}">${product.description.substring(0, 50)}...</span>` : 
                                product.description
                            ) : 
                            '<span class="text-muted">No description</span>'
                        }
                    </div>
                </td>
                <td class="price-cell">
                    <div class="d-flex flex-column">
                        <span class="text-success">$${parseFloat(product.sellingPrice || 0).toFixed(2)}</span>
                        <small class="text-muted">Cost: $${parseFloat(product.actualPrice || 0).toFixed(2)}</small>
                    </div>
                </td>
                <td>
                    <span class="badge stock-badge ${this.getStockBadgeClass(product.availableQuantity)}">
                        <i class="bi bi-boxes me-1"></i>
                        ${product.availableQuantity || 0}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-warning" 
                                onclick="editProduct(${product.id}, '${this.escapeHtml(product.name)}', '${this.escapeHtml(product.description || '')}', ${product.actualPrice}, ${product.sellingPrice}, ${product.availableQuantity})"
                                title="Edit Product">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="deleteProduct(${product.id}, '${this.escapeHtml(product.name)}')"
                                title="Delete Product">
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
                            <th scope="col">Product</th>
                            <th scope="col">Description</th>
                            <th scope="col">Pricing</th>
                            <th scope="col">Stock</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                </table>
            </div>
        `;

        this.currentProducts = products;
    }

    /**
     * Get badge class based on stock level
     */
    getStockBadgeClass(quantity) {
        if (quantity === 0) return 'bg-danger';
        if (quantity <= 10) return 'bg-warning text-dark';
        return 'bg-success';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    /**
     * Create new product
     */
    async createProduct() {
        const name = document.getElementById('createName')?.value.trim();
        const description = document.getElementById('createDescription')?.value.trim();
        const actualPrice = document.getElementById('createActualPrice')?.value;
        const sellingPrice = document.getElementById('createSellingPrice')?.value;
        const availableQuantity = document.getElementById('createAvailableQuantity')?.value;

        // Client-side validation
        const validationErrors = this.validateCreateProductData({
            name, description, actualPrice, sellingPrice, availableQuantity
        });

        if (validationErrors.length > 0) {
            UIHelper.showAlert(validationErrors.join('<br>'), 'warning');
            return;
        }

        // Prepare data according to CreateProductDTO
        const productData = {
            name,
            description: description || null,
            actualPrice: parseFloat(actualPrice),
            sellingPrice: parseFloat(sellingPrice),
            availableQuantity: parseInt(availableQuantity)
        };

        UIHelper.showLoading();

        try {
            const newProduct = await this.api.post('/api/products', productData);
            UIHelper.hideLoading();
            
            UIHelper.showAlert('Product created successfully!', 'success');
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('createProductModal'));
            modal?.hide();
            UIHelper.clearForm('createProductForm');
            
            // Refresh product list if showing all products
            const productCount = document.getElementById('productCount')?.textContent;
            if (productCount?.includes('total')) {
                this.loadAllProducts();
            }
        } catch (error) {
            UIHelper.hideLoading();
            
            if (this.isConflictError(error)) {
                UIHelper.showAlert('A product with this name already exists. Please choose a different name.', 'warning');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to create products.', 'warning');
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Failed to create product: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Validate create product data according to DTO constraints
     */
    validateCreateProductData({ name, description, actualPrice, sellingPrice, availableQuantity }) {
        const errors = [];

        // Name validation
        if (!name) {
            errors.push('Product name is required');
        } else if (name.length > 50) {
            errors.push('Product name must not exceed 50 characters');
        }

        // Description validation
        if (description && description.length > 400) {
            errors.push('Description must not exceed 400 characters');
        }

        // Actual price validation
        if (!actualPrice) {
            errors.push('Actual price is required');
        } else {
            const price = parseFloat(actualPrice);
            if (isNaN(price) || price <= 0) {
                errors.push('Actual price must be a positive number');
            }
        }

        // Selling price validation
        if (!sellingPrice) {
            errors.push('Selling price is required');
        } else {
            const price = parseFloat(sellingPrice);
            if (isNaN(price) || price <= 0) {
                errors.push('Selling price must be a positive number');
            }
        }

        // Quantity validation
        if (availableQuantity === '' || availableQuantity === null || availableQuantity === undefined) {
            errors.push('Available quantity is required');
        } else {
            const quantity = parseInt(availableQuantity);
            if (isNaN(quantity) || quantity < 0) {
                errors.push('Available quantity cannot be negative');
            }
        }

        return errors;
    }

    /**
     * Edit product (show modal)
     */
    editProduct(id, name, description, actualPrice, sellingPrice, availableQuantity) {
        document.getElementById('editProductId').value = id;
        document.getElementById('editName').value = name || '';
        document.getElementById('editDescription').value = description || '';
        document.getElementById('editActualPrice').value = actualPrice || '';
        document.getElementById('editSellingPrice').value = sellingPrice || '';
        document.getElementById('editAvailableQuantity').value = availableQuantity || '';
        
        const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
        modal.show();
    }

    /**
     * Update product
     */
    async updateProduct() {
        const id = document.getElementById('editProductId')?.value;
        const name = document.getElementById('editName')?.value.trim();
        const description = document.getElementById('editDescription')?.value.trim();
        const actualPrice = document.getElementById('editActualPrice')?.value;
        const sellingPrice = document.getElementById('editSellingPrice')?.value;
        const availableQuantity = document.getElementById('editAvailableQuantity')?.value;

        if (!id) {
            UIHelper.showAlert('No product selected for update', 'warning');
            return;
        }

        // Build update data (only include non-empty fields)
        const updateData = {};
        
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (actualPrice) updateData.actualPrice = parseFloat(actualPrice);
        if (sellingPrice) updateData.sellingPrice = parseFloat(sellingPrice);
        if (availableQuantity !== '') updateData.availableQuantity = parseInt(availableQuantity);

        if (Object.keys(updateData).length === 0) {
            UIHelper.showAlert('Please fill at least one field to update', 'warning');
            return;
        }

        UIHelper.showLoading();

        try {
            await this.api.put(`/api/products/${id}`, updateData);
            UIHelper.hideLoading();
            
            UIHelper.showAlert('Product updated successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
            modal?.hide();
            
            // Refresh current view
            this.refreshCurrentView();
        } catch (error) {
            UIHelper.hideLoading();
            
            if (this.isNotFoundError(error)) {
                UIHelper.showAlert('Product not found. It may have been deleted.', 'info');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to update products.', 'warning');
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Failed to update product: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Delete product (show modal)
     */
    deleteProduct(id, name) {
        document.getElementById('deleteProductId').value = id;
        UIHelper.updateText('deleteProductName', name);
        
        const modal = new bootstrap.Modal(document.getElementById('deleteProductModal'));
        modal.show();
    }

    /**
     * Confirm delete product
     */
    async confirmDeleteProduct() {
        const productId = document.getElementById('deleteProductId')?.value;

        if (!productId) {
            UIHelper.showAlert('No product selected for deletion', 'warning');
            return;
        }

        UIHelper.showLoading();

        try {
            await this.api.delete(`/api/products/${productId}`);
            UIHelper.hideLoading();
            
            UIHelper.showAlert('Product deleted successfully!', 'success');
            
            // Close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteProductModal'));
            modal?.hide();
            
            // Refresh current view
            this.refreshCurrentView();
        } catch (error) {
            UIHelper.hideLoading();
            
            if (this.isNotFoundError(error)) {
                UIHelper.showAlert('Product not found. It may have already been deleted.', 'info');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to delete products.', 'warning');
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Failed to delete product: ${errorMessage}`, 'danger');
            }
            
            // Close modal even on error
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteProductModal'));
            modal?.hide();
        }
    }

    /**
     * Refresh current view based on what was last displayed
     */
    refreshCurrentView() {
        const productCount = document.getElementById('productCount')?.textContent;
        
        if (productCount?.includes('total')) {
            this.loadAllProducts();
        } else if (productCount?.includes('found')) {
            // Try to refresh search if inputs have values
            const idSearch = document.getElementById('searchById')?.value;
            const nameSearch = document.getElementById('searchByName')?.value;
            
            if (idSearch) {
                this.searchProductById();
            } else if (nameSearch) {
                this.searchProductByName();
            } else {
                this.loadAllProducts();
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const productController = new ProductManagementController();
    productController.init();
});
