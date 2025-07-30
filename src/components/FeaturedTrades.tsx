import { TradeCard } from "./TradeCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { itemsApi } from "@/lib/api";
import { ItemWithDetails } from "@/types/database";
import { supabase } from "@/lib/supabase";

export const FeaturedTrades = () => {
  const [featuredItems, setFeaturedItems] = useState<ItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedItems = async () => {
      try {
        setLoading(true);
        // Get the most recent 4 items as featured
        const allItems = await itemsApi.getAll();
        
        // Filter out current user's items
        const { data: { user } } = await supabase.auth.getUser();
        const filteredItems = user 
          ? allItems.filter(item => item.user_id !== user.id)
          : allItems;
        
        const recentItems = filteredItems
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4);
        setFeaturedItems(recentItems);
      } catch (error) {
        console.error('Error loading featured items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedItems();
  }, []);
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Trades
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover amazing items ready for trade right now
            </p>
          </div>
          <Link to="/browse">
            <Button variant="outline" className="hidden md:flex items-center gap-2 hover:bg-primary hover:text-primary-foreground">
              View All Trades
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading featured items...</span>
            </div>
          </div>
        ) : featuredItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <TradeCard 
                key={item.id}
                id={item.id}
                image={item.images && item.images.length > 0 ? item.images[0].image_url : '/placeholder.svg'}
                title={item.title}
                condition={item.condition}
                ownerName={item.profile?.full_name || item.profile?.username || 'Unknown User'}
                location={item.location || 'Location not specified'}
                wantedItems={item.wanted_items ? item.wanted_items.map(w => w.description) : []}
                timeAgo={new Date(item.created_at).toLocaleDateString()}
                liked={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No featured trades yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Be the first to list an item and get featured!
              </p>
              <Link to="/list-item">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  List Your First Item
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link to="/browse">
            <Button variant="outline" className="w-full sm:w-auto gap-2 hover:bg-primary hover:text-primary-foreground">
              View All Trades
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};