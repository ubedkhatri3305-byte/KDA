'use client';

import { useCartStore } from '@/store/cart.store';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ShieldCheck, MapPin, Loader2, CheckCircle, MessageCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ordersApi } from '@/services/api';
import { useState } from 'react';

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          const ad = data.address || {};
          
          const village = ad.village || ad.town || ad.city || ad.suburb || '';
          const taluka = ad.county || ad.state_district || '';
          const state = ad.state || '';
          const pincode = ad.postcode || '';
          
          const addressParts = [
            village ? `${village}` : '',
            taluka ? `${taluka}` : '',
            state ? `${state}` : '',
            pincode ? `PIN: ${pincode}` : ''
          ].filter(Boolean).join(', ');

          const locationLink = `\n[Live Location: https://maps.google.com/?q=${latitude},${longitude}]\nAuto-detected: ${addressParts}`;
          setAddress((prev) => prev + locationLink);
          toast.success('Location & Address added!');
        } catch (error) {
          const locationLink = `\n[Live Location: https://maps.google.com/?q=${latitude},${longitude}]`;
          setAddress((prev) => prev + locationLink);
          toast.success('Location added! (Address fetch failed)');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        toast.error('Failed to get location. Please allow location permissions.');
        setIsLocating(false);
      }
    );
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to place an order');
      router.push('/login?redirect=/checkout');
      return;
    }
    if (!address.trim()) {
      toast.error('Please provide a delivery address');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const response: any = await ordersApi.create({
        items: orderItems,
        notes: `Delivery Address: ${address}`,
      });

      const num = response?.data?.orderNumber || '';
      setOrderNumber(num);
      setOrderPlaced(true);
      clearCart();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success Screen ───────────────────────────────────────
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-9 w-9 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed! 🎉</h1>
            {orderNumber && (
              <p className="text-sm text-gray-500 mb-2">Order #{orderNumber}</p>
            )}
            <p className="text-gray-600 mb-4">
              Your order has been placed successfully! We will contact you directly on <strong>WhatsApp</strong> to share your payment details and provide delivery updates.
            </p>
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 mb-6 text-left text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <RotateCcw className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                <span>7-Day Return & Exchange Policy</span>
              </div>
              <p className="text-emerald-700 leading-relaxed">
                Enjoy hassle-free returns within 7 days of delivery for unused items. We handle returns directly via WhatsApp or support@kda.in.
              </p>
            </div>
            <button
              onClick={() => router.push('/orders')}
              className="w-full py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors mb-3"
            >
              Track My Orders
            </button>
            <button
              onClick={() => router.push('/products')}
              className="w-full py-3 bg-gray-100 text-gray-800 font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Empty Cart ───────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Add some products to your cart before checking out.</p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Checkout Form ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Order Summary
            </h2>
            <div className="space-y-3 mb-5">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <span className="text-gray-600 pr-3 leading-snug">
                    {item.quantity}× {item.name}
                    {item.size && <span className="text-gray-400"> ({item.size})</span>}
                  </span>
                  <span className="font-semibold text-gray-900 flex-shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600 font-medium">FREE</span> : `₹${shipping}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Free shipping on orders above ₹999</p>
              )}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Address + Confirm */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
            <h2 className="text-base font-bold text-gray-900 mb-1">Delivery Address</h2>
            <p className="text-xs text-gray-500 mb-4">
              We process orders via WhatsApp for personalised service.
            </p>

            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Your Address <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50"
                  type="button"
                >
                  {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
                  Use Live Location
                </button>
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your full delivery address..."
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 resize-none text-sm"
                required
              />
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 mb-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-900">
                <MessageCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Payment & Updates via WhatsApp</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Once your order is placed, our team will contact you directly on WhatsApp with payment details, UPI options, and dispatch updates.
              </p>
              <div className="flex items-center gap-1.5 font-medium text-emerald-900 pt-1.5 border-t border-emerald-200/60">
                <RotateCcw className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                <span>7-Day Hassle-Free Return & Exchange Policy</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-70 transition-colors mb-3"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order...</>
              ) : (
                <>Confirm Order</>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp Order Confirmation • Easy 7-Day Returns</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
