import React, { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../../types';

interface ChatMessageProps {
  message: ChatMessageType;
  onRegeneratePanel?: () => void;
}

/**
 * Individual Chat Message Component
 * 
 * Displays a single message in the chat interface with appropriate styling
 * and actions based on message type and content.
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegeneratePanel }) => {
  const [showCode, setShowCode] = useState(false);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const renderMessageContent = () => {
    // Split content by newlines and render with proper formatting
    const lines = message.content.split('\n');
    
    return (
      <div className="space-y-1">
        {lines.map((line, index) => {
          // Handle bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{line.replace(/^[•-]\s*/, '')}</span>
              </div>
            );
          }
          
          // Handle bold text (simple **text** format)
          if (line.includes('**')) {
            const parts = line.split('**');
            return (
              <p key={index}>
                {parts.map((part, partIndex) => 
                  partIndex % 2 === 1 ? 
                    <strong key={partIndex}>{part}</strong> : 
                    part
                )}
              </p>
            );
          }
          
          // Regular line
          return line.trim() ? <p key={index}>{line}</p> : <div key={index} className="h-2" />;
        })}
      </div>
    );
  };

  const renderUserMessage = () => (
    <div className="flex justify-end">
      <div className="max-w-[80%]">
        <div className="chat-message-user">
          {renderMessageContent()}
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );

  const renderAssistantMessage = () => (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="flex items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="chat-message-assistant">
              {renderMessageContent()}
              
              {/* Panel Actions */}
              {message.generatedPanel && (
                <div className="mt-4 pt-3 border-t border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-purple-700">
                      <strong>Panel ID:</strong> {message.generatedPanel.id}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowCode(!showCode)}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                      >
                        {showCode ? 'Hide' : 'Show'} Code
                      </button>
                      {onRegeneratePanel && (
                        <button
                          onClick={onRegeneratePanel}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          Regenerate
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Code Display */}
                  {showCode && message.generatedPanel && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Generated JSX Code:</span>
                        <button
                          onClick={() => copyToClipboard(message.generatedPanel!.jsxCode)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="code-editor p-3 text-xs overflow-auto max-h-60">
                        <code>{message.generatedPanel.jsxCode}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemMessage = () => (
    <div className="flex justify-center">
      <div className="chat-message-system max-w-[60%] text-center">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
          <span className="text-sm text-orange-700">{message.content}</span>
        </div>
      </div>
    </div>
  );

  switch (message.type) {
    case 'user':
      return renderUserMessage();
    case 'assistant':
      return renderAssistantMessage();
    case 'system':
      return renderSystemMessage();
    default:
      return null;
  }
};

export default ChatMessage;