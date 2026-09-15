'use client';

import Link from 'next/link';
import { Sparkles, Mail, Phone, MapPin, Globe, Share2, MessageCircle, Play } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded bg-black flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">K D A</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Your destination for simple and beautiful fashion.
            </p>
            <div className="flex gap-3">
              {[Globe, Share2, MessageCircle, Play].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all text-gray-600">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>

          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Track Order', href: '/orders' },
                { label: 'Shop', href: '/products' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 text-sm hover:text-black transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Women's Fashion", href: '/products?category=women' },
                { label: "Men's Fashion", href: '/products?category=men' },
                { label: 'Kids', href: '/products?category=kids' },
                { label: 'Sale', href: '/products?category=sale' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 text-sm hover:text-black transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Policies */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                support@kda.in
              </li>
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                +91 1800-123-4567
              </li>
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                Mumbai, Maharashtra, India
              </li>
            </ul>

          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 K D A. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">Secured by</span>
            <div className="flex gap-2">
              {['SSL', 'Secure Payment'].map((badge) => (
                <span key={badge} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">{badge}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
