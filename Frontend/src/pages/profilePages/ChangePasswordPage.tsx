import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet';
import { useAuth } from "@/context/AuthContext";

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialchar: false,
    match: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (newPassword: string, confirmPassword: string) => {
    const isMatch = newPassword === confirmPassword && newPassword !== '';
    setRequirements(prev => ({
      ...prev,
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      specialchar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      match: isMatch
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requirements.match) {
      setError('New Passwords do not match');
      return;
    }
    if (!requirements.length || !requirements.uppercase || !requirements.number || !requirements.specialchar) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Profile password change - calling changePassword function');
      await changePassword(currentPassword, newPassword);
      console.log('Profile password change - success');
      setSuccess(true);
    } catch (err: any) {
      console.error('Profile password change - error:', err);
      setError(err.message || 'Failed to change password. Please check your current password and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = Object.values(requirements).every(Boolean);

  return (
    <div className="relative w-full mx-auto p-4 min-h-screen bg-white dark:bg-zinc-800 dark:text-gray-200  rounded-lg">
      <Helmet>
        <title>Change Password</title>
      </Helmet>
              <button
                onClick={() => {
                  // Navigate to dashboard based on normalized role from AuthContext
                  const role = user?.role || "";
                  // Common roles in the app use paths like /dashboard/<role>
                  // Admin should go to /dashboard/admin, members to /dashboard/member, etc.
                  const target = role ? `/dashboard/${role}` : "/dashboard";
                  navigate(target);
                }}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-400 dark:hover:text-gray-200 transition-colors bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft size={18} /> Back
              </button>
            
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-800/95 rounded-2xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-purple-800 p-6">
          <div className="flex items-center gap-3">
            <Lock size={24} className="text-white" />
            <h1 className="text-2xl font-bold text-white">Change Password</h1>
          </div>
          <p className="text-blue-100 mt-1">Secure your account</p>
        </div>
        {success ? (
          <div className="p-6 text-center">
            <CheckCircle className="mx-auto text-green-500" size={48} />
            <h2 className="text-xl font-semibold mt-4">Password Updated</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Your password has been successfully changed.</p>
            <button
              onClick={() => navigate('/dashboard/admin')}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 pr-10 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    validatePassword(e.target.value, confirmPassword);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 pr-10 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Password Requirements:</h3>
              <ul className="space-y-1 text-sm">
                <li className={`flex items-center ${requirements.length ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                  {requirements.length ? '✓' : '.'} At least 8 characters
                </li>
                <li className={`flex items-center ${requirements.uppercase ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                  {requirements.uppercase ? '✓' : '.'} At least 1 uppercase letter
                </li>
                <li className={`flex items-center ${requirements.number ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                  {requirements.number ? '✓' : '.'} At least 1 number
                </li>
                <li className={`flex items-center ${requirements.specialchar ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                  {requirements.specialchar ? '✓' : '.'} At least 1 special character
                </li>
                <li className={`flex items-center ${requirements.match ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                  {requirements.match ? '✓' : '.'} Passwords match
                </li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    validatePassword(newPassword, e.target.value);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg pr-10 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 ${requirements.match ? 'focus:ring-green-300' : 'focus:ring-blue-500/20 dark:focus:ring-blue-400/20'}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={!isPasswordValid || isLoading}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${(!isPasswordValid || isLoading) ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'}`}
              >
                {isLoading ? 'Processing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ChangePasswordPage;
