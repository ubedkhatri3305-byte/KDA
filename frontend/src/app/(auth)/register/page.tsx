'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2, User, Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/api';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  whatsappNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit WhatsApp number')
    .optional()
    .or(z.literal('')),
  sameAsPhone: z.boolean().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Must include uppercase, lowercase, number, and special character (@$!%*?&)',
    ),
  confirmPassword: z.string(),
  whatsappConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to WhatsApp contact to complete registration',
  }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { sameAsPhone: false, whatsappConsent: false },
  });

  const sameAsPhone = watch('sameAsPhone');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const whatsapp = sameAsPhone ? data.phone : (data.whatsappNumber || data.phone);
      await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        whatsappNumber: whatsapp,
        whatsappConsent: data.whatsappConsent,
        password: data.password,
      });
      setStep('success');
      toast.success('Account created! Please verify your email.');
    } catch (error: any) {
      toast.error(error?.message || error?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md text-center bg-white rounded-lg p-10 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Registration Successful</h1>
          <p className="text-gray-500 mb-6">
            A verification email has been sent to your inbox. Please verify your email before logging in.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 py-12">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-500 text-sm">Fill in your details below to get started.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  {...register('firstName')}
                  className="input-brand !pl-10 text-sm"
                  placeholder="John"
                  autoComplete="given-name"
                />
              </div>
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  {...register('lastName')}
                  className="input-brand !pl-10 text-sm"
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                {...register('email')}
                className="input-brand !pl-10 text-sm"
                placeholder="john@example.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">+91</span>
              <input
                type="tel"
                {...register('phone')}
                className="input-brand !pl-20 text-sm"
                placeholder="9876543210"
                maxLength={10}
                autoComplete="tel"
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          {/* WhatsApp Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">WhatsApp Contact</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              We use WhatsApp as our primary support channel for order updates.
            </p>

            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                checked={sameAsPhone}
                onChange={(e) => {
                  setValue('sameAsPhone', e.target.checked);
                  if (e.target.checked) setValue('whatsappNumber', '');
                }}
              />
              <span className="text-sm text-gray-700">Same as mobile number</span>
            </label>

            {!sameAsPhone && (
              <div>
                <div className="relative">
                  <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">+91</span>
                  <input
                    type="tel"
                    {...register('whatsappNumber')}
                    className="input-brand !pl-20 text-sm"
                    placeholder="WhatsApp number"
                    maxLength={10}
                  />
                </div>
                {errors.whatsappNumber && <p className="mt-1 text-xs text-red-500">{errors.whatsappNumber.message}</p>}
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="input-brand !pl-10 !pr-10 text-sm"
                placeholder="Create a strong password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword')}
                className="input-brand !pl-10 !pr-10 text-sm"
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          {/* WhatsApp Consent */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('whatsappConsent')}
                className="mt-1 w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <span className="text-sm text-gray-700">
                <ShieldCheck className="inline h-4 w-4 text-gray-500 mr-1 -mt-0.5" />
                I agree to be contacted on WhatsApp for order updates.
              </span>
            </label>
            {errors.whatsappConsent && (
              <p className="mt-2 text-xs text-red-500 ml-7">{errors.whatsappConsent.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-black text-white font-medium rounded-md flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-70"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</>
            ) : (
              <>Create Account</>
            )}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
