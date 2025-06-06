/**
 * Private Schools Search
 * Searches for private schools from the simplified GeoJSON file based on proximity to visible pins
 */

// Import from locationLoader.js
import * as locationLoader from './locationLoader.js';
const { loadLocationLayers } = locationLoader;

// Global variables
let map = null;
let privateSchools = [];
let schoolMarkers = [];
let searchButton = null;
let allPrivateSchoolFeatures = null;
let distanceLineSource = null;
let distanceLineLayer = null;

/**
 * Calculate distance between two points in miles using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    // Convert latitude and longitude from degrees to radians
    const toRadians = (degrees) => degrees * Math.PI / 180;
    
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    lat1 = toRadians(lat1);
    lat2 = toRadians(lat2);
    
    // Haversine formula
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Earth's radius in miles
    const radius = 3958.8;
    
    return radius * c;
}

/**
 * Format grade range for display
 * @param {string} startGrade - Start grade from GeoJSON
 * @param {string} endGrade - End grade from GeoJSON
 * @returns {string} Formatted grade range
 */
function formatGradeRange(startGrade, endGrade) {
    if (!startGrade && !endGrade) return 'N/A';
    
    // Map grade codes to readable names
    const gradeMap = {
        'PK': 'Pre-K',
        'KG': 'Kindergarten',
        '1': '1st',
        '2': '2nd',
        '3': '3rd',
        '4': '4th',
        '5': '5th',
        '6': '6th',
        '7': '7th',
        '8': '8th',
        '9': '9th',
        '10': '10th',
        '11': '11th',
        '12': '12th'
    };
    
    const formattedStart = gradeMap[startGrade] || startGrade;
    const formattedEnd = gradeMap[endGrade] || endGrade;
    
    if (formattedStart && formattedEnd) {
        return `${formattedStart} - ${formattedEnd}`;
    } else if (formattedStart) {
        return formattedStart;
    } else {
        return formattedEnd;
    }
}

/**
 * Initialize the Private Schools search functionality
 * @param {Object} mapInstance - The Mapbox map instance
 */
export function initPrivateSchoolsSearch(mapInstance) {
    console.log('Initializing Private Schools search');
    map = mapInstance;
    
    // Use the existing "Show Nearby Schools" button for searching schools
    searchButton = document.getElementById('toggle-schools');
    if (searchButton) {
        console.log('Using existing toggle-schools button for private school search');
        // Update button text
        searchButton.textContent = 'Show Nearby Private Schools';
        
        // Add event listener for search button
        searchButton.addEventListener('click', () => {
            // Toggle between show and hide based on whether there are markers
            if (schoolMarkers.length === 0) {
                searchPrivateSchoolsNearVisiblePins();
            } else {
                clearSchoolMarkers();
                removeDistanceLine();
                // Update button text back to show
                searchButton.textContent = 'Show Nearby Private Schools';
            }
        });
    } else {
        console.error('Could not find toggle-schools button');
    }
    
    // Initialize the school markers array
    schoolMarkers = [];
    
    // Create a source and layer for the distance line
    initializeDistanceLine();
    
    // Add click handler to map to remove distance line when clicking elsewhere
    map.on('click', removeDistanceLine);
    
    // Load the private schools GeoJSON file
    loadPrivateSchoolsData();
}

/**
 * Load the private schools GeoJSON file
 */
async function loadPrivateSchoolsData() {
    try {
        const response = await fetch('data/us-private-schools-updated.geojson');
        const data = await response.json();
        
        if (data && data.features) {
            allPrivateSchoolFeatures = data.features;
            console.log(`Loaded ${allPrivateSchoolFeatures.length} private schools from GeoJSON`);
        } else {
            console.error('Invalid GeoJSON data structure');
        }
    } catch (error) {
        console.error('Error loading private schools data:', error);
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
    
    // Get all layers from the map
    const layers = map.getStyle().layers;
    
    // Find all visible location layers (those with IDs starting with 'layer-')
    const locationLayers = layers.filter(layer => 
        layer.id.startsWith('layer-') && 
        (!map.getLayoutProperty(layer.id, 'visibility') || 
         map.getLayoutProperty(layer.id, 'visibility') === 'visible')
    );
    
    // Get visible pins from each layer
    const visiblePins = [];
    
    locationLayers.forEach(layer => {
        // Get the source ID for this layer
        const sourceId = layer.source;
        
        // Get the source data
        const source = map.getSource(sourceId);
        if (source && source.type === 'geojson') {
            // Get the features from this source
            const features = map.querySourceFeatures(sourceId);
            
            // Filter features to those within the current bounds
            features.forEach(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    const coordinates = feature.geometry.coordinates;
                    
                    // Check if the feature is within the current bounds
                    // Make sure coordinates are in the correct format [lng, lat]
                    if (Array.isArray(coordinates) && coordinates.length >= 2) {
                        // Create a proper LngLat object for the bounds check
                        if (bounds.contains([coordinates[0], coordinates[1]])) {
                            visiblePins.push({
                                coordinates,
                                properties: feature.properties
                            });
                        }
                    }
                }
            });
        }
    });
    
    console.log(`Found ${visiblePins.length} visible pins`);
    return visiblePins;
}

/**
 * Search for private schools near visible location pins
 */
async function searchPrivateSchoolsNearVisiblePins() {
    console.log('=== Searching for private schools near visible pins ===');
    
    if (!allPrivateSchoolFeatures) {
        console.log('Private schools data not loaded yet');
        showNotification('Loading private schools data, please try again in a moment.', 5000);
        loadPrivateSchoolsData();
        return;
    }
    
    const visiblePins = getVisiblePins();
    if (visiblePins.length === 0) {
        console.log('No visible pins found');
        showNotification('No locations visible on the map. Please add locations or zoom out to see more.', 5000);
        return;
    }
    
    // Clear existing school markers
    clearSchoolMarkers();
    privateSchools = [];
    
    // Show loading notification
    showNotification('Searching for private schools near visible locations...', 3000);
    
    // Get unique coordinates to avoid duplicate searches
    const uniqueCoordinates = [];
    const coordinateStrings = new Set();
    
    for (const pin of visiblePins) {
        const [longitude, latitude] = pin.coordinates;
        const coordString = `${latitude},${longitude}`;
        
        if (!coordinateStrings.has(coordString)) {
            coordinateStrings.add(coordString);
            uniqueCoordinates.push({ latitude, longitude });
        }
    }
    
    console.log(`Searching private schools near ${uniqueCoordinates.length} unique locations`);
    
    // Search for schools near each unique coordinate
    const radius = 10; // Search radius in miles
    const nearbySchools = [];
    
    // For each visible pin, find schools within the radius
    uniqueCoordinates.forEach(({ latitude, longitude }) => {
        allPrivateSchoolFeatures.forEach(school => {
            // Skip schools with Grade = 'Remove'
            if (school.properties.Grade === 'Remove') {
                return;
            }
            
            const schoolCoords = school.geometry.coordinates;
            const distance = calculateDistance(
                latitude, 
                longitude, 
                schoolCoords[1], 
                schoolCoords[0]
            );
            
            if (distance <= radius) {
                // Add distance and reference pin to the school properties
                const schoolWithDistance = {
                    ...school,
                    properties: {
                        ...school.properties,
                        distance: distance.toFixed(1),
                        refPinLat: latitude,
                        refPinLng: longitude,
                        refPinName: getLocationNameFromCoordinates(longitude, latitude, visiblePins)
                    }
                };
                nearbySchools.push(schoolWithDistance);
            }
        });
    });
    
    // Remove duplicates (a school might be near multiple pins)
    const uniqueSchools = [];
    const schoolIds = new Set();
    
    nearbySchools.forEach(school => {
        // Use name and coordinates as a unique identifier
        const schoolId = `${school.properties.name}_${school.geometry.coordinates.join(',')}`;
        
        if (!schoolIds.has(schoolId)) {
            schoolIds.add(schoolId);
            uniqueSchools.push(school);
        }
    });
    
    // Sort schools by distance
    uniqueSchools.sort((a, b) => parseFloat(a.properties.distance) - parseFloat(b.properties.distance));
    
    // Store all schools and display them
    privateSchools = uniqueSchools;
    console.log(`Found ${privateSchools.length} unique private schools near visible pins`);
    
    if (privateSchools.length > 0) {
        // Display schools
        displaySchools(privateSchools);
        showNotification(`Found ${privateSchools.length} private schools near visible locations`, 5000);
        
        // Update button text to hide
        if (searchButton) {
            searchButton.textContent = 'Hide Nearby Private Schools';
        }
    } else {
        showNotification('No private schools found near visible locations', 5000);
    }
    
    // Reload location layers to ensure they're on top
    loadLocationLayers();
}

/**
 * Display schools on the map
 * @param {Array} schools - Array of school objects from GeoJSON
 */
function displaySchools(schools) {
    console.log(`Displaying ${schools.length} private schools on the map`);
    
    // Clear existing markers
    clearSchoolMarkers();
    
    // Add markers for each school
    schools.forEach(school => {
        addSchoolMarker(school);
    });
}

/**
 * Add a school marker to the map
 * @param {Object} school - School object from GeoJSON
 */
function addSchoolMarker(school) {
    const coordinates = school.geometry.coordinates;
    const properties = school.properties;
    
    // Get the school grade
    const schoolGrade = properties.Grade || '';
    
    // Create marker element
    const el = document.createElement('div');
    el.className = 'school-marker private-school-marker';
    
    // Determine pin color based on grade
    let pinColor = '#ffffff'; // Default white
    let borderColor = '#000000'; // Default black border
    let textColor = '#000000'; // Default black text
    
    // Check if grade exists and is not N/A or Unknown
    if (schoolGrade && schoolGrade !== 'N/A' && schoolGrade !== 'Unknown') {
        // A grades (A+, A, A-) get green
        if (schoolGrade.startsWith('A')) {
            pinColor = '#4CAF50'; // Green
            borderColor = '#2E7D32'; // Darker green
            textColor = '#ffffff'; // White text
        }
        // B grades get yellow
        else if (schoolGrade.startsWith('B')) {
            pinColor = '#FFEB3B'; // Yellow
            borderColor = '#F57F17'; // Amber
            textColor = '#000000'; // Black text
        }
        // C or D grades get red
        else if (schoolGrade.startsWith('C') || schoolGrade.startsWith('D')) {
            pinColor = '#F44336'; // Red
            borderColor = '#B71C1C'; // Darker red
            textColor = '#ffffff'; // White text
        }
    }
    
    // Set the marker style
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = pinColor;
    el.style.border = `2px solid ${borderColor}`;
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.justifyContent = 'center';
    el.style.alignItems = 'center';
    el.style.fontWeight = 'bold';
    el.style.fontSize = '10px';
    el.style.color = textColor;
    
    // Add grade text to pin if available and not N/A or Unknown
    if (schoolGrade && schoolGrade !== 'N/A' && schoolGrade !== 'Unknown') {
        el.textContent = schoolGrade;
    }
    
    // Create popup content
    const name = properties.name || 'Unnamed School';
    const address = properties.address || '';
    const city = properties.city || '';
    const state = properties.state || '';
    const zip = properties.zip || '';
    const enrollment = properties.enrollment || 'N/A';
    const gradeRange = formatGradeRange(properties.st_grade, properties.end_grade);
    // schoolGrade is already declared above
    const rating = properties['Great Schools Rating'] || '';
    
    // Format tuition with $ and commas if available
    let tuition = 'N/A';
    if (properties.Tuition) {
        // Remove any existing $ or commas first
        const cleanTuition = properties.Tuition.toString().replace(/[$,]/g, '');
        // Check if it's a valid number
        const tuitionNum = parseFloat(cleanTuition);
        if (!isNaN(tuitionNum)) {
            // Format with $ and commas
            tuition = '$' + tuitionNum.toLocaleString();
        } else {
            // If it's not a valid number, use the original value
            tuition = properties.Tuition;
        }
    }
    
    const distance = properties.distance ? `${properties.distance} miles away` : '';
    
    // Get reference pin information
    const refPinLat = properties.refPinLat;
    const refPinLng = properties.refPinLng;
    const refPinName = properties.refPinName || 'location pin';
    
    const popupContent = `
        <div class="school-popup" style="padding: 12px;">
            <h3 style="margin-top: 0;">${name}</h3>
            <p>${address}<br>${city}, ${state} ${zip}</p>
            <p><strong>Enrollment:</strong> ${enrollment} students</p>
            <p><strong>Grades:</strong> ${gradeRange}</p>
            <p><strong>School Grade:</strong> ${schoolGrade}</p>
            ${rating ? `<p><strong>Star Rating:</strong> ${rating}</p>` : ''}
            <p><strong>Tuition:</strong> ${tuition}</p>
            <p><strong>Distance:</strong> <a href="#" class="show-distance-line" data-school-lng="${coordinates[0]}" data-school-lat="${coordinates[1]}" data-pin-lng="${refPinLng}" data-pin-lat="${refPinLat}">${distance} miles from ${refPinName}</a></p>
        </div>
    `;
    
    // Create popup
    const popup = new mapboxgl.Popup({
        offset: 15,
        closeButton: true,
        closeOnClick: true,
        className: 'school-popup-container'
    }).setHTML(popupContent);
    
    // Add event listener for the distance line link
    popup.on('open', () => {
        setTimeout(() => {
            const distanceLink = document.querySelector('.show-distance-line');
            if (distanceLink) {
                distanceLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent map click from triggering
                    
                    const schoolLng = parseFloat(distanceLink.dataset.schoolLng);
                    const schoolLat = parseFloat(distanceLink.dataset.schoolLat);
                    const pinLng = parseFloat(distanceLink.dataset.pinLng);
                    const pinLat = parseFloat(distanceLink.dataset.pinLat);
                    
                    // Toggle the distance line
                    toggleDistanceLine(schoolLng, schoolLat, pinLng, pinLat);
                });
            }
        }, 100); // Small delay to ensure DOM is ready
    });
    
    // Create and add marker
    const marker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map);
    
    // Add to markers array for later removal
    schoolMarkers.push(marker);
}

/**
 * Clear all school markers from the map
 */
function clearSchoolMarkers() {
    schoolMarkers.forEach(marker => marker.remove());
    schoolMarkers = [];
    removeDistanceLine();
}

/**
 * Initialize the distance line source and layer
 */
function initializeDistanceLine() {
    // Check if source already exists
    if (map.getSource('distance-line-source')) {
        return;
    }
    
    // Add a source for the distance line
    map.addSource('distance-line-source', {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: []
            }
        }
    });
    
    // Add a layer to display the distance line
    map.addLayer({
        id: 'distance-line-layer',
        type: 'line',
        source: 'distance-line-source',
        layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': 'none'
        },
        paint: {
            'line-color': '#000',
            'line-width': 2,
            'line-dasharray': [2, 1]
        }
    });
    
    // Store references
    distanceLineSource = map.getSource('distance-line-source');
    distanceLineLayer = 'distance-line-layer';
}

/**
 * Toggle the distance line between a school and its reference pin
 */
function toggleDistanceLine(schoolLng, schoolLat, pinLng, pinLat) {
    if (!distanceLineSource) {
        console.error('Distance line source not initialized');
        return;
    }
    
    // Check if the line is already visible
    const currentVisibility = map.getLayoutProperty(distanceLineLayer, 'visibility');
    
    if (currentVisibility === 'visible') {
        // Check if it's the same line
        const currentData = distanceLineSource._data;
        const currentCoords = currentData.geometry.coordinates;
        
        if (currentCoords.length === 2 && 
            currentCoords[0][0] === schoolLng && 
            currentCoords[0][1] === schoolLat && 
            currentCoords[1][0] === pinLng && 
            currentCoords[1][1] === pinLat) {
            // It's the same line, so hide it
            removeDistanceLine();
            return;
        }
    }
    
    // Draw a new line
    drawDistanceLine(schoolLng, schoolLat, pinLng, pinLat);
}

/**
 * Draw a line between a school and its reference pin
 */
function drawDistanceLine(schoolLng, schoolLat, pinLng, pinLat) {
    if (!distanceLineSource) {
        console.error('Distance line source not initialized');
        return;
    }
    
    // Update the line coordinates
    distanceLineSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: [
                [schoolLng, schoolLat],
                [pinLng, pinLat]
            ]
        }
    });
    
    // Make the line visible
    map.setLayoutProperty(distanceLineLayer, 'visibility', 'visible');
}

/**
 * Remove the distance line from the map
 */
function removeDistanceLine() {
    if (distanceLineSource && distanceLineLayer) {
        map.setLayoutProperty(distanceLineLayer, 'visibility', 'none');
    }
}

/**
 * Get location name from coordinates by matching with visible pins
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {Array} pins - Array of visible pins
 * @returns {string} Location name or default text
 */
function getLocationNameFromCoordinates(lng, lat, pins) {
    // Find the pin that matches these coordinates
    for (const pin of pins) {
        if (pin.coordinates[0] === lng && pin.coordinates[1] === lat) {
            // Try to get a name from the properties
            if (pin.properties && pin.properties.name) {
                return pin.properties.name;
            }
        }
    }
    
    // Default if no name found
    return 'nearest pin';
}

/**
 * Show a notification to the user
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds to show the notification (default: 5000)
 */
function showNotification(message, duration = 5000) {
    // Check if notification container exists, create if not
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        animation: fadeIn 0.3s ease-out;
        max-width: 300px;
        text-align: center;
    `;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}
