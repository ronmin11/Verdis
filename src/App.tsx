import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

// Layout Components
import Header from './components/Layout/Header';

// Page Components
import LandingPage from './pages/LandingPage';
import InteractiveMap from './components/Map/InteractiveMap';

// Mock Data
import { 
  mockFieldBoundaries,
  mockHealthAssessments
} from './data/mockData';

// View Components
const DashboardView: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Dashboard</h2>
    <p>Welcome to your dashboard. Select an option from the menu to get started.</p>
  </div>
);

const DroneSurveyView: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Drone Survey</h2>
    <p>Upload and analyze drone survey data here.</p>
  </div>
);

const SingleImageView: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Single Image Upload</h2>
    <p>Upload a single image for analysis.</p>
  </div>
);

const MapView: React.FC = () => (
  <div className="h-[600px] bg-gray-100 rounded-lg">
    <InteractiveMap 
      healthAssessments={mockHealthAssessments}
      fieldBoundaries={mockFieldBoundaries}
      onLocationSelect={() => {}}
      onAssessmentSelect={() => {}}
    />
  </div>
);

const ReportsView: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Reports</h2>
    <p>View and generate reports here.</p>
  </div>
);

const SettingsView: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Settings</h2>
    <p>Configure your application settings.</p>
  </div>
);

// Wrapper component for the app layout with header and main content
const AppLayoutWrapper: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showChatbot, setShowChatbot] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="drone" element={<DroneSurveyView />} />
          <Route path="single" element={<SingleImageView />} />
          <Route path="map" element={<MapView />} />
          <Route path="reports" element={<ReportsView />} />
          <Route path="settings" element={<SettingsView />} />
        </Routes>
      </main>

      {/* Chatbot Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-40"
        aria-label="Toggle chatbot"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chatbot Panel */}
      {showChatbot && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">AI Assistant</h3>
            <button 
              onClick={() => setShowChatbot(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="p-4 h-80 overflow-y-auto">
            <p className="text-sm text-gray-600">Chat functionality coming soon!</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component with Routing
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app/*" element={<AppLayoutWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
