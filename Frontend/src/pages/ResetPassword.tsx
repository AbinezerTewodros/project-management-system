import React from 'react';
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Passwords do not match.",
            });
            return;
        }

        setLoading(true);

        try {
            // TODO: Implement actual password reset logic
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            toast({
                title: "Success",
                description: "Your password has been reset successfully.",
            });
            navigate("/login");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to reset password. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-white p-6">
                <div className="max-w-md mx-auto space-y-6">
                    <Card className="border-purple-dark shadow-lg">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl text-center">Invalid Reset Link</CardTitle>
                            <CardDescription className="text-center">
                                This password reset link is invalid or has expired.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center">
                            <Link to="/forgot-password" className="text-purple hover:text-purple-dark font-medium">
                                Request a new reset link
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-md mx-auto space-y-6">
                <Card className="border-purple-dark shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
                        <CardDescription className="text-center">
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
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
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting Password
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-sm text-muted-foreground">
                            Remember your password?{" "}
                            <Link to="/login" className="text-purple hover:text-purple-dark font-medium">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ResetPassword;
