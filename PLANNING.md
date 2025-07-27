# UI Madness Project Planning

## Project Overview

**UI Madness** is a dynamic multi-panel web application that uses AI to generate React components in real-time. The system combines runtime JSX compilation, Hot Module Replacement (HMR), and AI-powered component generation to create a truly dynamic interface where users can describe components in natural language and see them appear instantly.

## Architecture & Technology Stack

### Core Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite with HMR integration
- **Runtime Compilation**: Babel Standalone for browser-based JSX compilation
- **Styling**: Tailwind CSS
- **State Management**: Zustand for cross-panel coordination
- **AI Integration**: Local Ollama (Qwen2.5-Coder 1.5B model)

### Key Features
1. **Runtime JSX Compilation**: Components generated as JSX strings are compiled in the browser using Babel Standalone
2. **Hot Module Replacement**: Instant updates without page refresh using Vite's HMR API
3. **AI Component Generation**: Natural language → React component via Ollama
4. **Multi-Panel Interface**: Dynamic panel creation and management
5. **Security Sandbox**: AI-generated code runs in isolated environments
6. **Error Recovery**: Comprehensive fallback systems for compilation failures

## Project Structure

```
/
├── src/
│   ├── components/          # Core UI components
│   │   ├── chat/           # Chat interface for AI interaction
│   │   ├── panels/         # Panel management components
│   │   └── ui/             # Basic UI components
│   ├── core/               # Core systems
│   │   ├── compiler/       # Runtime JSX compilation
│   │   ├── hmr/           # Hot Module Replacement system
│   │   ├── ai/            # AI integration (Ollama)
│   │   └── registry/      # Component registry management
│   ├── utils/              # Utility functions
│   ├── hooks/              # React hooks
│   └── types/              # TypeScript type definitions
├── tests/                  # Test files
├── docs/                   # Additional documentation
└── package.json
```

## Development Phases

### Phase 1: Foundation (Week 1)
- ✅ Project setup and structure
- ✅ Basic Vite configuration with HMR
- ✅ Runtime JSX compiler implementation
- ✅ Component registry system

### Phase 2: AI Integration (Week 2)
- 🔄 Ollama client integration
- 🔄 Component generation from natural language
- 🔄 Code validation and security measures
- 🔄 Error handling and fallback systems

### Phase 3: UI & UX (Week 3)
- ⏳ Chat interface for component requests
- ⏳ Multi-panel management system
- ⏳ Visual component editor
- ⏳ Real-time preview system

### Phase 4: Advanced Features (Week 4)
- ⏳ Component versioning system
- ⏳ Collaborative editing
- ⏳ Performance optimizations
- ⏳ Production deployment setup

## Code Style & Conventions

### File Organization
- **Modules**: Keep files under 500 lines, split into focused modules
- **Imports**: Use relative imports within packages
- **Naming**: Clear, descriptive names following camelCase
- **Structure**: Feature-based organization with clear separation of concerns

### Code Standards
- **TypeScript**: Full type coverage with strict settings
- **Functions**: Include JSDoc with Google-style documentation
- **Error Handling**: Comprehensive error boundaries and try-catch blocks
- **Testing**: Unit tests for all core functionality using Pytest
- **Comments**: Inline explanations for complex logic with `# Reason:` prefix

### Security Considerations
- **Sandboxing**: All AI-generated code runs in isolated environments
- **Validation**: Multi-layer validation for generated components
- **Content Security Policy**: Strict CSP headers
- **Error Boundaries**: Prevent cascade failures

## Development Environment

### Setup Requirements
- Node.js 18+
- Ollama with Qwen2.5-Coder 1.5B model
- Vite dev server

### Key Dependencies
- `@babel/standalone` - Runtime JSX compilation
- `react` & `react-dom` - UI framework
- `zustand` - State management
- `tailwindcss` - Styling
- `typescript` - Type safety
- `vitest` - Testing framework

## Architecture Patterns

### Modular Design
- **Single Responsibility**: Each module has one clear purpose
- **Dependency Injection**: Clean service boundaries
- **Event-Driven**: Loose coupling via event systems
- **Plugin Architecture**: Extensible through plugins

### Performance Considerations
- **Lazy Loading**: Dynamic imports for panels
- **Memory Management**: Aggressive cleanup with WeakMap/WeakRef
- **Caching**: Intelligent component caching system
- **WebSocket Optimization**: Batched updates and reconnection strategies

## Deployment Strategy

### Development
- Vite dev server with HMR
- Local Ollama instance
- Hot reloading for all changes

### Production
- Docker containerization
- Server-side compilation fallback
- CDN for static assets
- Kubernetes scaling for enterprise deployment

## Success Metrics

- **Performance**: Sub-50ms HMR update times
- **Reliability**: 99%+ successful component generation
- **Usability**: Natural language → working component in <5 seconds
- **Security**: Zero successful exploits through generated code
- **Scalability**: Support for 100+ concurrent users

This architecture enables rapid development while maintaining security, performance, and scalability for a production-ready AI-powered dynamic interface system.