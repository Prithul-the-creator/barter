import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { TradeCard } from "@/components/TradeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, SlidersHorizontal } from "lucide-react";

const allTrades = [
  {
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
    title: "MacBook Pro 2021 16-inch M1 Pro",
    condition: "Excellent",
    ownerName: "Sarah Chen",
    location: "San Francisco, CA",
    wantedItems: ["Gaming PC", "Photography Equipment", "Musical Instruments"],
    timeAgo: "2 hours ago",
    liked: true
  },
  {
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
    title: "Vintage Canon AE-1 Film Camera",
    condition: "Good",
    ownerName: "Mike Rodriguez",
    location: "Austin, TX",
    wantedItems: ["Bicycle", "Books", "Art Supplies"],
    timeAgo: "5 hours ago"
  },
  {
    image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop",
    title: "Trek Mountain Bike 2022",
    condition: "Like New",
    ownerName: "Emma Wilson",
    location: "Denver, CO",
    wantedItems: ["Laptop", "Fitness Equipment", "Tools"],
    timeAgo: "1 day ago"
  },
  {
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    title: "Complete Home Office Setup",
    condition: "Excellent",
    ownerName: "David Kim",
    location: "Seattle, WA",
    wantedItems: ["Travel Gear", "Kitchen Appliances", "Outdoor Equipment"],
    timeAgo: "3 days ago",
    liked: true
  },
  {
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    title: "Nike Air Jordan Retro Collection",
    condition: "Good",
    ownerName: "Alex Thompson",
    location: "Chicago, IL",
    wantedItems: ["Tech Gadgets", "Books", "Sports Equipment"],
    timeAgo: "1 week ago"
  },
  {
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    title: "Vintage Vinyl Record Collection",
    condition: "Excellent",
    ownerName: "Lisa Martinez",
    location: "Nashville, TN",
    wantedItems: ["Musical Instruments", "Audio Equipment", "Books"],
    timeAgo: "2 days ago"
  }
];

const categories = [
  "All Categories",
  "Electronics",
  "Sports & Outdoors",
  "Fashion",
  "Books & Media",
  "Home & Garden",
  "Automotive",
  "Collectibles"
];

const conditions = ["Any Condition", "Excellent", "Good", "Fair"];
const sortOptions = ["Newest First", "Most Liked", "Closest Match", "Recently Updated"];

export default function Browse() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-3 py-1"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
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
              <Select defaultValue="Any Condition">
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

              <Select defaultValue="Newest First">
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
                  <Input placeholder="City, State or ZIP" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Distance
                  </label>
                  <Select defaultValue="50">
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
                  <Select defaultValue="anytime">
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

        {/* Results count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {allTrades.length} trades {selectedCategory !== "All Categories" && `in ${selectedCategory}`}
          </p>
        </div>

        {/* Trade grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allTrades.map((trade, index) => (
            <TradeCard key={index} {...trade} />
          ))}
        </div>

        {/* Load more */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground">
            Load More Trades
          </Button>
        </div>
      </main>
    </div>
  );
}