// src/components/ForgotPassword.tsx
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api';

const ForgotPassword: React.FC = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/Auth/forgot-password', { username });
      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset link.');
      }
      toast({
        title: 'Success',
        description: 'A password reset link has been sent to your email.',
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Forgot Password Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-purple-800 p-8 text-center">
            <div className="mb-4 mt-4"></div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-blue-100">
              Enter your username to receive a reset link
            </CardDescription>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">How it works:</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Enter your registered username
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    We will send a secure reset link
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Click the link to create a new password
                  </li>
                </ul>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
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
                <span>Secure password recovery</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
