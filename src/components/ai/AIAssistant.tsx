// God-Mode AI Assistant Component - Floating Interface
// Can navigate anywhere, explain everything, analyze data

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bot, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Sparkles,
  Zap,
  Eye,
  FileText,
  BarChart3,
  Navigation,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { aiService } from '@/lib/services/ai';
import type { AIMessage } from '@/lib/services/ai';

interface AIAssistantProps {
  // Optional: Pass project data for analysis
  projectData?: any;
  documentContent?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  projectData, 
  documentContent 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'chat' | 'analyze' | 'document' | 'navigate'>('chat');
  
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: AIMessage = {
        role: 'assistant',
        content: `# 🤖 Welcome to GeoForge AI Assistant (God Mode)

I can help you with:

🧭 **Navigate** - Take you anywhere in the app
❓ **Explain** - Show you how to use any feature  
📊 **Analyze** - Review your geological data
📄 **Documents** - Analyze reports and files
💬 **Chat** - Answer any geology questions

**Try asking:**
- "Take me to drill holes"
- "How do I create a core log?"
- "Analyze my project data"
- "What is lithology classification?"

What would you like to do?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if navigation command
      const navCommand = aiService.parseNavigationCommand(inputValue);
      if (navCommand) {
        // Handle navigation
        const response: AIMessage = {
          role: 'assistant',
          content: `Navigating to ${navCommand.target}... ✨`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, response]);
        
        // Navigate (with delay for user to see message)
        setTimeout(() => {
          navigate(navCommand.target);
          setIsOpen(false); // Close assistant after navigation
        }, 1000);
      } else {
        // Regular AI chat
        const aiResponse = await aiService.chat(inputValue);
        
        const assistantMessage: AIMessage = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `I'm sorry, I encountered an error. Please try again or check your AI configuration. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeData = async () => {
    if (!projectData) {
      const message: AIMessage = {
        role: 'assistant',
        content: 'No project data available to analyze. Please select a project first.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      return;
    }

    setIsLoading(true);

    try {
      const analysis = await aiService.analyzeData(projectData);
      
      const message: AIMessage = {
        role: 'assistant',
        content: `# 📊 Data Analysis Results\n\n**Summary:** ${analysis.summary}\n\n**Insights:**\n${analysis.insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}\n\n**Recommendations:**\n${analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Data analysis error:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `Failed to analyze data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!documentContent) {
      const message: AIMessage = {
        role: 'assistant',
        content: 'No document to analyze. Please select a document first.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      return;
    }

    setIsLoading(true);

    try {
      const analysis = await aiService.analyzeDocument(documentContent, 'geological report');
      
      const message: AIMessage = {
        role: 'assistant',
        content: `# 📄 Document Analysis\n\n**Type:** ${analysis.type}\n\n**Summary:** ${analysis.summary}\n\n**Key Points:**\n${analysis.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}\n\n${analysis.questions ? `**Questions:**\n${analysis.questions.join('\n')}` : ''}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Document analysis error:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuickActions = () => (
    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
      <div className="text-xs text-gray-400 mb-2">Quick Actions</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setInputValue('Take me to dashboard')}
          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
        >
          <Navigation className="w-4 h-4 text-blue-400" />
          <span>Navigate</span>
        </button>
        
        <button
          onClick={() => setInputValue('How do I use this feature?')}
          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Help</span>
        </button>
        
        {projectData && (
          <button
            onClick={handleAnalyzeData}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
          >
            <BarChart3 className="w-4 h-4 text-green-400" />
            <span>Analyze Data</span>
          </button>
        )}
        
        {documentContent && (
          <button
            onClick={handleAnalyzeDocument}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Analyze Doc</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderMessage = (message: AIMessage, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-white/5 border border-white/10'
          }`}
        >
          {!isUser && message.content.includes('#') ? (
            // Render markdown-style headers
            <div className="prose prose-invert prose-sm max-w-none">
              {message.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h3 key={i} className="text-lg font-bold mb-2">{line.substring(2)}</h3>;
                } else if (line.startsWith('## ')) {
                  return <h4 key={i} className="text-base font-semibold mb-1">{line.substring(3)}</h4>;
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-semibold mb-1">{line.slice(2, -2)}</p>;
                } else if (line.trim()) {
                  return <p key={i} className="mb-1">{line}</p>;
                }
                return null;
              })}
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
          
          {message.timestamp && (
            <div className="text-xs opacity-50 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Floating AI button (when closed)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-110 flex items-center justify-center group"
      >
        <Bot className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
      </button>
    );
  }

  // Full AI Assistant Interface
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      } bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-6 h-6 text-purple-400" />
            <Zap className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-gray-400">God Mode Active</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Quick Actions */}
          {renderQuickActions()}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, i) => renderMessage(msg, i))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-400">
                  {aiService.getSystemStatus().engines.filter(e => e.available).length} engines active
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

