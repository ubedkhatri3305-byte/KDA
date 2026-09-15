'use client';

import { useWishlistStore } from '@/store/wishlist.store';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { items: wishlistIds } = useWishlistStore();

  // Fetch all products and filter by wishlist IDs
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist-products', wishlistIds],
    queryFn: () => productsApi.getAll({ limit: 100 }),
    enabled: wishlistIds.length > 0,
  });

  const allProducts: any[] = (data as any)?.data || [];
  const wishlistProducts = allProducts.filter((p: any) => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          {wishlistIds.length > 0 && (
            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-sm font-semibold rounded-full">
              {wishlistIds.length}
            </span>
          )}
        </div>

        {wishlistIds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center shadow-sm">
            <Heart className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm mb-6">
              Save items you love — tap the heart icon on any product.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center shadow-sm">
            <p className="text-gray-500">Loading wishlist items...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlistProducts.map((product: any, i: number) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
