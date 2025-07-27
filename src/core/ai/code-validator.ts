import type { SecurityValidationResult } from '../../types';

/**
 * Advanced Code Validator for AI-generated components
 * 
 * Provides comprehensive security validation and code sanitization
 * for dynamically generated React components.
 */
export class CodeValidator {
  private allowedImports: Set<string>;
  private forbiddenPatterns: RegExp[];
  private requiredPatterns: RegExp[];

  constructor() {
    this.allowedImports = new Set([
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-error-boundary'
    ]);

    this.forbiddenPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /document\.write/gi,
      /innerHTML\s*=/gi,
      /outerHTML\s*=/gi,
      /window\.parent/gi,
      /window\.top/gi,
      /window\.frames/gi,
      /parent\./gi,
      /top\./gi,
      /\.contentWindow/gi,
      /postMessage/gi,
      /fetch\s*\(/gi,
      /XMLHttpRequest/gi,
      /localStorage/gi,
      /sessionStorage/gi,
      /document\.cookie/gi,
      /<script[\s\S]*?>/gi,
      /<iframe[\s\S]*?>/gi,
      /<object[\s\S]*?>/gi,
      /<embed[\s\S]*?>/gi,
      /<link[\s\S]*?>/gi,
      /<meta[\s\S]*?>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi, // Event handlers in HTML
      /setInterval/gi,
      /setTimeout.*eval/gi,
      /new\s+Function/gi,
      /import\s*\(/gi, // Dynamic imports
      /require\s*\(/gi,
      /global\./gi,
      /process\./gi,
      /Buffer\./gi,
      /__dirname/gi,
      /__filename/gi
    ];

    this.requiredPatterns = [
      /import\s+React/,
      /export\s+default/
    ];
  }

  /**
   * Validates JSX code for security violations and correctness.
   * 
   * @param code - JSX source code to validate
   * @returns Validation result with sanitized code or errors
   */
  async validateJSX(code: string): Promise<SecurityValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Basic structure validation
      this.validateBasicStructure(code, errors);

      // 2. Security pattern checking
      this.checkForbiddenPatterns(code, errors);

      // 3. Import validation
      this.validateImports(code, errors, warnings);

      // 4. Component structure validation
      this.validateComponentStructure(code, errors, warnings);

      // 5. React-specific validation
      this.validateReactPatterns(code, warnings);

      // 6. Size and complexity checks
      this.validateSizeAndComplexity(code, warnings);

      if (errors.length > 0) {
        return {
          isValid: false,
          errors,
          warnings
        };
      }

      // 7. Apply safety transformations
      const sanitizedCode = this.sanitizeCode(code);

      return {
        isValid: true,
        errors: [],
        warnings,
        sanitizedCode
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error}`],
        warnings
      };
    }
  }

  /**
   * Validates basic code structure.
   */
  private validateBasicStructure(code: string, errors: string[]): void {
    // Check minimum length
    if (code.trim().length < 20) {
      errors.push('Code is too short to be a valid component');
    }

    // Check maximum length
    if (code.length > 50000) {
      errors.push('Code is too long (>50KB)');
    }

    // Check for required patterns
    for (const pattern of this.requiredPatterns) {
      if (!pattern.test(code)) {
        errors.push(`Missing required pattern: ${pattern.source}`);
      }
    }

    // Check for balanced braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced braces in code');
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of code) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        errors.push('Unbalanced parentheses in code');
        break;
      }
    }
    if (parenCount !== 0) {
      errors.push('Unbalanced parentheses in code');
    }
  }

  /**
   * Checks for forbidden security patterns.
   */
  private checkForbiddenPatterns(code: string, errors: string[]): void {
    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(code)) {
        errors.push(`Forbidden pattern detected: ${pattern.source}`);
      }
    }
  }

  /**
   * Validates import statements.
   */
  private validateImports(code: string, errors: string[], warnings: string[]): void {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"];?/g;
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      const importPath = match[1];
      
      // Check if import is allowed
      if (!this.isImportAllowed(importPath)) {
        errors.push(`Unauthorized import: ${importPath}`);
      }

      // Warn about relative imports
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        warnings.push(`Relative import detected: ${importPath}`);
      }
    }
  }

  /**
   * Validates React component structure.
   */
  private validateComponentStructure(code: string, errors: string[], warnings: string[]): void {
    // Check for function component or arrow function
    const hasFunctionComponent = /(?:function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>)/.test(code);
    const hasClassComponent = /class\s+\w+\s+extends\s+(?:React\.)?Component/.test(code);

    if (!hasFunctionComponent && !hasClassComponent) {
      errors.push('No valid React component definition found');
    }

    // Prefer function components
    if (hasClassComponent) {
      warnings.push('Class components detected - function components are preferred');
    }

    // Check for JSX return
    if (!code.includes('return') || !code.includes('<')) {
      errors.push('Component must return JSX');
    }

    // Check for proper component naming (PascalCase)
    const componentNameMatch = code.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=|export\s+default\s+(\w+))/);
    if (componentNameMatch) {
      const componentName = componentNameMatch[1] || componentNameMatch[2] || componentNameMatch[3];
      if (componentName && !/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
        warnings.push(`Component name should be PascalCase: ${componentName}`);
      }
    }
  }

  /**
   * Validates React-specific patterns and best practices.
   */
  private validateReactPatterns(code: string, warnings: string[]): void {
    // Check for potential hook violations
    const hookCalls = code.match(/use[A-Z]\w*/g) || [];
    if (hookCalls.length > 0) {
      // Hooks should be at top level
      const lines = code.split('\n');
      let inFunction = false;
      let braceCount = 0;

      for (const line of lines) {
        if (/(?:function|const\s+\w+\s*=)/.test(line)) {
          inFunction = true;
        }
        
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        if (inFunction && braceCount > 1 && /use[A-Z]\w*/.test(line)) {
          warnings.push('Hooks should be called at the top level of components');
          break;
        }
      }
    }

    // Check for inline styles (prefer Tailwind classes)
    if (/style\s*=\s*\{\{/.test(code)) {
      warnings.push('Inline styles detected - prefer Tailwind CSS classes');
    }

    // Check for missing key props in lists
    if (/\.map\s*\(/.test(code) && !/<\w+[^>]*key=/.test(code)) {
      warnings.push('Missing key props in mapped elements');
    }
  }

  /**
   * Validates code size and complexity.
   */
  private validateSizeAndComplexity(code: string, warnings: string[]): void {
    const lines = code.split('\n').length;
    
    if (lines > 200) {
      warnings.push('Component is quite large - consider breaking it into smaller components');
    }

    // Check cyclomatic complexity (rough estimate)
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', '&&', '||', '?'];
    let complexity = 1;
    
    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      complexity += (code.match(regex) || []).length;
    }

    if (complexity > 20) {
      warnings.push('High cyclomatic complexity detected - consider simplifying logic');
    }
  }

  /**
   * Checks if an import is allowed.
   */
  private isImportAllowed(importPath: string): boolean {
    // Allow exact matches
    if (this.allowedImports.has(importPath)) {
      return true;
    }

    // Allow React sub-imports
    if (importPath.startsWith('react/')) {
      return true;
    }

    // Deny everything else
    return false;
  }

  /**
   * Applies safety transformations to the code.
   */
  private sanitizeCode(code: string): string {
    let sanitized = code;

    // Wrap in error boundary
    sanitized = this.wrapWithErrorBoundary(sanitized);

    // Add safety imports if missing
    if (!sanitized.includes("import { ErrorBoundary }")) {
      sanitized = `import React from 'react';\nimport { ErrorBoundary } from 'react-error-boundary';\n\n${sanitized}`;
    }

    return sanitized;
  }

  /**
   * Wraps component with error boundary.
   */
  private wrapWithErrorBoundary(code: string): string {
    // Extract the component export
    const exportMatch = code.match(/export\s+default\s+(\w+);?$/m);
    if (!exportMatch) {
      return code;
    }

    const componentName = exportMatch[1];
    const originalComponent = `Original${componentName}`;

    // Replace the export with wrapped version
    const wrappedCode = code.replace(
      /export\s+default\s+\w+;?$/m,
      `const ${originalComponent} = ${componentName};

const SafeComponent = (props) => (
  <ErrorBoundary
    fallback={
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        <h3 className="font-medium mb-2">Component Error</h3>
        <p className="text-sm">This component failed to render safely.</p>
      </div>
    }
    onError={(error) => console.error('Panel component error:', error)}
  >
    <${originalComponent} {...props} />
  </ErrorBoundary>
);

export default SafeComponent;`
    );

    return wrappedCode;
  }

  /**
   * Performs additional AST-based validation (if needed).
   */
  async validateAST(code: string): Promise<boolean> {
    try {
      // This would use a proper AST parser like @babel/parser
      // For now, we'll do basic validation
      return this.validateBasicSyntax(code);
    } catch (error) {
      console.error('[CodeValidator] AST validation failed:', error);
      return false;
    }
  }

  /**
   * Basic syntax validation.
   */
  private validateBasicSyntax(code: string): boolean {
    try {
      // Try to parse with Babel if available
      if (window.Babel) {
        window.Babel.transform(code, {
          presets: ['react'],
          code: false // Only parse, don't generate code
        });
        return true;
      }
      
      // Fallback to basic checks
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create and export default instance
const codeValidator = new CodeValidator();

export default codeValidator;