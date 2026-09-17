'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { productsApi, bannersApi } from '@/services/api';
import { ArrowRight, ChevronRight, Truck, RefreshCw, Shield } from 'lucide-react';

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

  const trending: any[] = (trendingData as any)?.data || [];
  const newArrivals: any[] = (newArrivalsData as any)?.data || [];
  const allProducts: any[] = (allProductsData as any)?.data || [];
  const activeBanners: any[] = ((bannersData as any)?.data || []).filter((b: any) => b.isActive);

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
        {/* Dynamic Banners or Fallback Hero Section */}
        {activeBanners.length > 0 ? (
          <section className="bg-white border-b border-gray-200 overflow-x-auto flex snap-x snap-mandatory hide-scrollbar">
            {activeBanners.map(banner => (
              <div key={banner.id} className="min-w-full flex-shrink-0 snap-center relative">
                {banner.linkUrl ? (
                  <Link href={banner.linkUrl} className="block w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="w-full h-auto object-contain" />}
                  </Link>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  banner.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="w-full h-auto object-contain" />
                )}
                {/* Optional overlay text if they have title/subtitle and we want to render it on top, but posters usually have text in image */}
              </div>
            ))}
          </section>
        ) : (
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

      <Footer />
    </div>
  );
}
