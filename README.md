# UI Madness - AI-Powered Dynamic Panel System

A cutting-edge web application that combines **runtime JSX compilation**, **Hot Module Replacement**, and **AI-powered component generation** to create truly dynamic interfaces where users can describe components in natural language and see them appear instantly.

## 🚀 Features

- **🤖 AI Component Generation**: Describe components in natural language using local Ollama
- **⚡ Runtime JSX Compilation**: Components compiled in the browser using Babel Standalone
- **🔥 Hot Module Replacement**: Instant updates without page refresh via Vite HMR
- **🛡️ Security Sandbox**: AI-generated code validated and sandboxed before execution
- **📱 Multi-Panel Interface**: Dynamic panel creation and management
- **🎨 Real-time Chat Interface**: Conversational UI for component requests
- **🔧 Error Recovery**: Comprehensive fallback systems and error boundaries

## 🏗️ Architecture

### Core Systems
- **Runtime Compiler**: Babel Standalone for browser-based JSX compilation
- **Panel Registry**: Manages dynamically generated components with HMR support
- **AI Integration**: Ollama client with CodeLlama models for component generation
- **Security Validator**: Multi-layer validation for AI-generated code
- **HMR Manager**: Hot module replacement with state preservation

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **AI**: Local Ollama (CodeLlama models)
- **Compilation**: Babel Standalone
- **Testing**: Vitest + Testing Library

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- [Ollama](https://ollama.ai/) installed and running
- Qwen2.5-Coder model: `ollama pull qwen2.5-coder:1.5b-instruct`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ui_maddness

# Install dependencies
npm install

# Start Ollama service (in separate terminal)
ollama serve

# Pull the required model (first time only)
ollama pull qwen2.5-coder:1.5b-instruct

# Start development server
npm run dev
```

### Usage

1. **Open the application** at `http://localhost:5173`
2. **Test the system** by clicking "Create Test Component"
3. **Use AI Chat** to describe components you want to create:
   - "Create a todo list with checkboxes"
   - "Make a simple calculator"
   - "Build a contact form with validation"
   - "Design a dashboard widget"

## 📁 Project Structure

```
src/
├── components/          # UI Components
│   ├── chat/           # AI Chat interface
│   ├── panels/         # Panel management
│   └── ui/             # Basic UI components
├── core/               # Core Systems
│   ├── compiler/       # Runtime JSX compilation
│   ├── hmr/           # Hot Module Replacement
│   ├── ai/            # AI integration & validation
│   └── registry/      # Component registry
├── hooks/              # React hooks
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run type-check` - Type checking

### Development Workflow

1. **Planning**: Check `PLANNING.md` for architecture details
2. **Tasks**: Update `TASK.md` when working on features
3. **Code Style**: Follow TypeScript + JSDoc standards
4. **Testing**: Write unit tests for core functionality
5. **Security**: All AI-generated code must pass validation

## 🔒 Security

### AI Code Validation
- **Pattern Detection**: Scans for dangerous JavaScript patterns
- **Import Validation**: Only allows whitelisted imports
- **Sandbox Execution**: AI-generated components run in isolated environments
- **Error Boundaries**: Prevents cascade failures

### Blocked Patterns
- `eval()`, `Function()` constructors
- Direct DOM manipulation
- `localStorage`, `sessionStorage` access
- Network requests without permission
- Script injection attempts

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker Deployment
```bash
# Build image
docker build -t ui-madness .

# Run container
docker run -p 3000:3000 ui-madness
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/core/compiler/runtime-compiler.test.ts
```

## 📊 Performance

- **HMR Updates**: Sub-50ms update times
- **Component Compilation**: ~100-300ms for typical components
- **Memory Management**: Automatic cleanup with WeakMap/WeakRef
- **Bundle Size**: Optimized with code splitting

## 🐛 Troubleshooting

### Common Issues

**"Ollama service not available"**
- Ensure Ollama is running: `ollama serve`
- Check if the model is installed: `ollama list`
- Pull the model if missing: `ollama pull qwen2.5-coder:1.5b-instruct`

**"Babel Standalone not found"**
- Check network connection for CDN access
- Verify script loading in browser dev tools

**Components not rendering**
- Check browser console for compilation errors
- Validate JSX syntax in generated code
- Ensure error boundaries are working

### Debug Mode
Set `window.__DEV__ = true` in browser console for detailed logging.

## 🤝 Contributing

1. **Follow Code Standards**: TypeScript + JSDoc documentation
2. **Security First**: Never bypass validation systems
3. **Test Coverage**: Write tests for new features
4. **Update Docs**: Keep PLANNING.md and TASK.md current

## 📚 Architecture Deep Dive

### Runtime Compilation Pipeline
1. **User Input** → Natural language prompt
2. **AI Generation** → Ollama generates JSX code
3. **Validation** → Security checks and syntax validation
4. **Compilation** → Babel Standalone compiles to JavaScript
5. **Loading** → Dynamic import of component module
6. **Registration** → Panel registry manages component lifecycle
7. **HMR Integration** → Hot updates without page refresh

### State Management
- **Zustand**: Cross-panel state coordination
- **Local State**: Component-specific useState/useReducer
- **Panel Registry**: Centralized component metadata
- **HMR Cache**: Component instances and module URLs

## 📈 Roadmap

### Phase 1: Foundation ✅
- Runtime JSX compilation
- Basic AI integration
- Panel management system

### Phase 2: Advanced Features (In Progress)
- Visual component editor
- Component versioning
- Collaborative editing

### Phase 3: Production (Planned)
- Kubernetes deployment
- Performance monitoring
- Advanced security features

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ using React, TypeScript, Vite, and AI**