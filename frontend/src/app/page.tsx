'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { productsApi, bannersApi } from '@/services/api';
import { PosterModal } from '@/components/banner/poster-modal';
import { ArrowRight, ChevronRight, Truck, RefreshCw, Shield, Sparkles, Eye } from 'lucide-react';
import { INITIAL_TRENDING_PRODUCTS, INITIAL_NEW_ARRIVALS } from '@/lib/initial-catalog';

export default function HomePage() {
  const { data: trendingData } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: () => productsApi.getTrending(),
  });

  const { data: newArrivalsData } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productsApi.getNewArrivals(),
  });

  const { data: bannersData } = useQuery({
    queryKey: ['banners', 'home'],
    queryFn: () => bannersApi.getAll({ position: 'home' }),
  });

  const { data: allProductsData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['products', 'all-home'],
    queryFn: () => productsApi.getAll({ limit: 12 }),
  });

  const trending: any[] =
    (trendingData as any)?.data && (trendingData as any).data.length > 0
      ? (trendingData as any).data
      : INITIAL_TRENDING_PRODUCTS;

  const newArrivals: any[] =
    (newArrivalsData as any)?.data && (newArrivalsData as any).data.length > 0
      ? (newArrivalsData as any).data
      : INITIAL_NEW_ARRIVALS;

  const allProducts: any[] = (allProductsData as any)?.data || [];
  const activeBanners: any[] = ((bannersData as any)?.data || []).filter((b: any) => b.isActive);

  const [isPosterOpen, setIsPosterOpen] = useState(false);
  const [isAutoClosing, setIsAutoClosing] = useState(true);
  const hasAutoOpenedRef = useRef(false);

  // Auto-open poster modal for ~10 seconds every time page is opened by customer
  useEffect(() => {
    if (activeBanners.length > 0 && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      setIsPosterOpen(true);
      setIsAutoClosing(true);
    }
  }, [activeBanners]);

  const handleOpenManualPoster = () => {
    setIsAutoClosing(false);
    setIsPosterOpen(true);
  };

  const categories = [
    { name: 'Women', slug: 'women' },
    { name: 'Men', slug: 'men' },
    { name: 'Kids', slug: 'kids' },
    { name: 'Others', slug: 'others' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-12 md:py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              Welcome to K D A
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover your perfect style. Shop the latest trends in men's, women's, and kids' fashion.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/products" className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors">
                Shop Now
              </Link>
            </div>
          </div>
        </section>

        {/* Poster Re-view Option Bar */}
        {activeBanners.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-200/70 py-2.5 px-4">
            <div className="container mx-auto flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-semibold text-gray-900">
                  {activeBanners[0]?.title ? `📢 ${activeBanners[0].title}` : 'Special Offer Poster Available'}
                </span>
              </div>
              <button
                onClick={handleOpenManualPoster}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span>View Poster</span>
              </button>
            </div>
          </div>
        )}


        {/* Categories */}
        <section className="py-8 premium-gradient-bg">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 gradient-text text-center tracking-tight">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-white/50 text-center premium-shadow group"
                >
                  <span className="font-semibold text-gray-900 group-hover:text-black transition-colors">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Products */}
        {trending.length > 0 && (
          <section className="py-8 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Trending Now</h2>
                <Link href="/products?sortBy=popularity" className="text-sm text-gray-600 hover:text-black font-medium flex items-center transition-colors">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {trending.slice(0, 10).map((product: any, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="py-8 bg-gray-50/50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">New Arrivals</h2>
                <Link href="/products?sortBy=newest" className="text-sm text-gray-600 hover:text-black font-medium flex items-center transition-colors">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {newArrivals.slice(0, 10).map((product: any, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products fallback when trending or new arrivals are empty */}
        {trending.length === 0 && newArrivals.length === 0 && (
          <section className="py-8 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Featured Products</h2>
                <Link href="/products" className="text-sm text-gray-600 hover:text-black font-medium flex items-center transition-colors">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              {isLoadingAll ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="h-64 rounded-xl shimmer" />
                  ))}
                </div>
              ) : allProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allProducts.slice(0, 10).map((product: any, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Discover our full catalog in our store.</p>
                  <Link href="/products" className="mt-3 inline-block px-5 py-2 bg-black text-white rounded-lg text-sm font-medium">
                    Browse All Products
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}
        {/* Feature Bar */}
        <section className="premium-gradient-bg border-t border-gray-200 py-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center gap-3 p-5 glass rounded-xl premium-shadow">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mb-1">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Fast Shipping</h3>
                <p className="text-sm text-gray-600">Free delivery on orders over ₹999</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-5 glass rounded-xl premium-shadow">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mb-1">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Easy Returns</h3>
                <p className="text-sm text-gray-600">7-day return policy</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-5 glass rounded-xl premium-shadow">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mb-1">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Secure Shopping</h3>
                <p className="text-sm text-gray-600">Safe and reliable service</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Poster View Option Button */}
      {activeBanners.length > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenManualPoster}
          className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40 bg-black/95 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-md hover:bg-black transition-all cursor-pointer group"
          title="View Active Poster"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>View Poster</span>
        </motion.button>
      )}

      {/* Poster Pop-up Modal */}
      <PosterModal
        isOpen={isPosterOpen}
        onClose={() => setIsPosterOpen(false)}
        banners={activeBanners}
        isAutoClosing={isAutoClosing}
      />

      <Footer />
    </div>
  );
}
