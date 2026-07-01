"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

function dotIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:${color};
      box-shadow:0 0 0 5px ${color}33, 0 0 0 1px rgba(18,21,43,0.6);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MapView({ me, wife }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({ me: null, wife: null, line: null });

  // init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([-2.5, 118], 4.5); // default: centered on Indonesia

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // update markers + line whenever locations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;

    if (layers.me) map.removeLayer(layers.me);
    if (layers.wife) map.removeLayer(layers.wife);
    if (layers.line) map.removeLayer(layers.line);

    const points = [];

    if (me) {
      layers.me = L.marker([me.lat, me.lng], { icon: dotIcon("#4ECDC4") })
        .bindTooltip("Me", { permanent: false, direction: "top" })
        .addTo(map);
      points.push([me.lat, me.lng]);
    }

    if (wife) {
      layers.wife = L.marker([wife.lat, wife.lng], { icon: dotIcon("#FF6B6B") })
        .bindTooltip("Wife", { permanent: false, direction: "top" })
        .addTo(map);
      points.push([wife.lat, wife.lng]);
    }

    if (me && wife) {
      layers.line = L.polyline([[me.lat, me.lng], [wife.lat, wife.lng]], {
        color: "#FF8A5B",
        weight: 2,
        dashArray: "6 8",
        opacity: 0.8,
      }).addTo(map);
    }

    if (points.length === 1) {
      map.setView(points[0], 10);
    } else if (points.length === 2) {
      map.fitBounds(points, { padding: [48, 48] });
    }
  }, [me, wife]);

  return <div ref={containerRef} className="map-shell" />;
}
