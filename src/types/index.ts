import type { ComponentType } from 'react';

/**
 * Core types for the UI Madness dynamic panel system.
 */

declare global {
  interface Window {
    Babel: {
      transform: (code: string, options?: any) => { code?: string; map?: any };
    };
    React: typeof import('react');
    ReactDOM: typeof import('react-dom');
    __RUNTIME_COMPILATION__: boolean;
    __DEV__: boolean;
  }

  interface WindowEventMap {
    'ai-component-generated': CustomEvent<{ panelId: string; jsxCode: string }>;
    'manual-component-update': CustomEvent<{ panelId: string; jsxCode: string }>;
    'panel-hmr-update': CustomEvent<{ panelId: string; jsxCode?: string }>;
    'panel-hmr-error': CustomEvent<{ panelId: string; error: string }>;
    'create-panel': CustomEvent<{ panelId: string; component: any; metadata?: any }>;
    'remove-panel': CustomEvent<{ panelId: string }>;
  }

  interface ImportMeta {
    readonly env: {
      readonly DEV: boolean;
      readonly MODE: string;
      readonly PROD: boolean;
      readonly SSR: boolean;
    };
    readonly hot?: {
      readonly data: any;
      accept(): void;
      accept(cb: (mod: any) => void): void;
      accept(dep: string, cb: (mod: any) => void): void;
      accept(deps: readonly string[], cb: (mods: any[]) => void): void;
      dispose(cb: (data: any) => void): void;
      decline(): void;
      decline(dep: string): void;
      decline(deps: readonly string[]): void;
      invalidate(): void;
      on(event: string, cb: (...args: any[]) => void): void;
    };
  }
}

export interface PanelDefinition {
  id: string;
  name: string;
  jsxCode: string;
  compiledCode?: string;
  component?: ComponentType;
  metadata: PanelMetadata;
}

export interface PanelMetadata {
  createdAt: Date;
  updatedAt: Date;
  creator: 'ai' | 'user';
  dependencies: string[];
  tags?: string[];
  description?: string;
  panelType?: string;
  error?: string;
  warnings?: string[];
}

export interface CompilerOptions {
  presets?: string[];
  plugins?: (string | [string, any])[];
  sourceMaps?: boolean;
}

export interface CompilationResult {
  success: boolean;
  code?: string;
  moduleUrl?: string;
  error?: Error;
  warnings?: string[];
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  generatedPanel?: {
    id: string;
    jsxCode: string;
    component: ComponentType;
  };
}

export interface HMRUpdateData {
  panelId: string;
  jsxCode: string;
  timestamp: number;
}

export interface ComponentCacheEntry {
  component: ComponentType;
  moduleUrl: string;
  lastUpdated: number;
  compiledCode: string;
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedCode?: string;
}

export interface OllamaGenerationOptions {
  model: string;
  prompt: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export interface ComponentGenerationRequest {
  prompt: string;
  panelType?: string;
  context?: Record<string, any>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}