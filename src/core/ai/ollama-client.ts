import type { OllamaGenerationOptions, ComponentGenerationRequest } from '../../types';

/**
 * Ollama Client for AI-powered component generation
 * 
 * Integrates with local Ollama instance to generate React components
 * from natural language descriptions with security validation.
 */
export class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;
  private isAvailable: boolean = false;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.defaultModel = 'qwen2.5-coder:1.5b-instruct';
    this.checkAvailability();
  }

  /**
   * Checks if Ollama service is available.
   */
  private async checkAvailability(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      this.isAvailable = response.ok;
      
      if (this.isAvailable) {
        console.log('[OllamaClient] Connected to Ollama service');
      } else {
        console.warn('[OllamaClient] Ollama service not responding properly');
      }
    } catch (error) {
      this.isAvailable = false;
      console.warn('[OllamaClient] Ollama service not available:', error);
    }
  }

  /**
   * Generates a React component from a natural language prompt.
   * 
   * @param request - Component generation request
   * @returns Promise resolving to generated JSX code
   */
  async generateComponent(request: ComponentGenerationRequest): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available. Please ensure Ollama is running on localhost:11434');
    }

    const systemPrompt = this.buildSystemPrompt(request.panelType || 'general');
    const fullPrompt = `${systemPrompt}\n\nUser Request: ${request.prompt}`;

    try {
      const options: OllamaGenerationOptions = {
        model: this.defaultModel,
        prompt: fullPrompt,
        temperature: 0.2, // Slightly higher temperature for 1B model creativity
        topP: 0.95,
        maxTokens: 4096 // Increased for more detailed components
      };

      const generatedCode = await this.callOllamaAPI(options);
      const cleanedCode = this.extractJSXFromResponse(generatedCode);
      
      // Validate the generated code before returning
      this.validateGeneratedCode(cleanedCode);
      
      return cleanedCode;
    } catch (error) {
      console.error('[OllamaClient] Component generation failed:', error);
      throw new Error(`Component generation failed: ${error}`);
    }
  }

  /**
   * Makes API call to Ollama service.
   * 
   * @param options - Generation options
   * @returns Promise resolving to generated text
   */
  private async callOllamaAPI(options: OllamaGenerationOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        prompt: options.prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.2,
          top_p: options.topP || 0.95,
          num_predict: options.maxTokens || 4096,
          stop: ['```\n\n', '## ', 'Let me know']
        }
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  /**
   * Builds system prompt for component generation.
   * 
   * @param panelType - Type of panel being generated
   * @returns System prompt string
   */
  private buildSystemPrompt(panelType: string): string {
    const basePrompt = `Create a React component. Requirements:

1. Functional component with hooks
2. Export as default
3. Use Tailwind CSS classes
4. Include proper TypeScript types
5. Self-contained (no external dependencies)

Structure:
\`\`\`jsx
import React, { useState } from 'react';

const ComponentName = () => {
  // Component logic
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
\`\`\`

Component type: ${panelType}`;

    const panelSpecificPrompts: Record<string, string> = {
      'todo': `
Make a TODO list with:
- Add/remove/complete tasks
- Task counter
- Clean styling
      `,
      'chart': `
Make a simple chart with:
- Sample data display
- Responsive design
- CSS styling only
      `,
      'form': `
Make a form with:
- Input validation
- Submit handling
- Error messages
      `,
      'dashboard': `
Make a dashboard widget with:
- Key metrics display
- Clean layout
- Responsive design
      `,
      'timeline': `
Make a timeline with:
- Event list display
- Chronological order
- Clean styling
      `
    };

    return basePrompt + (panelSpecificPrompts[panelType] || panelSpecificPrompts['dashboard']);
  }

  /**
   * Extracts JSX code from Ollama response.
   * 
   * @param response - Raw response from Ollama
   * @returns Extracted JSX code
   */
  private extractJSXFromResponse(response: string): string {
    // Remove any explanatory text and extract only the code
    const codeMatch = response.match(/```(?:jsx?|typescript|tsx?)?\n?([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }

    // If no code blocks found, try to find React component pattern
    const componentMatch = response.match(/(import React[\s\S]*?export default \w+;?)/);
    if (componentMatch) {
      return componentMatch[1].trim();
    }

    // Fallback: clean up the response
    return response
      .replace(/^```[\w]*\n?/, '') // Remove opening code block
      .replace(/\n?```$/, '')     // Remove closing code block
      .trim();
  }

  /**
   * Validates generated code for basic security and structure.
   * 
   * @param code - Generated JSX code to validate
   * @throws Error if code is invalid
   */
  private validateGeneratedCode(code: string): void {
    // Check for required React import
    if (!code.includes('import React')) {
      throw new Error('Generated code must import React');
    }

    // Check for export default
    if (!code.includes('export default')) {
      throw new Error('Generated code must have a default export');
    }

    // Check for forbidden patterns
    const forbiddenPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/,
      /window\.parent/,
      /window\.top/,
      /localStorage/,
      /sessionStorage/,
      /<script/i
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Generated code contains forbidden pattern: ${pattern.source}`);
      }
    }

    // Basic length check
    if (code.length < 50) {
      throw new Error('Generated code appears to be too short');
    }

    if (code.length > 10000) {
      throw new Error('Generated code is too long (>10KB)');
    }
  }

  /**
   * Gets available models from Ollama.
   * 
   * @returns Promise resolving to array of model names
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('[OllamaClient] Failed to get models:', error);
      return [];
    }
  }

  /**
   * Sets the model to use for generation.
   * 
   * @param model - Model name
   */
  setModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * Gets the current model.
   * 
   * @returns Current model name
   */
  getCurrentModel(): string {
    return this.defaultModel;
  }

  /**
   * Checks if the Ollama service is available.
   * 
   * @returns true if available, false otherwise
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Forces a recheck of service availability.
   */
  async recheckAvailability(): Promise<boolean> {
    await this.checkAvailability();
    return this.isAvailable;
  }
}

// Create and export default instance
const ollamaClient = new OllamaClient();

export default ollamaClient;