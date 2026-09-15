'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, Heart, User, Menu, X, Bell, ChevronDown,
  Sparkles, LogOut, Package, Settings, ChevronRight, Home,
} from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { CartDrawer } from '@/components/cart/cart-drawer';

type CategoryItem = {
  name: string;
  slug: string;
  children?: string[];
  special?: boolean;
};

const categories: CategoryItem[] = [
  { name: "WOMEN", slug: 'women', children: ['SAREE', 'KURTI', 'DRESS MATERIALS', 'PANT', 'DUPATTA', 'STOLE', 'KURTI SET', 'CO-ORD SET'] },
  { name: "MEN", slug: 'men', children: ['KURTA', 'SHIRT'] },
  { name: 'KIDS', slug: 'kids', children: ['GIRLS - CHANIYA CHOLI', 'GIRLS - FROCK', 'GIRLS - KURTI', 'GIRLS - KURTI SET', 'BOYS - KURTA', 'BOYS - KURTA SET'] },
  { name: 'OTHERS', slug: 'others', children: ['BEDSHEET', 'SHAWL', 'MATERIALS'] },
];

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { items, totalItems, openCart } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  const router = useRouter();

  const cartCount = totalItems;
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    setMounted(true);
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-md' : 'bg-white'
        }`}
      >


        {/* Main navbar */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded bg-black flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-black">
                K D A
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {categories.map((cat) => (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => setActiveCategory(cat.slug)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      cat.special
                        ? 'text-red-500 font-bold'
                        : 'text-gray-700 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                    {cat.children && <ChevronDown className="h-3 w-3" />}
                  </Link>

                  {/* Mega dropdown */}
                  {cat.children && activeCategory === cat.slug && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 min-w-[200px]"
                    >
                      {cat.children.map((child) => (
                        <Link
                          key={child}
                          href={`/products?category=${child.toLowerCase().replace(' ', '-')}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-black hover:bg-gray-50 transition-all group"
                        >
                          <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-black" />
                          {child}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-xl text-gray-600 hover:text-black hover:bg-gray-50 transition-all"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative p-2.5 rounded-xl text-gray-600 hover:text-black hover:bg-gray-50 transition-all">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2.5 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100 transition-all"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </button>

              {/* Auth */}
              {isAuthenticated && user ? (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 p-1.5 md:px-3 md:py-1.5 rounded-xl hover:bg-gray-100 transition-all">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold">
                      {user.firstName[0]}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700">{user.firstName}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {user.role !== 'CUSTOMER' && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-black font-medium hover:bg-gray-50">
                        <Sparkles className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white text-xs md:text-sm font-medium hover:bg-gray-800 transition-all"
                  aria-label="Sign In"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Mobile Menu */}
              <button
                className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:bg-gray-50"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Open menu"
              >
                {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-100 bg-white overflow-hidden shadow-xl"
            >
              <div className="container mx-auto px-4 py-4 space-y-3">
                {/* Auth section at top of mobile menu */}
                {isAuthenticated && user ? (
                  <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                          {user.firstName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-tight">
                            {user.firstName} {user.lastName || ''}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileOpen(false);
                        }}
                        className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                      </button>
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-gray-200">
                      {user.role !== 'CUSTOMER' && (
                        <Link
                          href="/admin"
                          className="flex-1 py-1.5 text-center text-xs bg-black text-white rounded-lg font-medium"
                          onClick={() => setIsMobileOpen(false)}
                        >
                          Admin
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        className="flex-1 py-1.5 text-center text-xs bg-white border border-gray-200 text-gray-700 rounded-lg font-medium"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="flex-1 py-1.5 text-center text-xs bg-white border border-gray-200 text-gray-700 rounded-lg font-medium"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        Orders
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-gray-100">
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-black text-white text-sm font-medium rounded-xl text-center shadow-sm"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <User className="h-4 w-4" /> Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-gray-300 text-gray-800 text-sm font-medium rounded-xl text-center hover:bg-gray-50"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}

                {categories.map((cat) => (
                  <div key={cat.slug}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className={`block px-4 py-2.5 rounded-xl text-sm font-medium ${cat.special ? 'text-red-500' : 'text-gray-700'}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {cat.name}
                    </Link>
                    {cat.children && (
                      <div className="ml-4 space-y-1">
                        {cat.children.map((child) => (
                          <Link
                            key={child}
                            href={`/products?category=${child.toLowerCase().replace(' ', '-')}`}
                            className="block px-4 py-2 rounded-lg text-xs text-gray-500 hover:text-black"
                            onClick={() => setIsMobileOpen(false)}
                          >
                            {child}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
            onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
          >
            <motion.form
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleSearch}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-2 flex items-center gap-2"
            >
              <Search className="h-5 w-5 text-gray-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search for "red wedding saree", "cotton kurta", "party dress"...'
                className="flex-1 py-4 px-3 text-gray-900 placeholder-gray-400 outline-none text-base"
                autoFocus
              />
              <button type="submit" className="px-5 py-3 bg-black text-white rounded-md font-medium text-sm flex-shrink-0">
                Search
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* Mobile Bottom Sticky Navigation - 100% Guaranteed Visibility on Phone */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 py-1.5 px-3 flex justify-around items-center shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      >
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-black min-w-[48px] py-1">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <button onClick={() => setSearchOpen(true)} className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-black min-w-[48px] py-1">
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Search</span>
        </button>
        <Link href="/wishlist" className="relative flex flex-col items-center gap-0.5 text-gray-700 hover:text-black min-w-[48px] py-1">
          <Heart className="h-5 w-5" />
          {wishlistCount > 0 && (
            <span className="absolute top-0 right-2 bg-black text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
              {wishlistCount}
            </span>
          )}
          <span className="text-[10px] font-semibold">Wishlist</span>
        </Link>
        <button onClick={openCart} className="relative flex flex-col items-center gap-0.5 text-gray-700 hover:text-black min-w-[48px] py-1">
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-2 bg-black text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-semibold">Cart</span>
        </button>
        <Link
          href={mounted && isAuthenticated ? "/profile" : "/login"}
          className="flex flex-col items-center gap-0.5 text-black hover:text-gray-700 min-w-[56px] py-1 bg-black text-white rounded-xl px-3 shadow-sm"
        >
          <User className="h-4 w-4 text-white" />
          <span className="text-[10px] font-bold text-white">
            {mounted && isAuthenticated ? 'Account' : 'Sign In'}
          </span>
        </Link>
      </nav>

      {/* Spacer for bottom bar on mobile */}
      <div className="lg:hidden h-14" />
    </>
  );
}
