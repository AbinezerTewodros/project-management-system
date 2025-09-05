import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet';
import { useAuth } from "@/context/AuthContext";

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword } = useAuth();
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
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError('Failed to change password. Please check your current password and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = Object.values(requirements).every(Boolean);

  return (
    <div className="w-full mx-auto mt-18 p-6 min-h-screen bg-gray-50 shadow-md rounded-lg">
      <Helmet>
        <title>Change Password</title>
      </Helmet>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-purple-600 mb-6 hover:text-purple-800 transition-colors"
      >
        <ArrowLeft size={20} /> Back
      </button>
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6">
          <div className="flex items-center gap-3">
            <Lock size={24} className="text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800">Change Password</h1>
          </div>
          <p className="text-gray-600 mt-1">Secure your account</p>
        </div>
        {success ? (
          <div className="p-6 text-center">
            <CheckCircle className="mx-auto text-green-500" size={48} />
            <h2 className="text-xl font-semibold mt-4">Password Updated</h2>
            <p className="text-gray-600 mt-2">Your password has been successfully changed.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-300 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    validatePassword(e.target.value, confirmPassword);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-300 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h3>
              <ul className="space-y-1 text-sm">
                <li className={`flex items-center ${requirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                  {requirements.length ? '✓' : '.'} At least 8 characters
                </li>
                <li className={`flex items-center ${requirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  {requirements.uppercase ? '✓' : '.'} At least 1 uppercase letter
                </li>
                <li className={`flex items-center ${requirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                  {requirements.number ? '✓' : '.'} At least 1 number
                </li>
                <li className={`flex items-center ${requirements.specialchar ? 'text-green-600' : 'text-gray-500'}`}>
                  {requirements.specialchar ? '✓' : '.'} At least 1 special character
                </li>
                <li className={`flex items-center ${requirements.match ? 'text-green-600' : 'text-gray-500'}`}>
                  {requirements.match ? '✓' : '.'} Passwords match
                </li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    validatePassword(newPassword, e.target.value);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${requirements.match ? 'focus:ring-green-300' : 'focus:ring-purple-300'} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={!isPasswordValid || isLoading}
                className={`w-full py-2 px-4 rounded-lg font-medium ${!isPasswordValid || isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                  } transition-colors`}
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
