'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice?: number;
    ratingAvg: number;
    ratingCount: number;
    images?: { url: string; altText?: string }[];
    category?: { name: string; slug: string };
    variants?: { color?: string; colorHex?: string; size?: string }[];
    tags?: string[];
    isFeatured?: boolean;
    soldCount?: number;
  };
  index?: number;
  className?: string;
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();

  const image = product.images?.[0]?.url || '/placeholder-product.svg';
  const isWishlisted = isInWishlist(product.id);
  const basePriceNum = Number(product.basePrice || 0);
  const salePriceNum = product.salePrice ? Number(product.salePrice) : undefined;
  
  const discount = salePriceNum
    ? Math.round(((basePriceNum - salePriceNum) / basePriceNum) * 100)
    : 0;
  const displayPrice = salePriceNum || basePriceNum;

  const colors = product.variants
    ? [...new Map(product.variants.filter((v) => v.color).map((v) => [v.color, v])).values()]
    : [];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      image,
      price: displayPrice,
      quantity: 1,
      slug: product.slug,
    });
    openCart();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      viewport={{ once: true, margin: '-50px' }}
      className={cn('product-card group', className)}
    >
      <Link href={`/products/${product.slug}`}>
        {/* Image Container */}
        <div className="relative aspect-product overflow-hidden bg-gray-50">
          <Image
            src={image}
            alt={product.images?.[0]?.altText || product.name}
            fill
            className="object-cover product-card-image"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            loading="lazy"
          />

          {/* Overlays */}
          {discount > 0 && (
            <div className="badge-sale">-{discount}%</div>
          )}

          {product.isFeatured && !discount && (
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-black">
              Featured
            </div>
          )}

          {/* AI Badge */}
          <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black text-white text-[10px] font-medium flex items-center gap-0.5">
            AI
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={`absolute bottom-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 transition-colors ${
              isWishlisted
                ? 'bg-black text-white'
                : 'bg-white text-gray-400 hover:text-black'
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
          </button>

          {/* Quick Add to Cart */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 p-2">
            <button
              onClick={handleAddToCart}
              className="w-full py-2 bg-black text-white text-xs font-semibold rounded flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <ShoppingBag className="h-3 w-3" />
              Add to Cart
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3">
          {product.category && (
            <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide font-medium">
              {product.category.name}
            </p>
          )}

          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-black transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="flex gap-1.5 mb-2">
              {colors.slice(0, 4).map((variant) => (
                <div
                  key={variant.color}
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: variant.colorHex || '#888' }}
                  title={variant.color}
                />
              ))}
              {colors.length > 4 && (
                <span className="text-xs text-gray-400 self-center">+{colors.length - 4}</span>
              )}
            </div>
          )}

          {/* Rating */}
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${star <= Math.round(product.ratingAvg) ? 'star-filled' : 'star-empty'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">({product.ratingCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="price-current text-sm">₹{displayPrice.toLocaleString('en-IN')}</span>
            {discount > 0 && (
              <>
                <span className="price-original text-xs">₹{basePriceNum.toLocaleString('en-IN')}</span>
                <span className="price-discount text-xs">{discount}% off</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
