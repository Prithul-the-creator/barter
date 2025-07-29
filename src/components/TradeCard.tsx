import { Heart, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TradeCardProps {
  image: string;
  title: string;
  condition: string;
  ownerName: string;
  location: string;
  wantedItems: string[];
  timeAgo: string;
  liked?: boolean;
}

export const TradeCard = ({
  image,
  title,
  condition,
  ownerName,
  location,
  wantedItems,
  timeAgo,
  liked = false
}: TradeCardProps) => {
  return (
    <div className="bg-card rounded-xl shadow-soft hover:shadow-medium transition-smooth border border-border overflow-hidden group">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-smooth"
        />
        <div className="absolute top-3 right-3">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </Button>
        </div>
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
          {condition}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Owner and location */}
        <div className="flex items-center text-sm text-muted-foreground mb-3 space-x-4">
          <span>by {ownerName}</span>
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        </div>

        {/* Wanted items */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Wants in return:</p>
          <div className="flex flex-wrap gap-1">
            {wantedItems.slice(0, 3).map((item, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
            {wantedItems.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{wantedItems.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo}
          </div>
          <Button size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground">
            View Trade
          </Button>
        </div>
      </div>
    </div>
  );
};