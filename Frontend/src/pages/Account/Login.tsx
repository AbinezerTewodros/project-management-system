// src/components/Login.tsx
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, Eye, EyeOff, Shield, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      // redirect through /dashboard so DashboardRedirect can send the user to their role-based home
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      setErrorMessage(null);
      await login(username, password);
    } catch (error: any) {
      // ✅ BACKEND FIXED: Handle first login flow from fixed backend
      if (error.message === "FIRST_LOGIN_REQUIRED") {
        navigate('/change-password');
        return;
      }

      // Show a clear inline message for backend connection errors
      if (error?.status === 0 || error?.message?.includes('Cannot connect to backend') || error?.message?.includes('backend is running')) {
        setErrorMessage(error?.message || 'Cannot connect to backend server. Please ensure the backend is running on port 8080.');
        return;
      }

      // Show a clear inline message for invalid credentials
      if (error?.status === 401 || /invalid|incorrect/i.test(error?.message || '')) {
        setErrorMessage('Incorrect username or password.');
        return;
      }

      // Fallback: show any other error inline
      setErrorMessage(error?.message || 'Failed to login. Please try again.');
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

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-blue-900 to-purple-800 p-8 text-center">
            <div className="mb-4 mt-4">
              {/* <img src="/cbelogo.png" alt="CBE Logo" className="h-12 w-auto mx-auto" /> */}
            </div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-blue-100">
              Sign in to your CBE Project Management account
            </CardDescription>
          </div>

          <CardContent className="p-8">
            {errorMessage && (
              <div className="mb-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid credentials</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    onChange={(e) => { setUsername(e.target.value); if (errorMessage) setErrorMessage(null); }}
                    required
                    className="pl-10 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errorMessage) setErrorMessage(null); }}
                    required
                    className="pl-10 pr-10 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Shield className="h-4 w-4 text-gray-400" />
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="p-8 pt-0">
            <div className="w-full text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Secure access for CBE personnel only
              </p>
              <div className="flex items-center justify-center mt-2 space-x-1 text-xs text-gray-500 dark:text-gray-500">
                <Shield className="h-3 w-3" />
                <span>256-bit SSL encryption</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
