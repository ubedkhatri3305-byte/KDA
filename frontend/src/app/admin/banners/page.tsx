'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { bannersApi } from '@/services/api';
import { toast } from 'sonner';
import { Sparkles, Trash2, Plus, Image as ImageIcon, ArrowLeft } from 'lucide-react';

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });

  const { data: bannersData, isLoading } = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => bannersApi.getAll({ position: 'home' }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => bannersApi.create(data),
    onSuccess: () => {
      toast.success('Banner added successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setIsAdding(false);
      setFormData({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
    },
    onError: () => toast.error('Failed to add banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersApi.delete(id),
    onSuccess: () => {
      toast.success('Banner deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
    },
    onError: () => toast.error('Failed to delete banner'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => bannersApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      return bannersApi.uploadImage(fd);
    },
    onSuccess: (res: any) => {
      setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
      toast.success('Image uploaded successfully');
    },
    onError: () => toast.error('Failed to upload image'),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, position: 'home' });
  };

  const banners = (bannersData as any)?.data || [];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Manage Banners</h1>
              <p className="text-xs sm:text-sm text-gray-400">Add or remove posters for the homepage</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-gray-800 transition-all w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Banner
          </button>
        </header>

        <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
          {isAdding && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">New Banner</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                      placeholder="e.g. Summer Sale"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                      placeholder="e.g. Up to 50% off"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Poster Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      required={!formData.imageUrl}
                      onChange={handleImageChange}
                      disabled={uploadMutation.isPending}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                    />
                    {uploadMutation.isPending && <p className="text-xs text-gray-500 mt-1">Uploading image...</p>}
                    {formData.imageUrl && !uploadMutation.isPending && (
                      <div className="mt-2 h-20 w-32 bg-gray-100 rounded border border-gray-200 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (Optional)</label>
                    <input
                      type="text"
                      value={formData.linkUrl}
                      onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                      placeholder="/products?category=sale"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || uploadMutation.isPending || !formData.imageUrl}
                    className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Save Banner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-3 text-center py-12 text-gray-400">Loading banners...</div>
            ) : banners.length === 0 ? (
              <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <ImageIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No banners found. Add one to display on the homepage.</p>
              </div>
            ) : (
              banners.map((banner: any) => (
                <div key={banner.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="h-40 bg-gray-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900">{banner.title}</h3>
                    {banner.subtitle && <p className="text-sm text-gray-500 mt-1">{banner.subtitle}</p>}
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={banner.isActive}
                          onChange={() => toggleMutation.mutate(banner.id)}
                          className="rounded text-black focus:ring-black cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this banner?')) {
                            deleteMutation.mutate(banner.id);
                          }
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
