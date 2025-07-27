import React, { useState, useRef, useCallback } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Chat Input Component
 * 
 * Provides a text input interface for sending messages to the AI,
 * with support for multiline input and keyboard shortcuts.
 */
const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message..." 
}) => {
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't trigger send during IME composition (for international keyboards)
    if (isComposing) return;

    // Send on Enter (but not Shift+Enter for multiline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || disabled) return;

    onSendMessage(trimmedInput);
    setInput('');
    
    // Reset textarea height
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // Quick suggestion buttons
  const quickSuggestions = [
    "Create a todo list",
    "Make a simple form",
    "Build a data chart",
    "Design a card component"
  ];

  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="p-4">
      {/* Quick Suggestions */}
      {input.length === 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-xs text-gray-500 hover:text-gray-700 mb-2"
          >
            {showSuggestions ? 'Hide' : 'Show'} suggestions
          </button>
          
          {showSuggestions && (
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(suggestion);
                    setShowSuggestions(false);
                    setTimeout(adjustTextareaHeight, 0);
                  }}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              resize-none overflow-hidden
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              transition-colors
            `}
            style={{
              minHeight: '40px',
              maxHeight: '120px'
            }}
          />
          
          {/* Character count */}
          {input.length > 500 && (
            <div className="absolute -top-6 right-0 text-xs text-gray-500">
              {input.length}/1000
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className={`
            flex-shrink-0 p-2 rounded-lg transition-all duration-200
            ${
              disabled || !input.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }
          `}
          title="Send message (Enter)"
        >
          {disabled ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {input.length > 800 && (
          <span className="ml-2 text-orange-500">
            • Long messages may take more time to process
          </span>
        )}
      </div>

      {/* Status Indicators */}
      {disabled && (
        <div className="mt-2 flex items-center text-xs text-orange-600">
          <div className="animate-pulse w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
          AI is processing your request...
        </div>
      )}
    </div>
  );
};

export default ChatInput;