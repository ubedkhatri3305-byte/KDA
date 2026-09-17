'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi, aiApi } from '@/services/api';
import { ArrowLeft, Loader2, Save, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AddProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    mainCategoryId: '',
    categoryId: '',
    basePrice: '',
    description: '',
    isAvailable: true,
    sizes: '',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });
  
  // Now categories is an array of parent categories, each with .children
  const mainCategories = (categoriesData as any)?.data || [];

  // Find the selected main category to get its children
  const activeMainCategory = mainCategories.find((c: any) => c.id === formData.mainCategoryId);
  const subCategories = activeMainCategory?.children || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // If main category changes, reset sub category
      if (name === 'mainCategoryId') {
        setFormData((prev) => ({ ...prev, categoryId: '' }));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.basePrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const price = Number(formData.basePrice);
      
      // Parse sizes from comma separated string
      const sizeArray = formData.sizes.split(',').map(s => s.trim()).filter(Boolean);
      
      const variants = sizeArray.length > 0 
        ? sizeArray.map(size => ({ size, price, stock: 100 }))
        : [{ price, stock: 100 }];

      const response = await productsApi.create({
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        basePrice: price,
        status: formData.isAvailable ? 'ACTIVE' : 'OUT_OF_STOCK',
        variants
      });
      
      const createdProduct = (response as any).data;

      if (selectedFile && createdProduct?.id) {
        const uploadData = new FormData();
        uploadData.append('images', selectedFile);
        const uploadRes = await productsApi.uploadImages(createdProduct.id, uploadData);
        
        const uploadedImages = (uploadRes as any).data;
        if (uploadedImages && uploadedImages.length > 0) {
          const mainCategoryName = activeMainCategory?.name || 'Fashion';
          const subCategoryName = subCategories.find((c: any) => c.id === formData.categoryId)?.name || 'Clothing';
          
          toast.info('Uploading complete! Starting AI model photo generation in the background...');
          await aiApi.generateModelPhotos(createdProduct.id, {
            imageUrl: uploadedImages[0].url,
            clothingType: subCategoryName,
            category: mainCategoryName
          }).catch(err => console.error('AI Generation Error:', err));
        }
      }
      
      toast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (error: any) {
      const errorMsg = error?.errors ? error.errors.join(', ') : (error?.message || 'Failed to create product');
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/admin/products" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Create a new product for your catalog.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="e.g. Designer Red Saree"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Main Category <span className="text-red-500">*</span></label>
                <select
                  name="mainCategoryId"
                  value={formData.mainCategoryId}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
                  required
                >
                  <option value="">Select Category</option>
                  {mainCategories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub Category <span className="text-red-500">*</span></label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  required
                  disabled={!formData.mainCategoryId || subCategories.length === 0}
                >
                  <option value="">Select Item Type</option>
                  {subCategories.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="0.00"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sizes / Units Available</label>
                <input
                  type="text"
                  name="sizes"
                  value={formData.sizes}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="e.g., S, M, L, 1-2 Yrs, King Size, Per Mtr"
                />
                <p className="text-xs text-gray-500 mt-1">Separate sizes with commas. Leave blank if standard piece.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
              <div className="mt-1 flex justify-center px-4 sm:px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-2 py-1 shadow-sm border border-gray-200"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  {selectedFile && (
                    <p className="text-xs sm:text-sm font-medium text-green-600 mt-2 truncate max-w-[250px] mx-auto">Selected: {selectedFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
                placeholder="Brief product description..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-70 transition-colors w-full sm:w-auto"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Create Product</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
