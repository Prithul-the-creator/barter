-- Barter.com Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  condition TEXT CHECK (condition IN ('Excellent', 'Good', 'Fair')),
  location TEXT,
  allow_shipping BOOLEAN DEFAULT false,
  open_to_offers BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'traded', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item images table
CREATE TABLE IF NOT EXISTS public.item_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wanted items table (what users want in return)
CREATE TABLE IF NOT EXISTS public.wanted_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades table (trade offers)
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  offered_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  offered_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  offered_item_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table for direct messaging
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  initiator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, initiator_id, receiver_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User ratings table
CREATE TABLE IF NOT EXISTS public.user_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rated_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rater_id, rated_user_id, trade_id)
);

-- Insert default categories
INSERT INTO public.categories (name, description, icon) VALUES
  ('Electronics', 'Computers, phones, gadgets, and electronic devices', 'laptop'),
  ('Sports & Outdoors', 'Sports equipment, outdoor gear, and fitness items', 'dumbbell'),
  ('Fashion', 'Clothing, shoes, accessories, and jewelry', 'shirt'),
  ('Books & Media', 'Books, movies, music, and educational materials', 'book'),
  ('Home & Garden', 'Furniture, decor, tools, and garden items', 'home'),
  ('Automotive', 'Car parts, accessories, and automotive tools', 'car'),
  ('Collectibles', 'Trading cards, figurines, and collectible items', 'star'),
  ('Other', 'Miscellaneous items that do not fit other categories', 'package')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_trades_item_id ON public.trades(item_id);
CREATE INDEX IF NOT EXISTS idx_trades_offered_by ON public.trades(offered_by);
CREATE INDEX IF NOT EXISTS idx_conversations_item_id ON public.conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(initiator_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wanted_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Items policies
CREATE POLICY "Users can view all active items" ON public.items FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view own items" ON public.items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.items FOR DELETE USING (auth.uid() = user_id);

-- Item images policies
CREATE POLICY "Users can view item images" ON public.item_images FOR SELECT USING (true);
CREATE POLICY "Users can insert item images" ON public.item_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update item images" ON public.item_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete item images" ON public.item_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
);

-- Wanted items policies
CREATE POLICY "Users can view wanted items" ON public.wanted_items FOR SELECT USING (true);
CREATE POLICY "Users can insert wanted items" ON public.wanted_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update wanted items" ON public.wanted_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete wanted items" ON public.wanted_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
);

-- Conversations policies
CREATE POLICY "Users can view conversations they're part of" ON public.conversations FOR SELECT USING (
  auth.uid() = initiator_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can insert conversations" ON public.conversations FOR INSERT WITH CHECK (
  auth.uid() = initiator_id
);
CREATE POLICY "Users can update conversations they're part of" ON public.conversations FOR UPDATE USING (
  auth.uid() = initiator_id OR auth.uid() = receiver_id
);

-- Messages policies
CREATE POLICY "Users can view messages in conversations they're part of" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (initiator_id = auth.uid() OR receiver_id = auth.uid())
  )
);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);
CREATE POLICY "Users can update messages they sent" ON public.messages FOR UPDATE USING (
  auth.uid() = sender_id
);

-- Trades policies
CREATE POLICY "Users can view trades they're involved in" ON public.trades FOR SELECT USING (
  auth.uid() = offered_by OR 
  EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = offered_by);
CREATE POLICY "Users can update trades they're involved in" ON public.trades FOR UPDATE USING (
  auth.uid() = offered_by OR 
  EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view messages they're involved in" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- User ratings policies
CREATE POLICY "Users can view all ratings" ON public.user_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert ratings" ON public.user_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "Users can update own ratings" ON public.user_ratings FOR UPDATE USING (auth.uid() = rater_id);

-- Offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offer_message TEXT,
  offered_items TEXT[], -- Array of item descriptions the buyer is offering
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade meetings table for coordinating meetups
CREATE TABLE IF NOT EXISTS public.trade_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meeting_location TEXT,
  meeting_address TEXT,
  meeting_lat DECIMAL(10, 8),
  meeting_lng DECIMAL(11, 8),
  meeting_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  buyer_lat DECIMAL(10, 8),
  buyer_lng DECIMAL(11, 8),
  seller_lat DECIMAL(10, 8),
  seller_lng DECIMAL(11, 8),
  distance_km DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offer images table
CREATE TABLE IF NOT EXISTS public.offer_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Offers policies
CREATE POLICY "Users can view offers they sent or received" ON public.offers 
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert their own offers" ON public.offers 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update offers they sent or received" ON public.offers 
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can delete offers they sent" ON public.offers 
  FOR DELETE USING (auth.uid() = buyer_id);

-- Enable RLS on trade_meetings
ALTER TABLE public.trade_meetings ENABLE ROW LEVEL SECURITY;

-- Trade meetings policies
CREATE POLICY "Users can view trade meetings they're involved in" ON public.trade_meetings 
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert trade meetings they're involved in" ON public.trade_meetings 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update trade meetings they're involved in" ON public.trade_meetings 
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can delete trade meetings they're involved in" ON public.trade_meetings 
  FOR DELETE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Enable RLS on offer_images
ALTER TABLE public.offer_images ENABLE ROW LEVEL SECURITY;

-- Offer images policies
CREATE POLICY "Users can view offer images for offers they sent or received" ON public.offer_images 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.offers 
      WHERE id = offer_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert offer images for their own offers" ON public.offer_images 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.offers 
      WHERE id = offer_id 
      AND buyer_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete offer images for their own offers" ON public.offer_images 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.offers 
      WHERE id = offer_id 
      AND buyer_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_offers_item_id ON public.offers(item_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON public.offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller_id ON public.offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
CREATE INDEX IF NOT EXISTS idx_trade_meetings_offer_id ON public.trade_meetings(offer_id);
CREATE INDEX IF NOT EXISTS idx_trade_meetings_buyer_id ON public.trade_meetings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trade_meetings_seller_id ON public.trade_meetings(seller_id);
CREATE INDEX IF NOT EXISTS idx_trade_meetings_status ON public.trade_meetings(status);
CREATE INDEX IF NOT EXISTS idx_offer_images_offer_id ON public.offer_images(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_images_order_index ON public.offer_images(order_index);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 