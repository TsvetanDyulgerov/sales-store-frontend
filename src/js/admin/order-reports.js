/**
 * Order Reports Controller
 * Handles the order reports page functionality including filtering, display, and export
 */
class OrderReportsController {
    constructor() {
        this.api = apiClient;
        this.currentReportData = null;
        this.currentFilters = null;
        
        console.log('Order Reports Controller initialized');
    }

    /**
     * Initialize the Order Reports page
     */
    async init() {
        try {
            console.log('Initializing Order Reports System...');
            
            // Set user welcome message
            const userInfo = authService.getCurrentUser();
            if (userInfo && userInfo.username) {
                UIHelper.updateText('adminWelcome', `Welcome, ${userInfo.username}`);
            }
        } catch (error) {
            console.error('Error during Order Management System initialization:', error);
            UIHelper.showAlert('Failed to initialize order management system. Please refresh the page.', 'danger');
        }

    }

    /**
     * Generate report based on current filters
     */
    async generateReport() {
        try {
            // Get filter values
            const filters = this.getFilterValues();
            
            // Validate date range
            if (!this.validateDateRange(filters.startDate, filters.endDate)) {
                UIHelper.showAlert('End date must be after start date', 'warning');
                return;
            }

            this.showLoading();
            this.hideAllSections();

            // Fetch all orders and process them locally since backend reports endpoint isn't available
            console.log('Fetching orders data for report generation...');
            const orders = await this.api.get('/api/orders');
            
            // Process orders into report format
            const reportData = this.processOrdersIntoReport(orders, filters);

            this.hideLoading();
            this.currentReportData = reportData;
            this.currentFilters = filters;

            if (reportData && reportData.length > 0) {
                this.displayReport(reportData);
                this.updateSummaryCards(reportData);
                this.showReportSection();
                document.getElementById('exportBtn').disabled = false;
            } else {
                this.showNoResultsSection();
            }

        } catch (error) {
            this.hideLoading();
            console.error('Error generating report:', error);
            
            if (this.isForbiddenError(error)) {
                UIHelper.showAlert('Access denied. You do not have permission to view reports.', 'warning');
            } else if (this.isUnauthorizedError(error)) {
                UIHelper.showAlert('Your session has expired. Please log in again.', 'danger');
                setTimeout(() => authService.logout(), 2000);
            } else {
                const errorMessage = this.getErrorMessage(error);
                UIHelper.showAlert(`Error generating report: ${errorMessage}`, 'danger');
            }
        }
    }

    /**
     * Process orders into report format with filtering
     */
    processOrdersIntoReport(orders, filters) {
        if (!orders || !Array.isArray(orders)) {
            return [];
        }

        const reportItems = [];

        orders.forEach(order => {
            // Get order information
            const orderId = order.uuid || order.id || order.orderId;
            const orderDate = order.orderDate ? new Date(order.orderDate) : null;
            const orderProducts = order.orderProducts || order.items || order.products || order.orderItems || [];
            
            // Get customer/user information
            const customerName = this.getCustomerName(order);
            
            // Process each product in the order
            orderProducts.forEach(product => {
                const reportItem = {
                    orderId: orderId,
                    orderUuid: orderId,
                    customerName: customerName,
                    username: customerName,
                    productName: product.productName || product.name || 'Unknown Product',
                    quantity: parseInt(product.orderedQuantity || product.quantity || product.productQuantity || 0),
                    unitPrice: parseFloat(product.unitPrice || product.price || product.productPrice || 0),
                    totalAmount: 0, // Will be calculated below
                    orderDate: order.orderDate,
                    status: order.status || 'UNKNOWN'
                };
                
                // Calculate total amount for this line item
                reportItem.totalAmount = reportItem.unitPrice * reportItem.quantity;
                
                // Apply filters
                if (this.passesFilters(reportItem, orderDate, filters)) {
                    reportItems.push(reportItem);
                }
            });
        });

        console.log(`Generated ${reportItems.length} report items from ${orders.length} orders`);
        return reportItems;
    }

    /**
     * Get customer name from order (handles different formats)
     */
    getCustomerName(order) {
        if (order.user && order.user.username) {
            return `@${order.user.username}`;
        }
        if (order.customerFirstName || order.customerLastName) {
            return `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim();
        }
        if (order.username) {
            return `@${order.username}`;
        }
        return 'Unknown Customer';
    }

    /**
     * Check if a report item passes the current filters
     */
    passesFilters(item, orderDate, filters) {
        // Product name filter
        if (filters.productName) {
            const productNameLower = item.productName.toLowerCase();
            const filterLower = filters.productName.toLowerCase();
            if (!productNameLower.includes(filterLower)) {
                return false;
            }
        }

        // Username filter
        if (filters.username) {
            const customerNameLower = item.customerName.toLowerCase();
            const filterLower = filters.username.toLowerCase();
            if (!customerNameLower.includes(filterLower)) {
                return false;
            }
        }

        // Date range filter
        if (orderDate && (filters.startDate || filters.endDate)) {
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                if (orderDate < startDate) {
                    return false;
                }
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999); // End of day
                if (orderDate > endDate) {
                    return false;
                }
            }
        }

        return true;
    }
    getFilterValues() {
        return {
            productName: document.getElementById('productNameFilter').value.trim() || null,
            username: document.getElementById('usernameFilter').value.trim() || null,
            startDate: document.getElementById('startDateFilter').value || null,
            endDate: document.getElementById('endDateFilter').value || null
        };
    }

    /**
     * Build query parameters for API request
     */
    buildQueryParams(filters) {
        const params = {};
        
        if (filters.productName) {
            params.productName = filters.productName;
        }
        if (filters.username) {
            params.username = filters.username;
        }
        if (filters.startDate) {
            // Convert to ISO datetime format expected by backend
            params.startDate = filters.startDate + 'T00:00:00';
        }
        if (filters.endDate) {
            // Convert to ISO datetime format expected by backend
            params.endDate = filters.endDate + 'T23:59:59';
        }
        
        return params;
    }

    /**
     * Validate date range
     */
    validateDateRange(startDate, endDate) {
        if (startDate && endDate) {
            return new Date(startDate) <= new Date(endDate);
        }
        return true;
    }

    /**
     * Display the report data in a table
     */
    displayReport(reportData) {
        const container = document.getElementById('reportTableContainer');
        
        if (!reportData || reportData.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No data to display</p>';
            return;
        }

        // Create table with report data
        const tableHtml = `
            <table class="table table-hover table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Order ID</th>
                        <th>Customer/User</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Amount</th>
                        <th>Order Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.map(item => this.renderReportRow(item)).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHtml;
        document.getElementById('reportCount').textContent = `${reportData.length} record(s)`;
    }

    /**
     * Render a single report row
     */
    renderReportRow(item) {
        const orderId = item.orderId || item.orderUuid || item.id || 'N/A';
        const customer = item.customerName || item.username || 'N/A';
        const productName = item.productName || 'N/A';
        const quantity = item.quantity || 0;
        const unitPrice = item.unitPrice || 0;
        const totalAmount = item.totalAmount || (unitPrice * quantity);
        const orderDate = item.orderDate ? new Date(item.orderDate).toLocaleDateString() : 'N/A';
        const status = item.status || 'UNKNOWN';

        return `
            <tr>
                <td>
                    <div class="fw-semibold">${this.escapeHtml(orderId)}</div>
                </td>
                <td>
                    <div class="fw-semibold">${this.escapeHtml(customer)}</div>
                </td>
                <td>
                    <div class="fw-semibold">${this.escapeHtml(productName)}</div>
                </td>
                <td>
                    <span class="badge bg-secondary">${quantity}</span>
                </td>
                <td>
                    <span class="text-success">$${unitPrice.toFixed(2)}</span>
                </td>
                <td>
                    <span class="fw-semibold text-success">$${totalAmount.toFixed(2)}</span>
                </td>
                <td>
                    <small class="text-muted">${orderDate}</small>
                </td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(status)}">${status}</span>
                </td>
            </tr>
        `;
    }

    /**
     * Update summary cards with report statistics
     */
    updateSummaryCards(reportData) {
        if (!reportData || reportData.length === 0) {
            return;
        }

        // Calculate statistics
        const uniqueOrders = new Set(reportData.map(item => item.orderId)).size;
        const totalRevenue = reportData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const uniqueProducts = new Set(reportData.map(item => item.productName)).size;
        const uniqueCustomers = new Set(reportData.map(item => item.customerName)).size;

        // Update DOM elements
        document.getElementById('totalOrders').textContent = uniqueOrders;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('totalProducts').textContent = uniqueProducts;
        document.getElementById('totalCustomers').textContent = uniqueCustomers;
    }

    /**
     * Export current report data
     */
    exportReport() {
        if (!this.currentReportData || this.currentReportData.length === 0) {
            UIHelper.showAlert('No data to export', 'warning');
            return;
        }

        try {
            // Create CSV content
            const csvContent = this.generateCSV(this.currentReportData);
            
            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', this.generateFileName());
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            UIHelper.showAlert('Report exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting report:', error);
            UIHelper.showAlert('Error exporting report', 'danger');
        }
    }

    /**
     * Generate CSV content from report data
     */
    generateCSV(data) {
        const headers = [
            'Order ID',
            'Customer/User',
            'Product',
            'Quantity',
            'Unit Price',
            'Total Amount',
            'Order Date',
            'Status'
        ];

        const csvRows = [headers.join(',')];

        data.forEach(item => {
            const row = [
                `"${item.orderId || 'N/A'}"`,
                `"${item.customerName || 'N/A'}"`,
                `"${item.productName || 'N/A'}"`,
                item.quantity || 0,
                (item.unitPrice || 0).toFixed(2),
                (item.totalAmount || 0).toFixed(2),
                `"${item.orderDate ? new Date(item.orderDate).toLocaleDateString() : 'N/A'}"`,
                `"${item.status || 'UNKNOWN'}"`
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Generate filename for export
     */
    generateFileName() {
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        const filters = this.currentFilters || {};
        
        let filename = `order-report-${timestamp}`;
        
        if (filters.productName) {
            filename += `-product-${filters.productName.replace(/[^a-zA-Z0-9]/g, '')}`;
        }
        if (filters.username) {
            filename += `-user-${filters.username.replace(/[^a-zA-Z0-9]/g, '')}`;
        }
        if (filters.startDate && filters.endDate) {
            filename += `-${filters.startDate}-to-${filters.endDate}`;
        }
        
        return filename + '.csv';
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('productNameFilter').value = '';
        document.getElementById('usernameFilter').value = '';
        document.getElementById('startDateFilter').value = '';
        document.getElementById('endDateFilter').value = '';
        
        this.hideAllSections();
        document.getElementById('exportBtn').disabled = true;
        this.currentReportData = null;
        this.currentFilters = null;
    }

    /**
     * Show/hide sections
     */
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    showReportSection() {
        document.getElementById('reportSection').style.display = 'block';
        document.getElementById('summarySection').style.display = 'block';
    }

    showNoResultsSection() {
        document.getElementById('noResultsSection').style.display = 'block';
    }

    hideAllSections() {
        document.getElementById('reportSection').style.display = 'none';
        document.getElementById('summarySection').style.display = 'none';
        document.getElementById('noResultsSection').style.display = 'none';
    }

    /**
     * Get CSS class for status badge
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
     * Utility methods
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    isForbiddenError(error) {
        return error.response && error.response.status === 403;
    }

    isUnauthorizedError(error) {
        return error.response && error.response.status === 401;
    }

    getErrorMessage(error) {
        if (error.response && error.response.data && error.response.data.message) {
            return error.response.data.message;
        }
        if (error.message) {
            return error.message;
        }
        return 'An unexpected error occurred';
    }
}

// Global functions for HTML onclick handlers
function generateReport() {
    if (window.reportController) {
        window.reportController.generateReport();
    }
}

function clearFilters() {
    if (window.reportController) {
        window.reportController.clearFilters();
    }
}

function exportReport() {
    if (window.reportController) {
        window.reportController.exportReport();
    }
}
