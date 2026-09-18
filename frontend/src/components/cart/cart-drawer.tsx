'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart.store';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice } = useCartStore();
  const pathname = usePathname();

  // Automatically close cart drawer on route change
  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[60] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Shopping Cart</h2>
                {totalItems > 0 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-900 text-xs font-bold rounded-full border border-gray-200">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ShoppingCart className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-400 text-sm mb-6">Add items to get started!</p>
                  <button
                    onClick={closeCart}
                    className="px-6 py-3 bg-black text-white rounded-md font-medium text-sm hover:bg-gray-800"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      exit={{ opacity: 0, x: 50 }}
                      className="flex gap-3 p-3 bg-gray-50 rounded-2xl"
                    >
                      {/* Image */}
                      <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">👗</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1">{item.name}</h4>
                        <div className="flex gap-2 text-xs text-gray-400 mb-2">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-sm">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-purple-400 transition-all"
                            >
                              <Minus className="h-3 w-3 text-gray-600" />
                            </button>
                            <span className="text-sm font-semibold text-gray-900 w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-purple-400 transition-all"
                            >
                              <Plus className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all text-gray-400 flex-shrink-0 self-start"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-gray-100 space-y-3">
                {/* Free shipping progress */}
                {totalPrice < 999 && (
                  <div className="bg-gray-100 rounded-md p-3">
                    <div className="flex justify-between text-xs text-gray-700 mb-1.5 font-medium">
                      <span>Add ₹{(999 - totalPrice).toLocaleString('en-IN')} more for FREE shipping!</span>
                      <span>{Math.round((totalPrice / 999) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totalPrice / 999) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {totalPrice >= 999 && (
                  <div className="bg-green-50 text-green-700 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-2">
                    ✅ You've unlocked FREE shipping!
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                  <span className="text-xl font-bold text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>

                {/* CTA */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition-all"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full py-3 text-gray-600 text-sm hover:text-black transition-colors font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
