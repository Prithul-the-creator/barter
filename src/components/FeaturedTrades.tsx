import { TradeCard } from "./TradeCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const featuredTrades = [
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
  }
];

export const FeaturedTrades = () => {
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
          <Button variant="outline" className="hidden md:flex items-center gap-2 hover:bg-primary hover:text-primary-foreground">
            View All Trades
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTrades.map((trade, index) => (
            <TradeCard key={index} {...trade} />
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button variant="outline" className="w-full sm:w-auto gap-2 hover:bg-primary hover:text-primary-foreground">
            View All Trades
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};