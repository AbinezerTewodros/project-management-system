import React from 'react';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/types/auth";
import RoleDropdown from "@/components/RoleDropdown";

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
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* <h1 className="text-3xl font-bold text-center">Sign Up</h1> */}
        <Card className="border-purple-dark shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
            {/* <CardDescription className="text-center">
              Enter your information to get started
            </CardDescription> */}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="border-purple-dark/50 focus:border-purple"
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
                  className="border-purple-dark/50 focus:border-purple"
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
                  className="border-purple-dark/50 focus:border-purple"
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
                  className="border-purple-dark/50 focus:border-purple"
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
                  className="border-purple-dark/50 focus:border-purple"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded"
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
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-purple hover:text-purple-dark font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
        {/* <button className="w-full bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded">
          Back to Login
        </button> */}
      </div>
    </div>
  );
};

export default SignUp;
