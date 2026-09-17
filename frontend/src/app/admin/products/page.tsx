'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/services/api';
import { Loader2, ArrowLeft, Plus, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

function ToggleSwitch({ isOn, onChange, disabled }: { isOn: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      title={isOn ? 'Click to hide from customers' : 'Click to show to customers'}
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

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', debouncedSearch],
    queryFn: () => productsApi.getAll({ limit: 100, isAdmin: true, search: debouncedSearch || undefined }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => productsApi.toggleActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const products = (data as any)?.data || [];

  const handleToggle = (product: any) => {
    const willBeActive = !product.isActive;
    toggleMutation.mutate(product.id, {
      onSuccess: () => {
        toast.success(
          willBeActive
            ? `"${product.name}" is now visible to customers`
            : `"${product.name}" is now hidden from customers`
        );
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Manage your catalog, inventory, and pricing.</p>
            </div>
          </div>
          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-colors"
            />
          </div>
        </div>

        {/* Stats */}
        {!isLoading && products.length > 0 && !debouncedSearch && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:px-5 sm:py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500">Total Products</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:px-5 sm:py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500">Visible to Customers</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{products.filter((p: any) => p.isActive).length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:px-5 sm:py-4 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500">Hidden</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-400 mt-1">{products.filter((p: any) => !p.isActive).length}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 sm:p-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No products found</p>
              <p className="text-gray-400 text-sm mt-1">
                {debouncedSearch ? 'Try adjusting your search query.' : 'Add your first product to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[680px]">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Available to Customers</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product: any) => (
                    <tr
                      key={product.id}
                      className={`transition-colors ${product.isActive ? 'hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100/50'}`}
                    >
                      {/* Product name + image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover border border-gray-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className={`font-medium truncate max-w-[180px] ${!product.isActive ? 'text-gray-400' : 'text-gray-900'}`}>
                            {product.name}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-gray-500">{product.category?.name || 'Uncategorized'}</td>

                      {/* Price */}
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ₹{Number(product.basePrice || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        {product.status === 'ACTIVE' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            In Stock
                          </span>
                        ) : product.status === 'OUT_OF_STOCK' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            {product.status || 'Draft'}
                          </span>
                        )}
                      </td>

                      {/* Toggle switch */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <ToggleSwitch
                            isOn={product.isActive}
                            onChange={() => handleToggle(product)}
                            disabled={toggleMutation.isPending}
                          />
                          <span className={`text-xs font-medium ${product.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {product.isActive ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        {!isLoading && products.length > 0 && (
          <p className="text-xs text-gray-400 mt-4 text-center">
            Use the toggle switch to show or hide individual products from the customer storefront.
          </p>
        )}
      </div>
    </div>
  );
}
