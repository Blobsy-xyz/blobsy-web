/// <reference types="vite/client" />
/// <reference types="react-scripts" />

interface ImportMetaEnv {
    readonly VITE_WS_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_WS_URL: string;
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
  }
} 