import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradeCard } from "@/components/TradeCard";
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Camera, 
  Edit, 
  Star, 
  MapPin, 
  Calendar,
  Heart,
  MessageCircle,
  CheckCircle,
  Clock,
  Plus,
  Loader2
} from "lucide-react";
import { itemsApi } from "@/lib/api";
import { ItemWithDetails } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  location: string;
  joinDate: Date;
  rating: number;
  totalTrades: number;
  bio: string;
  isVerified: boolean;
}

interface TradeHistory {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'cancelled';
  partnerName: string;
  partnerAvatar: string;
  date: Date;
  rating?: number;
}

const mockUser: UserProfile = {
  id: "1",
  name: "User",
  email: "user@example.com",
  avatar: "",
  location: "",
  joinDate: new Date(),
  rating: 0,
  totalTrades: 0,
  bio: "",
  isVerified: false
};

const mockActiveTrades: any[] = [];

const mockTradeHistory: TradeHistory[] = [];

export default function Profile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userItems, setUserItems] = useState<ItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data and items
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('User not authenticated');
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile({
            id: profile.id,
            name: profile.full_name || profile.username || 'User',
            email: user.email || '',
            avatar: profile.avatar_url || '',
            location: profile.location || '',
            joinDate: new Date(profile.created_at),
            rating: 0, // TODO: Implement rating system
            totalTrades: 0, // TODO: Implement trade counting
            bio: profile.bio || '',
            isVerified: false // TODO: Implement verification system
          });
        }

        // Get user's items
        const { data: items } = await supabase
          .from('items')
          .select(`
            *,
            category:categories(*),
            images:item_images(*),
            wanted_items(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (items) {
          setUserItems(items as ItemWithDetails[]);
        }

      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'traded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'traded':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error loading profile</h2>
            <p className="text-muted-foreground mb-4">{error || 'User profile not found'}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userProfile.avatar} />
                  <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{userProfile.name}</h1>
                  {userProfile.isVerified && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{userProfile.location || 'Location not set'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {userProfile.joinDate.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{userProfile.rating}</span>
                    <span className="text-muted-foreground">({userProfile.totalTrades} trades)</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground max-w-2xl">{userProfile.bio || 'No bio added yet.'}</p>
              </div>
              
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trades">My Listings</TabsTrigger>
            <TabsTrigger value="history">Past Listings</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Listings</span>
                    <span className="font-semibold">{userItems.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Listings</span>
                    <span className="font-semibold">{userItems.filter(item => item.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Rating</span>
                    <span className="font-semibold">{userProfile.rating}/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-semibold">{userProfile.joinDate.toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userItems.length > 0 ? (
                    userItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Item listed: {item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                      <p className="text-xs text-muted-foreground">List your first item to see activity here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Trades Tab */}
          <TabsContent value="trades" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Listings</h2>
              <Link to="/list-item">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  List New Item
                </Button>
              </Link>
            </div>
            
            {userItems.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userItems.map((item) => (
                  <TradeCard 
                    key={item.id}
                    id={item.id}
                    image={item.images && item.images.length > 0 ? item.images[0].image_url : '/placeholder.svg'}
                    title={item.title}
                    condition={item.condition}
                    ownerName={userProfile.name}
                    location={item.location || userProfile.location || 'Location not specified'}
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
                    No listings yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start trading by listing your first item!
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
          </TabsContent>

          {/* Trade History Tab */}
          <TabsContent value="history" className="space-y-6">
            <h2 className="text-xl font-semibold">Past Listings</h2>
            
            {userItems.filter(item => item.status === 'traded' || item.status === 'inactive').length > 0 ? (
              <div className="space-y-4">
                {userItems
                  .filter(item => item.status === 'traded' || item.status === 'inactive')
                  .map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              {item.images && item.images.length > 0 ? (
                                <img 
                                  src={item.images[0].image_url} 
                                  alt={item.title}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                  <span className="text-muted-foreground text-xs">No Image</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Listed on {new Date(item.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.condition} • {item.category?.name || 'Uncategorized'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(item.status || 'active')}>
                              {getStatusIcon(item.status || 'active')}
                              <span className="ml-1 capitalize">{item.status || 'active'}</span>
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No past listings
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Your traded or inactive listings will appear here.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Display Name
                    </label>
                    <Input value={userProfile.name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input value={userProfile.email} type="email" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Location
                    </label>
                    <Input value={userProfile.location} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Bio
                    </label>
                    <Textarea value={userProfile.bio} rows={3} />
                  </div>
                  <Button className="w-full">Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Messages</p>
                      <p className="text-sm text-muted-foreground">Get notified when someone messages you</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Trade Offers</p>
                      <p className="text-sm text-muted-foreground">Receive notifications for new trade offers</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Trade Updates</p>
                      <p className="text-sm text-muted-foreground">Get updates on your active trades</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing</p>
                      <p className="text-sm text-muted-foreground">Receive promotional emails</p>
                    </div>
                    <input type="checkbox" className="rounded" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 