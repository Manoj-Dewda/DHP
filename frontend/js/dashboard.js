/**
 * Dashboard.js - Main script for the dashboard page
 * Handles data loading, chart rendering, and UI updates
 */

// Chart configuration
const chartConfig = {
    // Common options for all charts
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#f8f9fa',
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 13
                }
            }
        }
    },
    // Color schemes for charts
    colors: {
        primary: [
            'rgba(66, 133, 244, 0.8)',
            'rgba(219, 68, 55, 0.8)',
            'rgba(244, 180, 0, 0.8)',
            'rgba(15, 157, 88, 0.8)',
            'rgba(153, 0, 255, 0.8)',
            'rgba(255, 102, 0, 0.8)',
            'rgba(0, 204, 204, 0.8)',
            'rgba(255, 51, 153, 0.8)',
            'rgba(102, 153, 0, 0.8)',
            'rgba(102, 0, 204, 0.8)'
        ],
        secondary: [
            'rgba(66, 133, 244, 0.5)',
            'rgba(219, 68, 55, 0.5)',
            'rgba(244, 180, 0, 0.5)',
            'rgba(15, 157, 88, 0.5)',
            'rgba(153, 0, 255, 0.5)',
            'rgba(255, 102, 0, 0.5)',
            'rgba(0, 204, 204, 0.5)',
            'rgba(255, 51, 153, 0.5)',
            'rgba(102, 153, 0, 0.5)',
            'rgba(102, 0, 204, 0.5)'
        ]
    }
};

// Chart instances
let domainDemandChart, salaryDistributionChart, locationDistributionChart;

/**
 * Initialize the dashboard page
 */
async function initDashboard() {
    try {
        // Show loading state
        showLoadingState();
        
        // Load all required data
        const [
            topDomainsResponse, 
            salaryRangeResponse, 
            locationResponse, 
            companyHiringResponse,
            salaryStatsResponse
        ] = await Promise.all([
            apiClient.getTopDomains(),
            apiClient.getSalaryRange(),
            apiClient.getJobsByCity(),
            apiClient.getCompanyHiring(),
            apiClient.getSalaryStats()
        ]);
        
        // Check if any requests failed
        if (topDomainsResponse.status === 'error' || 
            salaryRangeResponse.status === 'error' || 
            locationResponse.status === 'error' ||
            companyHiringResponse.status === 'error' ||
            salaryStatsResponse.status === 'error') {
            throw new Error('One or more API requests failed');
        }
        
        // Render charts and update UI elements
        renderDomainDemandChart(topDomainsResponse.data);
        renderSalaryDistributionChart(salaryRangeResponse.data);
        renderLocationDistributionChart(locationResponse.data);
        updateTopCompaniesTable(companyHiringResponse.data);
        updateStatsOverview(topDomainsResponse.data, locationResponse.data, salaryStatsResponse.data);
        updateQuickInsights(topDomainsResponse.data, salaryStatsResponse.data, locationResponse.data);
        
        // Hide loading state
        hideLoadingState();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorState('Failed to load dashboard data. Please try refreshing the page.');
    }
}

/**
 * Render the Domain Demand Chart
 * @param {Array} data - Top domains data
 */
function renderDomainDemandChart(data) {
    const ctx = document.getElementById('domainDemandChart').getContext('2d');
    
    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    // Get the top 7 domains for cleaner visualization
    const topDomains = sortedData.slice(0, 7);
    
    // Prepare chart data
    const chartData = {
        labels: topDomains.map(item => item.domain),
        datasets: [{
            label: 'Job Count',
            data: topDomains.map(item => item.count),
            backgroundColor: chartConfig.colors.primary,
            borderColor: chartConfig.colors.primary.map(color => color.replace('0.8', '1')),
            borderWidth: 1
        }]
    };
    
    // Create chart
    domainDemandChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            ...chartConfig.options,
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
                    ticks: {
                        color: '#f8f9fa',
                        beginAtZero: true
                    }
                }
            }
        }
    });
}

/**
 * Render the Salary Distribution Chart
 * @param {Array} data - Salary range data
 */
function renderSalaryDistributionChart(data) {
    const ctx = document.getElementById('salaryDistributionChart').getContext('2d');
    
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
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            hoverBackgroundColor: 'rgba(75, 192, 192, 0.9)'
        }]
    };
    
    // Create chart
    salaryDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            ...chartConfig.options,
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
                    ticks: {
                        color: '#f8f9fa',
                        beginAtZero: true
                    }
                }
            }
        }
    });
}

/**
 * Render the Location Distribution Chart
 * @param {Array} data - Location data
 */
function renderLocationDistributionChart(data) {
    const ctx = document.getElementById('locationDistributionChart').getContext('2d');
    
    // Sort data by count in descending order
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    // Separate Work from Home from other locations
    const wfhData = sortedData.find(item => item.city === 'Work from home');
    const otherLocations = sortedData.filter(item => item.city !== 'Work from home').slice(0, 6);
    
    // Final data for visualization
    const chartLocations = wfhData ? [wfhData, ...otherLocations] : otherLocations;
    
    // Prepare chart data
    const chartData = {
        labels: chartLocations.map(item => item.city),
        datasets: [{
            label: 'Job Count',
            data: chartLocations.map(item => item.count),
            backgroundColor: chartConfig.colors.primary,
            borderColor: chartConfig.colors.primary.map(color => color.replace('0.8', '1')),
            borderWidth: 1
        }]
    };
    
    // Create chart
    locationDistributionChart = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            ...chartConfig.options,
            plugins: {
                ...chartConfig.options.plugins,
                legend: {
                    ...chartConfig.options.plugins.legend,
                    position: 'right'
                }
            }
        }
    });
}

/**
 * Update the Top Companies table
 * @param {Array} data - Companies data
 */
function updateTopCompaniesTable(data) {
    const tableBody = document.getElementById('top-companies-table');
    
    // Sort companies by job count in descending order
    const sortedCompanies = [...data].sort((a, b) => b.count - a.count).slice(0, 5);
    
    // Clear previous content
    tableBody.innerHTML = '';
    
    // Add companies to the table
    sortedCompanies.forEach(company => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${company.Company}</td>
            <td class="text-end">${company.count}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Update the Stats Overview section
 * @param {Array} domainsData - Domains data
 * @param {Array} locationsData - Locations data
 * @param {Object} salaryStats - Salary statistics
 */
function updateStatsOverview(domainsData, locationsData, salaryStats) {
    // Update total jobs count
    document.getElementById('total-jobs').textContent = salaryStats.data.total_jobs;
    
    // Update average salary
    document.getElementById('avg-salary').textContent = 
        `₹${Math.round(salaryStats.data.mean).toLocaleString()}`;
    
    // Update top domain
    const topDomain = domainsData[0]?.domain || 'N/A';
    document.getElementById('top-domain').textContent = topDomain;
    
    // Update top location
    const topLocation = locationsData[0]?.city || 'N/A';
    document.getElementById('top-location').textContent = topLocation;
}

/**
 * Update Quick Insights section
 * @param {Array} domainsData - Domains data
 * @param {Object} salaryStats - Salary statistics
 * @param {Array} locationsData - Locations data
 */
function updateQuickInsights(domainsData, salaryStats, locationsData) {
    // Most in-demand domain
    const topDomain = domainsData[0];
    if (topDomain) {
        document.getElementById('most-in-demand').textContent = 
            `${topDomain.domain} with ${topDomain.count} openings`;
    }
    
    // Highest paying domain
    const salaryInsights = apiClient.getSalaryInsights().then(response => {
        if (response.status === 'success' && response.data.length > 0) {
            const highestPaying = response.data[0];
            document.getElementById('highest-paying').textContent = 
                `${highestPaying.domain} (₹${Math.round(highestPaying.avg_salary).toLocaleString()})`;
        }
    });
    
    // Location trend
    const wfhCount = locationsData.find(loc => loc.city === 'Work from home')?.count || 0;
    const totalJobs = salaryStats.data.total_jobs;
    const wfhPercentage = Math.round((wfhCount / totalJobs) * 100);
    
    document.getElementById('location-trend').textContent = 
        `${wfhPercentage}% of internships are remote (Work from Home)`;
    
    // Work mode insight
    if (wfhPercentage > 50) {
        document.getElementById('work-mode-insight').textContent = 
            `Remote work dominates the internship market at ${wfhPercentage}%`;
    } else {
        document.getElementById('work-mode-insight').textContent = 
            `In-office internships are more common (${100 - wfhPercentage}%)`;
    }
}

/**
 * Show loading state
 */
function showLoadingState() {
    // Implementation left simple for this example
    console.log('Loading data...');
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // Implementation left simple for this example
    console.log('Data loaded successfully');
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

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', initDashboard);
