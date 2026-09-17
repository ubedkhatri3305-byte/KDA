'use client';

import { ArrowLeft, Sparkles, Brain, Cpu, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AdminAIPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI Manager</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Configure AI models, view stats, and manage prompt settings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-6 w-6 text-black" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Google Gemini</h2>
            <p className="text-gray-500 text-sm mb-4">Primary model used for customer support and natural language search.</p>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-black" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Groq AI</h2>
            <p className="text-gray-500 text-sm mb-4">Used for fast inference in real-time product recommendations.</p>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Cpu className="h-6 w-6 text-black" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Stable Diffusion</h2>
            <p className="text-gray-500 text-sm mb-4">Used for AI generation of lifestyle photos and backgrounds.</p>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 sm:p-12 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <Zap className="h-10 w-10 text-gray-400 mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Advanced Config Coming Soon</h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-md">
            The advanced prompt editor and fine-tuning features are currently under development.
          </p>
        </div>
      </div>
    </div>
  );
}
