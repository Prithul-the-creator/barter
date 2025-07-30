import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itemsApi, itemImagesApi, wantedItemsApi } from '@/lib/api'
import type { ItemWithDetails, Item } from '@/types/database'
import { useToast } from '@/hooks/use-toast'

// Query keys
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: string) => [...itemKeys.lists(), { filters }] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
  user: (userId: string) => [...itemKeys.all, 'user', userId] as const,
  category: (categoryId: string) => [...itemKeys.all, 'category', categoryId] as const,
  search: (query: string) => [...itemKeys.all, 'search', query] as const,
}

// Hook for fetching all items
export const useItems = () => {
  return useQuery({
    queryKey: itemKeys.lists(),
    queryFn: itemsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching items by category
export const useItemsByCategory = (categoryId: string) => {
  return useQuery({
    queryKey: itemKeys.category(categoryId),
    queryFn: () => itemsApi.getByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for fetching items by user
export const useItemsByUser = (userId: string) => {
  return useQuery({
    queryKey: itemKeys.user(userId),
    queryFn: () => itemsApi.getByUser(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for fetching single item
export const useItem = (id: string) => {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for searching items
export const useSearchItems = (query: string) => {
  return useQuery({
    queryKey: itemKeys.search(query),
    queryFn: () => itemsApi.search(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  })
}

// Hook for creating items
export const useCreateItem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: itemsApi.create,
    onSuccess: (newItem) => {
      // Invalidate and refetch items lists
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      
      // Add the new item to the cache
      queryClient.setQueryData(
        itemKeys.detail(newItem.id),
        newItem
      )

      toast({
        title: "Item created successfully!",
        description: "Your item is now live and ready for trades.",
      })
    },
    onError: (error) => {
      console.error('Error creating item:', error)
      toast({
        title: "Error creating item",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      })
    },
  })
}

// Hook for updating items
export const useUpdateItem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Item> }) =>
      itemsApi.update(id, updates),
    onSuccess: (updatedItem, { id }) => {
      // Update the item in cache
      queryClient.setQueryData(
        itemKeys.detail(id),
        updatedItem
      )

      // Invalidate lists to refresh them
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })

      toast({
        title: "Item updated successfully!",
        description: "Your changes have been saved.",
      })
    },
    onError: (error) => {
      console.error('Error updating item:', error)
      toast({
        title: "Error updating item",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      })
    },
  })
}

// Hook for deleting items
export const useDeleteItem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: itemsApi.delete,
    onSuccess: (_, itemId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: itemKeys.detail(itemId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })

      toast({
        title: "Item deleted successfully!",
        description: "Your item has been removed from the platform.",
      })
    },
    onError: (error) => {
      console.error('Error deleting item:', error)
      toast({
        title: "Error deleting item",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      })
    },
  })
}

// Hook for uploading images
export const useUploadImage = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ file, itemId, isMain }: { file: File; itemId: string; isMain?: boolean }) =>
      itemImagesApi.uploadImage(file, itemId, isMain),
    onSuccess: (imageUrl, { itemId }) => {
      // Invalidate the item to refresh its images
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) })

      toast({
        title: "Image uploaded successfully!",
        description: "Your image has been added to the item.",
      })
    },
    onError: (error) => {
      console.error('Error uploading image:', error)
      toast({
        title: "Error uploading image",
        description: "Please try again. Make sure the file is an image and under 5MB.",
        variant: "destructive",
      })
    },
  })
}

// Hook for deleting images
export const useDeleteImage = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: itemImagesApi.deleteImage,
    onSuccess: (_, imageId) => {
      // Invalidate all item queries to refresh images
      queryClient.invalidateQueries({ queryKey: itemKeys.details() })

      toast({
        title: "Image deleted successfully!",
        description: "The image has been removed from your item.",
      })
    },
    onError: (error) => {
      console.error('Error deleting image:', error)
      toast({
        title: "Error deleting image",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      })
    },
  })
}

// Hook for setting main image
export const useSetMainImage = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: itemImagesApi.setMainImage,
    onSuccess: (_, imageId) => {
      // Invalidate all item queries to refresh images
      queryClient.invalidateQueries({ queryKey: itemKeys.details() })

      toast({
        title: "Main image updated!",
        description: "This image is now the primary image for your item.",
      })
    },
    onError: (error) => {
      console.error('Error setting main image:', error)
      toast({
        title: "Error updating main image",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      })
    },
  })
}

// Hook for adding wanted items
export const useAddWantedItem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ itemId, description }: { itemId: string; description: string }) =>
      wantedItemsApi.add(itemId, description),
    onSuccess: (_, { itemId }) => {
      // Invalidate the item to refresh wanted items
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) })

      toast({
        title: "Wanted item added!",
        description: "This item has been added to your wanted list.",
      })
    },
    onError: (error) => {
      console.error('Error adding wanted item:', error)
      toast({
        title: "Error adding wanted item",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      })
    },
  })
}

// Hook for removing wanted items
export const useRemoveWantedItem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: wantedItemsApi.remove,
    onSuccess: (_, wantedItemId) => {
      // Invalidate all item queries to refresh wanted items
      queryClient.invalidateQueries({ queryKey: itemKeys.details() })

      toast({
        title: "Wanted item removed!",
        description: "This item has been removed from your wanted list.",
      })
    },
    onError: (error) => {
      console.error('Error removing wanted item:', error)
      toast({
        title: "Error removing wanted item",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      })
    },
  })
} 