import React, { useState } from 'react';
import { Upload, Camera, Drone, Image as ImageIcon } from 'lucide-react';

interface DashboardProps {
  onSelectOption: (option: 'drone' | 'single') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectOption }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      // TODO: Handle the file upload and prediction
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Crop Health Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Drone Surveying Option */}
        <div 
          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          onClick={() => onSelectOption('drone')}
        >
          <div className="p-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4 mx-auto">
              <Drone className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Drone Surveying</h2>
            <p className="text-gray-600 text-center">Upload drone survey images to generate orthomosaics and analyze large areas.</p>
          </div>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-blue-600 font-medium text-center">
              Get Started <span aria-hidden="true">→</span>
            </div>
          </div>
        </div>

        {/* Single Image Upload Option */}
        <div 
          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          onClick={() => onSelectOption('single')}
        >
          <div className="p-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4 mx-auto">
              <ImageIcon className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Single Image Analysis</h2>
            <p className="text-gray-600 text-center">Upload a single crop image for quick health assessment and recommendations.</p>
          </div>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-green-600 font-medium text-center">
              Get Started <span aria-hidden="true">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
