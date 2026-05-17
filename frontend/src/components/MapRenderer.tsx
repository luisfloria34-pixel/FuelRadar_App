import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { COLORS, RADIUS } from '../constants/theme';
import { Station, FuelType } from '../types';

interface MapRendererProps {
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  stations: Station[];
  selectedFuelType: FuelType;
  cheapestPrice: number | null;
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  mapRef: React.MutableRefObject<any>;
}

function PriceMarker({ price, isCheapest, isSelected }: { price: string; isCheapest: boolean; isSelected: boolean }) {
  const bg = isSelected ? '#FFFFFF' : isCheapest ? '#22C55E' : '#1C1C1E';
  const color = isSelected ? '#0A0A0B' : isCheapest ? '#0A0A0B' : '#FFFFFF';
  const borderColor = isSelected ? '#22C55E' : 'transparent';
  return (
    <View style={ms.wrapper}>
      <View style={[ms.pill, { backgroundColor: bg, borderColor }]}>
        <Text style={[ms.text, { color }]}>{price}</Text>
      </View>
      <View style={[ms.arrow, { borderTopColor: bg }]} />
    </View>
  );
}

function UserMarker() {
  return (
    <View style={ms.userOuter}>
      <View style={ms.userInner} />
    </View>
  );
}

const ms = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  text: { fontSize: 13, fontWeight: '700' },
  arrow: { width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
  userOuter: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#22C55E',
  },
  userInner: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22C55E',
  },
});

function MapRendererComponent({
  center, userLocation, stations, selectedFuelType, cheapestPrice, selectedStation, onSelectStation, mapRef,
}: MapRendererProps) {
  const filteredStations = stations.filter(s => s.is_open && s[selectedFuelType] != null);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
      mapType="none"
      rotateEnabled={false}
      showsUserLocation={false}
      showsMyLocationButton={false}
    >
      <UrlTile urlTemplate="https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png" maximumZ={19} />

      {/* Custom user location marker */}
      {userLocation && (
        <Marker
          coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={999}
        >
          <UserMarker />
        </Marker>
      )}

      {filteredStations.map((station) => {
        const price = station[selectedFuelType] as number;
        const isCheapest = cheapestPrice !== null && Math.abs(price - cheapestPrice) < 0.001;
        const isSelected = selectedStation?.id === station.id;
        const priceText = price.toFixed(2).replace('.', ',') + ' €';
        return (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.lat, longitude: station.lng }}
            onPress={() => onSelectStation(station)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <PriceMarker price={priceText} isCheapest={isCheapest} isSelected={isSelected} />
          </Marker>
        );
      })}
    </MapView>
  );
}

export default React.memo(MapRendererComponent);
