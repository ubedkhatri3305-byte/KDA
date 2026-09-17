'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { ArrowLeft, Loader2, BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
  });

  const stats = (data as any)?.data || { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0 };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Overview of your store's performance.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-100 rounded-md">
                  <DollarSign className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-100 rounded-md">
                  <TrendingUp className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-100 rounded-md">
                  <Users className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalCustomers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-100 rounded-md">
                  <BarChart3 className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 sm:p-12 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center mt-8">
          <BarChart3 className="h-10 w-10 text-gray-400 mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Detailed Charts Coming Soon</h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-md">
            Advanced analytics charting and custom date range filters are being configured.
          </p>
        </div>
      </div>
    </div>
  );
}
