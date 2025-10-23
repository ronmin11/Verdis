import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';

interface DroneSurveyProps {
  onBack: () => void;
}

const DroneSurvey: React.FC<DroneSurveyProps> = ({ onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [orthomosaicUrl, setOrthomosaicUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      // Simulate file upload progress
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      let uploadedSize = 0;
      
      for (const file of files) {
        // In a real implementation, you would upload to your backend
        // which would then call the OpenDroneMap API
        await new Promise(resolve => {
          const interval = setInterval(() => {
            uploadedSize += file.size / 100;
            const newProgress = Math.min(100, Math.round((uploadedSize / totalSize) * 100));
            setProgress(newProgress);
            
            if (uploadedSize >= file.size) {
              clearInterval(interval);
              resolve(null);
            }
          }, 50);
        });
      }
      
      // After upload, start processing
      setIsUploading(false);
      await processOrthomosaic();
      
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  }, [files]);

  const processOrthomosaic = async () => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would call your backend
      // which would integrate with OpenDroneMap API
      // For now, we'll simulate processing with a timeout
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate getting the orthomosaic URL
      setOrthomosaicUrl('https://example.com/orthomosaic.jpg');
      
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </button>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Drone Survey Analysis</h1>
      
      {!orthomosaicUrl ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Upload Drone Survey Images</h2>
            <p className="text-sm text-gray-500">
              Upload multiple images from your drone survey to generate an orthomosaic.
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="drone-upload"
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading || isProcessing}
            />
            <label
              htmlFor="drone-upload"
              className={`cursor-pointer ${(isUploading || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="space-y-2">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </div>
                <p className="text-xs text-gray-500">
                  JPG, PNG up to 50MB
                </p>
              </div>
            </label>
          </div>
          
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Selected Files ({files.length})</h3>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={uploadFiles}
                  disabled={isUploading || isProcessing || files.length === 0}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(isUploading || isProcessing || files.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Uploading... {progress}%
                    </>
                  ) : isProcessing ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Processing...
                    </>
                  ) : (
                    'Process Survey'
                  )}
                </button>
                
                {isUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Orthomosaic Generated Successfully</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your drone survey has been processed. You can now analyze the orthomosaic.
              </p>
              
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <img 
                  src={orthomosaicUrl} 
                  alt="Generated orthomosaic" 
                  className="w-full h-auto rounded-md"
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Orthomosaic
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Analyze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DroneSurvey;
