// Key-insights.js - Handles the key insights page functionality

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize all components
        await Promise.all([
            loadMarketOverview(),
            initMarketOverviewChart(),
            initTopPayingDomainsChart(),
            initMostDemandDomainsChart(),
            generateDomainInsights(),
            generateRecommendations()
        ]);

        // Initialize scroll to recommendations
        initScrollToRecommendations();

        // Initialize comparison functionality for modal
        Utils.initDomainComparison();
    } catch (error) {
        console.error('Error initializing key insights page:', error);
        Utils.createToast('Failed to initialize key insights page', 'danger');
    }
});

// Load market overview data
async function loadMarketOverview() {
    try {
        const response = await apiClient.getKeyInsights();
        const insights = response.status === 'success' ? response.data : {};

        if (insights) {
            // Update market overview cards
            document.getElementById('totalDomains').textContent = Utils.formatNumber(insights.total_domains || 0);
            document.getElementById('totalCompanies').textContent = Utils.formatNumber(insights.total_companies || 0);
            document.getElementById('avgInternshipSalary').textContent = Utils.formatCurrency(insights.avg_internship_salary || 0);
            document.getElementById('totalListings').textContent = Utils.formatNumber(insights.total_listings || 0);

            // Update market overview text
            const marketOverviewText = document.getElementById('marketOverviewText');
            if (marketOverviewText) {
                marketOverviewText.innerHTML = `
                    The internship market shows ${insights.total_listings} active listings across ${insights.total_domains} domains and ${insights.total_companies} companies.
                    The average internship salary stands at ${Utils.formatCurrency(insights.avg_internship_salary)}.
                    Data Science and Machine Learning roles continue to show strong growth, while traditional Web Development
                    remains stable. Companies are increasingly offering remote internships, providing flexibility for candidates.
                `;
            }
        }
    } catch (error) {
        console.error('Error loading market overview:', error);
    }
}

// Initialize market overview chart
async function initMarketOverviewChart() {
    try {
        Utils.showLoading('overviewChartLoader');

        // Get domain counts
        const response = await apiClient.getTopDomains();
        const domainData = response.status === 'success' ? response.data : [];

        if (domainData && domainData.length > 0) {
            const ctx = document.getElementById('marketOverviewChart').getContext('2d');

            // Extract top 5 domains and counts
            const domains = domainData.slice(0, 5).map(item => item.domain);
            const counts = domainData.slice(0, 5).map(item => item.count);

            // Create chart
            const marketOverviewChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: domains,
                    datasets: [{
                        label: 'Demand',
                        data: counts,
                        backgroundColor: 'rgba(76, 201, 240, 0.4)',
                        borderColor: 'rgba(76, 201, 240, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(76, 201, 240, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(76, 201, 240, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    elements: {
                        line: {
                            tension: 0.1
                        }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            pointLabels: {
                                color: '#adb5bd',
                                font: {
                                    size: 11
                                }
                            },
                            ticks: {
                                backdropColor: 'transparent',
                                color: '#adb5bd'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            // Update trending domains in the UI
            if (domains.length >= 4) {
                document.getElementById('trendingDomain1').textContent = domains[0];
                document.getElementById('trendingDomain1Growth').textContent = '32%';

                document.getElementById('trendingDomain2').textContent = domains[1];
                document.getElementById('trendingDomain2Growth').textContent = '28%';

                document.getElementById('emergingDomain1').textContent = domains[2];
                document.getElementById('emergingDomain1Growth').textContent = '18%';

                // This is just for demonstration - in a real app this would be based on real trend data
                document.getElementById('decliningDomain1').textContent = 'Web Development';
                document.getElementById('decliningDomain1Growth').textContent = '5%';
            }
        } else {
            document.getElementById('marketOverviewChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing market overview chart:', error);
    } finally {
        Utils.hideLoading('overviewChartLoader');
    }
}

// Initialize top paying domains chart
async function initTopPayingDomainsChart() {
    try {
        Utils.showLoading('payingChartLoader');

        // Get salary data
        const response = await apiClient.getSalaryInsights();
        const salaryData = response.status === 'success' ? response.data : [];

        if (salaryData && salaryData.length > 0) {
            const ctx = document.getElementById('topPayingDomainsChart').getContext('2d');

            // Extract top 5 domains by salary
            const sortedData = [...salaryData].sort((a, b) => b.avg_salary - a.avg_salary).slice(0, 5);
            const domains = sortedData.map(item => item.domain);
            const salaries = sortedData.map(item => item.avg_salary);

            // Create chart
            const topPayingDomainsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: domains,
                    datasets: [{
                        label: 'Average Salary (₹)',
                        data: salaries,
                        backgroundColor: 'rgba(247, 37, 133, 0.7)',
                        borderColor: 'rgba(247, 37, 133, 1)',
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
                                    return `Avg. Salary: ${Utils.formatCurrency(context.raw)}`;
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
                                callback: function(value) {
                                    return Utils.formatCurrency(value);
                                },
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
            document.getElementById('topPayingDomainsChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing top paying domains chart:', error);
    } finally {
        Utils.hideLoading('payingChartLoader');
    }
}

// Initialize most in-demand domains chart
async function initMostDemandDomainsChart() {
    try {
        Utils.showLoading('demandChartLoader');

        // Get domain counts
        const response = await apiClient.getTopDomains();
        const domainData = response.status === 'success' ? response.data : [];

        if (domainData && domainData.length > 0) {
            const ctx = document.getElementById('mostDemandDomainsChart').getContext('2d');

            // Extract top 5 domains by count
            const topDomains = domainData.slice(0, 5);
            const domains = topDomains.map(item => item.domain);
            const counts = topDomains.map(item => item.count);

            // Create chart
            const mostDemandDomainsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: domains,
                    datasets: [{
                        label: 'Number of Listings',
                        data: counts,
                        backgroundColor: 'rgba(76, 201, 240, 0.7)',
                        borderColor: 'rgba(76, 201, 240, 1)',
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
                                    return `Listings: ${context.raw}`;
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
            document.getElementById('mostDemandDomainsChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing most demand domains chart:', error);
    } finally {
        Utils.hideLoading('demandChartLoader');
    }
}

// Generate domain insights
async function generateDomainInsights() {
    try {
        // Get salary data
        const salaryResponse = await apiClient.getSalaryInsights();
        const salaryData = salaryResponse.status === 'success' ? salaryResponse.data : [];
        
        // Get domain counts
        const domainsResponse = await apiClient.getTopDomains();
        const domainCounts = domainsResponse.status === 'success' ? domainsResponse.data : [];

        if (salaryData && domainCounts && salaryData.length > 0 && domainCounts.length > 0) {
            // Create a map of domain to count
            const domainCountMap = new Map();
            domainCounts.forEach(item => {
                domainCountMap.set(item.domain, item.count);
            });

            // Create combined data for analysis
            const combinedData = [];
            
            salaryData.forEach(item => {
                if (domainCountMap.has(item.domain)) {
                    combinedData.push({
                        domain: item.domain,
                        count: domainCountMap.get(item.domain),
                        salary: item.avg_salary
                    });
                }
            });

            // Calculate average values for demand and salary
            const avgDemand = combinedData.reduce((sum, item) => sum + item.count, 0) / combinedData.length;
            const avgSalary = combinedData.reduce((sum, item) => sum + item.salary, 0) / combinedData.length;

            // Sort by opportunity (combination of demand and salary)
            const sortedByOpportunity = [...combinedData].sort((a, b) => {
                const aScore = (a.count / avgDemand) + (a.salary / avgSalary);
                const bScore = (b.count / avgDemand) + (b.salary / avgSalary);
                return bScore - aScore;
            });

            // Update the insights container
            const insightsContainer = document.getElementById('domainInsightsContainer');
            
            if (insightsContainer && sortedByOpportunity.length > 0) {
                // Create visualization
                const topDomains = sortedByOpportunity.slice(0, 3);
                
                let visualizationHTML = '';
                
                topDomains.forEach((domain, index) => {
                    const domainScore = ((domain.count / avgDemand) + (domain.salary / avgSalary)) / 2;
                    const scorePercentage = Math.min(Math.round(domainScore * 50), 100);
                    
                    visualizationHTML += `
                        <div class="domain-insight-item">
                            <div class="domain-insight-header">
                                <h5>${domain.domain}</h5>
                                <span class="badge bg-success">${scorePercentage}% Match</span>
                            </div>
                            <div class="domain-insight-body">
                                <div class="domain-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Demand</span>
                                        <span class="stat-value">${Utils.formatNumber(domain.count)} listings</span>
                                        <div class="progress bg-dark">
                                            <div class="progress-bar bg-info" style="width: ${Math.min(Math.round((domain.count / avgDemand) * 50), 100)}%"></div>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Avg. Salary</span>
                                        <span class="stat-value">${Utils.formatCurrency(domain.salary)}</span>
                                        <div class="progress bg-dark">
                                            <div class="progress-bar bg-warning" style="width: ${Math.min(Math.round((domain.salary / avgSalary) * 50), 100)}%"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="domain-description">
                                    <p>${getDomainDescription(domain.domain, domain.count, domain.salary, avgDemand, avgSalary)}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                insightsContainer.innerHTML = visualizationHTML;
            }
        }
    } catch (error) {
        console.error('Error generating domain insights:', error);
    }
}

// Generate recommendations
async function generateRecommendations() {
    try {
        // Get key insights
        const insightsResponse = await apiClient.getKeyInsights();
        const insights = insightsResponse.status === 'success' ? insightsResponse.data : {};
        
        // Get salary data
        const salaryResponse = await apiClient.getSalaryInsights();
        const salaryData = salaryResponse.status === 'success' ? salaryResponse.data : [];
        
        if (insights && salaryData && salaryData.length > 0) {
            // Sort salary data by avg_salary
            const sortedBySalary = [...salaryData].sort((a, b) => b.avg_salary - a.avg_salary);
            
            // Get top domains
            const topDomains = sortedBySalary.slice(0, 3).map(item => item.domain);
            
            // Get recommendation sections
            const beginnerSection = document.getElementById('beginnerRecommendations');
            const intermediateSection = document.getElementById('intermediateRecommendations');
            const advancedSection = document.getElementById('advancedRecommendations');
            
            if (beginnerSection && intermediateSection && advancedSection) {
                // Generate beginner recommendations
                beginnerSection.innerHTML = `
                    <li class="list-group-item bg-dark-secondary border-0 mb-2 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Focus on ${topDomains[0]}</h6>
                                <p class="mb-0 small text-light-muted">This domain has high demand and excellent compensation. Start with the fundamentals.</p>
                            </div>
                            <span class="badge bg-primary rounded-pill">High Priority</span>
                        </div>
                    </li>
                    <li class="list-group-item bg-dark-secondary border-0 mb-2 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Build a portfolio</h6>
                                <p class="mb-0 small text-light-muted">Create 2-3 projects showcasing your skills in your chosen domain.</p>
                            </div>
                            <span class="badge bg-info rounded-pill">Essential</span>
                        </div>
                    </li>
                    <li class="list-group-item bg-dark-secondary border-0 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Learn ${insights.trending_skills ? insights.trending_skills[0] : 'basic skills'}</h6>
                                <p class="mb-0 small text-light-muted">This is the most in-demand skill for entry-level positions.</p>
                            </div>
                            <span class="badge bg-success rounded-pill">Trending</span>
                        </div>
                    </li>
                `;
                
                // Generate intermediate recommendations
                intermediateSection.innerHTML = `
                    <li class="list-group-item bg-dark-secondary border-0 mb-2 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Specialize in ${topDomains[1]}</h6>
                                <p class="mb-0 small text-light-muted">After gaining basic experience, specialize in this high-growth area.</p>
                            </div>
                            <span class="badge bg-primary rounded-pill">Specialization</span>
                        </div>
                    </li>
                    <li class="list-group-item bg-dark-secondary border-0 mb-2 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Pursue certifications</h6>
                                <p class="mb-0 small text-light-muted">Industry certifications can boost your resume significantly.</p>
                            </div>
                            <span class="badge bg-info rounded-pill">Credential</span>
                        </div>
                    </li>
                    <li class="list-group-item bg-dark-secondary border-0 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Focus on ${insights.top_hiring_company || 'top companies'}</h6>
                                <p class="mb-0 small text-light-muted">Target internships at companies hiring the most in your field.</p>
                            </div>
                            <span class="badge bg-warning rounded-pill">Strategic</span>
                        </div>
                    </li>
                `;
                
                // Generate advanced recommendations
                advancedSection.innerHTML = `
                    <li class="list-group-item bg-dark-secondary border-0 mb-2 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Transition to ${topDomains[2]}</h6>
                                <p class="mb-0 small text-light-muted">Consider pivoting to this high-paying domain for career growth.</p>
                            </div>
                            <span class="badge bg-primary rounded-pill">Career Growth</span>
                        </div>
                    </li>
                    <li class="list-group-item bg-dark-secondary border-0 mb-2 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Develop leadership skills</h6>
                                <p class="mb-0 small text-light-muted">Take on team projects and leadership roles in internships.</p>
                            </div>
                            <span class="badge bg-info rounded-pill">Soft Skills</span>
                        </div>
                    </li>
                    <li class="list-group-item bg-dark-secondary border-0 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">Explore ${insights.emerging_domains ? insights.emerging_domains[0] : 'emerging fields'}</h6>
                                <p class="mb-0 small text-light-muted">Stay ahead by exploring cutting-edge domains with future potential.</p>
                            </div>
                            <span class="badge bg-danger rounded-pill">Cutting Edge</span>
                        </div>
                    </li>
                `;
            }
        }
    } catch (error) {
        console.error('Error generating recommendations:', error);
    }
}

// Initialize scroll to recommendations
function initScrollToRecommendations() {
    const scrollBtn = document.getElementById('scrollToRecommendations');
    
    if (scrollBtn) {
        scrollBtn.addEventListener('click', () => {
            const recommendationsSection = document.getElementById('recommendationsSection');
            
            if (recommendationsSection) {
                recommendationsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// Helper function to generate domain descriptions
function getDomainDescription(domain, count, salary, avgDemand, avgSalary) {
    const demandRatio = count / avgDemand;
    const salaryRatio = salary / avgSalary;
    
    if (demandRatio > 1.2 && salaryRatio > 1.2) {
        return `${domain} is a high-opportunity field with strong demand (${count} listings) and excellent compensation (${Utils.formatCurrency(salary)}). It's an ideal domain to focus on.`;
    } else if (demandRatio > 1.2 && salaryRatio <= 1.2) {
        return `${domain} has high demand (${count} listings) but moderate compensation (${Utils.formatCurrency(salary)}). Consider specializing to increase salary potential.`;
    } else if (demandRatio <= 1.2 && salaryRatio > 1.2) {
        return `${domain} offers excellent compensation (${Utils.formatCurrency(salary)}) but with moderate demand (${count} listings). Competition may be higher for these positions.`;
    } else {
        return `${domain} currently shows balanced demand (${count} listings) and compensation (${Utils.formatCurrency(salary)}). It's a stable option with good potential.`;
    }
}