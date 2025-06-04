// Import config
import { config } from '../../config.js';

let map; // Will be initialized from main script
let popup; // Global popup for hover states
let activeStatusFilters = new Set(['#Grade-A', '#Grade-B', '#Grade-C', '#Grade-D']); // Track active status filters

// Status to zone type mapping
const statusToZoneType = {
    '#Grade-A': 'Grade A',
    '#Grade-B': 'Grade B',
    '#Grade-C': 'Grade C',
    '#Grade-D': 'Grade D'
};

// Zone type to status mapping
const zoneTypeToStatus = {
    '#Grade-A': 'Grade A',
    '#Grade-B': 'Grade B',
    '#Grade-C': 'Grade C',
    '#Grade-D': 'Grade D'
};

// Status colors for zones
const statusColors = {
    '#Grade-A': '#32a955',
    '#Grade-B': '#fed869',
    '#Grade-C': '#ff9801',
    '#Grade-D': '#ea4235'
};

// Initialize location loader
export function initLocationLoader(mapInstance) {
    map = mapInstance;
    
    // Create popup
    popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        className: 'location-popup',
        anchor: 'bottom',
        maxWidth: '300px'
    });

    createLocationFilters();
    createStatusFilters();
    loadLocationLayers();
}

// Create location filters in HTML
function createLocationFilters() {
    const filterForm = document.getElementById('filter-form');

    // Create location filters section
    const locationSection = document.createElement('div');
    locationSection.className = 'location-controls';
    locationSection.innerHTML = '<h3>Location Filters</h3>';

    // Create container for location filters
    const locationFilters = document.createElement('div');
    locationFilters.className = 'location-filters';

    // Create filters for each location layer
    config.locationLayers.forEach(layer => {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'location-filter';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `location-${layer.id}`;
        checkbox.checked = true; // Always checked by default
        checkbox.addEventListener('change', () => toggleLocationLayer(layer.id));

        // Create shape preview container
        const shapeContainer = document.createElement('span');
        shapeContainer.style.cssText = `
            display: inline-block;
            vertical-align: middle;
            margin: 0 8px;
        `;

        // Create SVG for shape preview
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24');
        
        let shapePath;
        if (layer.defaultShape === 'circle') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shapePath.setAttribute('cx', '12');
            shapePath.setAttribute('cy', '12');
            shapePath.setAttribute('r', '8');
        } else if (layer.defaultShape === 'square') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shapePath.setAttribute('x', '4');
            shapePath.setAttribute('y', '4');
            shapePath.setAttribute('width', '16');
            shapePath.setAttribute('height', '16');
        } else if (layer.defaultShape === 'star') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const points = [];
            const outerRadius = 10;
            const innerRadius = outerRadius * 0.4;
            for (let i = 0; i < 10; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / 5 - Math.PI / 2;
                const x = 12 + radius * Math.cos(angle);
                const y = 12 + radius * Math.sin(angle);
                points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
            }
            points.push('Z');
            shapePath.setAttribute('d', points.join(' '));
        } else if (layer.defaultShape === 'triangle') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const height = 16;
            const side = height * 2 / Math.sqrt(3);
            shapePath.setAttribute('d', `M 12 4 L ${12 + side/2} 20 L ${12 - side/2} 20 Z`);
        } else if (layer.defaultShape === 'diamond') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shapePath.setAttribute('d', 'M 12 4 L 20 12 L 12 20 L 4 12 Z');
        } else if (layer.defaultShape === 'hexagon') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const hexPoints = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3 - Math.PI / 6;
                const x = 12 + 8 * Math.cos(angle);
                const y = 12 + 8 * Math.sin(angle);
                hexPoints.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
            }
            hexPoints.push('Z');
            shapePath.setAttribute('d', hexPoints.join(' '));
        } else if (layer.defaultShape === 'pentagon') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pentPoints = [];
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = 12 + 8 * Math.cos(angle);
                const y = 12 + 8 * Math.sin(angle);
                pentPoints.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
            }
            pentPoints.push('Z');
            shapePath.setAttribute('d', pentPoints.join(' '));
        } else if (layer.defaultShape === 'cross') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shapePath.setAttribute('d', 'M 4 12 L 20 12 M 12 4 L 12 20');
            shapePath.setAttribute('stroke-linecap', 'square');
        }

        shapePath.setAttribute('fill', '#888888'); // Use a neutral gray for shape preview
        shapePath.setAttribute('stroke', '#000');
        shapePath.setAttribute('stroke-width', config.defaultStrokeWidths[layer.defaultShape]);

        svg.appendChild(shapePath);
        shapeContainer.appendChild(svg);

        const label = document.createElement('label');
        label.htmlFor = `location-${layer.id}`;
        label.textContent = layer.name;
        label.style.verticalAlign = 'middle';

        filterContainer.appendChild(checkbox);
        filterContainer.appendChild(shapeContainer);
        filterContainer.appendChild(label);
        locationFilters.appendChild(filterContainer);
    });

    locationSection.appendChild(locationFilters);
    filterForm.appendChild(locationSection);
}

// Create status filters in HTML
function createStatusFilters() {
    const filterForm = document.getElementById('filter-form');

    // Create status filters section
    const statusSection = document.createElement('div');
    statusSection.className = 'status-controls';
    statusSection.innerHTML = '<h3>Status Filters</h3>';

    // Create container for status filters with grey background
    const statusFilters = document.createElement('div');
    statusFilters.className = 'status-filters';
    statusFilters.style.cssText = `
        background-color: #f8f8f8;
        border-radius: 4px;
        padding: 10px;
    `;

    // Define status types and their labels
    const statusTypes = [
        { id: 'Grade-A', label: 'Grade A' },
        { id: 'Grade-B', label: 'Grade B' },
        { id: 'Grade-C', label: 'Grade C' },
        { id: 'Grade-D', label: 'Grade D' },
    ];

    // Create filters for each status type
    statusTypes.forEach(status => {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'status-filter';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `status-${status.id}`;
        checkbox.checked = true;
        checkbox.addEventListener('change', (e) => toggleStatusFilter(status.id, e.target.checked));

        // Create color preview box
        const colorBox = document.createElement('div');
        colorBox.style.cssText = `
            display: inline-block;
            width: 12px;
            height: 12px;
            background-color: ${config.statusColors['#' + status.id]};
            border: 1px solid #000000;
            margin-right: 6px;
            vertical-align: middle;
        `;

        const label = document.createElement('label');
        label.htmlFor = `status-${status.id}`;
        label.textContent = status.label;
        label.style.verticalAlign = 'middle';

        filterContainer.appendChild(checkbox);
        filterContainer.appendChild(colorBox);
        filterContainer.appendChild(label);
        statusFilters.appendChild(filterContainer);
    });

    statusSection.appendChild(statusFilters);
    filterForm.appendChild(statusSection);
}

// Toggle status filter
function toggleStatusFilter(statusId, isVisible) {
    const styleUrl = `#${statusId}`;
    if (isVisible) {
        activeStatusFilters.add(styleUrl);
    } else {
        activeStatusFilters.delete(styleUrl);
    }

    // Update visibility for all layers
    config.locationLayers.forEach(layer => {
        const layerId = `layer-${layer.id}`;
        if (map.getLayer(layerId)) {
            const locationEnabled = document.getElementById(`location-${layer.id}`).checked;
            const visibility = locationEnabled ? 'visible' : 'none';
            map.setLayoutProperty(layerId, 'visibility', visibility);

            if (visibility === 'visible') {
                // Filter features based on active status filters
                const filter = ['in', ['get', 'styleUrl'], ['literal', Array.from(activeStatusFilters)]];
                map.setFilter(layerId, filter);
            }
        }
    });

}

// Toggle location layer
function toggleLocationLayer(layerId) {
    const fullLayerId = `layer-${layerId}`;
    if (map.getLayer(fullLayerId)) {
        const isVisible = document.getElementById(`location-${layerId}`).checked;
        map.setLayoutProperty(fullLayerId, 'visibility', isVisible ? 'visible' : 'none');
        
        if (isVisible) {
            // Re-apply status filters when showing layer
            const filter = ['in', ['get', 'styleUrl'], ['literal', Array.from(activeStatusFilters)]];
            map.setFilter(fullLayerId, filter);
        }
    }
}

/**
 * Remove existing KML layers and sources to avoid ID conflicts
 */
function removeExistingKmlLayers() {
    // Get all layers and sources from the map style
    const style = map.getStyle();
    
    // First, get all layer and source IDs to remove
    const layersToRemove = [];
    const sourcesToRemove = [];
    
    // Find all KML layers
    style.layers.forEach(layer => {
        if (layer.id.startsWith('layer-')) {
            layersToRemove.push(layer.id);
        }
    });
    
    // Find all KML sources
    Object.keys(style.sources).forEach(sourceId => {
        if (sourceId.startsWith('source-')) {
            sourcesToRemove.push(sourceId);
        }
    });
    
    // First remove all layers (must be done before removing sources)
    layersToRemove.forEach(layerId => {
        console.log(`Removing existing KML layer: ${layerId}`);
        try {
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
        } catch (error) {
            console.log(`Error removing layer ${layerId}:`, error);
        }
    });
    
    // Then remove all sources
    sourcesToRemove.forEach(sourceId => {
        console.log(`Removing existing KML source: ${sourceId}`);
        try {
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
        } catch (error) {
            console.log(`Error removing source ${sourceId}:`, error);
        }
    });
}

// Load KML layers
export function loadLocationLayers() {
    // Instead of removing all layers and sources, we'll check if they exist first
    // and only add them if they don't exist
    const style = map.getStyle();
    const existingSources = Object.keys(style.sources);
    const existingLayers = style.layers.map(layer => layer.id);
    
    config.locationLayers.forEach(layer => {
        // Load KML file
        fetch(layer.file)
            .then(response => response.text())
            .then(kmlText => {
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, 'text/xml');
                
                // Extract coordinates and properties from KML
                const placemarks = kml.getElementsByTagName('Placemark');
                const features = Array.from(placemarks).map(placemark => {
                    const coordinates = placemark.getElementsByTagName('coordinates')[0].textContent
                        .trim()
                        .split(',')
                        .map(Number);

                    const nTag = placemark.getElementsByTagName('n')[0];
                    const title = nTag ? nTag.textContent : '';
                    const description = placemark.getElementsByTagName('description')[0]?.textContent || '';
                    const styleUrl = placemark.getElementsByTagName('styleUrl')[0]?.textContent || '';
                    
                    // Remove CDATA wrapper if present
                    const cleanDescription = description.replace(/^\[CDATA\[|\]\]$/g, '').trim();

                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [coordinates[0], coordinates[1]]
                        },
                        properties: {
                            name: title,
                            description: cleanDescription,
                            styleUrl: styleUrl
                        }
                    };
                });

                // Create GeoJSON source
                const sourceId = `source-${layer.id}`;
                const layerId = `layer-${layer.id}`;
                
                // Check if layer exists and remove it first
                if (existingLayers.includes(layerId)) {
                    try {
                        map.removeLayer(layerId);
                        console.log(`Removed existing layer: ${layerId}`);
                    } catch (error) {
                        console.log(`Error removing layer ${layerId}:`, error);
                    }
                }
                
                // Check if source exists
                if (existingSources.includes(sourceId)) {
                    // Update the existing source with new data
                    try {
                        const source = map.getSource(sourceId);
                        if (source && typeof source.setData === 'function') {
                            source.setData({
                                type: 'FeatureCollection',
                                features: features
                            });
                            console.log(`Updated existing source: ${sourceId}`);
                        } else {
                            // If we can't update, remove and recreate
                            map.removeSource(sourceId);
                            map.addSource(sourceId, {
                                type: 'geojson',
                                data: {
                                    type: 'FeatureCollection',
                                    features: features
                                }
                            });
                            console.log(`Recreated source: ${sourceId}`);
                        }
                    } catch (error) {
                        console.log(`Error updating source ${sourceId}:`, error);
                        // If there's an error, try removing and recreating
                        try {
                            map.removeSource(sourceId);
                            map.addSource(sourceId, {
                                type: 'geojson',
                                data: {
                                    type: 'FeatureCollection',
                                    features: features
                                }
                            });
                        } catch (innerError) {
                            console.log(`Failed to recreate source ${sourceId}:`, innerError);
                            return; // Skip this layer if we can't fix it
                        }
                    }
                } else {
                    // Add new source if it doesn't exist
                    try {
                        map.addSource(sourceId, {
                            type: 'geojson',
                            data: {
                                type: 'FeatureCollection',
                                features: features
                            }
                        });
                        console.log(`Added new source: ${sourceId}`);
                    } catch (error) {
                        console.log(`Error adding source ${sourceId}:`, error);
                        return; // Skip this layer if we can't add the source
                    }
                }

                // Add layer for points
                // layerId is already defined above

                // Create icons for each status color
                Object.entries(config.statusColors).forEach(([status, color]) => {
                    // Create icon with the status color and shape
                    // Remove the '#' from status since our icons are named without it
                    const statusId = status.slice(1);
                    const iconId = `${layer.defaultShape}-${statusId}`;
                    if (!map.hasImage(iconId)) {
                        const { canvasSize, displaySize, padding } = config.iconConfig;
                        const scale = canvasSize / displaySize;
                        
                        const canvas = document.createElement('canvas');
                        canvas.width = canvasSize;
                        canvas.height = canvasSize;
                        const ctx = canvas.getContext('2d');
                        
                        // Clear the canvas
                        ctx.clearRect(0, 0, canvasSize, canvasSize);

                        // Scale everything up
                        ctx.save();
                        ctx.scale(scale, scale);

                        // Set up common styles
                        ctx.fillStyle = color; 
                        ctx.strokeStyle = '#000000';
                        // Scale the stroke width relative to the display size
                        const baseStrokeWidth = config.defaultStrokeWidths[layer.defaultShape];
                        const scaledStrokeWidth = (baseStrokeWidth * displaySize * config.iconConfig.strokeScale) / 24;
                        ctx.lineWidth = scaledStrokeWidth;
                        ctx.lineCap = 'square';

                        // Convert coordinates to display size
                        const drawCenter = displaySize / 2;
                        const drawPadding = padding;

                        switch (layer.defaultShape) {
                            case 'square':
                                ctx.beginPath();
                                ctx.rect(drawPadding, drawPadding, displaySize - 2 * drawPadding, displaySize - 2 * drawPadding);
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'diamond':
                                ctx.beginPath();
                                ctx.moveTo(drawCenter, drawPadding);
                                ctx.lineTo(displaySize - drawPadding, drawCenter);
                                ctx.lineTo(drawCenter, displaySize - drawPadding);
                                ctx.lineTo(drawPadding, drawCenter);
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'hexagon':
                                ctx.beginPath();
                                const hexRadius = (displaySize - 2 * drawPadding) / 2;
                                for (let i = 0; i < 6; i++) {
                                    const angle = (i * Math.PI) / 3 - Math.PI / 6;
                                    const x = drawCenter + hexRadius * Math.cos(angle);
                                    const y = drawCenter + hexRadius * Math.sin(angle);
                                    if (i === 0) ctx.moveTo(x, y);
                                    else ctx.lineTo(x, y);
                                }
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'pentagon':
                                ctx.beginPath();
                                const pentRadius = (displaySize - 2 * drawPadding) / 2;
                                for (let i = 0; i < 5; i++) {
                                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                                    const x = drawCenter + pentRadius * Math.cos(angle);
                                    const y = drawCenter + pentRadius * Math.sin(angle);
                                    if (i === 0) ctx.moveTo(x, y);
                                    else ctx.lineTo(x, y);
                                }
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'cross':
                                const crossWidth = (displaySize - 2 * drawPadding) / 3;
                                ctx.beginPath();
                                // Horizontal bar
                                ctx.rect(drawPadding, drawCenter - crossWidth/2, displaySize - 2*drawPadding, crossWidth);
                                // Vertical bar
                                ctx.rect(drawCenter - crossWidth/2, drawPadding, crossWidth, displaySize - 2*drawPadding);
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'star':
                                const outerRadius = (displaySize - 2 * drawPadding) / 2;
                                const innerRadius = outerRadius * 0.4;
                                ctx.beginPath();
                                for (let i = 0; i < 10; i++) {
                                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                                    const angle = (i * Math.PI) / 5 - Math.PI / 2;
                                    const x = drawCenter + radius * Math.cos(angle);
                                    const y = drawCenter + radius * Math.sin(angle);
                                    if (i === 0) ctx.moveTo(x, y);
                                    else ctx.lineTo(x, y);
                                }
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'triangle':
                                const height = displaySize - 2 * drawPadding;
                                const side = height * 2 / Math.sqrt(3);
                                ctx.beginPath();
                                ctx.moveTo(drawCenter, drawPadding);
                                ctx.lineTo(drawCenter + side/2, displaySize - drawPadding);
                                ctx.lineTo(drawCenter - side/2, displaySize - drawPadding);
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'circle':
                            default:
                                ctx.beginPath();
                                ctx.arc(drawCenter, drawCenter, (displaySize - 2 * drawPadding) / 2, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.stroke();
                                break;
                        }

                        ctx.restore();

                        map.addImage(iconId, {
                            width: canvasSize,
                            height: canvasSize,
                            data: ctx.getImageData(0, 0, canvasSize, canvasSize).data
                        });
                    }
                });

                // Add symbol layer for the points with high z-index to ensure they're on top
                // Add the layer first
                map.addLayer({
                    id: layerId,
                    type: 'symbol',
                    source: sourceId,
                    layout: {
                        'symbol-placement': 'point',
                        'icon-image': [
                            'concat',
                            layer.defaultShape,
                            '-',
                            // Remove the '#' from styleUrl since our icons are named without it
                            ['slice', ['get', 'styleUrl'], 1]
                        ],
                        'icon-size': config.iconConfig.mapIconScale,
                        'icon-allow-overlap': true
                    },
                    filter: ['in', ['get', 'styleUrl'], ['literal', Array.from(activeStatusFilters)]]
                });
                
                // Now move this layer to the top of all other layers
                try {
                    // Get all layers after adding this one
                    const allLayers = map.getStyle().layers;
                    if (allLayers && allLayers.length > 0) {
                        // Get the ID of the topmost layer
                        const topLayerId = allLayers[allLayers.length - 1].id;
                        // Only move if the layer exists and isn't already at the top
                        if (map.getLayer(layerId) && topLayerId !== layerId) {
                            console.log(`Moving layer ${layerId} to top`);
                            map.moveLayer(layerId, topLayerId);
                        }
                    }
                } catch (error) {
                    console.log(`Error moving layer ${layerId} to top:`, error);
                }

                // Add hover effect
                map.on('mouseenter', layerId, (e) => {
                    map.getCanvas().style.cursor = 'pointer';
                    if (e.features.length > 0) {
                        updatePopup(e.features[0]);
                    }
                });

                map.on('mouseleave', layerId, () => {
                    map.getCanvas().style.cursor = '';
                    popup.remove();
                });
            })
            .catch(error => console.error(`Error loading KML for ${layer.id}:`, error));
    });
}

// Helper function to update popup
function updatePopup(feature) {
    const coordinates = feature.geometry.coordinates.slice();
    const name = feature.properties.name;
    const description = feature.properties.description;

    // Format popup content
    const content = `
        <div class="popup-content">
            <h4>${name}</h4>
            ${description ? `<p>${description}</p>` : ''}
        </div>
    `;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(coordinates[0]) > 180) {
        coordinates[0] += coordinates[0] > 0 ? -360 : 360;
    }

    popup.setLngLat(coordinates)
        .setHTML(content)
        .addTo(map);
}
