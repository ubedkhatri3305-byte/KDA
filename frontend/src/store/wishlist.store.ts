import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { wishlistApi } from '@/services/api';
import { toast } from 'sonner';

interface WishlistState {
  items: string[];  // product IDs
  isLoading: boolean;
  toggle: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  syncWithServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      toggle: (productId) => {
        const isIn = get().isInWishlist(productId);
        set((state) => ({
          items: isIn ? state.items.filter((id) => id !== productId) : [...state.items, productId],
        }));
        toast.success(isIn ? 'Removed from wishlist' : 'Added to wishlist ❤️');
        wishlistApi.toggle(productId).catch(() => {});
      },

      isInWishlist: (productId) => get().items.includes(productId),

      syncWithServer: async () => {
        try {
          const response: any = await wishlistApi.get();
          if (response.data?.items) {
            set({ items: response.data.items.map((i: any) => i.productId) });
          }
        } catch {}
      },
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
