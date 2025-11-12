import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeBase = (basePath) => {
  if (!basePath) {
    return '/stock-hedge-simulator/';
  }
  return basePath.endsWith('/') ? basePath : `${basePath}/`;
};

export default defineConfig({
  plugins: [react()],
  base: normalizeBase(process.env.PUBLIC_BASE_PATH),
});
