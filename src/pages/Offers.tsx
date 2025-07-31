import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Package,
  MessageCircle,
  Loader2,
  MapPin
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { offersApi, tradeMeetingsApi } from "@/lib/api";
import { OfferWithDetails, TradeMeeting } from "@/types/database";
import { checkAuthAndRedirect } from "@/lib/utils";
import { TradeMeetingModal } from "@/components/TradeMeetingModal";

export default function Offers() {
  const [sentOffers, setSentOffers] = useState<OfferWithDetails[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<OfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sent");
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [offerToDecline, setOfferToDecline] = useState<string | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null);
  const [meetings, setMeetings] = useState<TradeMeeting[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await checkAuthAndRedirect(navigate);
      if (!isAuthenticated) return;
    };
    
    checkAuth();
  }, [navigate]);

     // Load offers and meetings
   useEffect(() => {
     const loadOffers = async () => {
       try {
         setLoading(true);
         const [sent, received, userMeetings] = await Promise.all([
           offersApi.getSentOffers(),
           offersApi.getReceivedOffers(),
           tradeMeetingsApi.getUserMeetings()
         ]);
         console.log('Initial load - Sent offers:', sent.length);
         console.log('Initial load - Received offers:', received.length);
         console.log('Initial load - Meetings:', userMeetings.length);
         setSentOffers(sent);
         setReceivedOffers(received);
         setMeetings(userMeetings);
       } catch (error) {
         console.error('Error loading offers:', error);
         toast({
           title: "Error",
           description: "Failed to load offers. Please try again.",
           variant: "destructive",
         });
       } finally {
         setLoading(false);
       }
     };

     loadOffers();
   }, [toast]);

  const handleUpdateOfferStatus = async (offerId: string, status: 'accepted' | 'declined' | 'withdrawn') => {
    try {
      console.log(`Updating offer ${offerId} to status: ${status}`);
      const success = await offersApi.updateStatus(offerId, status);
      if (success) {
        toast({
          title: "Offer updated",
          description: `Offer has been ${status}.`,
        });
                 // Reload offers and meetings
         const [sent, received, userMeetings] = await Promise.all([
           offersApi.getSentOffers(),
           offersApi.getReceivedOffers(),
           tradeMeetingsApi.getUserMeetings()
         ]);
         console.log('Reloaded offers:', { sent: sent.length, received: received.length });
         console.log('Received offers statuses:', received.map(o => ({ id: o.id, status: o.status })));
         setSentOffers(sent);
         setReceivedOffers(received);
         setMeetings(userMeetings);
      } else {
        toast({
          title: "Error",
          description: "Failed to update offer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineClick = (offerId: string) => {
    setOfferToDecline(offerId);
    setShowDeclineDialog(true);
  };

  const handleConfirmDecline = async () => {
    if (offerToDecline) {
      // Immediately remove the offer from local state
      setReceivedOffers(prev => prev.filter(offer => offer.id !== offerToDecline));
      
      // Update the database
      await handleUpdateOfferStatus(offerToDecline, 'declined');
      setShowDeclineDialog(false);
      setOfferToDecline(null);
    }
  };

  const handleCancelDecline = () => {
    setShowDeclineDialog(false);
    setOfferToDecline(null);
  };

  const handleScheduleMeeting = (offer: OfferWithDetails) => {
    setSelectedOffer(offer);
    setShowMeetingModal(true);
  };

     const handleCloseMeetingModal = async () => {
     setShowMeetingModal(false);
     setSelectedOffer(null);
     
     // Reload meetings when modal closes
     try {
       const userMeetings = await tradeMeetingsApi.getUserMeetings();
       setMeetings(userMeetings);
     } catch (error) {
       console.error('Error reloading meetings:', error);
     }
   };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'declined':
        return <XCircle className="h-4 w-4" />;
      case 'withdrawn':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

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

   const formatMeetingTime = (dateString: string) => {
     const date = new Date(dateString);
     return date.toLocaleString('en-US', {
       weekday: 'long',
       year: 'numeric',
       month: 'long',
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
     });
   };

   const getMeetingStatusColor = (status: string) => {
     switch (status) {
       case 'confirmed':
         return 'bg-green-100 text-green-800';
       case 'completed':
         return 'bg-blue-100 text-blue-800';
       case 'cancelled':
         return 'bg-red-100 text-red-800';
       default:
         return 'bg-yellow-100 text-yellow-800';
     }
   };

  const renderOfferCard = (offer: OfferWithDetails, isSent: boolean) => (
    <Card key={offer.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={isSent ? offer.seller?.avatar_url : offer.buyer?.avatar_url} />
              <AvatarFallback>
                {isSent ? offer.seller?.full_name?.[0] : offer.buyer?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {isSent ? offer.seller?.full_name : offer.buyer?.full_name || 'Unknown User'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isSent ? 'Seller' : 'Buyer'}
              </p>
            </div>
          </div>
          <Badge className={`flex items-center gap-1 ${getStatusColor(offer.status)}`}>
            {getStatusIcon(offer.status)}
            {offer.status}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-1">Item:</h4>
            <p className="text-sm text-muted-foreground">{offer.item?.title}</p>
          </div>

          {offer.offer_message && (
            <div>
              <h4 className="font-medium mb-1">Message:</h4>
              <p className="text-sm text-muted-foreground">{offer.offer_message}</p>
            </div>
          )}

          {offer.offered_items && offer.offered_items.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Offered Items:</h4>
              <div className="flex flex-wrap gap-1">
                {offer.offered_items.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {offer.images && offer.images.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Offered Item Images:</h4>
              <div className="flex gap-2 overflow-x-auto">
                {offer.images.map((image, index) => (
                  <img
                    key={image.id}
                    src={image.image_url}
                    alt={`Offered item ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatTimeAgo(offer.created_at)}</span>
                         {offer.status === 'pending' && (
               <div className="flex gap-2">
                 {isSent ? (
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => handleUpdateOfferStatus(offer.id, 'withdrawn')}
                   >
                     Withdraw
                   </Button>
                 ) : (
                   <>
                     <Button
                       size="sm"
                       variant="default"
                       onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')}
                     >
                       Accept
                     </Button>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => handleDeclineClick(offer.id)}
                     >
                       Decline
                     </Button>
                   </>
                 )}
               </div>
             )}
             {offer.status === 'accepted' && (
               <div className="flex gap-2">
                 {/* Check if there's already a meeting for this offer */}
                 {meetings.find(m => m.offer_id === offer.id) ? (
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => handleScheduleMeeting(offer)}
                   >
                     View Meeting
                   </Button>
                 ) : (
                   <Button
                     size="sm"
                     variant="default"
                     onClick={() => handleScheduleMeeting(offer)}
                   >
                     Propose Meeting
                   </Button>
                 )}
               </div>
             )}
          </div>
        </div>
      </CardContent>
         </Card>
   );

   const renderMeetingCard = (meeting: TradeMeeting) => (
     <Card key={meeting.id} className="mb-4">
       <CardContent className="p-6">
         <div className="flex items-start justify-between mb-4">
           <div className="flex items-center space-x-3">
             <Avatar className="h-10 w-10">
               <AvatarFallback>
                 <Package className="h-5 w-5" />
               </AvatarFallback>
             </Avatar>
             <div>
               <h3 className="font-semibold">Trade Meeting</h3>
               <p className="text-sm text-muted-foreground">
                 Offer ID: {meeting.offer_id.slice(0, 8)}...
               </p>
             </div>
           </div>
           <Badge className={`flex items-center gap-1 ${getMeetingStatusColor(meeting.status)}`}>
             {meeting.status}
           </Badge>
         </div>

         <div className="space-y-3">
           {meeting.meeting_location && (
             <div>
               <h4 className="font-medium mb-1">Meeting Location:</h4>
               <p className="text-sm text-muted-foreground">{meeting.meeting_location}</p>
               {meeting.meeting_address && (
                 <p className="text-sm text-muted-foreground">{meeting.meeting_address}</p>
               )}
             </div>
           )}

           {meeting.meeting_time && (
             <div>
               <h4 className="font-medium mb-1">Meeting Time:</h4>
               <p className="text-sm text-muted-foreground">{formatMeetingTime(meeting.meeting_time)}</p>
             </div>
           )}

           {meeting.distance_km && (
             <div>
               <h4 className="font-medium mb-1">Distance:</h4>
               <p className="text-sm text-muted-foreground">
                 {meeting.distance_km < 1 
                   ? `${Math.round(meeting.distance_km * 1000)}m` 
                   : `${meeting.distance_km.toFixed(1)}km`}
               </p>
             </div>
           )}

                       <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Created {formatTimeAgo(meeting.created_at)}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScheduleMeeting({ id: meeting.offer_id } as OfferWithDetails)}
                >
                  {meeting.status === 'pending' ? 'Respond to Meeting' : 'View Details'}
                </Button>
              </div>
            </div>
         </div>
       </CardContent>
     </Card>
   );

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading offers...</span>
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
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                My Offers
              </h1>
              <p className="text-muted-foreground">
                Manage your trade offers
              </p>
            </div>
          </div>
        </div>

        {/* Offers Tabs */}
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
           <TabsList className="grid w-full grid-cols-3">
             <TabsTrigger value="sent">
               Sent Offers ({sentOffers.length})
             </TabsTrigger>
             <TabsTrigger value="received">
               Received Offers ({receivedOffers.filter(offer => offer.status === 'pending' || offer.status === 'accepted').length})
             </TabsTrigger>
             <TabsTrigger value="meetings">
               Trade Meetings ({meetings.length})
             </TabsTrigger>
           </TabsList>

          <TabsContent value="sent" className="space-y-4">
            {sentOffers.length > 0 ? (
              sentOffers.map(offer => renderOfferCard(offer, true))
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No sent offers yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start browsing items and make offers to see them here.
                </p>
                <Link to="/browse">
                  <Button className="gap-2">
                    <Package className="h-4 w-4" />
                    Browse Items
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

                     <TabsContent value="received" className="space-y-4">
             {receivedOffers.filter(offer => offer.status === 'pending' || offer.status === 'accepted').length > 0 ? (
               receivedOffers.filter(offer => offer.status === 'pending' || offer.status === 'accepted').map(offer => renderOfferCard(offer, false))
             ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No received offers yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  When other users make offers on your items, they'll appear here.
                </p>
                <Link to="/profile">
                  <Button className="gap-2">
                    <User className="h-4 w-4" />
                    View My Listings
                  </Button>
                </Link>
              </div>
            )}
                     </TabsContent>

           <TabsContent value="meetings" className="space-y-4">
             {meetings.length > 0 ? (
               meetings.map(meeting => renderMeetingCard(meeting))
             ) : (
               <div className="text-center py-12">
                 <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-foreground mb-2">
                   No trade meetings yet
                 </h3>
                 <p className="text-muted-foreground mb-6">
                   When you accept offers and schedule meetings, they'll appear here.
                 </p>
                 <Link to="/browse">
                   <Button className="gap-2">
                     <Package className="h-4 w-4" />
                     Browse Items
                   </Button>
                 </Link>
               </div>
             )}
           </TabsContent>
         </Tabs>
      </div>

      {/* Decline Confirmation Dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline this offer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDecline}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDecline} className="bg-red-600 hover:bg-red-700">
              Yes, Decline Offer
            </AlertDialogAction>
          </AlertDialogFooter>
                 </AlertDialogContent>
       </AlertDialog>

       {/* Trade Meeting Modal */}
       {selectedOffer && (
         <TradeMeetingModal
           isOpen={showMeetingModal}
           onClose={handleCloseMeetingModal}
           offerId={selectedOffer.id}
           buyerId={selectedOffer.buyer_id}
           sellerId={selectedOffer.seller_id}
           buyerName={selectedOffer.buyer?.full_name || 'Unknown'}
           sellerName={selectedOffer.seller?.full_name || 'Unknown'}
           itemTitle={selectedOffer.item?.title || 'Unknown Item'}
         />
       )}
     </div>
   );
 } 