import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface InterventionMapProps {
  latitude: number;
  longitude: number;
  interventionRadius: number; // in km
  city: string;
}

export function InterventionMap({ latitude, longitude, interventionRadius, city }: InterventionMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize the map
    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 9,
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
    });

    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add marker at center
    const defaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    L.marker([latitude, longitude], { icon: defaultIcon }).addTo(map);

    // Add circle for intervention radius
    const radiusInMeters = interventionRadius * 1000;
    const circle = L.circle([latitude, longitude], {
      radius: radiusInMeters,
      color: "#D97706", // primary color
      fillColor: "#D97706",
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map);

    // Fit bounds to the circle
    map.fitBounds(circle.getBounds(), { padding: [20, 20] });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, interventionRadius]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Zone d'intervention
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapContainerRef} 
          className="h-48 w-full"
          style={{ zIndex: 0 }}
        />
        <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground text-center">
          {city} • Rayon de {interventionRadius} km
        </div>
      </CardContent>
    </Card>
  );
}
