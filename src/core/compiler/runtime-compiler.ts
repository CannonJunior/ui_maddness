import type { CompilerOptions, CompilationResult } from '../../types';

/**
 * Runtime JSX Compiler using Babel Standalone
 * 
 * Enables dynamic compilation of JSX code in the browser for AI-generated components.
 * Uses Babel Standalone for real-time compilation with HMR integration.
 */
export class RuntimeJSXCompiler {
  private babel: typeof window.Babel;
  private defaultOptions: CompilerOptions;

  constructor(options: Partial<CompilerOptions> = {}) {
    this.babel = window.Babel;
    
    if (!this.babel) {
      throw new Error('Babel Standalone not found. Make sure it is loaded before initializing the compiler.');
    }

    this.defaultOptions = {
      presets: ['react'],
      plugins: [
        ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
      ],
      sourceMaps: true,
      ...options
    };
  }

  /**
   * Compiles JSX code to JavaScript and creates a module URL for dynamic loading.
   * 
   * @param jsxCode - The JSX source code to compile
   * @param componentName - Name for the component (used in module creation)
   * @returns Promise resolving to compilation result
   */
  async compileComponent(jsxCode: string, componentName: string): Promise<CompilationResult> {
    try {
      // Validate input
      if (!jsxCode.trim()) {
        throw new Error('JSX code cannot be empty');
      }

      // Compile JSX to JavaScript
      const result = this.babel.transform(jsxCode, this.defaultOptions);
      
      if (!result.code) {
        throw new Error('Compilation failed: no code generated');
      }

      // Create module URL for HMR
      const moduleUrl = this.createModuleBlob(result.code, componentName);

      return {
        success: true,
        code: result.code,
        moduleUrl,
        warnings: []
      };
    } catch (error) {
      console.error('[RuntimeJSXCompiler] Compilation failed:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }

  /**
   * Creates a blob URL for the compiled module to enable dynamic imports.
   * 
   * @param compiledCode - The compiled JavaScript code
   * @param componentName - Name of the component
   * @returns Blob URL for the module
   */
  private createModuleBlob(compiledCode: string, componentName: string): string {
    // Wrap the compiled code in a proper ES module format
    const moduleCode = `
      // Generated panel module: ${componentName}
      import React from 'react';
      import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime';
      
      ${compiledCode}
      
      // Ensure the component is exported
      const ComponentToExport = typeof ${componentName} !== 'undefined' ? ${componentName} : 
                                typeof Component !== 'undefined' ? Component :
                                (() => React.createElement('div', { className: 'p-4 text-red-500' }, 
                                  'Error: No valid component found in generated code'));
      
      export default ComponentToExport;
      
      // HMR support
      if (import.meta.hot) {
        import.meta.hot.accept();
      }
    `;
    
    const blob = new Blob([moduleCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  }

  /**
   * Validates JSX syntax without full compilation.
   * 
   * @param jsxCode - JSX code to validate
   * @returns true if syntax is valid, false otherwise
   */
  validateSyntax(jsxCode: string): boolean {
    try {
      this.babel.transform(jsxCode, {
        ...this.defaultOptions,
        code: false // Only parse, don't generate code
      });
      return true;
    } catch (error) {
      console.warn('[RuntimeJSXCompiler] Syntax validation failed:', error);
      return false;
    }
  }

  /**
   * Extracts component name from JSX code.
   * 
   * @param jsxCode - JSX source code
   * @returns Detected component name or 'Component' as fallback
   */
  extractComponentName(jsxCode: string): string {
    // Look for function component declarations
    const functionMatch = jsxCode.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)/);
    if (functionMatch) {
      return functionMatch[1];
    }

    // Look for arrow function assignments
    const arrowMatch = jsxCode.match(/(?:const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*=/);
    if (arrowMatch) {
      return arrowMatch[1];
    }

    // Look for export default statements
    const exportMatch = jsxCode.match(/export\s+default\s+([A-Z][a-zA-Z0-9]*)/);
    if (exportMatch) {
      return exportMatch[1];
    }

    return 'Component';
  }

  /**
   * Extracts imports/dependencies from JSX code.
   * 
   * @param jsxCode - JSX source code
   * @returns Array of detected dependencies
   */
  extractDependencies(jsxCode: string): string[] {
    const dependencies: string[] = [];
    const importMatches = jsxCode.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
    
    for (const match of importMatches) {
      dependencies.push(match[1]);
    }
    
    return dependencies;
  }

  /**
   * Cleans up blob URLs to prevent memory leaks.
   * 
   * @param moduleUrl - Blob URL to revoke
   */
  cleanupModuleUrl(moduleUrl: string): void {
    if (moduleUrl.startsWith('blob:')) {
      URL.revokeObjectURL(moduleUrl);
    }
  }
}

// Initialize global runtime compiler instance
if (window.__RUNTIME_COMPILATION__) {
  (window as any).RuntimeCompiler = new RuntimeJSXCompiler();
  console.log('[UI Madness] Runtime JSX Compiler initialized');
}

export default RuntimeJSXCompiler;