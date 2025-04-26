import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, GeoJSON } from 'react-leaflet';
// Remember to import leaflet.css in your main App.js or index.js!
// import 'leaflet/dist/leaflet.css'; 

// Assuming you have a GeoJSON file like this
// import defaultCountriesData from '../data/world-countries.json';

function WorldMusicPage() {
  const [genresData, setGenresData] = useState([]);
  const [countriesData, setCountriesData] = useState(null); // Or initialize with imported defaultCountriesData
  const [selectedCountryCode, setSelectedCountryCode] = useState(null);

  // Load Genre Data
  useEffect(() => {
    fetch('/data/genres.json') // Assuming genres.json is in the public folder or served statically
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setGenresData(data))
      .catch(error => console.error("Error loading genres data:", error));
  }, []);

  // Load Countries GeoJSON Data
  useEffect(() => {
    fetch('/data/world-countries.geojson') // Assuming world-countries.geojson is in the public folder
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setCountriesData(data))
      .catch(error => console.error("Error loading countries data:", error));
    
    // If importing directly:
    // setCountriesData(defaultCountriesData);
  }, []);

  const handleMarkerClick = (countryCode) => {
    setSelectedCountryCode(prevCode => (prevCode === countryCode ? null : countryCode));
  };

  const countryStyle = (feature) => {
    const isSelected = feature.properties.iso_a2 === selectedCountryCode;
    // Reminder: Verify 'iso_a2' is the correct property name in your GeoJSON features.
    return {
      fillColor: isSelected ? 'yellow' : 'transparent', // Highlight selected country
      fillOpacity: isSelected ? 0.4 : 0, // Semi-transparent fill for selected
      color: '#555',       // Border color for all countries
      weight: 1,          // Border weight
      opacity: 0.6,       // Border opacity
    };
  };

  // Stamen Watercolor Map Tile URL and Attribution
  const tileUrl = 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg';
  const attribution = 
    'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' + 
    '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' + 
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <MapContainer 
      center={[20, 0]} // Initial center (adjust as needed)
      zoom={2}          // Initial zoom level
      minZoom={2}       // Minimum zoom level
      scrollWheelZoom={true} 
      style={{ height: 'calc(100vh - 60px)', width: '100%' }} // Adjust height based on your layout (e.g., subtract header height)
      whenClicked={() => setSelectedCountryCode(null)} // Deselect on map click
    >
      <TileLayer
        url={tileUrl}
        attribution={attribution}
      />

      {countriesData && (
        <GeoJSON 
          key={selectedCountryCode || 'base'} // Force re-render on selection change
          data={countriesData} 
          style={countryStyle} 
        />
      )}

      {genresData.map((genre, index) => (
        <Marker 
          key={index} 
          position={genre.coordinates}
          eventHandlers={{
            click: (e) => {
              // Stop propagation to prevent map click handler from deselecting immediately
              e.originalEvent.stopPropagation(); 
              handleMarkerClick(genre.countryCode);
            },
          }}
        >
          <Tooltip>
            {genre.locationName}<br />
            <strong>Genres:</strong> {genre.genreNames.join(', ')}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default WorldMusicPage; 