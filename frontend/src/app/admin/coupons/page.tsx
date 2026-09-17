'use client';

import { ArrowLeft, Tag, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminCouponsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Coupons & Offers</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Manage discount codes and promotional offers.</p>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Create Coupon
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 sm:p-12 text-center flex flex-col items-center">
          <Tag className="h-10 w-10 text-gray-400 mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No Active Coupons</h2>
          <p className="text-gray-500 text-sm max-w-md mb-6">
            You haven't created any discount codes yet. Create your first coupon to offer discounts to your customers.
          </p>
          <button className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Create Coupon
          </button>
        </div>
      </div>
    </div>
  );
}
