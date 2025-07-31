import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Plus, Lightbulb, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { offersApi, offerImagesApi } from "@/lib/api";
import { checkAuthAndRedirect } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  sellerId: string;
  itemTitle: string;
  wantedItems?: string[];
}

const suggestedItems = [
  "Similar electronics",
  "Books or educational materials", 
  "Sports equipment",
  "Home appliances",
  "Art supplies",
  "Musical instruments",
  "Fashion items",
  "Collectibles",
  "Tools",
  "Garden supplies"
];

export function MakeOfferModal({ 
  isOpen, 
  onClose, 
  itemId, 
  sellerId, 
  itemTitle,
  wantedItems = []
}: MakeOfferModalProps) {
  const [offerMessage, setOfferMessage] = useState("");
  const [offeredItems, setOfferedItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication
    const isAuthenticated = await checkAuthAndRedirect(navigate);
    if (!isAuthenticated) return;

    if (offeredItems.length === 0) {
      toast({
        title: "No items offered",
        description: "Please add at least one item you're offering in trade.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedImage) {
      toast({
        title: "Image required",
        description: "Please upload an image of the item you're offering.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const offerId = await offersApi.create({
        itemId,
        sellerId,
        offerMessage: offerMessage.trim() || null,
        offeredItems,
      });

      if (offerId && selectedImage) {
        setIsUploadingImage(true);
        
        // Upload the image
        const imageUploadSuccess = await offerImagesApi.uploadImage(offerId, selectedImage);
        
        if (imageUploadSuccess) {
          toast({
            title: "Offer sent!",
            description: `Your offer for "${itemTitle}" has been sent to the seller.`,
          });
          onClose();
          // Reset form
          setOfferMessage("");
          setOfferedItems([]);
          setNewItem("");
          setSelectedImage(null);
          setImagePreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          toast({
            title: "Error",
            description: "Offer created but image upload failed. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to send offer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  const addOfferedItem = () => {
    if (newItem.trim() && !offeredItems.includes(newItem.trim())) {
      setOfferedItems(prev => [...prev, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeOfferedItem = (item: string) => {
    setOfferedItems(prev => prev.filter(i => i !== item));
  };

  const addSuggestedItem = (item: string) => {
    if (!offeredItems.includes(item)) {
      setOfferedItems(prev => [...prev, item]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOfferedItem();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Make an Offer</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold">{itemTitle}</h3>
                {wantedItems.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Seller wants:</p>
                    <div className="flex flex-wrap gap-1">
                      {wantedItems.map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Offer Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add a personal message to your offer..."
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {offerMessage.length}/500 characters
              </p>
            </CardContent>
          </Card>

          {/* Items You're Offering */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items You're Offering</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new item */}
              <div className="flex gap-2">
                <Input
                  placeholder="What are you offering in trade?"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button 
                  type="button" 
                  onClick={addOfferedItem}
                  disabled={!newItem.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Current offered items */}
              {offeredItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Your offer includes:</p>
                  <div className="flex flex-wrap gap-2">
                    {offeredItems.map((item, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="flex items-center gap-1"
                      >
                        {item}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => removeOfferedItem(item)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested items */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm font-medium">Suggested items:</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedItems.map((item, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSuggestedItem(item)}
                      disabled={offeredItems.includes(item)}
                      className="text-xs"
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Image of Your Item (Required)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a clear image of the item you're offering to show its quality and condition.
                </p>
                
                {/* Image upload area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  {!imagePreview ? (
                    <div className="space-y-2">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="mb-2"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Image
                        </Button>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 max-w-full rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedImage?.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || offeredItems.length === 0 || !selectedImage}
              className="flex-1"
            >
              {isSubmitting ? (isUploadingImage ? "Uploading Image..." : "Sending Offer...") : "Send Offer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 