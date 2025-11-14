import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // ✅ BACKEND FIXED: Admin users are now handled properly by backend
  // No need for frontend admin protection

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Password change form submitted');
    console.log('Current password length:', currentPassword.length);
    console.log('New password length:', newPassword.length);
    console.log('Confirm password length:', confirmPassword.length);
    
    // Validation
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New passwords do not match.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
      });
      return;
    }

    setLoading(true);
    console.log('Starting password change process...');
    
    try {
      // Get current user info from AuthContext or localStorage
      let username = '';
      
      if (user?.username || user?.userName) {
        username = user.username || user.userName;
        console.log('Got username from AuthContext:', username);
      } else {
        // Fallback: try to get from localStorage
        const userData = localStorage.getItem('user');
        console.log('User data from localStorage:', userData);
        if (userData) {
          const parsedUser = JSON.parse(userData);
          username = parsedUser.username || parsedUser.userName;
          console.log('Got username from localStorage:', username);
        }
      }
      
      if (!username) {
        console.error('No username found!');
        console.log('Available user data:', user);
        console.log('Available localStorage keys:', Object.keys(localStorage));
        
        // ✅ FIX: Try to extract username from JWT token as fallback
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          try {
            const payload = JSON.parse(atob(authToken.split('.')[1]));
            console.log('🔍 JWT payload:', payload);
            username = payload.sub || payload.username || payload.userName;
            console.log('✅ Username extracted from JWT:', username);
          } catch (jwtError) {
            console.error('❌ Failed to extract username from JWT:', jwtError);
          }
        }
        
        if (!username) {
          throw new Error('User session expired. Please login again.');
        }
      }
      
      console.log('Changing password for user:', username);
      console.log('Auth token available:', !!localStorage.getItem('authToken'));
      console.log('🔍 Full user object from AuthContext:', user);
      console.log('🔍 User data from localStorage:', localStorage.getItem('user'));
      
      // ✅ FIX: Use authService instead of direct fetch
      console.log('Calling authService.changePassword with:', {
        username: username,
        currentPasswordLength: currentPassword.length,
        newPasswordLength: newPassword.length
      });
      
      // Additional debugging for password change
      console.log('🔍 Password change details:');
      console.log('- Username:', username);
      console.log('- Current password (first 3 chars):', currentPassword.substring(0, 3) + '***');
      console.log('- New password (first 3 chars):', newPassword.substring(0, 3) + '***');
      console.log('- Current password length:', currentPassword.length);
      console.log('- New password length:', newPassword.length);
      
      const response = await authService.changePassword({
        username: username,
        currentPassword,
        newPassword,
        confirmPassword: newPassword // This is only for frontend validation, not sent to backend
      });

      console.log('Password change response:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);
      console.log('Response message:', response.message);

      // ✅ FIX: Handle backend response format - backend returns { message: "..." }
      if (!response.success) {
        console.error('Password change failed:', response.message);
        throw new Error(response.message || 'Failed to change password');
      }
      
      // Check if backend returned success message
      if (response.data && response.data.message) {
        console.log('Backend message:', response.data.message);
      }
      
      console.log('Password change successful!');

      // Clear first login flag
      localStorage.removeItem('isFirstLogin');
      localStorage.removeItem('firstLoginMessage');
      
      toast({
        title: 'Success',
        description: 'Password changed successfully. You can now access the dashboard.',
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to change password. Please try again.',
      });
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
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="flex items-center gap-2 text-purple-600 dark:text-purple-300 hover:text-purple-400 dark:hover:text-purple-200 transition-colors bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-700/80 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
          aria-label="Back to Login"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Change Password Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-purple-800 p-8 text-center">
            <div className="mb-4">
              <Shield className="h-12 w-12 text-white mx-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Change Password
            </CardTitle>
            <CardDescription className="text-blue-100">
              This is your first login. Please change your password to continue.
            </CardDescription>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password Field */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Shield className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Minimum 6 characters</p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Change Password Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </CardContent>

          {/* Footer */}
          <div className="p-8 pt-0">
            <div className="w-full text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Secure password change for CBE personnel
              </p>
              <div className="flex items-center justify-center mt-2 space-x-1 text-xs text-gray-500 dark:text-gray-500">
                <Shield className="h-3 w-3" />
                <span>256-bit SSL encryption</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;
