import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home, Drone, Camera, Map, BarChart3, Settings } from 'lucide-react';

// Layout Components
import Header from './components/Layout/Header';
import AppLayout from './components/Layout/AppLayout';

// Page Components
import LandingPage from './pages/LandingPage';
import IntegratedDashboard from './components/Dashboard/IntegratedDashboard';
import DroneSurvey from './components/Dashboard/DroneSurvey';
import SingleImageUpload from './components/Dashboard/SingleImageUpload';

// Mock Data
import { 
  mockFieldBoundaries,
  mockHealthAssessments
} from './data/mockData';

// Main App Component with State Management
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'drone' | 'single' | 'map' | 'reports' | 'settings'>('dashboard');

  const handleSelectOption = (option: 'drone' | 'single') => {
    if (option === 'drone') {
      setCurrentView('drone');
    } else if (option === 'single') {
      setCurrentView('single');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };


  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/app/dashboard' },
    { id: 'drone', label: 'Drone Survey', icon: Drone, path: '/app/drone' },
    { id: 'single', label: 'Image Analysis', icon: Camera, path: '/app/single' },
    { id: 'map', label: 'Farm Map', icon: Map, path: '/app/map' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/app/reports' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/app/settings' },
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <IntegratedDashboard />;
      case 'drone':
        return <DroneSurvey onBack={handleBackToDashboard} />;
      case 'single':
        return <SingleImageUpload onBack={handleBackToDashboard} />;
      case 'map':
        return <IntegratedDashboard />;
      case 'reports':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reports</h2>
            <p>View and generate reports here.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <p>Configure your application settings.</p>
          </div>
        );
      default:
        return <IntegratedDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppLayout 
        navigationItems={navigationItems}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        {renderCurrentView()}
      </AppLayout>

    </div>
  );
};

// Main App Component with Routing
const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app/*" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
