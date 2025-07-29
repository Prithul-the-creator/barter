import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Plus, Lightbulb } from "lucide-react";

const categories = [
  "Electronics",
  "Sports & Outdoors", 
  "Fashion",
  "Books & Media",
  "Home & Garden",
  "Automotive",
  "Collectibles",
  "Other"
];

const conditions = ["Excellent", "Good", "Fair"];

const suggestedTrades = [
  "Similar electronics",
  "Books or educational materials", 
  "Sports equipment",
  "Home appliances",
  "Art supplies",
  "Musical instruments"
];

export default function ListItem() {
  const [images, setImages] = useState<string[]>([]);
  const [wantedItems, setWantedItems] = useState<string[]>([]);
  const [newWantedItem, setNewWantedItem] = useState("");

  const addWantedItem = () => {
    if (newWantedItem.trim() && !wantedItems.includes(newWantedItem.trim())) {
      setWantedItems([...wantedItems, newWantedItem.trim()]);
      setNewWantedItem("");
    }
  };

  const removeWantedItem = (item: string) => {
    setWantedItems(wantedItems.filter(i => i !== item));
  };

  const addSuggestedItem = (item: string) => {
    if (!wantedItems.includes(item)) {
      setWantedItems([...wantedItems, item]);
    }
  };

  return (
    <div className="bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            List Your Item for Trade
          </h1>
          <p className="text-muted-foreground">
            Share details about your item and what you'd like to trade it for
          </p>
        </div>

        <form className="space-y-8">
          {/* Images */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Upload placeholder */}
                <div className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Add Photo</span>
                </div>
                
                {/* Image previews */}
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Add up to 8 photos. First photo will be the main image.
              </p>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Item Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title *
                </label>
                <Input placeholder="What are you trading?" className="text-base" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <Textarea
                  placeholder="Describe your item in detail. Include brand, model, age, reason for trading, etc."
                  className="min-h-[120px] text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category *
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Condition *
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Item condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition} value={condition.toLowerCase()}>
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What do you want in return */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                What do you want in return?
              </h3>
              
              {/* Add wanted items */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an item you'd trade for..."
                    value={newWantedItem}
                    onChange={(e) => setNewWantedItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWantedItem())}
                    className="flex-1"
                  />
                  <Button onClick={addWantedItem} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Current wanted items */}
                {wantedItems.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {wantedItems.map((item, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {item}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeWantedItem(item)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Popular trade suggestions:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTrades.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => addSuggestedItem(suggestion)}
                      >
                        + {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Preferences */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Trading Preferences</h3>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <Input placeholder="City, State (for local trades)" />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allow-shipping"
                  className="rounded border-border"
                />
                <label htmlFor="allow-shipping" className="text-sm text-foreground">
                  I'm willing to ship this item
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="open-to-offers"
                  className="rounded border-border"
                  defaultChecked
                />
                <label htmlFor="open-to-offers" className="text-sm text-foreground">
                  Open to other trade offers
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button variant="outline" size="lg" className="flex-1">
              Save as Draft
            </Button>
            <Button variant="gradient" size="lg" className="flex-1">
              List Item for Trade
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}