// Dashboard.js - Handles the main dashboard functionality

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize charts and fetch key insights
        await Promise.all([
            loadKeyMetrics(),
            initDomainDemandChart(),
            initSalaryRangeChart(),
            initTopCompaniesChart(),
            initTopCitiesChart(),
            loadQuickInsights()
        ]);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        Utils.createToast('Failed to initialize dashboard', 'danger');
    }
});

// Load key metrics for the dashboard
async function loadKeyMetrics() {
    try {
        const response = await apiClient.getKeyInsights();
        const insights = response.status === 'success' ? response.data : null;

        if (insights) {
            // Update top domain
            document.getElementById('topDomain').textContent = insights.top_hiring_domain || 'N/A';

            // Update average salary
            document.getElementById('avgSalary').textContent = Utils.formatCurrency(insights.avg_internship_salary || 0);

            // Update top company
            document.getElementById('topCompany').textContent = insights.top_hiring_company || 'N/A';

            // Update top location
            document.getElementById('topLocation').textContent = insights.top_location || 'N/A';
        }
    } catch (error) {
        console.error('Error loading key metrics:', error);
        Utils.createToast('Failed to load key metrics', 'danger');
    }
}

// Initialize domain demand chart
async function initDomainDemandChart() {
    try {
        Utils.showLoading('domainChartLoader');

        const response = await apiClient.getTopDomains();
        const data = response.status === 'success' ? response.data : [];

        if (data && data.length > 0) {
            const ctx = document.getElementById('domainDemandChart').getContext('2d');

            // Extract domain names and counts
            const domains = data.map(item => item.domain);
            const counts = data.map(item => item.count);
            const colors = Utils.generateColors(domains.length, 0.8);

            // Create chart
            const domainDemandChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: domains,
                    datasets: [{
                        label: 'Number of Listings',
                        data: counts,
                        backgroundColor: colors,
                        borderColor: colors.map(color => color.replace(', 0.8)', ', 1)')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Listings: ${context.raw}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#adb5bd'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#adb5bd',
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('domainDemandChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing domain demand chart:', error);
    } finally {
        Utils.hideLoading('domainChartLoader');
    }
}

// Initialize salary range chart
async function initSalaryRangeChart() {
    try {
        Utils.showLoading('salaryChartLoader');

        const response = await apiClient.getSalaryInsights();
        const data = response.status === 'success' ? response.data : [];

        if (data && data.length > 0) {
            const ctx = document.getElementById('salaryRangeChart').getContext('2d');

            // Extract top 5 domains and their average salaries
            const topDomains = data.slice(0, 5);
            const domains = topDomains.map(item => item.domain);
            const avgSalaries = topDomains.map(item => item.avg_salary);

            // Create chart
            const salaryRangeChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: domains,
                    datasets: [{
                        data: avgSalaries,
                        backgroundColor: Utils.generateColors(domains.length, 0.8),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#adb5bd',
                                font: {
                                    size: 11
                                },
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${Utils.formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('salaryRangeChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing salary range chart:', error);
    } finally {
        Utils.hideLoading('salaryChartLoader');
    }
}

// Initialize top companies chart
async function initTopCompaniesChart() {
    try {
        Utils.showLoading('companiesChartLoader');

        const data = await Utils.fetchData('/company-hiring');

        if (data && data.length > 0) {
            const ctx = document.getElementById('topCompaniesChart').getContext('2d');

            // Extract company names and counts
            const companies = data.slice(0, 7).map(item => item.company);
            const counts = data.slice(0, 7).map(item => item.count);

            // Create chart
            const topCompaniesChart = new Chart(ctx, {
                type: 'horizontalBar',
                data: {
                    labels: companies,
                    datasets: [{
                        label: 'Number of Openings',
                        data: counts,
                        backgroundColor: Utils.generateColors(1, 0.8)[0],
                        borderColor: Utils.generateColors(1, 1)[0],
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Openings: ${context.raw}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#adb5bd'
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#adb5bd'
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('topCompaniesChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing top companies chart:', error);
    } finally {
        Utils.hideLoading('companiesChartLoader');
    }
}

// Initialize top cities chart
async function initTopCitiesChart() {
    try {
        Utils.showLoading('citiesChartLoader');

        const data = await Utils.fetchData('/jobs-by-city');

        if (data && data.length > 0) {
            const ctx = document.getElementById('topCitiesChart').getContext('2d');

            // Extract city names and counts
            const cities = data.slice(0, 6).map(item => item.city);
            const counts = data.slice(0, 6).map(item => item.count);
            const colors = Utils.generateColors(cities.length, 0.7);

            // Create chart
            const topCitiesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: cities,
                    datasets: [{
                        data: counts,
                        backgroundColor: colors,
                        borderColor: colors.map(color => color.replace(', 0.7)', ', 1)')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#adb5bd',
                                font: {
                                    size: 11
                                },
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((context.raw / total) * 100);
                                    return `${context.label}: ${context.raw} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('topCitiesChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing top cities chart:', error);
    } finally {
        Utils.hideLoading('citiesChartLoader');
    }
}

// Load quick insights for the modal
async function loadQuickInsights() {
    try {
        const insights = await Utils.fetchData('/key-insights');
        const salaryData = await Utils.fetchData('/salary-insights');

        if (insights && salaryData) {
            // Highest paying domain
            document.getElementById('highestPayingDomain').textContent = `${insights.top_paying_domain} (${Utils.formatCurrency(salaryData[0]?.avg_salary || 0)})`;

            // Most in-demand domain
            document.getElementById('mostInDemandDomain').textContent = `${insights.top_hiring_domain} with ${Utils.formatNumber(salaryData[0]?.count || 0)} openings`;

            // Top hiring company
            document.getElementById('topHiringCompany').textContent = insights.top_hiring_company || 'N/A';

            // Top hiring location
            document.getElementById('topHiringLocation').textContent = insights.top_location || 'N/A';
        }
    } catch (error) {
        console.error('Error loading quick insights:', error);
    }
}
