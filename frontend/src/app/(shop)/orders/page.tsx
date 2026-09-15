'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import { Loader2, Package, CheckCircle, Clock, MessageCircle, RefreshCw, Truck, XCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';

const WHATSAPP_NUMBER = '919876543210'; // ← Replace with your actual WhatsApp number

function ReviewedBadge({ isReviewed }: { isReviewed: boolean }) {
  if (isReviewed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <CheckCircle className="h-3.5 w-3.5" />
        Reviewed by Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
      <Clock className="h-3.5 w-3.5" />
      Pending Review
    </span>
  );
}

const getStatusConfig = (status: string) => {
  const map: Record<string, { color: string; icon: any; label: string }> = {
    PENDING:          { color: 'bg-amber-100 text-amber-700 border-amber-200',  icon: Clock,         label: 'Pending' },
    CONFIRMED:        { color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: CheckCircle,   label: 'Confirmed' },
    PROCESSING:       { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: RefreshCw,   label: 'Processing' },
    SHIPPED:          { color: 'bg-cyan-100 text-cyan-700 border-cyan-200',     icon: Truck,         label: 'Shipped' },
    OUT_FOR_DELIVERY: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Truck,       label: 'Out for Delivery' },
    DELIVERED:        { color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle,   label: 'Delivered' },
    CANCELLED:        { color: 'bg-red-100 text-red-700 border-red-200',        icon: XCircle,       label: 'Cancelled' },
  };
  return map[status] || { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock, label: status };
};

export default function CustomerOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getAll(),
  });

  const orders = (data as any)?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-14 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6 text-sm">When you place an order, it will appear here.</p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const itemSummary = order.items
                ?.map((i: any) => `${i.name}${i.size ? ` (${i.size})` : ''}`)
                .join(', ') || '';

              const waMessage = encodeURIComponent(
                `Hi! I'd like to follow up on my order #${order.orderNumber}. Items: ${itemSummary}. Please assist me.`
              );
              const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="font-bold text-gray-900 text-base">Order #{order.orderNumber}</span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const cfg = getStatusConfig(order.status);
                        const StatusIcon = cfg.icon;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {cfg.label}
                          </span>
                        );
                      })()}
                      <ReviewedBadge isReviewed={order.isReviewed} />
                    </div>
                  </div>

                  {/* Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="px-6 py-3 border-b border-gray-50">
                      <div className="space-y-1.5">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.quantity}× {item.name}
                              {item.size && <span className="text-gray-400"> · {item.size}</span>}
                            </span>
                            <span className="font-medium text-gray-900">
                              ₹{Number(item.total || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Total Amount</p>
                      <p className="font-bold text-lg text-gray-900">
                        ₹{Number(order.total || order.subtotal || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Contact via WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {orders.length > 0 && (
          <p className="text-xs text-center text-gray-400 mt-6">
            Your order status is reviewed by our team. Contact us on WhatsApp for any queries.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
