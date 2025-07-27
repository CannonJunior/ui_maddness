import { useState } from 'react';
import panelRegistry from './core/registry/panel-registry';
import ChatInterface from './components/chat/ChatInterface';
import PanelContainer from './components/panels/PanelContainer';
import { useDynamicPanels } from './hooks/useDynamicPanel';

/**
 * Main UI Madness Application Component
 * 
 * Provides the base layout with chat interface and dynamic panel management.
 */
function App() {
  const { panels, createPanel, removePanel, clearAllPanels } = useDynamicPanels();
  const [showChat, setShowChat] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTestComponent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Example JSX code for a simple counter component
      const testJSX = `
        import React, { useState } from 'react';

        const TestCounter = () => {
          const [count, setCount] = useState(0);

          return (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Dynamic Counter Component
              </h2>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setCount(c => c - 1)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  -
                </button>
                <span className="text-2xl font-mono text-gray-700 min-w-[2rem] text-center">
                  {count}
                </span>
                <button 
                  onClick={() => setCount(c => c + 1)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  +
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                This component was compiled at runtime using Babel Standalone!
              </p>
            </div>
          );
        };

        export default TestCounter;
      `;

      await createPanel(testJSX, `test-${Date.now()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const registryStats = panelRegistry.getStats();

  const handlePanelEdit = (panelId: string) => {
    // TODO: Implement panel editing functionality
    console.log('Edit panel:', panelId);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${showChat ? 'mr-96' : ''} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  UI Madness
                </h1>
                <p className="text-sm text-gray-600">
                  AI-Powered Dynamic Panel System
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Panels:</span> {panels.length} |{' '}
                  <span className="font-medium">Memory:</span> {Math.round(registryStats.memoryUsage / 1024)}KB
                </div>
                <button
                  onClick={createTestComponent}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating...' : 'Create Test Component'}
                </button>
                <button
                  onClick={clearAllPanels}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {showChat ? 'Hide' : 'Show'} AI Chat
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Welcome Message */}
          {panels.length === 0 && !isLoading && (
            <div className="text-center py-12 px-6">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to UI Madness
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Use the AI chat to describe components you want to create, or click 
                "Create Test Component" to see the runtime compilation in action!
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                <h4 className="text-sm font-medium text-blue-900 mb-2">System Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Runtime Compilation:</span>
                    <span className="ml-2 text-green-600 font-medium">
                      {window.__RUNTIME_COMPILATION__ ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Babel Standalone:</span>
                    <span className="ml-2 text-green-600 font-medium">
                      {window.Babel ? 'Loaded' : 'Not Found'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Panel Registry:</span>
                    <span className="ml-2 text-green-600 font-medium">Active</span>
                  </div>
                  <div>
                    <span className="text-blue-700">HMR Support:</span>
                    <span className="ml-2 text-green-600 font-medium">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Panels Grid */}
          {panels.length > 0 && (
            <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {panels.map(({ id, component }) => {
                const panelData = panelRegistry.getPanel(id);
                return (
                  <PanelContainer
                    key={id}
                    id={id}
                    component={component}
                    title={panelData?.name}
                    metadata={{
                      creator: panelData?.metadata.creator,
                      description: panelData?.metadata.description,
                      tags: panelData?.metadata.tags,
                      createdAt: panelData?.metadata.createdAt
                    }}
                    onRemove={() => removePanel(id)}
                    onEdit={() => handlePanelEdit(id)}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-96 flex-shrink-0 border-l border-gray-200 bg-white fixed right-0 top-0 h-full z-10">
          <ChatInterface />
        </div>
      )}
    </div>
  );
}

export default App;