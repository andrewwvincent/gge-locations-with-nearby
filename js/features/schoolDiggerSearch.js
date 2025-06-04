/**
 * SchoolDigger API Integration
 * Fetches school data from SchoolDigger API via a proxy server
 */

// Import the loadLocationLayers function from locationLoader.js
import { loadLocationLayers } from './locationLoader.js';

let map;
let currentCity;
let allSchools = [];
let schoolMarkers = [];

// Proxy server URL
const PROXY_URL = 'https://greatschools-proxy-app-9528e5584f0a.herokuapp.com';

/**
 * Initialize the SchoolDigger search functionality
 * @param {Object} mapInstance - The Mapbox map instance
 */
export function initSchoolDiggerSearch(mapInstance) {
    console.log('Initializing SchoolDigger search');
    map = mapInstance;
    
    // Add event listeners for search buttons
    document.getElementById('search-schools-btn').addEventListener('click', searchSchoolsNearVisiblePins);
    
    // Initialize the school markers array
    schoolMarkers = [];
    allSchools = [];
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
    
    console.log(`Found ${sourceCount} sources with ${featureCount} features`);
    console.log(`Extracted ${locationPins.length} location pins with coordinates`);
    
    return locationPins;
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
                
                // Use the SchoolDigger endpoint with coordinates
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
 * Search for schools near specific coordinates using SchoolDigger API
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {number} radius - Search radius in miles (default: 10)
 */
async function searchForSchoolsNearCoordinates(latitude, longitude, radius = 10) {
    console.log(`Searching for schools near coordinates: ${latitude}, ${longitude} with radius ${radius} miles`);
    
    try {
        // Construct the API URL with query parameters
        const apiUrl = `${PROXY_URL}/api/schooldigger?nearLatitude=${latitude}&nearLongitude=${longitude}&distanceMiles=${radius}`;
        
        console.log(`Calling API: ${apiUrl}`);
        
        // Make the API request
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('SchoolDigger API response:', data);
        
        // Process the schools from the response
        const schools = data.schoolList || [];
        console.log(`Found ${schools.length} schools near coordinates ${latitude}, ${longitude}`);
        
        // Display the schools on the map
        displaySchools(schools);
        
        return schools;
    } catch (error) {
        console.error('Error searching for schools near coordinates:', error);
        showNotification(`Error: ${error.message}`);
        return [];
    }
}

/**
 * Display schools on the map
 * @param {Array} schools - Array of school objects from SchoolDigger API
 */
function displaySchools(schools) {
    console.log(`Displaying ${schools.length} schools on the map`);
    
    // Process each school
    schools.forEach(school => {
        // Check if this school is already in the allSchools array
        const isDuplicate = allSchools.some(existingSchool => 
            existingSchool.schoolid === school.schoolid
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
 * Add a school marker to the map
 * @param {Object} school - School object from SchoolDigger API
 */
function addSchoolMarker(school) {
    // Create marker element
    const el = document.createElement('div');
    el.className = 'school-marker';
    
    // Determine marker color based on school rating
    let markerColor = '#888888'; // Default gray for no rating
    let ratingValue = null;
    
    // Check if the school has a rating
    if (school.rankHistory && school.rankHistory.length > 0) {
        const latestRank = school.rankHistory[0];
        if (latestRank.rank && latestRank.rank > 0) {
            // Convert rank to a 1-10 scale (lower rank number is better)
            // Assuming rank is out of 100, so 1 is best, 100 is worst
            const normalizedRank = 10 - Math.min(9, Math.floor(latestRank.rank / 10));
            ratingValue = normalizedRank;
            
            // Color based on normalized rank (1-10)
            if (normalizedRank >= 8) {
                markerColor = '#0a9e01'; // Green for high ratings (8-10)
            } else if (normalizedRank >= 4) {
                markerColor = '#ff9900'; // Orange for medium ratings (4-7)
            } else {
                markerColor = '#cc0000'; // Red for low ratings (1-3)
            }
        }
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
    
    // Create and add marker
    try {
        // Set a specific z-index to ensure school markers appear below KML pins
        el.style.zIndex = '0';
        
        // Create the marker with default options
        const marker = new mapboxgl.Marker({
            element: el,
            offset: [0, 0]
        })
        .setLngLat([school.lon, school.lat])
        .addTo(map);
        
        // Add popup with school information
        marker.setPopup(
            new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                <h3>${school.name}</h3>
                <p><strong>Type:</strong> ${school.schoolLevel || 'N/A'}</p>
                <p><strong>District:</strong> ${school.districtName || 'N/A'}</p>
                <p><strong>Address:</strong> ${school.address.street || ''}, ${school.address.city || ''}, ${school.address.state || ''} ${school.address.zip || ''}</p>
                ${school.rankHistory && school.rankHistory.length > 0 ? 
                    `<p><strong>State Rank:</strong> ${school.rankHistory[0].rank} out of ${school.rankHistory[0].totalSchools} (${school.rankHistory[0].year})</p>` : 
                    '<p><strong>Ranking:</strong> Not available</p>'
                }
                <p><a href="${school.url}" target="_blank">View School Website</a></p>
            `)
        );
        
        // Add the marker to our tracking array
        schoolMarkers.push(marker);
        
        console.log(`Added marker for ${school.name} at [${school.lon}, ${school.lat}]`);
    } catch (error) {
        console.error(`Error adding marker for ${school.name}:`, error);
    }
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
 * Show a notification to the user
 * @param {string} message - The message to display
 */
function showNotification(message) {
    // Check if notification container exists, if not create it
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '10px';
        notificationContainer.style.right = '10px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notification.style.color = 'white';
    notification.style.padding = '10px 15px';
    notification.style.marginBottom = '5px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    notification.style.transition = 'opacity 0.3s';
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    }, 5000);
}
