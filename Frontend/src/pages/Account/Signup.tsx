import React from 'react';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { UserRole } from "@/types/auth";
import RoleDropdown from "@/components/RoleDropdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SignUp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!email.toLowerCase().includes("outlook.com")) {
      setError("Please use your Outlook email address");
      return;
    }

    // Added username validation
    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    setLoading(true);

    try {
      await signup(email, employeeId, role, username, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to create account. Please try again.");
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

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-purple-800 p-8 text-center">
            <div className="mb-4">
              <UserPlus className="h-10 w-10 text-white mx-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Create an Account
            </CardTitle>
            <CardDescription className="text-blue-100">
              Enter user details to create a new account
            </CardDescription>
          </div>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Submission error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 bg-gray-50 dark:bg-gray-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Outlook Email</Label>
                <Input
                  id="email"
                  placeholder="name@outlook.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 bg-gray-50 dark:bg-gray-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  placeholder="e.g., EMP12345"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 bg-gray-50 dark:bg-gray-700/50"
                />
              </div>
              <div className="space-y-2">
                <RoleDropdown
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  error={error && role === "" ? error : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 bg-gray-50 dark:bg-gray-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 bg-gray-50 dark:bg-gray-700/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <div className="w-full text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account? <Link to="/login" className="text-blue-700 dark:text-blue-300 font-medium">Sign in</Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
