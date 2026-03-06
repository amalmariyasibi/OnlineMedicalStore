import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { updateDeliveryLocation, getDeliveryLocation } from "../firebase";

// Enhanced Live Tracking Map with GPS tracking and route display
const LiveTrackingMap = ({ deliveryPersonId, orderId, customerLocation, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(false);
  const [distanceToCustomer, setDistanceToCustomer] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Custom delivery boy icon (blue)
    const deliveryIcon = L.divIcon({
      className: 'custom-delivery-marker',
      html: `<div style="background-color: #3B82F6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 16px;">🚚</span>
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const marker = L.marker([20.5937, 78.9629], { icon: deliveryIcon });
    marker.addTo(map).bindPopup('Delivery Person');
    deliveryMarkerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      deliveryMarkerRef.current = null;
      customerMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  // Add customer marker when location is available
  useEffect(() => {
    if (!mapInstanceRef.current || !customerLocation || 
        typeof customerLocation.lat !== 'number' || 
        typeof customerLocation.lng !== 'number') {
      return;
    }

    const latlng = [customerLocation.lat, customerLocation.lng];

    if (!customerMarkerRef.current) {
      // Custom customer icon (red)
      const customerIcon = L.divIcon({
        className: 'custom-customer-marker',
        html: `<div style="background-color: #EF4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 16px;">📍</span>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const cm = L.marker(latlng, { icon: customerIcon });
      cm.addTo(mapInstanceRef.current).bindPopup('Customer Location');
      customerMarkerRef.current = cm;
    } else {
      customerMarkerRef.current.setLatLng(latlng);
    }

    // Fit both markers in view
    if (deliveryMarkerRef.current) {
      const group = L.featureGroup([deliveryMarkerRef.current, customerMarkerRef.current]);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
    }
  }, [customerLocation]);

  // Calculate distance using Haversine formula
  const computeDistanceKm = (a, b) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const aa =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  };

  // Draw route line between delivery person and customer
  const drawRouteLine = (deliveryLoc, customerLoc) => {
    if (!mapInstanceRef.current) return;

    // Remove existing route line
    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
    }

    // Draw new route line
    const latlngs = [
      [deliveryLoc.lat, deliveryLoc.lng],
      [customerLoc.lat, customerLoc.lng]
    ];

    const polyline = L.polyline(latlngs, {
      color: '#3B82F6',
      weight: 3,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(mapInstanceRef.current);

    routeLineRef.current = polyline;
  };

  // GPS tracking
  useEffect(() => {
    let watchId = null;

    const startGeolocation = () => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by this browser.");
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setError("");
          setTracking(true);

          const newLocation = { lat: latitude, lng: longitude };
          setCurrentLocation(newLocation);

          if (mapInstanceRef.current && deliveryMarkerRef.current) {
            const latlng = [latitude, longitude];
            deliveryMarkerRef.current.setLatLng(latlng);

            if (customerLocation && 
                typeof customerLocation.lat === 'number' && 
                typeof customerLocation.lng === 'number' && 
                customerMarkerRef.current) {
              
              // Draw route line
              drawRouteLine(newLocation, customerLocation);

              // Fit both markers
              const group = L.featureGroup([deliveryMarkerRef.current, customerMarkerRef.current]);
              mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));

              // Calculate distance
              const dKm = computeDistanceKm(newLocation, customerLocation);
              setDistanceToCustomer(dKm);

              // Estimate time (assuming average speed of 30 km/h)
              const estimatedMinutes = Math.round((dKm / 30) * 60);
              setEstimatedTime(estimatedMinutes);
            } else {
              mapInstanceRef.current.setView(latlng, 15);
            }
          }

          // Update location in Firebase
          try {
            if (deliveryPersonId) {
              await updateDeliveryLocation(deliveryPersonId, {
                lat: latitude,
                lng: longitude,
                accuracy,
                activeOrderId: orderId || null,
                timestamp: new Date().toISOString()
              });
            }
          } catch (e) {
            console.error("Failed to update delivery location:", e);
          }
        },
        (err) => {
          console.error("Geolocation error", err);
          setError(err.message || "Unable to get current location.");
          setTracking(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    };

    startGeolocation();

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      setTracking(false);
    };
  }, [deliveryPersonId, orderId, customerLocation]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2">
              <span className="text-2xl">🚚</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Live Delivery Tracking
              </h2>
              <p className="text-xs text-blue-100">
                {tracking ? "GPS Active" : "Connecting to GPS..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info Panel */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Distance Card */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">📏</span>
                <span className="text-xs font-medium text-gray-500">Distance</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {distanceToCustomer != null
                  ? `${distanceToCustomer.toFixed(1)} km`
                  : customerLocation
                    ? 'Calculating...'
                    : 'N/A'}
              </p>
            </div>

            {/* Estimated Time Card */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">⏱️</span>
                <span className="text-xs font-medium text-gray-500">Est. Time</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {estimatedTime != null
                  ? `${estimatedTime} min`
                  : customerLocation
                    ? 'Calculating...'
                    : 'N/A'}
              </p>
            </div>

            {/* GPS Status Card */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">📡</span>
                <span className="text-xs font-medium text-gray-500">GPS Status</span>
              </div>
              <p className={`text-sm font-semibold ${tracking ? 'text-green-600' : 'text-yellow-600'}`}>
                {tracking ? '● Active' : '○ Connecting...'}
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {!customerLocation && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ Customer location not available. The customer did not share their location during checkout.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-800">
                ❌ {error}
              </p>
            </div>
          )}

          {!error && !tracking && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                🔄 Waiting for GPS signal... Please ensure location permission is enabled.
              </p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="h-96 relative" ref={mapRef}>
          {!tracking && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Acquiring GPS signal...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-start space-x-2 text-xs text-gray-600">
            <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-gray-700 mb-1">GPS Tracking Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your live location is being tracked and updated every few seconds</li>
                <li>The blue marker (🚚) shows your current position</li>
                <li>The red marker (📍) shows the customer's delivery location</li>
                <li>The dashed line shows the direct distance between you and the customer</li>
                <li>Make sure location permission is enabled in your browser for accurate tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
