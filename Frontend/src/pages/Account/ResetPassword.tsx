// src/components/ResetPassword.tsx
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Eye, EyeOff, Shield, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Passwords do not match.',
      });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/Auth/reset-password', { token, newPassword: password, confirmPassword });
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password.');
      }
      setPasswordReset(true);
      toast({
        title: 'Success',
        description: 'Your password has been reset successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reset password. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4 relative">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/cbe_new_bldg.jpg"
            alt="CBE Background"
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-gray-900/80 dark:to-blue-900/80"></div>
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Success Card */}
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-8 text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 w-fit mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-white mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Password Reset Successfully
              </CardTitle>
              <CardDescription className="text-green-100">
                Your password has been updated
              </CardDescription>
            </div>

            <CardContent className="p-8">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800 mb-6">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">Next Steps</p>
                  <ul className="text-xs text-green-700 dark:text-green-300 space-y-1 text-left">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      Return to the login page
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      Sign in with your new password
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      Access your account dashboard
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Continue to Login
                </Button>
              </div>
            </CardContent>

            <CardFooter className="p-8 pt-0">
              <div className="w-full text-center">
                <div className="flex items-center justify-center mt-2 space-x-1 text-xs text-gray-500 dark:text-gray-500">
                  <Shield className="h-3 w-3" />
                  <span>Secure password reset completed</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4 relative">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/cbe_new_bldg.jpg"
            alt="CBE Background"
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-gray-900/80 dark:to-blue-900/80"></div>
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Invalid Token Card */}
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-center">
              <div className="mb-4 mt-4"></div>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-red-100">
                This password reset link is invalid or has expired.
              </CardDescription>
            </div>
            
            <CardContent className="p-8">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 mb-6">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Possible reasons:</p>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    The link has already been used
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    The link has expired (usually after 24 hours)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    The link was modified or is incorrect
                  </li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="p-8 pt-0">
              <div className="w-full text-center">
                <Link 
                  to="/forgot-password" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                >
                  Request a new reset link
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4 relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/cbe_new_bldg.jpg"
          alt="CBE Background"
          className="w-full h-full object-cover opacity-20 dark:opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-gray-900/80 dark:to-blue-900/80"></div>
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Reset Password Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-purple-800 p-8 text-center">
            <div className="mb-4 mt-4"></div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Reset Password
            </CardTitle>
            <CardDescription className="text-blue-100">
              Enter your new password below
            </CardDescription>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Shield className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Information Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Password Requirements:</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    At least 8 characters long
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Include uppercase and lowercase letters
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Include at least one number and special character
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="p-8 pt-0">
            <div className="w-full text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
              <div className="flex items-center justify-center mt-2 space-x-1 text-xs text-gray-500 dark:text-gray-500">
                <Shield className="h-3 w-3" />
                <span>Secure password reset</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;