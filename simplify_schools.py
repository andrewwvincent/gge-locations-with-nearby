import json
import os

# Input and output file paths
input_file = 'data/us-private-schools.geojson'
output_file = 'data/us-private-schools-simplified.geojson'

# Fields to keep
# Name, Address, Coordinates, Enrollment, Start Grade level and End Grade level
fields_to_keep = ['name', 'address', 'city', 'state', 'zip', 'enrollment', 'st_grade', 'end_grade']

def simplify_geojson():
    print(f"Reading file: {input_file}")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading file: {e}")
        return
    
    print(f"Loaded {len(data.get('features', []))} features")
    
    # Create new GeoJSON with simplified features
    simplified_data = {
        "type": "FeatureCollection",
        "features": []
    }
    
    for feature in data.get('features', []):
        # Keep the geometry (coordinates) as is
        geometry = feature.get('geometry', {})
        
        # Filter properties to keep only the fields we want
        original_props = feature.get('properties', {})
        simplified_props = {}
        
        for field in fields_to_keep:
            if field in original_props:
                simplified_props[field] = original_props[field]
        
        # Add styleUrl property with value '#private'
        simplified_props['styleUrl'] = '#private'
        
        # Create a new feature with simplified properties
        simplified_feature = {
            "type": "Feature",
            "geometry": geometry,
            "properties": simplified_props
        }
        
        simplified_data["features"].append(simplified_feature)
    
    print(f"Simplified to {len(simplified_data['features'])} features")
    
    # Write the simplified data to a new file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(simplified_data, f)
        print(f"Successfully wrote simplified data to {output_file}")
        
        # Get file sizes for comparison
        original_size = os.path.getsize(input_file) / (1024 * 1024)  # Size in MB
        new_size = os.path.getsize(output_file) / (1024 * 1024)  # Size in MB
        
        print(f"Original file size: {original_size:.2f} MB")
        print(f"Simplified file size: {new_size:.2f} MB")
        print(f"Reduced by: {(original_size - new_size):.2f} MB ({(1 - new_size/original_size) * 100:.1f}%)")
        
    except Exception as e:
        print(f"Error writing file: {e}")

if __name__ == "__main__":
    simplify_geojson()
