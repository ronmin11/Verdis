import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Send, RotateCw } from 'lucide-react';

interface SingleImageUploadProps {
  onBack: () => void;
}

const SingleImageUpload: React.FC<SingleImageUploadProps> = ({ onBack }) => {
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
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
  }>>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPrediction(null); // Reset previous prediction
      
      // Make actual prediction using the backend API
      predictDisease(file);
    }
  };

  const predictDisease = async (file: File) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Prediction failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 'success' && result.prediction) {
        const pred = result.prediction;
        setPrediction({
          class: pred.class,
          confidence: pred.confidence,
          description: getDiseaseDescription(pred.class)
        });
      } else {
        throw new Error('Prediction failed');
      }

    } catch (error) {
      console.error('Prediction error:', error);
      
      // If backend is not available, show a fallback message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('404')) {
        alert('Backend server is not running. Please start the backend server first.');
      } else {
        alert(`Prediction failed: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getDiseaseDescription = (diseaseClass: string): string => {
    const descriptions: { [key: string]: string } = {
      'Tomato___Early_blight': 'Early blight is a common fungal disease affecting tomatoes, causing dark spots on leaves.',
      'Tomato___Late_blight': 'Late blight is a destructive disease that can kill plants quickly in wet conditions.',
      'Tomato___healthy': 'The plant appears to be healthy with no signs of disease.',
      'Potato___Early_blight': 'Early blight affects potatoes, causing dark spots and yellowing of leaves.',
      'Potato___Late_blight': 'Late blight is a serious disease that can destroy potato crops.',
      'Potato___healthy': 'The potato plant appears healthy with no disease symptoms.',
    };

    return descriptions[diseaseClass] || 'Disease analysis completed.';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrediction(null);
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim() || !prediction) return;
    
    setIsSendingFeedback(true);
    
    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      content: feedbackMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      // Use regular chat API (no streaming)
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...chatMessages.map(msg => ({
              role: msg.sender,
              content: msg.content
            })),
            {
              role: 'user',
              content: `Crop Health Analysis:
              - Disease: ${prediction.class} (${(prediction.confidence * 100).toFixed(1)}% confidence)
              - Description: ${prediction.description}
              
              User Question: ${feedbackMessage}
              
              Please provide detailed advice and recommendations.`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const result = await response.json();
      const assistantResponse = result.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

      // Add assistant's response to chat
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: assistantResponse,
        sender: 'assistant' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Reset the feedback message
      setFeedbackMessage('');
      
    } catch (error) {
      console.error('Error getting response from chatbot:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: 'error-' + Date.now(),
        content: 'Sorry, I encountered an error. Please try again later.',
        sender: 'assistant' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingFeedback(false);
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
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Single Image Analysis</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload and Results Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
                <ImageIcon className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Upload Crop Image</h2>
              <p className="text-sm text-gray-500">
                Upload a single image of a crop for health analysis.
              </p>
            </div>
            
            {!previewUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
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
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                
                {isProcessing && (
                  <div className="flex items-center justify-center py-4">
                    <RotateCw className="animate-spin h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-gray-600">Analyzing image...</span>
                  </div>
                )}

                {prediction && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Analysis Results</h3>
                    <div className="mb-3">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-900 break-words">
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Chatbot Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">AI Assistant</h3>
            </div>
            
            {!prediction ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Upload and analyze an image to get AI assistance.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ask our AI assistant for more details or advice about this disease.
                </p>
                
                {/* Chat Messages */}
                {chatMessages.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            message.sender === 'user'
                              ? 'bg-green-600 text-white max-w-xs'
                              : 'bg-white text-gray-900 border border-gray-200 max-w-full'
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words prose prose-sm max-w-none">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isSendingFeedback && (
                      <div className="flex justify-start">
                        <div className="bg-white text-gray-900 border border-gray-200 px-3 py-2 rounded-lg text-sm">
                          <div className="flex items-center space-x-2">
                            <RotateCw className="animate-spin h-4 w-4" />
                            <span>AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex space-x-2">
                  <input
                    type="text"
                    id="chat-input"
                    name="chat-input"
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Ask about treatment options, prevention, or symptoms..."
                    className="flex-1 min-w-0 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendFeedback()}
                  />
                    <button
                      onClick={handleSendFeedback}
                      disabled={!feedbackMessage.trim() || isSendingFeedback}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSendingFeedback ? (
                        <RotateCw className="animate-spin h-4 w-4" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Quick action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFeedbackMessage("What are the treatment options for this disease?")}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Treatment options
                    </button>
                    <button
                      onClick={() => setFeedbackMessage("How can I prevent this disease?")}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Prevention tips
                    </button>
                    <button
                      onClick={() => setFeedbackMessage("What are the symptoms of this disease?")}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Symptoms
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleImageUpload;