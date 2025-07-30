import { Heart, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { favoritesApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface TradeCardProps {
  id: string;
  image: string;
  title: string;
  condition: string;
  ownerName: string;
  location: string;
  wantedItems: string[];
  timeAgo: string;
  liked?: boolean;
  onUnfavorite?: (itemId: string) => void;
}

export const TradeCard = ({
  id,
  image,
  title,
  condition,
  ownerName,
  location,
  wantedItems,
  timeAgo,
  liked = false,
  onUnfavorite
}: TradeCardProps) => {
  const [isLiked, setIsLiked] = useState(liked);
  const { toast } = useToast();

  // Check if item is favorited on component mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const favorited = await favoritesApi.isFavorited(id);
      setIsLiked(favorited);
    };
    checkFavoriteStatus();
  }, [id]);

  // Listen for real-time changes to favorites
  useEffect(() => {
    const channel = supabase
      .channel(`favorites-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `item_id=eq.${id}`
        },
        async () => {
          // Re-check favorite status when favorites change
          const favorited = await favoritesApi.isFavorited(id);
          setIsLiked(favorited);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleLike = async (e: React.MouseEvent) => {
    console.log('Heart button clicked!');
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    try {
      if (isLiked) {
        const success = await favoritesApi.remove(id);
        if (success) {
          setIsLiked(false);
          toast({
            title: "Removed from favorites",
            description: `${title} removed from your favorites`,
          });
          // Call the onUnfavorite callback if provided
          onUnfavorite?.(id);
        }
      } else {
        const success = await favoritesApi.add(id);
        if (success) {
          setIsLiked(true);
          toast({
            title: "Added to favorites",
            description: `${title} added to your favorites`,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewTrade = () => {
    // This will be handled by the Link component now
  };
  return (
    <div className="relative">
      {/* Heart button positioned absolutely outside the Link */}
      <div className="absolute top-3 right-3 z-20 pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleLike}
        >
          <Heart className={`h-4 w-4 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} />
        </Button>
      </div>
      
      <Link to={`/trade/${id}`} className="block">
        <div className="bg-card rounded-xl shadow-soft hover:shadow-medium transition-smooth border border-border overflow-hidden group">
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-smooth"
          />
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
            <Button 
              size="sm" 
              variant="outline" 
              className="hover:bg-primary hover:text-primary-foreground"
            >
              View Trade
            </Button>
          </div>
        </div>
      </div>
      </Link>
    </div>
  );
};