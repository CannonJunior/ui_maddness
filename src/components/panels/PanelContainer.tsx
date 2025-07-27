import React, { useState, Suspense } from 'react';
import type { ComponentType } from 'react';
import ErrorBoundary from '../ui/ErrorBoundary';

interface PanelContainerProps {
  id: string;
  component: ComponentType;
  title?: string;
  onRemove?: () => void;
  onEdit?: () => void;
  metadata?: {
    creator?: string;
    description?: string;
    tags?: string[];
    createdAt?: Date;
  };
}

/**
 * Panel Container Component
 * 
 * Wraps dynamically generated components with error boundaries,
 * loading states, and management controls.
 */
const PanelContainer: React.FC<PanelContainerProps> = ({
  id,
  component: Component,
  title,
  onRemove,
  onEdit,
  metadata
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMetadata, setShowMetadata] = useState(false);

  const formatTimestamp = (date?: Date) => {
    if (!date) return 'Unknown';
    return date.toLocaleString();
  };

  const getCreatorIcon = (creator?: string) => {
    if (creator === 'ai') {
      return (
        <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading component...</span>
    </div>
  );

  const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Component Error</h3>
          <p className="mt-1 text-sm text-red-700">
            This panel failed to render properly.
          </p>
          <details className="mt-2">
            <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
              Error Details
            </summary>
            <pre className="mt-2 p-2 bg-red-100 text-xs text-red-800 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
          <div className="mt-3">
            <button
              onClick={resetError}
              className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="panel-container animate-fade-in">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {getCreatorIcon(metadata?.creator)}
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {title || `Panel ${id.split('-').pop()}`}
            </h3>
            {metadata?.tags && metadata.tags.length > 0 && (
              <div className="flex space-x-1">
                {metadata.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
                {metadata.tags.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{metadata.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Info Button */}
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Panel Information"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Collapse/Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg 
                className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title="Edit Component"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}

            {/* Remove Button */}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Remove Panel"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Metadata Panel */}
        {showMetadata && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">ID:</span> {id}
              </div>
              <div>
                <span className="font-medium">Created:</span> {formatTimestamp(metadata?.createdAt)}
              </div>
              {metadata?.description && (
                <div className="col-span-2">
                  <span className="font-medium">Description:</span> {metadata.description}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Panel Content */}
      {isExpanded && (
        <div className="p-4">
          <ErrorBoundary fallback={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <Component />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default PanelContainer;