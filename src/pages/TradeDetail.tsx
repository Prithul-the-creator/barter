import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Share2, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Star, 
  ArrowLeft,
  Camera,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { itemsApi, favoritesApi, offersApi } from "@/lib/api";
import { ItemWithDetails } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { Chat } from "@/components/Chat";
import { MakeOfferModal } from "@/components/MakeOfferModal";
import { checkAuthAndRedirect } from "@/lib/utils";

interface TradeDetail {
  id: string;
  title: string;
  description: string;
  condition: string;
  category: string;
  images: string[];
  owner: {
    id: string;
    name: string;
    avatar: string;
    location: string;
    rating: number;
    totalTrades: number;
    isVerified: boolean;
    joinDate: Date;
  };
  wantedItems: string[];
  location: string;
  postedDate: Date;
  isLiked: boolean;
  views: number;
  likes: number;
  allowShipping: boolean;
  openToOffers: boolean;
}

const mockTradeDetail: TradeDetail = {
  id: "1",
  title: "Sample Item",
  description: "This is a sample item description. Replace with actual item details.",
  condition: "Good",
  category: "Other",
  images: [],
  owner: {
    id: "user1",
    name: "Sample User",
    avatar: "",
    location: "",
    rating: 0,
    totalTrades: 0,
    isVerified: false,
    joinDate: new Date()
  },
  wantedItems: [],
  location: "",
  postedDate: new Date(),
  isLiked: false,
  views: 0,
  likes: 0,
  allowShipping: false,
  openToOffers: false
};

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [item, setItem] = useState<ItemWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMakeOffer, setShowMakeOffer] = useState(false);
  const [hasUserOffered, setHasUserOffered] = useState(false);
  const { toast } = useToast();

  // Fetch item data and check ownership
  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user.id);
        }
        
        const itemData = await itemsApi.getById(id);
        if (itemData) {
          setItem(itemData);
          
          // Check if current user owns this item
          if (user && itemData.user_id === user.id) {
            setIsOwner(true);
          }
          
          // Check if item is favorited by current user
          if (user) {
            const favorited = await favoritesApi.isFavorited(itemData.id);
            setIsLiked(favorited);
          }
        } else {
          setError('Item not found');
        }
      } catch (err) {
        console.error('Error fetching item:', err);
        setError('Failed to load item');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // Listen for real-time changes to favorites
  useEffect(() => {
    if (!item) return;

    const channel = supabase
      .channel(`favorites-detail-${item.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `item_id=eq.${item.id}`
        },
        async () => {
          // Re-check favorite status when favorites change
          const favorited = await favoritesApi.isFavorited(item.id);
          setIsLiked(favorited);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [item]);

  // Check if user has already made an offer
  useEffect(() => {
    const checkUserOffer = async () => {
      if (!item || !currentUser) return;
      
      const hasOffered = await offersApi.hasUserOffered(item.id);
      setHasUserOffered(hasOffered);
    };

    checkUserOffer();
  }, [item, currentUser]);

  const handleLike = async () => {
    if (!item) return;
    
    // Check authentication before allowing like
    const isAuthenticated = await checkAuthAndRedirect(navigate);
    if (!isAuthenticated) return;
    
    try {
      if (isLiked) {
        const success = await favoritesApi.remove(item.id);
        if (success) {
          setIsLiked(false);
          toast({
            title: "Removed from favorites",
            description: `${item.title} removed from your favorites`,
          });
          // Optionally redirect to browse page after unfavoriting
          // You can uncomment the next line if you want this behavior
          // window.history.back();
        }
      } else {
        const success = await favoritesApi.add(item.id);
        if (success) {
          setIsLiked(true);
          toast({
            title: "Added to favorites",
            description: `${item.title} added to your favorites`,
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Trade link has been copied to your clipboard.",
    });
  };

  const handleContactOwner = async () => {
    // Check authentication before allowing chat
    const isAuthenticated = await checkAuthAndRedirect(navigate);
    if (!isAuthenticated) return;
    
    setShowChat(true);
  };

  const handleMakeOffer = async () => {
    // Check authentication before allowing offer
    const isAuthenticated = await checkAuthAndRedirect(navigate);
    if (!isAuthenticated) return;
    
    setShowMakeOffer(true);
  };


  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading item...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Item Not Found</h2>
              <p className="text-muted-foreground mb-4">{error || 'The item you are looking for does not exist.'}</p>
              <Link to="/browse">
                <Button>Back to Browse</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get images from the item
  const images = item.images?.map(img => img.image_url) || [];
  const mainImage = images.length > 0 ? images[selectedImage] : '/placeholder.svg';

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link to="/browse" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={mainImage}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="p-4">
                    <div className="flex space-x-2 overflow-x-auto">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            selectedImage === index ? 'border-primary' : 'border-border'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${item.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trade Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold mb-2">
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {item.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(new Date(item.created_at))}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLike}
                      className={isLiked ? 'text-red-500' : ''}
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Condition</h4>
                    <Badge variant="secondary">{item.condition}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Category</h4>
                    <Badge variant="outline">{item.category?.name || 'Uncategorized'}</Badge>
                  </div>
                </div>

                {item.wanted_items && item.wanted_items.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Wants in Return</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.wanted_items.map((wantedItem, index) => (
                        <Badge key={index} variant="secondary">
                          {wantedItem.description}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">Shipping:</span>
                    {item.allow_shipping ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                    <span>{item.allow_shipping ? 'Available' : 'Local only'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">Offers:</span>
                    {item.open_to_offers ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                    <span>{item.open_to_offers ? 'Open to offers' : 'Specific items only'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Actions - Only show if user owns the item */}
            {isOwner ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Item Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your item is now live and visible to other users. You can edit or remove it anytime from your profile.
                  </p>
                  <div className="space-y-2">
                    <Link to={`/edit-item/${item.id}`}>
                      <Button className="w-full" variant="outline">
                        Edit Item
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="outline" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Non-owner view - Show item owner info and contact options */
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About the Owner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.profile?.avatar_url} />
                      <AvatarFallback>
                        {item.profile?.full_name?.[0] || item.profile?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {item.profile?.full_name || item.profile?.username || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Member since {item.profile?.created_at ? new Date(item.profile.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  {item.profile?.location && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{item.profile.location}</span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={handleContactOwner}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Owner
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleMakeOffer}
                      disabled={hasUserOffered}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {hasUserOffered ? "Offer Already Sent" : "Make Offer"}
                    </Button>
                    {hasUserOffered && (
                      <p className="text-xs text-muted-foreground text-center">
                        You've already made an offer on this item
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}



            {/* Similar Trades */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Similar Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Find more items like this in the same category
                </p>
                <Button variant="outline" className="w-full mt-3">
                  Browse Similar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && item && (
        <Chat
          itemId={item.id}
          receiverId={item.user_id}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Make Offer Modal */}
      {showMakeOffer && item && (
        <MakeOfferModal
          isOpen={showMakeOffer}
          onClose={() => setShowMakeOffer(false)}
          itemId={item.id}
          sellerId={item.user_id}
          itemTitle={item.title}
          wantedItems={item.wanted_items?.map(wi => wi.description) || []}
        />
      )}
    </div>
  );
} 