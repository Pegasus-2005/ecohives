import { useState, useEffect } from "react";
import { MapPin, Search, Crosshair } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const pendingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const collectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

export default function Map() {
  const [locations, setLocations] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports");
        const data = await res.json();
        if (res.ok) {
          setLocations(data.reports);
        }
      } catch (err) {
        console.error("Failed to fetch reports", err);
      }
    };
    fetchReports();
  }, []);

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.error("Error getting location:", err);
          alert("Could not get your location. Please enable location services.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const filteredLocations = locations.filter(loc => 
    (loc.waste_type?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (loc.address?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search locations or waste types..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={requestLocation}
            className="flex items-center text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Crosshair className="h-4 w-4 mr-1.5" />
            My Location
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <span className="flex items-center text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span> Pending</span>
          <span className="flex items-center text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Collected</span>
        </div>
      </div>
      
      <div className="flex-1 bg-gradient-to-b from-green-50/30 to-gray-100 border border-gray-200 rounded-b-xl relative overflow-hidden flex">
        {/* Sidebar List */}
        <div className="w-80 bg-white/90 backdrop-blur border-r border-gray-200 z-[1000] overflow-y-auto flex flex-col">
          <div className="p-4 flex-1">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Recent Reports</h3>
            <div className="space-y-3">
              {filteredLocations.length > 0 ? filteredLocations.map(loc => (
                <div key={loc.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-green-300 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">{loc.waste_type || "Waste"}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      loc.status === 'Collected' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {loc.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{loc.address || `${loc.lat?.toFixed(4)}, ${loc.lng?.toFixed(4)}`}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(loc.created_at).toLocaleString()}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500 text-center py-4">No reports found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative z-0">
          <MapContainer 
            center={userLocation || [20.5937, 78.9629]} // Default to India or user location
            zoom={userLocation ? 13 : 5} 
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <LocationMarker position={userLocation} />
            
            {filteredLocations.map((loc) => {
              if (!loc.lat || !loc.lng) return null;
              return (
                <Marker 
                  key={loc.id} 
                  position={[loc.lat, loc.lng]}
                  icon={loc.status === 'Collected' ? collectedIcon : pendingIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold mb-1">{loc.waste_type || "Waste"}</p>
                      <p className="text-gray-600 mb-1">{loc.address}</p>
                      <p className="text-xs text-gray-400">Status: {loc.status}</p>
                      <p className="text-xs text-gray-400">Reported: {new Date(loc.created_at).toLocaleDateString()}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
