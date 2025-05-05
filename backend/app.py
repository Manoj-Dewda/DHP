import os
import pandas as pd
import json
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='../frontend')
CORS(app)  # Enable CORS for all domains on all routes

# Load the CSV data
try:
    data = pd.read_csv('backend/data/CleanedData.csv')
    logger.info(f"Successfully loaded data with {len(data)} rows")
except Exception as e:
    logger.error(f"Error loading CSV data: {str(e)}")
    data = pd.DataFrame()

@app.route('/api/top-domains', methods=['GET'])
def get_top_domains():
    try:
        # Group by job title and count occurrences
        job_counts = data['Job Title'].value_counts().reset_index()
        job_counts.columns = ['domain', 'count']
        
        # Get the top 10 domains
        top_domains = job_counts.head(10).to_dict('records')
        
        return jsonify({
            'status': 'success',
            'data': top_domains
        })
    except Exception as e:
        logger.error(f"Error in get_top_domains: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/salary-insights', methods=['GET'])
def get_salary_insights():
    try:
        # Group by job title and calculate average salary
        salary_insights = data.groupby('Job Title')['avg_salary'].mean().reset_index()
        salary_insights.columns = ['domain', 'avg_salary']
        
        # Sort by average salary in descending order
        salary_insights = salary_insights.sort_values(by='avg_salary', ascending=False)
        
        return jsonify({
            'status': 'success',
            'data': salary_insights.to_dict('records')
        })
    except Exception as e:
        logger.error(f"Error in get_salary_insights: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/jobs-by-city', methods=['GET'])
def get_jobs_by_city():
    try:
        # Clean location data (split locations with multiple cities)
        locations = data['Location'].str.split(',').explode().str.strip()
        
        # Count jobs by location
        city_counts = locations.value_counts().reset_index()
        city_counts.columns = ['city', 'count']
        
        # Filter out "Work from home" as a separate category
        wfh_count = city_counts[city_counts['city'] == 'Work from home']['count'].sum()
        city_counts = city_counts[city_counts['city'] != 'Work from home']
        
        # Get top cities (excluding Work from home)
        top_cities = city_counts.head(10).to_dict('records')
        
        # Add work from home as a separate entry
        top_cities.append({'city': 'Work from home', 'count': int(wfh_count)})
        
        return jsonify({
            'status': 'success',
            'data': top_cities
        })
    except Exception as e:
        logger.error(f"Error in get_jobs_by_city: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/domains', methods=['GET'])
def get_domains():
    try:
        # Get unique job titles (domains)
        domains = data['Job Title'].unique().tolist()
        
        return jsonify({
            'status': 'success',
            'data': domains
        })
    except Exception as e:
        logger.error(f"Error in get_domains: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/company-hiring', methods=['GET'])
def get_company_hiring():
    try:
        # Group by company and count job postings
        company_hiring = data.groupby('Company').size().reset_index(name='count')
        
        # Sort by count in descending order and get top companies
        top_companies = company_hiring.sort_values(by='count', ascending=False).head(15)
        
        return jsonify({
            'status': 'success',
            'data': top_companies.to_dict('records')
        })
    except Exception as e:
        logger.error(f"Error in get_company_hiring: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/salary-range', methods=['GET'])
def get_salary_range():
    try:
        # Create salary ranges and count jobs in each range
        salary_bins = [0, 5000, 10000, 15000, 20000, 25000, 30000, float('inf')]
        salary_labels = ['0-5K', '5K-10K', '10K-15K', '15K-20K', '20K-25K', '25K-30K', '30K+']
        
        data['salary_range'] = pd.cut(data['avg_salary'], bins=salary_bins, labels=salary_labels, right=False)
        salary_distribution = data['salary_range'].value_counts().reset_index()
        salary_distribution.columns = ['range', 'count']
        
        return jsonify({
            'status': 'success',
            'data': salary_distribution.to_dict('records')
        })
    except Exception as e:
        logger.error(f"Error in get_salary_range: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/domain-comparison', methods=['GET'])
def get_domain_comparison():
    try:
        domains = request.args.getlist('domains')
        if not domains:
            return jsonify({
                'status': 'error',
                'message': 'No domains specified for comparison'
            }), 400
        
        # Filter data for the specified domains
        filtered_data = data[data['Job Title'].isin(domains)]
        
        # Group by job title and calculate stats
        comparison = filtered_data.groupby('Job Title').agg({
            'avg_salary': 'mean',
            'min_salary': 'mean',  # Average of minimum salaries
            'max_salary': 'mean',  # Average of maximum salaries
            'Job Title': 'count'   # Count of jobs
        }).reset_index()
        
        comparison.columns = ['domain', 'avg_salary', 'avg_min_salary', 'avg_max_salary', 'count']
        
        return jsonify({
            'status': 'success',
            'data': comparison.to_dict('records')
        })
    except Exception as e:
        logger.error(f"Error in get_domain_comparison: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/filtered-data', methods=['GET'])
def get_filtered_data():
    try:
        # Get filter parameters
        domain = request.args.get('domain')
        min_salary = request.args.get('min_salary')
        max_salary = request.args.get('max_salary')
        location = request.args.get('location')
        
        # Start with all data
        filtered_data = data.copy()
        
        # Apply filters if provided
        if domain and domain != 'All':
            filtered_data = filtered_data[filtered_data['Job Title'] == domain]
        
        if min_salary:
            filtered_data = filtered_data[filtered_data['avg_salary'] >= float(min_salary)]
            
        if max_salary:
            filtered_data = filtered_data[filtered_data['avg_salary'] <= float(max_salary)]
            
        if location and location != 'All':
            filtered_data = filtered_data[filtered_data['Location'].str.contains(location, case=False, na=False)]
        
        # Prepare result with limited fields
        result = filtered_data[['Company', 'Location', 'Job Title', 'avg_salary']].head(100)
        
        return jsonify({
            'status': 'success',
            'data': result.to_dict('records'),
            'total': len(filtered_data)
        })
    except Exception as e:
        logger.error(f"Error in get_filtered_data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/locations', methods=['GET'])
def get_locations():
    try:
        # Get unique locations
        locations = data['Location'].unique().tolist()
        
        return jsonify({
            'status': 'success',
            'data': locations
        })
    except Exception as e:
        logger.error(f"Error in get_locations: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/salary-stats', methods=['GET'])
def get_salary_stats():
    try:
        # Calculate salary statistics
        stats = {
            'min': float(data['avg_salary'].min()),
            'max': float(data['avg_salary'].max()),
            'mean': float(data['avg_salary'].mean()),
            'median': float(data['avg_salary'].median()),
            'total_jobs': len(data)
        }
        
        return jsonify({
            'status': 'success',
            'data': stats
        })
    except Exception as e:
        logger.error(f"Error in get_salary_stats: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Routes to serve frontend files
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
