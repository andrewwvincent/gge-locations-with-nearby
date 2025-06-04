/**
 * SchoolDigger API Integration
 * Fetches school data from SchoolDigger API via a proxy server
 */

// Import the loadLocationLayers function from locationLoader.js
import { loadLocationLayers } from './locationLoader.js';

// Global variables
let map = null;
let currentCity = null;
let schoolMarkers = [];
let searchButton = null;
let allSchools = [];

// School filter state
let schoolFilters = {
    public: true,
    private: true,
    charter: true
};

// Filter checkbox elements
let filterCheckboxes = {
    public: null,
    private: null,
    charter: null
};

/**
 * Determine school type based on isCharter and isPrivate flags
 * @param {Object} school - School object from SchoolDigger API
 * @returns {string} School type (Charter, Private, or Public)
 */
function determineSchoolType(school) {
    if (!school) return 'N/A';
    
    if (school.isCharter) return 'Charter';
    if (school.isPrivate) return 'Private';
    return 'Public';
}

/**
 * Format grade range for display
 * @param {string} lowGrade - Low grade from SchoolDigger API
 * @param {string} highGrade - High grade from SchoolDigger API
 * @returns {string} Formatted grade range
 */
function formatGradeRange(lowGrade, highGrade) {
    if (!lowGrade && !highGrade) return 'N/A';
    
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
    
    const formattedLow = gradeMap[lowGrade] || lowGrade;
    const formattedHigh = gradeMap[highGrade] || highGrade;
    
    if (formattedLow && formattedHigh) {
        return `${formattedLow} - ${formattedHigh}`;
    } else if (formattedLow) {
        return formattedLow;
    } else {
        return formattedHigh;
    }
}

/**
 * Format school ranking for display
 * @param {Object} school - School object from SchoolDigger API
 * @returns {string} Formatted ranking information
 */
function formatSchoolRanking(school) {
    if (!school || !school.rankHistory || school.rankHistory.length === 0) {
        return 'Ranking: Not available';
    }
    
    const ranking = school.rankHistory[0];
    let result = '';
    
    if (ranking.rank && ranking.rankOf) {
        result += `${ranking.rank}/${ranking.rankOf}`;
    }
    
    if (ranking.rankStars) {
        result += ` (${ranking.rankStars} stars)`;
    }
    
    if (ranking.rankLevel) {
        result += `<br>Rank Level: ${ranking.rankLevel}`;
    }
    
    return result || 'Ranking: Not available';
}

/**
 * Format school level for display
 * @param {string} level - School level from SchoolDigger API
 * @returns {string} Formatted school level
 */
function formatSchoolLevel(level) {
    if (!level) return 'N/A';
    
    // Map of common school level codes to readable names
    const levelMap = {
        'Elementary': 'Elementary',
        'Middle': 'Middle',
        'High': 'High School',
        'K-12': 'K-12',
        'K-8': 'K-8',
        'PreK-8': 'PreK-8',
        'PreK-12': 'PreK-12'
    };
    
    return levelMap[level] || level;
}

// SchoolDigger API configuration
const SCHOOLDIGGER_API_URL = 'https://api.schooldigger.com/v2.3';
const SCHOOLDIGGER_APP_ID = 'd7209052';
const SCHOOLDIGGER_APP_KEY = '97d2f47f18c475b496244e81a48fe719';

/**
 * Initialize the SchoolDigger search functionality
 * @param {Object} mapInstance - The Mapbox map instance
 */
export function initSchoolDiggerSearch(mapInstance) {
    console.log('Initializing SchoolDigger search');
    map = mapInstance;
    
    // Use the existing "Show Private Schools" button for searching schools
    searchButton = document.getElementById('toggle-schools');
    if (searchButton) {
        console.log('Using existing toggle-schools button for school search');
        // Update button text if needed
        if (searchButton.textContent !== 'Show Nearby Schools') {
            searchButton.textContent = 'Show Nearby Schools';
        }
        
        // Add event listener for search button
        searchButton.addEventListener('click', searchSchoolsNearVisiblePins);
    } else {
        console.error('Could not find toggle-schools button');
    }
    
    // Initialize filter checkboxes
    filterCheckboxes.public = document.getElementById('filter-public');
    filterCheckboxes.private = document.getElementById('filter-private');
    filterCheckboxes.charter = document.getElementById('filter-charter');
    
    // Add event listeners to filter checkboxes
    if (filterCheckboxes.public) {
        filterCheckboxes.public.addEventListener('change', () => {
            schoolFilters.public = filterCheckboxes.public.checked;
            applySchoolFilters();
        });
    }
    
    if (filterCheckboxes.private) {
        filterCheckboxes.private.addEventListener('change', () => {
            schoolFilters.private = filterCheckboxes.private.checked;
            applySchoolFilters();
        });
    }
    
    if (filterCheckboxes.charter) {
        filterCheckboxes.charter.addEventListener('change', () => {
            schoolFilters.charter = filterCheckboxes.charter.checked;
            applySchoolFilters();
        });
    }
    
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
    console.log('=== Searching for schools near visible pins ===');
    
    const visiblePins = getVisiblePins();
    if (visiblePins.length === 0) {
        console.log('No visible pins found');
        showNotification('No locations visible on the map. Please add locations or zoom out to see more.', 5000);
        return;
    }
    
    // Clear existing school markers
    clearSchoolMarkers();
    allSchools = [];
    
    // Show loading notification
    showNotification('Searching for schools near visible locations...', 3000);
    
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
    
    console.log(`Searching schools near ${uniqueCoordinates.length} unique locations`);
    
    // Search for schools near each unique coordinate
    const searchPromises = [];
    for (const { latitude, longitude } of uniqueCoordinates) {
        console.log(`Searching schools near [${longitude}, ${latitude}]`);
        searchPromises.push(searchForSchoolsNearCoordinates(latitude, longitude));
    }
    
    try {
        // Wait for all searches to complete
        const schoolResults = await Promise.all(searchPromises);
        
        // Flatten the results and remove duplicates
        const allSchoolsWithDuplicates = schoolResults.flat();
        const schoolIds = new Set();
        const uniqueSchools = [];
        
        for (const school of allSchoolsWithDuplicates) {
            if (!schoolIds.has(school.schoolid)) {
                schoolIds.add(school.schoolid);
                uniqueSchools.push(school);
            }
        }
        
        // Store all schools and display them
        allSchools = uniqueSchools;
        console.log(`Found ${allSchools.length} unique schools near visible pins`);
        
        if (allSchools.length > 0) {
            // Enable filter checkboxes
            enableFilterCheckboxes();
            
            // Show the school filters container
            const filtersContainer = document.getElementById('school-filters');
            if (filtersContainer) {
                filtersContainer.style.display = 'block';
            }
            
            // Display schools
            displaySchools(allSchools);
            showNotification(`Found ${allSchools.length} schools near visible locations`, 5000);
        } else {
            showNotification('No schools found near visible locations', 5000);
        }
        
        // Reload KML layers to ensure they're on top
        loadLocationLayers();
    } catch (error) {
        console.error('Error searching for schools:', error);
        showNotification(`Error: ${error.message}`, 5000);
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
        // For now, use a hardcoded state based on the coordinates
        // This is a simple approach - Arizona for coordinates in that range
        let state = 'AZ';
        
        // Simple check for different states based on coordinates
        // These are approximate boundaries
        if (longitude < -115) {
            state = 'CA'; // California
        } else if (longitude > -109) {
            state = 'NM'; // New Mexico
        } else if (latitude > 37) {
            state = 'UT'; // Utah
        } else if (latitude < 31.5) {
            state = 'MX'; // Mexico (will likely fail, but better than using wrong state)
        }
        
        console.log(`Using state: ${state} for coordinates: ${latitude}, ${longitude}`);
        
        // Show loading notification
        showNotification(`Searching for schools near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}...`);
        
        // Function to fetch a page of results
        async function fetchSchoolPage(page = 1) {
            // Construct the API URL with query parameters including the state
            // Use direct SchoolDigger API with proper credentials
            const apiUrl = `${SCHOOLDIGGER_API_URL}/schools?st=${state}&nearLatitude=${latitude}&nearLongitude=${longitude}&distanceMiles=${radius}&perPage=100&page=${page}&appID=${SCHOOLDIGGER_APP_ID}&appKey=${SCHOOLDIGGER_APP_KEY}`;
            
            console.log(`Calling SchoolDigger API page ${page}: ${apiUrl}`);
            
            // Make the API request
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API returned status ${response.status}: ${errorText}`);
            }
            
            return await response.json();
        }
        
        // Fetch first page to get total number of pages
        const firstPageData = await fetchSchoolPage(1);
        console.log('SchoolDigger API first page response:', firstPageData);
        
        // Check if the response has the expected structure
        if (!firstPageData || !firstPageData.schoolList) {
            console.error('Invalid API response format:', firstPageData);
            showNotification('Error: Invalid API response format');
            return [];
        }
        
        // Get all schools from first page
        let allSchoolsList = [...firstPageData.schoolList];
        
        // Calculate total number of pages
        const totalPages = Math.ceil(firstPageData.numberOfSchools / 100);
        console.log(`Total schools: ${firstPageData.numberOfSchools}, Total pages: ${totalPages}`);
        
        // If there are more pages, fetch them all
        if (totalPages > 1) {
            showNotification(`Found ${firstPageData.numberOfSchools} schools. Loading all pages...`);
            
            // Create an array of promises for pages 2 to totalPages
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(fetchSchoolPage(page));
            }
            
            // Wait for all page requests to complete
            const pageResults = await Promise.all(pagePromises);
            
            // Add schools from all pages to our list
            pageResults.forEach(pageData => {
                if (pageData && pageData.schoolList) {
                    allSchoolsList = [...allSchoolsList, ...pageData.schoolList];
                }
            });
        }
        
        console.log(`Found ${allSchoolsList.length} schools near coordinates ${latitude}, ${longitude}`);
        
        // Log the types of schools found for debugging
        const schoolTypes = {};
        allSchoolsList.forEach(school => {
            const type = determineSchoolType(school);
            schoolTypes[type] = (schoolTypes[type] || 0) + 1;
        });
        console.log('School types found:', schoolTypes);
        
        // Display the schools on the map
        displaySchools(allSchoolsList);
        
        // Show success notification
        showNotification(`Found ${allSchoolsList.length} schools within ${radius} miles`);
        
        return allSchoolsList;
    } catch (error) {
        console.error('Error searching for schools near coordinates:', error);
        showNotification(`Error: ${error.message}`);
        return [];
    }
}

// Note: We're using a simpler approach with hardcoded state detection based on coordinates

/**
 * Enable the school filter checkboxes
 */
function enableFilterCheckboxes() {
    console.log('Enabling school filter checkboxes');
        
    // Enable each checkbox
    if (filterCheckboxes.public) {
        filterCheckboxes.public.disabled = false;
    }
        
    if (filterCheckboxes.private) {
        filterCheckboxes.private.disabled = false;
    }
        
    if (filterCheckboxes.charter) {
        filterCheckboxes.charter.disabled = false;
    }
}

/**
 * Apply school type filters to the displayed schools
 */
function applySchoolFilters() {
    console.log('Applying school type filters');
    console.log(`Filters - Public: ${schoolFilters.public}, Private: ${schoolFilters.private}, Charter: ${schoolFilters.charter}`);
        
    // Clear all existing markers
    clearSchoolMarkers();
        
    // If no schools are loaded, return
    if (!allSchools || allSchools.length === 0) {
        return;
    }
        
    // Filter schools based on type
    const filteredSchools = allSchools.filter(school => {
        const schoolType = determineSchoolType(school);
            
        if (schoolType === 'Charter' && !schoolFilters.charter) {
            return false;
        }
            
        if (schoolType === 'Private' && !schoolFilters.private) {
            return false;
        }
            
        if (schoolType === 'Public' && !schoolFilters.public) {
            return false;
        }
            
        return true;
    });
        
    console.log(`Displaying ${filteredSchools.length} schools after filtering`);
        
    // Add each filtered school as a marker
    for (const school of filteredSchools) {
        addSchoolMarker(school);
    }
}

/**
 * Display schools on the map
 * @param {Array} schools - Array of school objects from SchoolDigger API
 */
function displaySchools(schools) {
    console.log(`Displaying ${schools.length} schools on the map`);
    
    if (!Array.isArray(schools)) {
        console.error('Schools is not an array:', schools);
        return;
    }
    
    // Process each school to add to allSchools array
    schools.forEach(school => {
        // Check if this school is already in the allSchools array using schoolID
        const isDuplicate = allSchools.some(existingSchool => 
            existingSchool.schoolid === school.schoolid
        );
        
        // If not a duplicate, add to allSchools array
        if (!isDuplicate) {
            allSchools.push(school);
            console.log(`Added new school: ${school.schoolName || 'Unknown School'}`);
        } else {
            console.log(`Skipping duplicate school: ${school.schoolName || 'Unknown School'}`);
        }
    });
    
    console.log('Total unique schools in database:', allSchools.length);
    
    // Apply filters to display only the schools that match the current filter settings
    applySchoolFilters();
    
    // Reload KML layers to ensure they're on top of the school markers
    console.log('Reloading KML layers to ensure they appear on top');
    loadLocationLayers();
}

/**
 * Add a school marker to the map
 * @param {Object} school - School object from SchoolDigger API
 */
function addSchoolMarker(school) {
    // Log the school object to debug
    console.log('School object:', school);
    
    // Check if school is defined and has required properties
    if (!school || typeof school !== 'object') {
        console.error('Invalid school object:', school);
        return;
    }
    
    // Extract coordinates from the school object
    // SchoolDigger API returns coordinates in address.latLong
    const latitude = school.address?.latLong?.latitude;
    const longitude = school.address?.latLong?.longitude;
    
    // Verify coordinates are valid
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        console.error(`Invalid coordinates for school ${school.schoolName || 'unknown'}: [${longitude}, ${latitude}]`);
        return;
    }
    
    // Create marker element
    const el = document.createElement('div');
    el.className = 'school-marker';
    
    // Determine marker color based on school rating
    let markerColor = '#888888'; // Default gray for no rating
    let ratingValue = null;
    
    // Check if the school has a ranking
    if (school.rankHistory && school.rankHistory.length > 0) {
        const latestRank = school.rankHistory[0];
        
        // If we have rankStars, use that for coloring (1-5 stars)
        if (latestRank.rankStars) {
            ratingValue = latestRank.rankStars;
            
            // Color based on stars (1-5)
            if (ratingValue >= 4) {
                markerColor = '#0a9e01'; // Green for high ratings (4-5 stars)
            } else if (ratingValue >= 2.5) {
                markerColor = '#ff9900'; // Orange for medium ratings (2.5-3.9 stars)
            } else {
                markerColor = '#cc0000'; // Red for low ratings (1-2.4 stars)
            }
        }
        // If no stars but we have rank, use rank for coloring
        else if (latestRank.rank && latestRank.rankOf) {
            // Convert rank to a percentage (lower rank number is better)
            const percentile = 100 - ((latestRank.rank / latestRank.rankOf) * 100);
            
            // Normalize to a 1-10 scale
            ratingValue = Math.round(percentile / 10);
            
            // Color based on percentile
            if (percentile >= 70) {
                markerColor = '#0a9e01'; // Green for top 30%
            } else if (percentile >= 40) {
                markerColor = '#ff9900'; // Orange for middle 30%
            } else {
                markerColor = '#cc0000'; // Red for bottom 40%
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
        .setLngLat([longitude, latitude])
        .addTo(map);
        
        // Add popup with school information
        marker.setPopup(
            new mapboxgl.Popup({ offset: 25, maxWidth: '320px' })
            .setHTML(`
                <div style="font-family: Arial, sans-serif;">
                    <h3 style="margin-bottom: 8px; color: #333;">${school.schoolName || 'Unknown School'}</h3>
                    
                    <div style="display: flex; margin-bottom: 5px;">
                        <div style="font-weight: bold; width: 80px;">Address:</div>
                        <div>${school.address?.street || ''}, ${school.address?.city || ''}, ${school.address?.state || ''} ${school.address?.zip || ''}</div>
                    </div>
                    
                    <div style="display: flex; margin-bottom: 5px;">
                        <div style="font-weight: bold; width: 80px;">Grades:</div>
                        <div>${formatGradeRange(school.lowGrade, school.highGrade)}</div>
                    </div>
                    
                    <div style="display: flex; margin-bottom: 5px;">
                        <div style="font-weight: bold; width: 80px;">Level:</div>
                        <div>${school.schoolLevel || 'N/A'}</div>
                    </div>
                    
                    <div style="display: flex; margin-bottom: 5px;">
                        <div style="font-weight: bold; width: 80px;">Type:</div>
                        <div>${determineSchoolType(school)}</div>
                    </div>
                    
                    <div style="display: flex; margin-bottom: 5px;">
                        <div style="font-weight: bold; width: 80px;">District:</div>
                        <div>${school.districtName || 'N/A'}</div>
                    </div>
                    
                    <div style="display: flex; margin-bottom: 5px;">
                        <div style="font-weight: bold; width: 80px;">Ranking:</div>
                        <div>${formatSchoolRanking(school)}</div>
                    </div>
                    
                    ${school.enrollment ? 
                        `<div style="display: flex; margin-bottom: 5px;">
                            <div style="font-weight: bold; width: 80px;">Enrollment:</div>
                            <div>${school.enrollment}</div>
                        </div>` : ''
                    }
                    
                    ${school.phone ? 
                        `<div style="display: flex; margin-bottom: 5px;">
                            <div style="font-weight: bold; width: 80px;">Phone:</div>
                            <div>${school.phone}</div>
                        </div>` : ''
                    }
                    
                    <div style="margin-top: 10px;">
                        <a href="${school.url || `https://www.schooldigger.com/go/${school.schoolid}`}" target="_blank" style="color: #4285F4; text-decoration: none;">More Information</a>
                    </div>
                </div>
            `)
        );
        
        // Add the marker to our tracking array
        schoolMarkers.push(marker);
        
        console.log(`Added marker for ${school.schoolName || 'Unknown School'} at [${longitude}, ${latitude}]`);
    } catch (error) {
        console.error(`Error adding marker for ${school.schoolName || 'Unknown School'}:`, error);
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
 * @param {number} duration - Duration in milliseconds to show the notification (default: 5000)
 */
function showNotification(message, duration = 5000) {
    // Check if notification container exists, if not create it
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.bottom = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    notification.style.color = 'white';
    notification.style.padding = '10px 15px';
    notification.style.marginTop = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    notification.textContent = message;
    
    // Add notification to container
    notificationContainer.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    }, duration);
    
    // Also log to console
    console.log(`Notification: ${message}`);
}
