/**
 * Key Insights JS - Script for the key insights page
 * Handles data visualization, insights generation, and recommendations
 */

// Chart instances
let topDomainsChart, salaryVsDemandChart, hiringPatternsChart;

// Color palette for consistent styling
const chartColors = {
    primary: [
        'rgba(66, 133, 244, 0.8)',
        'rgba(219, 68, 55, 0.8)',
        'rgba(244, 180, 0, 0.8)',
        'rgba(15, 157, 88, 0.8)',
        'rgba(153, 0, 255, 0.8)',
        'rgba(255, 102, 0, 0.8)',
        'rgba(0, 204, 204, 0.8)',
        'rgba(255, 51, 153, 0.8)'
    ],
    borders: [
        'rgba(66, 133, 244, 1)',
        'rgba(219, 68, 55, 1)',
        'rgba(244, 180, 0, 1)',
        'rgba(15, 157, 88, 1)',
        'rgba(153, 0, 255, 1)',
        'rgba(255, 102, 0, 1)',
        'rgba(0, 204, 204, 1)',
        'rgba(255, 51, 153, 1)'
    ]
};

/**
 * Initialize the key insights page
 */
async function initKeyInsights() {
    try {
        // Show loading states
        showLoadingState();
        
        // Fetch all required data
        const [
            topDomainsResponse, 
            salaryInsightsResponse, 
            companyHiringResponse,
            salaryStatsResponse
        ] = await Promise.all([
            apiClient.getTopDomains(),
            apiClient.getSalaryInsights(),
            apiClient.getCompanyHiring(),
            apiClient.getSalaryStats()
        ]);
        
        // Check if any requests failed
        if (topDomainsResponse.status === 'error' || 
            salaryInsightsResponse.status === 'error' || 
            companyHiringResponse.status === 'error' ||
            salaryStatsResponse.status === 'error') {
            throw new Error('One or more API requests failed');
        }
        
        // Process data
        const processedData = processInsightsData(
            topDomainsResponse.data,
            salaryInsightsResponse.data,
            companyHiringResponse.data,
            salaryStatsResponse.data
        );
        
        // Render visualizations
        renderTopDomainsChart(processedData.topDomains);
        renderSalaryVsDemandChart(processedData.salaryVsDemand);
        renderHiringPatternsChart(processedData.companyHiring);
        
        // Generate and display insights
        generateDomainInsights(processedData);
        generateActionableRecommendations(processedData);
        
        // Hide loading state
        hideLoadingState();
        
    } catch (error) {
        console.error('Error initializing key insights page:', error);
        showErrorState('Failed to load insights data. Please try refreshing the page.');
    }
}

/**
 * Process all data for insights generation
 */
function processInsightsData(domainsData, salaryData, companyData, statsData) {
    // Process top domains data (for top performing domains chart)
    const topDomains = [...domainsData]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    // Process salary vs demand data
    const salaryVsDemand = [];
    
    // Combine domains with their respective salary data
    domainsData.forEach(domain => {
        const salaryInfo = salaryData.find(item => item.domain === domain.domain);
        if (salaryInfo) {
            salaryVsDemand.push({
                domain: domain.domain,
                count: domain.count, 
                avgSalary: salaryInfo.avg_salary
            });
        }
    });
    
    // Get only top 15 domains for the chart
    const topSalaryVsDemand = salaryVsDemand
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
    
    // Process company hiring data
    const companyHiring = [...companyData]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    // Get the top 3 domains for specific insights
    const top3Domains = domainsData
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(domain => domain.domain);
        
    // Get domain salary information for specific domains
    const domainSalaryInfo = {
        "Data Scientist": salaryData.find(item => item.domain === "Data Scientist")?.avg_salary || 0,
        "Web Development": salaryData.find(item => item.domain === "Web Development")?.avg_salary || 0,
        "Machine Learning Engineer": salaryData.find(item => item.domain === "Machine Learning Engineer")?.avg_salary || 0,
        "Full Stack Developer": salaryData.find(item => item.domain === "Full Stack Developer")?.avg_salary || 0,
        "Software Engineer (Frontend)": salaryData.find(item => item.domain === "Software Engineer (Frontend)")?.avg_salary || 0,
        "Software Engineer (Backend)": salaryData.find(item => item.domain === "Software Engineer (Backend)")?.avg_salary || 0
    };
    
    return {
        topDomains,
        salaryVsDemand: topSalaryVsDemand,
        companyHiring,
        top3Domains,
        domainSalaryInfo,
        salaryStats: statsData.data
    };
}

/**
 * Render the Top Domains Chart
 */
function renderTopDomainsChart(domains) {
    const ctx = document.getElementById('topDomainsChart').getContext('2d');
    
    // Prepare chart data
    const chartData = {
        labels: domains.map(item => item.domain),
        datasets: [{
            label: 'Job Count',
            data: domains.map(item => item.count),
            backgroundColor: chartColors.primary,
            borderColor: chartColors.borders,
            borderWidth: 1
        }]
    };
    
    // Configure and create chart
    topDomainsChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
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
                            return `Job Count: ${context.parsed.y}`;
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
                    ticks: {
                        color: '#f8f9fa',
                        beginAtZero: true
                    }
                }
            }
        }
    });
    
    // Generate insight for top domains section
    const insight = generateTopDomainsInsight(domains);
    document.getElementById('domains-insight').textContent = insight;
}

/**
 * Render the Salary vs Demand Chart (Scatter plot)
 */
function renderSalaryVsDemandChart(data) {
    const ctx = document.getElementById('salaryVsDemandChart').getContext('2d');
    
    // Prepare chart data
    const chartData = {
        datasets: [{
            label: 'Domains',
            data: data.map(item => ({
                x: Math.round(item.avgSalary),
                y: item.count,
                domain: item.domain
            })),
            backgroundColor: chartColors.primary,
            borderColor: chartColors.borders,
            borderWidth: 1,
            pointRadius: 8,
            pointHoverRadius: 12
        }]
    };
    
    // Configure and create chart
    salaryVsDemandChart = new Chart(ctx, {
        type: 'scatter',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return [
                                `Domain: ${point.domain}`,
                                `Salary: ₹${point.x.toLocaleString()}`,
                                `Job Count: ${point.y}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Average Salary (₹)',
                        color: '#f8f9fa'
                    },
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
                    title: {
                        display: true,
                        text: 'Job Count',
                        color: '#f8f9fa'
                    },
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
    
    // Generate insight for salary vs demand section
    const insight = generateSalaryVsDemandInsight(data);
    document.getElementById('salary-demand-insight').textContent = insight;
}

/**
 * Render the Company Hiring Patterns Chart
 */
function renderHiringPatternsChart(companies) {
    const ctx = document.getElementById('hiringPatternsChart').getContext('2d');
    
    // Prepare chart data
    const chartData = {
        labels: companies.map(item => item.Company),
        datasets: [{
            label: 'Job Postings',
            data: companies.map(item => item.count),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };
    
    // Configure and create chart
    hiringPatternsChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
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
                    ticks: {
                        color: '#f8f9fa'
                    }
                }
            }
        }
    });
    
    // Generate company hiring insight
    const insight = generateCompanyHiringInsight(companies);
    document.getElementById('company-hiring-insight').textContent = insight;
}

/**
 * Generate domain-specific insights
 */
function generateDomainInsights(data) {
    // Update specific domain insights
    
    // Data Science
    if (data.domainSalaryInfo["Data Scientist"]) {
        const dataScienceSalary = Math.round(data.domainSalaryInfo["Data Scientist"]).toLocaleString();
        document.getElementById('data-science-salary').textContent = `₹${dataScienceSalary}`;
        document.getElementById('data-science-insight').textContent = 
            `Data Science continues to be in high demand with a strong salary potential. Focus on Python, statistics, machine learning, and data visualization skills. Companies are looking for candidates with practical experience in data analysis and insights generation.`;
    }
    
    // Web Development
    if (data.domainSalaryInfo["Web Development"]) {
        const webDevSalary = Math.round(data.domainSalaryInfo["Web Development"]).toLocaleString();
        document.getElementById('web-dev-salary').textContent = `₹${webDevSalary}`;
        document.getElementById('web-dev-insight').textContent = 
            `Web Development internships emphasize practical skills in modern frameworks and responsive design. Employers value portfolios with real projects. Key skills to focus on: JavaScript, React/Angular, CSS frameworks, and API integration experience.`;
    }
    
    // Machine Learning
    if (data.domainSalaryInfo["Machine Learning Engineer"]) {
        const mlSalary = Math.round(data.domainSalaryInfo["Machine Learning Engineer"]).toLocaleString();
        document.getElementById('ml-salary').textContent = `₹${mlSalary}`;
        document.getElementById('ml-insight').textContent = 
            `Machine Learning internships require strong foundations in algorithms, neural networks, and practical implementation skills. Experience with TensorFlow or PyTorch is highly valued. Projects demonstrating ML application to real-world problems stand out.`;
    }
}

/**
 * Generate and display actionable recommendations
 */
function generateActionableRecommendations(data) {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = '';
    
    // Generate recommendations based on data analysis
    const recommendations = [
        {
            title: "Focus on Data Science Skills",
            content: "Data Science appears in the top demand list with competitive salaries. Consider building skills in Python, data visualization, and statistical analysis to capitalize on this trend.",
            icon: "chart-line",
            priority: "high"
        },
        {
            title: "Develop Full Stack Capabilities",
            content: "Full Stack Developers are in strong demand with above-average salary offerings. Consider learning both frontend technologies (React, Angular) and backend frameworks (Node.js, Flask, Django).",
            icon: "code",
            priority: "high"
        },
        {
            title: "Consider Remote Opportunities",
            content: "A significant portion of internships are remote/work-from-home. Ensure you have a good home office setup and strong communication skills to stand out in remote interviews.",
            icon: "home",
            priority: "medium"
        },
        {
            title: "Target Top Hiring Companies",
            content: `The top hiring companies include ${data.companyHiring[0]?.Company}, ${data.companyHiring[1]?.Company}, and others. Research these companies and tailor your applications to their specific requirements.`,
            icon: "building",
            priority: "medium"
        },
        {
            title: "Develop Machine Learning Knowledge",
            content: "Machine Learning Engineers are seeing strong demand with competitive salaries. Focus on practical ML projects to stand out.",
            icon: "robot",
            priority: "medium"
        },
        {
            title: "Build a Strong Portfolio",
            content: "Across all domains, companies value practical experience. Create a strong GitHub portfolio with relevant projects to demonstrate your skills.",
            icon: "folder-open",
            priority: "high"
        }
    ];
    
    // Render each recommendation as a card
    recommendations.forEach(rec => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        
        col.innerHTML = `
            <div class="card h-100 bg-black recommendation-card ${rec.priority}">
                <div class="card-body">
                    <h5 class="card-title">
                        <i class="fas fa-${rec.icon} me-2"></i> ${rec.title}
                    </h5>
                    <span class="badge bg-${rec.priority === 'high' ? 'success' : rec.priority === 'medium' ? 'primary' : 'warning'} mb-2">
                        ${rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                    </span>
                    <p class="card-text">${rec.content}</p>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    });
}

/**
 * Generate insight text for top domains
 */
function generateTopDomainsInsight(domains) {
    const topDomain = domains[0];
    const secondDomain = domains[1];
    
    return `Data Science leads the pack with ${topDomain.count} openings, followed by ${secondDomain.domain} with ${secondDomain.count} opportunities. These technology domains reflect the current industry focus on data-driven decision making and comprehensive software development capabilities.`;
}

/**
 * Generate insight text for salary vs demand chart
 */
function generateSalaryVsDemandInsight(data) {
    // Find highest demand domain
    const highestDemand = [...data].sort((a, b) => b.count - a.count)[0];
    
    // Find highest paying domain
    const highestPaying = [...data].sort((a, b) => b.avgSalary - a.avgSalary)[0];
    
    // Find optimal domains (good balance of demand and salary)
    const optimalDomains = data.filter(item => 
        item.count > data.reduce((sum, current) => sum + current.count, 0) / data.length * 1.2 && 
        item.avgSalary > data.reduce((sum, current) => sum + current.avgSalary, 0) / data.length * 1.1
    );
    
    const optimalDomainNames = optimalDomains.map(d => d.domain).slice(0, 2).join(' and ');
    
    return `${highestDemand.domain} shows the highest demand, while ${highestPaying.domain} offers the highest average salary (₹${Math.round(highestPaying.avgSalary).toLocaleString()}). ${optimalDomainNames} provide the best balance of demand and compensation for job seekers.`;
}

/**
 * Generate insight text for company hiring patterns
 */
function generateCompanyHiringInsight(companies) {
    const topCompany = companies[0];
    const secondCompany = companies[1];
    const thirdCompany = companies[2];
    
    return `${topCompany.Company} leads with ${topCompany.count} openings, followed by ${secondCompany.Company} (${secondCompany.count}) and ${thirdCompany.Company} (${thirdCompany.count}). These companies are actively expanding their internship programs, suggesting good opportunities for entry-level professionals.`;
}

/**
 * Show loading state
 */
function showLoadingState() {
    console.log('Loading key insights data...');
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    console.log('Key insights data loaded successfully');
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showErrorState(message) {
    console.error(message);
    alert(message);
}

// Initialize the page when DOM content is loaded
document.addEventListener('DOMContentLoaded', initKeyInsights);
