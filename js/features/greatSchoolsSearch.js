/**
 * GreatSchools API Integration
 * Fetches private school data from GreatSchools.org API via a proxy server
 */

// Import the loadLocationLayers function from locationLoader.js
import { loadLocationLayers } from './locationLoader.js';

let map;
let currentCity;
let apiKeyRef; // Will be set from config
let schoolMarkers = []; // Array to store school markers
let allSchools = []; // Array to store all schools (to avoid duplicates)

/**
 * Mock data for Phoenix private schools
 */
const mockPhoenixSchools = [
    {
        "name": "Phoenix Christian Preparatory School",
        "school-summary": "Phoenix Christian Preparatory School, a private school located in Phoenix, AZ, serves grades K-12.",
        "type": "private",
        "level-codes": "e,m,h",
        "level": "KG,1,2,3,4,5,6,7,8,9,10,11,12",
        "street": "1751 W Indian School Rd",
        "city": "Phoenix",
        "state": "AZ",
        "zip": "85015",
        "phone": "(602) 265-4707",
        "lat": 33.4954,
        "lon": -112.0976,
        "web-site": "https://phoenixchristian.org",
        "rating_band": "Above average"
    },
    {
        "name": "Brophy College Preparatory",
        "school-summary": "Brophy College Preparatory, a private Jesuit school located in Phoenix, AZ, serves grades 9-12.",
        "type": "private",
        "level-codes": "h",
        "level": "9,10,11,12",
        "street": "4701 N Central Ave",
        "city": "Phoenix",
        "state": "AZ",
        "zip": "85012",
        "phone": "(602) 264-5291",
        "lat": 33.5074,
        "lon": -112.0736,
        "web-site": "https://www.brophyprep.org",
        "rating_band": "Above average"
    },
    {
        "name": "Xavier College Preparatory",
        "school-summary": "Xavier College Preparatory, a private Catholic girls school located in Phoenix, AZ, serves grades 9-12.",
        "type": "private",
        "level-codes": "h",
        "level": "9,10,11,12",
        "street": "4710 N 5th St",
        "city": "Phoenix",
        "state": "AZ",
        "zip": "85012",
        "phone": "(602) 277-3772",
        "lat": 33.5076,
        "lon": -112.0665,
        "web-site": "https://www.xcp.org",
        "rating_band": "Above average"
    },
    {
        "name": "St. Francis Xavier School",
        "school-summary": "St. Francis Xavier School, a private Catholic school located in Phoenix, AZ, serves grades K-8.",
        "type": "private",
        "level-codes": "e,m",
        "level": "KG,1,2,3,4,5,6,7,8",
        "street": "4715 N Central Ave",
        "city": "Phoenix",
        "state": "AZ",
        "zip": "85012",
        "phone": "(602) 266-5364",
        "lat": 33.5078,
        "lon": -112.0736,
        "web-site": "https://school.sfxphx.org",
        "rating_band": "Above average"
    },
    {
        "name": "All Saints' Episcopal Day School",
        "school-summary": "All Saints' Episcopal Day School, a private school located in Phoenix, AZ, serves grades PK-8.",
        "type": "private",
        "level-codes": "p,e,m",
        "level": "PK,KG,1,2,3,4,5,6,7,8",
        "street": "6300 N Central Ave",
        "city": "Phoenix",
        "state": "AZ",
        "zip": "85012",
        "phone": "(602) 274-4866",
        "lat": 33.5253,
        "lon": -112.0736,
        "web-site": "https://www.aseds.org",
        "rating_band": "Above average"
    },
    {
        "name": "Phoenix Country Day School",
        "school-summary": "Phoenix Country Day School, a private school located in Paradise Valley, AZ, serves grades PK-12.",
        "type": "private",
        "level-codes": "p,e,m,h",
        "level": "PK,KG,1,2,3,4,5,6,7,8,9,10,11,12",
        "street": "3901 E Stanford Dr",
        "city": "Paradise Valley",
        "state": "AZ",
        "zip": "85253",
        "phone": "(602) 955-8200",
        "lat": 33.5224,
        "lon": -111.9983,
        "web-site": "https://www.pcds.org",
        "rating_band": "Above average"
    },
    {
        "name": "Montessori Academy",
        "school-summary": "Montessori Academy, a private school located in Scottsdale, AZ, serves grades PK-8.",
        "type": "private",
        "level-codes": "p,e,m",
        "level": "PK,KG,1,2,3,4,5,6,7,8",
        "street": "6050 N Invergordon Rd",
        "city": "Paradise Valley",
        "state": "AZ",
        "zip": "85253",
        "phone": "(480) 945-1121",
        "lat": 33.5237,
        "lon": -111.9563,
        "web-site": "https://www.montessoriacademyaz.org",
        "rating_band": "Average"
    },
    {
        "name": "Tesseract School",
        "school-summary": "Tesseract School, a private school located in Phoenix, AZ, serves grades PK-8.",
        "type": "private",
        "level-codes": "p,e,m",
        "level": "PK,KG,1,2,3,4,5,6,7,8",
        "street": "4800 E Doubletree Ranch Rd",
        "city": "Paradise Valley",
        "state": "AZ",
        "zip": "85253",
        "phone": "(480) 991-1770",
        "lat": 33.5681,
        "lon": -111.9772,
        "web-site": "https://www.tesseractschool.org",
        "rating_band": "Above average"
    },
    {
        "name": "St. Thomas the Apostle Catholic School",
        "school-summary": "St. Thomas the Apostle Catholic School, a private school located in Phoenix, AZ, serves grades K-8.",
        "type": "private",
        "level-codes": "e,m",
        "level": "KG,1,2,3,4,5,6,7,8",
        "street": "4510 N 24th St",
        "city": "Phoenix",
        "state": "AZ",
        "zip": "85016",
        "phone": "(602) 954-9088",
        "lat": 33.5043,
        "lon": -112.0309,
        "web-site": "https://www.staphx.org",
        "rating_band": "Average"
    },
    {
        "name": "Scottsdale Christian Academy",
        "school-summary": "Scottsdale Christian Academy, a private school located in Phoenix, AZ, serves grades PK-12.",
        "type": "private",
        "level-codes": "p,e,m,h",
        "level": "PK,KG,1,2,3,4,5,6,7,8,9,10,11,12",
        "street": "14400 N Tatum Blvd",
        "city": "Phoenix",
        "state": "AZ",
        "zip": "85032",
        "phone": "(602) 992-5100",
        "lat": 33.6218,
        "lon": -111.9772,
        "web-site": "https://www.scottsdalechristian.org",
        "rating_band": "Above average"
    }
];

/**
 * Test the proxy server connectivity
 * @returns {Promise<boolean>} True if the proxy server is accessible
 */
async function testProxyServer() {
    const PROXY_URL = 'https://greatschools-proxy-app-9528e5584f0a.herokuapp.com';
    console.log('Testing proxy server connectivity...');
    
    try {
        // Test the root endpoint which should return a simple message
        const response = await fetch(`${PROXY_URL}/`);
        const text = await response.text();
        console.log('Proxy server response:', text);
        console.log('Proxy server is accessible!');
        return true;
    } catch (error) {
        console.error('Proxy server test failed:', error);
        return false;
    }
}

/**
 * Get visible pins in the current map view
 * @returns {Array} Array of visible pin objects
 */
function getVisiblePins() {
    console.log('=== Getting visible pins in current map view ===');
    
    // Get the current map bounds
    const bounds = map.getBounds();
    console.log('Current map bounds:', bounds);
    
    // Get all pins
    const allPins = getAllLocationPins();
    console.log(`Found ${allPins.length} total pins`);
    
    // Filter pins to only those within the current bounds
    const visiblePins = allPins.filter(pin => {
        const [longitude, latitude] = pin.coordinates;
        const isVisible = bounds.contains([longitude, latitude]);
        return isVisible;
    });
    
    console.log(`${visiblePins.length} pins are visible in the current view`);
    
    // Log details of visible pins
    visiblePins.forEach((pin, index) => {
        console.log(`Visible Pin #${index + 1}:`);
        console.log(`  Name: ${pin.name}`);
        console.log(`  Coordinates: [${pin.coordinates[0]}, ${pin.coordinates[1]}]`);
        if (pin.properties && pin.properties.description) {
            console.log(`  Description: ${pin.properties.description}`);
        }
    });
    
    return visiblePins;
}

/**
 * Initialize the GreatSchools search functionality
 * @param {Object} mapInstance - The Mapbox map instance
 * @param {string} apiKey - The GreatSchools API key
 */
export function initGreatSchoolsSearch(mapInstance, apiKey) {
    map = mapInstance;
    apiKeyRef = apiKey;
    
    console.log('GreatSchools search initialized with API key:', apiKeyRef ? 'Valid API key provided' : 'No API key');
    
    // Test proxy server connectivity
    testProxyServer().then(isAccessible => {
        console.log(`Proxy server accessibility test: ${isAccessible ? 'PASSED' : 'FAILED'}`);
    });
    
    // Add event listener for the school toggle button
    const toggleButton = document.getElementById('toggle-schools');
    if (toggleButton) {
        // Initialize button text
        toggleButton.textContent = 'Show Other Schools';
        
        toggleButton.addEventListener('click', () => {
            // Log visible pins before searching
            console.log('=== Button clicked, logging visible pins ===');
            const visiblePins = getVisiblePins();
            
            if (schoolMarkers.length === 0) {
                // If no schools loaded yet, search for schools near visible pins only
                if (visiblePins.length > 0) {
                    console.log(`Searching for schools near ${visiblePins.length} visible pins`);
                    searchSchoolsNearVisiblePins();
                } else {
                    console.log('No visible pins found, searching near all pins');
                    searchSchoolsNearAllPins();
                }
                toggleButton.textContent = 'Hide Other Schools';
            } else {
                // Otherwise just toggle visibility
                const isVisible = toggleSchoolMarkers();
                toggleButton.textContent = isVisible ? 'Hide Other Schools' : 'Show Other Schools';
            }
        });
    }
    
    // Listen for map moveend events to log visible pins when city is selected
    map.on('moveend', () => {
        console.log('Map view changed, logging visible pins');
        getVisiblePins();
    });
    
    // Wait for map to be fully loaded before being ready to search
    map.on('load', () => {
        console.log('Map fully loaded, ready to search for schools');
        // Don't automatically search for schools, wait for user to click the button
    });
}

/**
 * Get city and state for the current map view using the first visible pin
 * @returns {Promise<{city: string, state: string}>} - The city and state
 */
async function getCityStateForCurrentView() {
    // Get visible pins
    const visiblePins = getVisiblePins();
    
    if (visiblePins.length === 0) {
        console.log('No visible pins to get city/state from');
        return { city: '', state: '' };
    }
    
    // Use the first visible pin for geocoding
    const firstPin = visiblePins[0];
    const [longitude, latitude] = firstPin.coordinates;
    
    console.log(`Using first visible pin for city/state: ${firstPin.name} at [${longitude}, ${latitude}]`);
    
    // Try to geocode the coordinates
    const geocoded = await geocodeCoordinates(latitude, longitude);
    
    if (geocoded.city && geocoded.state) {
        console.log(`Successfully geocoded to: ${geocoded.city}, ${geocoded.state}`);
        return geocoded;
    }
    
    // If geocoding failed, try to extract from pin description
    if (firstPin.properties && firstPin.properties.description) {
        const cleanDescription = firstPin.properties.description.replace(/<![CDATA[|]]>/g, '').trim();
        const addressMatch = cleanDescription.match(/,\s*([^,]+),\s*([A-Z]{2})(?:\s+\d+)?(?:\s+US)?$/);
        
        if (addressMatch && addressMatch.length >= 3) {
            const city = addressMatch[1].trim();
            const state = addressMatch[2].trim();
            console.log(`Extracted city/state from description: ${city}, ${state}`);
            return { city, state };
        }
    }
    
    console.log('Could not determine city/state for current view');
    return { city: '', state: '' };
}

/**
 * Search for schools near visible location pins only
 */
async function searchSchoolsNearVisiblePins() {
    console.log('=== Starting search for schools near visible pins only ===');
    
    // Get visible pins from the current map view
    const visiblePins = getVisiblePins();
    
    if (visiblePins.length === 0) {
        console.log('No visible pins found');
        showNotification('No visible pins found');
        return;
    }
    
    console.log(`Found ${visiblePins.length} visible pins`);
    
    // Log details of each visible pin for debugging
    visiblePins.forEach((pin, index) => {
        console.log(`Pin ${index + 1}: ${pin.name || 'Unnamed'} at coordinates: ${pin.coordinates ? pin.coordinates.join(', ') : 'No coordinates'}`);
    });
    
    // Clear existing markers
    clearSchoolMarkers();
    
    // Reset the allSchools array
    allSchools = [];
    
    try {
        // Search for schools near each visible pin directly using coordinates
        const searchPromises = [];
        const processedCoordinates = new Set(); // Track processed coordinates to avoid duplicates
        
        for (const pin of visiblePins) {
            // Extract coordinates directly from the pin (format is [longitude, latitude])
            if (!pin.coordinates || pin.coordinates.length !== 2) {
                console.log(`No valid coordinates found for pin ${pin.name}, skipping`);
                continue;
            }
            
            const [longitude, latitude] = pin.coordinates;
            
            // Create a unique key for these coordinates (rounded to 2 decimal places to avoid near-duplicates)
            const coordKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
            
            // Only search for these coordinates if we haven't already searched nearby
            if (!processedCoordinates.has(coordKey)) {
                console.log(`Searching for schools near coordinates: ${latitude}, ${longitude}`);
                processedCoordinates.add(coordKey);
                
                // Use the nearby-schools endpoint directly with coordinates
                searchPromises.push(searchForSchoolsNearCoordinates(latitude, longitude));
            } else {
                console.log(`Skipping duplicate coordinates: ${latitude}, ${longitude}`);
            }
        }
        
        // Wait for all searches to complete
        await Promise.all(searchPromises);
        
        console.log(`Search complete. Found ${allSchools.length} unique schools near visible pins`);
        
        // Reload KML layers to ensure they're on top of the school markers
        console.log('Reloading KML layers to ensure they appear on top');
        loadLocationLayers();
    } catch (error) {
        console.error('Error searching for schools near visible pins:', error);
        showNotification(`Error: ${error.message}`);
    }
}

/**
 * Search for schools near all location pins
 */
async function searchSchoolsNearAllPins() {
    console.log('=== Starting search for schools near all pins ===');
    
    // Clear any existing school markers
    clearSchoolMarkers();
    
    // Reset the allSchools array to avoid duplicates from previous searches
    allSchools = [];
    
    // Get all location pins from the map
    const pins = getAllLocationPins();
    console.log(`Found ${pins.length} location pins on the map:`, pins);
    
    if (pins.length === 0) {
        showNotification('No location pins found on the map');
        console.log('No location pins found on the map');
        return;
    }
    
    showNotification(`Searching for private schools near ${pins.length} location pins...`);
    
    // Search for schools near each pin sequentially
    for (const pin of pins) {
        console.log(`Processing pin: ${pin.name}`);
        await searchForSchoolsNearPin(pin);
    }
    
    console.log(`Search complete. Found ${allSchools.length} unique private schools near all pins`);
    showNotification(`Found ${allSchools.length} unique private schools near all pins`);
}

/**
 * Toggle visibility of school markers on the map
 * @returns {boolean} True if markers are now visible, false if hidden
 */
function toggleSchoolMarkers() {
    if (schoolMarkers.length === 0) {
        // If no markers exist, search for schools near all pins
        searchSchoolsNearAllPins();
        return true;
    }
    
    // Check if any markers are currently visible
    const anyVisible = schoolMarkers.some(marker => marker._element.style.display !== 'none');
    
    // Toggle visibility of all markers
    schoolMarkers.forEach(marker => {
        marker._element.style.display = anyVisible ? 'none' : 'block';
    });
    
    console.log(`School markers are now ${anyVisible ? 'hidden' : 'visible'}`);
    return !anyVisible;
}

/**
 * Clear all school markers from the map
 */
function clearSchoolMarkers() {
    console.log(`Clearing ${schoolMarkers.length} school markers from map`);
    
    // Remove each marker from the map
    schoolMarkers.forEach(marker => {
        marker.remove();
    });
    
    // Clear the markers array
    schoolMarkers = [];
}

/**
 * Get all location pins from the map
 * @returns {Array} Array of location pin objects with coordinates
 */
function getAllLocationPins() {
    console.log('=== Getting all location pins from map ===');
    const locationPins = [];
    
    // Get all sources that start with 'source-'
    const sources = map.getStyle().sources;
    console.log('Map sources:', Object.keys(sources));
    
    let sourceCount = 0;
    let featureCount = 0;
    
    for (const sourceId in sources) {
        if (sourceId.startsWith('source-')) {
            sourceCount++;
            console.log(`Checking source: ${sourceId}`);
            
            try {
                const source = map.getSource(sourceId);
                if (source) {
                    const features = map.querySourceFeatures(sourceId);
                    console.log(`Source ${sourceId} has ${features.length} features`);
                    featureCount += features.length;
                    
                    features.forEach(feature => {
                        if (feature.geometry && feature.geometry.type === 'Point') {
                            const [longitude, latitude] = feature.geometry.coordinates;
                            const name = feature.properties.name || 'Unknown Location';
                            
                            console.log(`Found pin: ${name} at [${longitude}, ${latitude}]`);
                            console.log('Pin properties:', feature.properties);
                            
                            // Check if description exists and log it
                            if (feature.properties.description) {
                                console.log(`Pin description: ${feature.properties.description}`);
                            }
                            
                            locationPins.push({
                                name,
                                coordinates: [longitude, latitude],
                                properties: feature.properties
                            });
                        } else if (feature.geometry) {
                            console.log(`Skipping non-point geometry: ${feature.geometry.type}`);
                        } else {
                            console.log('Feature has no geometry');
                        }
                    });
                } else {
                    console.log(`Source ${sourceId} not found or invalid`);
                }
            } catch (error) {
                console.error(`Error getting features from source ${sourceId}:`, error);
            }
        }
    }
    
    console.log(`Summary: Checked ${sourceCount} sources with ${featureCount} features`);
    console.log(`Found ${locationPins.length} location pins on the map`);
    return locationPins;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
}

/**
 * Geocode coordinates to get city and state using Geocodio API
 * @param {number} latitude - The latitude
 * @param {number} longitude - The longitude
 * @returns {Promise<{city: string, state: string}>} - The city and state
 */
async function geocodeCoordinates(latitude, longitude) {
    const GEOCODIO_API_KEY = '879456450774690e8f0f9ff80655ee685f56688';
    const geocodioUrl = `https://api.geocod.io/v1.7/reverse?q=${latitude},${longitude}&api_key=${GEOCODIO_API_KEY}`;
    
    console.log(`Geocoding coordinates: [${latitude}, ${longitude}]`);
    
    try {
        const response = await fetch(geocodioUrl);
        
        if (!response.ok) {
            throw new Error(`Geocoding API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Geocoding response:', data);
        
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const address = result.address_components;
            
            const city = address.city || '';
            const state = address.state || '';
            
            console.log(`Geocoded location: ${city}, ${state}`);
            return { city, state };
        } else {
            console.log('No geocoding results found');
            return { city: '', state: '' };
        }
    } catch (error) {
        console.error('Error geocoding coordinates:', error);
        return { city: '', state: '' };
    }
}

/**
 * Get city and state for a specific pin
 * @param {Object} pin - The pin object
 * @returns {Object} Object with city and state properties
 */
async function getCityStateForPin(pin) {
    console.log(`Getting city and state for pin: ${pin.name}`);
    
    try {
        // Try to extract city and state from the pin name first
        const nameMatch = pin.name.match(/([^,]+),\s*([A-Z]{2})/);
        if (nameMatch) {
            const city = nameMatch[1].trim();
            const state = nameMatch[2].trim();
            console.log(`Extracted city/state from pin name: ${city}, ${state}`);
            return { city, state };
        }
        
        // If that fails, try reverse geocoding
        const [longitude, latitude] = pin.coordinates;
        
        // Use Geocodio for reverse geocoding
        const geocodioApiKey = 'YOUR_GEOCODIO_API_KEY'; // Replace with your actual key
        const geocodioUrl = `https://api.geocod.io/v1.7/reverse?q=${latitude},${longitude}&api_key=${geocodioApiKey}`;
        
        console.log(`Reverse geocoding coordinates: ${latitude}, ${longitude}`);
        const response = await fetch(geocodioUrl);
        
        if (!response.ok) {
            throw new Error(`Geocoding API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Geocoding response:', data);
        
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const components = result.address_components;
            
            const city = components.city;
            const state = components.state;
            
            if (city && state) {
                console.log(`Geocoded city/state: ${city}, ${state}`);
                return { city, state };
            }
        }
        
        console.log('Could not extract city/state from geocoding response');
        return { city: null, state: null };
    } catch (error) {
        console.error('Error getting city/state:', error);
        return { city: null, state: null };
    }
}

// This function has been moved to use getCityStateForPin

/**
 * Search for schools by city and state
 * @param {string} city - The city name
 * @param {string} state - The state code (2 letters)
 */
async function searchForSchoolsByLocation(city, state) {
    console.log(`=== Searching for schools in ${city}, ${state} ===`);
    
    try {
        // Define the proxy server URL
        const PROXY_URL = 'https://greatschools-proxy-app-9528e5584f0a.herokuapp.com';
        
        // Clear any existing school markers
        clearSchoolMarkers();
        
        // Reset the allSchools array to avoid duplicates from previous searches
        allSchools = [];
        
        // Search for both private and public schools
        await Promise.all([
            searchSchoolsByType(city, state, 'private'),
            searchSchoolsByType(city, state, 'public')
        ]);
        
        // Display all unique schools
        displaySchools(allSchools);
        
        showNotification(`Found ${allSchools.length} schools in ${city}, ${state}`);
    } catch (error) {
        console.error(`Error searching for schools in ${city}, ${state}:`, error);
        showNotification(`Error searching for schools in ${city}, ${state}: ${error.message}`);
    }
}

/**
 * Search for schools near specific coordinates using the nearby-schools endpoint
 * @param {number} latitude - The latitude
 * @param {number} longitude - The longitude
 * @param {number} [radius=10] - Search radius in miles
 * @returns {Promise<Array>} - Array of schools
 */
async function searchForSchoolsNearCoordinates(latitude, longitude, radius = 10) {
    console.log(`=== Searching for all schools within ${radius} miles of coordinates (${latitude}, ${longitude}) ===`);
    
    try {
        // Define the proxy server URL
        const PROXY_URL = 'https://greatschools-proxy-app-9528e5584f0a.herokuapp.com';
        
        // Use the nearby-schools endpoint with radius search for all school types
        const apiUrl = `${PROXY_URL}/api/nearby-schools?lat=${latitude}&lon=${longitude}&radius=${radius}&limit=50`;
        console.log(`API URL for nearby schools:`, apiUrl);
        
        // Call the proxy server with detailed error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        console.log(`Sending request for nearby schools to proxy server...`);
        const response = await fetch(apiUrl, {
            signal: controller.signal,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        clearTimeout(timeoutId); // Clear the timeout if the request completes
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API request for nearby schools failed with status ${response.status}:`, errorText);
            throw new Error(`API request for nearby schools failed with status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`API response for nearby schools received. Found ${data.schools ? data.schools.length : 0} schools`);
        
        if (data.schools && data.schools.length > 0) {
            // Process and deduplicate schools
            const newSchools = [];
            
            for (const school of data.schools) {
                // Check if this school is already in our list
                const isDuplicate = allSchools.some(existingSchool => {
                    // Check by ID if available
                    if (school.id && existingSchool.id) {
                        return school.id === existingSchool.id;
                    }
                    
                    // Fall back to name + location check
                    return (
                        school.name === existingSchool.name &&
                        school.city === existingSchool.city &&
                        school.state === existingSchool.state
                    );
                });
                
                if (!isDuplicate) {
                    newSchools.push(school);
                    allSchools.push(school);
                } else {
                    console.log(`Skipping duplicate school: ${school.name}`);
                }
            }
            
            console.log(`Added ${newSchools.length} new schools (${data.schools.length - newSchools.length} duplicates skipped)`);
            
            // Display the schools
            displaySchools(newSchools);
            return newSchools;
        } else {
            console.log(`No schools found near coordinates (${latitude}, ${longitude})`);
            return [];
        }
    } catch (error) {
        console.error(`Error searching for schools near coordinates (${latitude}, ${longitude}):`, error);
        showNotification(`Error searching for schools: ${error.message}`);
        return [];
    }
}

/**
 * Search for schools by city, state, and type
 * @param {string} city - The city name
 * @param {string} state - The state code (2 letters)
 * @param {string} schoolType - The school type (private or public)
 */
async function searchSchoolsByType(city, state, schoolType) {
    console.log(`=== Searching for ${schoolType} schools in ${city}, ${state} ===`);
    
    try {
        // Define the proxy server URL
        const PROXY_URL = 'https://greatschools-proxy-app-9528e5584f0a.herokuapp.com';
        
        // First, get geocoded coordinates for the city/state
        const geocodeUrl = `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(city)},${state}&api_key=6b3d7b36b35b7dd3d7b3b3b3b3b3b3b3b3b3b&limit=1`;
        console.log(`Geocoding ${city}, ${state} to get coordinates...`);
        
        const geocodeResponse = await fetch(geocodeUrl);
        if (!geocodeResponse.ok) {
            throw new Error(`Geocoding failed with status ${geocodeResponse.status}`);
        }
        
        const geocodeData = await geocodeResponse.json();
        if (!geocodeData.results || geocodeData.results.length === 0) {
            throw new Error(`Could not geocode ${city}, ${state}`);
        }
        
        const location = geocodeData.results[0].location;
        const latitude = location.lat;
        const longitude = location.lng;
        
        console.log(`Geocoded ${city}, ${state} to coordinates: ${latitude}, ${longitude}`);
        
        // Use nearby-schools endpoint with radius search
        const apiUrl = `${PROXY_URL}/api/nearby-schools?lat=${latitude}&lon=${longitude}&radius=10&school_type=${schoolType}&limit=50`;
        console.log(`API URL for ${schoolType} schools:`, apiUrl);
        
        // Call the proxy server with detailed error handling
        try {
            // Add a timeout to the fetch call
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            console.log(`Sending request for ${schoolType} schools to proxy server...`);
            const response = await fetch(apiUrl, {
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId); // Clear the timeout if the request completes
            
            console.log(`Response status for ${schoolType} schools:`, response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API request for ${schoolType} schools failed with status ${response.status}:`, errorText);
                throw new Error(`API request for ${schoolType} schools failed with status ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log(`API response for ${schoolType} schools received. Data type:`, typeof data);
            console.log(`API response structure for ${schoolType} schools:`, Object.keys(data));
            
            if (data.schools && data.schools.length > 0) {
                console.log(`Found ${data.schools.length} ${schoolType} schools in ${city}, ${state}`);
                
                // Log the structure of the first school for debugging
                if (data.schools[0]) {
                    console.log(`First ${schoolType} school data example:`, {
                        name: data.schools[0].name,
                        type: data.schools[0].type,
                        city: data.schools[0].city,
                        state: data.schools[0].state,
                        rating: data.schools[0].rating || 'N/A',
                        rating_band: data.schools[0].rating_band || 'N/A'
                    });
                }
                
                // Add school type to each school object for display purposes
                data.schools.forEach(school => {
                    school.schoolType = schoolType;
                });
                
                // Process the schools and add to global array
                data.schools.forEach(school => {
                    // Check if this school is already in the allSchools array by ID or name+location
                    const isDuplicate = allSchools.some(existingSchool => 
                        (existingSchool.id && school.id && existingSchool.id === school.id) || 
                        (existingSchool.name === school.name && 
                         existingSchool.city === school.city && 
                         existingSchool.state === school.state)
                    );
                    
                    if (!isDuplicate) {
                        allSchools.push(school);
                    } else {
                        console.log(`Skipping duplicate school: ${school.name}`);
                    }
                });
                
                console.log(`After adding ${schoolType} schools, allSchools array has ${allSchools.length} schools`);
            } else {
                console.log(`No ${schoolType} schools found in ${city}, ${state}`);
            }
        } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
                console.error(`Request for ${schoolType} schools timed out after 30 seconds`);
                throw new Error(`Request for ${schoolType} schools to proxy server timed out`);
            }
            throw fetchError;
        }
    } catch (error) {
        console.error(`Error searching for ${schoolType} schools in ${city}, ${state}:`, error);
        // Don't show notification for individual type errors, let the parent function handle it
    }
}

/**
 * Search for schools near a location pin
 * @param {Object} pin - The location pin object
 */
async function searchForSchoolsNearPin(pin) {
    const [longitude, latitude] = pin.coordinates;
    const name = pin.name;
    
    // Debug logging
    console.log('Location pin selected:', pin);
    console.log('Location name:', name);
    
    showNotification(`Searching for private schools near ${name}...`);
    
    try {
        // Define the proxy server URL with the actual Heroku app URL
        const PROXY_URL = 'https://greatschools-proxy-app-9528e5584f0a.herokuapp.com'; // The correct Heroku app URL
        const USE_PROXY = true; // Using the proxy server
        
        // Use the proxy server if it's available and configured
        if (USE_PROXY) {
            console.log('Using proxy server to fetch school data');
            
            // First try to geocode the coordinates to get city and state
            const { city, state } = await geocodeCoordinates(latitude, longitude);
            
            // If geocoding failed, try to extract from pin description as fallback
            let extractedCity = '';
            let extractedState = '';
            
            if (!city || !state) {
                console.log('Geocoding failed or returned incomplete data, trying to extract from pin description');
                
                if (pin.properties && pin.properties.description) {
                    // Remove CDATA wrapper if present
                    const cleanDescription = pin.properties.description.replace(/<![CDATA[|]]>/g, '').trim();
                    
                    // Try to match address format like "123 Main St, City, ST 12345" or "123 Main St, City, ST"
                    const addressMatch = cleanDescription.match(/,\s*([^,]+),\s*([A-Z]{2})(?:\s+\d+)?(?:\s+US)?$/);
                    
                    if (addressMatch && addressMatch.length >= 3) {
                        extractedCity = addressMatch[1].trim();
                        extractedState = addressMatch[2].trim();
                        console.log(`Extracted city: ${extractedCity}, state: ${extractedState} from address: ${cleanDescription}`);
                    } else {
                        console.log(`Could not extract city/state from address: ${cleanDescription}`);
                    }
                }
            }
            
            // Use geocoded city/state if available, otherwise use extracted values
            const finalCity = city || extractedCity;
            const finalState = state || extractedState;
            
            // Construct the API URL based on available data
            let apiUrl;
            if (finalCity && finalState) {
                apiUrl = `${PROXY_URL}/api/schools?city=${encodeURIComponent(finalCity)}&state=${finalState}&school_type=private&limit=50`;
                console.log(`Using city/state for search: ${finalCity}, ${finalState}`);
            } else {
                const radius = 10; // 10-mile radius
                apiUrl = `${PROXY_URL}/api/schools?lat=${latitude}&lon=${longitude}&radius=${radius}&school_type=private&limit=50`;
                console.log(`Using coordinates for search: ${latitude}, ${longitude} with ${radius} mile radius`);
            }
            
            // Call the proxy server
            try {
                console.log(`Calling proxy server at: ${apiUrl}`);
                
                // Add a timeout to the fetch call
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                try {
                    const response = await fetch(apiUrl, {
                        signal: controller.signal,
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    clearTimeout(timeoutId); // Clear the timeout if the request completes
                    
                    console.log('Response status:', response.status);
                    console.log('Response headers:', [...response.headers.entries()]);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`API request failed with status ${response.status}:`, errorText);
                        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
                    }
                    
                    const data = await response.json();
                    console.log('API response received. Data type:', typeof data);
                    console.log('API response structure:', Object.keys(data));
                    
                    if (data.schools && data.schools.length > 0) {
                        console.log(`Found ${data.schools.length} schools from API`);
                        
                        // Log the structure of the first school for debugging
                        if (data.schools[0]) {
                            console.log('First school data example:', {
                                name: data.schools[0].name,
                                type: data.schools[0].type,
                                city: data.schools[0].city,
                                state: data.schools[0].state,
                                rating_band: data.schools[0].rating_band
                            });
                        }
                        
                        // Pass both schools and the pin to displaySchools
                        displaySchools(data.schools, pin);
                        showNotification(`Found ${data.schools.length} private schools near ${name}`);
                    } else {
                        console.log('No schools found in API response');
                        showNotification(`No private schools found near ${name}`);
                    }
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    if (fetchError.name === 'AbortError') {
                        console.error('Request timed out after 30 seconds');
                        throw new Error('Request to proxy server timed out');
                    }
                    throw fetchError;
                }
            } catch (error) {
                console.error('Error fetching school data:', error);
                showNotification(`Error searching for private schools near ${name}: ${error.message}`);
            }
        } else {
            showNotification('Proxy server not configured');
        }
    } catch (error) {
        console.error('Error searching for schools:', error);
        showNotification(`Error searching for private schools near ${name}`);
    }
}

/**
 * Handle city selection event
 * @param {CustomEvent} event - The city selected event
 */
function handleCitySelection(event) {
    currentCity = event.detail;
    
    // Clear existing school markers when city changes
    clearSchoolMarkers();
    
    // If a city is selected, automatically search for schools
    if (currentCity) {
        searchForSchools(currentCity);
    }
}

/**
 * Add school search control to the map
 */
function addSchoolSearchControl() {
    // Create a custom control container
    const controlContainer = document.createElement('div');
    controlContainer.className = 'mapboxgl-ctrl mapboxgl-ctrl-group school-search-control';
    controlContainer.style.cssText = `
        background: #fff;
        border-radius: 4px;
        padding: 0;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
    `;
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'school-toggle-btn';
    toggleButton.innerHTML = '<span style="font-size: 16px;">🏫</span>';
    toggleButton.title = 'Toggle Private Schools';
    toggleButton.style.cssText = `
        width: 30px;
        height: 30px;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    `;
    
    // Add click event to toggle button
    toggleButton.addEventListener('click', () => {
        if (!currentCity) {
            showNotification('Please select a city first');
            return;
        }
        
        // Toggle visibility of school markers
        const markersVisible = toggleSchoolMarkers();
        
        // Update button appearance based on state
        toggleButton.style.background = markersVisible ? '#4285f4' : '';
        toggleButton.style.color = markersVisible ? '#fff' : '';
    });
    
    // Assemble control
    controlContainer.appendChild(toggleButton);
    
    // Add the custom control to the map
    map.addControl({
        onAdd: function() {
            return controlContainer;
        },
        onRemove: function() {
            controlContainer.parentNode.removeChild(controlContainer);
        }
    });
}

// This function has been moved to line ~240

/**
 * Search for schools using GreatSchools API or mock data
 * @param {Object} city - The selected city object
 */
async function searchForSchools(city) {
    if (!city || !city.coordinates) {
        showNotification('No city selected');
        return;
    }
    
    const { name } = city;
    const [longitude, latitude] = city.coordinates;
    
    // Debug logging
    console.log('City selected:', city);
    console.log('City name:', name);
    
    showNotification(`Searching for private schools near ${name}...`);
    
    try {
        // Define the proxy server URL with the actual Heroku app URL
        const PROXY_URL = 'https://greatschools-proxy-app-9528e5584f0a.herokuapp.com'; // The correct Heroku app URL
        const USE_PROXY = true; // Using the proxy server
        
        // Use the proxy server if it's available and configured
        if (USE_PROXY) {
            console.log('Using proxy server to fetch school data');
            console.log('City object:', city);
            console.log('City name format:', name);
            
            // Extract city and state from the city name (assuming format like "AZ - Phoenix")
            console.log('Parsing city name format:', name);
            
            let state = '';
            let cityName = '';
            
            // Check if the format is "State - City"
            if (name.includes(' - ')) {
                const parts = name.split(' - ');
                state = parts[0].trim();
                cityName = parts[1].trim();
                console.log('Parsed from "State - City" format:', { state, cityName });
            } 
            // Check if the format is "City, State"
            else if (name.includes(',')) {
                const parts = name.split(',');
                cityName = parts[0].trim();
                state = parts[1].trim();
                console.log('Parsed from "City, State" format:', { cityName, state });
            }
            // Just use the name as the city name
            else {
                cityName = name.trim();
                // Special case for Washington DC
                if (cityName.toLowerCase().includes('washington') && cityName.toLowerCase().includes('dc')) {
                    state = 'DC';
                    console.log('Special case for Washington DC');
                } else {
                    // Default to AZ if no state found
                    state = 'AZ';
                    console.log('No state format detected, using default state:', state);
                }
            }
            
            console.log('Final extracted values - City:', cityName, 'State:', state);
            
            // Call the proxy server with city and state parameters
            try {
                console.log(`Calling proxy server at: ${PROXY_URL}/api/schools?city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(state)}&school_type=private&limit=50`);
                
                const response = await fetch(`${PROXY_URL}/api/schools?city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(state)}&school_type=private&limit=50`);
                
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                const data = await response.json();
                console.log('API response data:', data);
                
                if (data.schools && data.schools.length > 0) {
                    console.log(`Found ${data.schools.length} schools from API`);
                    
                    // Log the structure of the first school for debugging
                    if (data.schools[0]) {
                        console.log('First school data structure:', JSON.stringify(data.schools[0], null, 2));
                        
                        // Check for rating fields
                        console.log('Rating fields check:');
                        console.log('- rating:', data.schools[0].rating);
                        console.log('- rating_band:', data.schools[0].rating_band);
                        console.log('- ratings:', data.schools[0].ratings);
                        console.log('- summary_rating:', data.schools[0].summary_rating);
                    }
                    
                    displaySchools(data.schools);
                    showNotification(`Found ${data.schools.length} private schools near ${name}`);
                } else {
                    console.log('No schools found or invalid response format, using mock data');
                    displaySchools(mockPhoenixSchools);
                    showNotification(`Using mock data for ${name} (no schools found from API)`);
                }
            } catch (proxyError) {
                console.error('Error calling proxy server:', proxyError);
                console.log('Falling back to mock data due to proxy error');
                displaySchools(mockPhoenixSchools);
                showNotification(`Error calling API: ${proxyError.message}. Using mock data instead.`);
            }
            return;
        }
        
        // For development: Use mock data for Phoenix - more flexible matching
        if (name.includes('Phoenix') || name.includes('phoenix')) {
            console.log('Using mock data for Phoenix');
            // Use mock data
            displaySchools(mockPhoenixSchools);
            showNotification(`Found ${mockPhoenixSchools.length} private schools near ${name} (using Phoenix mock data)`);
            return;
        } else {
            console.log('Not using mock data - city name doesn\'t match "Phoenix"');
            // For debugging, let's use Phoenix data for any city for now
            console.log('DEBUG: Using Phoenix mock data for all cities temporarily');
            displaySchools(mockPhoenixSchools);
            showNotification(`Found ${mockPhoenixSchools.length} private schools near ${name} (using Phoenix mock data)`);
            return;
        }
        
        // For other cities, we'll show a message about CORS limitations
        // This code won't be reached with the debug override above
        showNotification('API calls are limited in development environment due to CORS restrictions');
        
        /* The following code would be used in production with a proxy server
        const apiKey = apiKeyRef;
        const response = await fetch(`https://gs-api.greatschools.org/v2/schools?lat=${latitude}&lon=${longitude}&radius=50&school_type=private&limit=50`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content': 'application/json',
                'X-API-Key': apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        displaySchools(data.schools || []);
        showNotification(`Found ${data.schools ? data.schools.length : 0} private schools near ${name}`);
        */
    } catch (error) {
        console.error('GreatSchools search error:', error);
        showNotification(`Error: ${error.message}`);
    }
}

/**
 * Display schools on the map
 * @param {Array} schools - Array of school objects
 * @param {Object} [pin] - Optional location pin near which to display schools
 */
function displaySchools(schools, pin) {
    console.log(`Displaying ${schools.length} schools on the map`);
    
    // Clear existing markers if needed
    if (!pin) {
        clearSchoolMarkers();
    }
    
    // We'll ensure KML pins are always on top by setting appropriate z-index on school markers
    
    // If no pin is provided, just display all schools without distance filtering
    if (!pin) {
        console.log(`Displaying ${schools.length} schools without distance filtering`);
        
        // Create markers for all schools
        schools.forEach(school => {
            try {
                addSchoolMarker(school);
            } catch (error) {
                console.error(`Error adding marker for school ${school.name}:`, error);
            }
        });
        return;
    }
    
    console.log('Processing schools for pin:', pin.name);
    
    // Filter schools to only include those within 10 miles of the pin
    const nearbySchools = schools.filter(school => {
        // Skip schools without lat/lon
        if (!school.lat || !school.lon) return false;
        
        // Get the distance from the pin
        const distance = calculateDistance(
            parseFloat(school.lat),
            parseFloat(school.lon),
            parseFloat(pin.coordinates[1]),  // latitude
            parseFloat(pin.coordinates[0])   // longitude
        );
        
        // Only log schools that are within range to reduce console spam
        if (distance <= 10) {
            console.log(`School ${school.name} is ${distance.toFixed(2)} miles from ${pin.name}`);
        }
        
        // Only include schools within 10 miles
        return distance <= 10;
    });
    
    console.log(`Found ${nearbySchools.length} schools within 10 miles of ${pin.name}`);
    
    // Add schools to the global array, avoiding duplicates
    nearbySchools.forEach(school => {
        // Check if this school is already in the allSchools array
        const isDuplicate = allSchools.some(existingSchool => 
            existingSchool.name === school.name && 
            existingSchool.lat === school.lat && 
            existingSchool.lon === school.lon
        );
        
        // If not a duplicate, add to allSchools array and create marker
        if (!isDuplicate) {
            allSchools.push(school);
            addSchoolMarker(school);
            console.log(`Added new school: ${school.name}`);
        } else {
            console.log(`Skipping duplicate school: ${school.name}`);
        }
    });
    
    console.log('Total unique schools displayed:', allSchools.length);
    console.log('Total school markers added:', schoolMarkers.length);
    
    // Reload KML layers to ensure they're on top of the school markers
    console.log('Reloading KML layers to ensure they appear on top');
    loadLocationLayers();
}

/**
 * Add a marker for a school
 * @param {Object} school - School data from API
 */
function addSchoolMarker(school) {
    console.log('Adding marker for school:', school.name);
    console.log('School data:', school);
    
    let latitude = null;
    let longitude = null;
    
    // Try different possible coordinate formats
    if (school.lat && school.lon) {
        latitude = parseFloat(school.lat);
        longitude = parseFloat(school.lon);
        console.log(`Using lat/lon fields: ${latitude} ${longitude}`);
    } else if (school.latitude && school.longitude) {
        latitude = parseFloat(school.latitude);
        longitude = parseFloat(school.longitude);
        console.log(`Using latitude/longitude fields: ${latitude} ${longitude}`);
    } else if (school.location && school.location.lat && school.location.lon) {
        // Some APIs nest coordinates in a location object
        latitude = parseFloat(school.location.lat);
        longitude = parseFloat(school.location.lon);
        console.log(`Using nested location fields: ${latitude} ${longitude}`);
    }
    
    // Skip if no valid coordinates
    if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
        console.error(`Skipping school ${school.name} due to missing or invalid coordinates`);
        console.error('Invalid or missing coordinates for school:', school.name);
        return;
    }
    
    // Validate map instance
    if (!map) {
        console.error('Map instance is not available');
        return;
    }
    
    // Extract rating information - try multiple possible fields
    let ratingValue = null;
    let ratingBandText = 'No Rating';
    
    console.log('School data for rating extraction:', school);
    
    // Try to get rating from various possible fields
    if (school.rating && !isNaN(parseFloat(school.rating))) {
        ratingValue = parseFloat(school.rating);
        console.log('Using rating field:', ratingValue);
    } else if (school.summary_rating && !isNaN(parseFloat(school.summary_rating))) {
        ratingValue = parseFloat(school.summary_rating);
        console.log('Using summary_rating field:', ratingValue);
    } else if (school.ratings && school.ratings.overall && !isNaN(parseFloat(school.ratings.overall))) {
        ratingValue = parseFloat(school.ratings.overall);
        console.log('Using ratings.overall field:', ratingValue);
    } else if (school.rating_band) {
        ratingBandText = school.rating_band;
        console.log('Using rating_band field:', ratingBandText);
    }
    
    // If we have a rating band, map it to a numeric value
    if (school.rating_band && school.rating_band !== 'null' && school.rating_band !== null) {
        ratingBandText = school.rating_band;
        console.log('Using rating band text:', ratingBandText);
        
        // Map rating band text to a numeric value for display
        if (ratingBandText.includes('Above average')) {
            ratingValue = 8;
        } else if (ratingBandText.includes('Average')) {
            ratingValue = 5;
        } else if (ratingBandText.includes('Below average')) {
            ratingValue = 3;
        } else if (ratingBandText.toLowerCase().includes('excellent')) {
            ratingValue = 9;
        }
    } else {
        console.log('No valid rating band found');
    }
    
    console.log(`School ${school.name} rating value: ${ratingValue}, rating band text: ${ratingBandText}`);
    
    // Create marker element
    const el = document.createElement('div');
    el.className = 'school-marker';
    
    // Determine if this is a public or private school
    const isPrivate = school.schoolType === 'private';
    
    // Default marker colors
    let markerColor = isPrivate ? '#9C27B0' : '#607D8B'; // Purple for private, gray for public without rating
    
    // If we have a rating, use a color based on the rating (for public schools)
    if (ratingValue && !isPrivate) {
        markerColor = getRatingColor(ratingValue);
        console.log(`Public school ${school.name} has rating ${ratingValue}, using color ${markerColor}`);
    } else if (isPrivate) {
        console.log(`Private school ${school.name}, using purple marker`);
    } else {
        console.log(`Public school ${school.name} has no rating, using default color`);
    }
    
    // Apply styles directly to the marker element
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = markerColor;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = 'white';
    el.style.fontWeight = 'bold';
    el.style.fontSize = '11px';
    
    // Add the rating number if available
    if (ratingValue) {
        el.textContent = Math.round(ratingValue);
    }
    
    // We're not adding a separate rating badge anymore - the rating is already shown in the main marker
    
    // Format grade levels for display
    const gradeDisplay = school['level'] || school['level-codes'] || 'N/A';
    
    // Format school level for display
    let levelDisplay = '';
    const levelCodes = school['level-codes'] || '';
    if (levelCodes.includes('e') && levelCodes.includes('m') && levelCodes.includes('h')) {
        levelDisplay = 'Elementary, Middle, High School';
    } else if (levelCodes.includes('e') && levelCodes.includes('m')) {
        levelDisplay = 'Elementary and Middle School';
    } else if (levelCodes.includes('m') && levelCodes.includes('h')) {
        levelDisplay = 'Middle and High School';
    } else if (levelCodes.includes('e')) {
        levelDisplay = 'Elementary School';
    } else if (levelCodes.includes('m')) {
        levelDisplay = 'Middle School';
    } else if (levelCodes.includes('h')) {
        levelDisplay = 'High School';
    }
    
    // Extract school type
    const schoolType = school.schoolType === 'private' ? 'Private' : 'Public';
    
    // Create popup content with higher z-index to ensure it appears on top
    const popup = new mapboxgl.Popup({ 
        offset: 15, 
        maxWidth: '300px',
        className: 'school-popup-container' // Add a custom class for styling
    })
    .setHTML(`
        <div class="school-popup" style="font-family: Arial, sans-serif; padding: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); border-radius: 4px;">
            <h3 style="margin-top: 0; margin-bottom: 8px; color: #333;">${school.name}</h3>
            
            <!-- Rating display section - prominently at the top -->
            <div style="background-color: ${ratingValue ? getRatingColor(ratingValue) : '#9E9E9E'}; color: white; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-bottom: 10px; font-weight: bold; font-size: 14px;">
                ${ratingValue ? `Rating: ${ratingValue}/10` : 'No Rating Available'}
            </div>
            
            <!-- Rating Band display -->
            <div style="margin-bottom: 10px; font-size: 13px;">
                <strong>Rating Band:</strong> ${ratingBandText || 'No Rating Band'}
            </div>
            
            <!-- School type and level badge -->
            <div style="margin-bottom: 10px;">
                <span style="background-color: #3F51B5; color: white; padding: 2px 6px; border-radius: 3px; display: inline-block; margin-right: 5px; font-size: 12px;">
                    ${schoolType}
                </span>
                ${levelDisplay ? `<span style="background-color: #607D8B; color: white; padding: 2px 6px; border-radius: 3px; display: inline-block; font-size: 12px;">
                    ${levelDisplay}
                </span>` : ''}
            </div>
            
            <!-- School details -->
            <div style="margin-top: 10px; font-size: 13px; color: #555;">
                <p style="margin: 5px 0;"><strong>Address:</strong> ${school.street || ''}, ${school.city || ''}, ${school.state || ''} ${school.zip || ''}</p>
                <p style="margin: 5px 0;"><strong>Grades:</strong> ${school.level || gradeDisplay}</p>
                ${school.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${school.phone}</p>` : ''}
                ${school['web-site'] ? `<p style="margin: 5px 0;"><a href="${school['web-site']}" target="_blank" style="color: #1976D2; text-decoration: none;">Visit Website</a></p>` : ''}
            </div>
            
            <!-- Additional details if available -->
            ${school.enrollment ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Enrollment:</strong> ${school.enrollment} students</p>` : ''}
            ${school['school-summary'] ? `<p style="margin-top: 10px; font-size: 12px; color: #777; font-style: italic;">${school['school-summary']}</p>` : ''}
        </div>
    `);
    
    // Create and add marker
    try {
        // Set a specific z-index to ensure school markers appear below KML pins
        // KML pins typically have a default z-index of 0 or higher
        el.style.zIndex = '0';
        
        // Create the marker with default options
        const marker = new mapboxgl.Marker({
            element: el,
            offset: [0, 0]
        })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map);
        
        // Store marker reference for later
        schoolMarkers.push(marker);
        console.log(`Successfully added marker for ${school.name}`);
    } catch (error) {
        console.error(`Error creating marker for ${school.name}:`, error);
    }
}

/**
 * Get color based on rating
 * @param {Number} rating - School rating (1-10)
 * @returns {String} - Color code
 */
function getRatingColor(rating) {
    if (!rating) return '#888';
    
    const numRating = parseInt(rating);
    
    if (numRating >= 8) return '#4CAF50'; // Green for high ratings
    if (numRating >= 6) return '#2196F3'; // Blue for good ratings
    if (numRating >= 4) return '#FF9800'; // Orange for average ratings
    return '#F44336'; // Red for low ratings
}

// This function has been moved to line ~265

/**
 * Show a notification to the user
 * @param {String} message - The message to display
 */
function showNotification(message) {
    // Create notification container if it doesn't exist
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        margin-bottom: 5px;
        text-align: center;
        font-size: 14px;
        pointer-events: none;
        animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
        opacity: 0;
    `;
    
    // Add animation keyframes if they don't exist
    if (!document.querySelector('#notification-style')) {
        const style = document.createElement('style');
        style.id = 'notification-style';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to container and remove after delay
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after animation completes
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
