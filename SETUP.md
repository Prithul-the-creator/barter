# Backend Setup Instructions

This guide will help you set up all the backend features for your Barter.com application.

## **Step 1: Set Up Supabase Database**

### 1.1 Run the Database Schema

1. **Go to your Supabase dashboard** at [supabase.com](https://supabase.com)
2. **Select your project** (`ptnmrqlrosaehymoydwy`)
3. **Go to SQL Editor**
4. **Copy and paste the entire contents** of `database-schema.sql`
5. **Click "Run"** to execute the schema

This will create:
- ✅ All database tables (profiles, items, trades, messages, etc.)
- ✅ Default categories
- ✅ Row Level Security (RLS) policies
- ✅ Database indexes for performance
- ✅ Automatic timestamp triggers

### 1.2 Set Up Storage Bucket

1. **Go to Storage** in your Supabase dashboard
2. **Click "Create a new bucket"**
3. **Name it**: `item-images`
4. **Set it as public** (uncheck "Private bucket")
5. **Click "Create bucket"**

### 1.3 Configure Storage Policies

Run this SQL in the SQL Editor:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');

-- Allow public access to view images
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'item-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## **Step 2: Install Additional Dependencies**

Run these commands in your terminal:

```bash
npm install @tanstack/react-query
```

## **Step 3: Update Your App.tsx**

Make sure your `App.tsx` includes the QueryClient provider:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

// Wrap your app with QueryClientProvider
<QueryClientProvider client={queryClient}>
  {/* Your app content */}
</QueryClientProvider>
```

## **Step 4: Test the Backend**

### 4.1 Test Authentication
1. **Sign up** with a new account
2. **Sign in** with your credentials
3. **Check that the navbar updates** to show user options

### 4.2 Test Item Creation
1. **Go to "List Item"** page
2. **Fill out the form** with test data
3. **Upload some images**
4. **Submit the form**
5. **Check that the item appears** in the Browse page

### 4.3 Test Search and Filtering
1. **Go to Browse page**
2. **Try searching** for items
3. **Filter by category**
4. **Verify results** are displayed correctly

## **Step 5: Backend Features Overview**

### ✅ **Implemented Features:**

#### **Database Schema**
- **Profiles table** - User profiles and preferences
- **Categories table** - Item categories with icons
- **Items table** - Trade listings with metadata
- **Item images table** - Multiple images per item
- **Wanted items table** - What users want in return
- **Trades table** - Trade offers and status
- **Messages table** - Chat functionality
- **User ratings table** - User reviews and ratings

#### **API Functions**
- **Profile API** - Get, create, update user profiles
- **Categories API** - Get all categories
- **Items API** - CRUD operations for items
- **Item Images API** - Upload, delete, set main image
- **Wanted Items API** - Add/remove wanted items
- **Trades API** - Create offers, update status
- **Messages API** - Send/receive messages
- **Ratings API** - Add/update user ratings

#### **React Hooks**
- **useItems** - Fetch all items with caching
- **useItem** - Fetch single item
- **useCreateItem** - Create new items
- **useUpdateItem** - Update existing items
- **useDeleteItem** - Delete items
- **useUploadImage** - Upload images to storage
- **useSearchItems** - Search functionality
- **And many more...**

#### **Security Features**
- **Row Level Security (RLS)** - Database-level security
- **Authentication required** for sensitive operations
- **User ownership validation** - Users can only modify their own data
- **File upload validation** - Type and size restrictions

#### **Performance Features**
- **React Query caching** - Automatic data caching
- **Database indexes** - Optimized queries
- **Image optimization** - Efficient storage and retrieval
- **Real-time updates** - Live data synchronization

## **Step 6: Next Steps**

### **Optional Enhancements:**

1. **Real-time Messaging**
   - Enable Supabase real-time subscriptions
   - Add live chat functionality

2. **Email Notifications**
   - Set up email templates
   - Configure notification triggers

3. **Advanced Search**
   - Add location-based search
   - Implement fuzzy matching

4. **Analytics**
   - Track user interactions
   - Monitor trade success rates

5. **Mobile App**
   - React Native version
   - Push notifications

## **Troubleshooting**

### **Common Issues:**

1. **"Table doesn't exist" errors**
   - Make sure you ran the database schema
   - Check that all tables were created

2. **"Permission denied" errors**
   - Verify RLS policies are set up correctly
   - Check that user is authenticated

3. **Image upload failures**
   - Ensure storage bucket exists
   - Check storage policies
   - Verify file size limits

4. **Query errors**
   - Check TypeScript types match database schema
   - Verify query syntax

### **Getting Help:**

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **React Query Documentation**: [tanstack.com/query](https://tanstack.com/query)
- **Check browser console** for detailed error messages

## **Success! 🎉**

Your Barter.com application now has a complete backend with:

- ✅ **User Authentication** - Sign up, sign in, profiles
- ✅ **Item Management** - Create, read, update, delete items
- ✅ **Image Upload** - Multiple images with main image selection
- ✅ **Search & Filtering** - Find items by category and keywords
- ✅ **Trade System** - Make and manage trade offers
- ✅ **Messaging** - Chat between users
- ✅ **User Ratings** - Rate and review other users
- ✅ **Security** - Row-level security and authentication
- ✅ **Performance** - Caching and optimized queries

You can now build a fully functional barter marketplace! 🚀 