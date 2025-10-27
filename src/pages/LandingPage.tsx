import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, BarChart2, ShieldCheck, Zap } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <header className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">Verdis</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a>
              <Link to="/app" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                Launch App
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Intelligent Crop Health Monitoring
              </h1>
              <p className="mt-4 text-xl text-gray-600">
                Harness the power of AI to monitor, analyze, and optimize your agricultural operations with real-time insights.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/app" 
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a 
                  href="#how-it-works" 
                  className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 h-full flex items-center">
              <div className="bg-gray-100 rounded-2xl p-2 shadow-xl w-full h-96 overflow-hidden">
                <img 
                  src="/farm.jpg" 
                  alt="Crop Health Dashboard" 
                  className="w-full h-full object-cover rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Powerful Features</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to monitor and optimize your farm's health and productivity.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: <BarChart2 className="h-8 w-8 text-primary-600" />,
                title: 'Real-time Analytics',
                description: 'Get instant insights into your crop health with our advanced analytics dashboard.'
              },
              {
                icon: <ShieldCheck className="h-8 w-8 text-primary-600" />,
                title: 'Disease Detection',
                description: 'Early detection of plant diseases before they spread across your fields.'
              },
              {
                icon: <Zap className="h-8 w-8 text-primary-600" />,
                title: 'Smart Alerts',
                description: 'Receive instant notifications about critical issues affecting your crops.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary-50 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with Verdis in just a few simple steps.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Upload Your Data',
                description: 'Connect your drone or upload satellite imagery of your fields.'
              },
              {
                step: '2',
                title: 'AI Analysis',
                description: 'Our AI processes the data to detect crop health issues and patterns.'
              },
              {
                step: '3',
                title: 'Get Insights',
                description: 'View detailed reports and actionable insights on your dashboard.'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to optimize your farm's health?</h2>
          <p className="mt-4 text-xl text-primary-100 max-w-3xl mx-auto">
            Join hundreds of farmers who trust Verdis for their crop monitoring needs.
          </p>
          <div className="mt-8">
            <Link 
              to="/app" 
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-100 md:py-4 md:text-lg md:px-10 transition-colors"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-base text-gray-500 text-center">
              &copy; {new Date().getFullYear()} Verdis. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
