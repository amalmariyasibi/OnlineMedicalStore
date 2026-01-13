import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { updateDeliveryLocation } from "../firebase";

// Simple Leaflet-based map panel for delivery users
// Props:
// - deliveryPersonId: string (required)
// - orderId: string (active order being delivered)
// - customerLocation: { lat, lng } (optional)
// - onClose: function
const DeliveryMapPanel = ({ deliveryPersonId, orderId, customerLocation, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(false);
  const [distanceToCustomer, setDistanceToCustomer] = useState(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5); // India center
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([20.5937, 78.9629]);
    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      customerMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Draw or update customer marker when customerLocation becomes available
    if (!mapInstanceRef.current || !customerLocation || typeof customerLocation.lat !== 'number' || typeof customerLocation.lng !== 'number') {
      return;
    }

    const latlng = [customerLocation.lat, customerLocation.lng];

    if (!customerMarkerRef.current) {
      const cm = L.marker(latlng, { icon: L.icon({
        iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41],
      }) });
      cm.addTo(mapInstanceRef.current).bindPopup('Customer Location');
      customerMarkerRef.current = cm;
    } else {
      customerMarkerRef.current.setLatLng(latlng);
    }

    // If we already have delivery marker, fit both in view
    if (markerRef.current) {
      const group = L.featureGroup([markerRef.current, customerMarkerRef.current]);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
    }
  }, [customerLocation]);

  const computeDistanceKm = (a, b) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
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

  useEffect(() => {
    let watchId = null;

    const startGeolocation = () => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by this browser.");
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setError("");
          setTracking(true);

          if (mapInstanceRef.current && markerRef.current) {
            const latlng = [latitude, longitude];
            markerRef.current.setLatLng(latlng);

            if (customerLocation && typeof customerLocation.lat === 'number' && typeof customerLocation.lng === 'number' && customerMarkerRef.current) {
              // Fit both markers
              const group = L.featureGroup([markerRef.current, customerMarkerRef.current]);
              mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));

              const dKm = computeDistanceKm(
                { lat: latitude, lng: longitude },
                { lat: customerLocation.lat, lng: customerLocation.lng }
              );
              setDistanceToCustomer(dKm);
            } else {
              mapInstanceRef.current.setView(latlng, 15);
            }
          }

          try {
            if (deliveryPersonId) {
              await updateDeliveryLocation(deliveryPersonId, {
                lat: latitude,
                lng: longitude,
                activeOrderId: orderId || null,
              });
            }
          } catch (e) {
            console.error("Failed to update delivery location:", e);
          }
        },
        (err) => {
          console.error("Geolocation error", err);
          setError(err.message || "Unable to get current location.");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 20000,
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
  }, [deliveryPersonId, orderId]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Live Delivery Tracking
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        <div className="p-4 space-y-2 text-xs text-gray-600">
          <p>
            Your live location is shared with the system while this window is open. Make sure
            location permission is allowed in your browser.
          </p>

          {/* Distance summary row */}
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-gray-700">Distance to customer:</span>
            <span className="ml-2">
              {distanceToCustomer != null
                ? `${distanceToCustomer.toFixed(1)} km`
                : customerLocation
                  ? 'Calculating from GPS...'
                  : 'Not available (customer location not shared)'}
            </span>
          </div>

          {customerLocation && (
            <p className="text-xs text-gray-600 mt-1">
              Customer location has been shared from checkout.
            </p>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
              {error}
            </div>
          )}
          {!error && !tracking && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-xs">
              Waiting for GPS fix... please stay outdoors or near a window.
            </div>
          )}
          {distanceToCustomer != null && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-xs mt-1">
              Approximate distance to customer: {distanceToCustomer.toFixed(1)} km
            </div>
          )}
        </div>
        <div className="h-80" ref={mapRef} />
      </div>
    </div>
  );
};

export default DeliveryMapPanel;
