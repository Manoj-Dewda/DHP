/**
 * Analytics.js - Script for the analytics page
 * Handles data visualization, filtering, and domain comparison
 */

// Chart instances
let salaryInsightsChart, domainComparisonChart, geoDistributionChart, salaryRangeChart;

// Selected domains for comparison
let selectedDomains = [];

// Max domains to compare
const MAX_DOMAINS_TO_COMPARE = 5;

/**
 * Initialize the analytics page
 */
async function initAnalytics() {
    try {
        // Show loading state
        showLoadingState();
        
        // Load initial data for the page
        const [
            domainsResponse, 
            salaryInsightsResponse, 
            locationsResponse, 
            salaryRangeResponse
        ] = await Promise.all([
            apiClient.getDomains(),
            apiClient.getSalaryInsights(),
            apiClient.getLocations(),
            apiClient.getSalaryRange()
        ]);
        
        // Check if any requests failed
        if (domainsResponse.status === 'error' || 
            salaryInsightsResponse.status === 'error' || 
            locationsResponse.status === 'error' ||
            salaryRangeResponse.status === 'error') {
            throw new Error('One or more API requests failed');
        }
        
        // Initialize filter dropdowns
        initializeFilters(domainsResponse.data, locationsResponse.data);
        
        // Render charts
        renderSalaryInsightsChart(salaryInsightsResponse.data);
        renderGeographicDistributionChart();
        renderSalaryRangeChart(salaryRangeResponse.data);
        
        // Set up domain comparison UI
        setupDomainComparison(domainsResponse.data);
        
        // Set up event listeners
        setupEventListeners();
        
        // Hide loading state
        hideLoadingState();
        
    } catch (error) {
        console.error('Error initializing analytics page:', error);
        showErrorState('Failed to load analytics data. Please try refreshing the page.');
    }
}

/**
 * Initialize filter dropdowns
 * @param {Array} domains - Available domains
 * @param {Array} locations - Available locations
 */
function initializeFilters(domains, locations) {
    // Populate domain filter
    const domainFilter = document.getElementById('domain-filter');
    domains.forEach(domain => {
        const option = document.createElement('option');
        option.value = domain;
        option.textContent = domain;
        domainFilter.appendChild(option);
    });
    
    // Populate location filter
    const locationFilter = document.getElementById('location-filter');
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
    // Filter form submission
    const filterForm = document.getElementById('filter-form');
    filterForm.addEventListener('submit', handleFilterSubmit);
}

/**
 * Handle filter form submission
 * @param {Event} event - Form submission event
 */
async function handleFilterSubmit(event) {
    event.preventDefault();
    
    // Get filter values
    const domain = document.getElementById('domain-filter').value;
    const location = document.getElementById('location-filter').value;
    const minSalary = document.getElementById('min-salary-filter').value;
    const maxSalary = document.getElementById('max-salary-filter').value;
    
    // Prepare filter object
    const filters = {
        domain,
        location,
        minSalary,
        maxSalary
    };
    
    try {
        // Show loading state
        const resultsTable = document.getElementById('filtered-results-table');
        resultsTable.innerHTML = '<tr><td colspan="4" class="text-center">Loading results...</td></tr>';
        
        // Fetch filtered data
        const response = await apiClient.getFilteredData(filters);
        
        if (response.status === 'error') {
            throw new Error(response.message);
        }
        
        // Update results table and count
        updateFilteredResultsTable(response.data);
        updateResultCount(response.total);
        
    } catch (error) {
        console.error('Error applying filters:', error);
        const resultsTable = document.getElementById('filtered-results-table');
        resultsTable.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${error.message}</td></tr>`;
        document.getElementById('result-count').textContent = '0 results';
    }
}

/**
 * Update the filtered results table
 * @param {Array} data - Filtered job data
 */
function updateFilteredResultsTable(data) {
    const tableBody = document.getElementById('filtered-results-table');
    
    // Clear previous content
    tableBody.innerHTML = '';
    
    // Check if there are results
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No matching results found</td></tr>';
        return;
    }
    
    // Add results to the table
    data.forEach(job => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${job.Company}</td>
            <td>${job.Location}</td>
            <td>${job['Job Title']}</td>
            <td class="text-end">₹${Math.round(job.avg_salary).toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Update the result count badge
 * @param {number} count - Number of results
 */
function updateResultCount(count) {
    const countElement = document.getElementById('result-count');
    countElement.textContent = `${count} results`;
}

/**
 * Render the Salary Insights Chart
 * @param {Array} data - Salary data by domain
 */
function renderSalaryInsightsChart(data) {
    const ctx = document.getElementById('salaryInsightsChart').getContext('2d');
    
    // Sort data by average salary in descending order
    const sortedData = [...data].sort((a, b) => b.avg_salary - a.avg_salary);
    
    // Get the top 10 highest paying domains
    const topDomains = sortedData.slice(0, 10);
    
    // Prepare chart data
    const chartData = {
        labels: topDomains.map(item => item.domain),
        datasets: [{
            label: 'Average Salary (₹)',
            data: topDomains.map(item => Math.round(item.avg_salary)),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
    
    // Create chart
    salaryInsightsChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `₹${context.parsed.x.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#f8f9fa',
                        callback: function(value) {
                            return `₹${value.toLocaleString()}`;
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#f8f9fa'
                    }
                }
            }
        }
    });
}

/**
 * Set up domain comparison functionality
 * @param {Array} domains - Available domains
 */
function setupDomainComparison(domains) {
    // Get container for checkboxes
    const checkboxContainer = document.getElementById('domain-comparison-checkboxes');
    
    // Clear previous content
    checkboxContainer.innerHTML = '';
    
    // Get the top 10 domains to compare
    const topDomains = domains.slice(0, 10);
    
    // Create checkboxes for each domain
    topDomains.forEach((domain, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input domain-checkbox';
        checkbox.id = `domain-${index}`;
        checkbox.value = domain;
        checkbox.addEventListener('change', handleDomainSelectionChange);
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `domain-${index}`;
        label.textContent = domain;
        
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        col.appendChild(wrapper);
        checkboxContainer.appendChild(col);
    });
}

/**
 * Handle domain selection change event
 * @param {Event} event - Checkbox change event
 */
async function handleDomainSelectionChange(event) {
    const domain = event.target.value;
    const isChecked = event.target.checked;
    
    // Add or remove domain from selected list
    if (isChecked) {
        // Check if max domains reached
        if (selectedDomains.length >= MAX_DOMAINS_TO_COMPARE) {
            alert(`You can compare at most ${MAX_DOMAINS_TO_COMPARE} domains at once.`);
            event.target.checked = false;
            return;
        }
        selectedDomains.push(domain);
    } else {
        selectedDomains = selectedDomains.filter(d => d !== domain);
    }
    
    // Update domain comparison chart
    if (selectedDomains.length > 0) {
        await updateDomainComparisonChart();
    } else {
        // Clear chart if no domains selected
        if (domainComparisonChart) {
            domainComparisonChart.destroy();
            domainComparisonChart = null;
        }
    }
}

/**
 * Update the Domain Comparison Chart
 */
async function updateDomainComparisonChart() {
    try {
        // Show a loading indicator in the chart area
        const chartContainer = document.getElementById('domainComparisonChart').parentElement;
        chartContainer.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        // Fetch comparison data
        const response = await apiClient.getDomainComparison(selectedDomains).catch(err => {
            console.error("Error fetching domain comparison:", err);
            return { status: 'error', message: err.message || 'Failed to fetch comparison data' };
        });
        
        if (response.status === 'error') {
            throw new Error(response.message);
        }
        
        // Clear loading indicator and restore canvas
        chartContainer.innerHTML = '<canvas id="domainComparisonChart"></canvas>';
        
        // Get canvas context
        const ctx = document.getElementById('domainComparisonChart').getContext('2d');
        
        // Prepare chart data
        const comparisonData = {
            labels: response.data.map(item => item.domain),
            datasets: [
                {
                    label: 'Average Salary (₹)',
                    data: response.data.map(item => Math.round(item.avg_salary)),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Job Count',
                    data: response.data.map(item => item.count),
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        };
        
        // Create new chart instance
        domainComparisonChart = new Chart(ctx, {
            type: 'bar',
            data: comparisonData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dataset = context.dataset;
                                const value = context.parsed.y;
                                if (dataset.label === 'Average Salary (₹)') {
                                    return `${dataset.label}: ₹${value.toLocaleString()}`;
                                }
                                return `${dataset.label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#f8f9fa'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Salary (₹)',
                            color: '#f8f9fa'
                        },
                        ticks: {
                            color: '#f8f9fa',
                            callback: function(value) {
                                return `₹${value.toLocaleString()}`;
                            }
                        }
                    },
                    y1: {
                        grid: {
                            drawOnChartArea: false
                        },
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Job Count',
                            color: '#f8f9fa'
                        },
                        ticks: {
                            color: '#f8f9fa'
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating domain comparison chart:', error);
        // Display error message in the chart area
        const chartContainer = document.getElementById('domainComparisonChart').parentElement;
        chartContainer.innerHTML = `<div class="alert alert-danger h-100 d-flex align-items-center justify-content-center">
            <i class="fas fa-exclamation-triangle me-2"></i> Failed to update comparison: ${error.message}
        </div>`;
    }
}

/**
 * Render the Geographic Distribution Chart
 */
async function renderGeographicDistributionChart() {
    try {
        const response = await apiClient.getJobsByCity();
        
        if (response.status === 'error') {
            throw new Error(response.message);
        }
        
        const ctx = document.getElementById('geoDistributionChart').getContext('2d');
        
        // Filter out "Work from home" for now
        const physicalLocations = response.data.filter(item => item.city !== 'Work from home');
        
        // Sort by count and get top locations
        const topLocations = physicalLocations
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
        
        // Get "Work from home" data
        const wfhData = response.data.find(item => item.city === 'Work from home');
        
        // Final data for visualization
        const chartLocations = wfhData ? [...topLocations, wfhData] : topLocations;
        
        // Prepare chart data
        const chartData = {
            labels: chartLocations.map(item => item.city),
            datasets: [{
                label: 'Job Count',
                data: chartLocations.map(item => item.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(231, 233, 237, 0.7)',
                    'rgba(150, 123, 182, 0.7)',
                    'rgba(255, 99, 132, 0.7)' // For WFH if present
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(231, 233, 237, 1)',
                    'rgba(150, 123, 182, 1)',
                    'rgba(255, 99, 132, 1)' // For WFH if present
                ],
                borderWidth: 1
            }]
        };
        
        // Create chart
        geoDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#f8f9fa',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error rendering geographic distribution chart:', error);
        showErrorState('Failed to load geographic distribution data.');
    }
}

/**
 * Render the Salary Range Chart
 * @param {Array} data - Salary range data
 */
function renderSalaryRangeChart(data) {
    const ctx = document.getElementById('salaryRangeChart').getContext('2d');
    
    // Sort ranges in ascending order
    const orderedRanges = ['0-5K', '5K-10K', '10K-15K', '15K-20K', '20K-25K', '25K-30K', '30K+'];
    const sortedData = orderedRanges
        .map(range => data.find(item => item.range === range) || { range, count: 0 });
    
    // Prepare chart data
    const chartData = {
        labels: sortedData.map(item => item.range),
        datasets: [{
            label: 'Number of Jobs',
            data: sortedData.map(item => item.count),
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(231, 233, 237, 0.7)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(231, 233, 237, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    // Create chart
    salaryRangeChart = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#f8f9fa',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${value} jobs (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Show loading state
 */
function showLoadingState() {
    // Implementation left simple for this example
    console.log('Loading analytics data...');
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // Implementation left simple for this example
    console.log('Analytics data loaded successfully');
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showErrorState(message) {
    // Implementation left simple for this example
    console.error(message);
    alert(message);
}

// Initialize analytics page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initAnalytics);
