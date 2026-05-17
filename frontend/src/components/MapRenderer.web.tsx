import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Station, FuelType } from '../types';

interface MapRendererProps {
  center: { lat: number; lng: number };
  stations: Station[];
  selectedFuelType: FuelType;
  cheapestPrice: number | null;
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  mapRef: React.MutableRefObject<any>;
}

export default function MapRenderer({ center, stations, selectedFuelType, cheapestPrice, selectedStation, onSelectStation, mapRef }: MapRendererProps) {
  const markersRef = useRef<any[]>([]);
  const initDone = useRef(false);

  // Load Leaflet and init map
  useEffect(() => {
    let map: any = null;

    const loadLeaflet = () =>
      new Promise<void>((resolve) => {
        if ((window as any).L) { resolve(); return; }
        if (!document.getElementById('leaflet-css')) {
          const css = document.createElement('link');
          css.id = 'leaflet-css';
          css.rel = 'stylesheet';
          css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(css);
        }
        const js = document.createElement('script');
        js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        js.onload = () => resolve();
        document.head.appendChild(js);
      });

    const init = async () => {
      try {
        await loadLeaflet();
        const L = (window as any).L;
        if (!L) return;
        const container = document.getElementById('leaflet-map');
        if (!container) return;
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';

        map = L.map(container, { zoomControl: false, attributionControl: false })
          .setView([center.lat, center.lng], 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          subdomains: 'abcd', maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapRef.current = map;
        initDone.current = true;
      } catch (e) { console.error('Map init error:', e); }
    };

    const timer = setTimeout(init, 200);
    return () => { clearTimeout(timer); if (map) map.remove(); };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !initDone.current) return;
    const L = (window as any).L;
    if (!L) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const price = station[selectedFuelType];
      if (price == null || !station.is_open) return;

      const isCheapest = cheapestPrice !== null && Math.abs(price - cheapestPrice) < 0.001;
      const isSelected = selectedStation?.id === station.id;

      let bg: string, textColor: string, border: string, shadow: string;
      if (isSelected) {
        bg = '#FFFFFF'; textColor = '#0A0A0B'; border = '2px solid #22C55E'; shadow = '0 4px 20px rgba(34,197,94,0.5)';
      } else if (isCheapest) {
        bg = '#22C55E'; textColor = '#0A0A0B'; border = 'none'; shadow = '0 2px 12px rgba(34,197,94,0.5)';
      } else {
        bg = '#1C1C1E'; textColor = '#FFFFFF'; border = '1px solid #2A2F38'; shadow = '0 2px 8px rgba(0,0,0,0.4)';
      }

      const priceText = price.toFixed(2).replace('.', ',') + ' \u20AC';
      const arrowBg = isSelected ? '#FFFFFF' : isCheapest ? '#22C55E' : '#1C1C1E';
      const zIdx = isSelected ? 1000 : isCheapest ? 500 : 1;

      const icon = L.divIcon({
        className: '',
        iconAnchor: [0, 35],
        html: `<div style="cursor:pointer;z-index:${zIdx};position:relative;filter:${isSelected ? 'drop-shadow(0 0 12px rgba(34,197,94,0.6))' : 'none'}">
          <div style="background:${bg};color:${textColor};font-size:13px;font-weight:700;padding:5px 12px;border-radius:20px;white-space:nowrap;box-shadow:${shadow};border:${border};font-family:-apple-system,BlinkMacSystemFont,'SF Pro',sans-serif;text-align:center">${priceText}</div>
          <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid ${arrowBg};margin:-1px auto 0 auto"></div>
        </div>`,
      });

      const marker = L.marker([station.lat, station.lng], { icon, zIndexOffset: zIdx })
        .addTo(mapRef.current)
        .on('click', () => onSelectStation(station));

      markersRef.current.push(marker);
    });
  }, [stations, selectedFuelType, cheapestPrice, selectedStation, onSelectStation]);

  // Fly to new center
  useEffect(() => {
    if (!mapRef.current || !initDone.current) return;
    mapRef.current.flyTo([center.lat, center.lng], 12);
  }, [center]);

  return <View style={StyleSheet.absoluteFillObject} nativeID="leaflet-map" testID="map-container" />;
}
