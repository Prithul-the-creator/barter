import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  Clock, 
  Navigation, 
  User, 
  Package,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tradeMeetingsApi } from "@/lib/api";
import { getUserLocation, calculateDistance, formatDistance } from "@/lib/utils";
import { TradeMeeting } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface TradeMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  itemTitle: string;
}

export function TradeMeetingModal({
  isOpen,
  onClose,
  offerId,
  buyerId,
  sellerId,
  buyerName,
  sellerName,
  itemTitle,
}: TradeMeetingModalProps) {
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [buyerLocation, setBuyerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sellerLocation, setSellerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingAddress, setMeetingAddress] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [existingMeeting, setExistingMeeting] = useState<TradeMeeting | null>(null);
  const { toast } = useToast();

  // Get current user's location when modal opens
  useEffect(() => {
    if (isOpen && !buyerLocation && !sellerLocation) {
      getCurrentUserLocation();
    }
  }, [isOpen]);

  // Check for existing meeting
  useEffect(() => {
    if (isOpen && offerId) {
      checkExistingMeeting();
    }
  }, [isOpen, offerId]);

  const getCurrentUserLocation = async () => {
    try {
      setGettingLocation(true);
      const location = await getUserLocation();
      
      // Determine if current user is buyer or seller
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (user.id === buyerId) {
        setBuyerLocation(location);
      } else if (user.id === sellerId) {
        setSellerLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Could not get your location. Please enable location services.",
        variant: "destructive",
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const checkExistingMeeting = async () => {
    try {
      const meeting = await tradeMeetingsApi.getByOfferId(offerId);
      if (meeting) {
        setExistingMeeting(meeting);
        setMeetingLocation(meeting.meeting_location || "");
        setMeetingAddress(meeting.meeting_address || "");
        setMeetingTime(meeting.meeting_time ? new Date(meeting.meeting_time).toISOString().slice(0, 16) : "");
      }
    } catch (error) {
      console.error('Error checking existing meeting:', error);
    }
  };

  const calculateDistanceBetweenUsers = () => {
    if (buyerLocation && sellerLocation) {
      const distanceKm = calculateDistance(
        buyerLocation.lat,
        buyerLocation.lng,
        sellerLocation.lat,
        sellerLocation.lng
      );
      setDistance(distanceKm);
      return distanceKm;
    }
    return null;
  };

  const handleCreateMeeting = async () => {
    if (!meetingLocation || !meetingTime) {
      toast({
        title: "Missing Information",
        description: "Please provide a meeting location and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get both users' locations if we don't have them
      if (!buyerLocation || !sellerLocation) {
        await getCurrentUserLocation();
      }

      const distanceKm = calculateDistanceBetweenUsers();

      if (existingMeeting) {
        // Update existing meeting with new proposal
        const success = await tradeMeetingsApi.update(existingMeeting.id, {
          meetingLocation,
          meetingAddress,
          meetingTime: new Date(meetingTime).toISOString(),
          status: 'pending'
        });

        if (success) {
          toast({
            title: "New Meeting Time Proposed",
            description: "Your meeting proposal has been sent to the other party.",
          });
          onClose();
        }
      } else {
        // Create new meeting
        const meetingId = await tradeMeetingsApi.create({
          offerId,
          buyerId,
          sellerId,
          buyerLat: buyerLocation?.lat || 0,
          buyerLng: buyerLocation?.lng || 0,
          sellerLat: sellerLocation?.lat || 0,
          sellerLng: sellerLocation?.lng || 0,
          distanceKm: distanceKm || 0,
        });

        if (meetingId) {
          toast({
            title: "Meeting Proposed",
            description: "Your meeting proposal has been sent to the other party.",
          });
          onClose();
        }
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: "Error",
        description: "Failed to create trade meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMeeting = async () => {
    if (!existingMeeting) return;

    try {
      setLoading(true);
      const success = await tradeMeetingsApi.update(existingMeeting.id, {
        status: 'confirmed'
      });

      if (success) {
        toast({
          title: "Meeting Confirmed",
          description: "Trade meeting has been confirmed by both parties.",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error confirming meeting:', error);
      toast({
        title: "Error",
        description: "Failed to confirm meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMeeting = async () => {
    if (!existingMeeting) return;

    try {
      setLoading(true);
      const success = await tradeMeetingsApi.update(existingMeeting.id, {
        status: 'cancelled'
      });

      if (success) {
        toast({
          title: "Meeting Rejected",
          description: "The meeting proposal has been rejected.",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error rejecting meeting:', error);
      toast({
        title: "Error",
        description: "Failed to reject meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Schedule Trade Meeting
          </DialogTitle>
          <DialogDescription>
            Coordinate a time and place to meet for your trade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trade Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trade Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{buyerName}</strong> ↔ <strong>{sellerName}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{itemTitle}</span>
              </div>
              {distance && (
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Distance: <Badge variant="secondary">{formatDistance(distance)}</Badge>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gettingLocation ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting your location...
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="meetingLocation">Meeting Location</Label>
                    <Input
                      id="meetingLocation"
                      placeholder="e.g., Central Park, Starbucks, etc."
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="meetingAddress">Address (Optional)</Label>
                    <Input
                      id="meetingAddress"
                      placeholder="Full address for navigation"
                      value={meetingAddress}
                      onChange={(e) => setMeetingAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Meeting Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="meetingTime">Date & Time</Label>
                <Input
                  id="meetingTime"
                  type="datetime-local"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </CardContent>
          </Card>

                     {/* Existing Meeting Status */}
           {existingMeeting && (
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Meeting Status</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   <div className="flex items-center gap-2">
                     <Badge variant={existingMeeting.status === 'confirmed' ? 'default' : 'secondary'}>
                       {existingMeeting.status}
                     </Badge>
                   </div>
                   
                   {existingMeeting.status === 'pending' && (
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         onClick={handleConfirmMeeting}
                         disabled={loading}
                       >
                         {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept Meeting'}
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={handleRejectMeeting}
                         disabled={loading}
                       >
                         {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject Meeting'}
                       </Button>
                     </div>
                   )}
                   
                   {existingMeeting.status === 'confirmed' && (
                     <div className="text-sm text-green-600">
                       ✓ Meeting confirmed by both parties
                     </div>
                   )}
                   
                   {existingMeeting.status === 'cancelled' && (
                     <div className="text-sm text-red-600">
                       ✗ Meeting was rejected
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>
           )}
        </div>

                 <DialogFooter>
           <Button variant="outline" onClick={onClose}>
             Cancel
           </Button>
           <Button 
             onClick={handleCreateMeeting}
             disabled={loading || !meetingLocation || !meetingTime}
           >
             {loading ? (
               <>
                 <Loader2 className="h-4 w-4 animate-spin mr-2" />
                 {existingMeeting ? 'Proposing...' : 'Creating...'}
               </>
             ) : (
               existingMeeting ? 'Propose New Time' : 'Propose Meeting'
             )}
           </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 