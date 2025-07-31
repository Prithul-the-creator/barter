import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Plus, Lightbulb, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { itemsApi, itemImagesApi, wantedItemsApi } from "@/lib/api";
import { categoriesApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { checkAuthAndRedirect } from "@/lib/utils";

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
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{id: string, image_url: string}>>([]);
  const [wantedItems, setWantedItems] = useState<string[]>([]);
  const [newWantedItem, setNewWantedItem] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    condition: "",
    location: "",
    allowShipping: false,
    openToOffers: true
  });

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await checkAuthAndRedirect(navigate);
      if (!isAuthenticated) return;
    };
    
    checkAuth();
  }, [navigate]);

  // Load categories and existing item data on component mount
  useEffect(() => {
    const loadData = async () => {
      // Load categories
      const cats = await categoriesApi.getAll();
      console.log('Loaded categories:', cats);
      setCategories(cats);

      // If editing, load existing item data
      if (isEditing && id) {
        try {
          const itemData = await itemsApi.getById(id);
          if (itemData) {
            setFormData({
              title: itemData.title,
              description: itemData.description || "",
              categoryId: itemData.category_id,
              condition: itemData.condition,
              location: itemData.location || "",
              allowShipping: itemData.allow_shipping,
              openToOffers: itemData.open_to_offers
            });
            
            // Load existing images
            if (itemData.images) {
              setExistingImages(itemData.images);
            }
            
            // Load existing wanted items
            if (itemData.wanted_items) {
              setWantedItems(itemData.wanted_items.map(wi => wi.description));
            }
          }
        } catch (error) {
          console.error('Error loading item for editing:', error);
          toast({
            title: "Error",
            description: "Failed to load item for editing.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
  }, [isEditing, id, toast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Check if we're at the limit (8 images)
    if (images.length + files.length > 8) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 8 images.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Process each file
    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select only image files.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select images smaller than 5MB.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Add file to state
      setImages(prev => [...prev, file]);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreviews(prev => [...prev, result]);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your item.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Missing description",
        description: "Please enter a description for your item.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.categoryId) {
      toast({
        title: "Missing category",
        description: "Please select a category for your item.",
        variant: "destructive",
      });
      return;
    }

    // Validate that the category exists
    const categoryExists = categories.find(cat => cat.id === formData.categoryId);
    if (!categoryExists) {
      toast({
        title: "Invalid category",
        description: "Please select a valid category for your item.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.condition) {
      toast({
        title: "Missing condition",
        description: "Please select the condition of your item.",
        variant: "destructive",
      });
      return;
    }

    // Make images optional for now
    // if (images.length === 0) {
    //   toast({
    //     title: "No images",
    //     description: "Please upload at least one image of your item.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Ensure user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // Create a basic profile for the user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw new Error('Failed to create user profile');
        }
      }

      // Create the item
      const itemData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.categoryId,
        condition: formData.condition as 'Excellent' | 'Good' | 'Fair',
        location: formData.location.trim(),
        allow_shipping: formData.allowShipping,
        open_to_offers: formData.openToOffers,
        status: 'active' as const
      };

      console.log('Creating item with data:', itemData);

      // Test database connection and user profile
      console.log('Testing database connection...');
      const { data: testUser } = await supabase.auth.getUser();
      console.log('Current user:', testUser);
      
      const { data: testProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUser.user?.id)
        .single();
      console.log('User profile:', testProfile);

      let newItem;
      
      if (isEditing && id) {
        // Update existing item
        console.log('Updating item with data:', itemData);
        const { data: updatedItem, error: updateError } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(`Update failed: ${updateError.message}`);
        }

        console.log('Update successful:', updatedItem);
        newItem = updatedItem;
      } else {
        // Create new item
        console.log('Creating item with data:', itemData);
        const { data: directInsert, error: directError } = await supabase
          .from('items')
          .insert(itemData)
          .select()
          .single();

        if (directError) {
          console.error('Direct insert error:', directError);
          throw new Error(`Direct insert failed: ${directError.message}`);
        }

        console.log('Direct insert successful:', directInsert);
        newItem = directInsert;
      }

      // Handle existing images (for editing)
      if (isEditing) {
        // Get all existing images for this item
        const { data: allExistingImages } = await supabase
          .from('item_images')
          .select('id, image_url')
          .eq('item_id', newItem.id);
        
        if (allExistingImages) {
          // Find images that were removed (exist in database but not in existingImages state)
          const removedImages = allExistingImages.filter(dbImage => 
            !existingImages.some(stateImage => stateImage.id === dbImage.id)
          );
          
          // Delete removed images from database and storage
          for (const removedImage of removedImages) {
            try {
              console.log(`Deleting removed image: ${removedImage.id}`);
              
              const success = await itemImagesApi.deleteImage(removedImage.id);
              if (success) {
                console.log(`Successfully deleted image ${removedImage.id}`);
              } else {
                console.error(`Failed to delete image ${removedImage.id}`);
              }
              
            } catch (error) {
              console.error(`Error deleting image ${removedImage.id}:`, error);
            }
          }
          
          // Clean up any orphaned files in storage
          await itemImagesApi.cleanupOrphanedFiles(newItem.id);
        }
      }

      // Handle new images
      if (images.length > 0) {
        console.log(`Uploading ${images.length} images for item ${newItem.id}`);
        
        for (let i = 0; i < images.length; i++) {
          try {
            const isMain = (isEditing ? existingImages.length === 0 : i === 0) && i === 0; // Main if first image and no existing images
            console.log(`Uploading image ${i + 1}, isMain: ${isMain}`);
            
            const imageUrl = await itemImagesApi.uploadImage(images[i], newItem.id, isMain);
            if (imageUrl) {
              console.log(`Successfully uploaded image ${i + 1}: ${imageUrl}`);
            } else {
              console.error(`Failed to upload image ${i + 1}: No URL returned`);
            }
          } catch (error) {
            console.error(`Error uploading image ${i + 1}:`, error);
          }
        }
      }

      // Handle wanted items
      if (isEditing) {
        // For editing, we need to replace all wanted items
        // First, get existing wanted items to delete them
        const { data: existingWantedItems } = await supabase
          .from('wanted_items')
          .select('id')
          .eq('item_id', newItem.id);
        
        // Delete existing wanted items
        if (existingWantedItems && existingWantedItems.length > 0) {
          await supabase
            .from('wanted_items')
            .delete()
            .eq('item_id', newItem.id);
        }
      }
      
      // Add wanted items (for both new and edited items)
      for (const wantedItem of wantedItems) {
        await wantedItemsApi.add(newItem.id, wantedItem);
      }

      toast({
        title: "Success!",
        description: isEditing ? "Your item has been updated successfully." : "Your item has been listed for trade.",
      });

      // Navigate to the item detail page
      navigate(`/trade/${newItem.id}`);

    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to create item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {isEditing ? 'Edit Your Item' : 'List Your Item for Trade'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing 
              ? 'Update your item details and preferences'
              : 'Share details about your item and what you\'d like to trade it for'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {/* Upload placeholder */}
                <div 
                  className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Add Photo</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {images.length}/8
                      </span>
                    </>
                  )}
                </div>
                
                {/* Existing images (when editing) */}
                {existingImages.map((image, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square group">
                    <img
                      src={image.image_url}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeExistingImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-secondary text-secondary-foreground text-xs">
                        Existing
                      </Badge>
                    </div>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2">
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Main
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* New image previews */}
                {imagePreviews.map((image, index) => (
                  <div key={`new-${index}`} className="relative aspect-square group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {existingImages.length === 0 && index === 0 && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Main
                        </Badge>
                      </div>
                    )}
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
                <Input 
                  placeholder="What are you trading?" 
                  className="text-base"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <Textarea
                  placeholder="Describe your item in detail. Include brand, model, age, reason for trading, etc."
                  className="min-h-[120px] text-base"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category *
                  </label>
                  <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Condition *
                  </label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Item condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition} value={condition}>
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
                  <Button type="button" onClick={addWantedItem} variant="outline">
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
                          type="button"
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
                        type="button"
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
                <Input 
                  placeholder="City, State (for local trades)"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allow-shipping"
                  className="rounded border-border"
                  checked={formData.allowShipping}
                  onChange={(e) => handleInputChange('allowShipping', e.target.checked)}
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
                  checked={formData.openToOffers}
                  onChange={(e) => handleInputChange('openToOffers', e.target.checked)}
                />
                <label htmlFor="open-to-offers" className="text-sm text-foreground">
                  Open to other trade offers
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" size="lg" className="flex-1">
              Save as Draft
            </Button>
            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              className="flex-1"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting 
                ? (isEditing ? "Updating..." : "Creating...") 
                : (isEditing ? "Update Item" : "List Item for Trade")
              }
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}