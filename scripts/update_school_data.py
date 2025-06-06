#!/usr/bin/env python3
"""
Script to update the GeoJSON file with additional fields from the CSV file.
This script will add Grade, Great Schools Rating, Tuition, and Type fields
to the GeoJSON properties for all entries, and update these fields based on
matching schools in the CSV file.
"""

import json
import csv
import os
from pathlib import Path
import math

# Define file paths
BASE_DIR = Path(__file__).parent.parent
CSV_FILE = BASE_DIR / 'data' / 'nearby_schools_with_grades.csv'
GEOJSON_FILE = BASE_DIR / 'data' / 'us-private-schools-simplified.geojson'
OUTPUT_FILE = BASE_DIR / 'data' / 'us-private-schools-updated.geojson'

# Define a function to calculate distance between two points
def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate the distance between two points using the Haversine formula."""
    # Earth radius in miles
    R = 3958.8
    
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(float(lat1))
    lon1_rad = math.radians(float(lon1))
    lat2_rad = math.radians(float(lat2))
    lon2_rad = math.radians(float(lon2))
    
    # Haversine formula
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

def read_csv_data(csv_file):
    """Read the CSV file and return a dictionary of school data."""
    school_data = {}
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Create a key using the school name and coordinates
            school_name = row['school_name'].strip().upper()
            school_lat = row['school_lat']
            school_lon = row['school_lon']
            
            # Skip rows with empty coordinates
            if not school_lat or not school_lon:
                continue
                
            key = f"{school_name}_{school_lat}_{school_lon}"
            
            # Store the data we need
            school_data[key] = {
                'name': school_name,
                'lat': school_lat,
                'lon': school_lon,
                'Grade': row.get('Grade', ''),
                'Great Schools Rating': row.get('Great Schools Rating', ''),
                'Tuition': row.get('Tuition', ''),
                'Type': row.get('Type', '')
            }
            
    return school_data

def update_geojson(geojson_file, school_data, output_file):
    """Update the GeoJSON file with the additional fields from the CSV data."""
    # Read the GeoJSON file
    with open(geojson_file, 'r', encoding='utf-8') as f:
        geojson = json.load(f)
    
    # Keep track of matches and non-matches
    matches = 0
    non_matches = 0
    
    # Add the new fields to all features
    for feature in geojson['features']:
        # Add the new fields with default empty values
        feature['properties']['Grade'] = ''
        feature['properties']['Great Schools Rating'] = ''
        feature['properties']['Tuition'] = ''
        feature['properties']['Type'] = ''
        
        # Get the school name and coordinates
        school_name = feature['properties'].get('name', '').strip().upper()
        coords = feature['geometry']['coordinates']
        lon = coords[0]
        lat = coords[1]
        
        # Create a key using the school name and coordinates
        key = f"{school_name}_{lat}_{lon}"
        
        # Check if this school is in our CSV data
        if key in school_data:
            # Direct match found
            feature['properties']['Grade'] = school_data[key]['Grade']
            feature['properties']['Great Schools Rating'] = school_data[key]['Great Schools Rating']
            feature['properties']['Tuition'] = school_data[key]['Tuition']
            feature['properties']['Type'] = school_data[key]['Type']
            matches += 1
        else:
            # Try to find a match based on name and proximity
            best_match = None
            min_distance = 0.1  # Only consider schools within 0.1 miles
            
            for csv_key, csv_school in school_data.items():
                # Skip if names don't match
                if school_name != csv_school['name']:
                    continue
                
                # Calculate distance
                distance = calculate_distance(lat, lon, csv_school['lat'], csv_school['lon'])
                
                if distance < min_distance:
                    min_distance = distance
                    best_match = csv_key
            
            if best_match:
                # Match found based on name and proximity
                feature['properties']['Grade'] = school_data[best_match]['Grade']
                feature['properties']['Great Schools Rating'] = school_data[best_match]['Great Schools Rating']
                feature['properties']['Tuition'] = school_data[best_match]['Tuition']
                feature['properties']['Type'] = school_data[best_match]['Type']
                matches += 1
            else:
                non_matches += 1
    
    # Save the updated GeoJSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(geojson, f)
    
    return matches, non_matches

def main():
    """Main function to run the script."""
    print(f"Reading CSV data from {CSV_FILE}...")
    school_data = read_csv_data(CSV_FILE)
    print(f"Found {len(school_data)} schools in the CSV file.")
    
    print(f"Updating GeoJSON file {GEOJSON_FILE}...")
    matches, non_matches = update_geojson(GEOJSON_FILE, school_data, OUTPUT_FILE)
    print(f"Updated {matches} schools with new data.")
    print(f"Could not find matches for {non_matches} schools.")
    
    print(f"Saved updated GeoJSON to {OUTPUT_FILE}")
    
    # Also create a backup of the original file
    backup_file = GEOJSON_FILE.with_suffix('.geojson.bak')
    if not os.path.exists(backup_file):
        with open(GEOJSON_FILE, 'r', encoding='utf-8') as src, open(backup_file, 'w', encoding='utf-8') as dst:
            dst.write(src.read())
        print(f"Created backup of original file at {backup_file}")

if __name__ == "__main__":
    main()
