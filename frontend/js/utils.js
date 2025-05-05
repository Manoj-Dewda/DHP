/**
 * Utility functions for the Internship Insights application
 */

const Utils = {
    /**
     * Fetch data from an API endpoint
     * @param {string} endpoint - The API endpoint to fetch data from
     * @returns {Promise<any>} - A promise that resolves to the JSON data
     */
    async fetchData(endpoint) {
        try {
            // Add api prefix to the endpoint if it doesn't start with it
            const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            return null;
        }
    },
    
    /**
     * Format a number as currency
     * @param {number} amount - The amount to format
     * @param {string} currency - The currency symbol
     * @returns {string} - The formatted currency string
     */
    formatCurrency(amount, currency = '₹') {
        if (amount === null || amount === undefined) return `${currency}0`;
        
        return `${currency}${parseInt(amount).toLocaleString('en-IN')}`;
    },
    
    /**
     * Format a number with thousand separators
     * @param {number} num - The number to format
     * @returns {string} - The formatted number string
     */
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        
        return parseInt(num).toLocaleString('en-IN');
    },
    
    /**
     * Generate random colors for charts
     * @param {number} count - The number of colors to generate
     * @param {number} opacity - The opacity of the colors (0-1)
     * @returns {string[]} - An array of RGBA color strings
     */
    generateColors(count, opacity = 0.7) {
        const colors = [];
        const hueStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const hue = (i * hueStep) % 360;
            colors.push(`hsla(${hue}, 70%, 60%, ${opacity})`);
        }
        
        return colors;
    },
    
    /**
     * Show a loading spinner
     * @param {string} elementId - The ID of the element to show
     */
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'flex';
        }
    },
    
    /**
     * Hide a loading spinner
     * @param {string} elementId - The ID of the element to hide
     */
    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    },
    
    /**
     * Create a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, warning, danger)
     */
    createToast(message, type = 'info') {
        // Check if toast container exists, if not create it
        let toastContainer = document.querySelector('.toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.setAttribute('id', toastId);
        
        // Create toast content
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        // Add toast to container
        toastContainer.appendChild(toast);
        
        // Initialize and show the toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    },
    
    /**
     * Initialize domain comparison functionality
     */
    initDomainComparison() {
        // Get elements
        const compareDomainsForm = document.getElementById('compareDomainsForm');
        const domain1Select = document.getElementById('domain1');
        const domain2Select = document.getElementById('domain2');
        const comparisonResultsSection = document.getElementById('comparisonResultsSection');
        
        if (!compareDomainsForm || !domain1Select || !domain2Select || !comparisonResultsSection) {
            return;
        }
        
        // Load domains for dropdowns
        this.loadDomainOptions();
        
        // Add event listener to form
        compareDomainsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const domain1 = domain1Select.value;
            const domain2 = domain2Select.value;
            
            if (domain1 === domain2) {
                this.createToast('Please select different domains to compare', 'warning');
                return;
            }
            
            await this.compareDomains(domain1, domain2);
        });
    },
    
    /**
     * Load domain options for domain comparison
     */
    async loadDomainOptions() {
        try {
            const domain1Select = document.getElementById('domain1');
            const domain2Select = document.getElementById('domain2');
            
            if (!domain1Select || !domain2Select) {
                return;
            }
            
            // Fetch domains
            const response = await apiClient.getDomains();
            const domains = response.status === 'success' ? response.data : [];
            
            if (domains && domains.length > 0) {
                // Clear existing options
                domain1Select.innerHTML = '<option value="">Select domain</option>';
                domain2Select.innerHTML = '<option value="">Select domain</option>';
                
                // Add domain options
                domains.forEach(domain => {
                    const option1 = document.createElement('option');
                    option1.value = domain;
                    option1.textContent = domain;
                    domain1Select.appendChild(option1);
                    
                    const option2 = document.createElement('option');
                    option2.value = domain;
                    option2.textContent = domain;
                    domain2Select.appendChild(option2);
                });
            }
        } catch (error) {
            console.error('Error loading domain options:', error);
        }
    },
    
    /**
     * Compare two domains and display results
     * @param {string} domain1 - First domain to compare
     * @param {string} domain2 - Second domain to compare
     */
    async compareDomains(domain1, domain2) {
        try {
            this.showLoading('compareDomainsLoader');
            
            // Fetch comparison data
            const response = await apiClient.compareDomains(domain1, domain2);
            const data = response.status === 'success' ? response.data : null;
            
            if (data) {
                // Show results section
                const comparisonResultsSection = document.getElementById('comparisonResultsSection');
                comparisonResultsSection.style.display = 'block';
                
                // Show domain names
                document.getElementById('compareDomainName1').textContent = domain1;
                document.getElementById('compareDomainName2').textContent = domain2;
                
                // Update salary comparison
                document.getElementById('compareSalary1').textContent = this.formatCurrency(data.domain1_salary);
                document.getElementById('compareSalary2').textContent = this.formatCurrency(data.domain2_salary);
                
                // Update demand comparison
                document.getElementById('compareDemand1').textContent = this.formatNumber(data.domain1_count);
                document.getElementById('compareDemand2').textContent = this.formatNumber(data.domain2_count);
                
                // Update company diversity
                document.getElementById('compareCompanies1').textContent = this.formatNumber(data.domain1_companies);
                document.getElementById('compareCompanies2').textContent = this.formatNumber(data.domain2_companies);
                
                // Update market share
                document.getElementById('compareShare1').textContent = `${data.domain1_share}%`;
                document.getElementById('compareShare2').textContent = `${data.domain2_share}%`;
                
                // Scroll to results
                comparisonResultsSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                this.createToast('Failed to compare domains', 'danger');
            }
        } catch (error) {
            console.error('Error comparing domains:', error);
            this.createToast('Failed to compare domains', 'danger');
        } finally {
            this.hideLoading('compareDomainsLoader');
        }
    }
};

// Export the Utils object
window.Utils = Utils;