'use client';

import Link from 'next/link';
import { Sparkles, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

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
              <a
                href="https://www.instagram.com/khatri_daudadam?stkn=MXdrY2M4MThhYXA5cA=="
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on Instagram"
                className="w-9 h-9 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 transition-all text-gray-600 shadow-xs"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/919898270987"
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp"
                className="w-9 h-9 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all text-gray-600 shadow-xs"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
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
            <h3 className="font-semibold text-gray-900 mb-4">Contact & Support</h3>
            <ul className="space-y-3 mb-4">
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <a href="mailto:khatridaudadam987@gmail.com" className="hover:text-black transition-colors break-all">
                  khatridaudadam987@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <a href="tel:+919898270987" className="hover:text-black transition-colors">
                  +91 9898270987
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>Moti Bhujpur, Mundra, Kutch, Gujarat, India</span>
              </li>
            </ul>

            {/* Instagram QR Code / Barcode */}
            <div className="pt-2">
              <a
                href="https://www.instagram.com/khatri_daudadam?stkn=MXdrY2M4MThhYXA5cA=="
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-3 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-pink-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src="/instagram-qr.png"
                      alt="Instagram QR Barcode - @khatri_daudadam"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-pink-600 font-semibold text-xs mb-0.5">
                      <InstagramIcon className="h-3.5 w-3.5" />
                      <span>Follow on Instagram</span>
                    </div>
                    <p className="text-gray-900 font-medium text-xs truncate">@khatri_daudadam</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">Scan or tap to open profile</p>
                  </div>
                </div>
              </a>
            </div>

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
