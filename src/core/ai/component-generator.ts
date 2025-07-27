import type { ComponentType } from 'react';
import type { ComponentGenerationRequest } from '../../types';
import ollamaClient from './ollama-client';
import codeValidator from './code-validator';
import panelRegistry from '../registry/panel-registry';

/**
 * AI Component Generator
 * 
 * Orchestrates the complete pipeline for generating React components from natural language:
 * 1. Natural language processing via Ollama
 * 2. Code validation and security checks
 * 3. Component compilation and registration
 * 4. Error handling and fallback mechanisms
 */
interface ComponentGenerationAttempt {
  timestamp: Date;
  prompt: string;
  generatedCode?: string;
  finalCode?: string;
  error?: string;
  success: boolean;
  warnings?: string[];
}

export class AIComponentGenerator {
  private ollama: typeof ollamaClient;
  private validator: typeof codeValidator;
  private generationHistory: Map<string, ComponentGenerationAttempt[]> = new Map();

  constructor() {
    this.ollama = ollamaClient;
    this.validator = codeValidator;
  }

  /**
   * Generates a React component from a natural language prompt.
   * 
   * @param request - Component generation request
   * @returns Promise resolving to the generated component and panel ID
   */
  async generateComponent(request: ComponentGenerationRequest): Promise<{
    component: ComponentType;
    panelId: string;
    jsxCode: string;
    metadata: any;
  }> {
    const panelId = this.generatePanelId(request.prompt);
    
    try {
      // Check if Ollama is available
      if (!this.ollama.isServiceAvailable()) {
        throw new Error('AI service is not available. Please ensure Ollama is running.');
      }

      console.log(`[AIComponentGenerator] Starting generation for panel: ${panelId}`);

      // Generate JSX code using Ollama
      const jsxCode = await this.ollama.generateComponent(request);
      
      // Validate and sanitize the generated code
      const validationResult = await this.validator.validateJSX(jsxCode);
      
      if (!validationResult.isValid) {
        throw new Error(`Code validation failed: ${validationResult.errors.join(', ')}`);
      }

      const finalCode = validationResult.sanitizedCode || jsxCode;

      // Register the component
      const component = await panelRegistry.registerPanelFromJSX(
        panelId,
        finalCode,
        {
          creator: 'ai',
          description: request.prompt,
          tags: this.extractTags(request.prompt),
          panelType: request.panelType
        }
      );

      // Record generation attempt
      this.recordGenerationAttempt(panelId, {
        prompt: request.prompt,
        generatedCode: jsxCode,
        finalCode,
        success: true,
        timestamp: new Date(),
        warnings: validationResult.warnings
      });

      // Emit success event
      this.emitGenerationEvent(panelId, finalCode, component);

      console.log(`[AIComponentGenerator] Successfully generated panel: ${panelId}`);

      return {
        component,
        panelId,
        jsxCode: finalCode,
        metadata: {
          prompt: request.prompt,
          panelType: request.panelType,
          warnings: validationResult.warnings,
          model: this.ollama.getCurrentModel()
        }
      };
    } catch (error) {
      console.error(`[AIComponentGenerator] Generation failed for panel ${panelId}:`, error);
      
      // Record failed attempt
      this.recordGenerationAttempt(panelId, {
        prompt: request.prompt,
        generatedCode: '',
        finalCode: '',
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Try fallback strategies
      return this.handleGenerationFailure(request, panelId, error as Error);
    }
  }

  /**
   * Regenerates a component with the same or modified prompt.
   * 
   * @param panelId - Existing panel ID to regenerate
   * @param newPrompt - Optional new prompt (uses original if not provided)
   * @returns Promise resolving to regenerated component
   */
  async regenerateComponent(panelId: string, newPrompt?: string): Promise<{
    component: ComponentType;
    panelId: string;
    jsxCode: string;
  }> {
    const history = this.generationHistory.get(panelId);
    const lastAttempt = history?.[history.length - 1];
    
    if (!lastAttempt) {
      throw new Error(`No generation history found for panel: ${panelId}`);
    }

    const prompt = newPrompt || lastAttempt.prompt;
    const existingPanel = panelRegistry.getPanel(panelId);
    
    const request: ComponentGenerationRequest = {
      prompt,
      panelType: existingPanel?.metadata.panelType,
      context: { regeneration: true, previousAttempts: history.length }
    };

    return this.generateComponent(request);
  }

  /**
   * Iteratively improves a component based on feedback.
   * 
   * @param panelId - Panel ID to improve
   * @param feedback - User feedback for improvement
   * @returns Promise resolving to improved component
   */
  async improveComponent(panelId: string, feedback: string): Promise<{
    component: ComponentType;
    panelId: string;
    jsxCode: string;
  }> {
    const existingPanel = panelRegistry.getPanel(panelId);
    if (!existingPanel) {
      throw new Error(`Panel ${panelId} not found`);
    }

    const improvementPrompt = `
Improve the following React component based on this feedback: "${feedback}"

Current component code:
${existingPanel.jsxCode}

Original requirement: ${existingPanel.metadata.description}

Please provide an improved version that addresses the feedback while maintaining the original functionality.
    `;

    const request: ComponentGenerationRequest = {
      prompt: improvementPrompt,
      panelType: existingPanel.metadata.panelType,
      context: { 
        improvement: true, 
        originalPrompt: existingPanel.metadata.description,
        feedback 
      }
    };

    return this.generateComponent(request);
  }

  /**
   * Gets generation statistics and history.
   * 
   * @returns Generation statistics
   */
  getGenerationStats(): {
    totalAttempts: number;
    successfulGenerations: number;
    failedGenerations: number;
    averageGenerationTime: number;
    mostCommonErrors: string[];
  } {
    let totalAttempts = 0;
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [, history] of this.generationHistory) {
      totalAttempts += history.length;
      for (const attempt of history) {
        if (attempt.success) {
          successful++;
        } else {
          failed++;
          if (attempt.error) {
            errors.push(attempt.error);
          }
        }
      }
    }

    const errorCounts = errors.reduce((acc, error) => {
      acc[error] = (acc[error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error);

    return {
      totalAttempts,
      successfulGenerations: successful,
      failedGenerations: failed,
      averageGenerationTime: 0, // Would need to track timing
      mostCommonErrors
    };
  }

  /**
   * Lists available AI models.
   * 
   * @returns Promise resolving to array of model names
   */
  async getAvailableModels(): Promise<string[]> {
    return this.ollama.getAvailableModels();
  }

  /**
   * Sets the AI model to use for generation.
   * 
   * @param model - Model name
   */
  setModel(model: string): void {
    this.ollama.setModel(model);
  }

  /**
   * Generates a unique panel ID based on the prompt.
   */
  private generatePanelId(prompt: string): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(prompt);
    return `ai-panel-${hash}-${timestamp}`;
  }

  /**
   * Simple hash function for generating IDs.
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Extracts relevant tags from the prompt.
   */
  private extractTags(prompt: string): string[] {
    const tags: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // Component type tags
    const typeKeywords = {
      'form': ['form', 'input', 'submit', 'validation'],
      'chart': ['chart', 'graph', 'visualization', 'data', 'plot'],
      'table': ['table', 'grid', 'list', 'rows', 'columns'],
      'card': ['card', 'widget', 'panel', 'display'],
      'button': ['button', 'click', 'action'],
      'modal': ['modal', 'popup', 'dialog', 'overlay'],
      'navigation': ['nav', 'menu', 'navigation', 'links'],
      'dashboard': ['dashboard', 'metrics', 'overview', 'summary']
    };

    for (const [tag, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        tags.push(tag);
      }
    }

    // Add 'ai-generated' tag
    tags.push('ai-generated');

    return tags;
  }

  /**
   * Records a generation attempt for history tracking.
   */
  private recordGenerationAttempt(panelId: string, attempt: ComponentGenerationAttempt): void {
    if (!this.generationHistory.has(panelId)) {
      this.generationHistory.set(panelId, []);
    }
    
    const history = this.generationHistory.get(panelId)!;
    history.push(attempt);

    // Keep only last 10 attempts per panel
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }

  /**
   * Emits a generation event for other parts of the system.
   */
  private emitGenerationEvent(panelId: string, jsxCode: string, component: ComponentType): void {
    window.dispatchEvent(new CustomEvent('ai-component-generated', {
      detail: { panelId, jsxCode, component }
    }));
  }

  /**
   * Handles generation failures with fallback strategies.
   */
  private async handleGenerationFailure(
    request: ComponentGenerationRequest,
    panelId: string,
    error: Error
  ): Promise<any> {
    console.warn(`[AIComponentGenerator] Attempting fallback for ${panelId}`);

    // Fallback 1: Generate a simple error component
    const fallbackJSX = this.createFallbackComponent(request.prompt, error.message);
    
    try {
      const component = await panelRegistry.registerPanelFromJSX(
        panelId,
        fallbackJSX,
        {
          creator: 'ai',
          description: `Fallback for: ${request.prompt}`,
          tags: ['fallback', 'error'],
          error: error.message
        }
      );

      return {
        component,
        panelId,
        jsxCode: fallbackJSX,
        metadata: {
          isFallback: true,
          originalError: error.message,
          prompt: request.prompt
        }
      };
    } catch (fallbackError) {
      console.error('[AIComponentGenerator] Fallback generation also failed:', fallbackError);
      throw new Error(`Generation failed and fallback failed: ${error.message}`);
    }
  }

  /**
   * Creates a fallback component that displays the error.
   */
  private createFallbackComponent(prompt: string, errorMessage: string): string {
    return `
import React from 'react';

const FallbackComponent = () => {
  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Component Generation Failed
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p><strong>Request:</strong> ${prompt}</p>
            <p className="mt-1"><strong>Error:</strong> ${errorMessage}</p>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FallbackComponent;
    `;
  }
}


// Create and export default instance
const aiComponentGenerator = new AIComponentGenerator();

export default aiComponentGenerator;