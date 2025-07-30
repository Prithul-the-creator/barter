// Database types for Barter.com
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category_id: string | null
          condition: 'Excellent' | 'Good' | 'Fair' | null
          location: string | null
          allow_shipping: boolean
          open_to_offers: boolean
          status: 'active' | 'traded' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category_id?: string | null
          condition?: 'Excellent' | 'Good' | 'Fair' | null
          location?: string | null
          allow_shipping?: boolean
          open_to_offers?: boolean
          status?: 'active' | 'traded' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category_id?: string | null
          condition?: 'Excellent' | 'Good' | 'Fair' | null
          location?: string | null
          allow_shipping?: boolean
          open_to_offers?: boolean
          status?: 'active' | 'traded' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      item_images: {
        Row: {
          id: string
          item_id: string
          image_url: string
          is_main: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          image_url: string
          is_main?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          image_url?: string
          is_main?: boolean
          order_index?: number
          created_at?: string
        }
      }
      wanted_items: {
        Row: {
          id: string
          item_id: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          description?: string
          created_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          item_id: string
          offered_by: string
          offered_item_id: string | null
          offered_item_description: string | null
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          offered_by: string
          offered_item_id?: string | null
          offered_item_description?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          offered_by?: string
          offered_item_id?: string | null
          offered_item_description?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          item_id: string
          initiator_id: string
          receiver_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          initiator_id: string
          receiver_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          initiator_id?: string
          receiver_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          item_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          created_at?: string
        }
      }
      user_ratings: {
        Row: {
          id: string
          rater_id: string
          rated_user_id: string
          trade_id: string | null
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rater_id: string
          rated_user_id: string
          trade_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rater_id?: string
          rated_user_id?: string
          trade_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Item = Database['public']['Tables']['items']['Row']
export type ItemImage = Database['public']['Tables']['item_images']['Row']
export type WantedItem = Database['public']['Tables']['wanted_items']['Row']
export type Trade = Database['public']['Tables']['trades']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
export type UserRating = Database['public']['Tables']['user_ratings']['Row']

// Extended types with joins
export interface ItemWithDetails extends Item {
  profile: Profile
  category: Category
  images: ItemImage[]
  wanted_items: WantedItem[]
}

export interface TradeWithDetails extends Trade {
  item: ItemWithDetails
  offered_item: ItemWithDetails | null
  offered_by_profile: Profile
  messages: Message[]
}

export interface ConversationWithDetails extends Conversation {
  item: ItemWithDetails
  initiator: Profile
  receiver: Profile
  messages: MessageWithDetails[]
}

export interface MessageWithDetails extends Message {
  sender: Profile
  receiver: Profile
  conversation: Conversation | null
} 