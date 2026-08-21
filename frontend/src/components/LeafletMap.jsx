import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix Leaflet's default marker icons in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored SVG icons
const createCustomIcon = (color, text = '') => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
        ">${text}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

const createMemberIcon = (name) => {
  const initial = name ? name[0].toUpperCase() : 'M';
  return L.divIcon({
    className: 'custom-member-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ec4899;
          border: 3px solid #ffffff;
          box-shadow: 0 0 12px rgba(236, 72, 153, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 13px;
        ">${initial}</div>
        <div style="
          background: rgba(17, 24, 39, 0.85);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 2px;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.2);
        ">${name}</div>
      </div>
    `,
    iconSize: [32, 50],
    iconAnchor: [16, 25],
    popupAnchor: [0, -25]
  });
};

export const LeafletMap = ({
  center = [11.4102, 76.6950],
  zoom = 12,
  routeWaypoints = [],
  itineraryStops = [],
  memberLocations = [],
  height = '500px'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      // Dark / modern carto tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    layers.clearLayers();

    const bounds = [];

    // 1. Draw Route line if waypoints exist
    if (routeWaypoints && routeWaypoints.length >= 2) {
      const latlngs = routeWaypoints.map(w => [w.lat, w.lng]);
      const polyline = L.polyline(latlngs, {
        color: '#3b82f6',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.85
      }).addTo(layers);

      routeWaypoints.forEach((wp, idx) => {
        const isOrigin = idx === 0;
        const isDest = idx === routeWaypoints.length - 1;
        const color = isOrigin ? '#10b981' : (isDest ? '#ef4444' : '#3b82f6');
        const marker = L.marker([wp.lat, wp.lng], {
          icon: createCustomIcon(color, isOrigin ? 'A' : (isDest ? 'B' : `${idx}`))
        }).addTo(layers);

        marker.bindPopup(`
          <div style="font-family: inherit; padding: 4px;">
            <strong style="color: #1e293b; font-size: 13px;">${wp.name}</strong>
            <div style="color: #64748b; font-size: 11px;">${isOrigin ? 'Trip Origin' : (isDest ? 'Final Destination' : 'Transit Point')}</div>
          </div>
        `);
        bounds.push([wp.lat, wp.lng]);
      });
    }

    // 2. Draw Itinerary Stops
    if (itineraryStops && itineraryStops.length > 0) {
      const dayColors = { 1: '#3b82f6', 2: '#10b981', 3: '#f59e0b', 4: '#8b5cf6' };
      const stopLatLngs = [];

      itineraryStops.forEach((stop, index) => {
        if (stop.place && stop.place.latitude && stop.place.longitude) {
          const lat = stop.place.latitude;
          const lng = stop.place.longitude;
          stopLatLngs.push([lat, lng]);
          bounds.push([lat, lng]);

          const dayColor = dayColors[stop.day_number] || '#6366f1';
          const marker = L.marker([lat, lng], {
            icon: createCustomIcon(dayColor, `${stop.sort_order || index + 1}`)
          }).addTo(layers);

          marker.bindPopup(`
            <div style="font-family: inherit; min-width: 160px;">
              <strong style="color: #0f172a; font-size: 13px;">${stop.custom_title || stop.place.name}</strong>
              <div style="color: #2563eb; font-weight: 700; font-size: 11px; margin-top: 2px;">
                Day ${stop.day_number} • ${stop.time_slot}
              </div>
              <div style="color: #64748b; font-size: 11px; margin-top: 4px;">
                ${stop.place.category} • ${stop.duration_hours || 2}h stop
              </div>
            </div>
          `);
        }
      });

      // Connect day stops with colored path
      if (stopLatLngs.length > 1) {
        L.polyline(stopLatLngs, {
          color: '#6366f1',
          weight: 3,
          opacity: 0.7
        }).addTo(layers);
      }
    }

    // 3. Draw Live Member Locations
    if (memberLocations && memberLocations.length > 0) {
      memberLocations.forEach(member => {
        if (member.is_sharing_location && member.last_latitude && member.last_longitude) {
          const lat = member.last_latitude;
          const lng = member.last_longitude;
          bounds.push([lat, lng]);

          const marker = L.marker([lat, lng], {
            icon: createMemberIcon(member.name)
          }).addTo(layers);

          marker.bindPopup(`
            <div style="font-family: inherit;">
              <strong style="color: #0f172a; font-size: 13px;">${member.name}</strong>
              <div style="color: #10b981; font-weight: 700; font-size: 11px; margin-top: 2px;">
                ● Live Location Active
              </div>
              <div style="color: #64748b; font-size: 10px; margin-top: 2px;">
                Role: ${member.role}
              </div>
            </div>
          `);
        }
      });
    }

    // Adjust view bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView(center, zoom);
    }

    // Leaflet map resizing fix
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [center, zoom, routeWaypoints, itineraryStops, memberLocations]);

  return (
    <div style={{ position: 'relative', width: '100%', height: height, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default LeafletMap;
