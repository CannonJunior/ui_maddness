import type { ComponentType } from 'react';
import type { ComponentCacheEntry, HMRUpdateData } from '../../types';
import { RuntimeJSXCompiler } from '../compiler/runtime-compiler';

/**
 * Enhanced HMR Manager for dynamic components
 * 
 * Manages hot module replacement for dynamically generated React components,
 * providing seamless updates without page refresh while preserving component state.
 */
export class DynamicHMRManager {
  private viteHMR: any;
  private componentCache: Map<string, ComponentCacheEntry> = new Map();
  private updateQueue: Set<string> = new Set();
  private compiler: RuntimeJSXCompiler;
  private isConnected: boolean = false;

  constructor() {
    this.compiler = new RuntimeJSXCompiler();
    
    // Initialize Vite HMR integration if available
    if (import.meta.hot) {
      this.viteHMR = import.meta.hot;
      this.setupHMRListeners();
      this.isConnected = true;
    }

    // Setup custom event listeners
    this.setupCustomEventListeners();
    
    console.log('[DynamicHMRManager] Initialized with Vite HMR:', this.isConnected);
  }

  /**
   * Updates a component with new JSX code using HMR.
   * 
   * @param panelId - Unique identifier for the panel/component
   * @param newJSXCode - Updated JSX source code
   * @returns Promise resolving when update is complete
   */
  async updateComponent(panelId: string, newJSXCode: string): Promise<void> {
    try {
      // Prevent duplicate updates
      if (this.updateQueue.has(panelId)) {
        console.log(`[HMR] Update already queued for panel: ${panelId}`);
        return;
      }

      this.updateQueue.add(panelId);

      // Compile new component version
      const compilationResult = await this.compiler.compileComponent(newJSXCode, panelId);
      
      if (!compilationResult.success || !compilationResult.moduleUrl) {
        throw new Error(`Compilation failed: ${compilationResult.error?.message}`);
      }

      // Cleanup old module URL to prevent memory leaks
      const oldCache = this.componentCache.get(panelId);
      if (oldCache?.moduleUrl) {
        this.compiler.cleanupModuleUrl(oldCache.moduleUrl);
      }

      // Load new component
      const newComponent = await this.loadComponentFromUrl(compilationResult.moduleUrl);
      
      // Update cache
      this.componentCache.set(panelId, {
        component: newComponent,
        moduleUrl: compilationResult.moduleUrl,
        lastUpdated: Date.now(),
        compiledCode: compilationResult.code || ''
      });
      
      // Trigger React re-render via HMR
      this.triggerHotUpdate(panelId);
      
      console.log(`🔥 Hot updated panel: ${panelId}`);
    } catch (error) {
      console.error(`[HMR] Failed to hot update panel ${panelId}:`, error);
      // Fallback to full reload if HMR fails
      this.handleUpdateFailure(panelId, error as Error);
    } finally {
      this.updateQueue.delete(panelId);
    }
  }

  /**
   * Retrieves a cached component by panel ID.
   * 
   * @param panelId - Panel identifier
   * @returns Cached component entry or undefined
   */
  getComponent(panelId: string): ComponentCacheEntry | undefined {
    return this.componentCache.get(panelId);
  }

  /**
   * Checks if a panel has cached component data.
   * 
   * @param panelId - Panel identifier
   * @returns true if panel is cached, false otherwise
   */
  hasComponent(panelId: string): boolean {
    return this.componentCache.has(panelId);
  }

  /**
   * Removes a component from the cache and cleans up resources.
   * 
   * @param panelId - Panel identifier
   */
  removeComponent(panelId: string): void {
    const cache = this.componentCache.get(panelId);
    if (cache?.moduleUrl) {
      this.compiler.cleanupModuleUrl(cache.moduleUrl);
    }
    
    this.componentCache.delete(panelId);
    console.log(`[HMR] Removed component: ${panelId}`);
  }

  /**
   * Gets HMR system statistics.
   * 
   * @returns Object containing cache statistics
   */
  getStats(): {
    cachedComponents: number;
    pendingUpdates: number;
    totalUpdates: number;
    isConnected: boolean;
  } {
    return {
      cachedComponents: this.componentCache.size,
      pendingUpdates: this.updateQueue.size,
      totalUpdates: this.getTotalUpdates(),
      isConnected: this.isConnected
    };
  }

  /**
   * Loads a React component from a module URL.
   * 
   * @param moduleUrl - Blob URL of the compiled module
   * @returns Promise resolving to the loaded component
   */
  private async loadComponentFromUrl(moduleUrl: string): Promise<ComponentType> {
    try {
      // Dynamic import with cache busting timestamp
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
      console.error('[HMR] Failed to load component from URL:', error);
      throw new Error(`Component loading failed: ${error}`);
    }
  }

  /**
   * Triggers a hot update by emitting custom events.
   * 
   * @param panelId - Panel identifier
   */
  private triggerHotUpdate(panelId: string): void {
    // Notify all instances of this panel to re-render
    const updateData: HMRUpdateData = {
      panelId,
      jsxCode: '', // Not needed for the update event
      timestamp: Date.now()
    };

    window.dispatchEvent(new CustomEvent('panel-hmr-update', {
      detail: updateData
    }));

    // If Vite HMR is available, use it too
    if (this.viteHMR) {
      this.viteHMR.invalidate();
    }
  }

  /**
   * Sets up Vite HMR integration listeners.
   */
  private setupHMRListeners(): void {
    if (!this.viteHMR) return;

    // Accept all updates for this module
    this.viteHMR.accept(() => {
      console.log('[HMR] Vite HMR update accepted');
    });

    // Handle disposal
    this.viteHMR.dispose(() => {
      console.log('[HMR] Cleaning up HMR resources');
      this.cleanup();
    });

    console.log('[HMR] Vite HMR listeners setup complete');
  }

  /**
   * Sets up custom event listeners for AI-generated components.
   */
  private setupCustomEventListeners(): void {
    // Listen for changes from AI generation
    window.addEventListener('ai-component-generated', this.handleAIComponentGenerated.bind(this));
    
    // Listen for manual component updates
    window.addEventListener('manual-component-update', this.handleManualComponentUpdate.bind(this));

    console.log('[HMR] Custom event listeners setup complete');
  }

  /**
   * Handles AI-generated component events.
   * 
   * @param event - Custom event with AI generation data
   */
  private async handleAIComponentGenerated(event: CustomEvent): Promise<void> {
    const { panelId, jsxCode } = event.detail;
    
    if (!panelId || !jsxCode) {
      console.warn('[HMR] Invalid AI component generation event data');
      return;
    }

    try {
      await this.updateComponent(panelId, jsxCode);
    } catch (error) {
      console.error(`[HMR] Failed to handle AI component generation for ${panelId}:`, error);
    }
  }

  /**
   * Handles manual component update events.
   * 
   * @param event - Custom event with manual update data
   */
  private async handleManualComponentUpdate(event: CustomEvent): Promise<void> {
    const { panelId, jsxCode } = event.detail;
    
    if (!panelId || !jsxCode) {
      console.warn('[HMR] Invalid manual component update event data');
      return;
    }

    try {
      await this.updateComponent(panelId, jsxCode);
    } catch (error) {
      console.error(`[HMR] Failed to handle manual component update for ${panelId}:`, error);
    }
  }

  /**
   * Handles update failures with fallback strategies.
   * 
   * @param panelId - Panel identifier
   * @param error - Error that occurred during update
   */
  private handleUpdateFailure(panelId: string, error: Error): void {
    console.error(`[HMR] Update failed for panel ${panelId}:`, error);

    // Emit error event for UI to handle
    window.dispatchEvent(new CustomEvent('panel-hmr-error', {
      detail: { panelId, error: error.message }
    }));

    // In development, we might want to show an error overlay
    if (window.__DEV__) {
      this.showErrorOverlay(panelId, error);
    }
  }

  /**
   * Shows an error overlay for development debugging.
   * 
   * @param panelId - Panel identifier
   * @param error - Error that occurred
   */
  private showErrorOverlay(panelId: string, error: Error): void {
    console.group(`🚨 HMR Error - Panel: ${panelId}`);
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.groupEnd();

    // Could implement visual error overlay here
  }

  /**
   * Gets total number of updates performed.
   * 
   * @returns Total update count
   */
  private getTotalUpdates(): number {
    // This would be tracked in a more sophisticated implementation
    return Array.from(this.componentCache.values())
      .reduce((total, cache) => total + (cache.lastUpdated ? 1 : 0), 0);
  }

  /**
   * Cleans up resources and event listeners.
   */
  private cleanup(): void {
    // Clean up all cached module URLs
    for (const [, cache] of this.componentCache) {
      if (cache.moduleUrl) {
        this.compiler.cleanupModuleUrl(cache.moduleUrl);
      }
    }

    this.componentCache.clear();
    this.updateQueue.clear();

    // Remove event listeners
    window.removeEventListener('ai-component-generated', this.handleAIComponentGenerated.bind(this));
    window.removeEventListener('manual-component-update', this.handleManualComponentUpdate.bind(this));

    console.log('[HMR] Cleanup complete');
  }
}

// Create and expose global HMR manager instance
const globalHMRManager = new DynamicHMRManager();

// Expose to window for debugging and external access
if (window.__DEV__) {
  window.dynamicHMRManager = globalHMRManager;
}

declare global {
  interface Window {
    dynamicHMRManager: DynamicHMRManager;
  }
}

export default globalHMRManager;