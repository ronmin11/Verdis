import React, { useState } from 'react';
import { Upload, X, Drone, RotateCw, Map, BarChart3, Download, Eye } from 'lucide-react';

interface DroneSurveyProps {
  onBack: () => void;
}

interface SurveyResult {
  id: string;
  survey_name: string;
  survey_date: string;
  orthomosaic_path?: string;
  ndvi_path?: string;
  processing_time?: number;
  status: string;
  notes?: string;
}

const DroneSurvey: React.FC<DroneSurveyProps> = ({ onBack }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>([]);
  const [projectName, setProjectName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;
      setSelectedFiles(files);
      
      // Create preview URLs for the first few images
      const urls: string[] = [];
      const maxPreviews = Math.min(files.length, 6);
      for (let i = 0; i < maxPreviews; i++) {
        urls.push(URL.createObjectURL(files[i]));
      }
      setPreviewUrls(urls);
    }
  };

  const handleRemoveFiles = () => {
    setSelectedFiles(null);
    setPreviewUrls([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
  };

  const processSurvey = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select image files first');
      return;
    }

    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      
      // Add all files
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }
      
      // Add project name
      formData.append('project_name', projectName);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

      const response = await fetch('http://localhost:8000/api/process-drone-survey', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        throw new Error(`Survey processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Add the new survey to results
        setSurveyResults(prev => [result.survey, ...prev]);
        
        // Reset form
        handleRemoveFiles();
        setProjectName('');
      } else {
        throw new Error('Survey processing failed');
      }

    } catch (error) {
      console.error('Survey processing error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('404')) {
        alert('Backend server is not running. Please start the backend server first.');
      } else {
        alert(`Survey processing failed: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const loadSurveyHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/drone-surveys');
      if (response.ok) {
        const data = await response.json();
        setSurveyResults(data.surveys || []);
      } else {
        console.warn('Could not load survey history');
      }
    } catch (error) {
      console.error('Error loading survey history:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </button>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Drone Survey Processing</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Drone className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Upload Drone Images</h2>
              <p className="text-sm text-gray-500">
                Upload multiple aerial images for orthomosaic and NDVI processing.
              </p>
            </div>
            
            {!selectedFiles ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="drone-upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
                <label
                  htmlFor="drone-upload"
                  className={`cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, TIFF up to 50MB each
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {selectedFiles.length} files selected
                  </h3>
                  <button
                    type="button"
                    onClick={handleRemoveFiles}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Image Previews */}
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                  {selectedFiles.length > 6 && (
                    <div className="flex items-center justify-center h-20 bg-gray-100 rounded-lg text-xs text-gray-500">
                      +{selectedFiles.length - 6} more
                    </div>
                  )}
                </div>
                
                {/* Project Name Input */}
                <div>
                  <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isProcessing}
                  />
                </div>
                
                {/* Processing Status */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center py-4">
                      <RotateCw className="animate-spin h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-600">Processing survey...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {Math.round(processingProgress)}% complete
                    </p>
                  </div>
                )}
                
                {/* Process Button */}
                <button
                  onClick={processSurvey}
                  disabled={!selectedFiles || selectedFiles.length === 0 || !projectName.trim() || isProcessing}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <RotateCw className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Drone className="h-4 w-4 mr-2" />
                      Process Survey
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-3">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Survey Results</h3>
              </div>
              <button
                onClick={loadSurveyHistory}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Load History
              </button>
            </div>
            
            {surveyResults.length === 0 ? (
              <div className="text-center py-12">
                <Map className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No surveys processed yet.</p>
                <p className="text-sm text-gray-400">Upload and process your first drone survey.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {surveyResults.map((survey) => (
                  <div key={survey.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{survey.survey_name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        survey.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {survey.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {new Date(survey.survey_date).toLocaleDateString()}
                      {survey.processing_time && ` • ${survey.processing_time}s`}
                    </p>
                    
                    <div className="flex space-x-2">
                      {survey.orthomosaic_path && (
                        <button className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors">
                          <Eye className="h-3 w-3 mr-1" />
                          View Orthomosaic
                        </button>
                      )}
                      {survey.ndvi_path && (
                        <button className="flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          View NDVI
                        </button>
                      )}
                      <button className="flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </button>
                    </div>
                    
                    {survey.notes && (
                      <p className="text-xs text-gray-500 mt-2">{survey.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneSurvey;
