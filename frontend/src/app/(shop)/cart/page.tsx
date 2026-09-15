'use client';

import { useCartStore } from '@/store/cart.store';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const router = useRouter();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            {items.length > 0 && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-sm font-semibold rounded-full">
                {items.length}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center shadow-sm">
            <ShoppingBag className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-6">Add items to your cart to start shopping.</p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-4 items-start">
                  {/* Image */}
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">👗</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.slug}`}>
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug hover:text-gray-600 transition-colors line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>
                    {item.size && <p className="text-xs text-gray-400 mt-0.5">Size: {item.size}</p>}
                    {item.color && <p className="text-xs text-gray-400">Color: {item.color}</p>}

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors text-gray-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-semibold text-gray-900 border-x border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors text-gray-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-bold text-gray-900 text-sm">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-fit sticky top-24">
              <h2 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Order Summary
              </h2>
              <div className="space-y-3 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-medium text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium text-gray-900'}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">Free shipping on orders above ₹999</p>
                )}
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center mb-5">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-black text-gray-900">₹{total.toLocaleString('en-IN')}</span>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full py-3.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Proceed to Checkout
              </button>
              <Link
                href="/products"
                className="block text-center text-sm text-gray-500 mt-3 hover:text-gray-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
