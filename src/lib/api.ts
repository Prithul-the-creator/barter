import { supabase } from './supabase'
import type { 
  Item, 
  ItemWithDetails, 
  Trade, 
  TradeWithDetails, 
  Message, 
  MessageWithDetails,
  Profile,
  Category,
  WantedItem,
  UserRating,
  Conversation,
  ConversationWithDetails,
  Offer,
  OfferWithDetails,
  OfferImage,
  TradeMeeting
} from '@/types/database'

// ============================================================================
// PROFILE API
// ============================================================================

export const profileApi = {
  // Get current user's profile
  getCurrentProfile: async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  },

  // Create or update profile
  upsertProfile: async (profile: Partial<Profile>): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profile })
      .select()
      .single()

    if (error) {
      console.error('Error upserting profile:', error)
      return null
    }

    return data
  },

  // Get profile by ID
  getProfile: async (id: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  }
}

// ============================================================================
// CHAT API
// ============================================================================

export const favoritesApi = {
  // Add item to favorites
  add: async (itemId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        item_id: itemId
      })

    if (error) {
      console.error('Error adding to favorites:', error)
      return false
    }

    return true
  },

  // Remove item from favorites
  remove: async (itemId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', itemId)

    if (error) {
      console.error('Error removing from favorites:', error)
      return false
    }

    return true
  },

  // Check if item is favorited by current user
  isFavorited: async (itemId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single()

    if (error) {
      return false
    }

    return !!data
  },

  // Get all favorited items for current user
  getFavorites: async (): Promise<ItemWithDetails[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        item_id,
        items (
          *,
          profile:profiles(*),
          category:categories(*),
          images:item_images(*),
          wanted_items(*)
        )
      `)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching favorites:', error)
      return []
    }

    return (favorites || []).map(fav => fav.items as unknown as ItemWithDetails)
  }
}

export const chatApi = {
  // Get or create conversation for an item
  getOrCreateConversation: async (itemId: string, receiverId: string): Promise<ConversationWithDetails | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('No authenticated user found in getOrCreateConversation')
      return null
    }

    console.log('getOrCreateConversation called with:', { itemId, receiverId, userId: user.id })

    // Prevent creating conversation with yourself
    if (user.id === receiverId) {
      console.error('Cannot create conversation with yourself')
      return null
    }

    // Ensure both users have profiles before creating conversation
    try {
      // Check if current user has a profile, create if not
      const { data: currentUserProfile, error: currentUserError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (currentUserError && currentUserError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating profile for current user:', user.id)
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || null
          })

        if (createProfileError) {
          console.error('Error creating profile for current user:', createProfileError)
          return null
        }
      }

      // Check if receiver has a profile, create if not
      const { data: receiverProfile, error: receiverError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', receiverId)
        .single()

      if (receiverError && receiverError.code === 'PGRST116') {
        // Receiver profile doesn't exist, create it
        console.log('Creating profile for receiver:', receiverId)
        const { error: createReceiverProfileError } = await supabase
          .from('profiles')
          .insert({
            id: receiverId,
            username: 'user_' + receiverId.substring(0, 8),
            full_name: 'User',
            avatar_url: null
          })

        if (createReceiverProfileError) {
          console.error('Error creating profile for receiver:', createReceiverProfileError)
          return null
        }
      }
    } catch (error) {
      console.error('Error ensuring profiles exist:', error)
      return null
    }

    // Check if conversation already exists - simplified query
    const { data: existingConversation, error: existingError } = await supabase
      .from('conversations')
      .select('*')
      .eq('item_id', itemId)
      .eq('initiator_id', user.id)
      .eq('receiver_id', receiverId)
      .single()

    if (existingError) {
      console.log('No existing conversation found:', existingError.message)
    } else if (existingConversation) {
      console.log('Found existing conversation:', existingConversation.id)
      // Fetch full details separately
      return await chatApi.getConversation(existingConversation.id)
    }

    console.log('Creating new conversation...')
    // Create new conversation - simplified insert
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        item_id: itemId,
        initiator_id: user.id,
        receiver_id: receiverId
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    console.log('Successfully created conversation:', newConversation.id)
    // Fetch full details separately
    return await chatApi.getConversation(newConversation.id)
  },

  // Get all conversations for current user
  getConversations: async (): Promise<ConversationWithDetails[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get basic conversation data
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    if (!conversations) return []

    // Fetch full details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        return await chatApi.getConversation(conv.id)
      })
    )

    return conversationsWithDetails.filter(Boolean) as ConversationWithDetails[]
  },

  // Get conversation by ID
  getConversation: async (conversationId: string): Promise<ConversationWithDetails | null> => {
    // First get the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (convError) {
      console.error('Error fetching conversation:', convError)
      return null
    }

    // Get the item details
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select(`
        *,
        profile:profiles(*),
        category:categories(*),
        images:item_images(*),
        wanted_items(*)
      `)
      .eq('id', conversation.item_id)
      .single()

    if (itemError) {
      console.error('Error fetching item:', itemError)
      return null
    }

    // Get initiator profile
    const { data: initiator, error: initiatorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', conversation.initiator_id)
      .single()

    if (initiatorError || !initiator) {
      console.error('Error fetching initiator:', initiatorError)
      return null
    }

    // Get receiver profile
    const { data: receiver, error: receiverError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', conversation.receiver_id)
      .single()

    if (receiverError || !receiver) {
      console.error('Error fetching receiver:', receiverError)
      return null
    }

    // Get messages without embedding profiles (to avoid foreign key ambiguity)
    const { data: rawMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return null
    }

    // Manually construct MessageWithDetails objects
    const messages: MessageWithDetails[] = (rawMessages || []).map(msg => {
      // Determine sender and receiver based on the actual sender_id and receiver_id
      const messageSender = msg.sender_id === initiator.id ? initiator : receiver;
      const messageReceiver = msg.receiver_id === initiator.id ? initiator : receiver;
      
      // Safety check to ensure we have valid sender and receiver
      if (!messageSender || !messageReceiver) {
        console.error('Invalid sender or receiver for message:', msg.id);
        return null;
      }
      
      return {
        ...msg,
        sender: messageSender,
        receiver: messageReceiver,
        conversation: conversation
      };
    }).filter(Boolean) as MessageWithDetails[]

    // Construct the full conversation object
    const conversationWithDetails: ConversationWithDetails = {
      ...conversation,
      item,
      initiator,
      receiver,
      messages: messages
    }

    return conversationWithDetails
  },

  // Send message
  sendMessage: async (conversationId: string, content: string): Promise<MessageWithDetails | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get conversation to determine receiver
    const conversation = await chatApi.getConversation(conversationId)
    if (!conversation) return null

    const receiverId = conversation.initiator_id === user.id 
      ? conversation.receiver_id 
      : conversation.initiator_id

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return null
    }

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Get the conversation to get sender/receiver details
    const conversationDetails = await chatApi.getConversation(conversationId)
    if (!conversationDetails) return null

    // Construct MessageWithDetails manually
    const messageWithDetails: MessageWithDetails = {
      ...data,
      sender: data.sender_id === conversationDetails.initiator.id ? conversationDetails.initiator : conversationDetails.receiver,
      receiver: data.receiver_id === conversationDetails.initiator.id ? conversationDetails.initiator : conversationDetails.receiver,
      conversation: conversationDetails
    }

    return messageWithDetails
  },

  // Mark messages as read
  markAsRead: async (conversationId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
  }
}

// ============================================================================
// CATEGORIES API
// ============================================================================

export const categoriesApi = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return data || []
  },

  // Get category by ID
  getById: async (id: string): Promise<Category | null> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching category:', error)
      return null
    }

    return data
  }
}

// ============================================================================
// ITEMS API
// ============================================================================

export const itemsApi = {
  // Get all active items with details
  getAll: async (): Promise<ItemWithDetails[]> => {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        profile:profiles(*),
        category:categories(*),
        images:item_images(*),
        wanted_items(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
      return []
    }

    return data || []
  },

  // Get items by category
  getByCategory: async (categoryId: string): Promise<ItemWithDetails[]> => {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        profile:profiles(*),
        category:categories(*),
        images:item_images(*),
        wanted_items(*)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items by category:', error)
      return []
    }

    return data || []
  },

  // Get items by user
  getByUser: async (userId: string): Promise<ItemWithDetails[]> => {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        profile:profiles(*),
        category:categories(*),
        images:item_images(*),
        wanted_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user items:', error)
      return []
    }

    return data || []
  },

  // Get single item with details
  getById: async (id: string): Promise<ItemWithDetails | null> => {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        profile:profiles(*),
        category:categories(*),
        images:item_images(*),
        wanted_items(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching item:', error)
      return null
    }

    return data
  },

  // Create new item
  create: async (itemData: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item | null> => {
    console.log('API: Creating item with data:', itemData);
    
    const { data, error } = await supabase
      .from('items')
      .insert(itemData)
      .select()
      .single()

    if (error) {
      console.error('Error creating item:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null
    }

    console.log('API: Item created successfully:', data);
    return data
  },

  // Update item
  update: async (id: string, updates: Partial<Item>): Promise<Item | null> => {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating item:', error)
      return null
    }

    return data
  },

  // Delete item
  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting item:', error)
      return false
    }

    return true
  },

  // Search items
  search: async (query: string): Promise<ItemWithDetails[]> => {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        profile:profiles(*),
        category:categories(*),
        images:item_images(*),
        wanted_items(*)
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching items:', error)
      return []
    }

    return data || []
  }
}

// ============================================================================
// ITEM IMAGES API
// ============================================================================

export const itemImagesApi = {
  // Upload image to Supabase Storage
  uploadImage: async (file: File, itemId: string, isMain: boolean = false): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('No authenticated user found')
      return null
    }

    console.log('Starting image upload for user:', user.id, 'item:', itemId)

    const fileExt = file.name.split('.').pop()
    const fileName = `${itemId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(fileName, file)

    if (error) {
      console.error('Error uploading image:', error)
      console.error('Upload error details:', {
        message: error.message
      })
      return null
    }

    console.log('File uploaded successfully to storage:', fileName)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('item-images')
      .getPublicUrl(fileName)

    // Get the next order_index for this item
    const { data: existingImages } = await supabase
      .from('item_images')
      .select('order_index')
      .eq('item_id', itemId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existingImages && existingImages.length > 0 
      ? existingImages[0].order_index + 1 
      : (isMain ? 0 : 1);

    // Save to database
    const { error: dbError } = await supabase
      .from('item_images')
      .insert({
        item_id: itemId,
        image_url: urlData.publicUrl,
        is_main: isMain,
        order_index: nextOrderIndex
      })

    if (dbError) {
      console.error('Error saving image to database:', dbError)
      return null
    }

    return urlData.publicUrl
  },

  // Delete image
  deleteImage: async (imageId: string): Promise<boolean> => {
    try {
      // First get the image details to delete from storage
      const { data: image, error: fetchError } = await supabase
        .from('item_images')
        .select('image_url')
        .eq('id', imageId)
        .single()

      if (fetchError) {
        console.error('Error fetching image details:', fetchError)
        return false
      }

      if (image && image.image_url) {
        console.log('Deleting image from storage:', image.image_url)
        
        // Extract file path from URL
        // URL format: https://ptnmrqlrosaehymoydwy.supabase.co/storage/v1/object/public/item-images/itemId/filename.ext
        const urlParts = image.image_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const itemId = urlParts[urlParts.length - 2]
        const filePath = `${itemId}/${fileName}`
        
        console.log('URL parts:', urlParts)
        console.log('Extracted fileName:', fileName)
        console.log('Extracted itemId:', itemId)
        console.log('Final file path:', filePath)

        // Delete from storage
        console.log('Attempting to delete from storage with path:', filePath)
        const { error: storageError } = await supabase.storage
          .from('item-images')
          .remove([filePath])

        if (storageError) {
          console.error('Error deleting from storage:', storageError)
          console.error('Storage error details:', {
            message: storageError.message
          })
          
          // Try alternative approach - delete by listing files first
          console.log('Trying alternative deletion approach...')
          const { data: files, error: listError } = await supabase.storage
            .from('item-images')
            .list(itemId)
          
          if (listError) {
            console.error('Error listing files:', listError)
          } else {
            console.log('Files in folder:', files)
            const targetFile = files?.find(f => f.name === fileName)
            if (targetFile) {
              console.log('Found target file:', targetFile)
              const { error: altDeleteError } = await supabase.storage
                .from('item-images')
                .remove([`${itemId}/${targetFile.name}`])
              
              if (altDeleteError) {
                console.error('Alternative deletion also failed:', altDeleteError)
              } else {
                console.log('Alternative deletion successful')
              }
            }
          }
        } else {
          console.log('Successfully deleted from storage:', filePath)
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('item_images')
        .delete()
        .eq('id', imageId)

      if (dbError) {
        console.error('Error deleting image from database:', dbError)
        return false
      }

      console.log('Successfully deleted image from database:', imageId)
      return true
      
    } catch (error) {
      console.error('Unexpected error in deleteImage:', error)
      return false
    }
  },

  // Clean up orphaned files in storage (utility function)
  cleanupOrphanedFiles: async (itemId: string): Promise<void> => {
    try {
      console.log('Cleaning up orphaned files for item:', itemId)
      
      // Get all files in the item's folder
      const { data: files, error: listError } = await supabase.storage
        .from('item-images')
        .list(itemId)
      
      if (listError) {
        console.error('Error listing files:', listError)
        return
      }
      
      if (!files || files.length === 0) {
        console.log('No files found for item:', itemId)
        return
      }
      
      // Get all image records for this item
      const { data: dbImages } = await supabase
        .from('item_images')
        .select('image_url')
        .eq('item_id', itemId)
      
      if (!dbImages) {
        console.log('No database records found for item:', itemId)
        return
      }
      
      // Find orphaned files (exist in storage but not in database)
      const dbFileNames = dbImages.map(img => {
        const urlParts = img.image_url.split('/')
        return urlParts[urlParts.length - 1]
      })
      
      const orphanedFiles = files.filter(file => !dbFileNames.includes(file.name))
      
      if (orphanedFiles.length > 0) {
        console.log('Found orphaned files:', orphanedFiles.map(f => f.name))
        
        // Delete orphaned files
        const filePaths = orphanedFiles.map(file => `${itemId}/${file.name}`)
        const { error: deleteError } = await supabase.storage
          .from('item-images')
          .remove(filePaths)
        
        if (deleteError) {
          console.error('Error deleting orphaned files:', deleteError)
        } else {
          console.log('Successfully deleted orphaned files')
        }
      } else {
        console.log('No orphaned files found')
      }
      
    } catch (error) {
      console.error('Error in cleanupOrphanedFiles:', error)
    }
  },

  // Set main image
  setMainImage: async (imageId: string): Promise<boolean> => {
    // First, get the item_id for this image
    const { data: image } = await supabase
      .from('item_images')
      .select('item_id')
      .eq('id', imageId)
      .single()

    if (!image) return false

    // Reset all images for this item to not main
    await supabase
      .from('item_images')
      .update({ is_main: false })
      .eq('item_id', image.item_id)

    // Set this image as main
    const { error } = await supabase
      .from('item_images')
      .update({ is_main: true })
      .eq('id', imageId)

    if (error) {
      console.error('Error setting main image:', error)
      return false
    }

    return true
  }
}

// ============================================================================
// WANTED ITEMS API
// ============================================================================

export const wantedItemsApi = {
  // Add wanted item
  add: async (itemId: string, description: string): Promise<WantedItem | null> => {
    const { data, error } = await supabase
      .from('wanted_items')
      .insert({
        item_id: itemId,
        description
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding wanted item:', error)
      return null
    }

    return data
  },

  // Remove wanted item
  remove: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('wanted_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error removing wanted item:', error)
      return false
    }

    return true
  }
}

// ============================================================================
// TRADES API
// ============================================================================

export const tradesApi = {
  // Get all trades for current user
  getMyTrades: async (): Promise<TradeWithDetails[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        item:items(
          *,
          profile:profiles(*),
          category:categories(*),
          images:item_images(*),
          wanted_items(*)
        ),
        offered_item:items!trades_offered_item_id_fkey(
          *,
          profile:profiles(*),
          category:categories(*),
          images:item_images(*),
          wanted_items(*)
        ),
        offered_by_profile:profiles!trades_offered_by_fkey(*),
        messages(*)
      `)
      .or(`offered_by.eq.${user.id},item.user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching trades:', error)
      return []
    }

    return data || []
  },

  // Create trade offer
  createOffer: async (tradeData: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Promise<Trade | null> => {
    const { data, error } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single()

    if (error) {
      console.error('Error creating trade offer:', error)
      return null
    }

    return data
  },

  // Update trade status
  updateStatus: async (tradeId: string, status: Trade['status']): Promise<Trade | null> => {
    const { data, error } = await supabase
      .from('trades')
      .update({ status })
      .eq('id', tradeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating trade status:', error)
      return null
    }

    return data
  },

  // Get trade by ID
  getById: async (id: string): Promise<TradeWithDetails | null> => {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        item:items(
          *,
          profile:profiles(*),
          category:categories(*),
          images:item_images(*),
          wanted_items(*)
        ),
        offered_item:items!trades_offered_item_id_fkey(
          *,
          profile:profiles(*),
          category:categories(*),
          images:item_images(*),
          wanted_items(*)
        ),
        offered_by_profile:profiles!trades_offered_by_fkey(*),
        messages(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching trade:', error)
      return null
    }

    return data
  }
}

// ============================================================================
// MESSAGES API
// ============================================================================

export const messagesApi = {
  // Get messages for a trade
  getByTrade: async (tradeId: string): Promise<MessageWithDetails[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*),
        trade:trades(*)
      `)
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data || []
  },

  // Get conversations for current user
  getConversations: async (): Promise<MessageWithDetails[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*),
        trade:trades(*)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    return data || []
  },

  // Send message
  send: async (messageData: Omit<Message, 'id' | 'created_at'>): Promise<Message | null> => {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return null
    }

    return data
  },

  // Mark message as read
  markAsRead: async (messageId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)

    if (error) {
      console.error('Error marking message as read:', error)
      return false
    }

    return true
  }
}

// ============================================================================
// RATINGS API
// ============================================================================

export const ratingsApi = {
  // Get user ratings
  getUserRatings: async (userId: string): Promise<UserRating[]> => {
    const { data, error } = await supabase
      .from('user_ratings')
      .select('*')
      .eq('rated_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user ratings:', error)
      return []
    }

    return data || []
  },

  // Add rating
  addRating: async (ratingData: Omit<UserRating, 'id' | 'created_at'>): Promise<UserRating | null> => {
    const { data, error } = await supabase
      .from('user_ratings')
      .insert(ratingData)
      .select()
      .single()

    if (error) {
      console.error('Error adding rating:', error)
      return null
    }

    return data
  },

  // Update rating
  updateRating: async (ratingId: string, updates: Partial<UserRating>): Promise<UserRating | null> => {
    const { data, error } = await supabase
      .from('user_ratings')
      .update(updates)
      .eq('id', ratingId)
      .select()
      .single()

    if (error) {
      console.error('Error updating rating:', error)
      return null
    }

    return data
  }
} 

// Offers API
export const offersApi = {
  // Create a new offer
  async create(offerData: {
    itemId: string;
    sellerId: string;
    offerMessage?: string;
    offeredItems?: string[];
  }): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('offers')
        .insert({
          item_id: offerData.itemId,
          buyer_id: user.id,
          seller_id: offerData.sellerId,
          offer_message: offerData.offerMessage || null,
          offered_items: offerData.offeredItems || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating offer:', error);
      return null;
    }
  },

  // Get offers for a specific item
  async getOffersForItem(itemId: string): Promise<OfferWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          item:items(*),
          buyer:profiles!offers_buyer_id_fkey(*),
          seller:profiles!offers_seller_id_fkey(*)
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching offers:', error);
      return [];
    }
  },

  // Get offers sent by current user
  async getSentOffers(): Promise<OfferWithDetails[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          item:items(*),
          buyer:profiles!offers_buyer_id_fkey(*),
          seller:profiles!offers_seller_id_fkey(*),
          images:offer_images(*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sent offers:', error);
      return [];
    }
  },

  // Get offers received by current user (pending and accepted offers)
  async getReceivedOffers(): Promise<OfferWithDetails[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          item:items(*),
          buyer:profiles!offers_buyer_id_fkey(*),
          seller:profiles!offers_seller_id_fkey(*),
          images:offer_images(*)
        `)
        .eq('seller_id', user.id)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching received offers:', error);
      return [];
    }
  },

  // Update offer status (accept/decline/withdraw)
  async updateStatus(offerId: string, status: 'accepted' | 'declined' | 'withdrawn'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log(`Attempting to update offer ${offerId} to status ${status} for user ${user.id}`);

      const { data, error } = await supabase
        .from('offers')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .select();

      if (error) {
        console.error('Error updating offer status:', error);
        throw error;
      }

      console.log('Update result:', data);
      return true;
    } catch (error) {
      console.error('Error updating offer status:', error);
      return false;
    }
  },

  // Check if user has already made an offer on this item
  async hasUserOffered(itemId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('offers')
        .select('id')
        .eq('item_id', itemId)
        .eq('buyer_id', user.id)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking if user has offered:', error);
      return false;
    }
  }
}; 

// Offer Images API
export const offerImagesApi = {
  // Upload image for an offer
  async uploadImage(offerId: string, file: File): Promise<boolean> {
    try {
      console.log('Starting offer image upload for offerId:', offerId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      console.log('User authenticated:', user.id);

      // Skip bucket existence check since we know it exists
      console.log('Skipping bucket existence check - proceeding with upload');

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `${offerId}/${fileName}`;
      console.log('Generated file path:', filePath);

      // Upload to storage
      console.log('Uploading file to storage...');
      const { error: uploadError } = await supabase.storage
        .from('offer-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading offer image:', uploadError);
        return false;
      }
      console.log('File uploaded to storage successfully');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('offer-images')
        .getPublicUrl(filePath);
      console.log('Public URL generated:', publicUrl);

      // Check if offer_images table exists
      console.log('Checking if offer_images table exists...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('offer_images')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('Error checking offer_images table:', tableError);
        console.error('This suggests the table does not exist or RLS policies are blocking access');
        return false;
      }
      console.log('offer_images table is accessible');

      // Get current order index
      const { data: existingImages, error: orderError } = await supabase
        .from('offer_images')
        .select('order_index')
        .eq('offer_id', offerId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (orderError) {
        console.error('Error getting existing images:', orderError);
        return false;
      }

      const orderIndex = existingImages && existingImages.length > 0 
        ? existingImages[0].order_index + 1 
        : 0;
      console.log('Order index:', orderIndex);

      // Save to database
      console.log('Saving image record to database...');
      const { error: dbError } = await supabase
        .from('offer_images')
        .insert({
          offer_id: offerId,
          image_url: publicUrl,
          filename: fileName,
          order_index: orderIndex,
        });

      if (dbError) {
        console.error('Error saving offer image to database:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('offer-images')
          .remove([filePath]);
        return false;
      }

      console.log('Offer image uploaded and saved successfully');
      return true;
    } catch (error) {
      console.error('Error uploading offer image:', error);
      return false;
    }
  },

  // Get images for an offer
  async getImages(offerId: string): Promise<OfferImage[]> {
    try {
      const { data, error } = await supabase
        .from('offer_images')
        .select('*')
        .eq('offer_id', offerId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching offer images:', error);
      return [];
    }
  },

  // Delete image from offer
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      // Get image details first
      const { data: image, error: fetchError } = await supabase
        .from('offer_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        console.error('Error fetching image details:', fetchError);
        return false;
      }

      if (!image) {
        console.error('Image not found:', imageId);
        return false;
      }

      // Extract file path from URL
      const urlParts = image.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const offerId = image.offer_id;
      const filePath = `${offerId}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('offer-images')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('offer_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('Error deleting image from database:', dbError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting offer image:', error);
      return false;
    }
  }
};

// Trade Meetings API
export const tradeMeetingsApi = {
  // Create a new trade meeting
  async create(meetingData: {
    offerId: string;
    buyerId: string;
    sellerId: string;
    buyerLat: number;
    buyerLng: number;
    sellerLat: number;
    sellerLng: number;
    distanceKm: number;
  }): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trade_meetings')
        .insert({
          offer_id: meetingData.offerId,
          buyer_id: meetingData.buyerId,
          seller_id: meetingData.sellerId,
          buyer_lat: meetingData.buyerLat,
          buyer_lng: meetingData.buyerLng,
          seller_lat: meetingData.sellerLat,
          seller_lng: meetingData.sellerLng,
          distance_km: meetingData.distanceKm,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating trade meeting:', error);
      return null;
    }
  },

  // Get trade meeting by offer ID
  async getByOfferId(offerId: string): Promise<TradeMeeting | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trade_meetings')
        .select('*')
        .eq('offer_id', offerId)
        .single();

      if (error) throw error;
      return data;
      } catch (error) {
        console.error('Error getting trade meeting:', error);
        return null;
      }
    },

  // Update trade meeting
  async update(meetingId: string, updates: {
    meetingLocation?: string;
    meetingAddress?: string;
    meetingLat?: number;
    meetingLng?: number;
    meetingTime?: string;
    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  }): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('trade_meetings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating trade meeting:', error);
      return false;
    }
  },

  // Get user's trade meetings
  async getUserMeetings(): Promise<TradeMeeting[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trade_meetings')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user meetings:', error);
      return [];
    }
  }
};