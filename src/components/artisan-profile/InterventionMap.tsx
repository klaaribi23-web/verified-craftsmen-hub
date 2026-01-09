import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

// Fix for default marker icon in Leaflet with Vite
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface InterventionMapProps {
  latitude: number;
  longitude: number;
  interventionRadius: number; // in km
  city: string;
}

// Component to fit bounds to the circle
function FitBoundsToCircle({ center, radius }: { center: [number, number]; radius: number }) {
  const map = useMap();
  
  useEffect(() => {
    // Calculate bounds based on radius (approximate)
    const radiusInDegrees = radius / 111; // 1 degree ≈ 111 km
    const bounds = L.latLngBounds(
      [center[0] - radiusInDegrees, center[1] - radiusInDegrees * 1.5],
      [center[0] + radiusInDegrees, center[1] + radiusInDegrees * 1.5]
    );
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, center, radius]);
  
  return null;
}

export function InterventionMap({ latitude, longitude, interventionRadius, city }: InterventionMapProps) {
  const center: [number, number] = [latitude, longitude];
  const radiusInMeters = interventionRadius * 1000;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Zone d'intervention
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-48 w-full relative">
          <MapContainer
            center={center}
            zoom={9}
            scrollWheelZoom={false}
            dragging={true}
            zoomControl={true}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center} />
            <Circle
              center={center}
              radius={radiusInMeters}
              pathOptions={{
                color: "hsl(var(--primary))",
                fillColor: "hsl(var(--primary))",
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
            <FitBoundsToCircle center={center} radius={interventionRadius} />
          </MapContainer>
        </div>
        <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground text-center">
          {city} • Rayon de {interventionRadius} km
        </div>
      </CardContent>
    </Card>
  );
}
