import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Star, CheckCircle2 } from "lucide-react";

interface ArtisanCardProps {
  id: number;
  name: string;
  profession: string;
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  experience: string;
  hourlyRate: string;
}

const ArtisanCard = ({
  id,
  name,
  profession,
  location,
  rating,
  reviews,
  verified,
  experience,
  hourlyRate,
}: ArtisanCardProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-border hover:shadow-elevated transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-gold flex items-center justify-center text-navy-dark font-bold text-xl">
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link to={`/artisan/${id}`}>
              <h3 className="font-semibold text-navy hover:text-gold transition-colors">
                {name}
              </h3>
            </Link>
            {verified && <CheckCircle2 className="w-4 h-4 text-success" />}
          </div>
          <p className="text-sm text-muted-foreground">{profession}</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{location}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-gold text-gold" />
          <span className="font-semibold text-navy">{rating}</span>
          <span className="text-sm text-muted-foreground">({reviews})</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-muted text-center">
          <div className="text-xs text-muted-foreground">Expérience</div>
          <div className="font-semibold text-navy">{experience}</div>
        </div>
        <div className="p-3 rounded-lg bg-muted text-center">
          <div className="text-xs text-muted-foreground">Tarif/h</div>
          <div className="font-semibold text-navy">{hourlyRate}</div>
        </div>
      </div>

      <Button variant="gold" className="w-full" asChild>
        <Link to={`/artisan/${id}`}>Voir le profil</Link>
      </Button>
    </div>
  );
};

export default ArtisanCard;
