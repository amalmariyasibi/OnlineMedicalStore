import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getOrderById, onDeliveryLocationChange } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

// Customer-facing delivery tracking page
function TrackDelivery() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [distanceToCustomer, setDistanceToCustomer] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const result = await getOrderById(orderId);
        
        if (result.success && result.order) {
          // Verify order belongs to current user
          if (currentUser && result.order.userId !== currentUser.uid) {
            setError("You don't have permission to view this order");
            return;
          }
          
          setOrder(result.order);
        } else {
          setError(result.error || "Order not found");
        }
      } catch (err) {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, currentUser]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !order) return;

    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Add customer marker if location is available
    if (order.customerLocation && 
        typeof order.customerLocation.lat === 'number' && 
        typeof order.customerLocation.lng === 'number') {
      
      const customerIcon = L.divIcon({
        className: 'custom-customer-marker',
        html: `<div style="background-color: #10B981; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 18px;">🏠</span>
        </div>`,
        iconSize: [35, 35],
        iconAnchor: [17.5, 17.5],
      });

      const latlng = [order.customerLocation.lat, order.customerLocation.lng];
      const cm = L.marker(latlng, { icon: customerIcon });
      cm.addTo(map).bindPopup('Your Delivery Location');
      customerMarkerRef.current = cm;
      
      map.setView(latlng, 13);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      deliveryMarkerRef.current = null;
      customerMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, [order]);

  // Calculate distance using Haversine formula
  const computeDistanceKm = (a, b) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
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

  // Draw route line
  const drawRouteLine = (deliveryLoc, customerLoc) => {
    if (!mapInstanceRef.current) return;

    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
    }

    const latlngs = [
      [deliveryLoc.lat, deliveryLoc.lng],
      [customerLoc.lat, customerLoc.lng]
    ];

    const polyline = L.polyline(latlngs, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(mapInstanceRef.current);

    routeLineRef.current = polyline;
  };

  // Subscribe to delivery person's location updates
  useEffect(() => {
    if (!order || !order.deliveryPersonId) return;

    const unsubscribe = onDeliveryLocationChange(order.deliveryPersonId, (result) => {
      if (result.success && result.location) {
        setDeliveryLocation(result.location);
        setLastUpdate(new Date());

        // Update delivery marker on map
        if (mapInstanceRef.current && result.location.lat && result.location.lng) {
          const latlng = [result.location.lat, result.location.lng];

          if (!deliveryMarkerRef.current) {
            const deliveryIcon = L.divIcon({
              className: 'custom-delivery-marker',
              html: `<div style="background-color: #3B82F6; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
                <span style="color: white; font-size: 18px;">🚚</span>
 