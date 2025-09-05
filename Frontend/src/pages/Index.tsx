import React from 'react';
// import Image from 'next/image';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Shield, BookOpen, LifeBuoy, AlertTriangle } from "lucide-react";

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/CBE.jpg"
              alt="CBE Logo"
              className="h-12 w-auto object-contain"
            />
            <span className="ml-4 text-xl font-semibold text-gray-800">CBE Project Management System</span>
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <Button className="bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <div className="flex gap-4">
                <Button className="bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button className="bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-900 to-fuchsia-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to CBE's Project Management Portal
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Collaborate, manage, and track your projects with ease.
          </p>
          {!isAuthenticated && (
            <Button className="bg-white text-fuchsia-800 hover:bg-gray-100 text-lg px-8 py-6 rounded-lg" asChild>
              <Link to="/login">Get Started</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link to="#" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <BookOpen className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Documentation</h3>
              <p className="text-gray-600">Access system guides and manuals</p>
            </Link>
            <Link to="#" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <LifeBuoy className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Help Center</h3>
              <p className="text-gray-600">Get support and troubleshooting help</p>
            </Link>
            <Link to="#" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <AlertTriangle className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Report a Bug</h3>
              <p className="text-gray-600">Submit system issues and feedback</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="py-12 bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Security Notice</h2>
          <p className="max-w-2xl mx-auto">
            This system is for authorized CBE personnel only. Unauthorized access is strictly prohibited.
            All activities are monitored and logged for security purposes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4">© 2025 Commercial Bank of Ethiopia. All rights reserved.</p>
          <p className="text-sm text-gray-400">Internal use only. Unauthorized access prohibited.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
