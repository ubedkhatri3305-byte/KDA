'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users, MessageCircle, Phone, Mail, Search, ChevronLeft,
  CheckCircle, XCircle, ShoppingBag, LayoutDashboard, Package,
  Tag, BarChart3, Sparkles, Filter,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: Tag, label: 'Coupons', href: '/admin/coupons' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Sparkles, label: 'AI Manager', href: '/admin/ai' },
];

export default function AdminCustomers() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'customers', page],
    queryFn: () => adminApi.getCustomers({ page, limit: 20 }),
  });

  const toggleActive = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserActive(id),
    onSuccess: () => {
      toast.success('Customer status updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
    onError: () => toast.error('Failed to update customer'),
  });

  const customers: any[] = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;

  const filtered = customers.filter((c) =>
    search
      ? `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 100%)' }}
      >
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">K D A</div>
              <div className="text-white/50 text-xs">Admin Panel</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${item.href === '/admin/customers' ? 'active' : ''}`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-white/50 text-xs capitalize">{user?.role?.toLowerCase()}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-400">
                {pagination?.total || 0} total · {customers.filter(c => c.whatsappConsent).length} WhatsApp consent
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 w-72"
            />
          </div>
        </header>

        <div className="p-6">
          {/* Info Banner */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              Click the <strong>WhatsApp</strong> button next to any customer to directly open a WhatsApp chat with them. Only customers who gave WhatsApp consent are shown with the button.
            </p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-5 py-3.5 text-left">Customer</th>
                    <th className="px-5 py-3.5 text-left">Contact</th>
                    <th className="px-5 py-3.5 text-left">WhatsApp</th>
                    <th className="px-5 py-3.5 text-left">Orders</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-left">Joined</th>
                    <th className="px-5 py-3.5 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(7)].map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-gray-100 rounded shimmer w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((customer, i) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {customer.firstName?.[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {customer.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {customer.phone ? (
                            <a
                              href={`tel:+91${customer.phone}`}
                              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Phone className="h-3.5 w-3.5" /> +91 {customer.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">Not provided</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {customer.whatsappConsent && customer.whatsappNumber ? (
                            <a
                              href={`https://wa.me/91${customer.whatsappNumber}?text=Hi ${customer.firstName}! We're reaching out from K D A regarding your account.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-all"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Chat: {customer.whatsappNumber}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                              No consent
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            <ShoppingBag className="h-3 w-3" />
                            {customer._count?.orders || 0}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            customer.isActive
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {customer.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleActive.mutate(customer.id)}
                            disabled={toggleActive.isPending}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                              customer.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {customer.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">{page} / {pagination.totalPages}</span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
