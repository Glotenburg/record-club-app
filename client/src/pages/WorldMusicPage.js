import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet'; // Import Leaflet library itself

// Import data (adjust paths if necessary)
import genresData from '../data/genres.json';
import countriesGeoJson from '../data/world-countries.json';

// --- Helper Component to Handle Map Clicks for Deselection ---
function MapClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);
  return null; // This component doesn't render anything
}
// --------------------------------------------------------------

function WorldMusicPage() {
  const [selectedCountryCode, setSelectedCountryCode] = useState(null);

  // Function to handle marker click
  const handleMarkerClick = (countryCode, event) => {
    L.DomEvent.stopPropagation(event); // Stop click from propagating to the map
    setSelectedCountryCode(prevCode => (prevCode === countryCode ? null : countryCode)); // Toggle selection
  };

  // Function to handle map click (deselect)
  const handleMapClick = () => {
    setSelectedCountryCode(null);
  };

  // Style function for GeoJSON layer
  const geoJsonStyle = (feature) => {
    // IMPORTANT: Check the property name in your world-countries.json! 
    // It might be 'iso_a2', 'ISO_A2', 'ADMIN', etc.
    const featureCountryCode = feature?.properties?.iso_a2 || feature?.properties?.ISO_A2 || feature?.properties?. sovereignt; // Adjust as needed
    
    const isSelected = featureCountryCode === selectedCountryCode;
    return {
      fillColor: isSelected ? '#fbbf24' : '#475569', // Amber highlight, slate otherwise
      fillOpacity: isSelected ? 0.6 : 0.3,          // More opaque when selected
      color: '#cbd5e1',                                // Light border color (slate-300)
      weight: 1,
    };
  };

  // Custom icon (optional, but good for visibility)
  // You might need to handle icon path issues depending on your setup
  const customMarkerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">World Music Map</h1>
      <div className="bg-slate-800 rounded-lg shadow-xl p-1 md:p-2" style={{ height: '75vh' }}>
        <MapContainer 
          center={[20, 0]} // Start centered roughly
          zoom={2} 
          minZoom={2} // Prevent zooming out too far
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', backgroundColor: '#1e293b' }} // slate-800
          worldCopyJump={true} // Allows map to wrap around
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png" // Carto Voyager - decent neutral style
            // Alt: Stamen Toner Lite (Check terms: http://maps.stamen.com/)
            // url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.png"
            // attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* GeoJSON Layer for Countries */}
          {countriesGeoJson && (
            <GeoJSON 
              data={countriesGeoJson} 
              style={geoJsonStyle} 
              key={selectedCountryCode} // Force re-render on selection change
            />
          )}

          {/* Markers for Genres */}
          {genresData.map((genre, index) => (
            <Marker 
              key={index} 
              position={genre.coordinates} 
              icon={customMarkerIcon} // Use custom icon
              eventHandlers={{
                click: (e) => handleMarkerClick(genre.countryCode, e),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}> {/* Position tooltip above marker */}
                <div className="text-center">
                  <p className="font-semibold mb-1">{genre.locationName}</p>
                  <p className="text-sm">{genre.genreNames.join(', ')}</p>
                </div>
              </Tooltip>
            </Marker>
          ))}
          
          {/* Component to handle map clicks */}
          <MapClickHandler onMapClick={handleMapClick} />

        </MapContainer>
      </div>
      {selectedCountryCode && (
        <p className="text-center mt-4 text-amber-300">Selected Country: {selectedCountryCode}</p>
      )}
    </div>
  );
}

export default WorldMusicPage; 