import { useState, useEffect, useCallback, useRef } from 'react';
import type { ComponentType } from 'react';
import hmrManager from '../core/hmr/hmr-manager';
import panelRegistry from '../core/registry/panel-registry';

/**
 * Custom hook for HMR-enabled dynamic panels
 * 
 * Provides state management and automatic updates for dynamically loaded components
 * with Hot Module Replacement support.
 */
export function useDynamicPanel(panelId: string) {
  const [component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  const mountedRef = useRef(true);
  const panelIdRef = useRef(panelId);

  // Update panel ID ref when it changes
  useEffect(() => {
    panelIdRef.current = panelId;
  }, [panelId]);

  // Load initial component
  useEffect(() => {
    const loadComponent = async () => {
      if (!panelId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if component is already cached
        const cached = hmrManager.getComponent(panelId);
        if (cached) {
          if (mountedRef.current) {
            setComponent(() => cached.component);
            setLastUpdated(cached.lastUpdated);
          }
        } else {
          // Try to get from panel registry
          const registryComponent = panelRegistry.getComponent(panelId);
          if (registryComponent && mountedRef.current) {
            setComponent(() => registryComponent);
            setLastUpdated(Date.now());
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadComponent();
  }, [panelId]);

  // Set up HMR listeners
  useEffect(() => {
    const handleHMRUpdate = (event: CustomEvent) => {
      const { panelId: updatedPanelId } = event.detail;
      
      if (updatedPanelId === panelIdRef.current && mountedRef.current) {
        // Force re-render when HMR update occurs
        const cached = hmrManager.getComponent(updatedPanelId);
        if (cached) {
          setComponent(() => cached.component);
          setLastUpdated(cached.lastUpdated);
          setError(null);
        }
      }
    };

    const handleHMRError = (event: CustomEvent) => {
      const { panelId: errorPanelId, error: errorMessage } = event.detail;
      
      if (errorPanelId === panelIdRef.current && mountedRef.current) {
        setError(new Error(`HMR Error: ${errorMessage}`));
      }
    };

    window.addEventListener('panel-hmr-update', handleHMRUpdate);
    window.addEventListener('panel-hmr-error', handleHMRError);

    return () => {
      window.removeEventListener('panel-hmr-update', handleHMRUpdate);
      window.removeEventListener('panel-hmr-error', handleHMRError);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!panelIdRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const cached = hmrManager.getComponent(panelIdRef.current);
      if (cached && mountedRef.current) {
        setComponent(() => cached.component);
        setLastUpdated(cached.lastUpdated);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Refresh failed'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Update component with new JSX code
  const updateWithJSX = useCallback(async (jsxCode: string) => {
    if (!panelIdRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      await hmrManager.updateComponent(panelIdRef.current, jsxCode);
      
      // Component will be updated via HMR event listener
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Update failed'));
        setIsLoading(false);
      }
    }
  }, []);

  return {
    component,
    error,
    isLoading,
    lastUpdated,
    refresh,
    updateWithJSX,
    isHMREnabled: hmrManager.hasComponent(panelId)
  };
}

/**
 * Hook for managing multiple dynamic panels
 */
export function useDynamicPanels() {
  const [panels, setPanels] = useState<Array<{ id: string; component: ComponentType }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for new panel creation
  useEffect(() => {
    const handleCreatePanel = (event: CustomEvent) => {
      const { panelId, component } = event.detail;
      
      setPanels(prev => {
        // Remove existing panel with same ID, then add new one
        const filtered = prev.filter(p => p.id !== panelId);
        return [...filtered, { id: panelId, component }];
      });
    };

    const handleRemovePanel = (event: CustomEvent) => {
      const { panelId } = event.detail;
      
      setPanels(prev => prev.filter(p => p.id !== panelId));
    };

    window.addEventListener('create-panel', handleCreatePanel);
    window.addEventListener('remove-panel', handleRemovePanel);

    return () => {
      window.removeEventListener('create-panel', handleCreatePanel);
      window.removeEventListener('remove-panel', handleRemovePanel);
    };
  }, []);

  const createPanel = useCallback(async (jsxCode: string, panelId?: string) => {
    const id = panelId || `panel-${Date.now()}`;
    
    try {
      setIsLoading(true);
      
      const component = await panelRegistry.registerPanelFromJSX(id, jsxCode);
      
      // Emit creation event
      window.dispatchEvent(new CustomEvent('create-panel', {
        detail: { panelId: id, component }
      }));
      
      return id;
    } catch (error) {
      console.error('Failed to create panel:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removePanel = useCallback((panelId: string) => {
    // Clean up from registry and HMR manager
    panelRegistry.removePanel(panelId);
    hmrManager.removeComponent(panelId);
    
    // Emit removal event
    window.dispatchEvent(new CustomEvent('remove-panel', {
      detail: { panelId }
    }));
  }, []);

  const clearAllPanels = useCallback(() => {
    // Clean up all panels
    panels.forEach(panel => {
      panelRegistry.removePanel(panel.id);
      hmrManager.removeComponent(panel.id);
    });
    
    setPanels([]);
  }, [panels]);

  return {
    panels,
    isLoading,
    createPanel,
    removePanel,
    clearAllPanels,
    panelCount: panels.length
  };
}

export default useDynamicPanel;