'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, BarChart3, Settings,
  Sparkles, Bell, Search, TrendingUp, ArrowUpRight, ArrowDownRight,
  ChevronRight, MoreHorizontal, AlertCircle, LogOut, MessageCircle,
  Phone, RefreshCw, X, CheckCircle, Clock, Truck, XCircle, Star, Image as ImageIcon
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { AdminChatWidget } from '@/components/ai/admin-chat-widget';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: Tag, label: 'Coupons', href: '/admin/coupons' },
  { icon: Star, label: 'Reviews', href: '/admin/reviews' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Sparkles, label: 'AI Manager', href: '/admin/ai' },
  { icon: ImageIcon, label: 'Banners', href: '/admin/banners' },
];

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

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeNav, setActiveNav] = useState('/admin');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('');

  useEffect(() => {
    if (user && user.role === 'CUSTOMER') {
      router.replace('/');
    }
  }, [user, router]);

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
    refetchInterval: 30000,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin', 'orders', selectedOrderStatus],
    queryFn: () => adminApi.getOrders({ status: selectedOrderStatus || undefined, limit: 10 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const dashboard = (dashData as any)?.data;
  const orders = (ordersData as any)?.data || [];

  const statsCards = [
    { label: 'Total Revenue', value: `₹${((dashboard?.stats?.totalRevenue || 0) / 100000).toFixed(1)}L`, icon: TrendingUp, color: 'from-purple-500 to-violet-600', sub: 'All time' },
    { label: 'Total Orders', value: (dashboard?.stats?.totalOrders || 0).toLocaleString(), icon: ShoppingBag, color: 'from-pink-500 to-rose-600', sub: `${dashboard?.stats?.pendingOrders || 0} pending` },
    { label: 'Customers', value: (dashboard?.stats?.totalUsers || 0).toLocaleString(), icon: Users, color: 'from-blue-500 to-cyan-600', sub: 'Registered' },
    { label: "Today's Orders", value: (dashboard?.stats?.todayOrders || 0).toString(), icon: BarChart3, color: 'from-orange-500 to-amber-600', sub: 'New today' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user || user.role === 'CUSTOMER') return null;

  return (
    <>
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white"
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-black flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-gray-900 font-bold text-sm">K D A</div>
              <div className="text-gray-500 text-xs">Admin Panel</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeNav === item.href ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveNav(item.href)}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-gray-900 text-sm font-medium truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-gray-500 text-xs capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-xs transition-all"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400">Welcome back, {user?.firstName}! 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/customers"
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-all"
            >
              <MessageCircle className="h-4 w-4" /> Customers & WhatsApp
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              ← Back to Store
            </Link>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-gray-200 shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {statsCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-gray-50 text-gray-700 border border-gray-100 rounded-md">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <span className="text-gray-500 text-xs">{stat.sub}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-gray-500 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-wrap gap-3">
                <h2 className="font-bold text-gray-900">Recent Orders</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedOrderStatus}
                    onChange={(e) => setSelectedOrderStatus(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    <option value="">All Status</option>
                    {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Link href="/admin/orders" className="text-sm text-purple-600 font-medium flex items-center gap-1">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-50 overflow-x-auto">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No orders found</div>
                ) : orders.slice(0, 8).map((order: any, i: number) => {
                  const cfg = getStatusConfig(order.status);
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-all"
                    >
                      <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {order.user?.firstName} {order.user?.lastName}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{order.orderNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {order.user?.whatsappNumber && (
                            <a
                              href={`https://wa.me/91${order.user.whatsappNumber}?text=Hi ${order.user.firstName}! Regarding your order ${order.orderNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                              title="Contact on WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" /> WhatsApp
                            </a>
                          )}
                          {order.user?.phone && (
                            <a href={`tel:+91${order.user.phone}`} className="text-xs text-blue-600 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {order.user.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-gray-900">₹{Number(order.total).toLocaleString()}</div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color} flex items-center gap-1 mt-1`}>
                          <StatusIcon className="h-3 w-3" /> {cfg.label}
                        </span>
                      </div>
                      {/* Quick status change */}
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                        className="text-xs border border-gray-200 rounded-lg px-1 py-1 outline-none ml-1 flex-shrink-0"
                      >
                        {['PENDING','CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Top Products + Quick Actions */}
            <div className="space-y-5">
              {/* Top Products */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Top Products</h2>
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <div className="p-4 space-y-3">
                  {(dashboard?.topProducts || []).map((product: any, i: number) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <span className="text-lg font-black text-gray-200 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.soldCount} sold</p>
                      </div>
                      <span className="text-xs font-semibold text-green-600 flex-shrink-0">
                        ₹{Number(product.basePrice).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {!dashboard?.topProducts?.length && (
                    <p className="text-sm text-gray-400 text-center py-2">No products yet</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h2 className="font-bold text-gray-900 mb-3">Quick Actions</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Add Product', href: '/admin/products/new', icon: Package, color: 'text-purple-600 bg-purple-50' },
                    { label: 'View Customers', href: '/admin/customers', icon: Users, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Manage Orders', href: '/admin/orders', icon: ShoppingBag, color: 'text-pink-600 bg-pink-50' },
                    { label: 'Banners / Posters', href: '/admin/banners', icon: ImageIcon, color: 'text-orange-600 bg-orange-50' },
                    { label: 'AI Manager', href: '/admin/ai', icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                      <ChevronRight className="h-4 w-4 text-gray-300 ml-auto" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <AdminChatWidget />
    </>
  );
}
