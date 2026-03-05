import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onDeliveryLocationChange } from "../firebase";

// Read-only tracking map for customers
// Props:
// - deliveryPersonId: string (required)
// - orderId: string (for display only)
const OrderTrackingMap = ({ deliveryPersonId, orderId }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [locationStatus, setLocationStatus] = useState("waiting"); // waiting | active | unavailable | error
  const [error, setError] = useState("");

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
    };
  }, []);

  useEffect(() => {
    if (!deliveryPersonId) {
      setLocationStatus("unavailable");
      return;
    }

    const unsubscribe = onDeliveryLocationChange(deliveryPersonId, (result) => {
      if (!result.success) {
        console.error("onDeliveryLocationChange error:", result.error);
        setError("Unable to load live location right now.");
        setLocationStatus("error");
        return;
      }

      const loc = result.location;
      if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
        setLocationStatus("unavailable");
        return;
      }

      setError("");
      setLocationStatus("active");

      if (mapInstanceRef.current && markerRef.current) {
        const latlng = [loc.lat, loc.lng];
        markerRef.current.setLatLng(latlng);
        mapInstanceRef.current.setView(latlng, 15);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [deliveryPersonId]);

  return (
    <div className="space-y-2">
      {locationStatus === "waiting" && (
        <p className="text-xs text-gray-500">
          Waiting for the delivery partner to start sharing location...
        </p>
      )}
      {locationStatus === "unavailable" && (
        <p className="text-xs text-gray-500">
          Live location is not yet available for this order. Please check again once the order is out for delivery.
        </p>
      )}
      {locationStatus === "error" && (
        <p className="text-xs text-red-600">
          {error || "Unable to display live location at the moment."}
        </p>
      )}
      <div className="h-64 rounded-md overflow-hidden border" ref={mapRef} />
      <p className="text-[11px] text-gray-400 mt-1">
        Live location is approximate and for tracking convenience only.
      </p>
    </div>
  );
};

export default OrderTrackingMap;
