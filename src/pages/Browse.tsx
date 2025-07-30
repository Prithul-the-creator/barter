import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { TradeCard } from "@/components/TradeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, SlidersHorizontal, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { itemsApi, categoriesApi } from "@/lib/api";
import { ItemWithDetails } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const conditions = ["Any Condition", "Excellent", "Good", "Fair"];
const sortOptions = ["Newest First", "Most Liked", "Closest Match", "Recently Updated"];

export default function Browse() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState("Any Condition");
  const [sortBy, setSortBy] = useState("Newest First");
  const [location, setLocation] = useState("");
  const [distance, setDistance] = useState("50");
  const [timePosted, setTimePosted] = useState("anytime");
  const [items, setItems] = useState<ItemWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load items and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load categories
        const categoriesData = await categoriesApi.getAll();
        setCategories(categoriesData);
        
        // Load all active items
        const itemsData = await itemsApi.getAll();
        
        // Filter out current user's items
        const { data: { user } } = await supabase.auth.getUser();
        const filteredItems = user 
          ? itemsData.filter(item => item.user_id !== user.id)
          : itemsData;
        
        setItems(filteredItems);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load items');
        toast({
          title: "Error",
          description: "Failed to load items. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Filter and sort items based on current selections
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Category filter
      if (selectedCategory !== "All Categories") {
        const category = categories.find(cat => cat.name === selectedCategory);
        return category && item.category_id === category.id;
      }
      
      // Condition filter
      if (selectedCondition !== "Any Condition") {
        return item.condition === selectedCondition;
      }
      
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(searchLower) ||
               item.description.toLowerCase().includes(searchLower) ||
               (item.wanted_items && item.wanted_items.some(wanted => 
                 wanted.description.toLowerCase().includes(searchLower)
               ));
      }
      
      return true;
    });

      // Sort items
  switch (sortBy) {
    case "Most Liked":
      return filtered.sort((a, b) => (b.id.localeCompare(a.id))); // Fallback to ID for now
    case "Closest Match":
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    case "Recently Updated":
      return filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    default: // "Newest First"
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}, [items, categories, selectedCategory, selectedCondition, searchQuery, sortBy]);

  const handleLoadMore = () => {
    toast({
      title: "Loading more trades...",
      description: "Fetching additional trades from the network.",
    });
  };

  return (
    <div className="bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Browse Trades
          </h1>
          <p className="text-muted-foreground">
            Discover amazing items available for trade in your area and beyond
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search for specific items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === "All Categories" ? "default" : "secondary"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-3 py-1"
              onClick={() => setSelectedCategory("All Categories")}
            >
              All Categories
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.name ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-3 py-1"
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          {/* Advanced filters and sort */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "More Filters"}
            </Button>

            <div className="flex gap-4 w-full sm:w-auto">
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Extended filters (collapsible) */}
          {showFilters && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location
                  </label>
                  <Input 
                    placeholder="City, State or ZIP" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Distance
                  </label>
                  <Select value={distance} onValueChange={setDistance}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Within 10 miles</SelectItem>
                      <SelectItem value="25">Within 25 miles</SelectItem>
                      <SelectItem value="50">Within 50 miles</SelectItem>
                      <SelectItem value="100">Within 100 miles</SelectItem>
                      <SelectItem value="anywhere">Anywhere</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Posted
                  </label>
                  <Select value={timePosted} onValueChange={setTimePosted}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading items...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Error loading items
              </h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && !error && (
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredItems.length} items {selectedCategory !== "All Categories" && `in ${selectedCategory}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Trade grid */}
        {!loading && !error && filteredItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
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
        ) : !loading && !error ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No items found
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedCategory !== "All Categories" 
                  ? "Try adjusting your search or filters to find more items."
                  : "Be the first to list an item for trade!"
                }
              </p>
              <Link to="/list-item">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  List Your First Item
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        {/* Load more */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg" 
            className="hover:bg-primary hover:text-primary-foreground"
            onClick={handleLoadMore}
          >
            Load More Trades
          </Button>
        </div>
      </main>
    </div>
  );
}