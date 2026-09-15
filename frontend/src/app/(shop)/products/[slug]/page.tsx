'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Star, Truck, Shield, RefreshCw, Share2, Minus, Plus, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { productsApi, reviewsApi } from '@/services/api';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getById(slug),
    enabled: !!slug,
  });

  const { data: relatedData } = useQuery({
    queryKey: ['products', 'related', (productData as any)?.data?.id],
    queryFn: () => productsApi.getRelated((productData as any)?.data?.id),
    enabled: !!(productData as any)?.data?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-3">
              <div className="shimmer aspect-product rounded-2xl" />
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map((i) => <div key={i} className="shimmer aspect-square rounded-xl" />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="shimmer h-8 rounded w-3/4" />
              <div className="shimmer h-6 rounded w-1/2" />
              <div className="shimmer h-24 rounded" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const product = (productData as any)?.data;
  if (!product) return notFound();

  const related: any[] = (relatedData as any)?.data || [];
  const images = product.images || [];
  const variants = product.variants || [];
  const sizes = [...new Set(variants.map((v: any) => v.size).filter(Boolean))];
  const colors = [...new Map(variants.filter((v: any) => v.color).map((v: any) => [v.color, v])).values()];
  const selectedVariant = variants.find((v: any) => v.size === selectedSize && v.color === selectedColor);
  const currentPrice = selectedVariant?.salePrice || selectedVariant?.price || product.salePrice || product.basePrice;
  const originalPrice = selectedVariant?.price || product.basePrice;
  const discount = currentPrice < originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const isWishlisted = isInWishlist(product.id);

  const submitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await reviewsApi.create({
        productId: product.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review submitted successfully!');
      setReviewComment('');
      setReviewRating(5);
      // refetch or simply wait for next load
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) { toast.error('Please select a size'); return; }
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      image: images[0]?.url,
      price: Number(currentPrice),
      quantity,
      size: selectedSize,
      color: selectedColor,
      slug: product.slug,
    });
    openCart();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <a href="/" className="hover:text-purple-600">Home</a>
          <ChevronRight className="h-3 w-3" />
          <a href="/products" className="hover:text-purple-600">Products</a>
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <a href={`/products?category=${product.category.slug}`} className="hover:text-purple-600">{product.category.name}</a>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-product rounded-3xl overflow-hidden bg-gray-50 group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {images[selectedImage] ? (
                    <Image
                      src={images[selectedImage].url}
                      alt={images[selectedImage].altText || product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl bg-gray-100">👗</div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="absolute top-4 right-4 bg-black text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium">
                AI Photos
              </div>

              {/* Share */}
              <button className="absolute bottom-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all text-gray-600 hover:text-purple-600">
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((img: any, i: number) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-purple-500 scale-95' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image src={img.url} alt={`View ${i + 1}`} width={80} height={80} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {/* Brand & Category */}
            <div className="flex items-center gap-3">
              {product.category && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                  {product.category.name}
                </span>
              )}
              {product.brand && (
                <span className="text-sm text-gray-500 font-medium">{product.brand.name}</span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4.5 w-4.5 ${star <= Math.round(product.ratingAvg) ? 'star-filled' : 'star-empty'} h-5 w-5`}
                  />
                ))}
              </div>
              <span className="text-gray-600 text-sm font-medium">{Number(product.ratingAvg).toFixed(1)}</span>
              <span className="text-gray-400 text-sm">({product.ratingCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-gray-900">₹{Number(currentPrice).toLocaleString('en-IN')}</span>
              {discount > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through font-medium">₹{Number(originalPrice).toLocaleString('en-IN')}</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">{discount}% OFF</span>
                </>
              )}
            </div>

            {/* Highlights */}
            {product.highlights?.length > 0 && (
              <ul className="space-y-1.5">
                {product.highlights.slice(0, 4).map((highlight: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-700">Color:</span>
                  <span className="text-sm text-gray-500">{selectedColor || 'Select a color'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((variant: any) => (
                    <button
                      key={variant.color}
                      onClick={() => setSelectedColor(variant.color)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                        selectedColor === variant.color
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: variant.colorHex || '#888' }}
                      />
                      {variant.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Size: <span className="font-normal text-gray-500">{selectedSize || 'Select a size'}</span>
                  </span>
                  <button className="text-xs text-purple-600 font-medium hover:underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(sizes as string[]).map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'border-purple-500 bg-purple-600 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-50 transition-all text-gray-600">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-semibold text-gray-900 border-x border-gray-200">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-2 hover:bg-gray-50 transition-all text-gray-600">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-black text-white font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
              </button>
              <button
                onClick={() => toggle(product.id)}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  isWishlisted ? 'border-pink-500 bg-pink-50 text-pink-500' : 'border-gray-200 text-gray-400 hover:border-pink-300 hover:text-pink-500'
                }`}
              >
                <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-pink-500' : ''}`} />
              </button>
            </div>

            {/* Buy Now */}
            <button className="w-full py-4 bg-gray-100 text-gray-900 font-semibold rounded-md hover:bg-gray-200 transition-all">
              Buy Now
            </button>

            {/* Delivery & Trust */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
              {[
                { icon: Truck, label: 'Free Delivery', desc: 'Above ₹999' },
                { icon: RefreshCw, label: '7-Day Returns', desc: 'Easy returns' },
                { icon: Shield, label: 'Secure Shopping', desc: 'Protected' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center text-center p-3 rounded-md bg-gray-50 border border-gray-200">
                  <item.icon className="h-5 w-5 text-gray-600 mb-1.5" />
                  <span className="text-xs font-semibold text-gray-900">{item.label}</span>
                  <span className="text-xs text-gray-500">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex border-b border-gray-200 gap-8 mb-8">
            {[
              { id: 'description', label: 'Description' },
              { id: 'specifications', label: 'Specifications' },
              { id: 'reviews', label: 'Reviews' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-black border-black'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="prose max-w-none text-gray-600 text-sm leading-relaxed">
              <p>{product.description}</p>
              {product.highlights?.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {product.highlights.map((h: string, i: number) => <li key={i}>✓ {h}</li>)}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'specifications' && product.specifications && (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500 capitalize">{key}</span>
                  <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Submit Review */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Write a Review</h3>
                <p className="text-xs text-gray-500 mb-4">You can only write a review for products that have been delivered to you.</p>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)}>
                      <Star className={`h-6 w-6 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black resize-none text-sm mb-4"
                />
                <button
                  onClick={submitReview}
                  disabled={isSubmittingReview}
                  className="px-6 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 disabled:opacity-70 transition-colors"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>

              {/* Review List */}
              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-6">
                  {product.reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                          {review.user?.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.user?.firstName} {review.user?.lastName}</p>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No reviews yet. Be the first to review this product!
                </div>
              )}
            </div>
          )}

        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {related.slice(0, 10).map((p: any, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
