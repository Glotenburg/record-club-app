import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, GeoJSON } from 'react-leaflet';
import L from 'leaflet'; // <-- Import L 
import ReactMarkdown from 'react-markdown'; // <-- Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // <-- Import remarkGfm for extended features
// Remember to import leaflet.css in your main App.js or index.js!
// import 'leaflet/dist/leaflet.css'; 

// Assuming you have a GeoJSON file like this
// import defaultCountriesData from '../data/world-countries.json';

// --- Custom Icon Definition ---
const redDotIcon = new L.divIcon({
  html: '<span class="red-map-dot" />',
  className: '', // Important to override default background/border
  iconSize: [12, 12], // Size of the icon
  iconAnchor: [6, 6], // Point of the icon which will correspond to marker's location
});
// --- End Custom Icon Definition ---

function WorldMusicPage() {
  const [genresData, setGenresData] = useState([]);
  const [countriesData, setCountriesData] = useState(null); // Or initialize with imported defaultCountriesData
  const [selectedCountryCode, setSelectedCountryCode] = useState(null);
  const [markdownContent, setMarkdownContent] = useState(''); // <-- State for markdown

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

  // Load Markdown Content
  useEffect(() => {
    fetch('/data/world-music-info.md')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text(); // Fetch as plain text
      })
      .then(text => setMarkdownContent(text))
      .catch(error => console.error("Error loading markdown content:", error));
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

  // CartoDB Positron Map Tile URL and Attribution (Replaced Stamen)
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  const attribution = 
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className="world-music-page-container">
      <MapContainer 
        center={[20, 0]} // Initial center (adjust as needed)
        zoom={2}          // Initial zoom level
        minZoom={2}       // Minimum zoom level
        scrollWheelZoom={true} 
        style={{ height: '65vh', width: '100%' }} // Adjusted height for map
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
            icon={redDotIcon}
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

      {/* --- Informational Content Area --- */}
      <div className="world-music-info p-4 md:p-6 lg:p-8 bg-slate-800 rounded-b-lg shadow-inner prose prose-invert max-w-none prose-img:mx-auto">
        {/* Render fetched markdown content */}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
      </div>
      {/* --- End Informational Content Area --- */}
    </div>
  );
}

export default WorldMusicPage; 