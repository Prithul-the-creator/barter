import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { TradeCard } from "@/components/TradeCard";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { favoritesApi } from "@/lib/api";
import { ItemWithDetails } from "@/types/database";
import { checkAuthAndRedirect } from "@/lib/utils";

export default function Favorites() {
  const [favorites, setFavorites] = useState<ItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUnfavorite = (itemId: string) => {
    setFavorites(prev => prev.filter(item => item.id !== itemId));
  };

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await checkAuthAndRedirect(navigate);
      if (!isAuthenticated) return;
    };
    
    checkAuth();
  }, [navigate]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);
        const favorites = await favoritesApi.getFavorites();
        setFavorites(favorites);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [currentUserId]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading favorites...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/browse" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                My Favorites
              </h1>
              <p className="text-muted-foreground">
                Items you've saved for later
              </p>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((item) => (
              <TradeCard
                key={item.id}
                id={item.id}
                image={item.images && item.images.length > 0 ? item.images[0].image_url : '/placeholder.svg'}
                title={item.title}
                condition={item.condition}
                ownerName={item.profile?.full_name || item.profile?.username || 'Unknown User'}
                location={item.location || 'Unknown Location'}
                wantedItems={item.wanted_items?.map(wi => wi.item_name) || []}
                timeAgo={formatTimeAgo(item.created_at)}
                liked={true}
                onUnfavorite={handleUnfavorite}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No favorites yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start browsing items and click the heart icon to save your favorites here.
              </p>
              <Link to="/browse">
                <Button className="gap-2">
                  <Heart className="h-4 w-4" />
                  Browse Items
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
} 