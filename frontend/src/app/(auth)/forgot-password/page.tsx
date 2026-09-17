'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, MessageCircle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState('');

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      toast.error('Please enter your email or registered mobile / WhatsApp number');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(cleanId);
      const data = (res as any)?.data || res;
      setResolvedEmail(data?.identifier || cleanId);
      toast.success('If an account exists, a 6-digit reset code has been sent.');
      setStep('reset');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to request reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the 6-digit reset code');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must include uppercase, lowercase, number, and special character (@$!%*?&)');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: resolvedEmail || identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success('Password reset successfully!');
      setStep('success');
    } catch (error: any) {
      toast.error(error?.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp Support URL
  const supportPhone = '919898270987';
  const whatsappMsg = encodeURIComponent(
    `Hello K D A Team, I forgot my account password. My registered detail is: ${identifier || '[Enter Email or Phone]'}. Please help me regain access to my account.`
  );
  const whatsappUrl = `https://wa.me/${supportPhone}?text=${whatsappMsg}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">

        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>

        {step === 'request' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="h-6 w-6 text-gray-800" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Forgot Password?</h1>
              <p className="text-gray-500 text-sm">
                Enter your registered email address or mobile / WhatsApp number below.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email or Registered Mobile Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input-brand !pl-11 pr-4 text-sm w-full"
                    placeholder="name@example.com or 9876543210"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-black text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-70 text-sm"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending Reset Code...</>
                ) : (
                  <>Send Reset Code</>
                )}
              </button>
            </form>

            {/* WhatsApp Direct Help Card */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-emerald-900">Need Help via WhatsApp?</h3>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed mb-3">
                  If you registered using your WhatsApp number, our team can help you directly via WhatsApp on <strong>+91 9898270987</strong>.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp with Support
                </a>
              </div>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Reset Password</h1>
              <p className="text-gray-500 text-sm">
                Enter the 6-digit code sent for <span className="font-medium text-gray-900">{identifier}</span>
              </p>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
              >
                Change identifier
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* OTP Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  6-Digit Verification Code (OTP)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input-brand !pl-11 pr-4 text-sm w-full tracking-widest font-mono"
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-brand !pl-11 !pr-11 text-sm w-full"
                    placeholder="Enter new password (min 8 characters)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-brand !pl-11 !pr-11 text-sm w-full"
                    placeholder="Repeat new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-black text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-70 text-sm"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Resetting Password...</>
                ) : (
                  <>Set New Password</>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 font-medium"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Didn't receive code? Get help on WhatsApp
              </a>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-all text-sm"
            >
              Go to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
