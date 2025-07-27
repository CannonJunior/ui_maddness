import type { ComponentType } from 'react';
import type { PanelDefinition, ComponentCacheEntry, HMRUpdateData } from '../../types';
import { RuntimeJSXCompiler } from '../compiler/runtime-compiler';

/**
 * Enhanced Panel Registry with HMR support and memory management.
 * 
 * Manages dynamically generated components with automatic cleanup,
 * hot module replacement integration, and efficient caching.
 */
export class EnhancedPanelRegistry {
  private panels: Map<string, PanelDefinition> = new Map();
  private componentCache: Map<string, ComponentCacheEntry> = new Map();
  private hmrEnabled: boolean = window.__RUNTIME_COMPILATION__;
  private compiler: RuntimeJSXCompiler;
  private cleanup: any;

  constructor() {
    this.compiler = new RuntimeJSXCompiler();
    
    // Setup automatic cleanup for memory management
    this.cleanup = typeof (globalThis as any).FinalizationRegistry !== 'undefined' 
      ? new (globalThis as any).FinalizationRegistry((panelId: string) => {
          this.cleanupPanel(panelId);
        })
      : null;

    if (this.hmrEnabled) {
      this.setupHMRIntegration();
    }

    console.log('[PanelRegistry] Initialized with HMR:', this.hmrEnabled);
  }

  /**
   * Registers a new panel from JSX code with compilation and HMR setup.
   * 
   * @param id - Unique panel identifier
   * @param jsxCode - JSX source code for the component
   * @param metadata - Optional metadata for the panel
   * @returns Promise resolving to the compiled React component
   */
  async registerPanelFromJSX(
    id: string, 
    jsxCode: string, 
    metadata: Partial<PanelDefinition['metadata']> = {}
  ): Promise<ComponentType> {
    try {
      // Compile JSX in browser
      const compilationResult = await this.compiler.compileComponent(jsxCode, id);
      
      if (!compilationResult.success || !compilationResult.moduleUrl) {
        throw new Error(`Compilation failed: ${compilationResult.error?.message}`);
      }

      // Load component from compiled module
      const component = await this.loadComponent(compilationResult.moduleUrl);

      // Create panel definition
      const panelDefinition: PanelDefinition = {
        id,
        name: this.compiler.extractComponentName(jsxCode),
        jsxCode,
        compiledCode: compilationResult.code,
        component,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: 'ai',
          dependencies: this.compiler.extractDependencies(jsxCode),
          ...metadata
        }
      };

      // Register panel and cache component
      this.panels.set(id, panelDefinition);
      this.componentCache.set(id, {
        component,
        moduleUrl: compilationResult.moduleUrl,
        lastUpdated: Date.now(),
        compiledCode: compilationResult.code || ''
      });

      // Register for automatic cleanup
      if (this.cleanup) {
        this.cleanup.register(component, id);
      }

      // Enable HMR for this component
      if (this.hmrEnabled) {
        this.enableHMRForPanel(id);
      }

      console.log(`[PanelRegistry] Registered panel: ${id}`);
      return component;
    } catch (error) {
      console.error(`[PanelRegistry] Failed to register panel ${id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing panel with new JSX code (HMR update).
   * 
   * @param id - Panel identifier
   * @param jsxCode - New JSX source code
   * @returns Promise resolving to updated component
   */
  async updatePanel(id: string, jsxCode: string): Promise<ComponentType> {
    const existingPanel = this.panels.get(id);
    if (!existingPanel) {
      throw new Error(`Panel ${id} not found`);
    }

    // Cleanup old module URL
    const oldCache = this.componentCache.get(id);
    if (oldCache?.moduleUrl) {
      this.compiler.cleanupModuleUrl(oldCache.moduleUrl);
    }

    // Re-register with new code
    const component = await this.registerPanelFromJSX(id, jsxCode, {
      ...existingPanel.metadata,
      updatedAt: new Date()
    });

    // Trigger HMR update event
    this.emitHMRUpdate(id, jsxCode);

    return component;
  }

  /**
   * Retrieves a panel definition by ID.
   * 
   * @param id - Panel identifier
   * @returns Panel definition or undefined
   */
  getPanel(id: string): PanelDefinition | undefined {
    return this.panels.get(id);
  }

  /**
   * Retrieves a cached component by ID.
   * 
   * @param id - Panel identifier
   * @returns Cached component or undefined
   */
  getComponent(id: string): ComponentType | undefined {
    return this.componentCache.get(id)?.component;
  }

  /**
   * Lists all registered panel IDs.
   * 
   * @returns Array of panel IDs
   */
  listPanels(): string[] {
    return Array.from(this.panels.keys());
  }

  /**
   * Removes a panel and cleans up resources.
   * 
   * @param id - Panel identifier
   */
  removePanel(id: string): void {
    const cache = this.componentCache.get(id);
    if (cache?.moduleUrl) {
      this.compiler.cleanupModuleUrl(cache.moduleUrl);
    }

    this.panels.delete(id);
    this.componentCache.delete(id);

    console.log(`[PanelRegistry] Removed panel: ${id}`);
  }

  /**
   * Loads a React component from a module URL.
   * 
   * @param moduleUrl - Blob URL of the compiled module
   * @returns Promise resolving to the loaded component
   */
  private async loadComponent(moduleUrl: string): Promise<ComponentType> {
    try {
      // Dynamic import with cache busting
      const module = await import(`${moduleUrl}?t=${Date.now()}`);
      const Component = module.default;

      if (!Component) {
        throw new Error('Module does not export a default component');
      }

      if (typeof Component !== 'function') {
        throw new Error('Exported default is not a valid React component');
      }

      return Component;
    } catch (error) {
      console.error('[PanelRegistry] Failed to load component:', error);
      throw new Error(`Component loading failed: ${error}`);
    }
  }

  /**
   * Sets up HMR integration with event listeners.
   */
  private setupHMRIntegration(): void {
    // Listen for HMR updates from external sources
    window.addEventListener('ai-component-generated', this.handleAIComponentUpdate.bind(this));
    window.addEventListener('panel-hmr-update', this.handlePanelHMRUpdate.bind(this));

    console.log('[PanelRegistry] HMR integration enabled');
  }

  /**
   * Enables HMR for a specific panel.
   * 
   * @param panelId - Panel identifier
   */
  private enableHMRForPanel(panelId: string): void {
    // Integration with Vite's HMR API would go here
    // For now, we rely on custom events
    console.log(`[PanelRegistry] HMR enabled for panel: ${panelId}`);
  }

  /**
   * Handles AI-generated component updates.
   * 
   * @param event - Custom event with component data
   */
  private async handleAIComponentUpdate(event: CustomEvent): Promise<void> {
    const { panelId, jsxCode } = event.detail;
    try {
      await this.updatePanel(panelId, jsxCode);
    } catch (error) {
      console.error(`[PanelRegistry] AI component update failed for ${panelId}:`, error);
    }
  }

  /**
   * Handles panel HMR updates.
   * 
   * @param event - Custom event with HMR data
   */
  private handlePanelHMRUpdate(event: CustomEvent): void {
    const { panelId } = event.detail;
    console.log(`[PanelRegistry] HMR update for panel: ${panelId}`);
  }

  /**
   * Emits an HMR update event.
   * 
   * @param panelId - Panel identifier
   * @param jsxCode - Updated JSX code
   */
  private emitHMRUpdate(panelId: string, jsxCode: string): void {
    const updateData: HMRUpdateData = {
      panelId,
      jsxCode,
      timestamp: Date.now()
    };

    window.dispatchEvent(new CustomEvent('panel-hmr-update', {
      detail: updateData
    }));
  }

  /**
   * Cleans up resources for a panel.
   * 
   * @param panelId - Panel identifier
   */
  private cleanupPanel(panelId: string): void {
    const cache = this.componentCache.get(panelId);
    if (cache?.moduleUrl) {
      this.compiler.cleanupModuleUrl(cache.moduleUrl);
    }
  }

  /**
   * Gets registry statistics for monitoring.
   * 
   * @returns Registry statistics
   */
  getStats(): {
    totalPanels: number;
    cachedComponents: number;
    memoryUsage: number;
  } {
    let memoryUsage = 0;
    
    // Estimate memory usage (rough calculation)
    for (const [, cache] of this.componentCache) {
      memoryUsage += cache.compiledCode.length * 2; // Rough estimate in bytes
    }

    return {
      totalPanels: this.panels.size,
      cachedComponents: this.componentCache.size,
      memoryUsage
    };
  }
}

// Create and expose global registry instance
const globalRegistry = new EnhancedPanelRegistry();

// Expose to window for debugging and external access
if (window.__DEV__) {
  (window as any).panelRegistry = globalRegistry;
}

export default globalRegistry;