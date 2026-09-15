import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { cartApi } from '@/services/api';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  slug: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  totalItems: number;
  totalPrice: number;
  // Actions
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,
      get totalItems() { return get().items.reduce((sum, item) => sum + item.quantity, 0); },
      get totalPrice() { return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0); },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === newItem.productId && i.variantId === newItem.variantId,
          );
          if (existingIndex >= 0) {
            const items = [...state.items];
            items[existingIndex] = { ...items[existingIndex], quantity: items[existingIndex].quantity + newItem.quantity };
            toast.success('Cart updated!');
            return { items, isOpen: true };
          }
          const item: CartItem = { ...newItem, id: `${newItem.productId}-${newItem.variantId || 'default'}-${Date.now()}` };
          toast.success('Added to cart! 🛍️');
          return { items: [...state.items, item], isOpen: true };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
        toast.success('Item removed from cart');
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) { get().removeItem(itemId); return; }
        set((state) => ({
          items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ items: [] }),

      syncWithServer: async () => {
        try {
          const response: any = await cartApi.get();
          if (response.data?.items) {
            const serverItems = response.data.items.map((item: any) => ({
              id: item.id,
              productId: item.productId,
              variantId: item.variantId,
              name: item.product.name,
              image: item.product.images?.[0]?.url,
              price: Number(item.variant?.price || item.product.basePrice),
              quantity: item.quantity,
              size: item.variant?.size,
              color: item.variant?.color,
              slug: item.product.slug,
            }));
            set({ items: serverItems });
          }
        } catch {}
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
