import React, { useMemo } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Shield, BookOpen, LifeBuoy, AlertTriangle, ArrowRight, Users, BarChart3, Clock, CheckCircle } from "lucide-react";

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Memoize the auth state to prevent unnecessary re-renders
  const authButtons = useMemo(() => {
    if (isAuthenticated) {
      return (
        <Button className="fixed right-14 top-11 bg-gradient-to-r from-blue-700 to-purple-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
          <Link to="/dashboard" className="flex items-center ">
            Go to Dashboard
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      );
    } else {
      return (
        <Button className="fixed right-14 top-11 bg-gradient-to-r from-blue-400 to-purple-700  text-white font-semibold px-6 py-3 lg:px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
          <Link to="/login" className="flex items-center ">
            Sign In
            <ArrowRight className="h-4 w-3" />
          </Link>
        </Button>
      );
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between ">
          
            <div className="ml-5">
              <img
                src="/cbelogo.png"
                alt="CBE Logo"
                className="h-20 w-auto "
              />
            </div>
          
          <div className="mr-5">
            {authButtons}
          </div>
        
      </div>
    </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/cbe_new_bldg.jpg"
            alt="CBE Building"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Welcome to CBE's
              <span className="block mb-5 my-auto bg-gradient-to-r from-yellow-400 to-yellow-700 bg-clip-text text-transparent">
                Project Management Portal
              </span>
            </h1>
            <p className="text-xl md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
              Streamline your projects, enhance collaboration, and drive success with our comprehensive project management solution designed for CBE's dynamic environment.
            </p>
            {!isAuthenticated && (
              <Button className="bg-gradient-to-r from-yellow-600 to-yellow-700  font-bold text-lg px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105" asChild>
                <Link to="/login" className="flex items-center gap-3">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the power of modern project management tailored for CBE's unique requirements
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-6 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 mb-6">
                <Users className="h-12 w-12 text-white mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Team Collaboration</h3>
              <p className="text-gray-600">Seamlessly work together with your team members across different departments</p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-400 to-teal-500 p-6 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 mb-6">
                <BarChart3 className="h-12 w-12 text-white mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Analytics</h3>
              <p className="text-gray-600">Track project progress with comprehensive dashboards and reports</p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 mb-6">
                <Clock className="h-12 w-12 text-white mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Time Management</h3>
              <p className="text-gray-600">Efficiently manage deadlines and milestones with smart scheduling tools</p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 mb-6">
                <CheckCircle className="h-12 w-12 text-white mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Assurance</h3>
              <p className="text-gray-600">Ensure high standards with built-in quality control and approval workflows</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Quick Access</h2>
            <p className="text-xl text-gray-600">Everything you need at your fingertips</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Link to="#" className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Documentation</h3>
              <p className="text-gray-600 mb-6">Access comprehensive system guides, user manuals, and best practices</p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Learn More <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link to="#" className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
              <div className="bg-gradient-to-br from-green-100 to-teal-100 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <LifeBuoy className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Help Center</h3>
              <p className="text-gray-600 mb-6">Get 24/7 support, troubleshooting guides, and expert assistance</p>
              <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Get Support <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link to="#" className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Report Issues</h3>
              <p className="text-gray-600 mb-6">Submit bug reports, feature requests, and system feedback</p>
              <div className="flex items-center text-orange-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Report Now <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="relative py-20 bg-gradient-to-r from-gray-900 to-blue-900 text-white overflow-hidden">
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
            <div className="bg-gradient-to-br from-blue-400 to-purple-800 p-6 rounded-2xl w-fit mx-auto mb-8">
              <Shield className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Security & Compliance</h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed mb-8">
              This system is exclusively for authorized CBE personnel. All activities are continuously monitored,
              logged, and protected by enterprise-grade security measures to ensure the highest standards of data protection and compliance.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Multi-factor Authentication</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Activity Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <p className="text-gray-400 leading-relaxed">
                Empowering CBE teams with modern project management tools designed for banking excellence.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Report Issues</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">System Status</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Contact Support</h4>
              <div className="space-y-3 text-gray-400">
                <p>IT Support: support@cbe.et</p>
                <p>Phone: +251 11 5 17 17 17</p>
                <p>Internal Extension: 1234</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 mb-2">© 2025 Commercial Bank of Ethiopia. All rights reserved.</p>
            <p className="text-sm text-gray-500">Internal use only. Unauthorized access is strictly prohibited.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
