// Type declarations for @babel/standalone

declare module '@babel/standalone' {
  interface TransformOptions {
    presets?: (string | [string, any])[];
    plugins?: (string | [string, any])[];
    sourceMaps?: boolean;
    code?: boolean;
  }

  interface TransformResult {
    code?: string;
    map?: any;
  }

  export function transform(code: string, options?: TransformOptions): TransformResult;
}

declare global {
  interface Window {
    Babel: {
      transform: (code: string, options?: import('@babel/standalone').TransformOptions) => import('@babel/standalone').TransformResult;
    };
  }
}

export {};