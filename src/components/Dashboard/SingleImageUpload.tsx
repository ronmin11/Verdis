import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Send, RotateCw } from 'lucide-react';

interface SingleImageUploadProps {
  onBack: () => void;
  onSendToChatbot: (message: string) => void;
}

const SingleImageUpload: React.FC<SingleImageUploadProps> = ({ onBack, onSendToChatbot }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{
    class: string;
    confidence: number;
    description: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPrediction(null); // Reset previous prediction
      
      // Simulate prediction (replace with actual model inference)
      simulatePrediction();
    }
  };

  const simulatePrediction = async () => {
    setIsProcessing(true);
    
    // Simulate API call to your backend for prediction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock prediction - in a real app, this would come from your .pt model
    const mockPredictions = [
      { class: 'Early Blight', confidence: 0.92, description: 'A common fungal disease that affects tomatoes, causing dark spots on leaves.' },
      { class: 'Late Blight', confidence: 0.87, description: 'A destructive disease that can kill plants quickly in wet conditions.' },
      { class: 'Healthy', confidence: 0.95, description: 'The plant appears to be healthy with no signs of disease.' },
    ];
    
    const randomPrediction = mockPredictions[Math.floor(Math.random() * mockPredictions.length)];
    setPrediction(randomPrediction);
    setIsProcessing(false);
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim() || !prediction) return;
    
    setIsSendingFeedback(true);
    
    try {
      // In a real implementation, you would send this to your backend
      // which would then use the chatbot.py to generate a response
      const prompt = `Crop Health Feedback:
      - Prediction: ${prediction.class} (${(prediction.confidence * 100).toFixed(1)}% confidence)
      - User Feedback: ${feedbackMessage}
      
      Please provide detailed advice and recommendations.`;
      
      // For now, we'll just send it to the parent component
      onSendToChatbot(prompt);
      
      // Reset the feedback message
      setFeedbackMessage('');
      
    } catch (error) {
      console.error('Error sending feedback:', error);
    } finally {
      setIsSendingFeedback(false);
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
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Single Image Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Upload Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
              <ImageIcon className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Upload Crop Image</h2>
            <p className="text-sm text-gray-500">
              Upload a single image of a crop for health analysis.
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="single-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <label
              htmlFor="single-upload"
              className={`cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="space-y-2">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-green-600 hover:text-green-500">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </div>
                <p className="text-xs text-gray-500">
                  JPG, PNG up to 10MB
                </p>
              </div>
            </label>
          </div>
          
          {previewUrl && (
            <div className="mt-6">
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-md"
                />
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setPrediction(null);
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                )}
              </div>
              
              {isProcessing && (
                <div className="mt-4 flex items-center justify-center">
                  <RotateCw className="animate-spin h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Analyzing image...</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Analysis Results</h2>
            
            {!selectedFile ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Upload an image to see the analysis results.</p>
              </div>
            ) : prediction ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Prediction</h3>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900 mr-2">
                      {prediction.class}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({(prediction.confidence * 100).toFixed(1)}% confidence)
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {prediction.description}
                  </p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Need more help?</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Ask our AI assistant for more details or advice about this issue.
                  </p>
                  
                  <div className="mt-4">
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                      Your question or feedback
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id="feedback"
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        placeholder="Ask about treatment options..."
                        className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendFeedback()}
                      />
                      <button
                        type="button"
                        onClick={handleSendFeedback}
                        disabled={!feedbackMessage.trim() || isSendingFeedback}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${(!feedbackMessage.trim() || isSendingFeedback) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isSendingFeedback ? (
                          <>
                            <RotateCw className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="-ml-1 mr-2 h-4 w-4" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleImageUpload;
