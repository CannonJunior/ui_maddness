import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        // Allow runtime compilation alongside build-time
        babelrc: false,
        configFile: false,
      }
    })
  ],
  server: {
    hmr: {
      // Enhanced HMR for dynamic components
      overlay: false, // Disable overlay to prevent interference
      clientPort: 5173
    },
    port: 5173,
    open: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@core': path.resolve(__dirname, './src/core'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  define: {
    // Enable runtime compilation in development
    __RUNTIME_COMPILATION__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          babel: ['@babel/standalone']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@babel/standalone']
  }
});