import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import aiComponentGenerator from '../../core/ai/component-generator';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';

/**
 * Chat Interface for AI-powered component generation
 * 
 * Provides a conversational interface for users to describe components
 * they want to create, with real-time generation and feedback.
 */
const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message on mount
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'assistant',
      content: `👋 Welcome to UI Madness! I'm powered by Qwen2.5-Coder (1.5B parameters) and can help you create React components.

Try describing what you want to build:
• "Create a todo list with checkboxes"
• "Make a simple calculator" 
• "Build a contact form with validation"
• "Design a dashboard widget"

Keep requests simple and clear for best results!`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isGenerating) return;

    setError(null);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      // Detect panel type from user input
      const panelType = detectPanelType(content);
      
      // Add "thinking" message
      const thinkingMessage: ChatMessage = {
        id: `thinking-${Date.now()}`,
        type: 'system',
        content: 'Generating component...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, thinkingMessage]);

      // Generate component using AI
      const result = await aiComponentGenerator.generateComponent({
        prompt: content,
        panelType,
        context: {
          conversationLength: messages.length,
          previousPrompts: messages
            .filter(m => m.type === 'user')
            .slice(-3)
            .map(m => m.content)
        }
      });

      // Remove thinking message and add success message
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id));
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        content: `✅ Created "${result.panelId}"! The component has been generated and is ready to use.${
          result.metadata.warnings?.length 
            ? `\n\n⚠️ Note: ${result.metadata.warnings.join(', ')}` 
            : ''
        }`,
        generatedPanel: {
          id: result.panelId,
          jsxCode: result.jsxCode,
          component: result.component
        },
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Trigger panel creation in the main app
      window.dispatchEvent(new CustomEvent('create-panel', {
        detail: { 
          panelId: result.panelId, 
          component: result.component,
          metadata: result.metadata 
        }
      }));

    } catch (err) {
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id.startsWith('thinking-')));
      
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      const errorResponse: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: `❌ Sorry, I couldn't generate that component. ${errorMessage}

You can try:
• Simplifying your request
• Being more specific about what you want
• Checking if Ollama is running (localhost:11434)
• Trying a different approach

Would you like to try again with a different description?`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegeneratePanel = async (panelId: string) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const thinkingMessage: ChatMessage = {
        id: `regen-thinking-${Date.now()}`,
        type: 'system',
        content: 'Regenerating component...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, thinkingMessage]);

      const result = await aiComponentGenerator.regenerateComponent(panelId);
      
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id));

      const successMessage: ChatMessage = {
        id: `regen-${Date.now()}`,
        type: 'assistant',
        content: `🔄 Regenerated "${result.panelId}"! The component has been updated with a fresh approach.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, successMessage]);

      // Update the panel
      window.dispatchEvent(new CustomEvent('create-panel', {
        detail: { 
          panelId: result.panelId, 
          component: result.component 
        }
      }));

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id.startsWith('regen-thinking-')));
      
      const errorMessage: ChatMessage = {
        id: `regen-error-${Date.now()}`,
        type: 'assistant',
        content: `❌ Failed to regenerate component: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    
    // Re-add welcome message
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-new',
        type: 'assistant',
        content: 'Chat cleared! I\'m ready to help you create components. What would you like to build?',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-600">Describe components to create them</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              aiComponentGenerator ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-xs text-gray-500">
              {aiComponentGenerator ? 'AI Ready' : 'AI Offline'}
            </span>
            <button
              onClick={clearChat}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <svg className="w-4 h-4 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-2">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map(message => (
          <ChatMessageComponent
            key={message.id}
            message={message}
            onRegeneratePanel={
              message.generatedPanel 
                ? () => handleRegeneratePanel(message.generatedPanel!.id)
                : undefined
            }
          />
        ))}
        
        {isGenerating && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isGenerating}
          placeholder={
            isGenerating 
              ? "AI is generating..." 
              : "Describe the component you want to create..."
          }
        />
      </div>
    </div>
  );
};

/**
 * Detects the type of panel based on user input.
 */
function detectPanelType(input: string): string {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('todo') || lowerInput.includes('task') || lowerInput.includes('checklist')) {
    return 'todo';
  }
  
  if (lowerInput.includes('chart') || lowerInput.includes('graph') || lowerInput.includes('visualization')) {
    return 'chart';
  }
  
  if (lowerInput.includes('form') || lowerInput.includes('input') || lowerInput.includes('submit')) {
    return 'form';
  }
  
  if (lowerInput.includes('dashboard') || lowerInput.includes('metric') || lowerInput.includes('widget')) {
    return 'dashboard';
  }
  
  if (lowerInput.includes('timeline') || lowerInput.includes('history') || lowerInput.includes('chronolog')) {
    return 'timeline';
  }
  
  return 'general';
}

export default ChatInterface;