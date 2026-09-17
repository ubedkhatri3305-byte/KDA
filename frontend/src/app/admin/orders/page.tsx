'use client';

import { useState, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import { Loader2, ArrowLeft, Package, MessageCircle, CheckCircle, Clock, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function ToggleSwitch({ isOn, onChange, disabled }: { isOn: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      title={isOn ? 'Mark as Not Reviewed' : 'Mark as Reviewed'}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        isOn ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          isOn ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', debouncedSearch],
    queryFn: () => ordersApi.adminGetAll({ limit: 100, search: debouncedSearch || undefined }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => ordersApi.adminToggleReviewed(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: () => toast.error('Failed to update order'),
  });

  const handleToggle = (order: any) => {
    const willBeReviewed = !order.isReviewed;
    toggleMutation.mutate(order.id, {
      onSuccess: () => {
        toast.success(
          willBeReviewed
            ? `Order #${order.orderNumber} marked as Reviewed`
            : `Order #${order.orderNumber} marked as Not Reviewed`
        );
      },
    });
  };

  const orders = (data as any)?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-500 text-xs sm:text-sm">View, review, and contact customers about their orders.</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by order number, customer name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-colors"
            />
          </div>
        </div>

        {/* Stats */}
        {!isLoading && orders.length > 0 && !debouncedSearch && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:px-5 sm:py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:px-5 sm:py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500">Reviewed</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                {orders.filter((o: any) => o.isReviewed).length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:px-5 sm:py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500">Pending Review</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-1">
                {orders.filter((o: any) => !o.isReviewed).length}
              </p>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 sm:p-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No orders found</p>
              <p className="text-gray-400 text-sm mt-1">
                {debouncedSearch ? 'Try adjusting your search query.' : 'No orders yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4 text-center">Reviewed</th>
                    <th className="px-6 py-4 text-right">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order: any) => {
                    const itemSummary = order.items
                      ?.slice(0, 2)
                      .map((i: any) => i.name)
                      .join(', ') || '';
                    const extraItems = (order.items?.length || 0) - 2;

                    const waMessage = encodeURIComponent(
                      `Hi ${order.user?.firstName || 'Customer'}, your order #${order.orderNumber} has been received. We'll confirm and arrange delivery shortly. Thank you!`
                    );
                    const waNumber = order.user?.whatsappNumber || order.user?.phone || '';
                    const waLink = waNumber
                      ? `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${waMessage}`
                      : null;

                    const notesText = order.notes || '';
                    const autoAddressMatch = notesText.match(/Auto-detected:\s*(.*)/);
                    const autoAddress = autoAddressMatch ? autoAddressMatch[1] : null;
                    const cleanAddress = notesText
                      .replace('Delivery Address: ', '')
                      .replace(/\[Live Location:.*?\]/g, '')
                      .replace(/Auto-detected:.*$/m, '')
                      .trim();
                    const mapLink = notesText.match(/https:\/\/maps\.google\.com\/\?q=[^\s\]]+/)?.[0];

                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors hover:bg-gray-50 ${order.isReviewed ? '' : 'bg-yellow-50/30'}`}
                      >
                        {/* Order # */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {order.user?.firstName} {order.user?.lastName}
                          </p>
                          {order.user?.phone && (
                            <p className="text-xs text-gray-400 mt-0.5">{order.user.phone}</p>
                          )}
                        </td>

                        {/* Items */}
                        <td className="px-6 py-4 text-gray-600 max-w-[180px]">
                          <p className="truncate">{itemSummary}</p>
                          {extraItems > 0 && (
                            <p className="text-xs text-gray-400">+{extraItems} more</p>
                          )}
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 text-gray-600 max-w-[200px]">
                          <p className="truncate text-xs" title={cleanAddress || 'No address provided'}>
                            {cleanAddress || '-'}
                          </p>
                          {autoAddress && (
                            <p className="text-[10px] text-gray-500 mt-1.5 leading-tight border-l-2 border-purple-200 pl-1.5" title={autoAddress}>
                              {autoAddress}
                            </p>
                          )}
                          {mapLink && (
                            <a 
                              href={mapLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-blue-500 hover:underline text-xs flex items-center gap-1 mt-1 font-medium"
                            >
                              <MapPin className="h-3 w-3" /> View Map
                            </a>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          ₹{Number(order.total || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Reviewed toggle */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <ToggleSwitch
                              isOn={order.isReviewed}
                              onChange={() => handleToggle(order)}
                              disabled={toggleMutation.isPending}
                            />
                            <span className={`text-xs font-medium ${order.isReviewed ? 'text-green-600' : 'text-yellow-600'}`}>
                              {order.isReviewed ? 'Reviewed' : 'Pending'}
                            </span>
                          </div>
                        </td>

                        {/* WhatsApp */}
                        <td className="px-6 py-4 text-right">
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No phone</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!isLoading && orders.length > 0 && (
          <p className="text-xs text-gray-400 mt-4 text-center">
            Toggle the switch to mark an order as reviewed. Customers can see their review status in their order history.
          </p>
        )}
      </div>
    </div>
  );
}
