// Map configuration
export const config = {
    // API Keys
    greatSchoolsApiKey: 'XDuR6B48nm1fZhcSyu5B14MxgQ5sNoj95FATbJLZ', // Replace with your actual GreatSchools API key
    // Debug settings
    debug: {
        showTileFilenames: false, // When true, shows the GeoJSON filename when hovering over tiles
    },
    style: 'mapbox://styles/mapbox/streets-v12',
    mapboxAccessToken: 'pk.eyJ1IjoiYW5kcmV3d3ZpbmNlbnQiLCJhIjoiY2xnNjlqcWd2MHdtcDNmcDRzdnlhcWxzMSJ9.gHRNE_xbQ0TqpXCj2zY4Fw',
    accessToken: 'pk.eyJ1IjoiYW5kcmV3LXZpbmNlbnQiLCJhIjoiY202OW4wNm5yMGlubzJtcTJmMnBxb2x1cSJ9.jrR3Ucv9Nvtc-T_7aKIQCg',
    CSV: '../data/locations.csv',
    title: 'Heatmaps - Number of Children from Households above Different Income Levels',
    description: 'Heatmaps of density of children ages 5-14 from households above different income levels in the United States.',
    sideBarInfo: ["Location_Name"],
    popupInfo: ["Location_Name"],
    token: 'pk.eyJ1IjoiYW5kcmV3d3ZpbmNlbnQiLCJhIjoiY2xkdzZ1ejB4MHRxbDN2bzZ0ZGNvMnY5YiJ9.zqIgFE8xhfvgRqR1GQgK_Q',
    container: 'map',
    defaultShapeSizes: {
        circle: 8,
        square: 8,
        star: 10,
        triangle: 10,
        diamond: 9,
        hexagon: 9,
        pentagon: 9,
        cross: 10
    },
    defaultStrokeWidths: {
        circle: 2,      // Base stroke width for simple shapes
        square: 2,      // Match circle stroke width
        star: 2.5,      // Slightly thicker for complex shapes
        triangle: 2.5,  // Match star stroke width
        diamond: 2,     // Match simple shape stroke width
        hexagon: 2,     // Match simple shape stroke width
        pentagon: 2,    // Match simple shape stroke width
        cross: 2.5      // Match complex shape stroke width
    },
    iconConfig: {
        canvasSize: 32,       // Size of the canvas for map icons
        displaySize: 18,      // Base size for calculations
        mapIconScale: 1,   // Scale factor for icons on the map
        padding: 4,           // Padding around shapes
        strokeScale: 0.5     // Scale factor for stroke widths (smaller = thinner strokes)
    },
    // Define status colors
    statusColors: {
        '#Grade-A': '#32a955',
        '#Grade-B': '#fed869',
        '#Grade-C': '#ff9801',
        '#Grade-D': '#ea4235'
    },

    // List of major cities/metro areas for quick navigation
    cities: [
        {name: 'AZ - Phoenix', coordinates: [-112.0969, 33.4686], zoom: 10},
        {name: 'CA - Los Angeles', coordinates: [-118.3267, 34.0439], zoom: 9},
        {name: 'CA - Sacramento', coordinates: [-121.4847, 38.5848], zoom: 10},
        {name: 'DC - Washington DC', coordinates: [-77.0458, 38.9143], zoom: 9},
        {name: 'FL - North Palm Beach', coordinates: [-80.0652, 26.8264], zoom: 11},
        {name: 'GA - Atlanta', coordinates: [-84.3903, 33.7574], zoom: 9.5},
        {name: 'IL - Chicago', coordinates: [-87.7106, 41.872], zoom: 9},
        {name: 'MO - St. Louis', coordinates: [-90.5537, 38.6711], zoom: 10},
        {name: 'NC - Charlotte', coordinates: [-80.8448, 35.2361], zoom: 10},
        {name: 'NC - Raleigh', coordinates: [-78.6356, 35.7919], zoom: 10},
        {name: 'OH - Cincinnati', coordinates: [-84.3614, 39.272], zoom: 10},
        {name: 'OH - Columbus', coordinates: [-83.0087, 40.108], zoom: 10},
        {name: 'OK - Oklahoma City', coordinates: [-97.548018, 35.61565], zoom: 10},
        {name: 'OR - Portland', coordinates: [-122.6802, 45.5095], zoom: 10},
        {name: 'PA - Philadelphia', coordinates: [-75.1664, 39.947], zoom: 9.5},
        {name: 'TX - Austin', coordinates: [-97.746, 30.293], zoom: 10},
        {name: 'TX - Dallas', coordinates: [-96.8173, 33.0086], zoom: 10},
        {name: 'TX - Fort Worth', coordinates: [-97.3225, 32.7657], zoom: 10},
        {name: 'TX - Houston', coordinates: [-95.3809, 29.7722], zoom: 9.5},
        {name: 'WI - Madison', coordinates: [-89.4057, 43.0752], zoom: 9.5},

        

    ],

    locationLayers: [
        {
            id: 'Higher Ground Best',
            name: 'Alternative 1',
            file: 'data/higher-ground-best.kml',
            defaultShape: 'circle',  // This location uses hexagons
            defaultChecked: false,
            defaultLabels: false,
            styles: {
                '#Grade-A': '#32a955',
                '#Grade-B': '#fed869',
                '#Grade-C': '#ff9801',
                '#Grade-D': '#ea4235'
            }
        },
        {
            id: 'Higher Ground Alternative',
            name: 'Other Alternatives',
            file: 'data/higher-ground-alternative.kml',
            defaultShape: 'square',  // This location uses hexagons
            defaultChecked: false,
            defaultLabels: false,
            styles: {
                '#Grade-A': '#32a955',
        '#Grade-B': '#fed869',
        '#Grade-C': '#ff9801',
        '#Grade-D': '#ea4235'
            }
        }
    ]
};
