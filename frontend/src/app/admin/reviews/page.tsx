'use client';

import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '@/services/api';
import { Loader2, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';

export default function AdminReviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: () => reviewsApi.getAll(),
  });

  const reviews = (data as any)?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Feedback</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Monitor all product reviews and feedback.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No feedback found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[650px]">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4 w-1/2">Comment</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reviews.map((review: any) => (
                    <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-purple-600">
                        {review.product?.name}
                      </td>
                      <td className="px-6 py-4">
                        {review.user?.firstName} {review.user?.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {review.comment || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
