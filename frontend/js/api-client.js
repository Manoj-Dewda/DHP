/**
 * API Client for the Internship Insights Application
 * Handles all requests to the backend API
 */

// Base URL for API requests
const API_BASE_URL = '/api';

// Error handling function
const handleApiError = (error, endpoint) => {
    console.error(`Error fetching from ${endpoint}:`, error);
    return {
        status: 'error',
        message: `Failed to fetch data from ${endpoint}. Please try again later.`,
        error: error.message
    };
};

/**
 * Generic fetch function with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 */
const fetchFromApi = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        return handleApiError(error, endpoint);
    }
};

// API client object with all available endpoints
const apiClient = {
    /**
     * Get top in-demand domains
     */
    getTopDomains: async () => {
        return fetchFromApi('/top-domains');
    },
    
    /**
     * Get salary insights for all domains
     */
    getSalaryInsights: async () => {
        return fetchFromApi('/salary-insights');
    },
    
    /**
     * Get geographic distribution of jobs
     */
    getJobsByCity: async () => {
        return fetchFromApi('/jobs-by-city');
    },
    
    /**
     * Get all available domains
     */
    getDomains: async () => {
        return fetchFromApi('/domains');
    },
    
    /**
     * Get top hiring companies data
     */
    getCompanyHiring: async () => {
        return fetchFromApi('/company-hiring');
    },
    
    /**
     * Get salary distribution by ranges
     */
    getSalaryRange: async () => {
        return fetchFromApi('/salary-range');
    },
    
    /**
     * Compare multiple domains
     * @param {Array} domains - List of domains to compare
     */
    getDomainComparison: async (domains) => {
        const params = new URLSearchParams();
        domains.forEach(domain => params.append('domains', domain));
        return fetchFromApi(`/domain-comparison?${params.toString()}`);
    },
    
    /**
     * Get filtered data based on criteria
     * @param {Object} filters - Filter criteria
     */
    getFilteredData: async (filters) => {
        const params = new URLSearchParams();
        
        // Add each filter if it exists
        if (filters.domain && filters.domain !== 'All') params.append('domain', filters.domain);
        if (filters.location && filters.location !== 'All') params.append('location', filters.location);
        if (filters.minSalary) params.append('min_salary', filters.minSalary);
        if (filters.maxSalary) params.append('max_salary', filters.maxSalary);
        
        return fetchFromApi(`/filtered-data?${params.toString()}`);
    },
    
    /**
     * Get all available locations
     */
    getLocations: async () => {
        return fetchFromApi('/locations');
    },
    
    /**
     * Get salary statistics (min, max, avg)
     */
    getSalaryStats: async () => {
        return fetchFromApi('/salary-stats');
    }
};

// Export the API client for use in other modules
window.apiClient = apiClient;
