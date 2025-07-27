// Minimal test app (unused)

function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        UI Madness - Minimal Test
      </h1>
      <p className="text-gray-600 mb-6">
        This is a minimal test to see if React is working.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Chat Interface Test
        </h2>
        <div className="space-y-2">
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">AI</span>
              </div>
              <div>
                <p className="text-sm text-gray-700">Welcome! I'm ready to help you create components.</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Type your message here..." 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;