// City selector functionality
export class CitySelector {
    constructor(map, cities) {
        this.map = map;
        this.cities = cities.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
        this.currentCity = null;
    }

    initialize() {
        // Create the city selector container
        const container = document.createElement('div');
        container.className = 'city-selector';

        // Create and style the select element
        const select = document.createElement('select');
        select.className = 'city-select';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a city...';
        defaultOption.selected = true;
        select.appendChild(defaultOption);

        // Add city options
        this.cities.forEach(city => {
            const option = document.createElement('option');
            option.value = JSON.stringify({
                coordinates: city.coordinates,
                zoom: city.zoom
            });
            option.textContent = city.name;
            select.appendChild(option);
        });

        // Handle city selection
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                const { coordinates, zoom } = JSON.parse(e.target.value);
                
                // Find the selected city object
                const selectedOption = select.options[select.selectedIndex];
                const cityName = selectedOption.textContent;
                const selectedCity = this.cities.find(city => city.name === cityName);
                
                // Update current city
                this.currentCity = selectedCity;
                
                // Dispatch custom event with city data
                const citySelectedEvent = new CustomEvent('citySelected', {
                    detail: selectedCity
                });
                document.dispatchEvent(citySelectedEvent);
                
                // Fly to the selected city
                this.map.flyTo({
                    center: coordinates,
                    zoom: zoom,
                    duration: 2000
                });
            } else {
                // No city selected
                this.currentCity = null;
                
                // Dispatch event with null to indicate no city is selected
                const citySelectedEvent = new CustomEvent('citySelected', {
                    detail: null
                });
                document.dispatchEvent(citySelectedEvent);
            }
        });

        container.appendChild(select);
        return container;
    }
}
