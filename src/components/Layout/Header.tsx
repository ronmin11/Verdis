import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sprout, Map, ChartBar as BarChart3, Settings, Menu, Home, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface HeaderProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  isMobileMenuOpen 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/app/dashboard' },
    { id: 'map', label: 'Map View', icon: Map, path: '/app/map' },
    { id: 'drone', label: 'Drone Survey', icon: Upload, path: '/app/drone' },
    { id: 'single', label: 'Single Image', icon: ImageIcon, path: '/app/single' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/app/reports' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/app/settings' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Verdis</h1>
              <p className="text-xs text-gray-500">Precision Agriculture Platform</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            <Link
              to="/"
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2',
                location.pathname === '/' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.id || 
                             (currentPath === 'app' && item.id === 'dashboard');
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2',
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.id;
                
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={onMenuToggle}
                    className={cn(
                      'flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;