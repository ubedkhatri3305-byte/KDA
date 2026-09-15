'use client';

import { useState, useCallback, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SlidersHorizontal, Grid, List, Search, X, ChevronDown, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { productsApi } from '@/services/api';

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt:desc' },
  { label: 'Price: Low to High', value: 'price:asc' },
  { label: 'Price: High to Low', value: 'price:desc' },
  { label: 'Most Popular', value: 'popularity:desc' },
  { label: 'Highest Rated', value: 'rating:desc' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];
const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Black', 'White', 'Orange', 'Brown'];
const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: 'Above ₹10,000', min: 10000, max: undefined },
];

function ProductsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || 'createdAt:desc';
  const [sortBy, sortOrder] = sortParam.split(':');
  const page = parseInt(searchParams.get('page') || '1');

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min?: number; max?: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { search, category, sortBy, sortOrder, page, selectedSizes, selectedColors, selectedPriceRange }],
    queryFn: () => productsApi.getAll({
      search: search || undefined,
      categoryId: category || undefined,
      sortBy,
      sortOrder,
      page,
      limit: 20,
      ...(selectedSizes.length > 0 && { sizes: selectedSizes.join(',') }),
      ...(selectedColors.length > 0 && { colors: selectedColors.join(',') }),
      ...(selectedPriceRange?.min !== undefined && { minPrice: selectedPriceRange.min }),
      ...(selectedPriceRange?.max !== undefined && { maxPrice: selectedPriceRange.max }),
    }),
    keepPreviousData: true,
  } as any);

  const products: any[] = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  }, [searchParams, router]);

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceRange(null);
    router.push('/products');
  };

  const hasActiveFilters = selectedSizes.length > 0 || selectedColors.length > 0 || selectedPriceRange || search || category;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {search ? `Search: "${search}"` : category ? `${category}` : 'All Products'}
              </h1>
              {pagination && (
                <p className="text-gray-400 text-sm mt-1">{pagination.total} products found</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </button>
              )}

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortParam}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 bg-white text-gray-700 appearance-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium transition-all ${
                  isFilterOpen || hasActiveFilters
                    ? 'bg-black text-white border-black'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {[selectedSizes.length, selectedColors.length, selectedPriceRange ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>

              {/* View Mode */}
              <div className="flex border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.aside
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 256 }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-shrink-0 w-64 overflow-hidden"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-6 sticky top-24">
                  <h2 className="font-bold text-gray-900">Filters</h2>

                  {/* Price Range */}
                  <div className="filter-section">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Range</h3>
                    <div className="space-y-2">
                      {PRICE_RANGES.map((range) => (
                        <label key={range.label} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="price"
                            checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                            onChange={() => setSelectedPriceRange({ min: range.min, max: range.max })}
                            className="accent-black"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-black transition-colors">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="filter-section">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSizes((prev) =>
                            prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                          )}
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                            selectedSizes.includes(size)
                              ? 'bg-black text-white border-black'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div className="filter-section">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Color</h3>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColors((prev) =>
                            prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
                          )}
                          className={`category-pill text-xs ${selectedColors.includes(color) ? 'active' : 'border-gray-200 text-gray-600'}`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 text-black animate-spin" />
                  <p className="text-gray-400">Loading products...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-32">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
                <button onClick={clearFilters} className="px-6 py-3 bg-black text-white rounded-md font-medium">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 lg:gap-5 ${
                  viewMode === 'grid'
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-1'
                }`}>
                  {products.map((product: any, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => updateParam('page', String(page - 1))}
                      disabled={!pagination.hasPrev}
                      className="px-4 py-2 border border-gray-200 rounded-md text-sm disabled:opacity-40 hover:border-gray-300 hover:text-black transition-all"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => updateParam('page', String(pageNum))}
                          className={`w-10 h-10 rounded-md text-sm font-medium transition-all ${
                            pageNum === page
                              ? 'bg-black text-white'
                              : 'border border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => updateParam('page', String(page + 1))}
                      disabled={!pagination.hasNext}
                      className="px-4 py-2 border border-gray-200 rounded-md text-sm disabled:opacity-40 hover:border-gray-300 hover:text-black transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-black animate-spin" /></div>}>
      <ProductsInner />
    </Suspense>
  );
}
