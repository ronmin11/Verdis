import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatbotProps {
  onClose: () => void;
  initialMessage?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose, initialMessage = '' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set initial message if provided
  useEffect(() => {
    if (initialMessage) {
      setMessages([
        {
          id: 'initial',
          content: 'Hello! I\'m your crop health assistant. How can I help you today?',
          sender: 'assistant',
          timestamp: new Date(),
        },
        {
          id: 'user-query',
          content: initialMessage,
          sender: 'user',
          timestamp: new Date(),
        },
      ]);
      
      // Auto-send the initial message to the chatbot
      setTimeout(() => {
        handleSend(initialMessage);
      }, 500);
    } else {
      setMessages([
        {
          id: 'welcome',
          content: 'Hello! I\'m your crop health assistant. Upload an image or ask me anything about crop health.',
          sender: 'assistant',
          timestamp: new Date(),
        },
      ]);
    }
  }, [initialMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the backend API for chatbot response
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.sender,
              content: msg.content
            })),
            {
              role: 'user',
              content: message
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const result = await response.json();
      const assistantResponse = result.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';
      
      // Add assistant's response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantResponse,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response from chatbot:', error);
      
      // Fallback to simulated response if backend fails
      try {
        const fallbackResponse = await simulateChatbotResponse(message);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: fallbackResponse,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (fallbackError) {
        const errorMessage: Message = {
          id: 'error-' + Date.now(),
          content: 'Sorry, I encountered an error. Please try again later.',
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const simulateChatbotResponse = async (message: string): Promise<string> => {
    // This is a mock implementation. In a real app, you would call your backend API
    // which would then use the chatbot.py to generate a response
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple response based on keywords in the message
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('early blight')) {
      return `Early blight is a common fungal disease affecting tomatoes and potatoes. It's caused by the fungus Alternaria solani and typically appears as small, dark spots on lower leaves that gradually enlarge, forming concentric rings. The disease thrives in warm, humid conditions.
      
**Recommendations:**
1. Remove and destroy infected plant parts
2. Apply copper-based fungicides as a preventive measure
3. Water at the base of plants to avoid wetting foliage
4. Ensure good air circulation by proper plant spacing
5. Rotate crops to non-solanaceous plants for at least 2 years`;
    } 
    
    if (lowerMessage.includes('late blight')) {
      return `Late blight is a devastating disease caused by the oomycete Phytophthora infestans. It can destroy entire tomato or potato crops in just a few days under favorable conditions (cool, wet weather).
      
**Recommendations:**
1. Remove and destroy infected plants immediately
2. Apply appropriate fungicides at the first sign of disease
3. Avoid overhead irrigation
4. Choose resistant varieties when possible
5. Ensure proper plant spacing for good air circulation`;
    }
    
    if (lowerMessage.includes('treatment') || lowerMessage.includes('how to treat')) {
      return `For most fungal diseases in crops, here are general treatment recommendations:
      
1. **Cultural Controls:**
   - Remove and destroy infected plant material
   - Rotate crops to non-host plants
   - Use disease-resistant varieties
   - Ensure proper plant spacing
   
2. **Chemical Controls:**
   - Apply appropriate fungicides as a preventive measure
   - Follow label instructions carefully
   - Rotate between different fungicide classes to prevent resistance
   
3. **Environmental Management:**
   - Water at the base of plants
   - Time irrigation to allow foliage to dry before nightfall
   - Improve air circulation around plants`;
    }
    
    // Default response if no specific keywords match
    return `I'm here to help with your crop health questions. Based on your image, I can see signs of potential issues. Could you provide more details about the specific symptoms you're observing or ask me about prevention and treatment options?`;
  };

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md bg-white rounded-t-xl shadow-xl border border-gray-200 flex flex-col" style={{ height: '600px', maxHeight: '80vh' }}>
      {/* Header */}
      <div className="bg-green-600 text-white p-4 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          <h2 className="font-semibold">Crop Health Assistant</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === 'user' 
                  ? 'bg-green-600 text-white rounded-tr-none' 
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}
            >
              {message.content.split('\n').map((line, i) => (
                <p key={i} className="mb-2 last:mb-0">
                  {line.startsWith('**') && line.endsWith('**') ? (
                    <strong className="font-semibold">{line.slice(2, -2)}</strong>
                  ) : (
                    line
                  )}
                </p>
              ))}
              <div className="text-xs opacity-70 mt-1 text-right">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 rounded-tl-none max-w-[80%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-green-600 text-white rounded-full p-2 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
