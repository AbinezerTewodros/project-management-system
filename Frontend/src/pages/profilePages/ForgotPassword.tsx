import React from 'react';
import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // TODO: Implement actual password reset logic
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            toast({
                title: "Success",
                description: "Password reset instructions have been sent to your email.",
            });
            setEmail("");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send reset instructions. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-md mx-auto space-y-6">
                <Card className="border-purple-dark shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
                        <CardDescription className="text-center">
                            Enter your email address and we'll send you instructions to reset your password
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@outlook.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Instructions
                                    </>
                                ) : (
                                    "Send Reset Instructions"
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

export default ForgotPassword;
