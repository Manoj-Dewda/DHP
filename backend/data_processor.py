import pandas as pd
import json
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def process_and_save_data():
    """
    Process the CSV data and save it to a JSON file for faster loading
    """
    try:
        # Load the CSV data
        data = pd.read_csv('data/CleanedData.csv')
        logger.info(f"Successfully loaded CSV with {len(data)} rows")
        
        # Convert to JSON structure
        processed_data = {
            "domains": process_domains(data),
            "salary_insights": process_salary_insights(data),
            "location_distribution": process_location_distribution(data),
            "company_hiring": process_company_hiring(data),
            "salary_ranges": process_salary_ranges(data)
        }
        
        # Save to JSON file
        with open('data/internship_data.json', 'w') as f:
            json.dump(processed_data, f, indent=2)
            
        logger.info("Successfully processed and saved data to JSON")
        
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}")
        raise

def process_domains(data):
    """Process domain (job title) distribution"""
    job_counts = data['Job Title'].value_counts().reset_index()
    job_counts.columns = ['domain', 'count']
    return job_counts.head(10).to_dict('records')

def process_salary_insights(data):
    """Process salary insights by domain"""
    salary_insights = data.groupby('Job Title')['avg_salary'].mean().reset_index()
    salary_insights.columns = ['domain', 'avg_salary']
    salary_insights = salary_insights.sort_values(by='avg_salary', ascending=False)
    return salary_insights.to_dict('records')

def process_location_distribution(data):
    """Process job distribution by location"""
    locations = data['Location'].str.split(',').explode().str.strip()
    city_counts = locations.value_counts().reset_index()
    city_counts.columns = ['city', 'count']
    
    # Filter out "Work from home" as a separate category
    wfh_count = city_counts[city_counts['city'] == 'Work from home']['count'].sum()
    city_counts = city_counts[city_counts['city'] != 'Work from home']
    
    # Get top cities
    top_cities = city_counts.head(10).to_dict('records')
    
    # Add work from home as a separate entry
    top_cities.append({'city': 'Work from home', 'count': int(wfh_count)})
    
    return top_cities

def process_company_hiring(data):
    """Process company hiring patterns"""
    company_hiring = data.groupby('Company').size().reset_index(name='count')
    top_companies = company_hiring.sort_values(by='count', ascending=False).head(15)
    return top_companies.to_dict('records')

def process_salary_ranges(data):
    """Process salary distribution by ranges"""
    salary_bins = [0, 5000, 10000, 15000, 20000, 25000, 30000, float('inf')]
    salary_labels = ['0-5K', '5K-10K', '10K-15K', '15K-20K', '20K-25K', '25K-30K', '30K+']
    
    data['salary_range'] = pd.cut(data['avg_salary'], bins=salary_bins, labels=salary_labels, right=False)
    salary_distribution = data['salary_range'].value_counts().reset_index()
    salary_distribution.columns = ['range', 'count']
    
    return salary_distribution.to_dict('records')

if __name__ == "__main__":
    process_and_save_data()
